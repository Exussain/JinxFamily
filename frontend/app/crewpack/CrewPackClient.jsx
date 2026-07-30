"use client";
import { Suspense, useCallback, useEffect, useState, useMemo } from "react";
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
import RelatedProducts from "../../components/RelatedProducts";
import ReviewSection from "../../components/ReviewSection";

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

function crewpackDurationMonths(duration) {
  const value = String(duration || "").replace(/\s+/g, " ");
  if (value.includes("۱ سال") || value.includes("یکساله") || value.includes("یک ساله") || value.includes("12")) return 12;
  if (value.includes("۳") || value.includes("3") || value.includes("سه ماه")) return 3;
  if (value.includes("۲") || value.includes("2") || value.includes("دو ماه")) return 2;
  return 1;
}

export default function CrewPackClient({ initialProduct, initialStats, initialProducts = [] }) {
  const router = useRouter();
  const { addItem } = useCart();
  const [accountEmail, setAccountEmail] = useState("");
  const [accountPassword, setAccountPassword] = useState("");
  const [accountType, setAccountType] = useState("epic");
  const [formError, setFormError] = useState("");
  const [showValidation, setShowValidation] = useState(false);
  // Seeded from the server so the rating chip is in the SSR HTML instead of
  // popping in after the client comments fetch (CLS).
  const [reviewStats, setReviewStats] = useState(() =>
    initialStats
      ? {
          total: Number(initialStats.total) || 0,
          rating: Number(initialStats.average_rating) || 0,
        }
      : { total: 0, rating: 0 }
  );
  const [activeTab, setActiveTab] = useState("description");
  const [openFaqs, setOpenFaqs] = useState(() => []);
  const toggleFaq = useCallback((index) => {
    setOpenFaqs((prev) =>
      prev.includes(index) ? prev.filter((id) => id !== index) : [...prev, index]
    );
  }, []);

  const scrollToReviews = useCallback(() => {
    if (typeof document === "undefined") return;
    document.getElementById("reviews")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const [crewProduct, setCrewProduct] = useState(initialProduct || null);
  const [products] = useState(initialProducts);
  const crewpackPresentation = useMemo(() => buildCrewpackPresentation(crewProduct), [crewProduct]);
  const [crewProductId, setCrewProductId] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState(crewpackPresentation.selectedVariantId);
  const options = crewpackPresentation.options;
  const selectedOption = options.find((option) => option.variant_id === selectedVariantId) || options[0];
  const monthlyOption = options.find((option) => crewpackDurationMonths(option.duration) === 1) || options[0];
  const selectedMonths = crewpackDurationMonths(selectedOption?.duration);
  const monthlyReference = Number(monthlyOption?.price) || 0;
  const selectedSavings = Math.max(0, monthlyReference * selectedMonths - (Number(selectedOption?.price) || 0));
  const selectedDiscountPercent = monthlyReference && selectedMonths
    ? Math.round((selectedSavings / (monthlyReference * selectedMonths)) * 100)
    : 0;

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
      <main className="container" style={{ padding: "24px 0 40px" }}>
        <section className="card section product-hero">
          <div className="image-stack">
            {/* Main Image */}
            <div
              className="hero-image"
              style={{
                position: "relative",
                aspectRatio: crewProduct?.cover_16_9 ? "16/9" : "1/1",
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
                eager
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
                {selectedOption?.price ? selectedOption.price.toLocaleString("fa-IR") : "..."} تومان
              </div>
              {selectedDiscountPercent > 0 && (
                <>
                  <del style={{ color: "var(--muted)", fontSize: 13, fontWeight: 700 }}>
                    {(monthlyReference * selectedMonths).toLocaleString("fa-IR")} تومان
                  </del>
                  <span style={{ color: "#047857", background: "#d1fae5", borderRadius: 999, padding: "3px 8px", fontWeight: 900, fontSize: 12 }}>
                    🔥 {selectedDiscountPercent.toLocaleString("fa-IR")}٪ تخفیف ویژه
                  </span>
                </>
              )}
            </div>

            <div className="product-options" style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 8 }}>انتخاب مدت زمان و آفر حجمی:</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {options.map((option) => {
                  const isActive = selectedVariantId === option.variant_id;
                  const months = crewpackDurationMonths(option.duration);
                  const saving = Math.max(0, monthlyReference * months - (Number(option.price) || 0));
                  const discountPercent = monthlyReference && months
                    ? Math.round((saving / (monthlyReference * months)) * 100)
                    : 0;
                  const isBestValue = saving > 0 && saving === Math.max(
                    ...options.map((item) => {
                      const itemMonths = crewpackDurationMonths(item.duration);
                      return Math.max(0, monthlyReference * itemMonths - (Number(item.price) || 0));
                    })
                  );
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
                      <span>{option.duration}</span>
                      {discountPercent > 0 && (
                        <span style={{ display: "block", marginTop: 3, fontSize: 10, color: isActive ? "#047857" : "#059669" }}>
                          🔥 {discountPercent.toLocaleString("fa-IR")}٪ تخفیف ویژه
                        </span>
                      )}
                      {isBestValue && (
                        <span style={{ display: "block", marginTop: 2, fontSize: 10, color: "#b45309" }}>بیشترین تخفیف</span>
                      )}
                    </button>
                  );
                })}
              </div>
              <div
                style={{
                  marginTop: 12,
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: "linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(16, 185, 129, 0.10))",
                  border: "1px solid rgba(245, 158, 11, 0.28)",
                  color: "var(--text)",
                  fontSize: 12,
                  fontWeight: 700,
                  lineHeight: 1.8,
                }}
              >
                ⚡ آفر پلنی فعال است: با انتخاب مدت بیشتر، هزینه هر ماه کمتر می‌شود.
                {selectedSavings > 0 && <> این پلن {selectedSavings.toLocaleString("fa-IR")} تومان نسبت به خرید ماه‌به‌ماه برایتان ذخیره می‌کند.</>}
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
        <RelatedProducts currentProduct={crewProduct} products={products} />

        {/* Reviews Section */}
        <ReviewSection
          slug="fortnite-crew-pack"
          initialStats={initialStats}
          productTitle="کروپک فورتنایت (Fortnite Crew)"
        />
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

        /* ── Mobile/tablet: stack hero and reorder sections ─────────── */
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
          .product-options { order: 3; }
          .info-card { order: 4; }
          .product-highlights { order: 5; }
          .product-tabs { order: 6; }
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
        }

        /* ── Small mobile: tighter spacing and smaller text ─────────── */
        @media (max-width: 640px) {
          .product-hero {
            padding: 12px;
            gap: 12px;
          }
          .image-stack {
            gap: 10px;
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
          .delivery-step {
            gap: 12px;
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
        }
      `}</style>
    </div>
  );
}
