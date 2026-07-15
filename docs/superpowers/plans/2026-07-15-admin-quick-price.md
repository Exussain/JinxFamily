# Admin Quick Price and Category Tabs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine the product category tabs UI in the admin panel and add a quick-price editing feature for individual products.

**Architecture:** Add a new utility function `saveQuickPrice` in the Admin React component. Integrate a `.quick-price-row` section directly under the header of each product card. Apply modern CSS styling and responsive media queries.

**Tech Stack:** Next.js (React), CSS.

## Global Constraints

- **Process Check before reload:** Check for running reload processes using `pgrep -a -f 'HardReload.sh|next build'` and pkill them before executing `HardReload.sh`.
- **Post-Change Build:** Run `HardReload.sh` in `/root/NubixShop/public/` to compile the app and apply CSS/JS modifications.

---

### Task 1: JS Logic `saveQuickPrice`

**Files:**
- Modify: `/root/NubixShop/public/frontend/app/panel/admin/page.jsx` (around line 3600, next to `saveProduct`)

**Interfaces:**
- Consumes: `saveProduct` function
- Produces: `saveQuickPrice` function

- [ ] **Step 1: Write the implementation of `saveQuickPrice`**

We will define `saveQuickPrice` inside the `AdminPage` component immediately after `saveProduct`:

```javascript
  const saveQuickPrice = async (product) => {
    let updatedProduct = { ...product };
    if (product.variants && product.variants.length > 0) {
      const variants = product.variants.map((v, index) => {
        if (index === 0) {
          return { ...v, price: Number(product.price) || 0 };
        }
        return v;
      });
      updatedProduct = { ...product, variants };
    }
    await saveProduct(updatedProduct);
  };
```

- [ ] **Step 2: Commit Task 1**

```bash
git add frontend/app/panel/admin/page.jsx
git commit -m "feat(admin): add saveQuickPrice helper logic"
```

---

### Task 2: Render Quick Price Row

**Files:**
- Modify: `/root/NubixShop/public/frontend/app/panel/admin/page.jsx` (inside the visible products mapper, around line 6891)

**Interfaces:**
- Consumes: `saveQuickPrice` from Task 1

- [ ] **Step 1: Insert JSX for `quick-price-row`**

Insert the following block inside the `.product-card-body` div, before the `.product-edit-grid` element:

```jsx
                          <div className="quick-price-row">
                            <div className="quick-price-title-wrap">
                              <span className="quick-price-icon">💰</span>
                              <span className="quick-price-label">تغییر قیمت فوری:</span>
                            </div>
                            <div className="quick-price-input-wrap">
                              <input
                                type="number"
                                value={p.price || 0}
                                min="0"
                                onChange={(e) => handleProductChange(p.id, "price", Number(e.target.value || 0))}
                                placeholder="قیمت"
                              />
                              <span className="quick-price-unit">تومان</span>
                            </div>
                            <button
                              type="button"
                              className={`quick-price-btn ${productSaving === p.id ? "saving" : ""}`}
                              disabled={productSaving === p.id}
                              onClick={() => saveQuickPrice(p)}
                            >
                              {productSaving === p.id ? "در حال ثبت..." : "ثبت فوری"}
                            </button>
                          </div>
```

- [ ] **Step 2: Commit Task 2**

```bash
git add frontend/app/panel/admin/page.jsx
git commit -m "feat(admin): render quick-price-row in product cards"
```

---

### Task 3: CSS Styling

**Files:**
- Modify: `/root/NubixShop/public/frontend/app/panel/admin/page.jsx` (embedded styles block, around lines 10866-10958 & media query around 11704)

- [ ] **Step 1: Add new styles for category tabs**

Update styling of category tabs to add glowing shadows and hover lift:

