"use client";
import { Suspense, useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import PlatformSelector from "../../components/PlatformSelector";
import SmartImage from "../../components/SmartImage";
import PasswordInput from '../../components/PasswordInput';
import { useCart } from "../../lib/useCart";
import TelegramContact from "../../components/TelegramContact";
import { getPlatformOption } from "../../lib/platforms";
import { buildCrewpackPresentation } from "../../lib/crewpackDisplay";
import { adminCacheBustHref } from "../../lib/adminUrl.mjs";

const CREWPACK_FAQ_ITEMS = [
  {
    question: "کروپک شامل چه مزایایی است؟",
    answer:
      "کروپک شامل: ۱) اسکین اختصاصی ماهانه، ۲) ۸۰۰ V-Bucks، ۳) بتل‌پس فصل جاری (در صورت نداشتن)، ۴) آیتم‌های اختصاصی Crew Pack است.",
  },
  {
    question: "زمان فعال‌سازی چقدر است؟",
    answer:
      "فعال‌سازی فوری معمولاً بین ۱۵ تا ۴۵ دقیقه انجام می‌شود (برای حساب‌های ایکس‌باکس ممکن است کمی بیشتر طول بکشد).",
  },
  {
    question: "فعال‌سازی فوری چیست؟",
    answer:
      "در مرحله پرداخت می‌توانید فعال‌سازی فوری را انتخاب کنید تا سفارش شما با اولویت سریع و رسیدگی اختصاصی انجام شود.",
  },
  {
    question: "آیا اطلاعات حساب من امن است؟",
    answer:
      "بله، اطلاعات شما کاملا محرمانه و امن نگهداری می‌شود و فقط برای فعال‌سازی کروپک استفاده خواهد شد. پس از فعال‌سازی می‌توانید رمز خود را تغییر دهید.",
  },
];

export default function CrewPackClient({ initialProduct }) {
  const router = useRouter();
  const { addItem } = useCart();
  const [accountEmail, setAccountEmail] = useState("");
  const [accountPassword, setAccountPassword] = useState("");
  const [accountType, setAccountType] = useState("epic");
  const [formError, setFormError] = useState("");
  const [showValidation, setShowValidation] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({ total: 0, rating: 0 });
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [reviewName, setReviewName] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [activeTab, setActiveTab] = useState("description");
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState(null);
  const reviewsSectionRef = useRef(null);
  const [openFaqs, setOpenFaqs] = useState(() => []);
  const toggleFaq = useCallback((index) => {
    setOpenFaqs((prev) =>
      prev.includes(index) ? prev.filter((id) => id !== index) : [...prev, index]
    );
  }, []);

  const scrollToReviews = useCallback(() => {
    reviewsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const [crewProduct, setCrewProduct] = useState(initialProduct || null);
  const crewpackPresentation = useMemo(() => buildCrewpackPresentation(crewProduct), [crewProduct]);
  const [crewProductId, setCrewProductId] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState(crewpackPresentation.selectedVariantId);
  const options = crewpackPresentation.options;

  const todayFa = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { day: "numeric", month: "long", timeZone: "Asia/Tehran" }).format(new Date());
  const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL || "").trim();

  // Load product price from backend so admin panel controls it
  useEffect(() => {
    let cancelled = false;
    const loadProduct = async () => {
      try {
        const res = await fetch(`${apiBase}/api/products/fortnite-crew-pack`, { cache: "no-store" });
        if (!res.ok) return;
        const crew = await res.json();
        if (!crew || cancelled) return;
        if (crew.id) setCrewProductId(Number(crew.id) || 1);
        setCrewProduct(crew);
      } catch {
        // keep defaults
      }
    };
    loadProduct();
    return () => {
      cancelled = true;
    };
  }, [apiBase]);

  useEffect(() => {
    const nextSelected = crewpackPresentation.selectedVariantId;
    if (!options.some((option) => option.variant_id === selectedVariantId)) {
      setSelectedVariantId(nextSelected);
    }
  }, [crewpackPresentation.selectedVariantId, options, selectedVariantId]);

  // Epic capacity UI removed (instant activation offered at checkout)

  useEffect(() => {
    const loadReviews = async () => {
      setReviewsLoading(true);
      try {
        const res = await fetch(`${apiBase}/api/products/fortnite-crew-pack/comments`, {
          cache: "no-store",
        });
        if (!res.ok) {
          setReviews([]);
          setReviewStats({ total: 0, rating: 0, breakdown: {} });
          return;
        }
        const data = await res.json();
        if (data.success) {
          const formattedReviews = (data.comments || []).map((comment) => ({
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
            phone: (comment.phone_mask || "").replace(/[^\x00-\x7F]+/g, ""),
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
      } catch {
        setReviews([]);
        setReviewStats({ total: 0, rating: 0, breakdown: {} });
      } finally {
        setReviewsLoading(false);
      }
    };
    loadReviews();
  }, [apiBase]);

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

    const normalizedRating = Math.min(5, Math.max(1, Number(reviewRating) || 0));
    setReviewSubmitting(true);
    try {
      const res = await fetch(`${apiBase}/api/products/fortnite-crew-pack/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          author_name: name,
          rating: normalizedRating,
          text,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data?.message || "خطا در ثبت نظر. دوباره تلاش کنید.");
        return;
      }
      const newReview = {
        id: data.comment.id,
        user: data.comment.author_name,
        date: new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Asia/Tehran",
        }).format(new Date(data.comment.created_at)),
        rating: data.comment.rating,
        text: data.comment.text,
        isVerified: data.comment.is_verified_purchase,
        reply: data.comment.reply || null,
      };
      setReviews((prev) => [newReview, ...prev]);
      setReviewStats((prev) => {
        const total = prev.total + 1;
        const rating = ((prev.rating * prev.total) + normalizedRating) / total;
        const newBreakdown = { ...(prev.breakdown || {}) };
        newBreakdown[normalizedRating] = (newBreakdown[normalizedRating] || 0) + 1;
        return { ...prev, total, rating, breakdown: newBreakdown };
      });
      setReviewName("");
      setReviewText("");
      setReviewRating(5);
      alert("نظر شما با موفقیت ثبت شد!");
    } catch (err) {
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

  const totalReviews = reviewStats.total;
  const adminPhones = ["09339732325", "09123101634"];
  const isAdminUser =
    currentUser?.is_admin || adminPhones.includes(currentUser?.phone_number);
  const canReplyToComments = !!currentUser;

  const emailIsValid = (val) => {
    const v = (val || "").trim();
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);
  };

  const currentPlatform = getPlatformOption(accountType);
  const currentPlatformLabel = `${currentPlatform.name}${
    currentPlatform.english ? ` (${currentPlatform.english})` : ""
  }`;

  const handleAdd = () => {
    setShowValidation(true);

    const selectedOption = options.find((o) => o.variant_id === selectedVariantId) || options[0];
    const itemPrice = selectedOption.price;
    const itemName = `کروپک فورتنایت - ${selectedOption.duration}`;

    if (!itemPrice || itemPrice <= 0) {
      setFormError("در حال دریافت قیمت هستیم؛ چند لحظه دیگر دوباره تلاش کنید.");
      return;
    }

    if (!accountType) {
      setFormError("پلتفرم را انتخاب کنید.");
      return;
    }

    if (!emailIsValid(accountEmail)) {
      setFormError("ایمیل معتبر وارد کنید.");
      return;
    }

    if (!accountPassword.trim()) {
      setFormError("رمز حساب را وارد کنید.");
      return;
    }

    setFormError("");
    addItem({
      product_id: crewProductId,
      variant_id: selectedOption.variant_id,
      name: itemName,
      price: itemPrice,
      quantity: 1,
      slug: "fortnite-crew-pack",
      image: crewpackPresentation.imageSrc || (crewpackPresentation.imageBase ? `${crewpackPresentation.imageBase}.webp` : "/products/crewpack.webp"),
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
                src={crewpackPresentation.imageSrc}
                base={crewpackPresentation.imageBase}
                alt="کروپک فورتنایت"
                fit="contain"
              />
            </div>

            <div
              className="info-card"
              style={{
                borderRadius: 14,
                padding: 16,
                background: "var(--card)",
                border: "2px solid var(--line)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                marginTop: 14,
              }}
            >
              <div
                style={{
                  fontWeight: 900,
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  marginBottom: 12,
                }}
              >
                <span style={{ color: "var(--text)", fontSize: 15 }}>اطلاعات لازم برای فعال‌سازی</span>
              </div>

              <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7, marginBottom: 12 }}>
                بعد از اضافه‌کردن به سبد خرید، در مرحله پرداخت می‌توانید <strong>فعال‌سازی فوری</strong> را هم فعال کنید (اختیاری).
              </div>

              <div style={{ display: "grid", gap: 12, marginTop: 8 }}>
                <div style={{ display: "grid", gap: 6, fontSize: 13 }}>
                  <span style={{ fontWeight: 700, color: "var(--text)", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                    پلتفرم شما
                    <span className="platform-hint-pulse" aria-hidden="true" />
                  </span>
                  <PlatformSelector
                    value={accountType}
                    onChange={(value) => {
                      setAccountType(value);
                      setFormError("");
                      if (showValidation) setShowValidation(false);
                    }}
                  />
                </div>

                <label style={{ display: "grid", gap: 6, fontSize: 13 }}>
                  <span
                    style={{
                      fontWeight: 700,
                      color: showValidation && !accountEmail.trim() ? "#ef4444" : "var(--text)",
                      fontSize: 13,
                    }}
                  >
                    ایمیل حساب {currentPlatform.name}
                    {currentPlatform.english && <span> ({currentPlatform.english})</span>}
                    {showValidation && !accountEmail.trim() && <span style={{ fontSize: 11 }}>⚠️</span>}
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
                      border: showValidation && !accountEmail.trim() ? "2px solid #ef4444" : "2px solid var(--line)",
                      borderRadius: 10,
                      padding: "12px 14px",
                      background: "var(--card)",
                      color: "var(--text)",
                      fontSize: 14,
                      fontWeight: 500,
                      outline: "none",
                    }}
                  />
                </label>

                <label style={{ display: "grid", gap: 6, fontSize: 13 }}>
                  <span
                    style={{
                      fontWeight: 700,
                      color: showValidation && !accountPassword.trim() ? "#ef4444" : "var(--text)",
                      fontSize: 13,
                    }}
                  >
                    رمز عبور {currentPlatform.name}
                    {currentPlatform.english && <span> ({currentPlatform.english})</span>}
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
                      border: showValidation && !accountPassword.trim() ? "2px solid #ef4444" : "2px solid var(--line)",
                      borderRadius: 10,
                      padding: "12px 44px 12px 14px",
                      background: "var(--card)",
                      color: "var(--text)",
                      fontSize: 14,
                      fontWeight: 500,
                      outline: "none",
                    }}
                  />
                </label>

                {formError && (
                  <div
                    style={{
                      color: "var(--danger)",
                      fontWeight: 800,
                      fontSize: 13,
                      padding: "10px 12px",
                      background: "rgba(239,68,68,0.1)",
                      border: "1px solid rgba(239,68,68,0.3)",
                      borderRadius: 8,
                    }}
                  >
                    ⚠️ {formError}
                  </div>
                )}

                <button
                  type="button"
                  className="btn primary"
                  onClick={handleAdd}
                  style={{
                    width: "100%",
                    padding: "14px 20px",
                    fontSize: "16px",
                    fontWeight: 900,
                    marginTop: 8,
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
                کروپک فورتنایت (Fortnite Crew)
              </h1>
              <div className="muted subtitle-row" style={{ fontSize: 14 }}>اشتراک ماهانه فورتنایت</div>

              {/* Rating Summary */}
	              {reviewStats.total > 0 && (
	                <button
	                  type="button"
	                  className="rating-summary-chip"
	                  onClick={scrollToReviews}
	                  title="مشاهده دیدگاه‌ها"
	                >
	                  <span className="rating-summary-star">★</span>
	                  <span className="rating-summary-score">{reviewStats.rating.toFixed(1)}</span>
	                  <span className="rating-summary-count">
	                    ({reviewStats.total.toLocaleString("fa-IR")} نظر)
	                  </span>
	                  <span className="rating-summary-cta">مشاهده دیدگاه‌ها</span>
	                </button>
	              )}

            </div>

            <div className="price-row" style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
              <div className="price" style={{ fontSize: 24, lineHeight: 1.2, fontWeight: 900 }}>
                {(() => {
                  const selectedOption = options.find((o) => o.variant_id === selectedVariantId) || options[0];
                  return selectedOption.price ? selectedOption.price.toLocaleString("fa-IR") : "...";
                })()} تومان
              </div>
            </div>

            <div className="product-options" style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 8 }}>انتخاب مدت زمان:</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {options.map((option) => {
                  const isActive = selectedVariantId === option.variant_id;
                  return (
                    <button
                      key={option.variant_id}
                      type="button"
                      className={`variant-btn ${isActive ? 'active' : ''}`}
                      onClick={() => setSelectedVariantId(option.variant_id)}
                      style={{
                        padding: "10px 16px",
                        borderRadius: "12px",
                        border: `2px solid ${isActive ? 'var(--primary)' : 'var(--line)'}`,
                        background: isActive ? 'var(--primary-light)' : 'var(--card)',
                        color: isActive ? 'var(--primary-dark)' : 'var(--text)',
                        fontWeight: isActive ? 900 : 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        outline: "none"
                      }}
                    >
                      {option.duration}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="product-highlights" style={{ marginTop: 6 }}>
              <div className="highlight-item">
                <svg className="highlight-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
                <div className="highlight-text">
                  <div className="highlight-title">فعال‌سازی فوری</div>
                  <div className="highlight-desc">
                    {accountType === 'xbox' ? "۱۵ تا ۴۵ دقیقه" : "۱۵ تا ۴۵ دقیقه"}
                  </div>
                </div>
              </div>
              <div className="highlight-item">
                <svg className="highlight-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <div className="highlight-text">
                  <div className="highlight-title">کاملا قانونی</div>
                  <div className="highlight-desc">با کارت‌های فروشگاه</div>
                </div>
              </div>
              <div className="highlight-item">
                <svg className="highlight-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <div className="highlight-text">
                  <div className="highlight-title">پشتیبانی ۲۴/۷</div>
                  <div className="highlight-desc">همیشه در دسترس</div>
                </div>
              </div>
            </div>

            <div className="product-tabs" style={{ marginTop: 12 }}>
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
                {activeTab === 'description' && (
                  <div className="description-box">
                    <div style={{ marginBottom: '12px' }}>
                      <strong>Fortnite Crew</strong> اشتراک ماهانه رسمی فورتنایت برای کامل کردن تجربه بازی شماست.
                    </div>
                    <div style={{ marginBottom: '8px' }}>• هر ماه یک <strong>اسکین جدید</strong> اختصاصی دریافت می‌کنید</div>
                    <div style={{ marginBottom: '8px' }}>• <strong>۸۰۰ V-Bucks</strong> ماهانه به حساب شما اضافه می‌شود</div>
                    <div style={{ marginBottom: '8px' }}>• <strong>بتل‌پس فعال</strong> یا Music/Emote Pack اختصاصی</div>
                    <div style={{ marginBottom: '12px' }}>• پشتیبانی نوبیکس حتی بعد از فعال‌سازی همراهتان است</div>
                    <div style={{ padding: "12px", background: "rgba(59,130,246,0.1)", borderRadius: 10, marginTop: 16 }}>
                      <div style={{ fontWeight: 800, color: "#3b82f6", marginBottom: 6 }}>نکته مهم:</div>
                      <div style={{ fontSize: 13, lineHeight: 1.7 }}>
                        در مرحله پرداخت می‌توانید <strong>فعال‌سازی فوری</strong> را (اختیاری) فعال کنید تا سفارش شما با اولویت سریع و رسیدگی اختصاصی انجام شود.
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'delivery' && (
                  <div className="delivery-info">
                    <div className="delivery-step">
                      <div className="step-number">۱</div>
                      <div>
                        <div className="step-title">وارد کردن اطلاعات حساب</div>
                        <div className="step-desc">پلتفرم، ایمیل و رمز حساب خود را وارد کنید</div>
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
                        <div className="step-title">فعال‌سازی قانونی</div>
                        <div className="step-desc">با کارت‌های فروشگاه خرید انجام و نتیجه به شما اعلام می‌شود</div>
                      </div>
                    </div>
                    <div className="delivery-step">
                      <div className="step-number">۴</div>
                      <div>
                        <div className="step-title">تحویل و پشتیبانی</div>
                        <div className="step-desc">در صورت نیاز، تا تکمیل سفارش همراهتان هستیم</div>
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
            {CREWPACK_FAQ_ITEMS.map((item, index) => {
              const isOpen = openFaqs.includes(index);
              return (
                <div
                  key={item.question}
                  className={`faq-item${isOpen ? " open" : ""}`}
                >
                  <button
                    type="button"
                    className="faq-question"
                    aria-expanded={isOpen}
                    aria-controls={`crewpack-faq-${index}`}
                    onClick={() => toggleFaq(index)}
                  >
                    {item.question}
                  </button>
                  <div
                    id={`crewpack-faq-${index}`}
                    className="faq-answer"
                    aria-hidden={!isOpen}
                  >
                    {item.answer}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <TelegramContact />

        {/* Reviews Section */}
	        <section id="reviews" ref={reviewsSectionRef} className="card section" style={{ marginTop: 16, display: "grid", gap: 16 }}>
          <div className="review-head">
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>
              {totalReviews.toLocaleString("fa-IR")} دیدگاه برای کروپک فورتنایت
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
          <div className="review-list">
            {reviewsLoading ? (
              <div style={{ textAlign: 'center', padding: '16px', color: 'var(--muted)' }}>
                در حال بارگذاری دیدگاه‌ها...
              </div>
            ) : reviews.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '16px', color: 'var(--muted)' }}>
                هنوز نظری ثبت نشده است. اولین نفر باشید!
              </div>
            ) : (
              reviews.map((rev) => (
                <article
                  key={rev.id || `${rev.user}-${rev.date}-${rev.text.slice(0, 10)}`}
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
	                        <div className="review-name-row">
	                          <span className="review-name">{rev.user}</span>
	                          {rev.isVerified && <span className="review-badge">✓ خریدار</span>}
	                          {rev.authorRole === "admin" && (
	                            <span className="review-badge admin" title="ادمین">ادمین</span>
	                          )}
	                          {rev.authorRole === "moderator" && (
	                            <span className="review-badge moderator" title="مدیر">مدیر</span>
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
                      <div className="review-date">{rev.date}</div>
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
                              alert("متن پاسخ نمی‌تواند خالی باشد.");
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
            <h4 className="form-title">نظر خود را بنویسید</h4>
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
                <div className="rating-choice" role="radiogroup" aria-label="امتیاز">
                  {[5, 4, 3, 2, 1].map((r) => (
                    <button
                      type="button"
                      key={r}
                      className={`rating-pill ${reviewRating === r ? "active" : ""}`}
                      onClick={() => setReviewRating(r)}
                      aria-label={`${r} ستاره`}
                      disabled={reviewSubmitting || !currentUser}
                    >
                      {r} ★
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">نظر شما</label>
                <textarea
                  rows={4}
                  className="form-textarea"
                  placeholder="تجربه خود را با ما و دیگران به اشتراک بگذارید..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  required
                  disabled={reviewSubmitting || !currentUser}
                />
              </div>
              <button
                type="submit"
                className="submit-review-btn"
                disabled={reviewSubmitting || !currentUser || reviewText.trim().length < 10}
              >
                {reviewSubmitting ? "در حال ارسال..." : "ثبت نظر"}
              </button>
            </form>
          </div>
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
        /* Activation Options */
        .activation-options {
          display: grid;
          gap: 0;
        }
        .option-card {
          border: 2px solid var(--line);
          border-radius: 14px;
          padding: 16px;
          background: var(--card);
          transition: all 0.3s ease;
          position: relative;
        }
        .option-card.epic-option {
          padding-top: 64px;
        }
        .option-card:hover:not(.disabled) {
          border-color: var(--primary);
        }
        .option-card.selected {
          border-color: var(--primary);
          background: linear-gradient(135deg, rgba(44,75,255,0.08), rgba(44,75,255,0.02));
          box-shadow: 0 4px 20px rgba(44,75,255,0.15);
        }
        .option-card.disabled {
          opacity: 0.6;
          background: var(--hover);
        }
        .option-header {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .option-radio {
          width: 22px;
          height: 22px;
          border: 2px solid var(--line);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .radio-inner {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: transparent;
          transition: all 0.2s ease;
        }
        .radio-inner.active {
          background: var(--primary);
        }
        .option-info {
          flex: 1;
        }
        .option-title {
          font-weight: 800;
          font-size: 15px;
          color: var(--text);
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .option-time {
          font-size: 13px;
          color: var(--muted);
          margin-top: 4px;
        }
        .option-capacity {
          font-size: 12px;
          color: #f59e0b;
          font-weight: 800;
        }
        .option-price {
          font-weight: 900;
          font-size: 16px;
          color: var(--primary);
          white-space: nowrap;
        }
        .option-form {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid var(--line);
        }
        .fast-badge {
          padding: 3px 10px;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: white;
          font-size: 11px;
          font-weight: 800;
          border-radius: 999px;
        }
        .sold-out-badge {
          padding: 3px 10px;
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: white;
          font-size: 11px;
          font-weight: 800;
          border-radius: 999px;
        }
        .available-badge {
          padding: 3px 10px;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
          font-size: 11px;
          font-weight: 800;
          border-radius: 999px;
        }

        /* Instant activation special effects */
        .epic-option {
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, rgba(34,197,94,0.06), rgba(22,163,74,0.02));
          border: 2px solid rgba(34,197,94,0.3);
        }
        .epic-option:not(.disabled):hover {
          border-color: rgba(34,197,94,0.6);
          box-shadow: 0 0 20px rgba(34,197,94,0.2);
        }
        .epic-option.selected {
          border-color: #22c55e;
          background: linear-gradient(135deg, rgba(34,197,94,0.12), rgba(22,163,74,0.05));
          box-shadow: 0 4px 25px rgba(34,197,94,0.25), 0 0 0 1px rgba(34,197,94,0.1);
        }
        .epic-shimmer {
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(34,197,94,0.08),
            rgba(34,197,94,0.15),
            rgba(34,197,94,0.08),
            transparent
          );
          animation: epicShimmer 3s infinite;
          pointer-events: none;
          z-index: 0;
        }
        .epic-recommended {
          position: absolute;
          top: 10px;
          right: 12px;
          background: linear-gradient(135deg, #ff8f1f, #ff5a1f);
          color: #fff;
          font-size: 11px;
          font-weight: 800;
          padding: 8px 14px;
          border-radius: 999px;
          box-shadow: 0 10px 24px rgba(255, 90, 31, 0.32), 0 0 0 1px rgba(255, 255, 255, 0.08);
          z-index: 2;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          letter-spacing: 0.1px;
          overflow: hidden;
          isolation: isolate;
          animation: epicFlash 2.1s ease-in-out infinite;
        }
        .epic-recommended::before {
          content: "";
          position: absolute;
          inset: -22%;
          background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.35), transparent 62%);
          opacity: 0.9;
          filter: blur(12px);
          z-index: -1;
          animation: epicFlame 1.9s ease-in-out infinite;
        }
        .epic-recommended::after {
          content: "";
          position: absolute;
          inset: -18% -20%;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.18), transparent 65%);
          z-index: -1;
          animation: epicFlame 2.8s ease-in-out infinite reverse;
        }
        .epic-option .option-header,
        .epic-option .option-form {
          position: relative;
          z-index: 1;
        }
        .epic-title-text {
          color: var(--text);
          background: none;
          -webkit-text-fill-color: initial;
          position: relative;
          padding-inline-end: 4px;
        }
        .epic-option .fast-badge {
          animation: fastBadgePop 2s ease-in-out infinite;
        }
        .epic-option .option-price {
          color: #16a34a;
          font-weight: 900;
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
        }
        .tab-btn.active {
          background: var(--card);
          color: var(--primary);
          font-weight: 900;
        }
        .tab-content {
          padding: 20px;
          background: var(--card);
          min-height: 200px;
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
          width: 100%;
          border: none;
          background: transparent;
          padding: 16px 18px;
          font-weight: 800;
          font-size: 14px;
          cursor: pointer;
          user-select: none;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: background 0.2s ease;
        }
        .faq-question:focus-visible {
          outline: 2px solid var(--primary);
          outline-offset: 2px;
        }
        .faq-question::after {
          content: '+';
          font-size: 24px;
          font-weight: 300;
          color: var(--primary);
          transition: transform 0.3s ease;
        }
        .faq-item.open .faq-question::after {
          transform: rotate(45deg);
        }
        .faq-question:hover {
          background: var(--hover);
        }
        .faq-answer {
          max-height: 0;
          padding: 0 18px;
          overflow: hidden;
          font-size: 13px;
          line-height: 1.8;
          color: var(--text);
          opacity: 0;
          transition: max-height 0.3s ease, padding 0.3s ease, opacity 0.3s ease;
        }
        .faq-item.open .faq-answer {
          max-height: 999px;
          padding: 8px 18px 16px;
          opacity: 1;
          animation: fadeIn 0.3s ease;
        }

        /* Dark mode */
        :global(:root[data-theme="dark"]) .tab-buttons {
          background: var(--surface);
        }
        :global(:root[data-theme="dark"]) .product-highlights {
          background: linear-gradient(135deg, rgba(0,213,255,0.12), rgba(108,92,231,0.1));
          border-color: rgba(255,255,255,0.06);
        }

        /* Reviews */
        .review-head {
          display: grid;
          gap: 12px;
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
        .review-top {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          gap: 10px;
          flex-direction: row-reverse;
        }
        .crew-meta-summary {
          margin-top: 8px;
          padding: 8px 10px;
          border-radius: 10px;
          background: rgba(15,23,42,0.6);
          border: 1px solid rgba(148,163,184,0.5);
          font-size: 12px;
          color: var(--muted);
          display: grid;
          gap: 4px;
          text-align: right;
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
        .review-name-row {
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
          direction: ltr;
          unicode-bidi: plaintext;
        }
        .review-date { font-size: 12px; color: var(--muted); font-weight: 700; }
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
          margin-top: 6px;
          padding: 10px 12px;
          border-radius: 10px;
          background: linear-gradient(135deg, rgba(59,130,246,0.14), rgba(59,130,246,0.04));
          border: 1px solid rgba(59,130,246,0.2);
        }
        .reply-meta {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: var(--muted);
          margin-bottom: 4px;
        }
        .reply-author { font-weight: 800; color: var(--text); }
        .reply-text { margin: 0; font-size: 13px; line-height: 1.6; color: var(--text); }
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
	        .platform-hint-pulse {
	          width: 8px;
	          height: 8px;
	          border-radius: 999px;
	          background: #f59e0b;
	          box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7);
	          animation: platformPulse 1.6s infinite;
	          flex: 0 0 auto;
	        }
	        @keyframes platformPulse {
	          0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.75); transform: scale(1); }
	          70% { box-shadow: 0 0 0 8px rgba(245, 158, 11, 0); transform: scale(1.05); }
	          100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); transform: scale(1); }
	        }

	        @media (max-width: 768px) {
	          .product-hero {
	            grid-template-columns: minmax(0, 1fr);
	          }
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
        .review-form textarea {
          border: 1px solid var(--line);
          border-radius: 10px;
          padding: 10px 12px;
          background: var(--card);
          font-family: inherit;
          color: var(--text);
        }
        .review-form textarea { resize: vertical; min-height: 90px; }
        .review-form .form-actions {
          display: flex;
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
	        }

	        /* Modern Review Form */
	        .review-form-container {
	          padding: 20px;
	          background: var(--card);
	          border-radius: 16px;
	          border: 1px solid var(--line);
	          display: grid;
	          gap: 14px;
	        }
	        .form-title {
	          margin: 0;
	          font-size: 16px;
	          font-weight: 900;
	          color: var(--text);
	        }
	        .review-form-modern {
	          display: grid;
	          gap: 14px;
	        }
	        .form-group {
	          display: grid;
	          gap: 8px;
	        }
	        .form-label {
	          font-size: 13px;
	          font-weight: 800;
	          color: var(--text);
	        }
	        .form-input,
	        .form-textarea {
	          width: 100%;
	          border: 2px solid var(--line);
	          border-radius: 12px;
	          padding: 12px 14px;
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
	          min-height: 110px;
	          line-height: 1.6;
	        }
	        .submit-review-btn {
	          border: none;
	          border-radius: 12px;
	          padding: 12px 16px;
	          font-size: 15px;
	          font-weight: 900;
	          cursor: pointer;
	          background: linear-gradient(120deg, var(--primary), #22c55e);
	          color: #fff;
	          box-shadow: 0 10px 20px rgba(0,0,0,0.12);
	          transition: transform 0.18s ease, box-shadow 0.18s ease;
	        }
	        .submit-review-btn:disabled {
	          opacity: 0.6;
	          cursor: not-allowed;
	          transform: none;
	          box-shadow: none;
	        }
	        .submit-review-btn:hover:not(:disabled) {
	          transform: translateY(-1px);
	          box-shadow: 0 14px 26px rgba(0,0,0,0.16);
	        }
	        .form-login-hint {
	          display: flex;
	          align-items: center;
	          justify-content: space-between;
	          gap: 10px;
	          padding: 10px 12px;
	          border-radius: 10px;
	          background: rgba(245, 158, 11, 0.08);
	          border: 1px dashed rgba(245, 158, 11, 0.5);
	          font-size: 13px;
	          font-weight: 700;
	          color: var(--text);
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
          .price-row { order: 2; }
          .product-options { order: 3; margin-top: 0 !important; }
          .info-card { order: 4; margin-top: 0 !important; }
          .product-highlights { order: 5; margin-top: 0 !important; }
          .product-tabs { order: 6; margin-top: 0 !important; }
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
          .product-hero {
            padding: 12px;
            gap: 12px;
          }
          .option-header {
            flex-wrap: wrap;
            gap: 10px;
          }
          .option-price {
            width: 100%;
            text-align: left;
            margin-top: 8px;
          }
        }
      `}</style>
    </div>
  );
}
