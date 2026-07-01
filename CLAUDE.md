# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Keep this file current.** As the codebase evolves (new modules, changed conventions, new
> services/integrations, fixed quirks like the SQLite path note below), update the relevant section
> here in the same change — don't let it drift out of sync with the actual code.

## Project overview

NubixShop (نوبیکس شاپ) is a live, production Persian/Iranian e-commerce site selling digital
game top-ups and subscriptions (Fortnite V-Bucks/Crew Pack, GTA6, LoL RP, ChatGPT/Gemini, gift
cards, etc.). It is a Django REST-ish backend + Next.js (App Router) frontend monorepo, plus a
"reseller" (همکار) B2B portal, an AI support agent, and Telegram/Discord bot integrations. The
site is RTL Persian (`fa-IR`) throughout — UI copy, AI prompts, and the changelog are in Persian.

Both services run live under **pm2** on this box (`pm2 list` → `nubix-backend`, `nubix-frontend`).
Treat changes as deploying to production, not a sandbox.

## Repository layout

- `backend/` — Django 4.2 project (`nubixstore/` settings package + single `shop/` app). Served by
  Uvicorn (ASGI) via `asgi_server.py`, not `manage.py runserver`.
- `frontend/` — Next.js 16 (App Router, React 19) app, served by `next start` under pm2.
- `frontend/components/` is also configured as a separate additional working directory — expect to
  edit files there directly.
- `.agents/AGENTS.md` — legacy rules file (superseded by this CLAUDE.md, kept for reference).

## Commands

### Frontend (`frontend/`)

- `npm run dev` — dev server on port 3002 (Turbopack/webpack dev, all interfaces).
- `npm run build` — production build.
- `npm run deploy` — `next build && pm2 restart nubix-frontend` (same as the root `HardReload.sh`).
- **After any frontend code change, run `/root/NubixShop/public/HardReload.sh`** (builds and
  restarts the pm2 `nubix-frontend` process) so the change actually goes live, and log the change
  in `frontend/CHANGELOG.md` (Persian, dated entries — see existing entries for format/style).
- Tests are plain Node scripts using `node:assert/strict` (some also use `node:test`), colocated as
  `*.test.mjs` next to the module they cover (in `lib/` and `components/`). Run all of them with:
  `node --test lib/*.test.mjs components/*.test.mjs`
  Run a single test file directly: `node lib/currencyRates.test.mjs`.
- No lint script is configured in `package.json`.

### Backend (`backend/`)

- Use the project venv: `backend/.venv/bin/python` (Python 3.12). Activate it or prefix commands,
  e.g. `cd backend && .venv/bin/python manage.py <command>`.
- Run the dev/prod server the way pm2 does: `.venv/bin/python asgi_server.py` (Uvicorn on port
  8001; `manage.py runserver` is not the production path).
- Django tests: `.venv/bin/python manage.py test shop` (whole suite) or
  `.venv/bin/python manage.py test shop.tests.<TestClass>.<test_method>` for a single test.
  `shop/tests.py` mocks external services (Kavenegar SMS, etc.) — follow that pattern for new
  tests touching SMS/email/payment.
- After backend and frontend changes, restart the live process: `pm2 restart nubix-backend` (mirrors the
  frontend's HardReload flow; there's no separate script for it).
- Migrations: `.venv/bin/python manage.py makemigrations shop` / `migrate`.
- One-off Scripts: Run helper or one-off scripts in the virtualenv from the `backend/` directory, e.g., `.venv/bin/python scripts/send_reseller_congrats.py` or `.venv/bin/python scripts/send_test_notifications.py`.


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

CORS is hand-rolled in `nubixstore/middleware.py` (`CORSMiddleware`), not `django-cors-headers` —
allowed origins are a hardcoded set unioned with `DJANGO_CORS_ALLOWED_ORIGINS`. Update that set (not
just the env var) when adding a new trusted frontend origin, since the env var only extends it.

Database: `nubixstore/settings.py` hardcodes a Windows SQLite path as the literal default
(`C:\NubixData\db.sqlite3`) — a leftover from when this ran on Windows — but it's always overridden
via `DJANGO_DB_PATH` in `backend/.env`, which currently points at `backend/db.sqlite3` on this Linux
box. Don't "fix" the Windows-looking default; just be aware `.env` is what actually governs it. A
commented-out MySQL config block also exists in `settings.py` and is intentionally disabled.

### Frontend: Next.js App Router, no global state library

- `app/` — route segments under the App Router; most pages are `page.jsx` with a co-located
  `*Client.jsx` for client-side interactivity (e.g. `app/gta6/page.jsx` + `Gta6Client.jsx`).
  Notable route groups: `app/panel/admin` (admin dashboard), `app/panel/user`, `app/reseller/*`
  (separate reseller portal with its own `layout.jsx`/`reseller.css`), `app/blog`, `app/spin`.
- `components/` — shared React components (note: also reachable as its own working directory).
- `lib/` — framework-free helper modules (`.js`/`.mjs`), most with a sibling `*.test.mjs`. This is
  where business logic that needs to be unit-tested lives (currency parsing, product image
  resolution, crewpack display math, etc.) rather than inline in components.
- `lib/useCart.js` — the only client-side global state: a `CartProvider` React Context persisting
  to `localStorage` (`nubix_cart_v1`). There's no Redux/Zustand/etc.
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
- Notifications fan out across SMS (Kavenegar), email (Resend), Telegram bots (`backend/ai/`,
  `shop/telegram_channel_service.py`), and Discord (webhook + bot outbox tables in `views.py`) —
  changes to order-status flows often need to touch more than one of these.
