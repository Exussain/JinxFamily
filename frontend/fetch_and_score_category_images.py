import os
import sys
import json
import urllib.parse
import requests
from bs4 import BeautifulSoup
from PIL import Image, ImageEnhance, ImageFilter, ImageStat
import io

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

def search_bing_images(query, limit=15):
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

def evaluate_image(img, target_type):
    """
    Evaluates image quality out of 100.
    Criteria:
    - Resolution (min 200px, max score at >= 512px)
    - Aspect Ratio (closeness to 1:1)
    - Contrast & Brightness variance (not pure black/white/blank)
    - Sharpness / Detail (Laplacian variance)
    - Saturation / Color vibrancy
    """
    w, h = img.size
    score = 0.0
    reasons = []

    # 1. Resolution score (max 30 pts)
    min_dim = min(w, h)
    if min_dim >= 512:
        res_score = 30
    elif min_dim >= 256:
        res_score = 25 + (min_dim - 256) / 256 * 5
    elif min_dim >= 128:
        res_score = 15 + (min_dim - 128) / 128 * 10
    else:
        res_score = (min_dim / 128) * 15
    score += res_score
    reasons.append(f"Resolution ({w}x{h}): {res_score:.1f}/30")

    # 2. Aspect ratio score (max 20 pts)
    aspect = max(w, h) / max(1, min(w, h))
    if aspect <= 1.05:
        aspect_score = 20
    elif aspect <= 1.25:
        aspect_score = 16
    elif aspect <= 1.5:
        aspect_score = 10
    else:
        aspect_score = 5
    score += aspect_score
    reasons.append(f"Aspect Ratio ({aspect:.2f}): {aspect_score:.1f}/20")

    # Convert to RGB if needed
    if img.mode != "RGB":
        rgb_img = img.convert("RGB")
    else:
        rgb_img = img

    # 3. Contrast & Variance (max 25 pts)
    stat = ImageStat.Stat(rgb_img)
    stddev = sum(stat.stddev) / 3.0
    if stddev > 45:
        contrast_score = 25
    elif stddev > 25:
        contrast_score = 18 + (stddev - 25) / 20 * 7
    else:
        contrast_score = (stddev / 25) * 18
    score += contrast_score
    reasons.append(f"Contrast/StdDev ({stddev:.1f}): {contrast_score:.1f}/25")

    # 4. Sharpness (max 25 pts)
    gray = rgb_img.convert("L")
    edges = gray.filter(ImageFilter.FIND_EDGES)
    edge_stat = ImageStat.Stat(edges)
    mean_edge = edge_stat.mean[0]
    if mean_edge >= 12:
        sharpness_score = 25
    elif mean_edge >= 5:
        sharpness_score = 18 + (mean_edge - 5) / 7 * 7
    else:
        sharpness_score = (mean_edge / 5) * 18
    score += sharpness_score
    reasons.append(f"Sharpness ({mean_edge:.1f}): {sharpness_score:.1f}/25")

    return round(score, 1), reasons

def process_candidates(queries, target_type, output_path):
    print(f"\n==========================================")
    print(f"Processing target: {target_type} -> {output_path}")
    print(f"==========================================")
    
    candidate_urls = []
    for q in queries:
        urls = search_bing_images(q, limit=12)
        print(f"Query '{q}' returned {len(urls)} URLs")
        candidate_urls.extend(urls)
    
    # Deduplicate URLs
    candidate_urls = list(dict.fromkeys(candidate_urls))
    print(f"Total unique URLs to evaluate: {len(candidate_urls)}")

    best_score = 0
    best_image = None
    best_url = None
    best_reasons = []

    for i, url in enumerate(candidate_urls):
        try:
            resp = requests.get(url, headers=HEADERS, timeout=6)
            if resp.status_code != 200 or len(resp.content) < 3000:
                continue
            
            img = Image.open(io.BytesIO(resp.content))
            # Evaluate raw image
            score, reasons = evaluate_image(img, target_type)
            
            # Crop to 1:1 square
            squared_img = crop_to_square(img)
            # Re-evaluate squared image with high resolution resize boost if needed
            sq_w, sq_h = squared_img.size
            if sq_w < 512 or sq_h < 512:
                # High quality resize
                squared_img = squared_img.resize((512, 512), Image.Resampling.LANCZOS)
            
            final_score, final_reasons = evaluate_image(squared_img, target_type)

            print(f"Candidate #{i+1} [{url[:60]}...]: Score = {final_score}/100")
            for r in final_reasons:
                print(f"   - {r}")

            if final_score > best_score:
                best_score = final_score
                best_image = squared_img
                best_url = url
                best_reasons = final_reasons

            if best_score >= 92.0:
                print(f"Found excellent candidate scoring {best_score}/100 >= 90! Stopping early.")
                break
        except Exception as e:
            continue

    if best_image and best_score >= 80.0:
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        # Ensure 512x512
        if best_image.size != (512, 512):
            best_image = best_image.resize((512, 512), Image.Resampling.LANCZOS)
        
        best_image.save(output_path, "WEBP", quality=95)
        print(f"\n✓ SUCCESS: Saved {target_type} to {output_path}")
        print(f"Final Score: {best_score}/100")
        print(f"Source URL: {best_url}")
        return True, best_score
    else:
        print(f"\n⚠ Could not find candidate with score > 80. Best score was {best_score}/100")
        return False, best_score

if __name__ == "__main__":
    accounts_queries = [
        "League of Legends Wild Rift Jinx icon square",
        "Wild Rift Jinx face icon",
        "Wild Rift Jinx avatar 1:1",
        "Wild Rift Jinx portrait icon square"
    ]
    ai_queries = [
        "ChatGPT logo square icon",
        "OpenAI ChatGPT logo symbol 1:1",
        "ChatGPT logo green icon square",
        "ChatGPT official logo square 512x512"
    ]

    res1, score1 = process_candidates(
        accounts_queries,
        "Accounts (Wild Rift Jinx Face)",
        "/root/jinxfamily/frontend/public/categories/category_accounts.webp"
    )

    res2, score2 = process_candidates(
        ai_queries,
        "AI (ChatGPT Logo)",
        "/root/jinxfamily/frontend/public/categories/category_ai.webp"
    )

    print(f"\nFinal Summary:")
    print(f"Accounts Image Score: {score1}/100")
    print(f"AI Image Score: {score2}/100")
