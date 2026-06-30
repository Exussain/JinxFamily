"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import TelegramContact from "../../components/TelegramContact";
import Gta6Reviews from "./Gta6Reviews";
import { useCart } from "../../lib/useCart";
import {
  EDITIONS,
  PLATFORMS,
  CAPACITIES,
  PRICING,
  XBOX_ENABLED,
  INSTANT_ENABLED,
  INSTANT_FEE,
  GAME_INTRO,
  CAPACITY_OVERVIEW,
  ACTIVATION,
} from "../../lib/gta6Data";

const faNum = (n) => Number(n || 0).toLocaleString("fa-IR");

const RISK_LABEL = {
  high: { fa: "ریسک بالاتر", color: "#f97316" },
  medium: { fa: "ریسک متوسط", color: "#eab308" },
  low: { fa: "کم‌ریسک", color: "#22c55e" },
  lowest: { fa: "کمترین ریسک", color: "#10b981" },
};

export default function Gta6Client() {
  const router = useRouter();
  const [editionKey, setEditionKey] = useState("standard");
  const [platformKey, setPlatformKey] = useState("ps5");
  const [capacityKey, setCapacityKey] = useState("cap2");

  // Pricing + variant mapping + Xbox toggle come from the admin-editable backend
  // config; fall back to the static values in gta6Data.js until the fetch lands.
  const [pricing, setPricing] = useState(PRICING);
  const [xboxEnabled, setXboxEnabled] = useState(XBOX_ENABLED);
  const [productId, setProductId] = useState(null);
  const [instantEnabled, setInstantEnabled] = useState(INSTANT_ENABLED);
  const [instantFee, setInstantFee] = useState(INSTANT_FEE);
  const [instantProductId, setInstantProductId] = useState(null);
  const [instant, setInstant] = useState(false); // buyer's choice

  const [openFaqs, setOpenFaqs] = useState(() => []);
  const toggleFaq = useCallback((index) => {
    setOpenFaqs((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  }, []);

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "";
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${apiBase}/api/gta6/config`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled || !data || typeof data !== "object") return;
        if (data.pricing && typeof data.pricing === "object") setPricing(data.pricing);
        if (typeof data.xbox_enabled === "boolean") setXboxEnabled(data.xbox_enabled);
        if (data.product_id) setProductId(data.product_id);
        if (typeof data.instant_enabled === "boolean") setInstantEnabled(data.instant_enabled);
        if (typeof data.instant_fee === "number") setInstantFee(data.instant_fee);
        if (data.instant_product_id) setInstantProductId(data.instant_product_id);
      } catch {
        /* keep static fallback */
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Reset the instant choice if the admin turns the feature off.
  useEffect(() => { if (!instantEnabled && instant) setInstant(false); }, [instantEnabled, instant]);

  // Force PS5 whenever Xbox is disabled so a stale selection can't slip through.
  useEffect(() => {
    if (!xboxEnabled && platformKey !== "ps5") setPlatformKey("ps5");
  }, [xboxEnabled, platformKey]);

  // Capacities are platform-specific (PS5: cap2/cap3 · Xbox: home/switch/full).
  const platformCaps = CAPACITIES.filter((c) => c.platform === platformKey);

  // Whenever the platform changes, snap the capacity to a valid one for it.
  useEffect(() => {
    if (!platformCaps.some((c) => c.key === capacityKey)) {
      const next = platformCaps.find((c) => c.recommended) || platformCaps[0];
      if (next) setCapacityKey(next.key);
    }
  }, [platformKey, capacityKey, platformCaps]);

  const edition = EDITIONS.find((e) => e.key === editionKey);
  const platform = PLATFORMS.find((p) => p.key === platformKey);
  const capacity = CAPACITIES.find((c) => c.key === capacityKey) || platformCaps[0];

  // Xbox uses Home/Switch/Full naming, so we drop the "ظرفیت" wording in that mode.
  const isXbox = platformKey === "xbox";
  const capLabel = isXbox ? "نوع اکانت" : "ظرفیت اکانت";
  const capHelp = isXbox ? "نوع اکانت چیست؟" : "ظرفیت چیست؟";

  const cover = platform.images[editionKey];
  const price = pricing[editionKey]?.[capacityKey] || { toman: 0, originalToman: 0, lira: 0 };
  const variantId = price.variant_id ?? null;
  const hasPrice = Number(price.toman) > 0;
  const hasDiscount = hasPrice && Number(price.originalToman) > Number(price.toman);

  const faqItems = [
    {
      q: "مراحل کلی فعال‌سازی",
      type: "intro",
      content: ACTIVATION.intro,
    },
    ...platformCaps.map((c) => ({
      q: `راهنمای فعال‌سازی ${c.fa}`,
      type: "steps",
      steps: ACTIVATION.steps[c.key] || [],
    })),
    {
      q: isXbox ? "نکات مهم و ایمنی" : "نکات مهم و ایمنی برای همه ظرفیت‌ها",
      type: "safety",
      steps: ACTIVATION.safety[platformKey] || [],
    },
  ];
  const canBuy = hasPrice && !!productId && !!variantId;
  const showInstant = instantEnabled && Number(instantFee) > 0;
  const instantOn = showInstant && instant;
  const totalToman = Number(price.toman) + (instantOn ? Number(instantFee) : 0);

  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const handlePrimary = () => {
    if (!canBuy) return;
    addItem({
      product_id: productId,
      variant_id: variantId,
      name: `${edition.fa} - ${capacity.fa} - ${platform.short}`,
      price: Number(price.toman),
      quantity: 1,
      slug: "gta6",
      image: cover,
      category: "games",
    });
    if (instantOn && instantProductId) {
      addItem({
        product_id: instantProductId,
        name: "فعال‌سازی فوری GTA VI",
        price: Number(instantFee),
        quantity: 1,
        slug: "gta6-instant",
        image: cover,
        category: "games",
      });
    }
    setAdded(true);
    if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("cart:add"));
    setTimeout(() => router.push("/checkout"), 350);
  };

  // Target date for GTA VI release: 2026-11-19T00:00:00Z (around 142 days from 2026-06-30)
  const targetDate = useMemo(() => new Date("2026-11-19T00:00:00Z").getTime(), []);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    };

    updateTimer();
    const intervalId = setInterval(updateTimer, 1000);
    return () => clearInterval(intervalId);
  }, [targetDate]);

  return (
    <div className="gta-root">
      <Navbar />

      {/* ───────────────────────── HERO ───────────────────────── */}
      <main className="container gta-shell">
        <section className="gta-hero card">
          <div className="gta-hero-bg" aria-hidden="true" />
          <div className="gta-hero-grid">
            {/* Cover */}
            <div className="gta-cover-wrap">
              <span className="gta-preorder-flag">پیش‌خرید رسمی</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="gta-cover" src={cover} alt={`GTA VI ${edition.fa} ${platform.fa}`} draggable="false" />
              <div className="gta-cover-glow" aria-hidden="true" />
            </div>

            {/* Buy panel */}
            <div className="gta-buy">
              <div className="gta-kicker">
                <span className="gta-live-dot" /> Grand Theft Auto VI · Rockstar Games
              </div>
              <h1 className="gta-title">
                <span className="gta-title-vi">GTA VI</span>
                <span className="gta-title-sub">پیش‌خرید نسخه دیجیتال وایس سیتی</span>
              </h1>

              {/* Edition tabs (sketch: استاندارد | التیمیت) */}
              <div className="gta-edition-tabs" role="tablist" aria-label="انتخاب نسخه">
                {EDITIONS.map((e) => (
                  <button
                    key={e.key}
                    role="tab"
                    aria-selected={editionKey === e.key}
                    className={`gta-tab ${editionKey === e.key ? "active" : ""}`}
                    style={{ "--accent": e.accent }}
                    onClick={() => setEditionKey(e.key)}
                  >
                    <span className="gta-tab-fa">{e.fa}</span>
                    <span className="gta-tab-en">{e.en} · ${e.usd}</span>
                  </button>
                ))}
              </div>

              {/* Platform */}
              <div className="gta-field">
                <div className="gta-field-label">پلتفرم</div>
                <div className="gta-pills">
                  {PLATFORMS.map((p) => {
                    const disabled = p.key === "xbox" && !xboxEnabled;
                    return (
                      <button
                        key={p.key}
                        className={`gta-pill ${platformKey === p.key ? "active" : ""} ${disabled ? "disabled" : ""}`}
                        style={{ "--accent": p.accent }}
                        onClick={() => !disabled && setPlatformKey(p.key)}
                        disabled={disabled}
                        aria-disabled={disabled}
                      >
                        {p.fa}
                        {disabled && <span className="gta-pill-soon">به‌زودی</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Capacity */}
              <div className="gta-field">
                <div className="gta-field-label">
                  {capLabel}
                  <a href="#capacity" className="gta-field-help">{capHelp}</a>
                </div>
                <div className="gta-cap-grid" style={{ gridTemplateColumns: `repeat(${platformCaps.length}, 1fr)` }}>
                  {platformCaps.map((c) => (
                    <button
                      key={c.key}
                      className={`gta-cap ${capacityKey === c.key ? "active" : ""} ${c.recommended ? "rec" : ""}`}
                      onClick={() => setCapacityKey(c.key)}
                    >
                      {c.recommended && <span className="gta-cap-rec">پیشنهادی</span>}
                      <span className="gta-cap-fa">{c.fa}</span>
                      <span className="gta-cap-short">{c.short}</span>
                    </button>
                  ))}
                </div>
                <p className="gta-cap-summary">{capacity?.summary}</p>
              </div>

              {/* Instant activation (فعال‌سازی فوری) */}
              {showInstant && (
                <button
                  type="button"
                  className={`gta-instant ${instant ? "on" : ""}`}
                  onClick={() => setInstant((v) => !v)}
                  aria-pressed={instant}
                >
                  <span className="gta-instant-check" aria-hidden="true">{instant ? "✓" : ""}</span>
                  <span className="gta-instant-body">
                    <span className="gta-instant-title">⚡ فعال‌سازی فوری</span>
                    <span className="gta-instant-desc">اولویت در صف و فعال‌سازی در سریع‌ترین زمان ممکن</span>
                  </span>
                  <span className="gta-instant-fee">+{faNum(instantFee)} تومان</span>
                </button>
              )}

              {/* Price + CTA */}
              <div className="gta-price-row">
                <div className="gta-price-block">
                  {hasPrice ? (
                    <>
                      {hasDiscount && <s className="gta-price-old">{faNum(price.originalToman)} تومان</s>}
                      <div className="gta-price">{faNum(totalToman)} <small>تومان</small></div>
                      {Number(price.lira) > 0 && <div className="gta-price-lira">{faNum(price.lira)} <small>₺</small></div>}
                      {instantOn && <div className="gta-price-usd">شامل فعال‌سازی فوری (+{faNum(instantFee)})</div>}
                    </>
                  ) : (
                    <div className="gta-price-ask">به‌زودی</div>
                  )}
                </div>
                <button
                  className="gta-cta"
                  onClick={handlePrimary}
                  disabled={!canBuy}
                  style={{ "--accent": edition.accent }}
                >
                  {added ? "✓ به سبد اضافه شد…" : "خرید"}
                </button>
              </div>

              <div className="gta-assure">
                <span>🔒 فعال‌سازی قانونی</span>
                <span>⚡ راهنمای فعال‌سازی پس از خرید</span>
                <span>🛟 پشتیبانی و گارانتی فروشگاه</span>
              </div>
            </div>
          </div>
        </section>

        {/* ───────────────────────── COUNTDOWN ───────────────────────── */}
        <section className="gta-countdown-section card">
          <div className="gta-countdown-inner">
            <h2 className="gta-countdown-title">زمان باقی‌مانده تا انتشار جهانی</h2>
            <div className="gta-countdown-grid">
              <div className="gta-countdown-box">
                <span className="gta-countdown-num">{timeLeft.days}</span>
                <span className="gta-countdown-label">روز</span>
              </div>
              <div className="gta-countdown-sep">:</div>
              <div className="gta-countdown-box">
                <span className="gta-countdown-num">{String(timeLeft.hours).padStart(2, '0')}</span>
                <span className="gta-countdown-label">ساعت</span>
              </div>
              <div className="gta-countdown-sep">:</div>
              <div className="gta-countdown-box">
                <span className="gta-countdown-num">{String(timeLeft.minutes).padStart(2, '0')}</span>
                <span className="gta-countdown-label">دقیقه</span>
              </div>
              <div className="gta-countdown-sep">:</div>
              <div className="gta-countdown-box">
                <span className="gta-countdown-num">{String(timeLeft.seconds).padStart(2, '0')}</span>
                <span className="gta-countdown-label">ثانیه</span>
              </div>
            </div>
            <p className="gta-countdown-desc">پیش‌خرید کنید تا به محض انتشار بازی، اکانت تحویل شما گردد.</p>
          </div>
        </section>

        {/* ───────────────────────── INTRO ───────────────────────── */}
        <section className="card gta-section">
          <div className="gta-sec-head">
            <span className="gta-sec-num">۰۱</span>
            <h2>معرفی بازی</h2>
          </div>
          {GAME_INTRO.paragraphs.map((p, i) => (
            <p key={i} className="gta-p">{p}</p>
          ))}
          <div className="gta-intro-highlights">
            {GAME_INTRO.highlights.map((h, i) => (
              <div key={i} className="gta-hl">
                <span className="gta-hl-icon">{h.icon}</span>
                <span>{h.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ───────────────────────── EDITION DETAILS ───────────────────────── */}
        <section className="card gta-section">
          <div className="gta-sec-head">
            <span className="gta-sec-num">۰۲</span>
            <h2>جزئیات نسخه</h2>
            <div className="gta-mini-tabs">
              {EDITIONS.map((e) => (
                <button
                  key={e.key}
                  className={`gta-mini-tab ${editionKey === e.key ? "active" : ""}`}
                  style={{ "--accent": e.accent }}
                  onClick={() => setEditionKey(e.key)}
                >
                  {e.fa}
                </button>
              ))}
            </div>
          </div>

          <div className="gta-edition-card" style={{ "--accent": edition.accent }}>
            <div className="gta-edition-top">
              <div>
                <div className="gta-edition-name">{edition.fa}</div>
                <div className="gta-edition-tag">{edition.tagline}</div>
              </div>
              <div className="gta-edition-usd">${edition.usd}</div>
            </div>

            <div className="gta-edition-cols">
              <div>
                <div className="gta-col-title">این نسخه شامل:</div>
                <ul className="gta-list">
                  {edition.bullets.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="gta-col-title">مزایا:</div>
                <ul className="gta-list check">
                  {edition.perks.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>
            </div>
            {edition.note && <div className="gta-edition-note">💡 {edition.note}</div>}
          </div>
        </section>

        {/* ───────────────────────── CAPACITY ───────────────────────── */}
        <section id="capacity" className="card gta-section">
          <div className="gta-sec-head">
            <span className="gta-sec-num">۰۳</span>
            <h2>{capHelp}</h2>
          </div>
          <p className="gta-p gta-overview">{CAPACITY_OVERVIEW}</p>
          <div className="gta-cap-cards">
            {platformCaps.map((c) => {
              const risk = RISK_LABEL[c.risk] || RISK_LABEL.low;
              return (
                <div
                  key={c.key}
                  className={`gta-cap-card ${c.recommended ? "rec" : ""}`}
                >
                  <div className="gta-cap-card-head">
                    <span className="gta-cap-card-fa">{c.fa}</span>
                    <span className="gta-cap-badge">{c.badge}</span>
                  </div>
                  <div className="gta-cap-tags">
                    <span className={`gta-tag ${c.online ? "on" : "off"}`}>{c.online ? "آنلاین + آفلاین" : "فقط آفلاین"}</span>
                    <span className="gta-tag" style={{ color: risk.color, borderColor: risk.color }}>{risk.fa}</span>
                  </div>
                  <p className="gta-cap-card-text">{c.details}</p>
                  {c.recommended && <span className="gta-cap-card-rec">پیشنهاد فروشگاه</span>}
                </div>
              );
            })}
          </div>
        </section>

        {/* ───────────────────────── ACTIVATION / FAQ ───────────────────────── */}
        <section id="activation" className="card gta-section">
          <div className="gta-sec-head">
            <span className="gta-sec-num">۰۴</span>
            <h2>سوالات متداول و فعال‌سازی</h2>
          </div>
          <p className="gta-p gta-overview">در این بخش می‌توانید راهنمای نصب و فعال‌سازی مربوط به پلتفرم انتخابی خود را مشاهده نمایید.</p>
          <div className="gta-faq-list">
            {faqItems.map((item, index) => {
              const isOpen = openFaqs.includes(index);
              return (
                <div key={index} className={`gta-faq-item ${isOpen ? "open" : ""}`} style={{ "--accent": edition.accent }}>
                  <button
                    className="gta-faq-q"
                    onClick={() => toggleFaq(index)}
                    aria-expanded={isOpen}
                  >
                    <span>{item.q}</span>
                    <span className="gta-faq-icon">▼</span>
                  </button>
                  {isOpen && (
                    <div className="gta-faq-a">
                      {item.type === "intro" && <p>{item.content}</p>}
                      {item.type === "steps" && (
                        <ol className="gta-steps">
                          {item.steps.map((s, i) => (
                            <li key={i} className="gta-step">
                              <span className="gta-step-n">{faNum(i + 1)}</span>
                              <span className="gta-step-t">{s}</span>
                            </li>
                          ))}
                        </ol>
                      )}
                      {item.type === "safety" && (
                        <ul className="gta-list warn">
                          {item.steps.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Reviews / comments */}
        <Gta6Reviews slug="gta6" />

        {/* sticky mobile buy bar */}
        <div className="gta-sticky">
          <div className="gta-sticky-info">
            <span className="gta-sticky-edition">{edition.fa} · {capacity.fa}</span>
            <span className="gta-sticky-price">
              {hasPrice ? `${faNum(totalToman)} تومان` : "به‌زودی"}
              {Number(price.lira) > 0 && <span className="gta-sticky-lira"> — {faNum(price.lira)} ₺</span>}
            </span>
          </div>
          <button className="gta-cta sm" onClick={handlePrimary} disabled={!canBuy} style={{ "--accent": edition.accent }}>
            خرید
          </button>
        </div>

        <TelegramContact />
      </main>

      <style jsx>{`
        .gta-root { --pink: #ff2d9b; --purple: #7c4dff; --teal: #19c37d; --cyan: #21d4fd; }
        .gta-shell { padding: 20px 0 120px; display: grid; gap: 18px; }

        /* HERO */
        .gta-hero { position: relative; overflow: hidden; padding: 0; border: 1px solid rgba(124,77,255,0.35); }
        .gta-hero-bg {
          position: absolute; inset: 0; pointer-events: none;
          background:
            radial-gradient(circle at 12% 8%, rgba(255,45,155,0.30), transparent 42%),
            radial-gradient(circle at 88% 18%, rgba(33,212,253,0.22), transparent 45%),
            radial-gradient(circle at 70% 95%, rgba(124,77,255,0.30), transparent 50%),
            linear-gradient(135deg, #160a2e 0%, #0a0a1f 55%, #061018 100%);
        }
        .gta-hero-grid {
          position: relative; z-index: 1; display: grid;
          grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr);
          gap: 28px; padding: 26px; align-items: center;
        }
        .gta-cover-wrap { position: relative; border-radius: 18px; }
        .gta-cover {
          width: 100%; height: auto; display: block; border-radius: 18px;
          box-shadow: 0 24px 60px rgba(0,0,0,0.55); border: 1px solid rgba(255,255,255,0.10);
          position: relative; z-index: 1;
        }
        .gta-cover-glow {
          position: absolute; inset: -14px; border-radius: 24px; z-index: 0;
          background: conic-gradient(from 90deg, var(--pink), var(--cyan), var(--purple), var(--pink));
          filter: blur(26px); opacity: 0.55;
        }
        .gta-preorder-flag {
          position: absolute; top: 12px; left: 12px; z-index: 2;
          background: linear-gradient(135deg, var(--pink), var(--purple));
          color: #fff; font-weight: 900; font-size: 12px; padding: 6px 12px; border-radius: 999px;
          box-shadow: 0 8px 20px rgba(255,45,155,0.4);
        }

        .gta-buy { display: grid; gap: 16px; }
        .gta-kicker {
          display: inline-flex; align-items: center; gap: 8px; font-size: 12.5px; font-weight: 800;
          color: #c9b8ff; letter-spacing: 0.3px;
        }
        .gta-live-dot { width: 9px; height: 9px; border-radius: 50%; background: var(--teal); box-shadow: 0 0 0 0 rgba(25,195,125,0.7); animation: gtaPulse 1.8s infinite; }
        @keyframes gtaPulse { 0% { box-shadow: 0 0 0 0 rgba(25,195,125,0.6); } 70% { box-shadow: 0 0 0 10px rgba(25,195,125,0); } 100% { box-shadow: 0 0 0 0 rgba(25,195,125,0); } }
        .gta-title { margin: 0; display: grid; gap: 4px; }
        .gta-title-vi {
          font-size: clamp(34px, 6vw, 56px); font-weight: 900; line-height: 0.95; font-style: italic;
          background: linear-gradient(135deg, #fff 0%, var(--cyan) 45%, var(--pink) 100%);
          -webkit-background-clip: text; background-clip: text; color: transparent;
          text-shadow: 0 4px 30px rgba(255,45,155,0.25);
        }
        .gta-title-sub { font-size: 14px; font-weight: 800; color: #d7d2ff; }

        .gta-edition-tabs { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .gta-tab {
          display: grid; gap: 2px; padding: 12px 14px; border-radius: 14px; cursor: pointer; text-align: right;
          background: rgba(255,255,255,0.04); border: 2px solid rgba(255,255,255,0.10); color: #e8e6ff;
          font-family: inherit; transition: all .18s ease;
        }
        .gta-tab:hover { border-color: var(--accent); transform: translateY(-1px); }
        .gta-tab.active { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 16%, transparent); box-shadow: 0 8px 22px color-mix(in srgb, var(--accent) 30%, transparent); }
        .gta-tab-fa { font-weight: 900; font-size: 15px; }
        .gta-tab-en { font-size: 11.5px; color: #b9b4d8; font-weight: 700; }

        .gta-field { display: grid; gap: 8px; }
        .gta-field-label { font-size: 13px; font-weight: 800; color: #cfcae8; display: flex; align-items: center; gap: 10px; }
        .gta-field-help { font-size: 11.5px; color: var(--cyan); text-decoration: none; font-weight: 800; border-bottom: 1px dashed currentColor; }
        .gta-pills { display: flex; gap: 10px; flex-wrap: wrap; }
        .gta-pill {
          padding: 9px 16px; border-radius: 12px; cursor: pointer; font-family: inherit; font-weight: 800; font-size: 13px;
          background: rgba(255,255,255,0.04); border: 2px solid rgba(255,255,255,0.10); color: #e8e6ff; transition: all .18s ease;
        }
        .gta-pill:hover { border-color: var(--accent); }
        .gta-pill.active { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 18%, transparent); color: #fff; }
        .gta-pill.disabled { opacity: 0.5; cursor: not-allowed; display: inline-flex; align-items: center; gap: 8px; }
        .gta-pill.disabled:hover { border-color: rgba(255,255,255,0.10); }
        .gta-pill-soon { font-size: 10px; font-weight: 900; color: #1a0b34; background: #c9b8ff; padding: 1px 7px; border-radius: 999px; }

        .gta-cap-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
        .gta-cap {
          position: relative; display: grid; gap: 3px; padding: 10px 8px; border-radius: 12px; cursor: pointer; text-align: center;
          background: rgba(255,255,255,0.04); border: 2px solid rgba(255,255,255,0.10); color: #e8e6ff; font-family: inherit; transition: all .18s ease;
        }
        .gta-cap:hover { border-color: var(--teal); }
        .gta-cap.active { border-color: var(--teal); background: rgba(25,195,125,0.14); }
        .gta-cap.rec.active { border-color: var(--teal); box-shadow: 0 8px 20px rgba(25,195,125,0.25); }
        .gta-cap-fa { font-weight: 900; font-size: 13px; }
        .gta-cap-short { font-size: 10.5px; color: #b9b4d8; }
        .gta-cap-rec {
          position: absolute; top: -8px; right: 50%; transform: translateX(50%); white-space: nowrap;
          font-size: 9.5px; font-weight: 900; color: #04210f; background: var(--teal); padding: 2px 8px; border-radius: 999px;
        }
        .gta-cap-summary { margin: 0; font-size: 12.5px; line-height: 1.7; color: #c4bfe0; }

        .gta-instant {
          display: flex; align-items: center; gap: 12px; width: 100%; text-align: right; cursor: pointer;
          padding: 12px 14px; border-radius: 14px; font-family: inherit;
          background: rgba(255,255,255,0.04); border: 2px solid rgba(255,255,255,0.10); transition: all .18s ease;
        }
        .gta-instant:hover { border-color: var(--cyan); }
        .gta-instant.on { border-color: var(--cyan); background: rgba(33,212,253,0.12); }
        .gta-instant-check {
          flex-shrink: 0; width: 22px; height: 22px; border-radius: 7px; display: grid; place-items: center;
          border: 2px solid rgba(255,255,255,0.25); color: #04210f; font-weight: 900; font-size: 13px;
        }
        .gta-instant.on .gta-instant-check { background: var(--cyan); border-color: var(--cyan); }
        .gta-instant-body { flex: 1; min-width: 0; display: grid; gap: 2px; }
        .gta-instant-title { font-weight: 900; font-size: 14px; color: #e8e6ff; }
        .gta-instant-desc { font-size: 11.5px; color: #b9b4d8; }
        .gta-instant-fee { flex-shrink: 0; font-weight: 900; font-size: 13px; color: var(--cyan); }

        .gta-price-row { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; margin-top: 2px; }
        .gta-price-block { display: grid; gap: 2px; }
        .gta-price-old { color: #8b86a8; font-size: 13px; }
        .gta-price { font-size: 26px; font-weight: 900; color: #fff; }
        .gta-price small { font-size: 13px; font-weight: 800; color: #c4bfe0; }
        .gta-price-ask { font-size: 22px; font-weight: 900; color: var(--cyan); }
        .gta-price-lira { font-size: 15px; font-weight: 800; color: #34d399; }
        .gta-price-lira small { font-size: 11px; font-weight: 700; color: #34d399; }
        .gta-price-usd { font-size: 12px; font-weight: 700; color: #b9b4d8; }
        .gta-cta {
          flex: 1; min-width: 220px; padding: 15px 22px; border: none; border-radius: 14px; cursor: pointer;
          font-family: inherit; font-weight: 900; font-size: 16px; color: #fff;
          background: linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 55%, #000));
          box-shadow: 0 12px 30px color-mix(in srgb, var(--accent) 40%, transparent); transition: transform .15s ease, filter .15s ease;
        }
        .gta-cta:hover { transform: translateY(-2px); filter: brightness(1.08); }
        .gta-cta:active { transform: translateY(0); }
        .gta-cta:disabled { opacity: 0.55; cursor: not-allowed; filter: grayscale(0.3); transform: none; }

        .gta-assure { display: flex; gap: 16px; flex-wrap: wrap; font-size: 12px; font-weight: 700; color: #b9b4d8; }

        /* SECTIONS */
        .gta-section { padding: 22px; }
        
        .gta-countdown-section {
          background: linear-gradient(135deg, rgba(255,45,155,0.1), rgba(124,77,255,0.1));
          border: 1px solid rgba(255,45,155,0.3);
          text-align: center;
          padding: 30px;
        }
        .gta-countdown-inner { display: flex; flex-direction: column; align-items: center; gap: 16px; }
        .gta-countdown-title { font-size: 20px; font-weight: 900; color: #fff; margin: 0; }
        .gta-countdown-grid { display: flex; align-items: center; justify-content: center; gap: 12px; direction: ltr; }
        .gta-countdown-box { display: flex; flex-direction: column; align-items: center; background: rgba(0,0,0,0.4); padding: 12px 16px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); min-width: 70px; }
        .gta-countdown-num { font-size: 28px; font-weight: 900; color: var(--pink); font-family: monospace; }
        .gta-countdown-label { font-size: 12px; color: #cbd5e1; margin-top: 4px; }
        .gta-countdown-sep { font-size: 28px; font-weight: 900; color: #fff; padding-bottom: 20px; }
        .gta-countdown-desc { font-size: 14px; color: #a5b4cf; margin: 0; }
        
        .gta-sec-head { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; flex-wrap: wrap; }
        .gta-sec-num {
          font-size: 13px; font-weight: 900; color: var(--pink); background: rgba(255,45,155,0.12);
          border: 1px solid rgba(255,45,155,0.3); border-radius: 8px; padding: 4px 8px;
        }
        .gta-sec-head h2 { margin: 0; font-size: 19px; font-weight: 900; color: var(--text); }
        .gta-mini-tabs { display: flex; gap: 8px; margin-inline-start: auto; flex-wrap: wrap; }
        .gta-mini-tab {
          padding: 7px 12px; border-radius: 10px; cursor: pointer; font-family: inherit; font-weight: 800; font-size: 12.5px;
          background: var(--bg); border: 1.5px solid var(--line); color: var(--muted); transition: all .18s ease;
        }
        .gta-mini-tab.active { border-color: var(--accent, var(--primary)); color: var(--text); background: color-mix(in srgb, var(--accent, var(--primary)) 12%, transparent); }
        .gta-p { font-size: 14px; line-height: 2; color: var(--text); margin: 0 0 10px; }
        .gta-overview { color: var(--muted); font-size: 13.5px; }

        .gta-intro-highlights { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 8px; }
        .gta-hl {
          display: flex; flex-direction: column; align-items: center; gap: 6px; text-align: center;
          padding: 14px 10px; border-radius: 14px; font-size: 12.5px; font-weight: 800; color: var(--text);
          background: linear-gradient(135deg, rgba(124,77,255,0.10), rgba(33,212,253,0.06)); border: 1px solid var(--line);
        }
        .gta-hl-icon { font-size: 22px; }

        .gta-edition-card { border: 2px solid color-mix(in srgb, var(--accent) 40%, var(--line)); border-radius: 16px; padding: 18px; display: grid; gap: 16px; background: color-mix(in srgb, var(--accent) 6%, var(--card)); }
        .gta-edition-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
        .gta-edition-name { font-size: 18px; font-weight: 900; color: var(--text); }
        .gta-edition-tag { font-size: 13px; color: var(--muted); font-weight: 700; margin-top: 2px; }
        .gta-edition-usd { font-size: 22px; font-weight: 900; color: var(--accent); white-space: nowrap; }
        .gta-edition-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
        .gta-col-title { font-size: 13px; font-weight: 900; color: var(--text); margin-bottom: 8px; }
        .gta-list { margin: 0; padding: 0; list-style: none; display: grid; gap: 8px; }
        .gta-list li { position: relative; padding-inline-start: 22px; font-size: 13px; line-height: 1.8; color: var(--text); }
        .gta-list li::before { content: "◆"; position: absolute; inset-inline-start: 0; top: 1px; color: var(--accent, var(--primary)); font-size: 11px; }
        .gta-list.check li::before { content: "✓"; color: var(--teal); font-weight: 900; }
        .gta-list.warn li::before { content: "•"; color: #f59e0b; font-size: 16px; top: -2px; }
        .gta-edition-note { font-size: 13px; line-height: 1.8; color: var(--text); background: rgba(245,158,11,0.10); border: 1px solid rgba(245,158,11,0.3); border-radius: 12px; padding: 12px 14px; }

        .gta-cap-cards { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        .gta-cap-card {
          position: relative; text-align: right; cursor: pointer; font-family: inherit; display: grid; gap: 10px;
          padding: 16px; border-radius: 16px; background: var(--card); border: 2px solid var(--line); transition: all .18s ease;
        }
        .gta-cap-card:hover { border-color: var(--primary); transform: translateY(-2px); }
        .gta-cap-card.active { border-color: var(--teal); box-shadow: 0 10px 26px rgba(25,195,125,0.15); }
        .gta-cap-card.rec { background: linear-gradient(135deg, rgba(25,195,125,0.07), transparent); }
        .gta-cap-card-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        .gta-cap-card-fa { font-size: 16px; font-weight: 900; color: var(--text); }
        .gta-cap-badge { font-size: 11px; font-weight: 900; color: var(--primary); background: color-mix(in srgb, var(--primary) 14%, transparent); border: 1px solid color-mix(in srgb, var(--primary) 35%, transparent); border-radius: 999px; padding: 3px 10px; }
        .gta-cap-tags { display: flex; gap: 8px; flex-wrap: wrap; }
        .gta-tag { font-size: 11px; font-weight: 800; padding: 3px 10px; border-radius: 999px; border: 1px solid var(--line); color: var(--muted); }
        .gta-tag.on { color: var(--teal); border-color: var(--teal); }
        .gta-tag.off { color: #f97316; border-color: #f97316; }
        .gta-cap-card-text { margin: 0; font-size: 13px; line-height: 1.85; color: var(--muted); }
        .gta-cap-card-rec { justify-self: start; font-size: 11px; font-weight: 900; color: #04210f; background: var(--teal); padding: 3px 10px; border-radius: 999px; }

        .gta-steps { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; counter-reset: gta; }
        .gta-step { display: flex; gap: 12px; align-items: flex-start; padding: 12px 14px; background: var(--bg); border: 1px solid var(--line); border-radius: 12px; }
        .gta-step-n { flex-shrink: 0; width: 28px; height: 28px; border-radius: 9px; display: grid; place-items: center; font-weight: 900; font-size: 13px; color: #fff; background: linear-gradient(135deg, var(--purple), var(--pink)); }
        .gta-step-t { font-size: 13.5px; line-height: 1.8; color: var(--text); padding-top: 3px; }
        .gta-safety { margin-top: 16px; padding: 16px; border-radius: 14px; background: rgba(245,158,11,0.07); border: 1px solid rgba(245,158,11,0.25); }
        .gta-safety-title { font-size: 14px; font-weight: 900; color: var(--text); margin-bottom: 10px; }

        /* STICKY (mobile) */
        .gta-sticky { display: none; }

        @media (max-width: 880px) {
          .gta-hero-grid { grid-template-columns: 1fr; gap: 18px; padding: 16px; }
          .gta-cover-wrap { max-width: 320px; margin: 0 auto; }
          .gta-edition-cols { grid-template-columns: 1fr; gap: 14px; }
          .gta-cap-cards { grid-template-columns: 1fr; }
          .gta-intro-highlights { grid-template-columns: repeat(2, 1fr); }
          .gta-mini-tabs { width: 100%; margin-inline-start: 0; }
          .gta-sticky {
            position: fixed; bottom: 0; inset-inline: 0; z-index: 90; display: flex; align-items: center; gap: 10px;
            padding: 10px 14px calc(10px + env(safe-area-inset-bottom)); background: rgba(10,10,25,0.92);
            backdrop-filter: blur(12px); border-top: 1px solid rgba(124,77,255,0.4);
          }
          .gta-sticky-info { display: grid; gap: 2px; flex: 1; min-width: 0; }
          .gta-sticky-edition { font-size: 11.5px; font-weight: 800; color: #b9b4d8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .gta-sticky-price { font-size: 14px; font-weight: 900; color: #fff; }
          .gta-cta.sm { flex: 0 0 auto; min-width: 0; padding: 12px 20px; font-size: 14px; }
        }
        /* FAQ styles */
        .gta-faq-list { display: flex; flex-direction: column; gap: 12px; margin-top: 20px; }
        .gta-faq-item {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.3s ease;
        }
        .gta-faq-item.open {
          border-color: var(--accent);
          background: rgba(255, 255, 255, 0.04);
        }
        .gta-faq-q {
          width: 100%;
          text-align: right;
          padding: 16px 20px;
          background: transparent;
          border: none;
          color: #fff;
          font-weight: 600;
          font-size: 1.05rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          transition: color 0.2s;
        }
        .gta-faq-q:hover { color: var(--accent); }
        .gta-faq-icon {
          font-size: 0.9rem;
          transition: transform 0.3s ease;
          color: rgba(255,255,255,0.4);
        }
        .gta-faq-item.open .gta-faq-icon {
          transform: rotate(180deg);
          color: var(--accent);
        }
        .gta-faq-a {
          padding: 0 20px 20px;
          color: rgba(255,255,255,0.8);
          font-size: 0.95rem;
          line-height: 1.7;
        }
      `}</style>
    </div>
  );
}
