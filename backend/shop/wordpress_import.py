"""Streaming reader and normalizers for phpMyAdmin WordPress SQL dumps."""

from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime
from html import unescape
from html.parser import HTMLParser
from pathlib import Path
import re
from urllib.parse import unquote, urlsplit


SELECTED_TABLES = {
    "wp_users",
    "wp_usermeta",
    "wp_posts",
    "wp_postmeta",
    "wp_terms",
    "wp_term_taxonomy",
    "wp_term_relationships",
    "wp_comments",
    "wp_commentmeta",
}

USER_META_KEYS = {
    "first_name", "last_name", "billing_first_name", "billing_last_name",
    "billing_phone", "digits_phone", "digits_phone_no", "_current_woo_wallet_balance",
}

PRODUCT_META_KEYS = {
    "_price", "_regular_price", "_sale_price", "_stock_status", "_thumbnail_id",
    "_sku", "_product_image_gallery", "_virtual", "_downloadable",
}

FIELD_DEFINITION_META_KEYS = {
    "key", "label", "required", "conditions", "options", "placeholder", "description",
}


def _unescape_sql(value: str) -> str:
    output = []
    idx = 0
    escapes = {"0": "\0", "n": "\n", "r": "\r", "t": "\t", "b": "\b", "Z": "\x1a"}
    while idx < len(value):
        char = value[idx]
        if char == "\\" and idx + 1 < len(value):
            idx += 1
            output.append(escapes.get(value[idx], value[idx]))
        else:
            output.append(char)
        idx += 1
    return "".join(output)


def _parse_values(values_sql: str):
    """Parse a MySQL VALUES body without evaluating SQL or loading the full dump."""
    idx = 0
    length = len(values_sql)
    while idx < length:
        while idx < length and values_sql[idx] in " \t\r\n,;":
            idx += 1
        if idx >= length or values_sql[idx] != "(":
            break
        idx += 1
        row = []
        while idx < length:
            while idx < length and values_sql[idx].isspace():
                idx += 1
            if idx < length and values_sql[idx] == "'":
                idx += 1
                chars = []
                while idx < length:
                    char = values_sql[idx]
                    if char == "\\" and idx + 1 < length:
                        chars.extend((char, values_sql[idx + 1]))
                        idx += 2
                        continue
                    if char == "'":
                        idx += 1
                        break
                    chars.append(char)
                    idx += 1
                value = _unescape_sql("".join(chars))
            else:
                start = idx
                while idx < length and values_sql[idx] not in ",)":
                    idx += 1
                raw = values_sql[start:idx].strip()
                value = None if raw.upper() == "NULL" else raw
            row.append(value)
            while idx < length and values_sql[idx].isspace():
                idx += 1
            if idx < length and values_sql[idx] == ",":
                idx += 1
                continue
            if idx < length and values_sql[idx] == ")":
                idx += 1
                break
        yield row


def iter_sql_rows(sql_path, selected_tables=SELECTED_TABLES):
    insert_re = re.compile(r"^INSERT INTO `([^`]+)` \((.+)\) VALUES$")
    with Path(sql_path).open("r", encoding="utf-8", errors="replace") as handle:
        iterator = iter(handle)
        for line in iterator:
            if not line.startswith("INSERT INTO `"):
                continue
            header = line.rstrip("\r\n")
            match = insert_re.match(header)
            if not match:
                continue
            table = match.group(1)
            columns = [part.strip().strip("`") for part in match.group(2).split(",")]
            if table not in selected_tables:
                for skipped in iterator:
                    if skipped.rstrip().endswith(";"):
                        break
                continue
            chunks = []
            for values_line in iterator:
                chunks.append(values_line)
                if values_line.rstrip().endswith(";"):
                    break
            for values in _parse_values("".join(chunks)):
                if len(values) == len(columns):
                    yield table, dict(zip(columns, values))


class _TextExtractor(HTMLParser):
    BLOCK_TAGS = {"p", "div", "li", "br", "h1", "h2", "h3", "h4", "h5", "tr"}

    def __init__(self):
        super().__init__()
        self.parts = []

    def handle_starttag(self, tag, attrs):
        if tag in self.BLOCK_TAGS:
            self.parts.append("\n")
        if tag == "li":
            self.parts.append("• ")

    def handle_endtag(self, tag):
        if tag in self.BLOCK_TAGS:
            self.parts.append("\n")

    def handle_data(self, data):
        self.parts.append(data)


