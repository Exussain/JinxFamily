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

function normalizePhoneMask(mask) {
  if (!mask) return "";
  // keep only ASCII characters (English digits, *, +, spaces, etc.)
  return mask.replace(/[^\x00-\x7F]/g, "");
}

export default function ProductPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  // Redirect crewpack to dedicated page
  useEffect(() => {
    if (slug === 'fortnite-crew-pack') {
      router.replace('/crewpack');
    } else if (slug === 'gta6') {
      router.replace('/gta6');
    }
  }, [slug, router]);
  const [error, setError] = useState("");
  const [customFieldValues, setCustomFieldValues] = useState({});
  const [formError, setFormError] = useState("");
  const [showValidation, setShowValidation] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({ total: 0, rating: 0 });
  const [activeTab, setActiveTab] = useState("description");
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState(null);

  const [reviewName, setReviewName] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const reviewsSectionRef = useRef(null);
  const reviewTextareaRef = useRef(null);
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
    const loadReviews = async () => {
      setReviewsLoading(true);
      try {
        const res = await fetch(`${apiBase}/api/products/${slug}/comments`, {
          cache: "no-store",
        });
        if (!res.ok) {
          setReviews([]);
          setReviewStats({ total: 0, rating: 0, breakdown: {} });
          return;
        }
        const data = await res.json();
        if (data.success) {
          const formattedReviews = data.comments.map(comment => ({
            id: comment.id,
            user: comment.author_name,
            authorRole: comment.author_role || "user",
            date: new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              timeZone: "Asia/Tehran",
            }).format(new Date(comment.created_at)),
            rating: comment.rating,
            text: comment.text,
            isVerified: comment.is_verified_purchase,
            userId: comment.user_id,
            phone: normalizePhoneMask(comment.phone_mask || ""),
            avatarUrl: comment.avatar_url || "",
            reply: comment.reply
              ? {
                  ...comment.reply,
                  author: comment.reply.author,
                  role: comment.reply.role || "user",
                }
              : null,
          }));
          setReviews(formattedReviews);
          setReviewStats({
            total: data.stats.total,
            rating: data.stats.average_rating,
            breakdown: data.stats.rating_counts,
          });
        }
      } catch (error) {
        setReviews([]);
        setReviewStats({ total: 0, rating: 0, breakdown: {} });
      } finally {
        setReviewsLoading(false);
      }
    };
    loadReviews();
  }, [slug, apiBase]);

  useEffect(() => {
    if (!slug) return;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${apiBase}/api/products/${slug}`, {
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
  }, [slug, apiBase]);

  useEffect(() => {
    const loadMe = async () => {
      try {
        const res = await fetch(`${apiBase}/api/auth/me`, { cache: "no-store", credentials: "include" });
        if (!res.ok) return;
        const data = await res.json();
        setCurrentUser(data.user || data);
        if (!reviewName) {
          const preset = data.display_name || data.name || "";
          if (preset) setReviewName(preset);
        }
      } catch {
        // ignore
      }
    };
    loadMe();
  }, [apiBase, reviewName]);


  const handleSubmitReview = async (e) => {
    e.preventDefault();
    const name = reviewName.trim();
    const text = reviewText.trim();

    if (!name) {
      alert("لطفاً نام خود را وارد کنید");
      return;
    }

    if (!text || text.length < 10) {
      alert("لطفاً نظر خود را با حداقل ۱۰ کاراکتر وارد کنید");
      return;
    }

    const normalizedRating = Math.min(5, Math.max(1, Number(reviewRating) || 5));

    setReviewSubmitting(true);

    try {
      const res = await fetch(`${apiBase}/api/products/${slug}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          author_name: name,
          rating: normalizedRating,
          text: text,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.message || "خطا در ثبت نظر. لطفاً دوباره تلاش کنید.");
        return;
      }

      const newReview = {
        id: data.comment.id,
        user: data.comment.author_name,
        date: new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
          day: "numeric",
          month: "long",
          year: "numeric"
        }).format(new Date(data.comment.created_at)),
        rating: data.comment.rating,
        text: data.comment.text,
        isVerified: data.comment.is_verified_purchase,
      };

      setReviews((prev) => [newReview, ...prev]);
      setReviewStats((prev) => {
        const total = prev.total + 1;
        const rating = ((prev.rating * prev.total) + normalizedRating) / total;
        const newBreakdown = { ...(prev.breakdown || {}) };
        newBreakdown[normalizedRating] = (newBreakdown[normalizedRating] || 0) + 1;
        return { total, rating, breakdown: newBreakdown };
      });

      setReviewName("");
      setReviewText("");
      setReviewRating(5);

      alert("نظر شما با موفقیت ثبت شد!");

    } catch (error) {
      alert("خطا در ارتباط با سرور. لطفاً دوباره تلاش کنید.");
    } finally {
      setReviewSubmitting(false);
    }
  };

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
  const totalReviews = reviewStats.total;
  const adminPhones = ["09339732325", "09123101634"];
  const isAdminUser =
    currentUser?.is_admin || adminPhones.includes(currentUser?.phone_number);
  const canReplyToComments = !!currentUser;

  const isFieldRequired = (field) => field.required === true;

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
      reviewsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      reviewTextareaRef.current?.focus({ preventScroll: true });
    }, 400);
    return () => clearTimeout(timer);
  }, [loading, product]);

  useEffect(() => {
    if (reviewsLoading || typeof window === "undefined") return;
    const hash = window.location.hash;
    if (hash && hash.startsWith("#comment-")) {
      const id = hash.replace("#comment-", "");
      const element = document.getElementById(`comment-${id}`);
      if (element) {
        const timer = setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          element.style.transition = "all 0.5s ease";
          element.style.boxShadow = "0 0 25px rgba(139, 92, 246, 0.45)";
          element.style.borderColor = "var(--primary)";
          setTimeout(() => {
            element.style.boxShadow = "";
            element.style.borderColor = "";
          }, 3500);
        }, 400);
        return () => clearTimeout(timer);
      }
    }
  }, [reviewsLoading]);

  const scrollToReviews = useCallback(() => {
    reviewsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <div>
      <Navbar />
      <main className="container" style={{ padding: "24px 0 40px" }}>
        {loading && <div className="muted">در حال بارگذاری محصول…</div>}
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
                    style={{ width: "100%", height: "auto", display: "block" }}
                    draggable="false"
                  />
                </div>

                {(hasCustomFields || needs2FA) && (
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
                {/* Guides and Tutorials Card */}
                <div className="guides-card">
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
              </div>
              <div className="details-stack" style={{ display: "grid", gap: 16 }}>
                <div className="title-block">
                  <h1 className="title-row" style={{ margin: 0, fontSize: 24, fontWeight: 900, marginBottom: 8 }}>
                    {product.name_fa}
                  </h1>
                  {product.subtitle && (
                    <div className="muted subtitle-row" style={{ fontSize: 14 }}>{product.subtitle}</div>
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
                <div className="price-row" style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
                  {originalPrice && hasPrice ? (
                    <div className="price-old" style={{ fontSize: 16, lineHeight: 1.2 }}>
                      {originalPrice.toLocaleString("fa-IR")} تومان
                    </div>
                  ) : null}
                  {hasPrice ? (
                    <div className="price" style={{ fontSize: 24, lineHeight: 1.2, fontWeight: 900 }}>
                      {displayPrice.toLocaleString("fa-IR")} تومان
                    </div>
                  ) : (
                    <div className="muted" style={{ fontSize: 16, fontWeight: 800 }}>
                      این محصول در حال حاضر در دسترس نیست
                    </div>
                  )}
                </div>

                {/* Buy Button for Products Without Account Form */}
                {!hasCustomFields && hasPrice && (
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

                {/* Simple Description for Mobile */}
                {descriptionLines.length > 0 && (
                  <div className="mobile-description show-mobile">
                    <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 8 }}>درباره محصول</div>
                    <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text)' }}>
                      {showFullDescription
                        ? descriptionLines.map((line, i) => {
                            if (line.trim().startsWith('•')) {
                              return <div key={i} style={{ marginBottom: '6px' }}>{renderTextWithBold(line, `m-bullet-${i}`)}</div>;
                            }
                            return <div key={i} style={{ marginBottom: '4px' }}>{renderTextWithBold(line, `m-line-${i}`)}</div>;
                          })
                        : descriptionLines.slice(0, 2).join(' ').substring(0, 140) + '...'
                      }
                    </div>
                    <button
                      onClick={() => setShowFullDescription(!showFullDescription)}
                      style={{
                        marginTop: 10,
                        padding: '8px 14px',
                        background: 'transparent',
                        border: '1px solid var(--primary)',
                        borderRadius: 8,
                        color: 'var(--primary)',
                        fontWeight: 700,
                        fontSize: 12,
                        cursor: 'pointer',
                        width: '100%'
                      }}
                    >
                      {showFullDescription ? 'بستن' : 'مشاهده توضیحات کامل'}
                    </button>
                  </div>
                )}

                {/* Tabs for Description and Delivery */}
                <div className="product-tabs hide-mobile">
                  <div className="tab-buttons">
                    {descriptionLines.length > 0 && (
                      <button
                        className={`tab-btn ${effectiveTab === 'description' ? 'active' : ''}`}
                        onClick={() => setActiveTab('description')}
                      >
                        توضیحات
                      </button>
                    )}
                    <button
                      className={`tab-btn ${effectiveTab === 'delivery' ? 'active' : ''}`}
                      onClick={() => setActiveTab('delivery')}
                    >
                      نحوه تحویل
                    </button>
                  </div>

                  <div className="tab-content">
                    {effectiveTab === 'description' && descriptionLines.length > 0 && (
                      <div className="description-box">
                        {descriptionLines.map((line, i) => {
                          if (line.trim().startsWith('•')) {
                            return <div key={i} style={{ marginBottom: '8px' }}>{renderTextWithBold(line, `d-bullet-${i}`)}</div>;
                          }
                          return <div key={i} style={{ marginBottom: '6px' }}>{renderTextWithBold(line, `d-line-${i}`)}</div>;
                        })}
                      </div>
                    )}

                    {effectiveTab === 'delivery' && (
                      <div className="delivery-info">
                        {deliveryLines.length > 0 ? (
                          deliveryLines.map((line, i) => (
                            <div key={i} className="delivery-step">
                              <div className="step-number">{i + 1}</div>
                              <div>
                                <div className="step-desc">{line}</div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <>
                            <div className="delivery-step">
                              <div className="step-number">۱</div>
                              <div>
                                <div className="step-title">ثبت سفارش</div>
                                <div className="step-desc">سفارش خود را ثبت کرده و اطلاعات حساب را وارد کنید</div>
                              </div>
                            </div>
                            <div className="delivery-step">
                              <div className="step-number">۲</div>
                              <div>
                                <div className="step-title">پرداخت امن</div>
                                <div className="step-desc">از طریق درگاه امن بانکی پرداخت کنید</div>
                              </div>
                            </div>
                            <div className="delivery-step">
                              <div className="step-number">۳</div>
                              <div>
                                <div className="step-title">فعال‌سازی</div>
                                <div className="step-desc">تیم ما طی ۱۵ دقیقه تا ۸ ساعت کاری اشتراک را فعال می‌کند</div>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </section>

            {/* FAQ Section - Desktop Only */}
            {faqItems.length > 0 && (
              <section className="card section faq-section hide-mobile" style={{ marginTop: 16 }}>
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

            <TelegramContact />
      <section id="reviews" ref={reviewsSectionRef} className="reviews-section card section" style={{ marginTop: 16 }}>
              <div className="reviews-header">
                <div className="reviews-title-row">
                  <h3 className="reviews-title">
                    <svg className="reviews-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                    </svg>
                    نظرات کاربران
                  </h3>
                  {totalReviews > 0 && (
                    <div className="reviews-summary">
                      <div className="rating-display">
                        <span className="rating-number">{reviewStats.rating?.toFixed(1)}</span>
                        <div className="rating-stars-large">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg key={star} className={`star-svg ${star <= Math.round(reviewStats.rating) ? 'filled' : ''}`} viewBox="0 0 24 24">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                          ))}
                        </div>
                      </div>
                      <span className="review-count-badge">{totalReviews.toLocaleString("fa-IR")} نظر</span>
                    </div>
                  )}
                </div>
              </div>

              {reviewStats.breakdown && totalReviews > 0 && (
                <div className="rating-breakdown-modern">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = reviewStats.breakdown[star] || 0;
                    const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                    return (
                      <div key={star} className="rating-row-modern">
                        <div className="rating-row-stars">
                          {[...Array(star)].map((_, i) => (
                            <svg key={i} className="star-mini filled" viewBox="0 0 24 24">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                          ))}
                        </div>
                        <div className="rating-bar-track">
                          <div className="rating-bar-progress" style={{ width: `${percentage}%` }} />
                        </div>
                        <span className="rating-row-count">{count.toLocaleString("fa-IR")}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="review-list">
                {reviewsLoading ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#95a5a6' }}>
                    در حال بارگذاری نظرات...
                  </div>
                ) : reviews.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#95a5a6' }}>
                    هنوز نظری ثبت نشده است. اولین نفر باشید!
                  </div>
                ) : (
                  reviews.map((rev) => (
                    <article
                      id={`comment-${rev.id}`}
                      key={rev.id || `${rev.user}-${rev.date}-${(rev.text || "").slice(0, 10)}`}
                      className={`review-card ${rev.isReply ? "reply" : ""}`}
                    >
                      <div className="review-top">
                        <div className="review-avatar">
                          {rev.avatarUrl ? (
                            <img src={rev.avatarUrl} alt={rev.user} />
                          ) : (
                            <div className="avatar-fallback">
                              {(rev.user || "?").trim().charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="review-header">
                          <div className="review-header-main">
                            <div className="review-user">
                              <span className="review-name">{rev.user}</span>
                              {rev.isVerified && (
                                <span
                                  className="review-badge"
                                  title="خریدار واقعی"
                                >
                                  ✓ خریدار
                                </span>
                              )}
                              {rev.authorRole === "admin" && (
                                <span className="review-badge admin" title="ادمین">
                                  ادمین
                                </span>
                              )}
                              {rev.authorRole === "moderator" && (
                                <span className="review-badge moderator" title="مدیر">
                                  مدیر
                                </span>
                              )}
                            </div>
                            {rev.rating ? (
                              <div className="review-stars" aria-label={`${rev.rating} از 5`}>
                                {"★".repeat(Math.min(rev.rating, 5))}
                              </div>
                            ) : null}
                          </div>
                          {rev.phone ? (
                            <div className="review-phone">
                              <span>{rev.phone}</span>
                            </div>
                          ) : null}
                          <div className="review-date">
                            {rev.date}
                          </div>
                        </div>
                      </div>
                      <p className="review-text">{rev.text}</p>
                      {(() => {
                        const canDelete = isAdminUser || (currentUser && rev.userId === currentUser.id);
                        if (!canReplyToComments && !canDelete) return null;
                        return (
                          <div className="review-actions">
                            {canReplyToComments && (
                              <button
                                type="button"
                                className="review-action-btn"
                                onClick={() => {
                                  setReplyingToId(rev.id);
                                  setReplyText(rev.reply?.text || "");
                                  if (reviewTextareaRef.current) {
                                    reviewTextareaRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
                                  }
                                }}
                              >
                                {rev.reply?.text ? "ویرایش پاسخ" : "پاسخ"}
                              </button>
                            )}
                            {canDelete && (
                              <button
                                type="button"
                                className="review-action-btn danger"
                                disabled={deletingCommentId === rev.id}
                                onClick={async () => {
                                  if (!rev.id || !confirm("حذف این دیدگاه؟")) return;
                                  try {
                                    setDeletingCommentId(rev.id);
                                    const res = await fetch(`${apiBase}/api/comments/${rev.id}`, {
                                      method: "DELETE",
                                      credentials: "include",
                                    });
                                    if (!res.ok) {
                                      const data = await res.json().catch(() => ({}));
                                      alert(data.message || "خطا در حذف دیدگاه");
                                      return;
                                    }
                                    setReviews((prev) => prev.filter((c) => c.id !== rev.id));
                                  } finally {
                                    setDeletingCommentId(null);
                                  }
                                }}
                              >
                                حذف
                              </button>
                            )}
                          </div>
                        );
                      })()}
                      {replyingToId === rev.id && canReplyToComments && (
                        <div className="review-reply-editor">
                          <textarea
                            rows={2}
                            placeholder="پاسخ خود را بنویسید..."
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                          />
                          <div className="reply-editor-actions">
                            <button
                              type="button"
                              className="btn primary-btn-sm"
                              disabled={replySubmitting}
                              onClick={async () => {
                                const text = replyText.trim();
                                if (!text) {
                                  alert("متن پاسخ نمی‌تواند خالی باشد");
                                  return;
                                }
                                try {
                                  setReplySubmitting(true);
                                  const res = await fetch(`${apiBase}/api/comments/${rev.id}/reply`, {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    credentials: "include",
                                    body: JSON.stringify({ reply_text: text }),
                                  });
                                  const data = await res.json().catch(() => ({}));
                                  if (!res.ok || !data.success) {
                                    alert(data.message || "خطا در ثبت پاسخ");
                                    return;
                                  }
                                  const updated = data.comment;
                                  setReviews((prev) =>
                                    prev.map((c) =>
                                      c.id === rev.id ? { ...c, reply: updated.reply } : c
                                    )
                                  );
                                  setReplyingToId(null);
                                  setReplyText("");
                                } finally {
                                  setReplySubmitting(false);
                                }
                              }}
                            >
                              {replySubmitting ? "در حال ارسال..." : "ارسال پاسخ"}
                            </button>
                            <button
                              type="button"
                              className="btn ghost-btn-sm"
                              onClick={() => {
                                setReplyingToId(null);
                                setReplyText("");
                              }}
                            >
                              انصراف
                            </button>
                          </div>
                        </div>
                      )}
                      {rev.reply?.text ? (
                        <div className="review-reply">
                          <div className="reply-meta">
                            <div className="reply-author-row">
                              <span className="reply-author">{rev.reply.author || "پاسخ ادمین"}</span>
                              {rev.reply.role === "admin" && (
                                <span className="review-badge admin">ادمین</span>
                              )}
                              {rev.reply.role === "moderator" && (
                                <span className="review-badge moderator">مدیر</span>
                              )}
                            </div>
                            {rev.reply.created_at ? (
                              <span className="reply-date">
                                {new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  timeZone: "Asia/Tehran",
                                }).format(new Date(rev.reply.created_at))}
                              </span>
                            ) : null}
                          </div>
                          <p className="reply-text">{rev.reply.text}</p>
                        </div>
                      ) : null}
                    </article>
                  ))
                )}
              </div>
              <div className="review-form-container">
                <h4 className="form-title">
                  <svg className="form-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                  نظر خود را بنویسید
                </h4>
                {!currentUser && (
                  <div className="form-login-hint">
                    برای ثبت نظر باید وارد حساب کاربری شوید.
                    <button type="button" className="btn ghost-btn-sm" onClick={() => router.push("/login?from=reviews")}>
                      ورود / ثبت‌نام
                    </button>
                  </div>
                )}
                <form className="review-form-modern" onSubmit={handleSubmitReview}>
                  <div className="form-group">
                    <label className="form-label">نام شما</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="نام و نام خانوادگی"
                      value={reviewName}
                      onChange={(e) => setReviewName(e.target.value)}
                      required
                      disabled={reviewSubmitting || !currentUser}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">امتیاز شما</label>
                    <div className="rating-selector">
                      <div className="rating-stars-input">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            type="button"
                            key={star}
                            className={`rating-star-btn ${reviewRating >= star ? "filled" : ""}`}
                            onClick={() => setReviewRating(star)}
                            aria-label={`${star} ستاره`}
                            disabled={reviewSubmitting}
                          >
                            <svg className="star-icon" viewBox="0 0 24 24">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                          </button>
                        ))}
                      </div>
                      <span className="rating-label">
                        {reviewRating.toLocaleString("fa-IR")} از ۵
                      </span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">نظر شما</label>
                    <textarea
                      ref={reviewTextareaRef}
                      className="form-textarea"
                      rows={4}
                      placeholder="تجربه خود را با ما و دیگران به اشتراک بگذارید..."
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      maxLength={2000}
                      required
                      disabled={reviewSubmitting || !currentUser}
                    />
                    <div className="char-counter">
                      <span className={reviewText.length < 10 ? 'text-danger' : reviewText.length > 1900 ? 'text-warning' : ''}>
                        {reviewText.length.toLocaleString('fa-IR')} / ۲۰۰۰
                      </span>
                      {reviewText.length < 10 && reviewText.length > 0 && (
                        <span className="text-muted"> • حداقل ۱۰ کاراکتر</span>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="submit-review-btn"
                    disabled={reviewSubmitting || !currentUser || !reviewName.trim() || reviewText.trim().length < 10}
                  >
                    {reviewSubmitting ? (
                      <>
                        <svg className="spinner" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25"/>
                          <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round"/>
                        </svg>
                        در حال ارسال...
                      </>
                    ) : (
                      <>
                        <svg className="send-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="22" y1="2" x2="11" y2="13"></line>
                          <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                        </svg>
                        ثبت نظر
                      </>
                    )}
                  </button>
                </form>
              </div>
            </section>
            <style jsx>{`
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
                color: #0f172a;
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
                border-color: #1f2937;
              }
              .tab-buttons {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                background: #f8f9fd;
                border-bottom: 1px solid var(--line);
              }
              :root[data-theme="dark"] .tab-buttons {
                background: #0f172a;
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
                background: #0b1224;
                border-color: #1f2937;
              }
              .delivery-step {
                display: flex;
                gap: 16px;
                align-items: flex-start;
              }
              .step-number {
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: linear-gradient(135deg, #0f2250, #1e3a8a);
                color: white;
                border-radius: 50%;
                font-weight: 900;
                font-size: 18px;
                flex-shrink: 0;
              }
              .step-title {
                font-weight: 800;
                font-size: 15px;
                margin-bottom: 4px;
                color: var(--text);
              }
              .step-desc {
                font-size: 13px;
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
                .mobile-description { order: 8; }
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
                .delivery-step {
                  gap: 10px;
                }
                .step-number {
                  width: 32px;
                  height: 32px;
                  font-size: 15px;
                }
                .step-title {
                  font-size: 14px;
                }
                .step-desc {
                  font-size: 12px;
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
              /* Modern Reviews Section */
              .reviews-section {
                display: grid;
                gap: 24px;
              }
              .reviews-header {
                padding-bottom: 16px;
                border-bottom: 2px solid var(--line);
              }
              .reviews-title-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 16px;
                flex-wrap: wrap;
              }
              .reviews-title {
                display: flex;
                align-items: center;
                gap: 10px;
                margin: 0;
                font-size: 20px;
                font-weight: 900;
                color: var(--text);
              }
              .reviews-icon {
                width: 24px;
                height: 24px;
                color: var(--primary);
              }
              .reviews-summary {
                display: flex;
                align-items: center;
                gap: 16px;
              }
              .rating-display {
                display: flex;
                align-items: center;
                gap: 10px;
              }
              .rating-number {
                font-size: 32px;
                font-weight: 900;
                color: var(--primary);
                line-height: 1;
              }
              .rating-stars-large {
                display: flex;
                gap: 3px;
              }
              .star-svg {
                width: 20px;
                height: 20px;
                fill: var(--line);
                transition: fill 0.2s;
              }
              .star-svg.filled {
                fill: #fbbf24;
              }
              .review-count-badge {
                padding: 6px 14px;
                background: var(--primary);
                color: white;
                border-radius: 20px;
                font-size: 13px;
                font-weight: 700;
              }
              .rating-breakdown-modern {
                display: grid;
                gap: 10px;
                padding: 20px;
                background: var(--card);
                border-radius: 16px;
                border: 1px solid var(--line);
              }
              .rating-row-modern {
                display: grid;
                grid-template-columns: 80px 1fr 50px;
                align-items: center;
                gap: 12px;
              }
              .rating-row-stars {
                display: flex;
                gap: 2px;
              }
              .star-mini {
                width: 14px;
                height: 14px;
                fill: var(--line);
              }
              .star-mini.filled {
                fill: #fbbf24;
              }
              .rating-bar-track {
                height: 10px;
                background: var(--hover);
                border-radius: 999px;
                overflow: hidden;
                position: relative;
              }
              :root[data-theme="dark"] .rating-bar-track {
                background: #1f2937;
              }
              .rating-bar-progress {
                height: 100%;
                background: linear-gradient(90deg, #fbbf24, #f59e0b);
                border-radius: 999px;
                transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
              }
              .rating-row-count {
                font-size: 14px;
                font-weight: 700;
                color: var(--muted);
                text-align: left;
              }
              .review-list {
                display: grid;
                gap: 12px;
              }
              .review-card {
                border: 1px solid var(--line);
                border-radius: 14px;
                padding: 12px 14px;
                display: grid;
                gap: 8px;
                background: var(--card);
                color: var(--text);
                text-align: right;
                direction: rtl;
              }
              .review-card.reply {
                margin-inline-end: 16px;
                background: linear-gradient(135deg, rgba(59,130,246,0.14), rgba(59,130,246,0.04));
                border-color: rgba(59,130,246,0.2);
              }
              .review-top {
                display: flex;
                align-items: center;
                justify-content: flex-start;
                gap: 10px;
                flex-direction: row-reverse;
              }
              .review-avatar {
                width: 40px;
                height: 40px;
                border-radius: 999px;
                overflow: hidden;
                border: 1px solid var(--line);
                background: radial-gradient(circle at 30% 20%, #38bdf8, #0f172a);
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
              }
              .review-avatar img {
                width: 100%;
                height: 100%;
                object-fit: cover;
              }
              .avatar-fallback {
                font-weight: 900;
                color: #e5e7eb;
                font-size: 18px;
              }
              .review-header {
                display: grid;
                gap: 4px;
                justify-items: flex-end;
                flex: 1;
              }
              .review-header-main {
                display: flex;
                align-items: center;
                justify-content: flex-end;
                gap: 8px;
                flex-direction: row-reverse;
              }
              .review-user {
                display: flex;
                align-items: center;
                gap: 8px;
                font-weight: 800;
                color: var(--primary);
              }
              .review-name { font-size: 14px; }
              .review-badge {
                font-size: 10px;
                background: #27ae60;
                color: #fff;
                padding: 2px 6px;
                border-radius: 4px;
                font-weight: 700;
              }
              .review-badge.admin {
                background: linear-gradient(120deg, #7c3aed, #3b82f6);
              }
              .review-badge.moderator {
                background: linear-gradient(120deg, #0ea5e9, #22c55e);
              }
              .review-phone {
                font-size: 12px;
                color: var(--muted);
                align-self: end;
              }
              .review-phone span {
                direction: ltr;
                unicode-bidi: plaintext;
                font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
              }
              .review-date {
                font-size: 12px;
                color: var(--muted);
                font-weight: 700;
              }
              .review-stars { color: #f5b200; font-weight: 900; letter-spacing: 1px; min-width: auto; text-align: right; }
              .reply-author-row {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                flex-direction: row-reverse;
              }
              .review-text {
                margin: 0;
                font-size: 14px;
                line-height: 1.7;
              }
              .review-reply {
                margin-top: 12px;
                padding: 10px 12px;
                border-radius: 10px;
                background: rgba(0, 173, 181, 0.08);
                border: 1px solid rgba(0, 173, 181, 0.2);
              }
              .reply-meta {
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 12px;
                color: var(--muted);
                margin-bottom: 6px;
              }
              .reply-author {
                font-weight: 700;
                color: var(--primary);
              }
              .reply-text {
                margin: 0;
                font-size: 13px;
                line-height: 1.6;
                color: var(--text);
              }
              .review-actions {
                display: flex;
                gap: 8px;
                justify-content: flex-start;
                flex-direction: row-reverse;
                margin-top: 4px;
              }
              .review-action-btn {
                border-radius: 999px;
                border: 1px solid var(--line);
                padding: 4px 10px;
                font-size: 11px;
                background: var(--bg);
                color: var(--text);
                cursor: pointer;
                display: inline-flex;
                align-items: center;
                gap: 4px;
              }
              .review-action-btn.danger {
                border-color: rgba(239,68,68,0.4);
                color: #ef4444;
              }
              .review-action-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
              }
              .review-reply-editor {
                margin-top: 6px;
                padding: 8px 10px;
                border-radius: 10px;
                border: 1px dashed var(--line);
                display: grid;
                gap: 6px;
              }
              .review-reply-editor textarea {
                width: 100%;
                border-radius: 8px;
                border: 1px solid var(--line);
                background: var(--bg);
                color: var(--text);
                font-size: 12px;
                padding: 8px 10px;
                resize: vertical;
              }
              .reply-editor-actions {
                display: flex;
                justify-content: flex-start;
                gap: 8px;
                flex-direction: row-reverse;
              }
              /* Modern Review Form */
              .review-form-container {
                padding: 24px;
                background: var(--card);
                border-radius: 16px;
                border: 1px solid var(--line);
              }
              .form-title {
                display: flex;
                align-items: center;
                gap: 10px;
                margin: 0 0 20px 0;
                font-size: 18px;
                font-weight: 800;
                color: var(--text);
              }
              .form-icon {
                width: 22px;
                height: 22px;
                color: var(--primary);
              }
              .review-form-modern {
                display: grid;
                gap: 20px;
              }
              .form-login-hint {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 10px;
                padding: 10px 12px;
                margin-bottom: 12px;
                border-radius: 10px;
                background: rgba(245, 158, 11, 0.08);
                border: 1px dashed rgba(245, 158, 11, 0.5);
                font-size: 13px;
                font-weight: 700;
                color: var(--text);
              }
              .form-group {
                display: grid;
                gap: 8px;
              }
              .form-label {
                font-size: 14px;
                font-weight: 700;
                color: var(--text);
              }
              .form-input,
              .form-textarea {
                width: 100%;
                border: 2px solid var(--line);
                border-radius: 12px;
                padding: 12px 16px;
                background: var(--bg);
                font-family: inherit;
                font-size: 14px;
                color: var(--text);
                transition: all 0.2s ease;
              }
              .form-input:focus,
              .form-textarea:focus {
                outline: none;
                border-color: var(--primary);
                box-shadow: 0 0 0 4px rgba(44,75,255,0.1);
                background: var(--card);
              }
              .form-textarea {
                resize: vertical;
                min-height: 120px;
                line-height: 1.6;
              }
              .form-input:disabled,
              .form-textarea:disabled {
                opacity: 0.6;
                cursor: not-allowed;
              }
              .rating-selector {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                flex-wrap: wrap;
              }
              .rating-stars-input {
                display: flex;
                flex-direction: row-reverse;
                gap: 4px;
              }
              .rating-star-btn {
                width: 32px;
                height: 32px;
                border-radius: 999px;
                border: none;
                background: transparent;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 0;
                transition: transform 0.15s ease, filter 0.15s ease;
              }
              .rating-star-btn .star-icon {
                width: 22px;
                height: 22px;
                fill: #4b5563;
                filter: drop-shadow(0 0 0 rgba(0,0,0,0));
                transition: fill 0.15s ease, filter 0.15s ease;
              }
              .rating-star-btn.filled .star-icon {
                fill: #fbbf24;
                filter: drop-shadow(0 0 4px rgba(251,191,36,0.6));
              }
              .rating-star-btn:hover:not(:disabled) {
                transform: translateY(-1px) scale(1.05);
              }
              .rating-star-btn:disabled {
                cursor: not-allowed;
                opacity: 0.6;
              }
              .rating-label {
                font-size: 13px;
                color: var(--muted);
                font-weight: 700;
              }
              .char-counter {
                font-size: 12px;
                color: var(--muted);
                text-align: left;
              }
              .char-counter .text-danger {
                color: #ef4444;
              }
              .char-counter .text-warning {
                color: #f59e0b;
              }
              .char-counter .text-muted {
                color: var(--muted);
              }
              .submit-review-btn {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                padding: 14px 28px;
                background: linear-gradient(135deg, var(--primary), #2c4bff);
                color: white;
                border: none;
                border-radius: 12px;
                font-size: 15px;
                font-weight: 700;
                cursor: pointer;
                transition: all 0.3s ease;
              }
              .submit-review-btn:hover:not(:disabled) {
                transform: translateY(-2px);
                box-shadow: 0 8px 20px rgba(44,75,255,0.3);
              }
              .submit-review-btn:disabled {
                opacity: 0.6;
                cursor: not-allowed;
                transform: none;
              }
              .submit-review-btn .send-icon {
                width: 18px;
                height: 18px;
              }
              .submit-review-btn .spinner {
                width: 20px;
                height: 20px;
                animation: spin 1s linear infinite;
              }
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
              @media (max-width: 640px) {
                .review-card {
                  padding: 12px;
                }
                .review-user {
                  flex-wrap: wrap;
                  justify-content: flex-end;
                }
              }
            `}</style>
          </>
        )}
      </main>
    </div>
  );
}
