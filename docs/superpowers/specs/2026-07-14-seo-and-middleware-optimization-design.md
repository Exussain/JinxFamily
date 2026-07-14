# Design Spec: Regional SEO spelling variations and Next.js middleware activation

This document outlines the design for correcting regional search engine visibility for NubixShop and activating the Next.js routing middleware.

## 1. Problem Description
- **Search visibility**: When users search for "نوبيکس" or "نوبيکس شاپ" (which use the Arabic Yeh `ي` - U+064A), the website does not show up. The codebase currently only uses the Persian Yeh `ی` (U+06CC).
- **Middleware activation**: The file `frontend/proxy.js` is intended as Next.js middleware (handling Admin caching/cache-bust, and Maintenance Mode 503 SEO responses). However, because Next.js only recognizes `middleware.js` in the root of the project, this routing logic is completely dormant.

## 2. Proposed Changes

### A. Metadata & Schema Upgrades
In [layout.js](file:///root/NubixShop/public/frontend/app/layout.js):
- Add all script variations of the brand to `keywords`:
  - `نوبیکس` (Persian Yeh, Persian Kaf)
  - `نوبیکس شاپ` (Persian Yeh, Persian Kaf)
  - `نوبيکس` (Arabic Yeh, Persian Kaf)
  - `نوبيکس شاپ` (Arabic Yeh, Persian Kaf)
  - `نوبيكس` (Persian Yeh, Arabic Kaf)
  - `نوبيكس شاپ` (Persian Yeh, Arabic Kaf)
  - `نوبيكس` (Arabic Yeh, Arabic Kaf)
  - `نوبيكس شاپ` (Arabic Yeh, Arabic Kaf)
  - `nubixshop`
  - `nubix shop`
  - `nubix`
  - `nubixshop.ir`
- Add these variations to the `alternateName` array in the JSON-LD Organization schema (`siteJsonLd`).

### B. On-Page Text Integration
In [page.js](file:///root/NubixShop/public/frontend/app/page.js):
- Modify the visible SEO introduction section at the bottom of the home page to naturally mention these spellings:
  > "فروشگاه نوبیکس (که در میان کاربران با نام‌های نوبیکس شاپ، نوبيکس، نوبيكس یا NubixShop نیز شناخته می‌شود)..."

### C. Next.js Middleware Activation
Create [middleware.js](file:///root/NubixShop/public/frontend/middleware.js) in the frontend root directory to import and re-export the proxy configuration:
```javascript
export { default, config } from "./proxy.js";
```

### D. Deployment Process
- Run the mandatory pre-deployment check to ensure no stale builds or `HardReload.sh` processes are running.
- Run `/root/NubixShop/public/HardReload.sh` to compile the Next.js app and restart the PM2 server.

## 3. Verification Plan
- Verify that `curl -s http://127.0.0.1:3002/` contains the updated keywords, canonical URL, and visible SEO paragraph text.
- Verify that accessing `/panel/admin` without being logged in correctly triggers a redirect (proving the middleware is active).
- Verify that the sitemap is still serving correctly.
