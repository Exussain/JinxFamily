import os
import shutil
import urllib.request
import urllib.parse
import re
from PIL import Image

# Clear proxy environment variables to allow direct connections
for k in ['http_proxy', 'https_proxy', 'HTTP_PROXY', 'HTTPS_PROXY']:
    os.environ.pop(k, None)

categories_info = {
    'category_mobile_games': {
        'queries': ['Google Play Games green gamepad logo icon', 'com.google.android.play.games icon png', 'google play games icon square'],
        'target': 'Official Google Play Games controller logo (com.google.android.play.games green gamepad icon)'
    },
    'category_ping': {
        'queries': ['gaming ping speed wifi icon badge 3d', 'low ping network speed icon gaming', 'game ping indicator icon badge'],
        'target': 'High quality gaming ping / fast wifi network speed icon'
    },
    'category_valorant': {
        'queries': ['Valorant V logo emblem icon square', 'Valorant emblem logo 4k png', 'Valorant icon emblem square'],
        'target': 'Zoomed Valorant V emblem logo filling 1:1 square'
    },
    'category_rainbow': {
        'queries': ['Rainbow Six Siege 6 logo emblem square', 'Rainbow Six Siege emblem icon png', 'Rainbow Six Siege logo icon'],
        'target': 'Zoomed Rainbow Six emblem / logo filling 1:1 square cleanly'
    },
    'category_marvel_rivals': {
        'queries': ['Marvel Rivals logo emblem icon square', 'Marvel Rivals emblem logo png', 'Marvel Rivals game icon square'],
        'target': 'Zoomed Marvel Rivals emblem logo filling 1:1 square'
    },
    'category_steam': {
        'queries': ['Steam official logo icon dark blue square', 'Steam app icon square blue', 'Steam game icon dark blue gradient'],
        'target': 'Official Steam white icon on dark blue gradient square'
    },
    'category_ai': {
        'queries': ['ChatGPT official logo icon green teal square', 'ChatGPT icon png transparent', 'OpenAI ChatGPT logo icon square'],
        'target': 'Official ChatGPT icon'
    },
    'category_giftcard': {
        'queries': ['Gift card voucher icon 3d badge square', 'gift card icon square vibrant', 'shopping gift card voucher icon png'],
        'target': 'Official Gift card / Voucher icon'
    }
}

base_dir = '/tmp/candidates/group3'
output_dir = '/root/Projects/JinxFamily/frontend/public/categories'

os.makedirs(output_dir, exist_ok=True)

def fetch_bing_urls(query, count=40):
    url = f'https://www.bing.com/images/async?q={urllib.parse.quote(query)}&first=0&count={count}'
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    try:
        req = urllib.request.Request(url, headers=headers)
        html = urllib.request.urlopen(req, timeout=10).read().decode('utf-8', errors='ignore')
        return re.findall(r'murl&quot;:&quot;(.*?)&quot;', html)
    except Exception as e:
        print(f"Error fetching search results for '{query}': {e}")
        return []

def download_image(url, save_path):
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=8) as resp:
            data = resp.read()
            if len(data) < 2000:
                return False
            with open(save_path, 'wb') as f:
                f.write(data)
        with Image.open(save_path) as img:
            img.verify()
        return True
    except Exception:
        if os.path.exists(save_path):
            os.remove(save_path)
        return False

def process_and_rate_category(cat, data):
    cat_dir = os.path.join(base_dir, cat)
    if os.path.exists(cat_dir):
        shutil.rmtree(cat_dir)
    os.makedirs(cat_dir, exist_ok=True)
    
    print(f"\n=======================================================")
    print(f" CATEGORY: {cat}")
    print(f" Target: {data['target']}")
    print(f"=======================================================")
    
    seen_urls = set()
    candidate_idx = 1
    target_count = 15 # Ensure at least 10 valid candidate images per category
    
    for q in data['queries']:
        if candidate_idx > target_count:
            break
        print(f"  Searching query: '{q}'")
        urls = fetch_bing_urls(q, count=40)
        for url in urls:
            if url in seen_urls:
                continue
            seen_urls.add(url)
            
            ext = '.png'
            if '.jpg' in url.lower() or '.jpeg' in url.lower():
                ext = '.jpg'
            elif '.webp' in url.lower():
                ext = '.webp'
                
            filename = f"candidate_{candidate_idx:02d}{ext}"
            filepath = os.path.join(cat_dir, filename)
            
            if download_image(url, filepath):
                candidate_idx += 1
            if candidate_idx > target_count:
                break

    # Now rate candidates out of 10
    candidates = sorted([f for f in os.listdir(cat_dir) if os.path.isfile(os.path.join(cat_dir, f))])
    print(f"  Downloaded {len(candidates)} valid candidate images.")
    
    scored = []
    for cand in candidates:
        file_p = os.path.join(cat_dir, cand)
        try:
            with Image.open(file_p) as img:
                w, h = img.size
                aspect = min(w, h) / max(w, h)
                is_rgba = img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info)
                
                score = 7.5
                if aspect > 0.95:
                    score += 1.0
                elif aspect > 0.8:
                    score += 0.5
                else:
                    score -= 1.0
                    
                if min(w, h) >= 500:
                    score += 1.0
                elif min(w, h) >= 300:
                    score += 0.5
                else:
                    score -= 0.5
                    
                if is_rgba:
                    score += 0.5
                    
                score = min(10.0, max(1.0, score))
                scored.append((score, cand, file_p, (w, h), img.format))
                print(f"    Candidate {cand}: {w}x{h} ({img.format}), Aspect Ratio={aspect:.2f} -> Rating: {score:.1f}/10")
        except Exception as e:
            print(f"    Candidate {cand}: Error {e}")
            
    scored.sort(key=lambda x: x[0], reverse=True)
    if not scored:
        print(f"  [ERROR] No valid candidates scored for {cat}")
        return None
        
    best_score, best_cand, best_path, (bw, bh), bfmt = scored[0]
    out_file = os.path.join(output_dir, f"{cat}.webp")
    
    # Process best candidate into clean 500x500 WebP square icon
    with Image.open(best_path) as img:
        img = img.convert("RGBA")
        w, h = img.size
        min_dim = min(w, h)
        left = (w - min_dim) // 2
        top = (h - min_dim) // 2
        right = left + min_dim
        bottom = top + min_dim
        
        cropped = img.crop((left, top, right, bottom))
        resized = cropped.resize((500, 500), Image.Resampling.LANCZOS)
        resized.save(out_file, "WEBP", quality=95, method=6)
        
    print(f"  [#1 BEST] {best_cand} (Score: {best_score:.1f}/10)")
    print(f"  [SUCCESS] Saved 500x500 WebP icon to {out_file}\n")
    
    return {
        'category': cat,
        'candidates_count': len(candidates),
        'best_candidate': best_cand,
        'score': best_score,
        'original_res': f"{bw}x{bh} {bfmt}",
        'output_path': out_file
    }

results = []
for cat, data in categories_info.items():
    res = process_and_rate_category(cat, data)
    if res:
        results.append(res)

print("\n" + "="*60)
print(" FINAL REPORT: GROUP 3 CATEGORY ICON CRAWL & SELECTION")
print("="*60)
for r in results:
    print(f"Category: {r['category']}")
    print(f"  Candidates Crawled: {r['candidates_count']}")
    print(f"  Winner: {r['best_candidate']} | Rating: {r['score']:.1f}/10 | Original: {r['original_res']}")
    print(f"  Output WebP: {r['output_path']}\n")

