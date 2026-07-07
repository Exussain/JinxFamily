"use client";

import { useEffect, useMemo, useState } from "react";
import AdminPricingTour from "./AdminPricingTour";
import {
  normalizeEditableTiers,
  roundPrice,
  sortTiers,
  validateTiers,
} from "../lib/resellerPricingEditor.mjs";

const fmt = (n) => Number(n || 0).toLocaleString("fa-IR");
const fmtEn = (n) => Number(n || 0).toLocaleString("en-US");

function productName(product) {
  return product?.name_fa || product?.product_name || product?.name || "محصول";
}

function buildProductList(products, resellerTiers) {
  const map = new Map();
  for (const p of products || []) {
    map.set(Number(p.id), {
      id: Number(p.id),
      name_fa: p.name_fa || p.product_name || p.name || "",
      slug: p.slug || p.product_slug || "",
      price: Number(p.price || 0),
      price_lira: Number(p.price_lira || p.product_price_lira || 0),
      active: p.active !== false,
      variants: p.variants || [],
      display_order: Number(p.display_order || 0),
    });
  }
  for (const tier of resellerTiers || []) {
    const id = Number(tier.product_id);
    if (!id || map.has(id)) continue;
    map.set(id, {
      id,
      name_fa: tier.product_name || "",
      slug: tier.product_slug || "",
      price: 0,
      price_lira: Number(tier.product_price_lira || 0),
      active: true,
      variants: [],
      display_order: 9999,
    });
  }
  return Array.from(map.values()).sort((a, b) => {
    if (a.active !== b.active) return a.active ? -1 : 1;
    return productName(a).localeCompare(productName(b), "fa");
  });
}

function tierCountForProduct(resellerTiers, productId) {
  return (resellerTiers || []).filter((t) => Number(t.product_id) === Number(productId) && !t.reseller_id).length;
}

