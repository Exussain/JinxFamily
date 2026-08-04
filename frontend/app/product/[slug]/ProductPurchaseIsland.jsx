"use client";

import { useMemo, useState } from "react";
import { useCart } from "../../../lib/useCart";

const money = (value) => `${Number(value || 0).toLocaleString("fa-IR")} تومان`;

const supplierFieldLabels = {
  roblox_username: "نام کاربری Roblox",
  player_tag: "شناسه / تگ بازیکن",
  game_email: "ایمیل اکانت بازی",
  game_password: "رمز عبور اکانت بازی",
  character_name: "نام کاراکتر در بازی",
  backup_code: "کد بکاپ / 2FA",
};

function supplierField(field) {
  if (typeof field === "object" && field?.key) return field;
  const key = String(field || "").trim();
  return {
    key,
    label: supplierFieldLabels[key] || key.replaceAll("_", " "),
    type: key.includes("email") ? "email" : key.includes("password") ? "password" : "text",
    required: true,
  };
}

export default function ProductPurchaseIsland({ product, image, customButtonText }) {
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  const rawFields = Array.isArray(product?.custom_fields) ? product.custom_fields : [];
  const baseFields = useMemo(() => {
    let list = [...rawFields];
    const loginIdx = list.findIndex(
      (f) => f.key === "login_method" || f.key === "account_type" || (f.label && f.label.includes("روش ورود"))
    );
    if (loginIdx !== -1) {
      const hasEmail = list.some((f) => f.type === "email" || f.key === "account_email" || f.key === "epic_email" || (f.label && f.label.includes("ایمیل")));
      const hasPassword = list.some((f) => f.type === "password" || f.key === "account_password" || f.key === "epic_password" || (f.label && f.label.includes("رمز")));
      const hasNotes = list.some((f) => f.key === "extra_notes" || (f.label && f.label.includes("توضیحات اضافه")));

      const injected = [];
      if (!hasEmail) injected.push({ key: "account_email", label: "ایمیل اکانت (لاگین)", type: "email", required: true, placeholder: "example@gmail.com" });
      if (!hasPassword) injected.push({ key: "account_password", label: "رمز ورود اکانت", type: "password", required: true, placeholder: "••••••••" });
      if (!hasNotes) injected.push({ key: "extra_notes", label: "توضیحات اضافه (اختیاری)", type: "textarea", required: false, placeholder: "در صورتی که توضیح و نکته خاصی دارید یا سوال امنیتی اکانت را می دانید وارد کنید..." });

      if (injected.length > 0) {
        list = [...list.slice(0, loginIdx + 1), ...injected, ...list.slice(loginIdx + 1)];
      }
    }
    return list.map((f) => {
      if (f.key === "extra_notes" || (f.label && f.label.includes("توضیحات اضافه"))) {
        return { ...f, placeholder: f.placeholder || "در صورتی که توضیح و نکته خاصی دارید یا سوال امنیتی اکانت را می دانید وارد کنید..." };
      }
      return f;
    });
  }, [rawFields]);
  const [variantId, setVariantId] = useState(variants[0]?.id ?? null);
  const [values, setValues] = useState({});
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();

  const selected = useMemo(
    () => variants.find((variant) => Number(variant.id) === Number(variantId)) || variants[0] || null,
    [variantId, variants]
  );
  // Supplier products define their requirements per variation. Combine those
  // with product-level fields so changing a variation always shows exactly
  // the details required for that particular item.
  const fields = useMemo(() => {
    const variantFields = Array.isArray(selected?.required_fields)
      ? selected.required_fields.map(supplierField).filter((field) => field.key)
      : [];
    const known = new Set(baseFields.map((field) => field.key));
    return [...baseFields, ...variantFields.filter((field) => !known.has(field.key))];
  }, [baseFields, selected]);
  const price = Number(selected?.price ?? product?.price ?? product?.min_price ?? 0);
  const available = product?.purchasable !== false && !product?.ordering_disabled &&
    !product?.customer_ordering_disabled && price > 0;

  const addToCart = () => {
    for (const field of fields) {
      const value = String(values[field.key] || "").trim();
      if (field.required && !value) {
        setError(`«${field.label || field.key}» را وارد کنید.`);
        return;
      }
      if (field.type === "email" && value && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
        setError(`«${field.label || field.key}» معتبر نیست.`);
        return;
      }
    }
    if (!available) {
      setError("این محصول در حال حاضر قابل سفارش نیست.");
      return;
    }

    addItem({
      product_id: product.id,
      variant_id: selected?.id,
      name: selected ? `${product.name_fa} - ${selected.title}` : product.name_fa,
      price,
      quantity: 1,
      slug: product.slug,
      image,
      category: product.category || "",
      custom_fields: Object.fromEntries(fields.map((field) => [field.key, String(values[field.key] || "").trim()])),
      ...(selected?.g4a4_variation_id ? { g4a4_variation_id: selected.g4a4_variation_id } : {}),
    });
    setError("");
    setAdded(true);
    window.dispatchEvent(new CustomEvent("cart:add"));
  };

  return (
    <section className="product-purchase-island" aria-labelledby="purchase-title">
      <h2 id="purchase-title">انتخاب و خرید</h2>
      {variants.length > 0 && (
        <fieldset className="product-variant-list">
          <legend>نوع محصول</legend>
          {variants.map((variant) => (
            <label key={variant.id} className={Number(variant.id) === Number(variantId) ? "selected" : ""}>
              <input
                type="radio"
                name="product-variant"
                value={variant.id}
                checked={Number(variant.id) === Number(variantId)}
                onChange={() => { setVariantId(variant.id); setAdded(false); }}
              />
              <span>{variant.title}</span>
              <strong>{money(variant.price)}</strong>
            </label>
          ))}
        </fieldset>
      )}

      {fields.map((field) => (
        <label className="product-custom-field" key={field.key}>
          <span>{field.label || field.key}{field.required ? " *" : ""}</span>
          {field.type === "select" ? (
            <select value={values[field.key] || ""} onChange={(event) => setValues({ ...values, [field.key]: event.target.value })}>
              <option value="">انتخاب کنید</option>
              {(field.options || []).map((option) => <option value={option} key={option}>{option}</option>)}
            </select>
          ) : (
            <input
              type={field.type === "password" ? "password" : field.type === "email" ? "email" : "text"}
              value={values[field.key] || ""}
              placeholder={field.placeholder || ""}
              autoComplete={field.type === "password" ? "current-password" : field.type === "email" ? "email" : "off"}
              onChange={(event) => setValues({ ...values, [field.key]: event.target.value })}
            />
          )}
        </label>
      ))}

      <div className="product-purchase-total">
        <span>قیمت نهایی</span>
        <strong>{price > 0 ? money(price) : "ناموجود"}</strong>
      </div>
      {error && <p className="product-purchase-error" role="alert">{error}</p>}
      {added && <p className="product-purchase-success" role="status">به سبد خرید اضافه شد.</p>}
      <button type="button" className="btn primary product-add-button" onClick={addToCart} disabled={!available}>
        {available ? (customButtonText || "افزودن به سبد خرید") : "فعلاً ناموجود"}
      </button>
    </section>
  );
}
