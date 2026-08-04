# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Keep this file current.** As the codebase evolves (new modules, changed conventions, new
> services/integrations, fixed quirks like the SQLite path note below), update the relevant section
> here in the same change — don't let it drift out of sync with the actual code.

## Project overview

JinxFamily (جینکس فمیلی) is a live, production Persian/Iranian e-commerce site selling digital
game top-ups and subscriptions (Fortnite V-Bucks/Crew Pack, GTA6, LoL RP, ChatGPT/Gemini, gift
cards, etc.). It is a Django REST-ish backend + Next.js (App Router) frontend monorepo, plus a
"reseller" (همکار) B2B portal, an AI support agent, and Telegram/Discord bot integrations. The
site is RTL Persian (`fa-IR`) throughout — UI copy, AI prompts, and the changelog are in Persian.

Both services run live under **pm2** on this box (`pm2 list` → `jinxfamily-backend`, `jinxfamily-frontend`).
Treat changes as deploying to production, not a sandbox.

## Repository layout

- `backend/` — Django 4.2 project (`jinxfamily/` settings package + single `shop/` app). Served by
  Uvicorn (ASGI) via `asgi_server.py`, not `manage.py runserver`.
- `frontend/` — Next.js 16 (App Router, React 19) app, served by `next start` under pm2.
- `frontend/components/` is also configured as a separate additional working directory — expect to
  edit files there directly.
- `.agents/AGENTS.md` — legacy rules file (superseded by this CLAUDE.md, kept for reference).

## Commands

### Frontend (`frontend/`)

- `npm run dev` — dev server on port 3002 (Turbopack/webpack dev). **When working in `/root/NubixShop/public`, run the server in dev mode (`npm run dev`) during active development instead of running `HardReload.sh` on every change.**
- `npm run build` — production build.
- `npm run deploy` — `next build && pm2 restart jinxfamily-frontend` (same as the root `HardReload.sh`).
- **After any frontend code change, run `/root/jinxfamily/public/HardReload.sh`** (builds and
  restarts the pm2 `jinxfamily-frontend` process) so the change actually goes live, and log the change
  in `frontend/CHANGELOG.md` (Persian, dated entries — see existing entries for format/style).
- Tests are plain Node scripts using `node:assert/strict` (some also use `node:test`), colocated as
  `*.test.mjs` next to the module they cover (in `lib/` and `components/`). Run all of them with:
  `node --test lib/*.test.mjs components/*.test.mjs`
- No lint script is configured in `package.json`.
- **Image Downloader Tools**: Located in the `frontend/` directory (specifically `download_filtered_covers.py`). Run `python3 download_filtered_covers.py` to search for and download official, non-AI brand logos (such as Xbox, Steam, PlayStation) and game covers using search engine image search scraping with query parameters and keyword filters to prevent AI-generated results.


### Backend (`backend/`)

- Use the project venv: `backend/.venv/bin/python` (Python 3.12). Activate it or prefix commands,
  e.g. `cd backend && .venv/bin/python manage.py <command>`.
- Run the dev/prod server the way pm2 does: `.venv/bin/python asgi_server.py` (Uvicorn on port
  8001; `manage.py runserver` is not the production path).
- Django tests: `.venv/bin/python manage.py test shop` (whole suite) or
  `.venv/bin/python manage.py test shop.tests.<TestClass>.<test_method>` for a single test.
  `shop/tests.py` mocks external services (Kavenegar SMS, etc.) — follow that pattern for new
  tests touching SMS/email/payment.
- After backend and frontend changes, restart the live process: `pm2 restart jinxfamily-backend` (mirrors the
  frontend's HardReload flow; there's no separate script for it).
- Migrations: `.venv/bin/python manage.py makemigrations shop` / `migrate`.
- One-off Scripts: Run helper or one-off scripts in the virtualenv from the `backend/` directory, e.g., `.venv/bin/python scripts/send_reseller_congrats.py` or `.venv/bin/python scripts/send_test_notifications.py`.
- Discord Bot: Managed via systemd service. Restart and tail logs using `systemctl restart jinxfamily-discord` / `journalctl -u jinxfamily-discord -f`. Code and documentation are located in `/root/jinxfamily/`.


