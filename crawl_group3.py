import os
import shutil
from icrawler.builtin import BingImageCrawler

categories = {
    'category_mobile_games': ['Google Play Games green gamepad logo icon', 'com.google.android.play.games icon png', 'google play games logo square'],
    'category_ping': ['gaming ping speed wifi icon badge', 'low ping network icon 3d gaming', 'game ping indicator icon'],
    'category_valorant': ['Valorant logo emblem square', 'Valorant V logo emblem png', 'Valorant icon logo 4k'],
    'category_rainbow': ['Rainbow Six Siege 6 logo emblem square', 'Rainbow Six Siege emblem icon png', 'Rainbow Six Siege logo icon'],
    'category_marvel_rivals': ['Marvel Rivals logo emblem icon square', 'Marvel Rivals emblem png logo', 'Marvel Rivals icon square'],
    'category_steam': ['Steam logo icon dark blue square', 'Steam official logo icon png', 'Steam app icon square'],
    'category_ai': ['ChatGPT official logo icon green square', 'ChatGPT icon png transparent', 'OpenAI ChatGPT logo icon'],
    'category_giftcard': ['Gift card voucher icon 3d badge', 'gift card icon square vibrant', 'voucher gift card icon png']
}

base_dir = '/tmp/candidates/group3'

for cat, queries in categories.items():
    cat_dir = os.path.join(base_dir, cat)
    if os.path.exists(cat_dir):
        shutil.rmtree(cat_dir)
    os.makedirs(cat_dir, exist_ok=True)
    
    print(f"=== Crawling for {cat} ===")
    for idx, q in enumerate(queries):
        sub_dir = os.path.join(cat_dir, f"q_{idx}")
        os.makedirs(sub_dir, exist_ok=True)
        crawler = BingImageCrawler(
            storage={'root_dir': sub_dir},
            log_level=30 # WARNING only
        )
        crawler.crawl(keyword=q, max_num=10)
    
    # Flatten downloaded images into cat_dir with clean sequential names
    count = 1
    for root, dirs, files in os.walk(cat_dir):
        if root == cat_dir:
            continue
        for f in sorted(files):
            ext = os.path.splitext(f)[1].lower()
            if ext in ['.jpg', '.jpeg', '.png', '.webp']:
                src = os.path.join(root, f)
                dst = os.path.join(cat_dir, f"candidate_{count:02d}{ext}")
                shutil.move(src, dst)
                count += 1
    # Cleanup sub_dirs
    for d in os.listdir(cat_dir):
        full = os.path.join(cat_dir, d)
        if os.path.isdir(full):
            shutil.rmtree(full)

print("Crawling complete!")
