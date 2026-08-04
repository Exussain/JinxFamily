import os
import sys
from PIL import Image, ImageOps

base_dir = '/tmp/candidates/group3'
output_dir = '/root/Projects/NubixShop/frontend/public/categories'

os.makedirs(output_dir, exist_ok=True)

categories_info = {
    'category_mobile_games': 'Official Google Play Games controller logo (green gamepad)',
    'category_ping': 'High quality gaming ping / fast wifi network speed icon',
    'category_valorant': 'Zoomed Valorant V emblem logo filling 1:1 square',
    'category_rainbow': 'Zoomed Rainbow Six emblem / logo filling 1:1 square cleanly',
    'category_marvel_rivals': 'Zoomed Marvel Rivals emblem logo filling 1:1 square',
    'category_steam': 'Official Steam white icon on dark blue gradient square',
    'category_ai': 'Official ChatGPT icon',
    'category_giftcard': 'Official Gift card / Voucher icon'
}

def analyze_and_rate_images(cat):
    cat_path = os.path.join(base_dir, cat)
    candidates = sorted([f for f in os.listdir(cat_path) if os.path.isfile(os.path.join(cat_path, f))])
    
    scored = []
    print(f"\n=======================================================")
    print(f" CATEGORY: {cat}")
    print(f" Target: {categories_info[cat]}")
    print(f"=======================================================")
    
    for cand in candidates:
        file_p = os.path.join(cat_path, cand)
        try:
            with Image.open(file_p) as img:
                w, h = img.size
                aspect = min(w, h) / max(w, h)
                is_rgba = img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info)
                
                # Base score starting from 7.0 for resolution & aspect ratio
                score = 7.5
                if aspect > 0.95: # Very square
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
                    
                # Prefer RGBA or clean background formats
                if is_rgba:
                    score += 0.5
                    
                score = min(10.0, max(1.0, score))
                scored.append((score, cand, file_p, (w, h), img.format, is_rgba))
                print(f"  Candidate {cand}: {w}x{h}, format={img.format}, square_ratio={aspect:.2f} -> Score: {score:.1f}/10")
        except Exception as e:
            print(f"  Candidate {cand}: Error {e}")

    # Sort descending by score
    scored.sort(key=lambda x: x[0], reverse=True)
    return scored

def make_square_webp(src_path, dst_path, target_size=(500, 500)):
    with Image.open(src_path) as img:
        img = img.convert("RGBA")
        w, h = img.size
        
        # Center crop to 1:1 ratio if not square
        min_dim = min(w, h)
        left = (w - min_dim) // 2
        top = (h - min_dim) // 2
        right = left + min_dim
        bottom = top + min_dim
        
        img_cropped = img.crop((left, top, right, bottom))
        img_resized = img_cropped.resize(target_size, Image.Resampling.LANCZOS)
        
        # Save as lossless / high quality WebP
        img_resized.save(dst_path, "WEBP", quality=95, method=6)
        print(f"  [=>] Saved processed icon: {dst_path} (500x500 WebP)")

summary_report = []

for cat in sorted(categories_info.keys()):
    scored = analyze_and_rate_images(cat)
    if not scored:
        print(f"ERROR: No valid candidates for {cat}")
        continue
        
    best_score, best_cand, best_path, (bw, bh), bfmt, brgba = scored[0]
    out_file = os.path.join(output_dir, f"{cat}.webp")
    make_square_webp(best_path, out_file)
    
    summary_report.append({
        'category': cat,
        'candidates_count': len(scored),
        'best_candidate': best_cand,
        'score': best_score,
        'specs': f"{bw}x{bh} {bfmt}",
        'output': out_file
    })

print("\n\n=======================================================")
print(" SUMMARY OF GROUP 3 ICON SELECTION & PROCESSING")
print("=======================================================")
for item in summary_report:
    print(f"Category: {item['category']}")
    print(f"  - Total Candidates Crawled: {item['candidates_count']}")
    print(f"  - Winning Candidate: {item['best_candidate']} (Score: {item['score']:.1f}/10)")
    print(f"  - Original Resolution: {item['specs']}")
    print(f"  - Output Icon: {item['output']} (500x500 WebP)\n")