def html_to_text(value):
    parser = _TextExtractor()
    parser.feed(value or "")
    text = unescape("".join(parser.parts)).replace("\xa0", " ")
    lines = [re.sub(r"\s+", " ", line).strip() for line in text.splitlines()]
    return "\n".join(line for line in lines if line)


def to_int(value, default=0):
    try:
        return int(float(str(value or "").replace(",", "")))
    except (TypeError, ValueError):
        return default


def parse_datetime(value):
    try:
        if not value or str(value).startswith("0000-"):
            return None
        return datetime.strptime(value, "%Y-%m-%d %H:%M:%S")
    except (TypeError, ValueError):
        return None


def clean_phone(value):
    digits = re.sub(r"\D", "", value or "")
    if digits.startswith("98") and len(digits) == 12:
        digits = "0" + digits[2:]
    if len(digits) == 10 and digits.startswith("9"):
        digits = "0" + digits
    return digits[:15]


def custom_fields_from_meta(meta):
    keys = " ".join(meta).lower()
    fields = []
    if "_wccf_pf_email" in keys:
        fields.append({"key": "account_email", "label": "ایمیل اکانت", "type": "email", "required": True, "placeholder": "example@gmail.com"})
    if "_wccf_pf_password" in keys:
        fields.append({"key": "account_password", "label": "رمز اکانت", "type": "password", "required": True, "placeholder": "••••••••"})
    if "_wccf_pf_type" in keys:
        fields.append({"key": "account_type", "label": "نوع اکانت", "type": "select", "required": True, "placeholder": "انتخاب کنید", "options": ["Epic Games", "PSN", "XBOX", "Nintendo"]})
    if "_wccf_pf_idepic" in keys or "_wccf_pf_epic" in keys:
        fields.append({"key": "epic_id", "label": "آیدی Epic Games", "type": "text", "required": True, "placeholder": "Epic Games ID"})
    return fields


def category_code(name, slug):
    value = f"{name} {slug}".lower()
    if any(token in value for token in ("fortnite", "فورتنایت", "وی باکس", "وی‌باکس", "کروپک")):
        return "FORTNITE"
    if any(token in value for token in ("chatgpt", "gemini", "هوش مصنوعی", "ai")):
        return "AI"
    if any(token in value for token in ("gift", "گیفت", "psn", "steam", "xbox")):
        return "GIFTCARDS"
    if any(token in value for token in ("subscription", "اشتراک", "spotify", "telegram")):
        return "SUBSCRIPTIONS"
    return "GAMES"


def durable_image_url(value):
    """Route legacy wp-content images through WordPress.com's cached CDN.

    The former domains now redirect to the new Next.js application, but the
    Jetpack CDN still retains the original attachment binaries.
    """
    value = (value or "").strip()
    try:
        parsed = urlsplit(value)
    except ValueError:
        return value
    host = (parsed.hostname or "").lower()
    if "/wp-content/uploads/" in parsed.path and host in {
        "gameorbital.com", "www.gameorbital.com", "jinxfamily.shop",
        "www.jinxfamily.shop", "jinxfamily.ir", "www.jinxfamily.ir",
    }:
        return f"https://i0.wp.com/{host.removeprefix('www.')}{parsed.path}"
    return value


