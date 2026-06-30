"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Sub-components can be extracted, but we keep it here for simplicity
const HOT_PRODUCTS = [
  {
    id: "fortnite-crew",
    title: "کرو پک فورتنایت",
    desc: "بتل پس + ۱۰۰۰ ویباکس + اسکین",
    image: "/products/fortnite-crew-pack.webp",
    link: "/product/fortnite-crew-pack",
    color: "#e81cff",
    fomo: "تا پایان کروپک این ماه"
  },
  {
    id: "gta6",
    title: "پیش‌خرید GTA VI",
    desc: "نسخه آلتیمیت - تحویل فوری پس از انتشار",
    image: "/products/gta6/ps5-ultimate.jpg",
    link: "/gta6",
    color: "#ff2d9b",
    fomo: "تا پایان آفر پیش‌خرید این ماه"
  },
  {
    id: "spotify",
    title: "اشتراک اسپاتیفای",
    desc: "پریمیوم بدون قطعی",
    image: "/products/spotify-subscription.webp",
    link: "/product/spotify-subscription",
    color: "#1ed760",
    fomo: "تا پایان تخفیف ویژهٔ این ماه"
  },
  {
    id: "gemini",
    title: "اشتراک جمینای",
    desc: "Gemini Advanced",
    image: "/products/gemini-subscription.webp",
    link: "/product/gemini-subscription",
    color: "#4285f4",
    fomo: "تا پایان آفر این ماه"
  }
];

const DAY_MS = 86400000;
const HOUR_MS = 3600000;

// Persian digit conversion to stay consistent with the rest of the site
const toFa = (s) => String(s).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);

// Milliseconds until 00:00 of the first day of the next Gregorian month.
// CrewPack (and the monthly offers) reset exactly on the 1st of each month.
function getMsToNextMonth() {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
  return Math.max(0, next.getTime() - now.getTime());
}

