import os
import logging
import subprocess
import json as json_lib
from urllib.parse import urlencode
from .models import G4A4MarkupRule

logger = logging.getLogger(__name__)

BASE_URL = "https://g4a4.com/wp-json/reseller/v1"
DEFAULT_MARKUP_PERCENT = 20.0

DEFAULT_API_KEY = "e325d0540e4c85a35de290788e07a055d41e434e027bf220"

def get_api_key():
    return os.environ.get("G4A4_API_KEY", DEFAULT_API_KEY).strip()

def _get_headers():
    return {
        "api-key": get_api_key(),
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json",
        "Content-Type": "application/json"
    }

def _request_node(method, url, headers, params=None, json_body=None):
    if params:
        url = f"{url}?{urlencode(params)}"
    
    payload_str = json_lib.dumps(json_body) if json_body else ""
    headers_json = json_lib.dumps(headers)
    
    node_script = f"""
const https = require('https');
const urlObj = new URL({json_lib.dumps(url)});
const headers = {headers_json};
const bodyStr = {json_lib.dumps(payload_str)};

if (bodyStr) {{
    headers['Content-Length'] = Buffer.byteLength(bodyStr);
}}

const options = {{
    hostname: urlObj.hostname,
    port: urlObj.port || 443,
    path: urlObj.pathname + urlObj.search,
    method: {json_lib.dumps(method.upper())},
    headers: headers
}};

const req = https.request(options, res => {{
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {{
        console.log(JSON.stringify({{ status: res.statusCode, body: data }}));
    }});
}});

req.on('error', err => {{
    console.log(JSON.stringify({{ status: 500, error: err.message }}));
}});

if (bodyStr) req.write(bodyStr);
req.end();
"""
    try:
        proc = subprocess.run(["node", "-e", node_script], capture_output=True, text=True, timeout=15)
        if proc.returncode == 0 and proc.stdout.strip():
            out = json_lib.loads(proc.stdout.strip())
            status = out.get("status", 500)
            body_text = out.get("body", "")
            try:
                body_json = json_lib.loads(body_text)
            except Exception:
                body_json = None
            return status, body_json, body_text
    except Exception as e:
        logger.error(f"Node HTTP request exception: {e}")
    return 500, None, ""

def _request(method, path, params=None, json=None, timeout=15):
    url = f"{BASE_URL.rstrip('/')}/{path.lstrip('/')}"
    headers = _get_headers()
    
    if not headers["api-key"]:
        logger.warning("G4A4_API_KEY is not set in environment!")

    for attempt in range(3):
        logger.info(f"G4A4 API Request: {method} {url} (attempt {attempt+1})")
        status, body_json, body_text = _request_node(method, url, headers, params=params, json_body=json)
        
        if status == 200 and body_json:
            return body_json
            
        if status == 401:
            logger.error("G4A4 API unauthorized: API key may be invalid.")
            return body_json
        elif status == 403:
            logger.error(f"G4A4 API forbidden: {body_text}")
            return body_json
        elif status >= 400:
            logger.error(f"G4A4 API error {status}: {body_text}")
            return body_json
            
    return None

def _g4a4_to_toman(price_raw):
    """
    Convert price from G4A4 currency to Toman.
    G4A4 returns prices in IRT (Toman) or IRR. Let's ensure it maps cleanly.
    Assuming G4A4 outputs Tomans directly (e.g. 55000 IRT).
    """
    try:
        val = int(float(price_raw))
        return val
    except (ValueError, TypeError):
        return 0

