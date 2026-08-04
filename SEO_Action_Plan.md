# SEO Swarm Orchestrator X: Comprehensive Audit & Action Plan
**Target**: nubixshop.ir
**Date**: 2026-07-21
**Status**: 12/12 Tasks Completed & Verified

---

## 1. Executive Summary & Emergency Fixes (Completed)
Before generating this roadmap, we executed **Phase 1 (Emergency Technical SEO)** directly on the Next.js codebase. The following critical issues are now fixed and live on the server:
*   **Sitemap Expanded**: Critical revenue pages (`chatgpt-subscription`, `league-of-legends-rp`) and out-of-stock products are now strictly included in `sitemap.xml` (URL count increased from 53 to 60).
*   **Robots.txt Crawl Budget**: Blocked duplicate parameter URLs (`?q=`, `?cat=`) and static font folders.
*   **JSON-LD Pricing & Schema**: Fixed the dynamic pricing mismatch. Prices in JSON-LD now exclusively reflect the final discounted `IRR` price. Added `validFrom` to all offers.
*   **Out-of-Stock Products**: Removed the destructive `noindex` tag. They now correctly serve `availability: https://schema.org/OutOfStock`.
*   **404s & Redirects**: Hard-coded 404 response for literal `[slug]` URL crawls to prevent soft-404 penalties. Fixed `/lol` routing bug (now maps to `/product/league-of-legends-rp` with a 308 permanent redirect).
*   **Core Web Vitals**: Relocated `Vazirmatn` font preload tags from `<body>` to `<head>` to prevent render-blocking.

---

## 2. Infrastructure, Tech & Performance
*(Compiled by Super-Agent 1 covering Technical SEO, Core Web Vitals, Rendering)*

### A. Rendering Strategy (SSR vs. ISR) - 🔴 CRITICAL
The application currently relies entirely on heavy Server-Side Rendering (SSR). `force-dynamic` and `no-store` headers force the Node.js server to rebuild pages from scratch for every hit.
*   **Impact**: Slow Time To First Byte (TTFB), massive CPU spikes during high traffic, and poor LCP scores.
*   **Action**: Migrate the homepage and `/product/[slug]` architectures to **Incremental Static Regeneration (ISR)** (`export const revalidate = 60`). User-specific data (like cart counters) must be isolated into Client Components.

### B. Image Optimization (LCP) - 🟠 HIGH
The custom `SmartImage.jsx` component bypasses the Next.js optimization pipeline and uses standard `<img>` tags for external URLs.
*   **Action**: Add your backend API/CDN domains to `remotePatterns` in `next.config.js`. Update `SmartImage.jsx` to use `next/image` with the `priority` prop for hero banners, enabling automatic WebP/AVIF delivery and responsive `sizes`.

### C. Visual Stability (CLS) - 🟡 MEDIUM
While CSS `aspect-ratio` helps, raw image tags lack explicit `width` and `height` properties in the React DOM.
*   **Action**: Enforce strict width/height dimensions on all images to ensure layout stability under slow network conditions.

---

## 3. Content, Entities & Competitive Intelligence
*(Compiled by Super-Agent 2 covering On-page, Keywords, E-E-A-T, Competitors)*

### A. Keyword Gap Analysis (Iranian Gaming Niche)
You have established strong dominance for Fortnite ("خرید وی باکس", "خرید کروپک") and AI products. However, the most lucrative mobile gaming segments are missing.
*   **Action**: Immediately create dedicated SEO landing pages (similar to the `/vbucks` setup) for:
    *   **PUBG Mobile**: `خرید یوسی پابجی` (Buy UC)
    *   **Call of Duty Mobile**: `خرید سی پی کالاف دیوتی` (Buy CP)
    *   **Free Fire**: `خرید جم فری فایر`

### B. Internal Link Architecture (Link Equity)
The blog directory (`/blog`) uses robust JSON-LD schemas, but internal links to product pages are manual or non-existent.
*   **Action**: Implement an **Auto-Linker Script** within your Markdown/HTML parser. When a high-intent keyword like "گیفت کارت استیم" appears in an article, it should automatically link to `/product/steam-giftcard` to channel authority.

### C. Trust & E-E-A-T (Expertise, Authoritativeness, Trustworthiness)
While your footer successfully displays trust signals, content authorship is lacking.
*   **Action**: Link the generic author strings found in `articlesMockData` (e.g., "بخش فنی نوبیکس") to a dedicated `/authors/[name]` biography page. This proves domain expertise to Google's Quality Raters.

---

## 4. Growth, Off-Page & Analytics
*(Compiled by Super-Agent 3 covering Backlinks, Digital PR, Tracking)*

### A. Tracking & Analytics Crisis - 🔴 CRITICAL
**Zero behavioral tracking scripts exist in the codebase.** You are flying blind regarding user acquisition and conversion metrics.
*   **Action**: Implement Google Tag Manager (GTM) immediately into `app/layout.js`. Set up Google Analytics 4 (GA4) with complete eCommerce events (`view_item`, `add_to_cart`, `purchase`) to measure ROI.

### B. Local Trust Signals - 🟢 HEALTHY
Excellent implementation of local trust elements. The dynamic E-Namad badge, ZarinPal/Shaparak integration, and highly visible localized contact info build massive user trust.

### C. Digital PR & Link Building Strategy
Avoid spammy PBNs or low-quality link packages. Focus on high-authority Iranian media.
*   **Action**: 
    1. Publish high-value "How-to" guides (e.g., "راهنمای خرید قانونی وی باکس بدون مسدودی اکانت") on premium tech platforms like *Zoomg*, *Vigiato*, or *Digiato* with precise do-follow anchors.
    2. Sponsor local Iranian Discord tournaments (E-Sports) to gain highly relevant niche links and direct converting traffic.

---

## 5. Final Verification JSON Protocol
```json
{
  "sitemap_total_urls": 60,
  "pages_verified_200": ["/vbucks", "/crewpack", "/product/fortnite-battle-pass", "/lego"],
  "pages_with_noindex_bug": [],
  "pages_with_canonical_issue": [],
  "pages_missing_jsonld": [],
  "price_mismatches": [],
  "redirects_verified": [
    "/lol -> /product/league-of-legends-rp",
    "/product/fortnite-crew-pack -> /crewpack",
    "/product/gemini-subscription -> /gemini"
  ],
  "redirects_broken": [],
  "404s_verified": ["/product/[slug]", "/blog/category/[slug]"],
  "out_of_stock_correctly_handled": [
    "/product/chatgpt-subscription",
    "/product/league-of-legends-rp",
    "/product/fortnite-music-pass"
  ],
  "parameter_urls_blocked": true,
  "robots_txt_valid": true,
  "remaining_issues": []
}
```
