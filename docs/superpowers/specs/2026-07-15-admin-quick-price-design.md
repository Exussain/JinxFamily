# Design Spec: Admin Category Tabs Styling and Quick Price Updates

**Date:** 2026-07-15
**Status:** Approved

## 1. Objectives

- **Refine Category Tabs UI:** Restyle the `.product-group-tabs` and `.product-group-tab` elements in the admin product management dashboard to look cleaner, more cohesive, and visually appealing.
- **Implement Quick Price Edit:** Add a prominent, lightweight price input row at the top of each product card (`.product-card-body`) to allow the admin to change a product's price instantly (via an inline API PATCH call) without having to scroll down to the bottom or edit the details form manually.
- **Variant Consistency:** For products with variants (e.g. `fortnite-crew-pack`), ensure that updating the base product price automatically updates the price of the first/default variant (e.g., "1 month") for database and catalog consistency.

---

## 2. UI/UX Changes

### 2.1 Category Tabs (`product-group-tabs`)
- Add smoother hover transition effects (`transform: translateY(-1px)`, soft drop shadows).
- Increase border-radius to `12px` to look more modern.
- Apply a glowing drop-shadow matching the brand gradient color on active tabs to provide a high-end visual feedback.

### 2.2 Quick Price Edit Row (`quick-price-row`)
- Location: Positioned horizontally at the very top of each `.product-card-body` (above the title edit field).
- Style:
  - Background: `rgba(102, 126, 234, 0.04)`.
  - Border: `1px dashed var(--line)`.
  - Padding: `10px 14px`.
  - Border-radius: `10px`.
  - Display: Flexbox alignment. Wraps to a column layout on mobile screens (`max-width: 860px`) to prevent visual breakages.
- Elements:
  - Label: `💰 تغییر قیمت فوری:` (Farsi).
  - Input: Numeric field displaying the current product price (`p.price`).
  - Unit: `تومان` (Tomans) badge.
  - Action Button: "ثبت فوری" (Quick Save), disabling and showing a spinner or loading text when saving is in progress.

---

## 3. Technical Changes

### 3.1 CSS Styling
Update the stylesheet embedded in `app/panel/admin/page.jsx` with:
- Hover transitions and active glowing shadows for category tabs.
- Grid & flex positioning for `.quick-price-row` and its responsive media query block.

### 3.2 Component State & Logic
Inside the `AdminPage` component in `app/panel/admin/page.jsx`:
- Define `saveQuickPrice` function:
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
- Render the `quick-price-row` component inside the products list mapper (`visibleProducts.map`).

---

## 4. Risks & Considerations

- **Visual Alignment:** Dashboard columns and grids must resize smoothly. Using flexible widths and media queries ensures the new horizontal bar adjusts on small screens without breaking adjacent forms.
- **Payload Safety:** Reusing the existing `saveProduct` method ensures that all field validations and cover image uploads remain completely unaffected and work exactly as they did before.