def calculate_sell_price(cost_toman, category_name=""):
    """
    Calculate retail price based on cost price and category markup.
    sell_toman = round_1000(cost_toman * (1 + markup))
    """
    # The customer price is cost plus a 20% margin unless a category-specific
    # rule is configured.  Prices supplied by G4A4 are already final reseller
    # prices (per their API documentation), so no supplier discount is applied
    # a second time here.
    markup_percent = DEFAULT_MARKUP_PERCENT
    
    if category_name:
        try:
            rule = G4A4MarkupRule.objects.get(category_name=category_name)
            markup_percent = rule.markup_percent
        except G4A4MarkupRule.DoesNotExist:
            pass
            
    raw_sell = round(cost_toman * (1 + (markup_percent / 100.0)), 2)
    # Round to nearest 1,000 Tomans
    return int(round(raw_sell / 1000.0) * 1000)

# Public API Methods
def _process_variation(var):
    if not var or not isinstance(var, dict):
        return var
    
    # Process required_fields from fields
    fields = var.get("fields") or []
    req_fields = []
    if isinstance(fields, list):
        for f in fields:
            if isinstance(f, dict) and "data_name" in f:
                req_fields.append(f["data_name"])
    var["required_fields"] = req_fields
    
    # Process attributes from list to dict & extract region
    attrs = var.get("attributes") or []
    attr_dict = {}
    region_label = ""
    if isinstance(attrs, list):
        for attr in attrs:
            if isinstance(attr, dict) and "key" in attr:
                key = attr["key"]
                val = attr.get("value")
                attr_dict[key] = val
                if key == "pa_region":
                    region_label = attr.get("label") or val or ""
    var["attributes"] = attr_dict
    var["region"] = region_label
    return var

def get_categories():
    """GET /product/get-categories"""
    data = _request("GET", "/product/get-categories")
    if data and "data" in data and "categories" in data["data"]:
        return data["data"]["categories"]
    return []

def get_products(category_id=None, term=None):
    """GET /product/get-products"""
    params = {}
    if category_id:
        params["category_id"] = category_id
    if term:
        params["term"] = term
    data = _request("GET", "/product/get-products", params=params)
    if data and "data" in data and "products" in data["data"]:
        return data["data"]["products"]
    return []

def get_product(product_id):
    """GET /product/get-product?product_id=X"""
    params = {"product_id": product_id}
    data = _request("GET", "/product/get-product", params=params)
    if data and "data" in data and "product" in data["data"]:
        product = data["data"]["product"]
        if "variations" in product and isinstance(product["variations"], list):
            product["variations"] = [_process_variation(v) for v in product["variations"]]
        return product
    return None

def get_variation(variation_id):
    """GET /product/get-variation?variation_id=X"""
    params = {"variation_id": variation_id}
    data = _request("GET", "/product/get-variation", params=params)
    if data and "data" in data and "variation" in data["data"]:
        return _process_variation(data["data"]["variation"])
    return None

def get_regions():
    """GET /product/get-regions"""
    data = _request("GET", "/product/get-regions")
    if data and "data" in data and "regions" in data["data"]:
        return data["data"]["regions"]
    return []

def add_order(client_reference, variation_id, quantity=1, customer=None, data=None, test_mode=False):
    """
    POST /order/add-order
    Request body: {
        client_reference,
        variation_id,
        quantity,
        customer: { first_name, last_name, email, phone },
        data: { game_username, game_password, etc. },
        test_mode
    }
    """
    payload = {
        "variation_id": int(variation_id),
        "quantity": int(quantity),
        "test_mode": bool(test_mode)
    }
    if client_reference:
        payload["client_reference"] = client_reference
    if customer:
        payload["customer"] = customer
    if data:
        payload["data"] = data
        
    res = _request("POST", "/order/add-order", json=payload)
    if res and "data" in res:
        return res["data"]
    return res

def get_order(order_id):
    """GET /order/get-order?order_id=X"""
    params = {"order_id": order_id}
    data = _request("GET", "/order/get-order", params=params)
    if data and "data" in data and "order" in data["data"]:
        return data["data"]["order"]
    return None

def get_balance():
    """GET /get-balance"""
    res = _request("GET", "/get-balance")
    if res and "data" in res and "balance" in res["data"]:
        return _g4a4_to_toman(res["data"]["balance"])
    return None
