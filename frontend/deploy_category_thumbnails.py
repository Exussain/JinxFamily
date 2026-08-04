import os
import shutil
from PIL import Image, ImageDraw, ImageFilter

WINNERS = {
    "category_fortnite.webp": "/tmp/category_candidates/fortnite/new_cand_2.webp",
    "category_coc.webp": "/tmp/category_candidates/coc/candidate_1.webp",
    "category_clash_royal.webp": "/tmp/category_candidates/clash_royal/candidate_1.webp",
    "category_cod.webp": "/tmp/category_candidates/cod/candidate_1.webp",
    "category_battlefield6.webp": "/tmp/category_candidates/battlefield6/steam_cand.webp",
}

PUBLIC_DIR = "/root/jinxfamily/frontend/public/categories"

def build_giftcard_winner():
    ps_path = "/root/jinxfamily/frontend/public/images/platforms/playstation.webp"
    xbox_path = "/root/jinxfamily/frontend/public/images/platforms/xbox.webp"
    steam_path = "/root/jinxfamily/frontend/public/images/platforms/steam.webp"
    
    base = Image.new("RGBA", (512, 512), (18, 12, 45, 255))
    glow = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    glow_draw.ellipse((40, 40, 472, 472), fill=(245, 158, 11, 55)) # Warm Gold Glow
    glow = glow.filter(ImageFilter.GaussianBlur(45))
    base.paste(glow, (0, 0), glow)
    
    if os.path.exists(ps_path) and os.path.exists(steam_path):
        ps_img = Image.open(ps_path).convert("RGBA").resize((160, 160), Image.Resampling.LANCZOS)
        steam_img = Image.open(steam_path).convert("RGBA").resize((160, 160), Image.Resampling.LANCZOS)
        
        # Add white rounded badge for xbox so it pops on dark background
        xbox_badge = Image.new("RGBA", (160, 160), (0, 0, 0, 0))
        b_draw = ImageDraw.Draw(xbox_badge)
        b_draw.ellipse((0, 0, 160, 160), fill=(16, 185, 129, 255)) # Vibrant Xbox Green circle badge
        if os.path.exists(xbox_path):
            xbox_icon = Image.open(xbox_path).convert("RGBA").resize((110, 110), Image.Resampling.LANCZOS)
            xbox_badge.paste(xbox_icon, (25, 25), xbox_icon)
            
        # Composite triangle layout
        base.paste(ps_img, (65, 110), ps_img)
        base.paste(xbox_badge, (285, 110), xbox_badge)
        base.paste(steam_img, (175, 275), steam_img)

    out = base.convert("RGB")
    dest = os.path.join(PUBLIC_DIR, "category_giftcard.webp")
    out.save(dest, "WEBP", quality=95)
    print(f"✓ Created and deployed: {dest}")

def main():
    os.makedirs(PUBLIC_DIR, exist_ok=True)
    for filename, src in WINNERS.items():
        if os.path.exists(src):
            dest = os.path.join(PUBLIC_DIR, filename)
            shutil.copyfile(src, dest)
            print(f"✓ Deployed {filename} from {src}")
        else:
            print(f"x Source missing: {src}")
            
    build_giftcard_winner()

if __name__ == "__main__":
    main()
