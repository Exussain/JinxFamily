# Public UI — Further Development Notes

Updated: 2026-07-20

This document is the handoff for improving the public storefront UI without undoing the mobile-performance overhaul.

## Current state

The public funnel is live on `https://jinxfamily.ir` and now uses server-rendered content with small client-side interaction islands.

Current three-run mobile Lighthouse medians:

| Route | Score | LCP | TBT | CLS | Transfer | Requests |
|---|---:|---:|---:|---:|---:|---:|
| `/` | 77 | 3.64 s | 441 ms | 0.000 | 331 KB | 30 |
| `/products` | 88 | 2.25 s | 459 ms | 0.000 | 342 KB | 24 |
| `/product/chatgpt-subscription` | 74 | 4.02 s | 498 ms | 0.000 | 288 KB | 23 |
| `/checkout` | 75 | 3.85 s | 539 ms | 0.000 | 253 KB | 22 |

Transfer size, request count, initial JavaScript, CSS, and CLS budgets pass. Lighthouse score, LCP, and TBT still need improvement on several routes.

## Architecture to preserve

### Public styling

- `frontend/app/performance.css` is the small public-funnel stylesheet.
- `frontend/app/globals.css` is the large legacy stylesheet. It is loaded only by legacy/specialized route layouts.
- Do not import `globals.css` from the root layout again. That would add roughly 48 KB compressed CSS and more than 13,000 lines of CSS parsing to every public route.
- Put new homepage, catalog, shared navigation, shared footer, and lightweight public styles in `performance.css` or a route-specific stylesheet.
- Product-detail styles live in `frontend/app/product/[slug]/product.css`.
- Checkout styles live in `frontend/app/checkout/checkout.css`.

### Server-first rendering

Keep these as server components:

- `frontend/app/page.js`
- `frontend/app/products/page.jsx`
- `frontend/app/category/[code]/page.jsx`
- `frontend/app/product/[slug]/page.jsx`
- `frontend/components/Navbar.jsx`
- `frontend/components/Footer.jsx`
- `frontend/components/StaticProductCard.jsx`

Do not add `"use client"` to these files for presentation-only features. Create a small neighboring client component for genuine interaction.

Existing interaction islands include:

- `frontend/components/navigation/*Island.jsx`
- `frontend/app/product/[slug]/ProductPurchaseIsland.jsx`
- `frontend/app/product/[slug]/DeferredProductReviews.jsx`
- `frontend/app/AudioTrigger.jsx`
- `frontend/components/DeferredWidgets.jsx`
- `frontend/components/DeferredTelemetry.jsx`

### Cart boundaries

- The root layout intentionally does not wrap the full application in `CartProvider`.
- The navigation cart reads and updates `jinx_cart_v1` directly in `navigation/CartIsland.jsx`.
- Purchase routes mount `CartProvider` only around the controls that require it.
- Do not restore a root-level client provider around all page content. It can cause large server-rendered sections to participate in hydration and delay LCP.
- Cached listing prices are reconciled through `POST /api/cart/validate`; checkout and cart behavior must continue using authoritative server pricing.

### Images and fonts

- Use `next/image` with explicit width, height, and an accurate `sizes` value.
- Only the actual above-the-fold LCP image should use `priority`.
- Mobile product cards intentionally use compact 96 px thumbnails.
- The generic mobile product hero intentionally uses a 120 px image to avoid making a large image the LCP element.
- Mobile uses the system font. Kalameh loads only above 720 px. Restoring Kalameh on mobile adds a font download and can cause a late LCP repaint.
- Avoid separate image variants that make the logo download more than once.

## Good places to improve the UI

### 1. Refine the visual system

Define a compact token layer in `performance.css` for:

- spacing scale;
- surface elevations;
- border radii;
- type sizes and line heights;
- primary, success, warning, and destructive states;
- focus rings;
- desktop-only shadows and gradients.

The current public UI is intentionally simple and can be made more polished without adding JavaScript.

### 2. Improve product-card hierarchy

The mobile cards are optimized for performance but visually basic. Safe improvements include:

- stronger title/price hierarchy;
- category or availability badges;
- a better compact thumbnail treatment;
- consistent button height;
- clearer discount and original-price presentation;
- desktop hover states behind `(hover: hover) and (pointer: fine)`.

Keep the mobile cards one column with small thumbnails unless measurements prove a larger image does not regress LCP.

### 3. Improve the homepage composition

The homepage hero, category shortcuts, product cards, perks, and SEO/FAQ are server-rendered. They can be visually redesigned with CSS and static markup.

Recommended direction:

- retain the short mobile hero;
- improve typography and whitespace;
- use one recognizable Jinx visual on desktop;
- keep the mascot hidden on mobile;
- make category shortcuts easier to scan;
- add subtle static background shapes instead of blur-heavy animated layers.

Avoid canvas, continuous particles, animated glow fields, autoplay media, and above-the-fold carousels.

### 4. Improve product-detail purchase UX

The generic product route now separates server content from `ProductPurchaseIsland`.

Useful improvements:

