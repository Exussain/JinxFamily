"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "../../../components/Navbar";
import PasswordInput from '../../../components/PasswordInput';
import SmartImage from "../../../components/SmartImage";
import { useCart } from "../../../lib/useCart";
import { resolveProductImage } from "../../../lib/productImageHelpers";
import TelegramContact from "../../../components/TelegramContact";
import { adminCacheBustHref } from "../../../lib/adminUrl.mjs";
import RelatedProducts from "../../../components/RelatedProducts";
import ReviewSection from "../../../components/ReviewSection";

function StockAlertForm({ product, apiBase }) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError("لطفاً یک ایمیل معتبر وارد کنید.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`${apiBase}/api/product-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product_name: `[اطلاع‌رسانی موجودی] ${product.name_fa} (شناسه: ${product.id})`,
          contact_info: email.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطا در ثبت درخواست");
      setSubmitted(true);
    } catch (err) {
      setError(err.message || "خطایی در ثبت درخواست رخ داد.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="info-card" style={{ borderRadius: 14, padding: 20, background: "rgba(16,185,129,0.08)", border: "2px solid rgba(16,185,129,0.3)", textAlign: "center" }}>
        <div style={{ fontSize: 24, marginBottom: 8 }}>✅</div>
        <div style={{ fontWeight: 900, fontSize: 15, color: "#10b981", marginBottom: 6 }}>درخواست شما ثبت شد!</div>
        <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>به محض موجود شدن محصول <strong>{product.name_fa}</strong>، ایمیل اطلاع‌رسانی برای شما ارسال خواهد شد.</div>
      </div>
    );
  }

  return (
    <div className="info-card" style={{ borderRadius: 14, padding: 20, background: "var(--card)", border: "2px solid var(--line)", boxShadow: "0 4px 12px rgba(0,0,0,0.06)" }}>
      <div style={{ fontWeight: 900, display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 20 }}>🔔</span>
        <span style={{ color: 'var(--text)', fontSize: 15 }}>اطلاع از موجود شدن محصول</span>
      </div>
      <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 16px 0" }}>
        این محصول در حال حاضر موجود نیست. ایمیل خود را وارد کنید تا به محض شارژ مجدد و امکان خرید، فوراً باخبر شوید:
      </p>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
        <input
          type="email"
          required
          placeholder="email@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={submitting}
          style={{
            border: "2px solid var(--line)",
            borderRadius: 10,
            padding: "12px 14px",
            background: "var(--bg)",
            color: "var(--text)",
            fontSize: 14,
            outline: "none",
            width: "100%",
            textAlign: "left",
            direction: "ltr",
          }}
        />
        {error && (
          <div style={{ color: "var(--danger)", fontSize: 12, fontWeight: 700 }}>
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="btn primary"
          style={{
            width: '100%',
            padding: '12px 20px',
            fontSize: '15px',
            fontWeight: 900,
          }}
        >
          {submitting ? "در حال ثبت..." : "خبرم کن وقتی موجود شد"}
        </button>
      </form>
    </div>
  );
}

export default function ProductPageClient({ slug: slugProp, initialProduct = null, initialProducts = [], initialStats = null }) {
  const params = useParams();
  const slug = slugProp || params?.slug;
  const router = useRouter();
  const { addItem } = useCart();
  // Server page pre-fetches the product so the first HTML paint (and what
  // crawlers see) already contains the full product content.
  const [product, setProduct] = useState(initialProduct);
  const [products, setProducts] = useState(initialProducts);
  const [loading, setLoading] = useState(!initialProduct);
  const [error, setError] = useState("");
  const [customFieldValues, setCustomFieldValues] = useState({});
  const [formError, setFormError] = useState("");
  const [showValidation, setShowValidation] = useState(false);
  const [reviewStats, setReviewStats] = useState(() =>
    initialStats
      ? {
          total: Number(initialStats.total) || 0,
          rating: Number(initialStats.average_rating) || 0,
        }
      : { total: 0, rating: 0 }
  );
  const [activeTab, setActiveTab] = useState("description");
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const todayFa = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { day: "numeric", month: "long", timeZone: "Asia/Tehran" }).format(new Date());

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "";

  const _2FA_COLORS = {
    amber: { banner: { display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 12px", background: "linear-gradient(135deg, rgba(245,158,11,0.12), rgba(180,83,9,0.06))", border: "1px solid rgba(245,158,11,0.4)", borderRadius: 8, color: "#b45309", fontSize: 12, fontWeight: 700, textDecoration: "none", transition: "all 0.2s ease" } },
    blue: { banner: { display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 12px", background: "linear-gradient(135deg, rgba(37,99,235,0.12), rgba(30,64,175,0.06))", border: "1px solid rgba(37,99,235,0.4)", borderRadius: 8, color: "#2563eb", fontSize: 12, fontWeight: 700, textDecoration: "none", transition: "all 0.2s ease" } },
    gray: { banner: { display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 12px", background: "linear-gradient(135deg, rgba(107,114,128,0.12), rgba(75,85,99,0.06))", border: "1px solid rgba(107,114,128,0.4)", borderRadius: 8, color: "#4b5563", fontSize: 12, fontWeight: 700, textDecoration: "none", transition: "all 0.2s ease" } },
    red: { banner: { display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 12px", background: "linear-gradient(135deg, rgba(239,68,68,0.12), rgba(220,38,38,0.08))", border: "1px solid rgba(239,68,68,0.4)", borderRadius: 8, color: "#dc2626", fontSize: 12, fontWeight: 700, textDecoration: "none", transition: "all 0.2s ease" } },
  };


  useEffect(() => {
    if (!slug) return;
    // Server already provided the product — just sync dependent state and
    // skip the redundant client fetch (prices stay fresh via no-store SSR).
    if (initialProduct) {
      setSelectedVariantId(initialProduct?.variants?.[0]?.id ?? null);
      return;
    }
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${apiBase}/api/products/${encodeURIComponent(slug)}`, {
          cache: "no-store",
        });
        if (!res.ok) {
          setError("محصول یافت نشد.");
          setProduct(null);
          return;
        }
        const data = await res.json();
        setProduct(data);
        setSelectedVariantId(data?.variants?.[0]?.id ?? null);
      } catch {
        setError("خطا در بارگذاری محصول.");
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug, apiBase, initialProduct]);

  useEffect(() => {
    if (products.length) return;
    const loadProducts = async () => {
      try {
        const res = await fetch(`${apiBase}/api/products`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        setProducts(Array.isArray(data?.results) ? data.results : []);
      } catch {
        // Related products are progressive enhancement; ignore failures.
      }
    };
    loadProducts();
  }, [apiBase, products.length]);


  const renderTextWithBold = (text, keyPrefix) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
    return parts.map((part, idx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={`${keyPrefix}-${idx}`}>
            {part.slice(2, -2)}
          </strong>
        );
      }
      return <span key={`${keyPrefix}-${idx}`}>{part}</span>;
    });
  };

  const descriptionLines = (product?.description || "")
    .split("\n")
    .filter((line) => line.trim().length > 0);
  const deliveryLines = (product?.delivery_text || "")
    .split("\n")
    .filter((line) => line.trim().length > 0);
  // Effective tab: the "نحوه تحویل" (delivery) tab is always available, but the
  // "توضیحات" (description) tab only renders when there is a description. If the
  // selected tab has no content (e.g. description tab on a product with no
  // description), fall back to delivery so the panel never renders empty.
  const effectiveTab = activeTab === 'description' && descriptionLines.length === 0
    ? 'delivery'
    : activeTab;

  const { imageBase, imageSrc } = resolveProductImage(product || {});
  const customFields = Array.isArray(product?.custom_fields) ? product.custom_fields : [];
  const faqItems = Array.isArray(product?.faq) ? product.faq : [];
  const productCategory = (product?.category || "").toLowerCase();
  const productCategoryTitle = product?.category_title || "";
  const hasCustomFields = customFields.length > 0;
  const needs2FA = product?.requires_2fa === true;
  const disable2faColor = product?.disable_2fa_color || "amber";
  const disable2faText = product?.disable_2fa_text || "2FA را قبل از خرید خاموش کنید";
  const isCrew = product?.slug === "fortnite-crew-pack";
  const isStarterPack = slug === "fortnite-starter-pack" || product?.slug === "fortnite-starter-pack";
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  const hasVariants = variants.length > 0;
  const selectedVariant = hasVariants
    ? variants.find((v) => v.id === selectedVariantId) || variants[0]
    : null;
  const variantGroups = [];
  for (const v of variants) {
    const label = v.group_fa || "";
    const lastGroup = variantGroups[variantGroups.length - 1];
    if (lastGroup && lastGroup.label === label) lastGroup.items.push(v);
    else variantGroups.push({ label, items: [v] });
  }
  const originalPrice = selectedVariant
    ? (Number(selectedVariant.original_price) > Number(selectedVariant.price) ? Number(selectedVariant.original_price) : 0)
    : (product?.original_price || 0);
  const displayPrice = Number(selectedVariant?.price ?? product?.price ?? product?.min_price ?? 0);
  const hasPrice = displayPrice > 0;
  const isOutOfStock = !product || !!product.ordering_disabled || !!product.customer_ordering_disabled || !hasPrice;

  const isFieldRequired = (field) => field.required === true;

  const parseDeliveryLine = (line) => {
    const cleanLine = line.replace(/^[\d\u06F0-\u06F9]+[\.\-\s\u2022]*/, '').trim();
    const parts = cleanLine.split(/[:：\-]/);
    if (parts.length > 1) {
      return {
        title: parts[0].trim(),
        desc: parts.slice(1).join(':').trim()
      };
    }
    return {
      title: '',
      desc: cleanLine
    };
  };

  const isFieldValid = (field, value) => {
    const v = (value || "").trim();
    if (isFieldRequired(field) && !v) return false;
    if (field.type === "email" && v) return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);
    return true;
  };

  const handleAdd = () => {
    if (!product) return;
    setShowValidation(true);

    if (hasCustomFields) {
      for (const field of customFields) {
        const val = customFieldValues[field.key] || "";
        if (!isFieldValid(field, val)) {
          const label = field.label || field.key;
          if (isFieldRequired(field) && !(val || "").trim()) {
            setFormError(`"${label}" را وارد کنید.`);
          } else if (field.type === "email") {
            setFormError(`"${label}" معتبر نیست.`);
          }
          return;
        }
      }
    }
    if (!hasPrice) {
      setFormError("این محصول در حال حاضر در دسترس نیست.");
      return;
    }
    setFormError("");
    const { imageBase: imgBase, imageSrc: imgSrc } = resolveProductImage(product);
    const productImage = imgSrc || (imgBase ? `${imgBase}.webp` : null);
    const item = {
      product_id: product.id,
      variant_id: selectedVariant ? selectedVariant.id : undefined,
      name: selectedVariant ? `${product.name_fa} - ${selectedVariant.title}` : product.name_fa,
      price: displayPrice,
      quantity: 1,
      slug: product.slug,
      image: productImage,
      category: product.category || "",
    };
    if (hasCustomFields) {
      item.custom_fields = {};
      for (const field of customFields) {
        item.custom_fields[field.key] = (customFieldValues[field.key] || "").trim();
      }
    }
    addItem(item);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("cart:add"));
    }
  };

  useEffect(() => {
    if (loading || !product) return;
    const shouldScrollToReviews =
      typeof window !== "undefined" && window.location.hash === "#reviews";
    if (!shouldScrollToReviews) return;
    const timer = setTimeout(() => {
      document.getElementById("reviews")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 400);
    return () => clearTimeout(timer);
  }, [loading, product]);

  const scrollToReviews = useCallback(() => {
    if (typeof document === "undefined") return;
    document.getElementById("reviews")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <div>
      <Navbar />
      <main className="container" style={{ padding: "24px 0 40px" }}>
        {/* minHeight keeps the fallback shell viewport-sized so the swap to
            real content on client fetch scores ~0 CLS (only hit when the
            server-side prefetch failed, e.g. backend restart). */}
        {loading && <div className="muted" style={{ minHeight: "100vh" }}>در حال بارگذاری محصول…</div>}
        {!loading && error && (
          <div className="muted" style={{ color: "var(--danger)" }}>
            {error}
          </div>
        )}
        {!loading && product && (
          <>
            <section className="card section product-hero">
              <div className="image-stack">
                {/* Main Image */}
                <div
                  className="hero-image"
                  style={{
                    // aspect-ratio reserves the image box before the file
                    // decodes — without it the img painted at 0px and pushed
                    // the whole viewport down once loaded (CLS 1.0 on mobile).
                    // Same reserved-square + contain pattern as /crewpack.
                    aspectRatio: "1/1",
                    borderRadius: 18,
                    overflow: "hidden",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center"
                  }}
                >
                  <img
                    src={imageSrc}
                    alt={product.name_fa}
                    fetchPriority="high"
                    decoding="async"
                    style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
                    draggable="false"
                  />
                </div>

                {isOutOfStock ? (
                  <StockAlertForm product={product} apiBase={apiBase} />
                ) : (hasCustomFields || needs2FA) && (
                  <div
                    className="info-card"
                    style={{
                      borderRadius: 14,
                      padding: 16,
                      background: "var(--card)",
                      border: "2px solid var(--line)",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                    }}
                  >
                    <div style={{ fontWeight: 900, display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", marginBottom: 8 }}>
                      <span style={{ color: 'var(--text)', fontSize: 15 }}>اطلاعات لازم برای فعال‌سازی</span>
                    </div>
                    <div style={{ fontSize: 13, lineHeight: 1.7, display: "grid", gap: 8, marginBottom: 8 }}>
                      {hasCustomFields && (
                        <div style={{ color: "var(--text)" }}>
                          <span style={{ fontWeight: 800, fontSize: 13 }}>لطفاً قبل از افزودن به سبد تکمیل کنید:</span>
                          <ul style={{ paddingInlineStart: 18, margin: "6px 0", display: "grid", gap: 4, color: 'var(--muted)' }}>
                            {customFields.map((f) => (
                              <li key={f.key}>
                                {f.label} {isFieldRequired(f) ? "(اجباری)" : "(اختیاری)"}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {needs2FA && (
                        <a
                          href="/guides/disable-2fa"
                          target="_blank"
                          rel="noopener noreferrer"
                          style={(_2FA_COLORS[disable2faColor] || _2FA_COLORS.amber).banner}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                            <path d="M12 8v4"/>
                            <path d="M12 16h.01"/>
                          </svg>
                          {disable2faText}
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M7 17L17 7"/>
                            <path d="M7 7h10v10"/>
                          </svg>
                        </a>
                      )}
                    </div>
                    <div style={{ display: "grid", gap: 12, marginTop: 8 }}>
                      {customFields.map((field) => {
                        const fieldVal = customFieldValues[field.key] || "";
                        const hasError = showValidation && !isFieldValid(field, fieldVal);
                        const inputStyle = {
                          border: hasError ? "2px solid #ef4444" : "2px solid var(--line)",
                          borderRadius: 10,
                          padding: "12px 14px",
                          background: "var(--card)",
                          color: "var(--text)",
                          fontSize: 14,
                          fontWeight: 500,
                          transition: "all 0.2s ease",
                          outline: "none",
                          width: "100%",
                        };
                        return (
                          <label key={field.key} style={{ display: "grid", gap: 6, fontSize: 13 }}>
                            <span style={{
                              fontWeight: 700,
                              color: hasError ? "#ef4444" : "var(--text)",
                              fontSize: 13
                            }}>
                              {field.label} {isFieldRequired(field) ? "(اجباری)" : ""}
                              {hasError && <span style={{ fontSize: 11 }}>⚠️</span>}
                            </span>
                            {field.type === "select" ? (
                              <select
                                value={fieldVal}
                                onChange={(e) => {
                                  setCustomFieldValues((prev) => ({ ...prev, [field.key]: e.target.value }));
                                  setFormError("");
                                  if (showValidation) setShowValidation(false);
                                }}
                                style={inputStyle}
                                onFocus={(e) => e.target.style.borderColor = "#3b82f6"}
                                onBlur={(e) => e.target.style.borderColor = hasError ? "#ef4444" : "var(--line)"}
                              >
                                <option value="">{field.placeholder || "انتخاب کنید"}</option>
                                {(field.options || []).map((opt, i) => (
                                  <option key={i} value={opt}>{opt}</option>
                                ))}
                              </select>
                            ) : field.type === "textarea" ? (
                              <textarea
                                rows={3}
                                value={fieldVal}
                                onChange={(e) => {
                                  setCustomFieldValues((prev) => ({ ...prev, [field.key]: e.target.value }));
                                  setFormError("");
                                  if (showValidation) setShowValidation(false);
                                }}
                                placeholder={field.placeholder || ""}
                                style={{ ...inputStyle, resize: "vertical" }}
                                onFocus={(e) => e.target.style.borderColor = "#3b82f6"}
                                onBlur={(e) => e.target.style.borderColor = hasError ? "#ef4444" : "var(--line)"}
                              />
                            ) : field.type === "password" ? (
                              <PasswordInput
                                value={fieldVal}
                                onChange={(e) => {
                                  setCustomFieldValues((prev) => ({ ...prev, [field.key]: e.target.value }));
                                  setFormError("");
                                  if (showValidation) setShowValidation(false);
                                }}
                                placeholder={field.placeholder || "••••••••"}
                                style={{
                                  ...inputStyle,
                                  padding: "12px 44px 12px 14px",
                                }}
                                onFocus={(e) => e.target.style.borderColor = "#3b82f6"}
                                onBlur={(e) => e.target.style.borderColor = hasError ? "#ef4444" : "var(--line)"}
                              />
                            ) : (
                              <input
                                type={field.type || "text"}
                                value={fieldVal}
                                onChange={(e) => {
                                  setCustomFieldValues((prev) => ({ ...prev, [field.key]: e.target.value }));
                                  setFormError("");
                                  if (showValidation) setShowValidation(false);
                                }}
                                placeholder={field.placeholder || ""}
                                style={inputStyle}
                                onFocus={(e) => e.target.style.borderColor = "#3b82f6"}
                                onBlur={(e) => e.target.style.borderColor = hasError ? "#ef4444" : "var(--line)"}
                              />
                            )}
                          </label>
                        );
                      })}
                      {formError && (
                        <div style={{
                          color: "var(--danger)",
                          fontWeight: 800,
                          fontSize: 13,
                          padding: "10px 12px",
                          background: "rgba(239,68,68,0.1)",
                          border: "1px solid rgba(239,68,68,0.3)",
                          borderRadius: 8
                        }}>
                          {formError}
                        </div>
                      )}

                      <button
                        type="button"
                        className="btn primary"
                        onClick={handleAdd}
                        style={{
                          width: '100%',
                          padding: '14px 20px',
                          fontSize: '16px',
                          fontWeight: 900,
                          marginTop: 8
                        }}
                      >
                        افزودن به سبد خرید
                      </button>
                    </div>
                  </div>
                )}
                {/* Guides Card - LEFT column copy: shown at medium-wide screens (960-1280px) when right col has more space */}
                {productCategory === 'fortnite' && (
                  <div className="guides-card guides-card-left hide-mobile" style={{ marginTop: 0 }}>
                    <div className="guides-title">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                      </svg>
                      صفحات مرتبط
                    </div>
                    <div style={{ display: "grid", gap: 10 }}>
                      <a href="/guides/disable-2fa" target="_blank" rel="noopener noreferrer" className="guide-link-item">
                        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 14 }}>🛡️</span>
                          آموزش خاموش کردن تایید دو مرحله‌ای (2FA)
                        </span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                      </a>
                      <a href="/guides/link-unlink" target="_blank" rel="noopener noreferrer" className="guide-link-item">
                        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 14 }}>🔗</span>
                          آموزش اتصال و لینک کردن اکانت
                        </span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                      </a>
                      <a href="/guides/remove-restriction" target="_blank" rel="noopener noreferrer" className="guide-link-item">
                        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 14 }}>⚠️</span>
                          آموزش رفع محدودیت و ریستریکت اکانت
                        </span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                      </a>
                    </div>
                  </div>
                )}
                {/* Guides and Tutorials Card (Mobile Only) */}
                {productCategory === 'fortnite' && (
                  <div className="guides-card show-mobile">
                    <div className="guides-title">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                      </svg>
                      صفحات مرتبط
                    </div>
                    <div style={{ display: "grid", gap: 10 }}>
                      <a
                        href="/guides/disable-2fa"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="guide-link-item"
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 14 }}>🛡️</span>
                          آموزش خاموش کردن تایید دو مرحله‌ای (2FA)
                        </span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                      </a>

                      <a
                        href="/guides/link-unlink"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="guide-link-item"
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 14 }}>🔗</span>
                          آموزش اتصال و لینک کردن اکانت
                        </span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                      </a>

                      <a
                        href="/guides/remove-restriction"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="guide-link-item"
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 14 }}>⚠️</span>
                          آموزش رفع محدودیت و ریستریکت اکانت
                        </span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                      </a>
                    </div>
                  </div>
                )}
              </div>
              <div className="details-stack" style={{ display: "grid", gap: 16 }}>
                <div className="title-block" style={{ display: "flex", flexDirection: "column" }}>
                  <h1 className="title-row" style={{ margin: 0, fontSize: 24, fontWeight: 900, marginBottom: 8 }}>
                    {product.name_fa}
                  </h1>
                  {product.subtitle && (
                    <div className="muted subtitle-row" style={{ fontSize: 14, marginBottom: 4 }}>{product.subtitle}</div>
                  )}
                  {product.slug === 'chatgpt-subscription' && (
                    <div className="nubix-fomo-badge">
                      <span className="pulse-dot"></span>
                      <span>ارزان‌ترین قیمت روی زمین (تضمین نوبیکس) ⚡</span>
                    </div>
                  )}

                  {/* Rating Summary */}
                  {reviewStats.total > 0 && (
                    <button
                      type="button"
                      className="rating-summary-chip"
                      onClick={scrollToReviews}
                      title="مشاهده نظرات کاربران"
                    >
                      <span className="rating-summary-star">★</span>
                      <span className="rating-summary-score">{reviewStats.rating.toFixed(1)}</span>
                      <span className="rating-summary-count">
                        ({reviewStats.total.toLocaleString("fa-IR")} نظر)
                      </span>
                      <span className="rating-summary-cta">مشاهده نظرات</span>
                    </button>
                  )}
                </div>

                {/* Capacity / TCMB notice for Crew Pack */}
                {isCrew && (
                  <div
                    className="crew-notice"
                    style={{
                      padding: "14px 16px",
                      background: "linear-gradient(135deg, rgba(59,130,246,0.1), rgba(99,102,241,0.08))",
                      border: "2px solid rgba(59,130,246,0.3)",
                      borderRadius: 12,
                      fontSize: 13,
                      lineHeight: 1.7,
                      color: "var(--text)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <svg
                        style={{ width: 20, height: 20, color: "#3b82f6", flexShrink: 0 }}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 16v-4M12 8h.01" />
                      </svg>
                      <span style={{ fontWeight: 900, color: "#3b82f6" }}>قوانین جدید بانک مرکزی ترکیه (TCMB)</span>
                    </div>
                    <div style={{ fontSize: 12.5, color: "var(--muted)" }}>
                      • خریدهای کروپک از طریق پرداخت‌های مکرر درون‌برنامه‌ای با ویزا و مسترکارت انجام می‌شود<br />
                      • به‌علت محدودیت‌های جدید TCMB، روزانه فقط تعداد مشخصی تراکنش می‌توانیم انجام دهیم و سبد هر ۲۴ ساعت راس ساعت ۱۵:۳۰ شارژ می‌شود<br />
                      • تمام فعال‌سازی‌ها به‌صورت کاملاً قانونی و از طریق درگاه‌های رسمی انجام می‌شود
                    </div>
                  </div>
                )}

                {/* Plan / variant selector */}
                {hasVariants && (
                  <div className="plan-picker">
                    <div className="plan-picker-title">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 11l3 3L22 4" />
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                      </svg>
                      {(productCategory.includes("ai") || productCategory.includes("subscriptions"))
                        ? "انتخاب پلن اشتراک" : "انتخاب گزینه"}
                    </div>
                    {variantGroups.map((group, gi) => (
                      <div key={group.label || gi} className="plan-group">
                        {group.label && (
                          <div className="plan-group-header">
                            <span className="plan-group-chip">{group.label}</span>
                            <span className="plan-group-line" />
                          </div>
                        )}
                        <div className="plan-options">
                          {group.items.map((v) => {
                            const active = selectedVariant?.id === v.id;
                            const hasOld = Number(v.original_price) > Number(v.price);
                            return (
                              <button
                                type="button"
                                key={v.id}
                                className={`plan-option ${active ? "active" : ""}`}
                                onClick={() => setSelectedVariantId(v.id)}
                                aria-pressed={active}
                              >
                                <span className="plan-radio" aria-hidden="true" />
                                <span className="plan-option-title">{v.title}</span>
                                <span className="plan-option-price">
                                  {hasOld && (
                                    <s className="plan-old-price">{Number(v.original_price).toLocaleString("fa-IR")}</s>
                                  )}
                                  <b>{Number(v.price).toLocaleString("fa-IR")}</b>
                                  <small>تومان</small>
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Price Row - Moved Up */}
                <div className="price-row" style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", margin: "4px 0" }}>
                  {isOutOfStock ? (
                    <div className="muted" style={{ fontSize: 18, fontWeight: 900, color: "var(--danger)" }}>
                      این محصول در حال حاضر ناموجود است
                    </div>
                  ) : (
                    <>
                      {originalPrice && (
                        <div className="price-old" style={{ fontSize: 16, textDecoration: "line-through", color: "var(--muted)" }}>
                          {originalPrice.toLocaleString("fa-IR")} تومان
                        </div>
                      )}
                      <div className="price" style={{ fontSize: 28, fontWeight: 900, background: "linear-gradient(135deg, var(--text) 30%, var(--primary) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", display: "inline-flex", gap: 4, alignItems: "baseline" }}>
                        <span>{displayPrice.toLocaleString("fa-IR")}</span>
                        <span style={{ fontSize: 14, fontWeight: 700, WebkitTextFillColor: "var(--text)" }}>تومان</span>
                      </div>
                      {originalPrice && originalPrice > displayPrice && (
                        <span className="price-discount-percent">
                          {Math.round((1 - (displayPrice / originalPrice)) * 100).toLocaleString("fa-IR")}٪ تخفیف ویژه
                        </span>
                      )}
                    </>
                  )}
                </div>

                {/* Buy Button for Products Without Account Form */}
                {!hasCustomFields && !isOutOfStock && (
                  <button
                    type="button"
                    className="btn primary details-buy-btn"
                    onClick={handleAdd}
                    style={{
                      width: '100%',
                      padding: '14px 20px',
                      fontSize: '16px',
                      fontWeight: 900,
                      marginTop: 8
                    }}
                  >
                    افزودن به سبد خرید
                  </button>
                )}

                {/* Product Highlights - Horizontal */}
                <div className="product-highlights hide-mobile">
                  <div className="highlight-item">
                    <svg className="highlight-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="m9 12 2 2 4-4"/>
                    </svg>
                    <div className="highlight-text">
                      <div className="highlight-title">تحویل طی</div>
                      <div className="highlight-desc">
                        {"۱۵ دقیقه تا ۸ ساعت کاری"}
                      </div>
                    </div>
                  </div>
                  <div className="highlight-item">
                    <svg className="highlight-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                    <div className="highlight-text">
                      <div className="highlight-title">ضمانت اصالت</div>
                      <div className="highlight-desc">۱۰۰٪ اورجینال</div>
                    </div>
                  </div>
                  <div className="highlight-item">
                    <svg className="highlight-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    <div className="highlight-text">
                      <div className="highlight-title">پشتیبانی ۲۴/۷</div>
                      <div className="highlight-desc">همیشه در دسترس</div>
                    </div>
                  </div>
                </div>

                {/* Expandable Description Accordion (all viewports).
                    Full text stays mounted so crawlers index it; collapsed state
                    only clamps height via CSS, never removes content from the DOM. */}
                {descriptionLines.length > 0 && (
                  <div className={`desc-accordion${showFullDescription ? ' open' : ''}`}>
                    <button
                      type="button"
                      className="desc-accordion-head"
                      onClick={() => setShowFullDescription(!showFullDescription)}
                      aria-expanded={showFullDescription}
                    >
                      <span className="desc-accordion-title">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                        </svg>
                        توضیحات محصول
                      </span>
                      <svg className="desc-accordion-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                    <div className="desc-accordion-body">
                      <div className="description-box">
                        {descriptionLines.map((line, i) => {
                          if (line.trim().startsWith('•')) {
                            return <div key={i} style={{ marginBottom: '8px' }}>{renderTextWithBold(line, `d-bullet-${i}`)}</div>;
                          }
                          return <div key={i} style={{ marginBottom: '6px' }}>{renderTextWithBold(line, `d-line-${i}`)}</div>;
                        })}
                      </div>
                      <div className="desc-accordion-fade" aria-hidden="true" />
                    </div>
                  </div>
                )}

                {/* Delivery section */}
                <div className="product-tabs hide-mobile">
                  <div className="delivery-header">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="1" y="3" width="15" height="13" />
                      <path d="M16 8h4l3 3v5h-7V8z" />
                      <circle cx="5.5" cy="18.5" r="2.5" />
                      <circle cx="18.5" cy="18.5" r="2.5" />
                    </svg>
                    نحوه تحویل
                  </div>

                  <div className="tab-content">
                    {(
                      <div className="delivery-info" hidden={effectiveTab !== 'delivery'}>
                        {deliveryLines.length > 0 ? (
                          deliveryLines.map((line, i) => {
                            const parsed = parseDeliveryLine(line);
                            return (
                              <div key={i} className="delivery-step">
                                <div className="step-number">{(i + 1).toLocaleString("fa-IR")}</div>
                                <div className="step-content-card">
                                  {parsed.title ? (
                                    <>
                                      <div className="step-title">{parsed.title}</div>
                                      <div className="step-desc">{parsed.desc}</div>
                                    </>
                                  ) : (
                                    <div className="step-desc" style={{ color: "var(--text)", fontWeight: 700 }}>{parsed.desc}</div>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <>
                            <div className="delivery-step">
                              <div className="step-number">۱</div>
                              <div className="step-content-card">
                                <div className="step-title">وارد کردن اطلاعات حساب</div>
                                <div className="step-desc">پلتفرم، ایمیل و رمز حساب خود را وارد کنید</div>
                              </div>
                            </div>
                            <div className="delivery-step">
                              <div className="step-number">۲</div>
                              <div className="step-content-card">
                                <div className="step-title">پرداخت امن</div>
                                <div className="step-desc">از طریق درگاه امن بانکی پرداخت کنید</div>
                              </div>
                            </div>
                            <div className="delivery-step">
                              <div className="step-number">۳</div>
                              <div className="step-content-card">
                                <div className="step-title">فعال‌سازی قانونی</div>
                                <div className="step-desc">با کارت‌های فروشگاه خرید انجام و نتیجه به شما اعلام می‌شود</div>
                              </div>
                            </div>
                            <div className="delivery-step">
                              <div className="step-number">۴</div>
                              <div className="step-content-card">
                                <div className="step-title">تحویل و پشتیبانی</div>
                                <div className="step-desc">در صورت نیاز، تا تکمیل سفارش همراهتان هستیم</div>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Guides and Tutorials Card (Desktop - RIGHT col) - shown at >1280px when left col has more space */}
                {productCategory === 'fortnite' && (
                  <div className="guides-card guides-card-right hide-mobile" style={{ marginTop: 16 }}>
                    <div className="guides-title">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                      </svg>
                      صفحات مرتبط
                    </div>
                    <div style={{ display: "grid", gap: 10 }}>
                      <a
                        href="/guides/disable-2fa"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="guide-link-item"
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 14 }}>🛡️</span>
                          آموزش خاموش کردن تایید دو مرحله‌ای (2FA)
                        </span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                      </a>

                      <a
                        href="/guides/link-unlink"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="guide-link-item"
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 14 }}>🔗</span>
                          آموزش اتصال و لینک کردن اکانت
                        </span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                      </a>

                      <a
                        href="/guides/remove-restriction"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="guide-link-item"
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 14 }}>⚠️</span>
                          آموزش رفع محدودیت و ریستریکت اکانت
                        </span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                      </a>
                    </div>
                  </div>
                )}

              </div>
            </section>

            {/* FAQ Section */}
            {faqItems.length > 0 && (
              <section className="card section faq-section" style={{ marginTop: 16 }}>
                <h3 style={{ margin: 0, marginBottom: 16, fontSize: 18, fontWeight: 900 }}>سوالات متداول</h3>
                <div className="faq-list">
                  {faqItems.map((item, i) => (
                    <details key={i} className="faq-item">
                      <summary className="faq-question">{item.q}</summary>
                      <div className="faq-answer">{item.a}</div>
                    </details>
                  ))}
                </div>
              </section>
            )}

            <RelatedProducts currentProduct={product} products={products} />
            <TelegramContact />
            <ReviewSection
              slug={slug}
              initialStats={initialStats}
              productTitle={product?.name_fa}
            />
            <style jsx>{`
              .nubix-fomo-badge {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                background: linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(245, 158, 11, 0.08));
                border: 1px solid rgba(239, 68, 68, 0.2);
                color: #ef4444;
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 13px;
                font-weight: 800;
                margin-top: 4px;
                margin-bottom: 8px;
                align-self: flex-start;
                box-shadow: 0 0 10px rgba(239, 68, 68, 0.05);
              }
              :root[data-theme="dark"] .nubix-fomo-badge {
                color: #f87171;
                border-color: rgba(248, 113, 113, 0.3);
                background: linear-gradient(135deg, rgba(248, 113, 113, 0.12), rgba(245, 158, 11, 0.08));
              }
              .pulse-dot {
                width: 8px;
                height: 8px;
                background-color: #ef4444;
                border-radius: 50%;
                display: inline-block;
                position: relative;
              }
              :root[data-theme="dark"] .pulse-dot {
                background-color: #f87171;
              }
              .pulse-dot::after {
                content: '';
                position: absolute;
                width: 100%;
                height: 100%;
                background-color: inherit;
                border-radius: inherit;
                animation: dotPulse 1.5s infinite ease-in-out;
                top: 0;
                left: 0;
              }
              .price-discount-percent {
                background: linear-gradient(135deg, #ef4444, #dc2626);
                color: #ffffff;
                font-size: 12px;
                font-weight: 800;
                padding: 4px 10px;
                border-radius: 8px;
                box-shadow: 0 4px 10px rgba(239, 68, 68, 0.2);
                animation: floatAnimation 3s ease-in-out infinite;
                display: inline-flex;
                align-items: center;
              }
              @keyframes dotPulse {
                0% { transform: scale(1); opacity: 1; }
                100% { transform: scale(3); opacity: 0; }
              }
              @keyframes floatAnimation {
                0% { transform: translateY(0); }
                50% { transform: translateY(-3px); }
                100% { transform: translateY(0); }
              }
              .product-hero {
                display: grid;
                grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr);
                gap: 24px;
                align-items: flex-start;
              }
              .admin-fab {
                position: fixed;
                bottom: 24px;
                left: 24px;
                z-index: 1100;
              }
              .admin-fab button {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 12px 16px;
                border-radius: 14px;
                border: none;
                background: linear-gradient(135deg, #fbbf24, #f59e0b);
                color: #1d1a3f;
                font-weight: 900;
                box-shadow: 0 14px 30px rgba(0,0,0,0.18);
                cursor: pointer;
              }
              .image-stack {
                display: grid;
                gap: 16px;
              }
              .guides-card {
                border: 2px solid var(--line);
                background: var(--card);
                border-radius: 14px;
                padding: 16px;
                display: grid;
                gap: 12px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.04);
              }
              .guides-title {
                color: var(--text);
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 15px;
                font-weight: 900;
              }
              .guide-link-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 10px 14px;
                background: var(--bg);
                border: 2px solid var(--line);
                border-radius: 10px;
                color: var(--text);
                font-size: 13px;
                font-weight: 700;
                text-decoration: none;
                transition: all 0.2s ease;
              }
              .guide-link-item:hover {
                border-color: var(--primary);
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(44,75,255,0.08);
                background: var(--card);
              }
              .guide-link-item svg {
                color: var(--muted);
                transition: transform 0.2s ease, color 0.2s ease;
              }
              .guide-link-item:hover svg {
                color: var(--primary);
                transform: translateX(-4px);
              }
              /* Mobile Utilities */
              .hide-mobile {
                display: block;
              }
              .show-mobile {
                display: none;
              }
              .mobile-description {
                padding: 14px;
                background: linear-gradient(135deg, rgba(0,213,255,0.06), rgba(108,92,231,0.04));
                border: 1px solid rgba(255,255,255,0.12);
                border-radius: 12px;
              }
              :root[data-theme="dark"] .mobile-description {
                background: linear-gradient(135deg, rgba(0,213,255,0.12), rgba(108,92,231,0.12));
                border-color: rgba(255,255,255,0.08);
              }

              /* Plan / variant picker */
              .plan-picker {
                display: grid;
                gap: 14px;
                padding: 16px;
                border: 1px solid var(--line);
                border-radius: 14px;
                background: var(--card);
              }
              .plan-picker-title {
                display: flex;
                align-items: center;
                gap: 8px;
                font-weight: 900;
                font-size: 14px;
                color: var(--text);
              }
              .plan-picker-title svg {
                color: #22c55e;
                flex-shrink: 0;
              }
              .plan-group {
                display: grid;
                gap: 10px;
              }
              .plan-group-header {
                display: flex;
                align-items: center;
                gap: 10px;
              }
              .plan-group-chip {
                padding: 4px 12px;
                border-radius: 999px;
                font-size: 12px;
                font-weight: 800;
                color: #16a34a;
                background: rgba(34, 197, 94, 0.12);
                border: 1px solid rgba(34, 197, 94, 0.35);
                white-space: nowrap;
              }
              :root[data-theme="dark"] .plan-group-chip {
                color: #4ade80;
              }
              .plan-group-line {
                flex: 1;
                height: 1px;
                background: var(--line);
              }
              .plan-options {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(165px, 1fr));
                gap: 10px;
              }
              .plan-option {
                position: relative;
                display: grid;
                gap: 6px;
                justify-items: start;
                text-align: right;
                padding: 12px 14px;
                border: 2px solid var(--line);
                border-radius: 12px;
                background: var(--bg);
                cursor: pointer;
                font-family: inherit;
                color: var(--text);
                transition: all 0.2s ease;
              }
              .plan-option:hover {
                border-color: rgba(34, 197, 94, 0.5);
                transform: translateY(-1px);
              }
              .plan-option.active {
                border-color: #22c55e;
                background: linear-gradient(135deg, rgba(34, 197, 94, 0.14), rgba(16, 185, 129, 0.05));
                box-shadow: 0 6px 18px rgba(34, 197, 94, 0.18);
              }
              .plan-radio {
                position: absolute;
                top: 12px;
                left: 12px;
                width: 18px;
                height: 18px;
                border-radius: 50%;
                border: 2px solid var(--line);
                transition: all 0.2s ease;
              }
              .plan-option.active .plan-radio {
                border-color: #22c55e;
                background: radial-gradient(circle, #22c55e 45%, transparent 52%);
              }
              .plan-option-title {
                font-weight: 800;
                font-size: 14px;
                padding-left: 22px;
              }
              .plan-option-price {
                display: flex;
                align-items: baseline;
                gap: 6px;
                font-size: 13px;
              }
              .plan-option-price b {
                font-size: 15px;
                font-weight: 900;
                color: var(--primary);
              }
              .plan-option.active .plan-option-price b {
                color: #16a34a;
              }
              :root[data-theme="dark"] .plan-option.active .plan-option-price b {
                color: #4ade80;
              }
              .plan-old-price {
                color: var(--muted);
                font-size: 12px;
              }
              .plan-option-price small {
                color: var(--muted);
                font-size: 11px;
                font-weight: 700;
              }

              /* Product Highlights */
              .product-highlights {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 12px;
                padding: 16px;
                background: linear-gradient(135deg, rgba(0,213,255,0.08), rgba(108,92,231,0.05));
                border: 1px solid rgba(255,255,255,0.15);
                border-radius: 14px;
              }
              :root[data-theme="dark"] .product-highlights {
                background: linear-gradient(135deg, rgba(0,213,255,0.12), rgba(108,92,231,0.1));
                border-color: rgba(255,255,255,0.06);
              }
              .highlight-item {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 8px;
              }
              .highlight-icon {
                width: 36px;
                height: 36px;
                padding: 7px;
                background: linear-gradient(135deg, #0f2250, #1e3a8a);
                border-radius: 10px;
                color: #60a5fa;
                flex-shrink: 0;
              }
              .highlight-text {
                flex: 1;
                min-width: 0;
              }
              .highlight-title {
                font-weight: 800;
                font-size: 13px;
                color: var(--text);
                white-space: nowrap;
              }
              .highlight-desc {
                font-size: 11px;
                color: var(--muted);
                margin-top: 2px;
                line-height: 1.3;
              }

              /* Tabs */
              .product-tabs {
                display: grid;
                gap: 0;
                border: 1px solid var(--line);
                border-radius: 14px;
                overflow: hidden;
              }
              :root[data-theme="dark"] .product-tabs {
                border-color: #373169;
              }
              .tab-buttons {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                background: #f8f9fd;
                border-bottom: 1px solid var(--line);
              }
              :root[data-theme="dark"] .tab-buttons {
                background: #1d1a3f;
              }
              .tab-btn {
                padding: 14px 16px;
                border: none;
                background: transparent;
                font-family: inherit;
                font-weight: 700;
                font-size: 14px;
                color: var(--muted);
                cursor: pointer;
                transition: all 0.2s ease;
                border-left: 1px solid var(--line);
              }
              .tab-btn:first-child {
                border-right: none;
              }
              .tab-btn:last-child {
                border-left: none;
              }
              .tab-btn.active {
                background: var(--card);
                color: var(--primary);
                font-weight: 900;
              }
              .tab-btn:hover:not(.active) {
                background: rgba(255,255,255,0.05);
              }
              :root[data-theme="dark"] .tab-btn:hover:not(.active) {
                background: rgba(255,255,255,0.06);
              }
              .tab-content {
                padding: 20px;
                background: var(--card);
                min-height: 200px;
                display: grid;
                gap: 12px;
              }

              /* Description Box */
              .description-box {
                font-size: 14px;
                line-height: 1.9;
              }

              /* Expandable description accordion */
              .desc-accordion {
                border: 1px solid var(--line);
                border-radius: 16px;
                overflow: hidden;
                background: var(--card);
                box-shadow: 0 6px 20px rgba(0,0,0,0.05);
              }
              :root[data-theme="dark"] .desc-accordion {
                border-color: #373169;
                box-shadow: 0 8px 26px rgba(0,0,0,0.35);
              }
              .desc-accordion-head {
                width: 100%;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                padding: 16px 18px;
                border: none;
                background: linear-gradient(135deg, rgba(0,213,255,0.08), rgba(108,92,231,0.08));
                font-family: inherit;
                cursor: pointer;
                color: var(--text);
              }
              :root[data-theme="dark"] .desc-accordion-head {
                background: linear-gradient(135deg, rgba(0,213,255,0.12), rgba(108,92,231,0.14));
              }
              .desc-accordion-title {
                display: inline-flex;
                align-items: center;
                gap: 10px;
                font-weight: 900;
                font-size: 15px;
                color: var(--primary);
              }
              .desc-accordion-chevron {
                color: var(--muted);
                transition: transform 0.3s ease;
                flex-shrink: 0;
              }
              .desc-accordion.open .desc-accordion-chevron {
                transform: rotate(180deg);
              }
              .desc-accordion-body {
                position: relative;
                max-height: 116px;
                overflow: hidden;
                padding: 0 18px;
                transition: max-height 0.4s ease;
              }
              .desc-accordion.open .desc-accordion-body {
                max-height: 4000px;
                padding-bottom: 18px;
              }
              .desc-accordion-body .description-box {
                padding-top: 14px;
              }
              /* Fade hint over the clamped preview, hidden once expanded */
              .desc-accordion-fade {
                position: absolute;
                left: 0;
                right: 0;
                bottom: 0;
                height: 56px;
                pointer-events: none;
                background: linear-gradient(to bottom, rgba(255,255,255,0), var(--card));
                transition: opacity 0.3s ease;
              }
              .desc-accordion.open .desc-accordion-fade {
                opacity: 0;
              }

              /* Delivery section header (replaces old tab buttons) */
              .delivery-header {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 14px 18px;
                font-weight: 900;
                font-size: 15px;
                color: var(--primary);
                background: #f8f9fd;
                border-bottom: 1px solid var(--line);
              }
              :root[data-theme="dark"] .delivery-header {
                background: #1d1a3f;
                border-color: #373169;
              }

              /* Delivery Info */
              .delivery-info {
                display: grid;
                gap: 16px;
              }
              .conversion-box {
                border: 1px solid var(--line);
                background: var(--bg);
                border-radius: 12px;
                padding: 12px 14px;
                color: var(--text);
                font-size: 13px;
                line-height: 1.8;
                display: grid;
                gap: 6px;
              }
              :root[data-theme="dark"] .conversion-box {
                background: #13112c;
                border-color: #373169;
              }
              .delivery-info {
                display: grid;
                gap: 24px;
                position: relative;
                padding-right: 20px;
              }
              .delivery-info::before {
                content: '';
                position: absolute;
                right: 39px;
                top: 20px;
                bottom: 20px;
                width: 2px;
                background: linear-gradient(180deg, var(--primary) 0%, rgba(99,102,241,0.1) 100%);
                z-index: 1;
              }
              .delivery-step {
                display: flex;
                gap: 16px;
                align-items: flex-start;
                position: relative;
                z-index: 2;
              }
              .step-number {
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: linear-gradient(135deg, var(--primary), #4f46e5);
                color: white;
                border-radius: 50%;
                font-weight: 900;
                font-size: 18px;
                flex-shrink: 0;
                box-shadow: 0 4px 10px rgba(79, 70, 229, 0.2);
                border: 4px solid var(--card);
                transition: transform 0.2s ease, box-shadow 0.2s ease;
              }
              .delivery-step:hover .step-number {
                transform: scale(1.1);
                box-shadow: 0 6px 15px rgba(79, 70, 229, 0.4);
              }
              .step-content-card {
                background: var(--bg);
                padding: 14px 18px;
                border-radius: 14px;
                border: 1px solid var(--line);
                box-shadow: 0 2px 8px rgba(0,0,0,0.02);
                transition: all 0.2s ease;
                display: flex;
                flex-direction: column;
                flex: 1;
              }
              .delivery-step:hover .step-content-card {
                border-color: var(--primary);
                background: var(--card);
                transform: translateX(-4px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.05);
              }
              .step-title {
                font-weight: 800;
                font-size: 15px;
                margin-bottom: 4px;
                color: var(--text);
              }
              .step-desc {
                font-size: 13.5px;
                color: var(--muted);
                line-height: 1.6;
              }

              /* FAQ Section */
              .faq-list {
                display: grid;
                gap: 10px;
              }
              .faq-item {
                border: 1px solid var(--line);
                border-radius: 12px;
                overflow: hidden;
                background: var(--card);
              }
              .faq-question {
                padding: 16px 18px;
                font-weight: 800;
                font-size: 14px;
                cursor: pointer;
                list-style: none;
                user-select: none;
                display: flex;
                align-items: center;
                justify-content: space-between;
                transition: all 0.2s ease;
              }
              .faq-question::-webkit-details-marker {
                display: none;
              }
              .faq-question::after {
                content: '+';
                font-size: 24px;
                font-weight: 300;
                color: var(--primary);
                transition: transform 0.3s ease;
              }
              .faq-item[open] .faq-question::after {
                transform: rotate(45deg);
              }
              .faq-question:hover {
                background: var(--hover);
              }
              .faq-answer {
                padding: 0 18px 16px 18px;
                font-size: 13px;
                line-height: 1.8;
                color: var(--text);
                animation: fadeIn 0.3s ease;
              }
              @keyframes fadeIn {
                from {
                  opacity: 0;
                  transform: translateY(-10px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
              @keyframes pulse-glow {
                0%, 100% {
                  opacity: 1;
                  transform: scale(1);
                  box-shadow: 0 0 0 0 rgba(16, 124, 16, 0.4);
                }
                50% {
                  opacity: 0.85;
                  transform: scale(1.05);
                  box-shadow: 0 0 12px 4px rgba(16, 124, 16, 0.3);
                }
              }
              .platform-grid {
                grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
              }
              .actions-row {
                display: flex;
                gap: 10px;
                align-items: stretch;
                width: 100%;
                flex-wrap: wrap;
              }
              .action-btn {
                width: 100%;
                max-width: 420px;
                flex: 1 1 200px;
              }
              @media (max-width: 960px) {
                .product-hero {
                  grid-template-columns: 1fr;
                  gap: 16px;
                }
                .image-stack,
                .details-stack {
                  display: contents !important;
                }
                .hero-image { order: 0; }
                .title-block { order: 1; }
                .crew-notice { order: 2; }
                .plan-picker { order: 3; }
                .price-row { order: 4; }
                .details-buy-btn { order: 5; margin-top: 0 !important; }
                .info-card { order: 6; }
                .product-highlights { order: 7; }
                .desc-accordion { order: 8; }
                .product-tabs { order: 9; }
                .guides-card { order: 10; }
                .details-stack h1 {
                  font-size: 20px;
                }
                .platform-grid {
                  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
                }
                .features-grid {
                  grid-template-columns: 1fr;
                }
                .tab-buttons {
                  grid-template-columns: 1fr;
                }
                .tab-btn {
                  border-left: none;
                  border-bottom: 1px solid var(--line);
                }
                .tab-btn:last-child {
                  border-bottom: none;
                }
                .product-highlights {
                  grid-template-columns: repeat(3, 1fr);
                  gap: 6px;
                  padding: 10px 8px;
                }
                .highlight-item {
                  flex-direction: column;
                  text-align: center;
                  gap: 6px;
                  padding: 4px;
                }
                .highlight-icon {
                  width: 28px;
                  height: 28px;
                  padding: 5px;
                }
                .highlight-title {
                  font-size: 11px;
                  white-space: normal;
                }
                .highlight-desc {
                  font-size: 10px;
                }
              }
              /* ── Responsive guides-card placement ──────────────────────────
                 >1280px  : left col is spacious   → show in RIGHT col (under product-tabs)
                 960-1280px: right col has more space → show in LEFT col (under info-card)
              ──────────────────────────────────────────────────────────────── */
              @media (min-width: 961px) {
                /* Default (wide): left col spacious — show right, hide left */
                .guides-card-left  { display: none !important; }
                .guides-card-right { display: grid; }
              }
              @media (min-width: 961px) and (max-width: 1280px) {
                /* Medium-wide: right col has more space — show left, hide right */
                .guides-card-left  { display: grid !important; }
                .guides-card-right { display: none !important; }
              }
              @media (max-width: 640px) {
                .hide-mobile {
                  display: none !important;
                }
                .show-mobile {
                  display: block !important;
                }
                .product-hero {
                  padding: 12px;
                  gap: 12px;
                }
                .image-stack {
                  gap: 10px;
                }
                .details-stack {
                  gap: 12px !important;
                }
                .action-btn {
                  max-width: 100%;
                }
                .title-row {
                  font-size: 18px !important;
                  margin-bottom: 4px !important;
                }
                .subtitle-row {
                  font-size: 12px !important;
                }
                .price-row {
                  margin-top: 0 !important;
                }
                .viewers-row {
                  font-size: 12px !important;
                }
                .product-highlights {
                  grid-template-columns: 1fr;
                  padding: 10px;
                  gap: 6px;
                }
                .highlight-item {
                  padding: 6px;
                  gap: 8px;
                }
                .highlight-icon {
                  width: 32px;
                  height: 32px;
                  padding: 6px;
                }
                .highlight-title {
                  font-size: 12px;
                }
                .highlight-desc {
                  font-size: 10px;
                }
                .tab-content {
                  padding: 14px;
                }
                .tab-btn {
                  padding: 12px;
                  font-size: 13px;
                }
                .delivery-info {
                  padding-right: 15px;
                }
                .delivery-info::before {
                  right: 31px;
                  top: 16px;
                  bottom: 16px;
                }
                .delivery-step {
                  gap: 10px;
                }
                .step-number {
                  width: 32px;
                  height: 32px;
                  font-size: 15px;
                  border-width: 3px;
                }
                .step-content-card {
                  padding: 10px 14px;
                  border-radius: 10px;
                }
                .step-title {
                  font-size: 14px;
                }
                .step-desc {
                  font-size: 12.5px;
                }
                .feature-card {
                  padding: 14px;
                }
                .feature-icon {
                  font-size: 28px;
                }
                .feature-title {
                  font-size: 13px;
                }
                .faq-question {
                  padding: 12px 14px;
                  font-size: 13px;
                }
                .faq-answer {
                  padding: 0 14px 12px 14px;
                  font-size: 12px;
                }
                .price {
                  font-size: 20px !important;
                }
                .price-old {
                  font-size: 14px !important;
                }
                .plan-picker {
                  padding: 12px;
                  gap: 12px;
                }
                .plan-options {
                  grid-template-columns: repeat(2, minmax(0, 1fr));
                }
                .plan-option {
                  padding: 10px 12px;
                }
                .plan-option-title {
                  font-size: 13px;
                }
              }
              }
            `}</style>
          </>
        )}
      </main>
    </div>
  );
}
