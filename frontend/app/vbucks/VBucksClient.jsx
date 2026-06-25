"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PasswordInput from '../../components/PasswordInput';
import Navbar from "../../components/Navbar";
import PlatformSelector from "../../components/PlatformSelector";
import SmartImage from "../../components/SmartImage";
import { useCart } from "../../lib/useCart";
import TelegramContact from "../../components/TelegramContact";
import { getPlatformOption } from "../../lib/platforms";
import { getProductDescriptionData } from "../../lib/productDescriptions";
import EnamadBadge from "../../components/EnamadBadge";
import ZarinpalBadge from "../../components/ZarinpalBadge";
import { resolveProductImage } from "../../lib/productImageHelpers";
import { adminCacheBustHref } from "../../lib/adminUrl.mjs";

const vbucksOptions = [
  {
    id: 'vbucks-800',
    variant_id: 11,
    amount: 800,
    name_fa: '۸۰۰ وی‌باکس',
    price: 635000,
    subtitle: 'مناسب برای بتل‌پس',
    popular: false
  },
  {
    id: 'vbucks-2400',
    variant_id: 12,
    amount: 2400,
    name_fa: '۲,۴۰۰ وی‌باکس',
    price: 0,
    subtitle: 'پرفروش‌ترین گزینه',
    popular: true,
    badge: 'محبوب'
  },
  {
    id: 'vbucks-4500',
    variant_id: 13,
    amount: 4500,
    name_fa: '۴,۵۰۰ وی‌باکس',
    price: 0,
    subtitle: 'ارزش بیشتر برای پول',
    popular: false
  },
  {
    id: 'vbucks-12500',
    variant_id: 20,
    amount: 12500,
    name_fa: '۱۲,۵۰۰ وی‌باکس',
    price: 0,
    original_price: null,
    subtitle: 'بهترین ارزش - ۱۰٪ تخفیف',
    popular: false,
    badge: 'پیشنهاد ویژه'
  },
];

