---
name: choose-thumbnail
description: Standard operating procedure for finding, cropping, scoring, visually inspecting with AI vision, and deploying 1:1 category thumbnail images (e.g., Wild Rift Jinx head, ChatGPT logo, game covers).
---

# Choose Thumbnail Skill Workflow (`/choose-thumbnail`)

This skill defines the complete end-to-end workflow for finding, cropping, scoring, visually inspecting, and deploying high-quality 1:1 category thumbnail images on JinxFamily.

---

## Workflow Overview

```
1. Identify Requirements -> 2. Targeted Image Crawl -> 3. 1:1 Square Crop -> 4. AI Vision Inspection -> 5. Deploy & Cache Bust
```

---

## Step 1: Identify Image Requirements & Specifications

Before searching:
- **Subject**: Define the exact character face, logo, or icon required (e.g., Wild Rift Jinx head portrait, ChatGPT official logo, Fortnite cover art).
- **Format & Resolution**: Exactly 1:1 square ratio (`512x512` target resolution, `WEBP` format, `quality=95`).
- **Aesthetics**: High contrast, vibrant colors matching dark mode and category gradients, clean background, no text/watermarks.

---

## Step 2: Targeted Image Crawling & Filtering

1. Use Python scripts to search Bing/Google Images, official Riot/Game Wikia assets, and App Store icons.
2. Apply strict keyword & domain filtering to exclude spam, Pinterest, stock photo collages, and unrelated images.
3. Download candidates to temporary path (`/tmp/thumbnail_candidate_X.webp`).

---

## Step 3: 1:1 Square Crop & Optimization

For each downloaded candidate:
1. Crop to square using center crop algorithm:
   ```python
   left = (w - min_dim) // 2
   top = (h - min_dim) // 2
   sq = img.crop((left, top, left + min_dim, top + min_dim))
   sq_512 = sq.resize((512, 512), Image.Resampling.LANCZOS)
   ```
2. If image has transparency, composite on a sleek dark-mode background (`#120C2D`).
3. Save as high-quality WEBP.

---

## Step 4: AI Vision Inspection & Visual Scoring Loop (`/loop`)

> [!IMPORTANT]
> **CRITICAL RULE**: Never declare an image selected based only on automated python metrics! Automated scripts can mistake random stock images for high quality. **The AI Agent MUST visually inspect every candidate using `view_file`.**

1. Call `view_file` on each candidate WEBP file to render the actual visual image into the AI context.
2. Evaluate visual criteria:
   - **Subject Accuracy**: Is it the exact requested character face/logo? (e.g., Jinx face with blue hair, pink eyes, Wild Rift aesthetic).
   - **Centering & Framing**: Is the head/logo centered and prominent?
   - **Visual Quality**: Is it sharp, vibrant, clear of watermarks, and visually striking?
3. Assign a **Visual Score (0-100)** to each candidate.
4. **Loop** until a candidate visually scoring **> 90/100** is found and confirmed.

---

## Step 5: Asset Replacement, Cache Busting & Production Deploy

1. Copy the winning candidate to the public category path:
   ```bash
   cp /tmp/winning_candidate.webp /root/jinxfamily/frontend/public/categories/category_<name>.webp
   ```
2. Increment cache-busting query parameter in components:
   - `frontend/components/CategoriesSection.jsx` (`/categories/category_<name>.webp?v=X`)
   - `frontend/components/Navbar.jsx`
   - `backend/shop/categories.py`
3. Check for existing deployment locks:
   ```bash
   ps aux | grep -E "HardReload|next build" | grep -v grep
   ```
4. Execute zero-downtime production reload:
   ```bash
   bash /root/jinxfamily/HardReload.sh
   ```
5. Confirm Next.js compilation and PM2 restart.