export default function ResellerPricingEditor({
  apiBase,
  resellers,
  products: adminProducts,
  resellerTiers,
  onGlobalTiersChanged,
}) {
  const products = useMemo(
    () => buildProductList(adminProducts, resellerTiers),
    [adminProducts, resellerTiers]
  );

  const [productQuery, setProductQuery] = useState("");
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [variants, setVariants] = useState([]);
  const [scopeResellerId, setScopeResellerId] = useState(null);
  const [resellerQuery, setResellerQuery] = useState("");
  const [overrideResellerIds, setOverrideResellerIds] = useState([]);
  const [globalTiers, setGlobalTiers] = useState([]);
  const [editingTiers, setEditingTiers] = useState([]);
  const [hasOwnOverride, setHasOwnOverride] = useState(false);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notice, setNotice] = useState("");

  const [liraRate, setLiraRate] = useState(0);
  const [refRate, setRefRate] = useState(3360);
  const [costToman, setCostToman] = useState(0);
  const [idealMinPrice, setIdealMinPrice] = useState(0);
  const [profitPct, setProfitPct] = useState(0);

  useEffect(() => {
    if (!selectedProductId && products.length > 0) {
      setSelectedProductId(products[0].id);
    }
  }, [products, selectedProductId]);

  useEffect(() => {
    setSelectedVariantId(null);
    setSaved(false);
    setNotice("");
  }, [selectedProductId]);

  const selectedProduct = products.find((p) => Number(p.id) === Number(selectedProductId));
  const selectedVariant = variants.find((v) => Number(v.id) === Number(selectedVariantId));
  const effectivePriceLira = selectedVariant
    ? Number(selectedVariant.price_lira || selectedVariant.original_price || 0)
    : Number(selectedProduct?.price_lira || 0);
  const selectedReseller = scopeResellerId
    ? (resellers || []).find((r) => Number(r.id) === Number(scopeResellerId))
    : null;
  const isCrew = selectedProduct?.slug === "fortnite-crew-pack";
  const isFixedVariantTier = selectedProduct?.slug === "v-bucks" && !!selectedVariantId;
  const isLiraPriced = !isCrew && !isFixedVariantTier && effectivePriceLira > 0;
  const liraScaleFactor = refRate > 0 && liraRate > 0 ? liraRate / refRate : 0;
  const editsEffectivePrice = !scopeResellerId && isLiraPriced && liraScaleFactor > 0;
  const priceForDisplay = (rawPrice) => {
    const value = Number(rawPrice || 0);
    if (!editsEffectivePrice) return value;
    return Math.round(value * liraScaleFactor);
  };
  const priceFromDisplay = (displayPrice) => {
    const value = Number(displayPrice || 0);
    if (!editsEffectivePrice) return value;
    return Math.round(value / liraScaleFactor);
  };
  const canSmartPrice = isCrew || (effectivePriceLira > 0 && liraRate > 0) || Number(selectedProduct?.price || 0) > 0;
  const hasBelowMinTier = idealMinPrice > 0 && editingTiers.some((tier) => priceForDisplay(tier.price) < idealMinPrice);
  const positiveTierPrices = editingTiers.map((tier) => priceForDisplay(tier.price)).filter((price) => price > 0);
  const currentMinTierPrice = positiveTierPrices.length > 0 ? Math.min(...positiveTierPrices) : 0;

  const filteredProducts = useMemo(() => {
    const q = productQuery.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => {
      return (
        productName(p).toLowerCase().includes(q) ||
        (p.slug || "").toLowerCase().includes(q)
      );
    });
  }, [products, productQuery]);

  const filteredResellers = useMemo(() => {
    const q = resellerQuery.trim().toLowerCase();
    const list = resellers || [];
    if (!q) return list.slice(0, 12);
    return list.filter((r) => {
      return (
        (r.seller_code || "").toLowerCase().includes(q) ||
        (r.support_name || "").toLowerCase().includes(q) ||
        (r.contact_phone || "").toLowerCase().includes(q)
      );
    }).slice(0, 12);
  }, [resellers, resellerQuery]);

  const callApi = async (path, options = {}) => {
    const res = await fetch(`${apiBase}${path}`, {
      cache: "no-store",
      credentials: "include",
      ...options,
    });
    const data = await res.json().catch(() => ({}));
    return { res, data };
  };

  useEffect(() => {
    if (!selectedProductId) return;
    let cancelled = false;
    (async () => {
      const params = new URLSearchParams({ product_id: String(selectedProductId) });
      if (selectedVariantId) params.set("variant_id", String(selectedVariantId));
      const { res, data } = await callApi(`/api/admin/reseller-tiers/overrides-summary?${params.toString()}`);
      if (cancelled) return;
      if (res.ok) setOverrideResellerIds(data.reseller_ids || []);
    })();
    return () => { cancelled = true; };
  }, [selectedProductId, selectedVariantId, apiBase]);

  useEffect(() => {
    if (!selectedProductId) return;
    let cancelled = false;
    setLoading(true);
    setSaved(false);
    setNotice("");

    (async () => {
      try {
        const params = new URLSearchParams({ product_id: String(selectedProductId) });
        if (selectedVariantId) params.set("variant_id", String(selectedVariantId));
        const globalResult = await callApi(`/api/admin/reseller-tiers?${params.toString()}`);
        const scopeResult = scopeResellerId
          ? await callApi(`/api/admin/reseller-tiers?${params.toString()}&reseller_id=${scopeResellerId}`)
          : null;

        if (cancelled) return;
        if (!globalResult.res.ok) {
          setNotice((globalResult.data && (globalResult.data.message || globalResult.data.detail)) || "خطا در بارگذاری قیمت‌ها.");
          return;
        }

        const globalData = globalResult.data || {};
        setLiraRate(Number(globalData.lira_rate || 0));
        setRefRate(Number(globalData.ref_rate || 3360));
        setCostToman(Number(globalData.cost_toman || 0));
        setIdealMinPrice(Number(globalData.ideal_min_price || 0));
        setProfitPct(Number(globalData.profit_pct || 0));
        const nextVariants = globalData.variants || selectedProduct?.variants || [];
        setVariants(nextVariants);
        if (nextVariants.length > 0 && !selectedVariantId) {
          setSelectedVariantId(Number(nextVariants[0].id));
          return;
        }

        const loadedGlobalTiers = sortTiers(globalData.results || []);
        setGlobalTiers(loadedGlobalTiers);

        if (scopeResellerId) {
          const overrideRows = sortTiers((scopeResult && scopeResult.data && scopeResult.data.results) || []);
          if (overrideRows.length > 0) {
            setHasOwnOverride(true);
            setEditingTiers(normalizeEditableTiers(overrideRows));
          } else {
            setHasOwnOverride(false);
            setEditingTiers(normalizeEditableTiers(loadedGlobalTiers));
          }
        } else {
          setHasOwnOverride(false);
          setEditingTiers(normalizeEditableTiers(loadedGlobalTiers));
        }
      } catch {
        if (!cancelled) setNotice("خطای شبکه در بارگذاری قیمت‌ها. صفحه را رفرش کنید یا دوباره تلاش کنید.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [selectedProductId, selectedVariantId, scopeResellerId, apiBase, selectedProduct?.variants]);

  const updateTier = (idx, patch) => {
    setEditingTiers((prev) => prev.map((tier, i) => (i === idx ? { ...tier, ...patch } : tier)));
    setSaved(false);
  };

  const addTier = () => {
    const sorted = normalizeEditableTiers(editingTiers);
    const last = sorted[sorted.length - 1];
    const nextQty = last ? Math.max(last.min_quantity + 1, last.min_quantity + Math.round(last.min_quantity * 0.5)) : 1;
    const nextPrice = last
      ? priceFromDisplay(Math.round(priceForDisplay(last.price) * 0.9))
      : priceFromDisplay(Math.round(selectedProduct?.price || idealMinPrice || 0));
    setEditingTiers([...sorted, { min_quantity: nextQty, price: nextPrice, active: true }]);
    setSaved(false);
  };

  const removeTier = (idx) => {
    setEditingTiers((prev) => prev.filter((_, i) => i !== idx));
    setSaved(false);
  };

  const applySmartPricing = () => {
    let single = 0;
    let ten = 0;
    if (isCrew) {
      single = 505000;
      ten = 469000;
    } else if (effectivePriceLira > 0 && liraRate > 0) {
      const cost = effectivePriceLira * liraRate;
      const lowBoost = Math.max(0, (800000 - cost) / 800000);
      const premiumBoost = Math.max(0, (cost - 5000000) / 3000000);
      let singleMargin = 0.112 + 0.095 * lowBoost + 0.028 * premiumBoost;
      let tenMargin = 0.087 + 0.05 * lowBoost + 0.018 * premiumBoost;
      const slug = selectedProduct?.slug || "";
      const variantTitle = selectedVariant?.title || "";
      if (slug === "starterpack") singleMargin -= 0.015;
      if (slug === "minty-legends-pack") singleMargin -= 0.005;
      if (slug === "v-bucks" && variantTitle.includes("2400")) singleMargin += 0.05;
      if (slug === "v-bucks" && variantTitle.includes("4500")) singleMargin += 0.008;
      single = roundPrice(cost * (1 + singleMargin));
      ten = roundPrice(cost * (1 + tenMargin));
    } else {
      const base = Number(selectedProduct?.price || 0);
      single = roundPrice(base * 0.9);
      ten = roundPrice(single * 0.9);
    }
    if (single <= 0 || ten <= 0) {
      setNotice("برای قیمت‌گذاری هوشمند، قیمت پایه یا قیمت لیر محصول لازم است.");
      return;
    }
    setEditingTiers(normalizeEditableTiers([
      { min_quantity: 1, price: priceFromDisplay(single), active: true },
      { min_quantity: 10, price: priceFromDisplay(ten), active: true },
    ]));
    setSaved(false);
    setNotice("قیمت‌های پیشنهادی هوشمند برای این محصول ساخته شد. قبل از ذخیره، اعداد را بررسی کنید.");
  };

  const handleSave = async () => {
    const validation = validateTiers(editingTiers);
    if (!validation.ok) {
      setNotice(validation.message);
      return;
    }
    if (!scopeResellerId) {
      const ok = window.confirm("این تغییر روی قیمت عمومی است و روی همه‌ی همکارانی که قیمت دستی جدا ندارند اثر می‌گذارد. ادامه می‌دهید؟");
      if (!ok) return;
    }

    setBusy(true);
    setNotice("");
    try {
      const payload = {
        product_id: selectedProductId,
        variant_id: selectedVariantId || undefined,
        reseller_id: scopeResellerId || null,
        tiers: validation.tiers,
      };
      const { res, data } = await callApi("/api/admin/reseller-tiers/upsert", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        setNotice((data && (data.message || data.detail)) || `خطای سرور (${res.status})`);
        return;
      }
      setSaved(true);
      setEditingTiers(validation.tiers);
      if (scopeResellerId) {
        setHasOwnOverride(true);
        setOverrideResellerIds((ids) => (
          ids.includes(scopeResellerId) ? ids : [...ids, scopeResellerId]
        ));
      } else {
        setGlobalTiers(validation.tiers);
        onGlobalTiersChanged?.();
      }
    } catch {
      setNotice("خطای شبکه در ذخیره‌سازی. دوباره تلاش کنید.");
    } finally {
      setBusy(false);
    }
  };

  const handleClearOverride = async () => {
    if (!scopeResellerId) return;
    if (!window.confirm("قیمت دستی این همکار برای این محصول حذف شود و به قیمت عمومی برگردد؟")) return;
    setBusy(true);
    setNotice("");
    try {
      const { res, data } = await callApi("/api/admin/reseller-tiers/clear-override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: selectedProductId,
          variant_id: selectedVariantId || undefined,
          reseller_id: scopeResellerId,
        }),
      });
      if (!res.ok) {
        setNotice((data && (data.message || data.detail)) || `خطای سرور (${res.status})`);
        return;
      }
      setHasOwnOverride(false);
      setOverrideResellerIds((ids) => ids.filter((id) => Number(id) !== Number(scopeResellerId)));
      setEditingTiers(normalizeEditableTiers(globalTiers));
      setSaved(false);
    } catch {
      setNotice("خطای شبکه در حذف قیمت دستی. دوباره تلاش کنید.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rpe-shell form-card-premium" data-tour="pricing-editor">
      <div className="rpe-topbar">
        <div>
          <h3 className="rpe-title">تنظیمات قیمت همکار</h3>
          <p className="rpe-subtitle">قیمت عمومی، قیمت اختصاصی همکار و پله‌های خرید را از یکجا کنترل کنید.</p>
        </div>
        <div className="rpe-actions">
          <button
            type="button"
            className="rpe-btn rpe-btn-ai"
            onClick={applySmartPricing}
            disabled={!canSmartPrice || loading || busy}
            title="بر اساس قیمت لیر، نرخ روز و الگوی فعلی قیمت‌ها پیشنهاد می‌دهد"
          >
            قیمت‌گذاری هوشمند محصول
          </button>
          <button
            type="button"
            className={`rpe-btn rpe-btn-primary ${saved ? "saved" : ""}`}
            onClick={handleSave}
            disabled={busy || loading || !selectedProductId || editingTiers.length === 0}
            data-tour="pricing-save-btn"
          >
            {saved ? "ذخیره شد" : busy ? "در حال ذخیره..." : "ذخیره تغییرات"}
          </button>
        </div>
      </div>

      <AdminPricingTour apiBase={apiBase} />

      <div className="rpe-layout">
        <aside className="rpe-product-panel" data-tour="pricing-product-picker">
          <div className="rpe-panel-head">
            <span>محصولات</span>
            <strong>{products.length}</strong>
          </div>
          <input
            className="rpe-input"
            value={productQuery}
            onChange={(e) => setProductQuery(e.target.value)}
            placeholder="جستجوی محصول..."
          />
          <div className="rpe-product-list">
            {filteredProducts.map((p) => {
              const count = tierCountForProduct(resellerTiers, p.id);
              const active = Number(p.id) === Number(selectedProductId);
              return (
                <button
                  type="button"
                  key={p.id}
                  className={`rpe-product-item ${active ? "active" : ""}`}
                  onClick={() => setSelectedProductId(p.id)}
                >
                  <span className="rpe-product-name">{productName(p)}</span>
                  <span className="rpe-product-meta">{p.slug || "بدون اسلاگ"}</span>
                  <span className="rpe-product-flags">
                    <span className={`rpe-dot ${p.active ? "on" : "off"}`} />
                    <span>{count > 0 ? `${fmt(count)} پله` : "بدون پله"}</span>
                  </span>
                </button>
              );
            })}
            {filteredProducts.length === 0 && <div className="rpe-empty">محصولی پیدا نشد.</div>}
          </div>
        </aside>

        <section className="rpe-editor-panel">
          <div className="rpe-context-grid">
            <div className="rpe-context-card">
              <span className="rpe-k">محصول انتخابی</span>
              <strong>{productName(selectedProduct)}</strong>
              <small>{selectedProduct?.slug || "—"}</small>
            </div>
            <div className="rpe-context-card">
              <span className="rpe-k">کمترین پله فعلی</span>
              <strong>{currentMinTierPrice ? `${fmt(currentMinTierPrice)} تومان` : "بدون پله"}</strong>
              <small>{effectivePriceLira ? `${fmt(effectivePriceLira)} لیر` : "قیمت ثابت تومان"}</small>
            </div>
            <div className={`rpe-context-card ${scopeResellerId ? "reseller" : "global"}`}>
              <span className="rpe-k">محدوده ویرایش</span>
              <strong>{scopeResellerId ? (selectedReseller?.seller_code || "همکار") : "قیمت عمومی"}</strong>
              <small>{scopeResellerId ? (hasOwnOverride ? "قیمت دستی فعال" : "در حال کپی از عمومی") : "اثر روی همه همکارها"}</small>
            </div>
          </div>

          <div className="rpe-controls">
            {variants.length > 0 && (
              <label className="rpe-field" data-tour="pricing-variant-picker">
                <span>واریانت</span>
                <select
                  className="rpe-input"
                  value={selectedVariantId || ""}
                  onChange={(e) => setSelectedVariantId(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">بدون واریانت / عمومی محصول</option>
                  {variants.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.title}{v.price_lira || v.original_price ? ` — ${fmt(v.price_lira || v.original_price)} لیر` : ""}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <div className="rpe-scope" data-tour="pricing-scope-picker">
              <button
                type="button"
                className={!scopeResellerId ? "active" : ""}
                onClick={() => { setScopeResellerId(null); setResellerQuery(""); }}
              >
                عمومی
              </button>
              <button
                type="button"
                className={scopeResellerId ? "active" : ""}
                onClick={() => {
                  if (!scopeResellerId && (resellers || []).length > 0) setResellerQuery("");
                }}
              >
                اختصاصی همکار
              </button>
            </div>
          </div>

          <div className="rpe-reseller-picker">
            <input
              className="rpe-input"
              value={resellerQuery}
              onChange={(e) => setResellerQuery(e.target.value)}
              onFocus={() => {
                if (!scopeResellerId && !resellerQuery) setResellerQuery("");
              }}
              placeholder="برای قیمت اختصاصی، کد یا نام همکار را جستجو کنید..."
            />
            {scopeResellerId && (
              <button type="button" className="rpe-mini-btn" onClick={() => { setScopeResellerId(null); setResellerQuery(""); }}>
                خروج از اختصاصی
              </button>
            )}
            {scopeResellerId && hasOwnOverride && (
              <button type="button" className="rpe-mini-btn danger" onClick={handleClearOverride} disabled={busy}>
                بازگشت به عمومی
              </button>
            )}
          </div>

          {resellerQuery !== "" && (
            <div className="rpe-reseller-results">
              {filteredResellers.map((r) => (
                <button
                  type="button"
                  key={r.id}
                  className={Number(scopeResellerId) === Number(r.id) ? "active" : ""}
                  onClick={() => { setScopeResellerId(r.id); setResellerQuery(""); }}
                >
                  <span>{r.seller_code} — {r.support_name || "بی‌نام"}</span>
                  {overrideResellerIds.includes(r.id) && <b>قیمت دستی</b>}
                </button>
              ))}
              {filteredResellers.length === 0 && <div className="rpe-empty">همکاری یافت نشد.</div>}
            </div>
          )}

          {(isCrew || isLiraPriced || isFixedVariantTier || idealMinPrice > 0) && (
            <div className={`rpe-insight ${hasBelowMinTier ? "warn" : ""}`}>
              <div>
                <strong>{isCrew ? "کروپک" : isFixedVariantTier ? "واریانت تومان ثابت" : isLiraPriced ? "محصول لیرمحور" : "تحلیل قیمت"}</strong>
                <span>
                  {isFixedVariantTier
                    ? "قیمت این واریانت همان مبلغ نهایی همکار است و هنگام سفارش دوباره با نرخ لیر اسکیل نمی‌شود."
                    : isLiraPriced && !scopeResellerId && liraScaleFactor > 0
                    ? `قیمت عمومی در کاتالوگ با ضریب ${liraScaleFactor.toFixed(2)} نمایش داده می‌شود.`
                    : scopeResellerId
                      ? "قیمت اختصاصی ثابت تومانی است و با نرخ لیر اسکیل نمی‌شود."
                      : "پله‌ها را با حداقل سود پیشنهادی مقایسه کنید."}
                </span>
              </div>
              <div className="rpe-insight-numbers">
                <span>نرخ لیر: {fmt(liraRate)}</span>
                {costToman > 0 && <span>تمام‌شده: {fmt(costToman)}</span>}
                {idealMinPrice > 0 && <span>حداقل {profitPct}٪: {fmt(idealMinPrice)}</span>}
              </div>
            </div>
          )}

          {notice && <div className="rpe-notice">{notice}</div>}

          <div className="rpe-table-wrap" data-tour="pricing-chart">
            {loading ? (
              <div className="rpe-loading">در حال بارگذاری قیمت‌ها...</div>
            ) : (
              <table className="rpe-table">
                <thead>
                  <tr>
                    <th>حداقل تعداد</th>
                    <th>قیمت واحد</th>
                    <th>قیمت مؤثر</th>
                    <th>وضعیت</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {editingTiers.map((tier, idx) => {
                    const effective = !scopeResellerId && isLiraPriced && liraScaleFactor > 0
                      ? priceForDisplay(tier.price)
                      : tier.price;
                    const below = idealMinPrice > 0 && effective < idealMinPrice;
                    return (
                      <tr key={`${idx}-${tier.min_quantity}`}>
                        <td>
                          <input
                            className="rpe-number"
                            type="number"
                            min="1"
                            value={tier.min_quantity}
                            onChange={(e) => updateTier(idx, { min_quantity: parseInt(e.target.value, 10) || 1 })}
                          />
                        </td>
                        <td>
                          <input
                            className={`rpe-number price ${below ? "below" : ""}`}
                            type="number"
                            min="0"
                            value={effective}
                            onChange={(e) => updateTier(idx, { price: priceFromDisplay(parseInt(e.target.value, 10) || 0) })}
                          />
                          <small>
                            {editsEffectivePrice
                              ? `raw: ${fmtEn(tier.price)} تومان | موثر: ${fmtEn(effective)}`
                              : `${fmtEn(tier.price)} تومان`}
                          </small>
                        </td>
                        <td>
                          <strong>{fmtEn(effective)}</strong>
                          <small>{editsEffectivePrice ? `raw: ${fmtEn(tier.price)}` : "تومان"}</small>
                        </td>
                        <td>
                          <label className="rpe-switch">
                            <input
                              type="checkbox"
                              checked={tier.active}
                              onChange={(e) => updateTier(idx, { active: e.target.checked })}
                            />
                            <span>{tier.active ? "فعال" : "غیرفعال"}</span>
                          </label>
                        </td>
                        <td>
                          <button type="button" className="rpe-icon-btn" onClick={() => removeTier(idx)} title="حذف پله">
                            ×
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {editingTiers.length === 0 && (
                    <tr>
                      <td colSpan="5">
                        <div className="rpe-empty-table">
                          این محصول هنوز پله قیمت همکار ندارد. پله جدید اضافه کنید یا قیمت‌گذاری هوشمند را بزنید.
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          <div className="rpe-footer-actions">
            <button type="button" className="rpe-btn rpe-btn-soft" onClick={addTier} disabled={loading || busy}>
              افزودن پله
            </button>
            <button type="button" className="rpe-btn rpe-btn-ai" onClick={applySmartPricing} disabled={!canSmartPrice || loading || busy}>
              قیمت‌گذاری هوشمند محصول
            </button>
          </div>
        </section>
      </div>

      <style jsx>{`
        .rpe-shell {
          direction: rtl;
          color: var(--text);
        }
        .rpe-topbar {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 18px;
        }
        .rpe-title {
          margin: 0 0 5px;
          color: #fff;
          font-size: 18px;
          font-weight: 800;
        }
        .rpe-subtitle {
          margin: 0;
          color: var(--muted);
          font-size: 12.5px;
        }
        .rpe-actions,
        .rpe-footer-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .rpe-btn {
          border: 1px solid var(--line);
          border-radius: 8px;
          padding: 9px 14px;
          font-size: 12.5px;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
          transition: transform 0.15s ease, filter 0.15s ease, opacity 0.15s ease;
        }
        .rpe-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          filter: brightness(1.08);
        }
        .rpe-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }
        .rpe-btn-primary {
          color: #fff;
          border-color: transparent;
          background: linear-gradient(135deg, #2563eb, #0f766e);
        }
        .rpe-btn-primary.saved {
          background: linear-gradient(135deg, #059669, #10b981);
        }
        .rpe-btn-soft {
          color: var(--text);
          background: rgba(255, 255, 255, 0.04);
        }
        .rpe-btn-ai {
          color: #fff;
          border-color: rgba(96, 165, 250, 0.35);
          background: linear-gradient(120deg, #2563eb, #7c3aed, #0891b2, #2563eb);
          background-size: 260% 260%;
          animation: rpeAiCycle 7s ease-in-out infinite;
          box-shadow: 0 8px 22px rgba(37, 99, 235, 0.18);
        }
        @keyframes rpeAiCycle {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .rpe-layout {
          display: grid;
          grid-template-columns: minmax(260px, 320px) minmax(0, 1fr);
          gap: 16px;
          align-items: start;
        }
        .rpe-product-panel,
        .rpe-editor-panel {
          border: 1px solid var(--line);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.025);
        }
        .rpe-product-panel {
          padding: 12px;
          position: sticky;
          top: 12px;
        }
        .rpe-panel-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
          color: var(--muted);
          font-size: 12px;
          font-weight: 700;
        }
        .rpe-panel-head strong {
          color: #fff;
        }
        .rpe-input {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid var(--line);
          border-radius: 8px;
          padding: 9px 10px;
          background: var(--card);
          color: var(--text);
          font-size: 12.5px;
          outline: none;
        }
        .rpe-input:focus,
        .rpe-number:focus {
          border-color: #3b82f6;
        }
        .rpe-product-list {
          display: flex;
          flex-direction: column;
          gap: 7px;
          max-height: 620px;
          overflow-y: auto;
          margin-top: 10px;
          padding-left: 2px;
        }
        .rpe-product-item {
          display: grid;
          gap: 4px;
          width: 100%;
          border: 1px solid var(--line);
          border-radius: 8px;
          padding: 10px;
          color: var(--text);
          background: rgba(255, 255, 255, 0.025);
          cursor: pointer;
          text-align: right;
        }
        .rpe-product-item.active {
          border-color: rgba(59, 130, 246, 0.75);
          background: rgba(59, 130, 246, 0.12);
        }
        .rpe-product-name {
          font-size: 13px;
          font-weight: 800;
          color: #fff;
          line-height: 1.6;
        }
        .rpe-product-meta,
        .rpe-product-flags {
          color: var(--muted);
          font-size: 11.5px;
        }
        .rpe-product-flags {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .rpe-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #ef4444;
        }
        .rpe-dot.on {
          background: #10b981;
        }
        .rpe-editor-panel {
          padding: 14px;
          min-width: 0;
        }
        .rpe-context-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
          margin-bottom: 12px;
        }
        .rpe-context-card {
          display: grid;
          gap: 4px;
          border: 1px solid var(--line);
          border-radius: 8px;
          padding: 11px;
          background: rgba(255, 255, 255, 0.03);
        }
        .rpe-context-card.global {
          border-color: rgba(245, 158, 11, 0.35);
        }
        .rpe-context-card.reseller {
          border-color: rgba(16, 185, 129, 0.35);
        }
        .rpe-k,
        .rpe-context-card small,
        .rpe-field span {
          color: var(--muted);
          font-size: 11.5px;
          font-weight: 600;
        }
        .rpe-context-card strong {
          color: #fff;
          font-size: 14px;
          line-height: 1.5;
        }
        .rpe-controls {
          display: flex;
          gap: 10px;
          align-items: end;
          flex-wrap: wrap;
          margin-bottom: 10px;
        }
        .rpe-field {
          display: grid;
          gap: 5px;
          min-width: 260px;
          flex: 1;
        }
        .rpe-scope {
          display: flex;
          border: 1px solid var(--line);
          border-radius: 8px;
          overflow: hidden;
          min-width: 260px;
        }
        .rpe-scope button {
          flex: 1;
          border: 0;
          padding: 10px 12px;
          color: var(--muted);
          background: transparent;
          cursor: pointer;
          font-size: 12px;
          font-weight: 800;
        }
        .rpe-scope button.active {
          color: #fff;
          background: #2563eb;
        }
        .rpe-reseller-picker {
          display: flex;
          gap: 8px;
          margin-bottom: 8px;
        }
        .rpe-mini-btn {
          flex: 0 0 auto;
          border: 1px solid var(--line);
          border-radius: 8px;
          padding: 0 10px;
          color: var(--text);
          background: rgba(255, 255, 255, 0.04);
          cursor: pointer;
          font-size: 11.5px;
          font-weight: 700;
        }
        .rpe-mini-btn.danger {
          color: #f87171;
          border-color: rgba(248, 113, 113, 0.35);
        }
        .rpe-reseller-results {
          border: 1px solid var(--line);
          border-radius: 8px;
          overflow: hidden;
          margin-bottom: 10px;
        }
        .rpe-reseller-results button {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          width: 100%;
          border: 0;
          border-bottom: 1px solid var(--line);
          padding: 9px 11px;
          color: var(--text);
          background: transparent;
          cursor: pointer;
          text-align: right;
          font-size: 12.5px;
        }
        .rpe-reseller-results button:last-child {
          border-bottom: 0;
        }
        .rpe-reseller-results button:hover,
        .rpe-reseller-results button.active {
          background: rgba(59, 130, 246, 0.1);
        }
        .rpe-reseller-results b {
          color: #fbbf24;
          font-size: 11px;
        }
        .rpe-insight {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          border: 1px solid rgba(59, 130, 246, 0.28);
          border-radius: 8px;
          background: rgba(59, 130, 246, 0.08);
          padding: 10px 12px;
          margin: 10px 0;
        }
        .rpe-insight.warn {
          border-color: rgba(245, 158, 11, 0.4);
          background: rgba(245, 158, 11, 0.08);
        }
        .rpe-insight strong {
          display: block;
          color: #fff;
          font-size: 13px;
          margin-bottom: 3px;
        }
        .rpe-insight span {
          color: var(--muted);
          font-size: 11.5px;
          line-height: 1.7;
        }
        .rpe-insight-numbers {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }
        .rpe-insight-numbers span {
          border: 1px solid var(--line);
          border-radius: 999px;
          padding: 3px 8px;
          background: rgba(0, 0, 0, 0.08);
          white-space: nowrap;
        }
        .rpe-notice {
          border: 1px solid rgba(245, 158, 11, 0.35);
          border-radius: 8px;
          background: rgba(245, 158, 11, 0.08);
          color: #fbbf24;
          padding: 9px 11px;
          margin: 10px 0;
          font-size: 12.5px;
        }
        .rpe-table-wrap {
          border: 1px solid var(--line);
          border-radius: 8px;
          overflow-x: auto;
        }
        .rpe-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 680px;
        }
        .rpe-table th,
        .rpe-table td {
          border-bottom: 1px solid var(--line);
          padding: 10px;
          text-align: right;
          vertical-align: middle;
        }
        .rpe-table th {
          color: var(--muted);
          font-size: 11.5px;
          font-weight: 800;
          background: rgba(255, 255, 255, 0.025);
        }
        .rpe-table tr:last-child td {
          border-bottom: 0;
        }
        .rpe-number {
          width: 110px;
          box-sizing: border-box;
          border: 1px solid var(--line);
          border-radius: 8px;
          padding: 8px;
          color: var(--text);
          background: var(--card);
          font-family: monospace;
          font-size: 13px;
          font-weight: 800;
          outline: none;
        }
        .rpe-number.price {
          width: 150px;
        }
        .rpe-number.below {
          border-color: rgba(239, 68, 68, 0.55);
        }
        .rpe-table small {
          display: block;
          margin-top: 4px;
          color: var(--muted);
          font-size: 10.5px;
        }
        .rpe-table td strong {
          color: #fff;
          font-family: monospace;
        }
        .rpe-switch {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: var(--muted);
          font-size: 12px;
          cursor: pointer;
          white-space: nowrap;
        }
        .rpe-icon-btn {
          width: 30px;
          height: 30px;
          border: 1px solid rgba(248, 113, 113, 0.32);
          border-radius: 8px;
          color: #f87171;
          background: rgba(248, 113, 113, 0.08);
          cursor: pointer;
          font-size: 20px;
          line-height: 1;
        }
        .rpe-empty,
        .rpe-empty-table,
        .rpe-loading {
          padding: 18px;
          color: var(--muted);
          text-align: center;
          font-size: 12.5px;
        }
        .rpe-footer-actions {
          margin-top: 12px;
        }

        @media (max-width: 980px) {
          .rpe-layout {
            grid-template-columns: 1fr;
          }
          .rpe-product-panel {
            position: static;
          }
          .rpe-context-grid {
            grid-template-columns: 1fr;
          }
          .rpe-topbar,
          .rpe-insight,
          .rpe-reseller-picker {
            flex-direction: column;
          }
          .rpe-actions,
          .rpe-footer-actions,
          .rpe-mini-btn {
            width: 100%;
          }
          .rpe-btn,
          .rpe-mini-btn {
            justify-content: center;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}