export default function VBucksClient({ initialProductData }) {
  const router = useRouter();
  const { addItem } = useCart();
  
  const getInitialOptions = () => {
    if (!initialProductData) return vbucksOptions;
    const variants = Array.isArray(initialProductData.variants) ? initialProductData.variants : [];
    if (!variants.length) return vbucksOptions;
    return vbucksOptions.map((opt) => {
      const v = variants.find((vv) => vv.id === opt.variant_id) ||
        variants.find((vv) => (vv.title || "").includes(String(opt.amount)));
      return v ? { ...opt, price: v.price || 0, title: v.title || opt.name_fa } : opt;
    });
  };

  const [options, setOptions] = useState(getInitialOptions());
  const [selectedVariantId, setSelectedVariantId] = useState(vbucksOptions[1].variant_id); // Default to 2400
  const [productData, setProductData] = useState(initialProductData || null);
  const [accountEmail, setAccountEmail] = useState("");
  const [accountPassword, setAccountPassword] = useState("");
  const [accountType, setAccountType] = useState("epic");
  const [formError, setFormError] = useState("");
  const [showValidation, setShowValidation] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({ total: 0, rating: 0 });
  const [currentUser, setCurrentUser] = useState(null);
  const [reviewName, setReviewName] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [activeTab, setActiveTab] = useState("description");
  const todayFa = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { day: "numeric", month: "long", timeZone: "Asia/Tehran" }).format(new Date());

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  const productImage = useMemo(
    () => resolveProductImage(productData || { slug: "v-bucks" }),
    [productData]
  );
  const productId = Number(productData?.id) || 3;

  useEffect(() => {
    const loadReviews = async () => {
      try {
        const res = await fetch(`${apiBase}/api/products/v-bucks/comments`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!data.success) return;
        const formatted = data.comments.map((comment) => ({
          id: comment.id,
          user: comment.author_name,
          date: new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
            day: "numeric",
            month: "long",
            year: "numeric",
            timeZone: "Asia/Tehran",
          }).format(new Date(comment.created_at)),
          rating: comment.rating,
          text: comment.text,
          isVerified: comment.is_verified_purchase,
          avatarUrl: comment.avatar_url || "",
          userId: comment.user_id,
        }));
        setReviews(formatted);
        setReviewStats({
          total: data.stats.total,
          rating: data.stats.average_rating,
          breakdown: data.stats.rating_counts,
        });
      } catch {
        // keep empty reviews on failure
      }
    };
    loadReviews();
  }, [apiBase]);

  // Load V-Bucks product prices/variants from backend so admin edits reflect here.
  useEffect(() => {
    if (!apiBase) return;
    let cancelled = false;
    const loadProduct = async () => {
      try {
        const res = await fetch(`${apiBase}/api/products/v-bucks`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setProductData(data);
        const variants = Array.isArray(data?.variants) ? data.variants : [];
        if (!variants.length || cancelled) return;
        const updated = vbucksOptions.map((opt) => {
          const v = variants.find((vv) => vv.id === opt.variant_id) ||
            variants.find((vv) => (vv.title || "").includes(String(opt.amount)));
          return v ? { ...opt, price: v.price || 0, title: v.title || opt.name_fa } : opt;
        });
        if (!cancelled) {
          setOptions(updated);
          if (!updated.some((o) => o.variant_id === selectedVariantId)) {
            const fallback = updated[1] || updated[0];
            if (fallback) setSelectedVariantId(fallback.variant_id);
          }
        }
      } catch {
        // ignore, keep defaults
      }
    };
    loadProduct();
    return () => { cancelled = true; };
  }, [apiBase, selectedVariantId]);

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
    if (!name || !text) return;
    const normalizedRating = Math.min(5, Math.max(1, Number(reviewRating) || 5));
    try {
      const res = await fetch(`${apiBase}/api/products/v-bucks/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ author_name: name, rating: normalizedRating, text }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.message || "خطا در ثبت نظر. لطفاً دوباره تلاش کنید.");
        return;
      }
      const newReview = {
        id: data.comment?.id,
        user: name,
        date: todayFa,
        rating: normalizedRating,
        text,
      };
      setReviews((prev) => [newReview, ...prev]);
      setReviewStats((prev) => {
        const total = prev.total + 1;
        const rating = ((prev.rating * prev.total) + normalizedRating) / total;
        return { ...prev, total, rating };
      });
      setReviewName("");
      setReviewText("");
      setReviewRating(5);
    } catch {
      alert("خطا در ثبت نظر. لطفاً دوباره تلاش کنید.");
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

  const descriptionData = getProductDescriptionData("v-bucks");
  const productDescription = descriptionData.description || "";
  const conversionDescription = descriptionData.conversion || "";
  const descriptionLines = productDescription.split("\n").filter((line) => line.trim().length > 0);
  const conversionLines = conversionDescription.split("\n").filter((line) => line.trim().length > 0);
  const totalReviews = reviewStats.total;
  const adminPhones = ["09339732325", "09123101634"];
  const isAdminUser =
    currentUser?.is_admin || adminPhones.includes(currentUser?.phone_number);

  const emailIsValid = (val) => {
    const v = (val || "").trim();
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);
  };

  const currentPlatform = getPlatformOption(accountType);

  const selectedOption = useMemo(
    () => options.find((o) => o.variant_id === selectedVariantId) || options[1] || options[0],
    [options, selectedVariantId]
  );

  const handleAdd = () => {
    if (!selectedOption) return;
    setShowValidation(true);

    if (!emailIsValid(accountEmail)) {
      setFormError("ایمیل معتبر وارد کنید.");
      return;
    }
    if (!accountType) {
      setFormError("نوع حساب را انتخاب کنید.");
      return;
    }
    if (!accountPassword.trim()) {
      setFormError("رمز حساب را وارد کنید.");
      return;
    }
    setFormError("");

    addItem({
      product_id: productId,
      variant_id: selectedOption.variant_id,
      name: `${selectedOption.name_fa} فورتنایت`,
      price: selectedOption.price,
      quantity: 1,
      slug: 'v-bucks',
      image: productImage.imageSrc || (productImage.imageBase ? `${productImage.imageBase}.webp` : '/products/vbucks.webp'),
      account_email: accountEmail.trim(),
      account_type: accountType,
      account_password: accountPassword,
    });

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("cart:add"));
    }
  };

  return (
    <div>
      <Suspense fallback={null}>
        <Navbar />
      </Suspense>
      {isAdminUser && (
        <div className="admin-fab">
          <button onClick={() => { window.location.href = adminCacheBustHref(); }} aria-label="پنل مدیریت">
            ⭐
            <span>مدیریت</span>
          </button>
        </div>
      )}
      <main className="container" style={{ padding: "24px 0 40px" }}>
        <section className="card section product-hero">
          <div className="image-stack">
            {/* Main Image */}
            <div
              className="hero-image"
              style={{
                position: "relative",
                aspectRatio: "1/1",
                borderRadius: 18,
                overflow: "hidden",
                background: "linear-gradient(135deg,#0f2250,#141a3a)",
              }}
            >
              <SmartImage
                src={productImage.imageSrc}
                base={productImage.imageBase}
                alt="V-Bucks فورتنایت"
                fit="contain"
              />
            </div>

	            {/* Account Info Form */}
	            <div className="info-card">
	              <div className="info-head">
	                <span>اطلاعات لازم برای فعال‌سازی</span>
	                <span className="fortnite-pill">Fortnite</span>
	              </div>
	              <div className="info-body">
	                <div>
	                  <span style={{ fontWeight: 800, fontSize: 13 }}>لطفاً قبل از افزودن به سبد تکمیل کنید:</span>
	                  <ul>
	                    <li>انتخاب پلتفرم (Epic / PSN / Xbox)</li>
	                    <li>ایمیل اکانت (اجباری)</li>
	                    <li>رمز همان حساب (اجباری برای فعال‌سازی سریع)</li>
	                  </ul>
	                </div>
	              </div>
	              <div style={{ display: "grid", gap: 12, marginTop: 8 }}>
	                <label>
                  <span className="required-label">نوع حساب (اجباری)</span>
                  <PlatformSelector
                    value={accountType}
                    onChange={(value) => {
                      setAccountType(value);
                      setFormError("");
                    }}
                  />
                </label>
	                <label>
	                  <span className="required-label">
	                    ایمیل (اجباری) {showValidation && !accountEmail.trim() && <span style={{ fontSize: 11 }}>⚠️</span>}
	                  </span>
	                  <input
	                    required
	                    value={accountEmail}
	                    onChange={(e) => {
	                      setAccountEmail(e.target.value);
	                      setFormError("");
	                      if (showValidation) setShowValidation(false);
	                    }}
	                    placeholder={currentPlatform.email}
	                    style={{
	                      borderColor: (showValidation && !accountEmail.trim()) ? "var(--danger)" : undefined,
	                    }}
	                  />
	                </label>
	                <label>
	                  <span className="required-label">
	                    رمز عبور (اجباری)
	                    {showValidation && !accountPassword.trim() && <span style={{ fontSize: 11 }}>⚠️</span>}
	                  </span>
	                  <PasswordInput
	                    value={accountPassword}
	                    onChange={(e) => {
	                      setAccountPassword(e.target.value);
	                      setFormError("");
	                      if (showValidation) setShowValidation(false);
	                    }}
	                    placeholder={currentPlatform.pass}
	                    style={{
	                      borderColor: (showValidation && !accountPassword.trim()) ? "var(--danger)" : undefined,
	                    }}
	                  />
	                </label>
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
                    ⚠️ {formError}
                  </div>
                )}

                {/* Buy Button Inside Form */}
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
                خرید V-Bucks فورتنایت
              </h1>
              <div className="muted subtitle-row" style={{ fontSize: 14 }}>پول درون‌بازی فورتنایت - فعال‌سازی سریع</div>

              {/* Rating Summary */}
              {reviewStats.total > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ color: '#f5b200', fontSize: 18 }}>★</span>
                    <span style={{ fontWeight: 800, fontSize: 16 }}>{reviewStats.rating.toFixed(1)}</span>
                  </div>
                  <span className="muted" style={{ fontSize: 13 }}>
                    ({reviewStats.total.toLocaleString("fa-IR")} نظر)
                  </span>
                </div>
              )}
            </div>

	            {/* V-Bucks Options */}
	            <div className="vbucks-options">
	              <div className="options-title">انتخاب مقدار V-Bucks:</div>
	            <div className="options-grid">
	                {options.map((option) => (
	                  <div
	                    key={option.id}
	                    className={`option-card ${selectedOption.id === option.id ? 'selected' : ''}`}
	                    onClick={() => setSelectedVariantId(option.variant_id)}
	                    style={{
	                      cursor: 'pointer',
	                      position: 'relative'
	                    }}
                  >
                    {option.badge && (
                      <div className="option-badge">{option.badge}</div>
                    )}
                    <div className="option-amount">{option.name_fa}</div>
                    <div className="option-subtitle">{option.subtitle}</div>
                    <div className="option-price-row">
                      {option.original_price && (
                        <span className="option-price-old">
                          {option.original_price.toLocaleString("fa-IR")}
                        </span>
                      )}
	                      <span className="option-price">
	                        {option.price ? option.price.toLocaleString("fa-IR") : "—"} تومان
	                      </span>
	                    </div>
	                  </div>
	                ))}
	              </div>
	            </div>

            {/* Selected Option Display */}
	            <div className="price-row" style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
	              {selectedOption.original_price ? (
	                <div className="price-old" style={{ fontSize: 16, lineHeight: 1.2 }}>
	                  {selectedOption.original_price.toLocaleString("fa-IR")} تومان
	                </div>
	              ) : null}
	              <div className="price" style={{ fontSize: 24, lineHeight: 1.2, fontWeight: 900 }}>
	                {selectedOption.price ? selectedOption.price.toLocaleString("fa-IR") : "—"} تومان
	              </div>
	            </div>

            {/* Product Highlights */}
            <div className="product-highlights">
              <div className="highlight-item">
                <svg className="highlight-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="m9 12 2 2 4-4"/>
                </svg>
                <div className="highlight-text">
                  <div className="highlight-title">تحویل طی</div>
                  <div className="highlight-desc">
                    {accountType === 'xbox' ? "۳۰ دقیقه الی ۴۸ ساعت" : "۱۵ دقیقه تا ۸ ساعت کاری"}
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

            {/* Tabs for Description and Delivery */}
            <div className="product-tabs">
              <div className="tab-buttons">
                <button
                  className={`tab-btn ${activeTab === 'description' ? 'active' : ''}`}
                  onClick={() => setActiveTab('description')}
                >
                  توضیحات
                </button>
                <button
                  className={`tab-btn ${activeTab === 'delivery' ? 'active' : ''}`}
                  onClick={() => setActiveTab('delivery')}
                >
                  نحوه تحویل
                </button>
              </div>

              <div className="tab-content">
                {activeTab === 'description' && descriptionLines.length > 0 && (
                  <div className="description-box">
                    {descriptionLines.map((line, i) => {
                      if (line.trim().startsWith('•')) {
                        return <div key={i} style={{ marginBottom: '8px' }}>{renderTextWithBold(line, `d-bullet-${i}`)}</div>;
                      }
                      return <div key={i} style={{ marginBottom: '6px' }}>{renderTextWithBold(line, `d-line-${i}`)}</div>;
                    })}
                  </div>
                )}

                {activeTab === 'delivery' && (
                  <div className="delivery-info">
                    {conversionLines.length > 0 && (
                      <div className="conversion-box">
                        {conversionLines.map((line, i) => {
                          if (line.trim().startsWith('•')) {
                            return <div key={i} style={{ marginBottom: '8px' }}>{renderTextWithBold(line, `c-bullet-${i}`)}</div>;
                          }
                          return <div key={i} style={{ marginBottom: '6px' }}>{renderTextWithBold(line, `c-line-${i}`)}</div>;
                        })}
                      </div>
                    )}
                    <div className="delivery-step">
                      <div className="step-number">۱</div>
                      <div>
                        <div className="step-title">ثبت سفارش</div>
                        <div className="step-desc">مقدار V-Bucks را انتخاب کرده و اطلاعات حساب را وارد کنید</div>
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
                        <div className="step-desc">
                          تیم ما طی {accountType === 'xbox' ? "۳۰ دقیقه الی ۴۸ ساعت" : "۱۵ دقیقه تا ۸ ساعت کاری"} V-Bucks را به اکانت شما اضافه می‌کند
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </section>

        {/* FAQ Section */}
        <section className="card section faq-section" style={{ marginTop: 16 }}>
          <h3 style={{ margin: 0, marginBottom: 16, fontSize: 18, fontWeight: 900 }}>سوالات متداول</h3>
          <div className="faq-list">
            <details className="faq-item">
              <summary className="faq-question">V-Bucks چیست و چطور استفاده می‌شود؟</summary>
              <div className="faq-answer">
                V-Bucks پول درون‌بازی فورتنایت است که با آن می‌توانید اسکین‌های کاراکتر، ایموت، گلایدر، پیکس و سایر آیتم‌های تزئینی را از فروشگاه بازی خریداری کنید. همچنین می‌توانید با V-Bucks Battle Pass فصل جاری را تهیه کنید.
              </div>
            </details>
            <details className="faq-item">
              <summary className="faq-question">چگونه V-Bucks را دریافت می‌کنم؟</summary>
              <div className="faq-answer">
                پس از خرید و ارسال اطلاعات حساب، تیم ما طی {accountType === 'xbox' ? "۳۰ دقیقه الی ۴۸ ساعت" : "۱۵ دقیقه تا ۸ ساعت کاری"} V-Bucks را مستقیماً به اکانت Epic Games، PlayStation یا Xbox شما اضافه می‌کند. شما فقط کافی است وارد بازی شوید تا موجودی جدید را ببینید.
              </div>
            </details>
            <details className="faq-item">
              <summary className="faq-question">آیا نیاز به رمز عبور حساب دارید؟</summary>
              <div className="faq-answer">
                بله، برای فعال‌سازی سریع و بدون نیاز به دخالت شما، نیاز به رمز عبور حساب Epic Games، PSN یا Xbox داریم. اطلاعات شما کاملا محرمانه و امن نگهداری می‌شود و فقط برای فعال‌سازی V-Bucks استفاده خواهد شد.
              </div>
            </details>
            <details className="faq-item">
              <summary className="faq-question">کدام مقدار V-Bucks را انتخاب کنم؟</summary>
              <div className="faq-answer">
                بستگی به نیاز شما دارد. ۸۰۰ V-Bucks برای خرید یک Battle Pass کافی است. ۲۴۰۰ V-Bucks محبوب‌ترین گزینه برای خرید چند اسکین است. مقادیر بالاتر برای کسانی که می‌خواهند خریدهای بیشتری انجام دهند یا پس‌انداز داشته باشند، مناسب‌تر هستند.
              </div>
            </details>
            <details className="faq-item">
              <summary className="faq-question">آیا V-Bucks انقضا دارد؟</summary>
              <div className="faq-answer">
                خیر، V-Bucks هیچ تاریخ انقضایی ندارد و تا زمانی که اکانت شما فعال باشد، در حساب شما باقی می‌ماند و می‌توانید هر زمان که بخواهید از آن استفاده کنید.
              </div>
            </details>
          </div>
        </section>

        <TelegramContact />

        {/* Reviews Section */}
        <section className="card section" style={{ marginTop: 16, display: "grid", gap: 16 }}>
          <div className="review-head">
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>
              {totalReviews.toLocaleString("fa-IR")} دیدگاه برای خرید V-Bucks فورتنایت
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="review-stars" style={{ fontSize: 18 }}>{"★".repeat(Math.round(reviewStats.rating))}</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--primary)' }}>
                  {reviewStats.rating?.toFixed(1)}
                </span>
              </div>
              <span className="muted" style={{ fontSize: 12 }}>نمایش چند مورد از آخرین خریدها</span>
            </div>
          </div>
          {reviewStats.breakdown && (
            <div className="rating-breakdown">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = reviewStats.breakdown[star] || 0;
                const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                return (
                  <div key={star} className="rating-bar-row">
                    <span className="star-label">{star} ⭐</span>
                    <div className="rating-bar-bg">
                      <div
                        className="rating-bar-fill"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="rating-count">{count.toLocaleString("fa-IR")}</span>
                  </div>
                );
              })}
            </div>
          )}
          <div className="review-list">
            {reviews.map((rev) => (
              <article
                key={`${rev.user}-${rev.date}-${rev.text.slice(0, 10)}`}
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
                      </div>
                      {rev.rating ? (
                        <div className="review-stars" aria-label={`${rev.rating} از 5`}>
                          {"★".repeat(Math.min(rev.rating, 5))}
                        </div>
                      ) : null}
                    </div>
                    <div className="review-date">{rev.date}</div>
                  </div>
                </div>
                <p className="review-text">{rev.text}</p>
              </article>
            ))}
          </div>
          <form className="review-form" onSubmit={handleSubmitReview}>
            <div className="form-row">
              <input
                type="text"
                placeholder="نام شما"
                value={reviewName}
                onChange={(e) => setReviewName(e.target.value)}
              />
              <div className="rating-choice" role="radiogroup" aria-label="امتیاز">
                {[5, 4, 3, 2, 1].map((r) => (
                  <button
                    type="button"
                    key={r}
                    className={`rating-pill ${reviewRating === r ? "active" : ""}`}
                    onClick={() => setReviewRating(r)}
                    aria-label={`${r} ستاره`}
                  >
                    {r} ★
                  </button>
                ))}
              </div>
            </div>
            <textarea
              rows={3}
              placeholder="تجربه خود را بنویسید..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
            />
            <div className="form-actions">
              <button type="submit" className="btn primary">ثبت نظر</button>
            </div>
          </form>
        </section>
      </main>

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

        /* V-Bucks Options Styling */
        .vbucks-options {
          background: linear-gradient(135deg, rgba(0,213,255,0.06), rgba(108,92,231,0.04));
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 14px;
          padding: 16px;
        }
        .vbucks-options .options-title {
          font-weight: 800;
          font-size: 14px;
          margin-bottom: 10px;
          color: var(--text);
        }
        .options-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }
        .option-card {
          position: relative;
          padding: 14px;
          background: #ffffff;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          transition: all 0.3s ease;
          color: var(--text);
        }
        .option-card:hover {
          border-color: #3b82f6;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(59,130,246,0.15);
        }
        .option-card.selected {
          border-color: #0f2250;
          background: linear-gradient(135deg, rgba(15,34,80,0.08), rgba(15,34,80,0.04));
          box-shadow: 0 8px 24px rgba(15,34,80,0.2);
        }
        .option-badge {
          position: absolute;
          top: -8px;
          right: 8px;
          padding: 4px 10px;
          background: linear-gradient(135deg, #f59e0b, #fbbf24);
          color: #0f172a;
          font-size: 11px;
          font-weight: 900;
          border-radius: 999px;
          box-shadow: 0 4px 12px rgba(245,158,11,0.3);
        }
        .option-amount {
          font-size: 18px;
          font-weight: 900;
          color: #0f2250;
          margin-bottom: 4px;
        }
        .option-subtitle {
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 8px;
        }
        .option-price-row {
          display: flex;
          gap: 6px;
          align-items: baseline;
          flex-wrap: wrap;
        }
        .option-price {
          font-size: 15px;
          font-weight: 800;
          color: #0f2250;
        }
        .option-price-old {
          font-size: 12px;
          color: #9ca3af;
          text-decoration: line-through;
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
        .tab-buttons {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          background: #f8f9fd;
          border-bottom: 1px solid var(--line);
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
          background: #fff;
          color: var(--primary);
          font-weight: 900;
        }
        .tab-btn:hover:not(.active) {
          background: rgba(255,255,255,0.5);
        }
        .tab-content {
          padding: 20px;
          background: #fff;
          min-height: 200px;
        }

        /* Description Box */
        .description-box {
          font-size: 14px;
          line-height: 1.9;
        }

        /* Features Grid */
        .features-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        .feature-card {
          padding: 16px;
          background: linear-gradient(135deg, #f8f9fd, #ffffff);
          border: 1px solid var(--line);
          border-radius: 12px;
          text-align: center;
          transition: all 0.3s ease;
        }
        .feature-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.08);
          border-color: var(--primary);
        }
        .feature-icon {
          font-size: 32px;
          margin-bottom: 8px;
        }
        .feature-title {
          font-weight: 800;
          font-size: 14px;
          margin-bottom: 4px;
          color: var(--text);
        }
        .feature-desc {
          font-size: 12px;
          color: var(--muted);
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
        :root[data-theme="dark"] .faq-question:hover {
          background: #111827;
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

        /* Dark mode adjustments */
        .info-card {
          background: var(--card);
          border: 2px solid var(--line);
          border-radius: 14px;
          padding: 16px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.06);
        }
        .info-card .info-head {
          font-weight: 900;
          display: flex;
          gap: 10px;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          margin-bottom: 12px;
          color: var(--text);
        }
        .info-card .info-head .fortnite-pill {
          padding: 4px 10px;
          border-radius: 999px;
          background: #0f2250;
          color: #fff;
          font-weight: 800;
          font-size: 12px;
        }
	        .info-card .info-body {
	          font-size: 13px;
	          line-height: 1.7;
	          display: grid;
	          gap: 8px;
	          margin-bottom: 12px;
	          color: var(--text);
	        }
	        .info-card .info-body ul {
	          padding-inline-start: 18px;
	          margin: 6px 0;
	          display: grid;
	          gap: 4px;
	        }
        .info-card .info-body span,
        .info-card .info-body li {
          color: var(--muted);
        }
        .info-card label,
        .info-card .required-label {
          display: grid;
          gap: 6px;
          font-size: 13px;
        }
        .info-card label span {
          font-weight: 700;
          color: var(--text);
          font-size: 13px;
        }
        .info-card input,
        .info-card select {
          border: 2px solid var(--line);
          border-radius: 10px;
          padding: 12px 14px;
          background: var(--surface);
          color: var(--text);
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s ease;
          outline: none;
        }
        /* PasswordInput renders in a child component, so the scoped rule above
           never reaches it — style it via :global with room for the eye toggle */
        .info-card :global(.password-toggle-wrapper input) {
          width: 100%;
          border: 2px solid var(--line);
          border-radius: 10px;
          padding: 12px 44px 12px 14px;
          background: var(--surface);
          color: var(--text);
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s ease;
          outline: none;
        }
        .info-card button {
          width: 100%;
          padding: 14px 20px;
          font-size: 16px;
          font-weight: 900;
          margin-top: 8px;
        }

        :global(:root[data-theme="dark"]) .info-card {
          background: var(--card) !important;
          border-color: var(--line) !important;
          box-shadow: none !important;
        }
        :global(:root[data-theme="dark"]) .info-card input,
        :global(:root[data-theme="dark"]) .info-card select,
        :global(:root[data-theme="dark"]) .info-card :global(.password-toggle-wrapper input) {
          background: var(--surface) !important;
          color: var(--text) !important;
          border-color: var(--line) !important;
        }
        :global(:root[data-theme="dark"]) .vbucks-options {
          background: linear-gradient(135deg, rgba(0,213,255,0.04), rgba(108,92,231,0.06));
          border-color: var(--line);
        }
        :global(:root[data-theme="dark"]) .options-title,
        :global(:root[data-theme="dark"]) .option-amount,
        :global(:root[data-theme="dark"]) .option-subtitle,
        :global(:root[data-theme="dark"]) .option-price {
          color: var(--text);
        }
        :global(:root[data-theme="dark"]) .option-subtitle {
          color: var(--muted);
        }
        :global(:root[data-theme="dark"]) .option-card {
          background: var(--card);
          border-color: var(--line);
          box-shadow: none;
        }
        :global(:root[data-theme="dark"]) .option-card.selected {
          background: linear-gradient(135deg, rgba(15,34,80,0.22), rgba(15,34,80,0.12));
          border-color: #60a5fa;
        }
        :global(:root[data-theme="dark"]) .tab-buttons {
          background: var(--surface);
        }
        :global(:root[data-theme="dark"]) .tab-btn {
          color: var(--muted);
        }
        :global(:root[data-theme="dark"]) .tab-btn.active {
          background: var(--card);
          color: var(--primary);
        }
        :global(:root[data-theme="dark"]) .tab-content {
          background: var(--card);
        }
        :global(:root[data-theme="dark"]) .feature-card {
          background: var(--card);
        }
        :global(:root[data-theme="dark"]) .faq-item {
          background: var(--card);
        }
        :global(:root[data-theme="dark"]) .faq-question:hover {
          background: var(--surface);
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
          .vbucks-options { order: 2; }
          .price-row { order: 3; }
          .info-card { order: 4; }
          .product-highlights { order: 5; }
          .product-tabs { order: 6; }
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
          .options-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 640px) {
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
          .title-row {
            font-size: 18px !important;
            margin-bottom: 4px !important;
          }
          .subtitle-row {
            font-size: 12px !important;
          }
          .price {
            font-size: 20px !important;
          }
          .price-old {
            font-size: 14px !important;
          }
          .product-highlights {
            padding: 8px 6px;
            gap: 4px;
          }
          .tab-content {
            padding: 14px;
          }
          .tab-btn {
            padding: 12px;
            font-size: 13px;
          }
        }

        .review-head {
          display: grid;
          gap: 12px;
        }
        .rating-breakdown {
          display: grid;
          gap: 8px;
          padding: 12px;
          background: var(--card);
          border-radius: 12px;
          border: 1px solid var(--line);
        }
        :root[data-theme="dark"] .rating-breakdown {
          background: #0b1224;
          border-color: #1f2937;
        }
        .rating-bar-row {
          display: grid;
          grid-template-columns: 60px 1fr 50px;
          align-items: center;
          gap: 10px;
        }
        .star-label {
          font-size: 13px;
          font-weight: 800;
          color: var(--text);
        }
        .rating-bar-bg {
          height: 8px;
          background: var(--hover);
          border-radius: 999px;
          overflow: hidden;
          position: relative;
        }
        :root[data-theme="dark"] .rating-bar-bg {
          background: #1f2937;
        }
        .rating-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #f5b200, #ffb025);
          border-radius: 999px;
          transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .rating-count {
          font-size: 12px;
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
          justify-content: space-between;
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
        .review-date { font-size: 12px; color: var(--muted); font-weight: 700; }
        .review-user { display: flex; align-items: center; gap: 8px; font-weight: 800; color: var(--primary); }
        .review-stars { color: #f5b200; font-weight: 900; letter-spacing: 1px; min-width: 80px; text-align: left; }
        .review-text {
          margin: 0;
          font-size: 14px;
          line-height: 1.7;
        }
        .review-form {
          display: grid;
          gap: 10px;
          margin-top: 4px;
          border-top: 1px solid var(--line);
          padding-top: 12px;
        }
        .review-form .form-row {
          display: grid;
          gap: 8px;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        }
        .review-form input,
        .review-form select,
        .review-form textarea {
          border: 1px solid var(--line);
          border-radius: 10px;
          padding: 10px 12px;
          background: var(--card);
          font-family: inherit;
          color: var(--text);
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .review-form input:focus,
        .review-form select:focus,
        .review-form textarea:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 2px rgba(44,75,255,0.12);
        }
        .review-form textarea { resize: vertical; min-height: 90px; }
        .review-form .form-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }
        .rating-choice {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          align-items: center;
        }
        .rating-pill {
          border: 1px solid var(--line);
          background: var(--card);
          border-radius: 999px;
          padding: 8px 10px;
          cursor: pointer;
          font-weight: 800;
          color: var(--text);
        }
        .rating-pill.active {
          border-color: var(--primary);
          color: var(--primary);
          box-shadow: 0 0 0 2px rgba(44,75,255,0.12);
        }
      `}</style>
    </div>
  );
}