- clearer selected-variant state;
- better field descriptions and validation messages;
- an order/delivery summary next to the final price;
- accessible show/hide password behavior;
- stronger add-to-cart confirmation;
- optional sticky purchase action on mobile, implemented inside the existing purchase island.

Do not move the description, FAQ, related cards, or product header into the client island.

### 5. Simplify checkout further

Checkout is still a large client component and remains one of the biggest performance opportunities.

Recommended next refactor:

1. Render the checkout heading and empty-cart state on the server.
2. Split each active step into its own client component.
3. Import authentication, CAPTCHA, payment-specific UI, discount/reward UI, and optional panels only when needed.
4. Keep a fixed-size account-status row to preserve the current CLS of `0.000`.
5. Avoid adding content above `.checkout-grid` after hydration.

### 6. Navigation and footer polish

- Keep the desktop navigation markup static.
- Keep menu, search, account, wishlist, and cart independent.
- The mobile drawer must not exist in the DOM until opened.
- Keep `prefetch={false}` on large navigation/footer collections.
- The footer is deliberately compact and server-rendered. Add visual hierarchy with CSS, not newsletter or animation clients mounted globally.

## Performance rules

Treat these as regression limits:

- Lighthouse performance: target at least 90.
- LCP: at most 2.5 seconds.
- TBT: at most 200 ms.
- CLS: at most 0.1; current key routes are `0.000`.
- Field INP: at most 200 ms.
- Cold-load transfer: at most 750 KB.
- Initial compressed JavaScript: at most 170 KB.
- Initial compressed CSS: at most 80 KB.
- Initial requests: at most 40.

Current compressed route assets:

| Route | JS | CSS |
|---|---:|---:|
| `/` | 136.7 KB | 3.6 KB |
| `/products` | 136.5 KB | 3.6 KB |
| `/category/fortnite` | 136.5 KB | 3.6 KB |
| Generic product | 141.0 KB | 4.8 KB |
| `/checkout` | 155.1 KB | 14.2 KB |
| `/login` | 141.8 KB | 51.3 KB |

For every meaningful UI batch, compare against these numbers instead of only checking whether the build succeeds.

## APIs relevant to UI work

### Compact product cards

`GET /api/products?view=card&limit=N&search=...`

- Use card mode for navigation search, grids, and recommendations.
- Search responses are intentionally `no-store`.
- Anonymous non-search catalog responses cache for 60 seconds with stale-while-revalidate.

### Cart validation

`POST /api/cart/validate`

Send product IDs, variant IDs, quantities, and displayed prices. The response contains authoritative availability and pricing. Any changed price must be visible to the customer.

### Performance metrics

`POST /api/performance/vitals`

Accepts sampled anonymous LCP, CLS, INP, and navigation metrics. Do not add personal data to this payload.

## Required verification commands

From `frontend/`:

```bash
npm run test:unit
npm run test:browser
npm run build
npm run performance:budget
LIGHTHOUSE_BASE_URL=http://127.0.0.1:3003 LIGHTHOUSE_RUNS=3 npm run performance:lighthouse
```

Focused backend tests from `backend/`:

```bash
.venv/bin/python manage.py test shop.tests.PublicPerformanceApiTests
```

The Lighthouse command is a strict gate and currently exits non-zero because timing targets are not yet met. Transfer/request/CLS results should still be checked in its output.

## Deployment workflow

After a verified frontend batch, run from the repository root:

```bash
./HardReload.sh
```

The script builds `.next-staging` from the real frontend source path, swaps it into `.next`, restarts `jinxfamily-frontend`, and preserves `.next-prev` for rollback.

For backend changes:

```bash
pm2 restart jinxfamily-backend
pm2 status
```

Then verify the live routes, API cache headers, cart validation, redirects, and PM2 error-log growth.

## Known infrastructure issue

- `jinxfamily.ir` and `www.jinxfamily.ir` have a valid certificate through 2026-10-18.
- `.shop` application redirects are correct when traffic reaches this server.
- `jinxfamily.shop` currently resolves to `88.135.68.16`, not this server (`94.183.210.76`).
- The remote `.shop` apex serves a certificate for `jinxfamily.ir`, causing a hostname mismatch.
- `www.jinxfamily.shop` redirects to the broken apex.
- The Cloudflare credential installed on this server has no access to the `jinxfamily.shop` zone.

To finish the migration, update the `.shop` apex and `www` DNS records through their actual DNS provider to reach `94.183.210.76`, then install/serve a certificate containing both `.shop` names and keep the permanent redirect to `https://jinxfamily.ir`.

## Recommended order for the next UI phase

1. Establish tokens and typography in `performance.css`.
2. Polish navigation, hero, compact product cards, and footer using CSS-only changes.
3. Improve `ProductPurchaseIsland` states and mobile purchase affordance.
4. Split checkout into smaller active-step clients.
5. Audit authentication and FAQ/content pages after their legacy CSS is reduced.
6. Run screenshots at 390–430 px, 768 px, 1024 px, and 1440 px.
7. Run browser tests, production budgets, and three-run Lighthouse medians before deployment.

The central rule is simple: visual polish belongs in server markup and route-scoped CSS; JavaScript should be added only when the user is interacting with a control.
