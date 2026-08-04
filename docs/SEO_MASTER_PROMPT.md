# SEO Master Prompt & Sub-Agent Execution Protocol

## BATCHED SUB-AGENT LAUNCH DIRECTIVE — 3 at a Time, 4 Waves

```text
═══════════════════════════════════════════════════════
SUB-AGENT BATCHING PROTOCOL — 3 PER WAVE, 4 WAVES
═══════════════════════════════════════════════════════

DO NOT launch all 12 sub-agents simultaneously.
This will spike CPU, memory, and network to 100% and crash
or throttle the system.

Instead, launch agents in 4 WAVES of 3 agents each.
Each wave depends on data from the previous wave.

TIMING RULES:
  - Between each agent launch WITHIN a wave: 20 second delay
  - Between WAVES (after all 3 agents in a wave finish): 60 second delay
  - Each agent has a MAX TIMEOUT of 5 minutes
  - If an agent times out, log the error and proceed
  - Do NOT retry failed agents until the final pass
  - Monitor CPU/memory: if usage exceeds 85%, add 30s extra delay
    before launching the next agent

LAUNCH SEQUENCE:

┌─────────────────────────────────────────────────────────────┐
│  WAVE 1 — FOUNDATION (Data Gathering)                       │
│  Purpose: Collect all raw data before analysis begins       │
│                                                             │
│  T+0s    → Launch Agent 1: Data Ingestion                   │
│  T+20s   → Launch Agent 2: Technical SEO                    │
│  T+40s   → Launch Agent 3: Keyword & Search Intent          │
│                                                             │
│  Wait for ALL 3 to complete (max 5 min each)                │
│  Merge outputs into Wave 1 Data Pool                        │
│  T+complete → 60 second cooldown                            │
├─────────────────────────────────────────────────────────────┤
│  WAVE 2 — ANALYSIS (Competitive & Content Intelligence)     │
│  Purpose: Analyze data using Wave 1 findings                │
│  Requires: Wave 1 Data Pool                                 │
│                                                             │
│  T+0s    → Launch Agent 4: Competitor & SERP Intelligence   │
│  T+20s   → Launch Agent 5: Content Optimization             │
│  T+40s   → Launch Agent 6: Entity & Structured Data         │
│                                                             │
│  Wait for ALL 3 to complete                                 │
│  Merge outputs into Wave 2 Data Pool                        │
│  T+complete → 60 second cooldown                            │
├─────────────────────────────────────────────────────────────┤
│  WAVE 3 — AUTHORITY & EXPERIENCE                            │
│  Purpose: Backlinks, local, performance, UX                 │
│  Requires: Wave 1 + Wave 2 Data Pools                       │
│                                                             │
│  T+0s    → Launch Agent 7: Backlink & Digital PR            │
│  T+20s   → Launch Agent 8: Local / International SEO        │
│  T+40s   → Launch Agent 9: Performance, UX & CRO            │
│                                                             │
│  Wait for ALL 3 to complete                                 │
│  Merge outputs into Wave 3 Data Pool                        │
│  T+complete → 60 second cooldown                            │
├─────────────────────────────────────────────────────────────┤
│  WAVE 4 — IMPLEMENTATION & QA                               │
│  Purpose: Build fixes, validate everything                  │
│  Requires: Wave 1 + 2 + 3 Data Pools                        │
│                                                             │
│  T+0s    → Launch Agent 10: Analytics & Measurement         │
│  T+20s   → Launch Agent 11: Implementation & Code           │
│  T+40s   → Launch Agent 12: QA, Risk & Compliance           │
│                                                             │
│  Wait for ALL 3 to complete                                 │
│  Merge ALL wave pools into Master Report                    │
│  T+complete → Generate final output                         │
└─────────────────────────────────────────────────────────────┘

TOTAL ESTIMATED TIME: 12-20 minutes (depending on page load times)

═══════════════════════════════════════════════════════
WAVE 1 — FOUNDATION AGENTS (Launch First)
═══════════════════════════════════════════════════════

AGENT 1: DATA INGESTION
Launch at T+0s
Delay before next: 20s

Prompt:
"""
You are the Data Ingestion Agent for nubixshop.ir.

Use Playwright to:
1. Fetch https://nubixshop.ir/sitemap.xml → record ALL URLs
2. Fetch https://nubixshop.ir/robots.txt → record all rules
3. Navigate to https://nubixshop.ir/ → extract all nav/footer links
4. Navigate to each category page:
   - /category/fortnite
   - /category/ai
   - /category/giftcards
   - /category/games
   - /category/subscriptions
   Extract ALL product links from each.
5. For EVERY discovered URL, record:
   - HTTP status
   - <title>
   - <meta robots>
   - <link rel="canonical">
   - Whether page shows "ناموجود" (mark as temporarily_unavailable)
   - Whether page shows "موجود نیست"
   - THE DISPLAYED FINAL PRICE (not strikethrough price)
   - THE DISPLAYED ORIGINAL PRICE (if strikethrough exists)
   - Discount percentage (if visible)
   - JSON-LD presence (yes/no)
6. Build complete URL inventory.

RATE LIMIT: Wait 2 seconds between each page navigation.
Do NOT open more than 1 page at a time.
If CPU > 85%, wait 10 extra seconds before next navigation.

Return JSON:
{
  "total_urls_discovered": 0,
  "sitemap_urls": [],
  "robots_txt_rules": [],
  "url_inventory": [
    {
      "url": "",
      "http_status": 0,
      "title": "",
      "meta_robots": "",
      "canonical": "",
      "is_out_of_stock": false,
      "displayed_final_price": "",
      "displayed_original_price": "",
      "discount_percent": "",
      "has_jsonld": false,
      "page_type": "product/category/blog/faq/guide/static"
    }
  ],
  "out_of_stock_pages": [],
  "missing_from_sitemap": [],
  "critical_data_gaps": []
}
"""

───────────────────────────────────────────────────────

AGENT 2: TECHNICAL SEO
Launch at T+20s (20s after Agent 1)
Delay before next: 20s

Prompt:
"""
You are the Technical SEO Agent for nubixshop.ir.

Use Playwright to test:

1. REDIRECTS (test each one, wait 3s between):
   - http://nubixshop.ir/ → expect 301 → https://nubixshop.ir/
   - https://nubixshop.ir/index.php → expect 301 → /
   - https://nubixshop.ir/product/fortnite-crew-pack → expect 301 → /crewpack
   - http://nubixshop.ir/vbucks → expect 301 → https://nubixshop.ir/vbucks
   - http://nubixshop.ir/product/chatgpt-subscription → 301 → https://
   - http://nubixshop.ir/product/fortnite-battle-pass → 301 → https://
   - http://nubixshop.ir/crewpack → 301 → https://
   - http://nubixshop.ir/lego → 301 → https://
   - http://nubixshop.ir/gta6 → 301 → https://
   - https://nubixshop.ir/help → verify: 301 or live page?
   - https://nubixshop.ir/guide → verify: 301 to /guides or live?
   - https://ai.nubixshop.ir/ → verify: what is this?

2. ROUTING BUGS (must return 404):
   - https://nubixshop.ir/product/[slug] → MUST be 404
   - https://nubixshop.ir/blog/category/[slug] → MUST be 404
   - https://nubixshop.ir/product/nonexistent-xyz-123 → MUST be 404

3. PARAMETER URLs (must have canonical or noindex):
   - https://nubixshop.ir/?q=test → check noindex
   - https://nubixshop.ir/?cat=فورتنایت → check canonical
   - https://nubixshop.ir/?cat=گیفت کارتها → check canonical
   - https://nubixshop.ir/?cat=اشتراکها → check canonical

4. NOINDEX CHECK on revenue pages (MUST be index,follow):
   - /product/chatgpt-subscription
   - /product/gemini-subscription
   - /product/league-of-legends-rp
   - /product/fortnite-music-pass
   - /product/perfected-nature
   - /product/frozen-legends
   - /vbucks
   - /crewpack
   - /product/fortnite-battle-pass
   - /lego
   - /gta6

5. FONT FILES (should not be crawled as pages):
   - /fonts/vazirmatn/vazirmatn-arabic-400.woff2
   - /fonts/vazirmatn/vazirmatn-arabic-700.woff2
   Check if robots.txt blocks /fonts/. If not, flag.

6. /lol BUG:
   - Navigate to /lol
   - Check: does it show LoL category content or homepage clone?
   - If homepage clone → FLAG AS BUG

RATE LIMIT: Wait 3 seconds between each navigation.
Do NOT open multiple pages simultaneously.
If a page takes > 15s to load, skip and log timeout.

Return JSON:
{
  "redirect_tests": [
    {"url": "", "expected": "", "actual": "", "pass": true/false}
  ],
  "routing_bugs": [
    {"url": "", "expected_status": 404, "actual_status": 0, "pass": true/false}
  ],
  "parameter_url_checks": [
    {"url": "", "has_noindex": false, "has_canonical": false, "canonical_target": "", "pass": true/false}
  ],
  "noindex_bugs": [
    {"url": "", "meta_robots": "", "should_be": "index,follow", "pass": true/false}
  ],
  "font_crawl_issue": true/false,
  "lol_page_bug": true/false,
  "critical_issues": [],
  "all_clear": true/false
}
"""

───────────────────────────────────────────────────────

AGENT 3: KEYWORD & SEARCH INTENT
Launch at T+40s (20s after Agent 2)
Delay before Wave 2: 60s after this agent completes

Prompt:
"""
You are the Keyword & Search Intent Agent for nubixshop.ir.

Use Playwright to search Google.fa for these queries.
Wait 5 seconds between each search to avoid rate limiting.

SEARCHES TO PERFORM:
1. "خرید وی باکس فورتنایت" → record top 10 results
2. "خرید بتل پس فورتنایت" → record top 10
3. "خرید کروپک فورتنایت" → record top 10
4. "خرید اشتراک چت جی پی تی" → record top 10
5. "خرید گیفت کارت استیم" → record top 10
6. "خرید پک لگو فورتنایت" → record top 10
7. "پیش خرید GTA 6" → record top 10
8. "خرید اشتراک جمینی" → record top 10

For each search:
- Record: rank, title, URL, snippet for top 10
- Note if nubixshop.ir appears (and at what position)
- Note which competitors appear most frequently
- Identify search intent (transactional/informational/mixed)

Then map keywords to nubixshop.ir URLs:
- "خرید وی باکس" → /vbucks
- "خرید بتل پس" → /product/fortnite-battle-pass
- "خرید کروپک" → /crewpack
- "خرید اشتراک چت جی پی تی" → /product/chatgpt-subscription
- "خرید گیفت کارت استیم" → /product/steam-giftcard (verify URL)
- "خرید پک لگو" → /lego
- "پیش خرید GTA 6" → /gta6
- "خرید اشتراک جمینی" → /product/gemini-subscription

RATE LIMIT: 5 seconds between Google searches.
Do NOT perform more than 8 searches.
If Google shows CAPTCHA, stop and log.

Return JSON:
{
  "search_results": [
    {
      "query": "",
      "intent": "transactional/informational/mixed",
      "top_10": [{"rank": 1, "title": "", "url": "", "snippet": ""}],
      "nubixshop_position": null,
      "nubixshop_in_top_10": false,
      "top_competitors": []
    }
  ],
  "keyword_to_url_map": [
    {"keyword": "", "target_url": "", "current_rank": null, "gap": ""}
  ],
  "competitor_frequency": {},
  "quick_win_keywords": [],
  "missing_keyword_coverage": []
}
"""

═══════════════════════════════════════════════════════
WAVE 2 — ANALYSIS AGENTS (Launch After Wave 1 + 60s)
═══════════════════════════════════════════════════════

AGENT 4: COMPETITOR & SERP INTELLIGENCE
Launch at T+0s (after 60s cooldown)
Delay before next: 20s

Prompt:
"""
You are the Competitor & SERP Intelligence Agent.

INPUT: Wave 1 Data Pool (keyword results, competitor list).

Use Playwright to visit the TOP 3 competitor sites identified
in Wave 1. Wait 5 seconds between each site visit.

For each competitor:
- Extract: title structure, meta descriptions
- Extract: JSON-LD schema (Product, Organization, FAQ)
- Check: do they use final/discounted price in schema?
- Check: page load speed impression
- Check: content depth on equivalent product pages
- Check: internal linking patterns
- Check: E-E-A-T signals (about page, author, trust badges)
- Check: mobile responsiveness (viewport meta)

Compare with nubixshop.ir data from Wave 1.

RATE LIMIT: 5s between site visits. Max 3 competitor sites.

Return JSON:
{
  "competitors": [
    {
      "name": "",
      "domain": "",
      "schema_usage": [],
      "price_in_schema_correct": true/false,
      "content_depth_score": "1-5",
      "speed_impression": "fast/medium/slow",
      "eeat_signals": [],
      "strengths": [],
      "weaknesses": [],
      "exploitable_gaps": []
    }
  ],
  "nubixshop_vs_competitors": "",
  "recommendations": []
}
"""

───────────────────────────────────────────────────────

AGENT 5: CONTENT OPTIMIZATION
Launch at T+20s
Delay before next: 20s

Prompt:
"""
You are the Content Optimization Agent.

INPUT: Wave 1 Data Pool (URL inventory, page data).

Use Playwright to crawl these content pages. Wait 3s between each.

PAGES TO CRAWL:
- /blog (index)
- /blog/guide-buy-vbucks (GSC: crawled not indexed — investigate)
- /blog/guide-crew-pack
- /blog/guide-buy-chatgpt-plus
- /blog/guide-gemini-advanced
- /blog/guide-buy-steam-giftcard
- /blog/guide-preorder-gta6
- /blog/guide-spotify-premium
- /blog/unlink-xbox-from-epic-games (MISSING from sitemap)
- /guides/disable-2fa
- /guides/link-unlink
- /guides/remove-restriction
- /faq (index)

For each page:
- Record: word count, headings structure, internal links count
- Record: meta title, meta description
- Record: JSON-LD presence
- Record: images with/without alt text
- Check: is content unique or thin?
- Check: does it link to relevant product pages?

SPECIAL: /blog/guide-buy-vbucks
- GSC says "crawled not indexed"
- Check: content length, canonical, internal links, meta robots
- Diagnose WHY Google didn't index it

RATE LIMIT: 3s between navigations. One page at a time.

Return JSON:
{
  "content_audit": [
    {
      "url": "",
      "word_count": 0,
      "headings": [],
      "internal_links_count": 0,
      "has_jsonld": false,
      "images_missing_alt": 0,
      "content_quality": "thin/adequate/good/excellent",
      "issues": [],
      "recommendations": []
    }
  ],
  "guide_buy_vbucks_diagnosis": "",
  "missing_from_sitemap": [],
  "content_gaps": []
}
"""

───────────────────────────────────────────────────────

AGENT 6: ENTITY & STRUCTURED DATA
Launch at T+40s
Delay before Wave 3: 60s after this agent completes

Prompt:
"""
You are the Entity & Structured Data Agent.

INPUT: Wave 1 Data Pool (URL inventory, price data).

Use Playwright to extract JSON-LD from EVERY product page.
Wait 3s between each page.

PAGES TO CHECK:
- /vbucks
- /crewpack
- /product/fortnite-battle-pass
- /product/chatgpt-subscription
- /product/gemini-subscription
- /lego
- /gta6
- /product/league-of-legends-rp
- /product/fortnite-music-pass
- /product/perfected-nature
- /product/frozen-legends
- /product/agency-renegades
- /product/skate-park
- /product/spotify-subscription
- /product/change-region-turkey
- /product/starterpack
- /product/summer-legends
- /product/minty-legends-pack
- /product/nubixshopirpgolden-touch-quest-pack
- ALL gift card product pages (discover from /category/giftcards)

For EACH product page:
1. Extract ALL <script type="application/ld+json"> blocks
2. Validate Product schema:
   - @type = "Product" ?
   - "name" matches <h1> ?
   - "description" present ?
   - "image" present and valid URL ?
   - "brand" present ?
   - "offers" object exists ?
   - "offers.price" = THE FINAL DISCOUNTED PRICE shown on page ?
     (NOT the strikethrough original price)
   - "offers.priceCurrency" present ?
   - "offers.availability" correct ?
     (InStock for available, OutOfStock for ناموجود, PreOrder for GTA6)
   - "offers.validFrom" present ? (GSC flagged missing)
   - "offers.url" matches page URL ?
   - "aggregateRating" only if real reviews exist ?
3. Compare schema price with VISIBLE final price on page:
   - Look for strikethrough price (original)
   - Look for final price (next to add-to-cart, NOT struck through)
   - Look for discount badge (e.g., "۱۴٪ تخفیف ویژه")
   - Schema price MUST equal the final price
   - IF MISMATCH → FLAG AS CRITICAL
4. Check BreadcrumbList schema
5. Check FAQPage schema (if page has FAQ section)

Also check homepage (/) for:
- Organization schema
- WebSite schema
- SearchAction schema

RATE LIMIT: 3s between pages. One page at a time.
If JSON-LD extraction fails, retry once after 5s.

Return JSON:
{
  "product_schema_audit": [
    {
      "url": "",
      "has_product_schema": false,
      "name_matches_h1": false,
      "description_present": false,
      "image_present": false,
      "brand_present": false,
      "offers_present": false,
      "schema_price": "",
      "displayed_final_price": "",
      "displayed_original_price": "",
      "discount_percent": "",
      "price_match": true/false,
      "price_currency": "",
      "availability_in_schema": "",
      "availability_correct": true/false,
      "validFrom_present": false,
      "url_matches": false,
      "has_breadcrumb": false,
      "has_faq_schema": false,
      "issues": [],
      "fix_needed": ""
    }
  ],
  "homepage_schema": {
    "has_organization": false,
    "has_website": false,
    "has_searchaction": false
  },
  "critical_price_mismatches": [],
  "missing_validFrom": [],
  "availability_errors": []
}
"""

═══════════════════════════════════════════════════════
WAVE 3 — AUTHORITY & EXPERIENCE (Launch After Wave 2 + 60s)
═══════════════════════════════════════════════════════

AGENT 7: BACKLINK & DIGITAL PR
Launch at T+0s (after 60s cooldown)
Delay before next: 20s

Prompt:
"""
You are the Backlink & Digital PR Agent.

INPUT: Wave 1 + Wave 2 Data Pools.

No backlink tool available. Use Playwright for what's possible:

1. Search Google for: site:nubixshop.ir → record indexed pages count
2. Search Google for: "نوبیکس شاپ" → record brand mentions
3. Search Google for: "nubixshop" → record brand mentions
4. Check if nubixshop.ir appears in any directories, forums,
   or review sites in the search results
5. Identify 5-10 potential link opportunities:
   - Iranian gaming forums
   - Gaming news sites
   - App/software review directories
   - Enamad directory listing
   - ZarinPal merchant directory

RATE LIMIT: 5s between searches. Max 5 searches.
Stop if CAPTCHA appears.

Return JSON:
{
  "indexed_pages_estimate": "",
  "brand_mentions": [],
  "link_opportunities": [],
  "competitor_link_sources": [],
  "authority_building_plan": [],
  "missing_data_note": "No backlink tool available. Recommend Ahrefs/Search Console links report."
}
"""

───────────────────────────────────────────────────────

AGENT 8: LOCAL / INTERNATIONAL SEO
Launch at T+20s
Delay before next: 20s

Prompt:
"""
You are the Local & International SEO Agent.

INPUT: Wave 1 Data Pool.

nubixshop.ir targets Iran only (fa-IR). No international targeting.

Check:
1. Is there hreflang on any page? (Should NOT be needed for single locale)
2. Is the language declared in <html lang="fa"> ?
3. Is there a LocalBusiness schema? (Not critical for online-only shop)
4. Are trust signals present?
   - Enamad seal (verify: trustseal.enamad.ir iframe present)
   - ZarinPal badge
   - Contact page with address/phone
   - About page
5. Is there a Google Business Profile? (Search "نوبیکس شاپ" on Google Maps)

RATE LIMIT: 3s between navigations.

Return JSON:
{
  "html_lang_correct": true/false,
  "hreflang_present": true/false,
  "hreflang_needed": false,
  "trust_signals": {
    "enamad": true/false,
    "zarinpal": true/false,
    "contact_page": true/false,
    "about_page": true/false
  },
  "local_seo_needed": false,
  "recommendations": []
}
"""

───────────────────────────────────────────────────────

AGENT 9: PERFORMANCE, UX & CRO
Launch at T+40s
Delay before Wave 4: 60s after this agent completes

Prompt:
"""
You are the Performance, UX & CRO Agent.

INPUT: Wave 1 Data Pool.

Use Playwright with CDP to measure performance on these URLs.
Wait 5s between each page. Run 2 passes per page (warm + cold).

URLS TO MEASURE:
1. https://nubixshop.ir/
2. https://nubixshop.ir/crewpack
3. https://nubixshop.ir/product/fortnite-battle-pass
4. https://nubixshop.ir/product/chatgpt-subscription
5. https://nubixshop.ir/vbucks
6. https://nubixshop.ir/lego
7. https://nubixshop.ir/product/gemini-subscription

For each page measure:
- TTFB (Time to First Byte)
- LCP (Largest Contentful Paint) — identify the LCP element
- CLS (Cumulative Layout Shift)
- INP (Interaction to Next Paint) — simulate a click
- Total page load time
- Total page weight (bytes)
- Number of requests
- Render-blocking resources (CSS, JS, fonts)
- Image sizes and formats (WebP/AVIF/JPEG/PNG)
- Font loading (vazirmatn woff2 — preloaded? blocking?)
- Third-party scripts:
  - Enamad trust seal iframe
  - ZarinPal script
  - Analytics (gtag/GA4)
  - Chat widget
  - Any other third-party

GSC CONTEXT:
- LCP issue: /crewpack group (18 URLs) = 2.7s, / = 2.7s
- INP issue: /product/chatgpt-subscription = 206ms, / = 239ms

Identify the SPECIFIC cause of LCP > 2.5s and INP > 200ms.

RATE LIMIT: 5s between pages. One page at a time.
CDP session per page. Close session after each.

Return JSON:
{
  "performance_audit": [
    {
      "url": "",
      "ttfb_ms": 0,
      "lcp_ms": 0,
      "lcp_element": "",
      "cls": 0,
      "inp_ms": 0,
      "total_load_ms": 0,
      "page_weight_kb": 0,
      "request_count": 0,
      "render_blocking": [],
      "largest_images": [],
      "font_loading": "",
      "third_party_scripts": [],
      "lcp_cause": "",
      "inp_cause": "",
      "fix_recommendations": []
    }
  ],
  "top_3_lcp_fixes": [],
  "top_3_inp_fixes": [],
  "quick_wins": []
}
"""

═══════════════════════════════════════════════════════
WAVE 4 — IMPLEMENTATION & QA (Launch After Wave 3 + 60s)
═══════════════════════════════════════════════════════

AGENT 10: ANALYTICS & MEASUREMENT
Launch at T+0s (after 60s cooldown)
Delay before next: 20s

Prompt:
"""
You are the Analytics & Measurement Agent.

Use Playwright to check nubixshop.ir for:

1. Analytics presence:
   - Navigate to https://nubixshop.ir/
   - Check <head> for: gtag.js, analytics.js, GA4, Matomo, Yandex
   - Check for: dataLayer initialization
   - Check for: conversion event tracking (purchase, add_to_cart)
   - Check for: ZarinPal payment callback tracking

2. Meta tags:
   - Open Graph tags present?
   - Twitter Card tags present?
   - Canonical tag present?

3. Structured data on homepage:
   - Organization schema?
   - WebSite schema with SearchAction?

RATE LIMIT: Single page visit. Extract and report.

Return JSON:
{
  "analytics_found": true/false,
  "analytics_type": "",
  "conversion_tracking": true/false,
  "add_to_cart_tracking": true/false,
  "og_tags_present": true/false,
  "twitter_cards_present": true/false,
  "organization_schema": true/false,
  "website_schema": true/false,
  "gaps": [],
  "recommendations": []
}
"""

───────────────────────────────────────────────────────

AGENT 11: IMPLEMENTATION & CODE
Launch at T+20s
Delay before next: 20s

Prompt:
"""
You are the Implementation & Code Agent.

INPUT: ALL previous Wave Data Pools (1, 2, 3).

Generate implementation-ready code fixes for ALL issues found.

MUST GENERATE:

1. JSON-LD FIX for each product page:
   - Use the FINAL DISCOUNTED PRICE from Wave 1/2 data
   - Add "validFrom" field
   - Set correct "availability"
   - Provide copy-paste JSON-LD for each product

   Example for /product/fortnite-battle-pass:
   {
     "@context": "https://schema.org",
     "@type": "Product",
     "name": "بتل پس سیزن جدید فورتنایت",
     "description": "بتلپس سیزن جدید فورتنایت کلید دسترسی به ارزشمندترین جوایز هر فصل است...",
     "image": "https://nubixshop.ir/images/products/battle-pass.webp",
     "brand": {"@type": "Brand", "name": "Epic Games"},
     "offers": {
       "@type": "Offer",
       "url": "https://nubixshop.ir/product/fortnite-battle-pass",
       "priceCurrency": "IRR",
       "price": "9490000",
       "availability": "https://schema.org/InStock",
       "validFrom": "2026-06-01",
       "seller": {"@type": "Organization", "name": "نوبیکس شاپ"}
     }
   }
   NOTE: 949,000 Toman = 9,490,000 IRR (if using IRR)
   OR use "price": "949000" with "priceCurrency": "TOMAN"

   Generate this for EVERY product page using the ACTUAL
   final prices fetched by Playwright in Wave 1/2.

2. ROBOTS.TXT updated version

3. SITEMAP.XML expanded version (all 70+ URLs)

4. REDIRECT RULES (server config or CMS)

5. FONT PRELOAD snippet:
   <link rel="preload" href="/fonts/vazirmatn/vazirmatn-arabic-400.woff2" as="font" type="font/woff2" crossorigin>

6. DYNAMIC SITEMAP GENERATOR code (cron job or API route)

7. PRICE SYNC verification script:
   - Fetches each product page
   - Extracts displayed final price
   - Extracts JSON-LD price
   - Compares
   - Alerts on mismatch

Do NOT hardcode prices. All price references must note
"fetch from DB/API at render time."

Return JSON:
{
  "jsonld_fixes": [
    {"url": "", "current_schema": {}, "fixed_schema": {}, "price_source": "DB field: products.final_price"}
  ],
  "robots_txt": "",
  "sitemap_xml": "",
  "redirect_rules": [],
  "font_preload_snippet": "",
  "dynamic_sitemap_code": "",
  "price_sync_script": "",
  "implementation_order": []
}
"""

───────────────────────────────────────────────────────

AGENT 12: QA, RISK & COMPLIANCE
Launch at T+40s
Final agent. No delay needed after.

Prompt:
"""
You are the QA, Risk & Compliance Agent.

INPUT: ALL Wave Data Pools (1, 2, 3) + Agent 11 implementation output.

FINAL VALIDATION PASS. Use Playwright to verify:

1. OUT-OF-STOCK PAGES (verify ALL of these):
   For each: /product/fortnite-music-pass, /product/perfected-nature,
   /product/frozen-legends, /product/agency-renegades,
   /product/skate-park, /product/league-of-legends-rp,
   /product/chatgpt-subscription

   Check:
   - HTTP 200? (NOT 404, NOT 410)
   - Meta robots = index,follow? (NOT noindex)
   - Canonical = self?
   - JSON-LD availability = OutOfStock?
   - Email signup form present?
   - In sitemap.xml?
   - Internal links still point to it?

   IF ANY CHECK FAILS → FLAG AS CRITICAL

2. PRICE VERIFICATION (verify ALL product pages):
   For each product page:
   - Fetch page with Playwright
   - Extract displayed final price (NOT strikethrough)
   - Extract JSON-LD offers.price
   - Compare
   - IF MISMATCH → FLAG AS CRITICAL

3. IN-STOCK PAGES:
   - HTTP 200?
   - JSON-LD availability = InStock?
   - Add-to-cart button present and enabled?
   - Price in schema matches displayed price?

4. REDIRECTS:
   - All http:// → https:// working?
   - /index.php → / working?
   - /product/fortnite-crew-pack → /crewpack working?
   - No redirect chains > 1 hop?

5. 404 CHECKS:
   - /product/[slug] → 404?
   - /blog/category/[slug] → 404?

6. SITEMAP:
   - Fetch sitemap.xml
   - Count URLs (must be 70+)
   - Verify no ?q= or ?cat= URLs
   - Verify no [slug] literal URLs
   - Verify all revenue pages present
   - Verify out-of-stock pages present

7. ROBOTS.TXT:
   - /?q= blocked?
   - /?cat= blocked?
   - /fonts/ blocked?
   - Sitemap line present?

RATE LIMIT: 3s between navigations. One page at a time.

Return FINAL VERIFICATION JSON:
{
  "out_of_stock_verification": [
    {
      "url": "",
      "http_200": true/false,
      "index_follow": true/false,
      "canonical_self": true/false,
      "schema_outofstock": true/false,
      "email_form_present": true/false,
      "in_sitemap": true/false,
      "internal_links_present": true/false,
      "status": "PASS/FAIL"
    }
  ],
  "price_verification": [
    {
      "url": "",
      "displayed_final_price": "",
      "schema_price": "",
      "match": true/false,
      "status": "PASS/FAIL"
    }
  ],
  "in_stock_verification": [],
  "redirect_verification": [],
  "404_verification": [],
  "sitemap_verification": {
    "total_urls": 0,
    "revenue_pages_present": true/false,
    "out_of_stock_present": true/false,
    "no_parameter_urls": true/false,
    "no_bracket_urls": true/false,
    "status": "PASS/FAIL"
  },
  "robots_verification": {
    "q_blocked": true/false,
    "cat_blocked": true/false,
    "fonts_blocked": true/false,
    "sitemap_line": true/false,
    "status": "PASS/FAIL"
  },
  "overall_status": "PASS/FAIL",
  "critical_failures": [],
  "warnings": [],
  "approved_for_deployment": true/false
}
"""

═══════════════════════════════════════════════════════
ORCHESTRATOR: POST-WAVE SYNTHESIS
═══════════════════════════════════════════════════════

After ALL 4 waves complete, merge all 12 agent outputs into
the Master SEO Intelligence Report.

Generate:
1. Executive Summary (Persian + English)
2. Top 10 Highest-Impact Actions
3. Full Technical Audit
4. Full Keyword Map
5. Full Competitor Analysis
6. Full Content Plan
7. Full Schema Fix Plan (with FINAL prices)
8. Full Backlink Plan
9. Full Performance Plan
10. Full Analytics Plan
11. Roadmap: 0-7 / 8-30 / 31-90 / 90+ days
12. Implementation Tickets
13. Price Verification Report
14. Out-of-Stock Handling Report
15. Final QA Verification JSON
16. Missing Data Checklist

═══════════════════════════════════════════════════════
TIMING SUMMARY
═══════════════════════════════════════════════════════

Wave 1: T+0s, T+20s, T+40s → ~3-5 min → 60s cooldown
Wave 2: T+0s, T+20s, T+40s → ~3-5 min → 60s cooldown
Wave 3: T+0s, T+20s, T+40s → ~3-5 min → 60s cooldown
Wave 4: T+0s, T+20s, T+40s → ~3-5 min → synthesis

Total: ~15-25 minutes
Peak concurrent agents: 3 (never more)
CPU target: < 85% at all times

BEGIN NOW. LAUNCH WAVE 1.
```

## Visual Timeline

```
TIME    WAVE 1              WAVE 2              WAVE 3              WAVE 4
─────────────────────────────────────────────────────────────────────────────
0:00    [Agent 1: Data]
0:20    [Agent 2: Tech]
0:40    [Agent 3: KW]
        ...running...
~4:00   ✅ Wave 1 done
        ── 60s cooldown ──
5:00                      [Agent 4: Competitor]
5:20                      [Agent 5: Content]
5:40                      [Agent 6: Schema]
                          ...running...
~9:00                     ✅ Wave 2 done
                          ── 60s cooldown ──
10:00                                         [Agent 7: Backlink]
10:20                                         [Agent 8: Local]
10:40                                         [Agent 9: Perf/UX]
                                              ...running...
~14:00                                        ✅ Wave 3 done
                                              ── 60s cooldown ──
15:00                                                             [Agent 10: Analytics]
15:20                                                             [Agent 11: Code]
15:40                                                             [Agent 12: QA]
                                                                  ...running...
~19:00                                                            ✅ Wave 4 done
~20:00                                                            📊 MASTER REPORT
```