## Architecture

### Backend: one big `shop` app, plain Django views

There's no DRF — every endpoint in `shop/urls.py` maps to a plain function view (mostly in
`shop/views.py`, ~7k lines) decorated with `@csrf_exempt` and doing manual `json.loads(request.body)`
+ `JsonResponse`. Domain logic is split into sibling modules that `views.py`/`urls.py` import from:

- `shop/views.py` — core shop: products, orders, auth (session-based, phone/OTP and password),
  payments, admin CRUD endpoints (`admin_*`), Discord webhook bridge, currency rates.
- `shop/reseller_views.py` (~2.7k lines) — the entire reseller (همکار) B2B subsystem: token-based
  auth (`X-Reseller-Token` style, hashed tokens via `_hash_token`), catalog pricing per tier,
  wallet, settlement, Lira-rate-pegged Fortnite crew pack pricing. This is a parallel auth system
  to the main session auth — don't conflate `_is_admin_user`/session auth with reseller token auth.
- `shop/spin_views.py` + `shop/spin_telegram.py` + `shop/rewards.py` — the "spin wheel" rewards
  game and points/referral system.
- `shop/chat_views.py` — live chat (user + admin) with media upload.
- `shop/ai_support.py` / `shop/ai_playground.py` / `shop/product_ai.py` — the AI customer-support
  agent. The live system prompt is mirrored for humans in `shop/ai_system_prompt.md` (Persian) —
  **update that file whenever `SYSTEM_PROMPT` in `ai_support.py` changes**, they're meant to stay
  in sync.
- `shop/blog_views.py` — blog/article endpoints (`BlogCategory`, `Article` models).
- `shop/email_service.py` (Resend), `shop/kavenegar_service.py` (SMS/OTP), `shop/zarinpal_service.py`
  (payment gateway), `shop/telegram_channel_service.py` — external integrations, each isolated in
  its own service module rather than inlined in views.
- `shop/models.py` — all models live in one file (`Product`, `Order`/`OrderItem`/
  `OrderItemAccount`, `ResellerProfile`/`ResellerWalletTxn`/`ResellerPriceTier`, `XboxAccount`,
  `DiscordTicketChannel`/`Message`, `LiveChatSession`/`Message`, `SpinResult`, `Referral`,
  `BlogCategory`/`Article`, etc.).

Auth model: two independent systems coexist —
1. **Customer/admin auth** — Django session auth (`SESSION_COOKIE_SAMESITE='None'`, 31-day
   sessions). Admin-ness is `_is_admin_user()`: staff flag, `profile.tier == "admin"`, or phone in
   `ADMIN_PHONE_WHITELIST` — not Django permissions/groups.
2. **Reseller auth** — opaque bearer token issued by `reseller_auth_token`, stored hashed, checked
   per-request in `reseller_views.py`. Completely separate from the session cookie flow.

CORS is hand-rolled in `jinxfamily/middleware.py` (`CORSMiddleware`), not `django-cors-headers` —
allowed origins are a hardcoded set unioned with `DJANGO_CORS_ALLOWED_ORIGINS`. Update that set (not
just the env var) when adding a new trusted frontend origin, since the env var only extends it.

Database: `jinxfamily/settings.py` hardcodes a Windows SQLite path as the literal default
(`C:\JinxFamilyData\db.sqlite3`) — a leftover from when this ran on Windows — but it's always overridden
via `DJANGO_DB_PATH` in `backend/.env`, which currently points at `backend/db.sqlite3` on this Linux
box. Don't "fix" the Windows-looking default; just be aware `.env` is what actually governs it. A
commented-out MySQL config block also exists in `settings.py` and is intentionally disabled.

### Frontend: Next.js App Router, no global state library

- `app/` — route segments under the App Router; most pages are `page.jsx` with a co-located
  `*Client.jsx` for client-side interactivity (e.g. `app/gta6/page.jsx` + `Gta6Client.jsx`;
  `app/product/[slug]/page.jsx` is a server component that pre-fetches the product and renders
  `ProductPageClient.jsx` so crawlers get full product HTML). Notable route groups:
  `app/panel/admin` (admin dashboard), `app/panel/user`, `app/reseller/*` (separate reseller
  portal; `layout.jsx` is a thin server layout for metadata wrapping `ResellerLayoutClient.jsx`),
  `app/blog` (+ RSS at `app/blog/feed.xml/route.js`), `app/spin`, `app/category/[code]`
  (SEO category landings driven by `/api/categories`).
