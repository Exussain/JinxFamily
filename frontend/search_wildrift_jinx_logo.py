import os
import sys
import json
import urllib.parse
import requests
from bs4 import BeautifulSoup
from PIL import Image, ImageEnhance, ImageFilter, ImageStat
import io

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
}

def search_bing_images(query, limit=20):
    url = f"https://www.bing.com/images/search?q={urllib.parse.quote_plus(query)}&form=HDRSC2&first=1"
    img_urls = []
    try:
        r = requests.get(url, headers=HEADERS, timeout=10)
        if r.status_code == 200:
            soup = BeautifulSoup(r.text, "html.parser")
            for a in soup.find_all("a", class_="iusc"):
                m_attr = a.get("m", "")
                if m_attr:
                    try:
                        m_data = json.loads(m_attr)
                        murl = m_data.get("murl")
                        if murl and murl.startswith("http"):
                            img_urls.append(murl)
                    except:
                        pass
    except Exception as e:
        print(f"Error searching Bing for '{query}': {e}")
    return img_urls[:limit]

def crop_to_square(img):
    w, h = img.size
    min_dim = min(w, h)
    left = (w - min_dim) // 2
    top = (h - min_dim) // 2
    right = left + min_dim
    bottom = top + min_dim
    return img.crop((left, top, right, bottom))

def evaluate_jinx_logo(img):
    """
    Detailed quality score (0 - 100) for Wild Rift Jinx Head Logo:
    - Resolution (max 30 pts)
    - 1:1 Aspect Ratio (max 20 pts)
    - Color Vibrancy & Contrast (max 25 pts)
    - Edge Detail / Sharpness (max 25 pts)
    """
    w, h = img.size
    min_dim = min(w, h)
    
    # 1. Resolution
    if min_dim >= 512:
        res_score = 30.0
    elif min_dim >= 256:
        res_score = 22.0 + (min_dim - 256) / 256 * 8
    else:
        res_score = (min_dim / 256) * 22.0

    # 2. Aspect Ratio
    aspect = max(w, h) / max(1, min(w, h))
    if aspect <= 1.02:
        aspect_score = 20.0
    elif aspect <= 1.15:
        aspect_score = 16.0
    else:
        aspect_score = 10.0

    # Convert to RGB
    if img.mode != "RGB":
        rgb_img = img.convert("RGB")
    else:
        rgb_img = img

    # 3. Contrast & Color Stat
    stat = ImageStat.Stat(rgb_img)
    stddev = sum(stat.stddev) / 3.0
    if stddev >= 50:
        contrast_score = 25.0
    elif stddev >= 30:
        contrast_score = 18.0 + (stddev - 30) / 20 * 7
    else:
        contrast_score = (stddev / 30) * 18.0

    # 4. Sharpness
    gray = rgb_img.convert("L")
    edges = gray.filter(ImageFilter.FIND_EDGES)
    edge_stat = ImageStat.Stat(edges)
    mean_edge = edge_stat.mean[0]
    if mean_edge >= 12:
        sharpness_score = 25.0
    elif mean_edge >= 6:
        sharpness_score = 18.0 + (mean_edge - 6) / 6 * 7
    else:
        sharpness_score = (mean_edge / 6) * 18.0

    total_score = round(res_score + aspect_score + contrast_score + sharpness_score, 1)
    details = {
        "resolution": f"{w}x{h} ({res_score:.1f}/30)",
        "aspect": f"{aspect:.2f} ({aspect_score:.1f}/20)",
        "contrast": f"{stddev:.1f} ({contrast_score:.1f}/25)",
        "sharpness": f"{mean_edge:.1f} ({sharpness_score:.1f}/25)",
        "total": total_score
    }
    return total_score, details

def run_search_and_score(query, agent_id, output_path):
    print(f"=== SubAgent #{agent_id} searching for: '{query}' ===")
    urls = search_bing_images(query, limit=15)
    print(f"SubAgent #{agent_id} fetched {len(urls)} URLs")

    best_score = 0.0
    best_img = None
    best_url = None
    best_details = {}

    for i, url in enumerate(urls):
        try:
            resp = requests.get(url, headers=HEADERS, timeout=6)
            if resp.status_code != 200 or len(resp.content) < 4000:
                continue
            
            raw_img = Image.open(io.BytesIO(resp.content))
            sq_img = crop_to_square(raw_img)
            
            # Resize to 512x512
            sq_img_resized = sq_img.resize((512, 512), Image.Resampling.LANCZOS)
            
            score, details = evaluate_jinx_logo(sq_img_resized)
            print(f"SubAgent #{agent_id} candidate {i+1} [{url[:60]}...]: Score = {score}/100")
            
            if score > best_score:
                best_score = score
                best_img = sq_img_resized
                best_url = url
                best_details = details

            if best_score >= 95.0:
                print(f"SubAgent #{agent_id} found super candidate ({best_score}/100 >= 95). Stopping.")
                break
        except Exception as err:
            continue

    if best_img and best_score >= 85.0:
        best_img.save(output_path, "WEBP", quality=95)
        print(f"✓ SubAgent #{agent_id} saved candidate to {output_path} with score {best_score}/100")
    
    result = {
        "agent_id": agent_id,
        "query": query,
        "best_score": best_score,
        "best_url": best_url,
        "details": best_details,
        "saved_file": output_path if best_img else None
    }
    print(f"SUBAGENT_RESULT:{json.dumps(result)}")
    return result

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: python3 search_wildrift_jinx_logo.py <query> <agent_id> <output_path>")
        sys.exit(1)
    
    q = sys.argv[1]
    aid = sys.argv[2]
    out = sys.argv[3]
    run_search_and_score(q, aid, out)