```css
          .product-group-tabs {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 10px;
            margin: 16px 0;
          }

          .product-group-tab {
            position: relative;
            display: grid;
            grid-template-columns: 1fr auto;
            grid-template-areas:
              "main count"
              "sub count";
            gap: 2px 10px;
            align-items: center;
            min-height: 64px;
            padding: 12px 14px;
            border: 1px solid var(--line);
            border-radius: 12px;
            background: var(--card);
            color: var(--text);
            cursor: pointer;
            text-align: right;
            transition: all 0.2s ease;
          }

          .product-group-tab:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
            border-color: rgba(102, 126, 234, 0.3);
          }

          .product-group-tab.active {
            color: #fff;
            border-color: transparent;
          }

          .product-group-fortnite.active {
            background: linear-gradient(135deg, #2563eb, #0ea5e9);
            box-shadow: 0 8px 20px rgba(37, 99, 235, 0.25);
          }

          .product-group-ai.active {
            background: linear-gradient(135deg, #059669, #14b8a6);
            box-shadow: 0 8px 20px rgba(5, 150, 105, 0.25);
          }

          .product-group-subscriptions.active {
            background: linear-gradient(135deg, #db2777, #f97316);
            box-shadow: 0 8px 20px rgba(219, 39, 119, 0.25);
          }

          .product-group-other-games.active {
            background: linear-gradient(135deg, #7c3aed, #475569);
            box-shadow: 0 8px 20px rgba(124, 58, 237, 0.25);
          }
```

- [ ] **Step 2: Add styles for `quick-price-row`**

Add the `.quick-price-row` styles below the card styles block:

```css
          .quick-price-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            background: rgba(102, 126, 234, 0.04);
            border: 1px dashed var(--line);
            border-radius: 10px;
            padding: 8px 12px;
            margin-bottom: 16px;
            transition: all 0.2s ease;
          }

          .quick-price-title-wrap {
            display: flex;
            align-items: center;
            gap: 6px;
          }

          .quick-price-icon {
            font-size: 15px;
          }

          .quick-price-label {
            font-size: 12px;
            font-weight: 700;
            color: var(--text);
          }

          .quick-price-input-wrap {
            position: relative;
            display: flex;
            align-items: center;
            flex: 1;
            max-width: 180px;
          }

          .quick-price-input-wrap input {
            width: 100%;
            height: 32px;
            padding: 0 45px 0 10px;
            border: 1px solid var(--line);
            border-radius: 6px;
            background: var(--bg);
            color: var(--text);
            font-family: inherit;
            font-size: 13px;
            font-weight: 700;
            text-align: left;
            direction: ltr;
            outline: none;
            transition: border-color 0.15s ease;
          }

          .quick-price-input-wrap input:focus {
            border-color: #667eea;
          }

          .quick-price-unit {
            position: absolute;
            right: 8px;
            font-size: 10px;
            font-weight: 700;
            color: var(--muted);
            pointer-events: none;
          }

          .quick-price-btn {
            height: 32px;
            padding: 0 16px;
            border: none;
            border-radius: 6px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #fff;
            font-size: 12px;
            font-weight: 700;
            cursor: pointer;
            transition: opacity 0.15s ease;
          }

          .quick-price-btn:hover {
            opacity: 0.9;
          }

          .quick-price-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
```

- [ ] **Step 3: Add responsive media queries**

Update the media query `@media (max-width: 860px)` block:

```css
            .quick-price-row {
              flex-direction: column;
              align-items: stretch;
              gap: 8px;
            }
            .quick-price-input-wrap {
              max-width: 100%;
            }
```

- [ ] **Step 4: Commit Task 3**

```bash
git add frontend/app/panel/admin/page.jsx
git commit -m "style(admin): refactor category tabs and style quick-price-row"
```

---

### Task 4: Rebuild & Verification

**Files:**
- Test: Local API connections and browser builds.

- [ ] **Step 1: Check running reload processes**

Run: `pgrep -a -f 'HardReload.sh|next build'`
Expected: No stale build processes. If any are found, kill them.

- [ ] **Step 2: Run HardReload.sh**

Run: `bash /root/NubixShop/public/HardReload.sh`
Expected: Next.js compilation succeeds with `exit 0` and restarts PM2.

- [ ] **Step 3: Verify end-to-end responsiveness**

Verify the server is returning `HTTP 200 OK` on port 3002:
Run: `curl -I http://localhost:3002/`
Expected: HTTP/1.1 200 OK

- [ ] **Step 4: Commit Task 4 and mark complete**

```bash
git commit --allow-empty -m "chore(admin): verify build and deployment status"
```