- SEO conventions: the root `app/layout.js` must NOT set `alternates.canonical` (App Router
  inherits it into every child route — this once canonicalized the whole blog/FAQ to the
  homepage); every indexable page declares its own canonical. Shared JSON-LD builders live in
  `lib/seoJsonLd.mjs` (Product/AggregateOffer/Breadcrumb/FAQ). Legacy `/product/*` twins of the
  dedicated landing pages (v-bucks, gta6, fortnite-crew-pack, gemini-subscription,
  lego-starter-pack) permanently redirect in `next.config.js` and are excluded from
  `app/sitemap.js` — keep redirects, sitemap, and `ProductCard`/`HeroSlider` link maps in sync
  when adding another dedicated landing page. Persian product slugs must be decoded once via
  `lib/productSlug.mjs` before API fetches (double-encoding returns 404s).
- `components/` — shared React components (note: also reachable as its own working directory).
- `lib/` — framework-free helper modules (`.js`/`.mjs`), most with a sibling `*.test.mjs`. This is
  where business logic that needs to be unit-tested lives (currency parsing, product image
  resolution, crewpack display math, etc.) rather than inline in components.
- `lib/useCart.js` — the only client-side global state: a `CartProvider` React Context persisting
  to `localStorage` (`jinxfamily_cart_v1`). There's no Redux/Zustand/etc.
- `lib/serverFetch.mjs` — SSR fetch helper (`fetchApiJson`) that tries internal/loopback API bases
  before the public domain, because the prod box can't always reach its own public hostname
  (hairpin NAT / Cloudflare). Use this (or mirror its fallback chain) for any new server-component
  data fetching instead of fetching the public URL directly.
- `proxy.js` (Next.js middleware) — handles cross-cutting routing concerns: redirects the
  `vip-reseller` host straight into `/reseller`, gates `/panel/admin/*` behind a server-side
  `/api/auth/me` admin check (with cache-busting redirect dance via `ADMIN_PANEL_CACHE_BUSTER`),
  and sets cache headers for the auth pages.
- `next.config.js` — rewrites `/api/*` to the local backend (`http://127.0.0.1:8001`); also defines
  per-route `Cache-Control` headers. Read the inline comments before changing cache headers for
  `/checkout`, `/crewpack`, `/vbucks`, `/lego`, `/gemini`, or `/reseller/*` — there's a documented
  prior incident where `Clear-Site-Data: "cache"` wiped immutable `_next/static` chunks mid-session
  and broke styling/performance for those high-traffic pages; `noStore` (without `Clear-Site-Data`)
  is intentional there.
- API calls from the frontend go through `/api/*` (rewritten to the Django backend per above), so
  client components can just `fetch('/api/...')` without worrying about the backend's actual host.

### Cross-cutting

- Money/pricing: Fortnite Crew Pack and reseller pricing are pegged to a live Lira/Toman rate
  (`shop/views.py` `_parse_tgju_currency_rates` scrapes tgju.org; mirrored test helper in
  `frontend/lib/currencyRates.mjs`). Reseller tier pricing (`_crew_pricing_config`,
  `_crew_unit_price_for_quantity`) recomputes off that live rate — don't assume prices are static.

### Reseller Pricing Architecture (critical — read before touching pricing)

**Lira-priced products vs. fixed-price products:**
- Any product with `price_lira > 0` is treated as "lira-priced" by the reseller catalog
  (`reseller_catalog` at `reseller_views.py:900`) and order pricing (`_price_for_quantity` at
  line 1016).
- For **global tiers** (reseller_id=NULL): the price displayed in the catalog is scaled by the live
  lira rate: `_round_toman(tier.price × lira_rate / ref_rate)`. This means the admin's raw tier
  price in the database ≠ what resellers see in their catalog.