@dataclass
class WordPressSnapshot:
    users: dict = field(default_factory=dict)
    usermeta: dict = field(default_factory=lambda: defaultdict(dict))
    posts: dict = field(default_factory=dict)
    postmeta: dict = field(default_factory=lambda: defaultdict(dict))
    terms: dict = field(default_factory=dict)
    taxonomies: dict = field(default_factory=dict)
    relationships: dict = field(default_factory=lambda: defaultdict(list))
    comments: dict = field(default_factory=dict)
    commentmeta: dict = field(default_factory=lambda: defaultdict(dict))

    @classmethod
    def load(cls, sql_path):
        snapshot = cls()
        for table, row in iter_sql_rows(sql_path):
            if table == "wp_users":
                snapshot.users[to_int(row["ID"])] = row
            elif table == "wp_usermeta":
                key = row.get("meta_key") or ""
                if key in USER_META_KEYS:
                    snapshot.usermeta[to_int(row["user_id"])][key] = row.get("meta_value") or ""
            elif table == "wp_posts":
                snapshot.posts[to_int(row["ID"])] = row
            elif table == "wp_postmeta":
                key = row.get("meta_key") or ""
                if key in PRODUCT_META_KEYS or key in FIELD_DEFINITION_META_KEYS or key.startswith("attribute_") or key.startswith("_wccf_pf_"):
                    snapshot.postmeta[to_int(row["post_id"])][key] = row.get("meta_value") or ""
            elif table == "wp_terms":
                snapshot.terms[to_int(row["term_id"])] = row
            elif table == "wp_term_taxonomy":
                snapshot.taxonomies[to_int(row["term_taxonomy_id"])] = row
            elif table == "wp_term_relationships":
                snapshot.relationships[to_int(row["object_id"])].append(to_int(row["term_taxonomy_id"]))
            elif table == "wp_comments":
                snapshot.comments[to_int(row["comment_ID"])] = row
            elif table == "wp_commentmeta":
                key = row.get("meta_key") or ""
                if key in {"rating", "verified"}:
                    snapshot.commentmeta[to_int(row["comment_id"])][key] = row.get("meta_value") or ""
        return snapshot

    @property
    def products(self):
        return {
            post_id: post for post_id, post in self.posts.items()
            if post.get("post_type") == "product" and post.get("post_status") not in {"trash", "auto-draft"}
        }

    @property
    def variations(self):
        return {
            post_id: post for post_id, post in self.posts.items()
            if post.get("post_type") == "product_variation" and post.get("post_status") not in {"trash", "auto-draft"}
        }

    def product_category(self, post_id):
        for taxonomy_id in self.relationships.get(post_id, []):
            taxonomy = self.taxonomies.get(taxonomy_id) or {}
            if taxonomy.get("taxonomy") != "product_cat":
                continue
            term = self.terms.get(to_int(taxonomy.get("term_id"))) or {}
            return term.get("name") or "", term.get("slug") or ""
        return "", ""

    def product_category_term_ids(self, post_id):
        term_ids = set()
        for taxonomy_id in self.relationships.get(post_id, []):
            taxonomy = self.taxonomies.get(taxonomy_id) or {}
            if taxonomy.get("taxonomy") == "product_cat":
                term_ids.add(to_int(taxonomy.get("term_id")))
        return term_ids

    def _field_input_type(self, field_post_id, key):
        for taxonomy_id in self.relationships.get(field_post_id, []):
            taxonomy = self.taxonomies.get(taxonomy_id) or {}
            if taxonomy.get("taxonomy") != "wccf_product_field_field_type":
                continue
            term = self.terms.get(to_int(taxonomy.get("term_id"))) or {}
            value = (term.get("slug") or term.get("name") or "").lower()
            if "password" in value:
                return "password"
            if "select" in value or "dropdown" in value:
                return "select"
            if "email" in value:
                return "email"
        if "password" in key.lower():
            return "password"
        if "email" in key.lower():
            return "email"
        if key.lower() in {"type", "account_type"}:
            return "select"
        return "text"

    def custom_fields_for_product(self, post_id):
        product_terms = self.product_category_term_ids(post_id)
        fields = []
        for field_id, post in self.posts.items():
            if post.get("post_type") != "wccf_product_field" or post.get("post_status") != "publish":
                continue
            meta = self.postmeta.get(field_id, {})
            conditions = meta.get("conditions") or ""
            condition_ids = {to_int(value) for value in re.findall(r's:\d+:"(\d+)"', conditions)}
            # WCCF definitions in this dump target WooCommerce category IDs.
            # Do not apply a conditional field unless this product is in one
            # of those categories. Empty conditions mean global field.
            if conditions and condition_ids and not (product_terms & condition_ids):
                continue
            key = (meta.get("key") or f"field_{field_id}").strip()
            input_type = self._field_input_type(field_id, key)
            options = re.findall(r's:5:"label";s:\d+:"([^"]*)"', meta.get("options") or "")
            item = {
                "key": key[:80],
                "label": (meta.get("label") or key)[:160],
                "type": input_type,
                "required": meta.get("required") == "1",
                "placeholder": (meta.get("placeholder") or "")[:200],
            }
            if input_type == "select":
                item["options"] = options
            fields.append(item)
        return fields

    def product_image(self, post_id):
        thumbnail_id = to_int(self.postmeta.get(post_id, {}).get("_thumbnail_id"))
        attachment = self.posts.get(thumbnail_id) or {}
        return attachment.get("guid") or ""

    def stable_slug(self, post):
        slug = unquote(post.get("post_name") or "").strip(" /")
        return slug[:220] or f"wordpress-product-{post.get('ID')}"