function formatRemaining(ms) {
  const totalSec = Math.floor(Math.max(0, ms) / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  const pad = (n) => String(n).padStart(2, "0");
  const clock = `${pad(hours)}:${pad(mins)}:${pad(secs)}`;
  return toFa(days > 0 ? `${days} روز و ${clock}` : clock);
}

// The closer we get to the 1st, the tighter/hotter the FOMO indicator becomes.
function urgencyLevel(ms) {
  if (ms <= HOUR_MS) return "critical";
  if (ms <= DAY_MS) return "high";
  if (ms <= 3 * DAY_MS) return "mid";
  return "normal";
}

export default function HotProductsSection() {
  const router = useRouter();
  const [activeSlide, setActiveSlide] = useState(0);
  const [remaining, setRemaining] = useState(0);

  // Auto-play
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % HOT_PRODUCTS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Live FOMO countdown to the 1st of next month
  useEffect(() => {
    const tick = () => setRemaining(getMsToNextMonth());
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  const openSpin = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("open-spin-wheel"));
    }
  };

  const product = HOT_PRODUCTS[activeSlide];
  const level = urgencyLevel(remaining);
  const isHot = level === "high" || level === "critical";

  return (
    <section className="hot-section">
      <div className="hot-slider card">
        <div className="hot-slider-bg" style={{ '--accent': product.color }} aria-hidden="true" />
        <div className="hot-slider-content">
          <div className="hot-info">
            <span className="hot-badge">🔥 داغ‌ترین محصولات شاپ (پرفروش‌ترین‌ها)</span>
            <h2 className="hot-title">{product.title}</h2>
            <p className="hot-desc">{product.desc}</p>
            <div className={`hot-fomo urgency-${level}`}>
              <span className="hot-fomo-icon">{isHot ? "⚠️" : "⏳"}</span>
              <span className="hot-fomo-label">
                {level === "critical" ? "فقط چند ساعت! " : level === "high" ? "فرصت محدود! " : ""}
                {product.fomo}
              </span>
              <span className="hot-fomo-time">{formatRemaining(remaining)}</span>
            </div>
            <button className="hot-cta" onClick={() => router.push(product.link)}>
              مشاهده و خرید
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
          <div className="hot-visual" onClick={() => router.push(product.link)}>
            <img src={product.image} alt={product.title} className="hot-image" />
          </div>
        </div>

        <div className="hot-dots">
          {HOT_PRODUCTS.map((p, i) => (
            <button
              key={p.id}
              className={`hot-dot ${i === activeSlide ? 'active' : ''}`}
              style={{ '--dot-color': p.color }}
              onClick={() => setActiveSlide(i)}
            />
          ))}
        </div>
      </div>

      {/* Yellow Spin Wheel Bar */}
      <div className="spin-banner" onClick={openSpin} role="button" tabIndex={0}>
        <div className="spin-banner-inner">
          <span className="spin-banner-icon">🎁</span>
          <div className="spin-banner-text">
            <strong>گردونه شانس نوبیکس</strong>
            <span>کلیک کن، بچرخون و تا ۲۰٪ تخفیف یا اعتبار کیف پول برنده شو! (فقط هفته‌ای یک‌بار)</span>
          </div>
          <button className="spin-banner-btn">امتحان شانس</button>
        </div>
      </div>

      <style jsx>{`
        .hot-section {
          margin: 24px 0;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .hot-slider {
          position: relative;
          border-radius: 24px;
          overflow: hidden;
          background: #0f0c29;
          border: 1px solid rgba(255,255,255,0.05);
          box-shadow: 0 20px 40px rgba(0,0,0,0.4);
          transition: border-color 0.4s ease;
        }
        .hot-slider-bg {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 70% 30%, var(--accent), transparent 60%);
          opacity: 0.15;
          transition: background 0.4s ease;
          z-index: 0;
        }
        .hot-slider-content {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: 1fr 280px;
          gap: 24px;
          padding: 32px;
          align-items: center;
        }
        .hot-info {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 12px;
        }
        .hot-badge {
          background: linear-gradient(90deg, #ff0055, #ff2d9b);
          color: white;
          padding: 6px 12px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 800;
          box-shadow: 0 4px 12px rgba(255,0,85,0.4);
        }
        .hot-title {
          font-size: 32px;
          font-weight: 900;
          color: #fff;
          margin: 0;
        }
        .hot-desc {
          font-size: 15px;
          color: #cbd5e1;
          margin: 0 0 8px;
        }

        /* FOMO countdown */
        .hot-fomo {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 7px 14px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 800;
          border: 1px solid transparent;
          line-height: 1.2;
        }
        .hot-fomo-icon { font-size: 15px; }
        .hot-fomo-time {
          font-variant-numeric: tabular-nums;
          letter-spacing: 0.5px;
          padding: 2px 8px;
          border-radius: 8px;
          background: rgba(0,0,0,0.25);
        }
        /* normal: calm */
        .hot-fomo.urgency-normal {
          background: rgba(245,158,11,0.12);
          border-color: rgba(245,158,11,0.35);
          color: #fcd34d;
        }
        /* mid: getting closer (<= 3 days) */
        .hot-fomo.urgency-mid {
          background: rgba(249,115,22,0.16);
          border-color: rgba(249,115,22,0.5);
          color: #fdba74;
          animation: fomoPulse 2.4s ease-in-out infinite;
        }
        /* high: last day (<= 24h) */
        .hot-fomo.urgency-high {
          background: rgba(239,68,68,0.18);
          border-color: rgba(239,68,68,0.6);
          color: #fca5a5;
          font-size: 14px;
          animation: fomoPulse 1.2s ease-in-out infinite;
        }
        /* critical: last hour (<= 1h) */
        .hot-fomo.urgency-critical {
          background: rgba(220,38,38,0.28);
          border-color: #ef4444;
          color: #fff;
          font-size: 14px;
          box-shadow: 0 0 16px rgba(239,68,68,0.55);
          animation: fomoPulse 0.7s ease-in-out infinite, fomoShake 0.7s ease-in-out infinite;
        }
        .hot-fomo.urgency-critical .hot-fomo-time {
          background: rgba(0,0,0,0.4);
        }
        @keyframes fomoPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.04); }
        }
        @keyframes fomoShake {
          0%, 100% { transform: translateX(0) scale(1); }
          25% { transform: translateX(-2px) scale(1.02); }
          75% { transform: translateX(2px) scale(1.02); }
        }

        .hot-cta {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #fff;
          color: #0f0c29;
          border: none;
          padding: 12px 24px;
          border-radius: 14px;
          font-weight: 800;
          font-size: 15px;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .hot-cta:hover { transform: translateY(-2px); }
        .hot-visual {
          cursor: pointer;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          transition: transform 0.3s;
        }
        .hot-visual:hover {
          transform: scale(1.03) rotate(-2deg);
        }
        .hot-image {
          width: 100%;
          height: auto;
          display: block;
          aspect-ratio: 1;
          object-fit: cover;
        }
        .hot-dots {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 8px;
          z-index: 2;
        }
        .hot-dot {
          width: 10px;
          height: 10px;
          border-radius: 5px;
          background: rgba(255,255,255,0.2);
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .hot-dot.active {
          width: 24px;
          background: var(--dot-color);
          box-shadow: 0 0 10px var(--dot-color);
        }

        /* Spin Banner */
        .spin-banner {
          background: linear-gradient(135deg, #f59e0b, #d97706);
          border-radius: 20px;
          cursor: pointer;
          box-shadow: 0 10px 25px rgba(245,158,11,0.25);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          overflow: hidden;
          position: relative;
        }
        .spin-banner::before {
          content: '';
          position: absolute;
          top: 0; left: -100%; width: 50%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          transform: skewX(-20deg);
          animation: shine 4s infinite;
        }
        @keyframes shine {
          0% { left: -100%; }
          20% { left: 200%; }
          100% { left: 200%; }
        }
        .spin-banner:hover {
          transform: translateY(-3px);
          box-shadow: 0 15px 35px rgba(245,158,11,0.35);
        }
        .spin-banner-inner {
          display: flex;
          align-items: center;
          padding: 16px 24px;
          gap: 16px;
        }
        .spin-banner-icon {
          font-size: 32px;
          animation: bounce 2s infinite;
        }
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
          60% { transform: translateY(-3px); }
        }
        .spin-banner-text {
          flex: 1;
          display: flex;
          flex-direction: column;
          color: #fff;
        }
        .spin-banner-text strong {
          font-size: 18px;
          font-weight: 900;
          text-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .spin-banner-text span {
          font-size: 13px;
          opacity: 0.9;
        }
        .spin-banner-btn {
          background: #fff;
          color: #d97706;
          border: none;
          padding: 10px 20px;
          border-radius: 12px;
          font-weight: 800;
          font-size: 14px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        }

        @media (max-width: 768px) {
          .hot-slider-content {
            grid-template-columns: 1fr 140px;
            gap: 14px;
            padding: 16px;
          }
          .hot-info { gap: 8px; }
          .hot-title { font-size: clamp(20px, 5.6vw, 26px); }
          .hot-desc { font-size: 13px; margin: 0 0 2px; }
          .hot-fomo { font-size: 12px; padding: 5px 10px; }
          .hot-fomo.urgency-high, .hot-fomo.urgency-critical { font-size: 12.5px; }
          .hot-cta { padding: 10px 18px; font-size: 14px; }
          .hot-visual { max-width: 140px; align-self: center; }
          .hot-image { aspect-ratio: 1 / 0.82; }
          .hot-dots { bottom: 10px; }
        }

        /* iPhone 15 (~393px) and smaller phones: trim a couple more finger-widths of height */
        @media (max-width: 430px) {
          .hot-slider-content {
            grid-template-columns: 1fr 118px;
            gap: 10px;
            padding: 12px;
          }
          .hot-title { font-size: clamp(18px, 5.2vw, 22px); }
          .hot-desc { font-size: 12px; }
          .hot-fomo { font-size: 11.5px; padding: 4px 8px; gap: 6px; }
          .hot-fomo-time { padding: 1px 6px; }
          .hot-cta { padding: 9px 16px; font-size: 13px; }
          .hot-visual { max-width: 118px; }
          .hot-image { aspect-ratio: 1 / 0.78; }
        }
      `}</style>
    </section>
  );
}