- For **per-reseller override tiers** (reseller_id set): the price is used AS-IS — no lira scaling.
  This is intentional: overrides are fixed Toman prices that don't fluctuate with lira.
- The admin pricing editor (`ResellerPricingEditor.jsx`) shows RAW database prices, NOT scaled
  prices. A notice warns the admin about lira scaling for non-crew lira-priced products in global
  mode.

**Smart pricing analysis (12.5% profit guardrail):**
- `GET /api/admin/reseller-tiers?product_id=X` returns `cost_toman`, `ideal_min_price`, `profit_pct`
  for lira-priced products. Formula: `cost_toman = product.price_lira × lira_rate`, then
  `ideal_min_price = round(cost_toman × 1.125 / 1000) × 1000`.
- The frontend shows a smart pricing panel with per-tier ✅/⚠️ status comparing each tier's price
  to the ideal minimum.
- For products with variants (like VBucks), variant-specific `price_lira` is used (from
  `ProductVariant.original_price` field).
- **DO NOT change `1.125` without updating the displayed `profit_pct` to match.**

**VBucks variants:**
- VBucks (product id=3, slug=v-bucks) has 4 variants with different `original_price` (lira cost):
  800 V-Bucks: 190₺, 2400 V-Bucks: 485₺, 4500 V-Bucks: 780₺, 12500 V-Bucks: 1898₺.
- Each variant can have independent pricing tiers. The admin pricing editor has a variant selector
  dropdown. When a variant is selected, `variant_id` is passed to all tier API calls.
- The backend `admin_reseller_tiers` accepts `?variant_id=X` and returns variant-specific
  `cost_toman`/`ideal_min_price`.

**TierStepChart slider behavior:**
- `TierStepChart.jsx` `scaleMax` is frozen during pointer drags to prevent other bars from visually
  shifting. It recalculates when the drag ends.
- Price rounding during drag: `roundToStep(price, DRAG_ROUND_STEP=1000)` rounds to nearest 1,000
  Toman. But the number input field bypasses this rounding — admins can type exact prices.

**Key API endpoints for pricing:**
| Endpoint | Method | Purpose |
|---|---|---|
| `/api/admin/reseller-tiers?product_id=X` | GET | Load global tiers + lira rate + smart pricing data |
| `/api/admin/reseller-tiers?product_id=X&reseller_id=Y` | GET | Load per-reseller override tiers |
| `/api/admin/reseller-tiers/upsert` | PUT | Save tiers (global or per-reseller) |
| `/api/admin/reseller-tiers/clear-override` | POST | Remove per-reseller override |
| `/api/admin/reseller-tiers/overrides-summary` | GET | List which resellers/products have overrides |
| `/api/reseller/catalog` | GET | Reseller-facing catalog with computed prices |

- Notifications fan out across SMS (Kavenegar), email (Resend), Telegram bots (`backend/ai/`,
  `shop/telegram_channel_service.py`), and Discord (webhook + bot outbox tables in `views.py`) —
  changes to order-status flows often need to touch more than one of these.


## Image Crawler & Downloader Scripts

The repository includes a suite of image scraping and downloading tools located in the `frontend/` directory. These are used to populate game covers and official brand logos (such as Xbox, Steam, PlayStation) under `frontend/public/images/games/`.

### 1. Primary Downloader: [download_filtered_covers.py](file:///root/jinxfamily/frontend/download_filtered_covers.py)
* **Purpose**: Fetches game covers/logos for all 12 supported games with high relevance.
* **Mechanism**:
  * Scrapes **Bing Images** (`https://www.bing.com/images/search`) by extracting image URLs from the JSON payload in the `m` attribute (`murl` key) of `<a>` tags with the `iusc` class.
  * **Keyword Filtering**: Matches the extracted image URLs against a strict whitelist of game-specific keywords (e.g., `["fortnite", "fn"]` for a Fortnite query) to avoid downloading irrelevant, fan-made, or AI-generated results. If no URL passes the filter, it falls back to the unfiltered search list.
* **Usage**:
  ```bash
  python3 frontend/download_filtered_covers.py
  ```

