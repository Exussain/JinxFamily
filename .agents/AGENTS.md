# Project Rules

- **Post-Change Production Deploy**: After every frontend code change, always run `/root/jinxfamily/HardReload.sh`. A frontend task is not complete when the local build passes: continue through the pm2 restart and verify the affected page on the live domain. The user expects implementation requests to be deployed automatically unless they explicitly ask to keep changes local.
- **Single HardReload Process**: Before starting a deployment, check for any existing background `HardReload.sh` or its `next build --webpack` child processes. If an older deployment is still running, terminate that process tree first, confirm it stopped, and then start exactly one fresh `/root/jinxfamily/HardReload.sh`. Never allow concurrent HardReload builds because they race on `.next-build`, `.next-prev`, and `.next`.
- **Sub-Agent Batching Protocol**: Do NOT launch all 12 sub-agents simultaneously. Launch in 4 WAVES of 3 agents each (Wave 1: Data Ingestion, Tech SEO, Keyword; Wave 2: Competitor, Content, Entity/Schema; Wave 3: Backlinks, Local, Perf/UX; Wave 4: Analytics, Code, QA). Maintain a 20s launch delay between agents in a wave and a 60s cooldown between waves. See [SEO_MASTER_PROMPT.md](file:///root/jinxfamily/docs/SEO_MASTER_PROMPT.md).
- **In-Chat Implementation Plans**: When providing plans or responding to `/plan` requests, write and display the complete implementation plan directly in the chat text response.


## Image Crawler
- **Primary Image Downloader**: Located at [download_filtered_covers.py](file:///root/jinxfamily/frontend/download_filtered_covers.py). This script scrapes **Bing Images** to fetch high-relevance game covers/logos (e.g. Fortnite, GTA, Xbox, Steam, PSN). It applies strict keyword filtering to prevent downloading fan-made or AI-generated results. Run with: `python3 frontend/download_filtered_covers.py`.
- **Google Images Downloader (`google-images-download`)**:
  - Installed package: `google_images_download`
  - CLI usage: `googleimagesdownload --keywords "Fortnite, ChatGPT Plus" --limit 5 --format jpg --output_directory frontend/public/blog/covers`
  - Python usage:
    ```python
    from google_images_download import google_images_download
    response = google_images_download.googleimagesdownload()
    response.download({"keywords": "query", "limit": 3, "format": "jpg", "output_directory": "frontend/public/blog/covers"})
    ```

