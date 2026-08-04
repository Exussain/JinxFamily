# AntiGravity Persistent Memory

## Initial Memory

- **Project Core**: JinxFamily (جینکس فمیلی) is a live e-commerce site for digital game top-ups (Fortnite V-Bucks/Crew Pack, GTA6, LoL RP, ChatGPT/Gemini, gift cards). Django ASGI backend + Next.js App Router frontend monorepo.
- **Production Rules**:
  - All changes deploy directly to production on a live server under PM2.
  - After any frontend code changes, run `/root/jinxfamily/HardReload.sh` to compile/swap Next.js build and restart frontend.
  - Ensure only one `HardReload.sh` or `next build` child process is running. Terminate older processes first.
  - Verify changes on the live domain: `https://jinxfamily.ir`.
  - Log all changes in `frontend/CHANGELOG.md` in Persian (dated entries).
- **SEO & Frontend Constraints**:
  - Route params/searchParams are Promises in Next.js 16/React 19; they **MUST** be awaited.
  - Never use conditional rendering for SEO-critical content (descriptions, FAQs, tabs). Use HTML `hidden` or CSS `display: none` to keep content in DOM for crawlers.
  - styled-jsx does not scope JSX extracted to helper closures/methods. Keep JSX inline in the component's `return` statement.
  - Do not set `alternates.canonical` in the root layout `frontend/app/layout.js`. Set custom page-specific canonicals.
  - Page-specific schema/metadata are mandatory (e.g. structured JSON-LD built using `frontend/lib/seoJsonLd.mjs`).
  - Return real HTTP 404 via `notFound()` only when the backend API returns a 404. For server unreachable (0 status), render the client shell to avoid soft-404s/duplicates.
- **Core Web Vitals**:
  - Always reserve space for hero/above-the-fold images to prevent CLS. Use fixed aspect-ratio containers or explicit width/height.
  - Set `loading="eager"` + `fetchPriority="high"` on LCP images, and use `react-dom` `preload` in server components.
  - Do not swap layout post-hydration based on client state; use CSS media queries.
- **Pricing & Profit Guardrails**:
  - Reseller B2B portal pricing tracks live Lira/Toman rate via TGJU scraper.
  - Non-override (global) tiers scale with the live rate. Per-reseller override tiers are fixed in Toman (no scaling).
  - Profit guardrail is 12.5% for reseller pricing: `cost_toman = price_lira * lira_rate`, `ideal_min_price = round(cost_toman * 1.125 / 1000) * 1000`. Do not modify `1.125` without updating the profit percentage.

## User Preferences

- **Response Style**: Keep responses concise and use github-style markdown.
- **Verification**: Always verify affected pages on the live domain after deployment.
- **Links**: Always create clickable file links using standard markdown link syntax with `file://` scheme (e.g., `[filename](file:///path/to/file)` or `[ClassName](file:///path/to/file#L10-L20)`). Do not surround the link text with backticks.

## Project Context

- **Backend**: Django 4.2 project served by Uvicorn (ASGI) on port 8001 via `asgi_server.py`. Core Django app is `shop`.
- **Frontend**: Next.js 16 app served on port 3002 under PM2.
- **Database**: Overridden via `DJANGO_DB_PATH` in `backend/.env` pointing to `backend/db.sqlite3`.
- **APIs**:
  - `/api/products` (product list view)
  - `/api/cart/validate` (auth cart validation)
  - `/api/performance/vitals` (core web vitals telemetry)

## Important Decisions

- **Styling Segregation**: Avoid importing `globals.css` in public storefront routes to optimize LCP. Put shared lightweight styles in `performance.css`.
- **State Management**: `lib/useCart.js` uses a `CartProvider` Context persisting to localStorage (`jinxfamily_cart_v1`). No Redux or Zustand.

## Technical Notes

- **Next.js Params Awaiting**: Access properties after awaiting (e.g. `const { slug } = await params;`).
- **Unicode-safe Truncation**: Use `Array.from(str).slice(0, n).join('')` to avoid splitting surrogate pairs (emoji) when truncating metadata.
- **Xbox Verification Modal**: Confirmation shown for all completed orders in admin panel; includes skip option for non-Xbox orders.

## Reusable Prompts

- **SEO Master Prompt & Sub-Agent Batching Protocol**: Defined in [SEO_MASTER_PROMPT.md](file:///root/jinxfamily/docs/SEO_MASTER_PROMPT.md). Enforces launching 12 sub-agents in 4 WAVES of 3 agents each (20s delay between agent launches within a wave, 60s cooldown between waves, 5 min max timeout per agent) to prevent CPU/memory throttling and ensure wave dependency ordering.

## Commands and Snippets

### Frontend Commands
```bash
# Run frontend unit/browser tests
node --test lib/*.test.mjs components/*.test.mjs
# Build production bundle
npm run build
# Deploy to production (runs next build & pm2 restart)
./HardReload.sh
```

### Backend Commands
```bash
# Run Django tests
backend/.venv/bin/python manage.py test shop
# Restart django backend
pm2 restart jinxfamily-backend
```

### Image Crawler
```bash
# Run Bing images game cover downloader
python3 frontend/download_filtered_covers.py
```

## Top Markdown Workflows

### Workflow: README.md
- Purpose: Explain what the project is and how to use it.
- Common sections: Title, description, installation, usage, examples, license.
- Why useful: Makes the project easy to understand on GitHub.
- Notes: Keep it clear, short, and scannable.

### Workflow: ANTIGRAVITY_MEMORY.md
- Purpose: Maintain persistent AI assistant memory across chat sessions.
- Common sections: Initial Memory, User Preferences, Project Context, Decisions, Technical Notes, Prompts, Commands, Markdown Workflows, Updated Notes.
- Why useful: Prevents losing context and having the user repeat setup instructions or constraints.
- Notes: Never overwrite `## Initial Memory`. Keep updates under `## Updated Notes`.

### Workflow: CHANGELOG.md
- Purpose: Record dated history of changes, fixes, and features.
- Common sections: Version, date, list of changes categorized by type (Added, Fixed, Changed, Removed).
- Why useful: Helps developers and users track evolution and debug issues.
- Notes: In this project, write in Persian for frontend changes.

### Workflow: TODO.md
- Purpose: Keep track of pending tasks, backlog, and refactoring ideas.
- Common sections: Priority, categories (e.g. Frontend, Backend, Devops), completed tasks.
- Why useful: Organizes workflow and provides a quick status overview.
- Notes: Keep it dynamic and updated.

## Updated Notes

- **2026-07-21**: Persistent memory file initialized according to user specifications.