### 2. Play Store & Wikimedia Fallback: [download_correct_covers.py](file:///root/jinxfamily/frontend/download_correct_covers.py)
* **Purpose**: Downloads exact app icons for mobile games.
* **Mechanism**:
  * Queries the **Google Play Store** detail pages (`https://play.google.com/store/apps/details?id={package_id}`) using `BeautifulSoup`.
  * Scrapes `<img alt="Icon image">` or `<img itemprop="image">` elements and replaces the resolution parameter suffix (e.g., changing `=w...` to `=w512-h512`) to get high-quality 512x512 icons.
  * Downloads console/PC store logo files (Xbox, PlayStation, Steam, Fortnite) from hardcoded official Wikimedia or CDN URLs.
* **Usage**:
  ```bash
  python3 frontend/download_correct_covers.py
  ```

### 3. Google Images Retro Scraper: [test_google_retro.py](file:///root/jinxfamily/frontend/test_google_retro.py) & [inspect_google_html.py](file:///root/jinxfamily/frontend/inspect_google_html.py)
* **Purpose**: Prototypes/tests for scraping Google Images without executing JavaScript.
* **Mechanism**:
  * Sends requests to Google Image search using a classic **Internet Explorer 6** User-Agent: `"Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1)"`.
  * This forces Google to bypass its modern, JS-heavy client-side interface and return a lightweight, table-based retro HTML layout.
  * Extracts raw image source URLs embedded inside standard `href` parameters formatted as `/imgres?imgurl=<URL>&...` via BeautifulSoup and regular expressions.

