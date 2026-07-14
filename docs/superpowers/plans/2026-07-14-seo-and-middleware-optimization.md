# Regional SEO & Middleware Activation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Correct regional Google search engine visibility for NubixShop by incorporating spelling variations (Arabic and Persian keyboards) into the metadata and visible on-page copy, and activate the Next.js routing middleware.

**Architecture:** Update `layout.js` metadata keywords and JSON-LD schema, add a natural clarification sentence to the homepage's SEO copy, and create `middleware.js` in the frontend root to re-export `proxy.js`.

**Tech Stack:** Next.js (App Router), JSON-LD (Schema.org), PM2.

## Global Constraints
- Do not run `HardReload.sh` without first checking for and terminating any stale build/reload processes.
- Maintain document integrity (preserve existing layout scripts and imports).

---

### Task 1: Metadata & Schema Upgrades

**Files:**
- Modify: `/root/NubixShop/public/frontend/app/layout.js`

**Interfaces:**
- Consumes: None
- Produces: Updated HTML metadata headers and JSON-LD Organization schema returned from the homepage and all child pages.

- [ ] **Step 1: Write the changes to layout.js**
  Replace lines 13-18 and lines 92-93 in `frontend/app/layout.js` with spelling variations:
  - Meta keywords: `['نوبیکس شاپ', 'نوبیکس', 'نوبيکس', 'نوبيکس شاپ', 'نوبيكس', 'نوبيكس شاپ', 'nubixshop', 'nubix shop', 'nubix', 'nubixshop.ir', 'فعال‌سازی محصولات آنلاین', 'خرید اشتراک قانونی', 'اشتراک ChatGPT', 'خرید چت جی‌پی‌تی', 'اشتراک جیمینی', 'Gemini', 'هوش مصنوعی', 'وی‌باکس', 'وی باکس', 'V-Bucks', 'کروپک', 'بتل پس', 'استارتر پک', 'Fortnite', 'فورتنایت', 'گیفت کارت', 'گیفت کارت پلی‌استیشن', 'گیفت کارت استیم', 'اشتراک اسپاتیفای']`
  - alternateName: `['NubixShop', 'Nubix Shop', 'نوبیکس', 'نوبیکس شاپ', 'نوبيکس', 'نوبيکس شاپ', 'نوبيكس', 'نوبيكس شاپ', 'nubixshop.ir']`

- [ ] **Step 2: Commit layout.js updates**
  Run:
  ```bash
  git add frontend/app/layout.js
  git commit -m "feat: add regional spelling variations to metadata and JSON-LD alternateNames"
  ```

---

### Task 2: Homepage SEO Copy Integration

**Files:**
- Modify: `/root/NubixShop/public/frontend/app/page.js`

**Interfaces:**
- Consumes: None
- Produces: Updated on-page text in the SEO section at the bottom of the home page.

- [ ] **Step 1: Write the changes to page.js**
  Replace lines 513-523 in `frontend/app/page.js` with the updated SEO description text:
  ```javascript
  // Target:
  <p>
    نوبیکس شاپ مرجع <a href="/vbucks">خرید وی باکس فورتنایت</a> و{' '}
    <a href="/crewpack">خرید کروپک فورتنایت</a> با فعال‌سازی قانونی و مستقیم روی اکانت شماست.
    علاوه بر محصولات فورتنایت مثل <a href="/product/fortnite-battle-pass">بتل پس</a> و{' '}
    <a href="/lego">پک لگو فورتنایت</a>، می‌توانید{' '}
    <a href="/product/chatgpt-subscription">اشتراک ChatGPT</a>،{' '}
    <a href="/gemini">اشتراک Google Gemini</a>، انواع گیفت کارت و{' '}
    <a href="/gta6">پیش‌خرید GTA 6</a> را هم با تحویل سریع، پرداخت امن زرین‌پال و
    پشتیبانی ۲۴ ساعته سفارش دهید. برای آشنایی بیشتر با روند خرید،{' '}
    <a href="/faq/how-to-buy">راهنمای خرید</a> و <a href="/blog">وبلاگ نوبیکس شاپ</a> را ببینید.
  </p>
  // Replacement:
  <p>
    نوبیکس شاپ مرجع <a href="/vbucks">خرید وی باکس فورتنایت</a> و{' '}
    <a href="/crewpack">خرید کروپک فورتنایت</a> با فعال‌سازی قانونی و مستقیم روی اکانت شماست.
    فروشگاه نوبیکس (که در میان کاربران با نام‌های نوبیکس شاپ، نوبيکس، نوبيكس یا NubixShop نیز شناخته می‌شود) متعهد به ارائه بهترین خدمات دیجیتال با قیمت مناسب است.
    علاوه بر محصولات فورتنایت مثل <a href="/product/fortnite-battle-pass">بتل پس</a> و{' '}
    <a href="/lego">پک لگو فورتنایت</a>، می‌توانید{' '}
    <a href="/product/chatgpt-subscription">اشتراک ChatGPT</a>،{' '}
    <a href="/gemini">اشتراک Google Gemini</a>، انواع گیفت کارت و{' '}
    <a href="/gta6">پیش‌خرید GTA 6</a> را هم با تحویل سریع، پرداخت امن زرین‌پال و
    پشتیبانی ۲۴ ساعته سفارش دهید. برای آشنایی بیشتر با روند خرید،{' '}
    <a href="/faq/how-to-buy">راهنمای خرید</a> و <a href="/blog">وبلاگ نوبیکس شاپ</a> را ببینید.
  </p>
  ```

- [ ] **Step 2: Commit page.js updates**
  Run:
  ```bash
  git add frontend/app/page.js
  git commit -m "feat: add spelling variations to homepage visible SEO paragraph"
  ```

---

### Task 3: Next.js Middleware Activation

**Files:**
- Create: `/root/NubixShop/public/frontend/middleware.js`

**Interfaces:**
- Consumes: `/root/NubixShop/public/frontend/proxy.js`
- Produces: Exported default middleware and routing matcher rules for Next.js execution.

- [ ] **Step 1: Create the middleware.js file**
  Write the following content to `frontend/middleware.js`:
  ```javascript
  export { default, config } from "./proxy.js";
  ```

- [ ] **Step 2: Commit middleware.js**
  Run:
  ```bash
  git add frontend/middleware.js
  git commit -m "feat: create middleware.js to activate the routing/admin proxy"
  ```

---

### Task 4: Deployment & Verification

**Files:** None

- [ ] **Step 1: Check for and kill running build/reload processes**
  Run:
  ```bash
  pgrep -a -f 'HardReload.sh|next build'
  ```
  If any processes are found, kill them:
  ```bash
  pkill -TERM -f 'HardReload.sh'; pkill -TERM -f 'next build --webpack'
  ```
  Wait and verify they are gone:
  ```bash
  sleep 3 && pgrep -f 'HardReload.sh|next build' || echo 'All clear'
  ```

- [ ] **Step 2: Run HardReload.sh**
  Run:
  ```bash
  /root/NubixShop/public/HardReload.sh
  ```

- [ ] **Step 3: Verify the changes**
  - Fetch the home page and check for keywords and the paragraph change:
    ```bash
    curl -s http://127.0.0.1:3002/ | grep -E 'نوبيکس|نوبيكس'
    ```
  - Fetch an admin page without cookies and check if the middleware redirects it:
    ```bash
    curl -I http://127.0.0.1:3002/panel/admin
    ```
    Expected: HTTP 307 Temporary Redirect (to /login?from=protected).