### 4. Bing Scraper Prototypes: [test_bing_images.py](file:///root/jinxfamily/frontend/test_bing_images.py) & [download_verified_covers.py](file:///root/jinxfamily/frontend/download_verified_covers.py)
* **Purpose**: Earlier versions of the Bing Image search downloader.
* **Mechanism**: Scrapes Bing Images without the keyword verification filters. [download_verified_covers.py](file:///root/jinxfamily/frontend/download_verified_covers.py) attempts to fetch the first few search results, but is more prone to downloading incorrect or spammy images compared to [download_filtered_covers.py](file:///root/jinxfamily/frontend/download_filtered_covers.py).

### 5. Static URL Check: [test_image_urls.py](file:///root/jinxfamily/frontend/test_image_urls.py)
* **Purpose**: Sends `HEAD` requests to verify that the official game/console brand CDN and Wikimedia logos are still online and accessible.


## Rules to Prevent Regressions & SEO Guidelines

To avoid repeating previous critical bugs and regressions, always adhere to these rules:

### Next.js & Frontend SEO
- **Next.js 16 Params**: In Next.js 16/React 19, route `params` and `searchParams` are Promises. They **MUST** be awaited before accessing their properties (e.g., `const { slug } = await params;` or `const slug = (await params).slug`).
- **Conditional Rendering vs. CSS Hidden**: Never conditionally render (`{activeTab === 'desc' && <Description />}`) SEO-critical content like product descriptions, FAQs, or support tabs. Instead, mount all tabs/contents in the DOM and toggle their visibility using the HTML `hidden` attribute or CSS `display: none` (`.hidden`). This ensures search crawlers can index the entire page content.
- **styled-jsx only scopes JSX in the same function as its `<style jsx>` tag**: JSX moved into a `const x = (…)` or a `renderX()` helper does NOT receive the scoping `jsx-<hash>` class, so the component's `<style jsx>` rules silently don't apply to it (it renders unstyled). Keep JSX that relies on a `<style jsx>` block inline in that component's `return` — don't factor tab bodies/sections into helper closures. If you must extract, use `<style jsx global>` with every selector prefixed by a page-unique root class (e.g. `.user-shell .card {…}`). This bit the `/panel/user` rebuild (2026-07-07) — the hero/tab-bar (in `return`) were styled while the tab panels (in closures) were not. Verify by grepping the built chunk in `.next/static/chunks/` for `className:"<class>"` with no `jsx-` prefix.
- **Root Layout Canonical**: Never set `alternates.canonical: '/'` in the root layout (`frontend/app/layout.js`). Doing so causes child pages (blog, FAQ, products) to inherit this and canonicalize to the homepage, de-indexing them from Google. Each page must specify its own unique canonical URL.
- **Page-Specific Meta & Schema (JSON-LD)**: 
  - Every public page (including `/vbucks`, `/crewpack`, `/gta6`, `/lego`, `/gemini`, and dynamic products/blog pages) must have custom metadata (title, description, canonical link, `og:image` representing the actual product, and Twitter card).
  - Use structured JSON-LD schemas constructed with `frontend/lib/seoJsonLd.mjs` (e.g., `Product`, `AggregateOffer`, `BreadcrumbList`, `FAQPage`, `BlogPosting`).
- **Home Page SEO & LCP**:
  - The home page includes an SEO text block (~200 words) + 5 FAQ `<details>` elements at the bottom, using keyword-rich internal links.
  - Optimize LCP (Largest Contentful Paint) for above-the-fold images: the first image/slider should not be lazy-loaded and must use `fetchPriority="high"` (or `priority` prop). Minimize preloads for other images.
- **Pagination**: Use standard crawlable links (e.g. `?page=X` or dedicated canonical paths) instead of purely client-side filtering state so search crawlers can discover all paginated pages (e.g. blog page 2).
- **Navigation Links**: Do not use query-param links like `?cat=` or non-canonical paths in the Navbar or Footer. Always use clean canonical paths and keyword-rich anchor texts.
- **Noindex for Panels**: Always set `noindex` metadata for the user/admin panels (e.g. in `frontend/app/panel/layout.jsx`) and disallow private dashboard paths in `robots.js` (while keeping public reseller pages like `/reseller` and `/reseller/apply` crawlable).
- **Real 404s, never soft-404s**: Dynamic routes (`/product/[slug]`, `/blog/[slug]`) must return
  HTTP 404 via `notFound()` when the backend API says the resource doesn't exist. Serving a 200
  "loading/empty" shell for a missing product made Google flag dozens of removed products as
  soft-404s/duplicates and keep recrawling them. Use `fetchApiJsonWithStatus` from
  `lib/serverFetch.mjs` and only call `notFound()` when `status === 404` — when the backend is
  merely unreachable (`status === 0`), render the client shell instead so a transient outage never
  404s live products.
- **Removing a product from the catalog** takes more than deleting the DB row. Checklist:
  (1) delete/deactivate in backend; (2) remove the slug from frontend hardcoded lists —
  `app/page.js` priority slugs, `lib/placeholderFeatured.js`, `lib/productDescriptions.js`,
  `lib/productImageHelpers.js` `STATIC_IMAGE_MAP`, `components/CategoriesSection.jsx`
  `categoryData`, and any category description in `backend/shop/categories.py` that advertises it;
  (3) update `lib/heroSliderItems.test.mjs` fixtures; (4) let the URL 404 (correct signal for
  removed content — do NOT redirect it to the homepage, Google treats that as a soft-404);
  (5) the sitemap self-heals (it lists live API products only).
- **Legacy URL redirects** live in `next.config.js` `redirects()`: old WordPress-era paths
  (`/products/*`, `/orders`, `/index.php`, `/feed`, `/manifest.json`) and former alias pages
  (`/contact`, `/privacy`, `/guide`, `/terms` → `/faq/*`) 308 to their live equivalents. Only add a
  redirect when a genuinely equivalent target exists; otherwise let it 404. Never re-create alias
  routes that duplicate another page's content with a canonical tag — redirect instead.
- **Unicode-safe truncation**: Product/blog descriptions are full of emoji (surrogate pairs).
  Never truncate them with `.slice(0, n)`/`.substring(0, n)` for meta descriptions or JSON-LD —
  a split pair produces a lone surrogate and Google reports "Truncated Unicode character" (invalid
  structured data). Truncate on code points: `Array.from(str).slice(0, n).join('')` (see
  `truncateChars` in `app/product/[slug]/layout.jsx`).
- **Product JSON-LD offers are mandatory**: A `Product` without `offers` (or review/aggregateRating)
  is invalid for rich results. Both emitters — `app/product/[slug]/layout.jsx` (inline) and
  `lib/seoJsonLd.mjs` `buildProductJsonLd` (used by `/crewpack`, `/vbucks`) — fall back to the
  cheapest variant price when the product-level price is 0, and every Offer/AggregateOffer must
  carry `hasMerchantReturnPolicy` and `shippingDetails` (digital goods: non-returnable, 0-cost
  instant delivery) or Google Merchant flags them. Keep the two emitters' fields in sync when
  changing either.

### Core Web Vitals (mobile CLS/LCP — learned from CrUX "poor" reports)
- **Reserve space for hero images**: The #1 CLS killer (CLS=1.0 on product pages) was a hero
  `<img>` with no reserved box — it painted at 0px height and pushed the whole viewport down when
  decoded. Every above-the-fold image needs either `width`/`height` attributes or a container with
  a fixed `aspect-ratio` (+ `object-fit: contain`) — see the `/crewpack`, `/vbucks`, and
  `/product/[slug]` heroes (all use the reserved-square pattern).
- **LCP images must be eager AND high-priority**: `components/SmartImage.jsx`'s `eager` prop sets
  `loading="eager"` + `fetchPriority="high"` (and `priority` on the next/image branch) — pass
  `eager` on every above-the-fold hero. For server components, also `preload(imageUrl, { as:
  "image", fetchPriority: "high" })` from `react-dom` so the download starts from the `<head>`
  (see `app/crewpack/page.jsx`). Never leave an LCP image `loading="lazy"`.
- **No post-hydration layout swaps**: Anything that renders differently on mobile vs desktop must
  decide via CSS media queries, not `matchMedia`/`useEffect` state — the SSR HTML would show one
  variant and swap after hydration (CLS). `components/PlatformSelector.jsx` renders BOTH controls
  and lets `globals.css` (680px breakpoint) pick one. Same principle for content that depends on a
  client fetch: pass server-fetched data down (e.g. crewpack passes `initialStats` so the rating
  chip is in the SSR HTML instead of popping in).
- **Static image caching**: `/products/*`, `/categories/*`, `/media/*`, `/icons/*` and the logo are
  served with `max-age=86400, stale-while-revalidate=604800` via `next.config.js` `headers()` —
  NOT `immutable`, because static images get replaced in place under the same filename. Don't
  remove these rules (images were previously `max-age=0`, adding a revalidation round-trip to
  every LCP), and don't add `Clear-Site-Data` anywhere (see the documented incident above).

### UI/UX & Themes
- **Select Option Colors**: In dark mode, ensure option elements inside selects have a dark background and light text (via `:root[data-theme="dark"] select option` or similar).
- **Sub-navbar vs Main Navbar**: Do not make the sub-navbar absolute; keep it clean with `space-between` and only apply custom width limits/paddings on it, keeping the main navbar full-width.

### App flows
- **Xbox Verification Modal**: In `frontend/app/panel/admin/page.jsx`, the Xbox confirmation modal is shown for **ALL** orders upon completion (not just those with `xbox_create_account`). A red "This is not an Xbox activation" button is provided to easily skip and complete non-Xbox orders.
- **Reseller Registration**: Public reseller registration at `POST /api/reseller/signup` (frontend `/reseller/apply`) creates reseller accounts in a `draft` status, issuing a one-time token. Once the reseller goes through onboarding, their status becomes `pending_review`. Users with `pending_review` status are redirected to the queue page `/reseller/pending` when logging in.
- **Optional Registration Avatar**: During OTP registration, users can choose standard emoji/canvas-rendered avatars (via `frontend/lib/avatarImage.mjs`) or upload a custom image. If they do not interact, it remains optional (no upload). If selected, the avatar is uploaded to `POST /api/me/avatar` post-signup.
- **Maintenance Mode**: The `MAINTENANCE_MODE` flag in `frontend/proxy.js` toggle serves a 503 status code and is built using static assets in `frontend/public/maintenance/`. When disabling, toggle it back to `false` and run `HardReload.sh`.
- **Lazy Skill Activation (Progressive Disclosure)**: Skills in `.agents/skills/` and `~/.gemini/antigravity-cli/skills/` are registered lazily via YAML frontmatter (`name` + `description`). Agents load full skill instructions via `view_file` only on demand when relevant user tasks are requested, preventing context window bloat.


