"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function HotProductsSection() {
  const [isSaturday, setIsSaturday] = useState(false);

  useEffect(() => {
    setIsSaturday(new Date().getDay() === 6);
  }, []);

  const openSpin = (e) => {
    if (typeof window !== "undefined") {
      // Crawlers follow the real /spin href; JS users get the modal instead.
      e.preventDefault();
      window.dispatchEvent(new Event("open-spin-wheel"));
    }
  };

  return (
    <section className="promo-section">
      {/* 3D Cosmic Spin Wheel Magic Card */}
      <Link 
        href="/spin" 
        className={`wheel-magic-card ${isSaturday ? "event-active" : ""}`} 
        onClick={openSpin}
      >
        {/* Dynamic Holographic Background Particles */}
        <div className="magic-ambient-glows" aria-hidden="true">
          <div className="magic-glow-pulse-pink" />
          <div className="magic-glow-pulse-violet" />
        </div>

        <div className={`magic-card-body ${isSaturday ? "is-saturday" : ""}`}>
          {/* Right side content (RTL) */}
          <div className="magic-card-details">
            <span className="magic-pill-badge">
              <span className="badge-pulse-dot"></span>
              {isSaturday ? "⚡ رویداد ویژه شنبه طلایی" : "🔮 تالار جوایز طلایی جینکس"}
            </span>
            <div className="magic-message-group">
              <strong>
                {isSaturday ? "همین حالا گردونه طلایی فعال شد!" : "شانست رو امتحان کن! ✨"}
              </strong>
              <span>
                {isSaturday 
                  ? "شانس امروزت رو از دست نده: کوین رایگان، تخفیف‌های ویژه و هدایای اختصاصی" 
                  : "هر هفته یک فرصت رایگان برای برنده شدن تا ۲۰٪ تخفیف و کوین رایگان"
                }
              </span>
            </div>
          </div>

          {/* Button CTA */}
          <div className="magic-cta-wrapper">
            <span className="magic-action-btn">
              {isSaturday ? "شروع چرخش طلایی 🚀" : "بچرخون و برنده شو 🎰"}
            </span>
          </div>

          {/* Left side 3D asset with holographic portal rings */}
          <div className="magic-portal-container">
            <div className="magic-portal-ring" />
            <img
              src="/images/arcane_lucky_chest.webp"
              alt="صندوقچه شانس جینکس فمیلی"
              className="portal-chest-asset"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      </Link>

      <style jsx>{`
        .promo-section {
          margin: 30px 0;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        /* Unique Holographic Card Styles */
        .wheel-magic-card {
          display: block;
          text-decoration: none;
          color: inherit;
          background: linear-gradient(135deg, #060412 0%, #0d0922 50%, #150828 100%);
          border-radius: 24px;
          cursor: pointer;
          border: 1px solid rgba(139, 92, 246, 0.25);
          box-shadow: 0 12px 30px rgba(139, 92, 246, 0.15), inset 0 1px 1px rgba(255, 255, 255, 0.1);
          transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.1), box-shadow 0.4s ease;
          overflow: visible;
          position: relative;
          animation: pulseCardGlow 6s ease-in-out infinite;
        }

        @keyframes pulseCardGlow {
          0%, 100% { box-shadow: 0 12px 30px rgba(139, 92, 246, 0.15), inset 0 1px 1px rgba(255, 255, 255, 0.1); }
          50% { box-shadow: 0 12px 40px rgba(236, 72, 153, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.15); }
        }

        /* Ambient Glow behind card */
        .magic-ambient-glows {
          position: absolute;
          inset: 0;
          overflow: hidden;
          border-radius: 24px;
          pointer-events: none;
          z-index: 1;
        }

        .magic-glow-pulse-pink {
          position: absolute;
          right: -30px;
          top: -30px;
          width: 180px;
          height: 180px;
          background: radial-gradient(circle, rgba(236, 72, 153, 0.25) 0%, transparent 70%);
          pointer-events: none;
          animation: ambientFloat 4s ease-in-out infinite alternate;
        }

        .magic-glow-pulse-violet {
          position: absolute;
          left: 30px;
          bottom: -30px;
          width: 180px;
          height: 180px;
          background: radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 70%);
          pointer-events: none;
          animation: ambientFloat 4s ease-in-out infinite alternate-reverse;
        }

        @keyframes ambientFloat {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(10px, -10px) scale(1.1); }
        }

        /* Shimmer Sheen effect over the card */
        .wheel-magic-card::before {
          content: '';
          position: absolute;
          top: 0; left: -100%; width: 55%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent);
          transform: skewX(-20deg);
          animation: sheenSweep 5s infinite;
          z-index: 2;
          border-radius: 24px;
          pointer-events: none;
        }

        @keyframes sheenSweep {
          0% { left: -100%; }
          20% { left: 200%; }
          100% { left: 200%; }
        }

        /* Dynamic sparkles */
        .wheel-magic-card::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 24px;
          pointer-events: none;
          z-index: 2;
          background-image:
            radial-gradient(circle at 15% 25%, rgba(255, 255, 255, 0.6) 0px, transparent 1.5px),
            radial-gradient(circle at 35% 75%, rgba(255, 255, 255, 0.5) 0px, transparent 2px),
            radial-gradient(circle at 55% 15%, rgba(255, 255, 255, 0.6) 0px, transparent 1.5px),
            radial-gradient(circle at 75% 85%, rgba(255, 255, 255, 0.5) 0px, transparent 2px);
          background-size: 100% 100%;
          background-repeat: no-repeat;
          animation: sparklesGlow 4s ease-in-out infinite;
          mix-blend-mode: screen;
        }

        @keyframes sparklesGlow {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.8; }
        }

        .wheel-magic-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 45px rgba(139, 92, 246, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.2);
        }

        /* Saturday Special Theme overrides */
        .wheel-magic-card.event-active {
          background: linear-gradient(135deg, #100a00 0%, #291800 50%, #3d2700 100%);
          border-color: rgba(245, 158, 11, 0.4);
          animation: pulseSaturdayGlow 6s ease-in-out infinite;
        }

        @keyframes pulseSaturdayGlow {
          0%, 100% { box-shadow: 0 12px 30px rgba(245, 158, 11, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.1); }
          50% { box-shadow: 0 12px 45px rgba(251, 191, 36, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.15); }
        }

        .wheel-magic-card.event-active:hover {
          box-shadow: 0 20px 50px rgba(245, 158, 11, 0.45);
        }

        /* Inside Content layout with solid custom background color */
        .magic-card-body {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px 32px;
          padding-left: 190px;
          position: relative;
          z-index: 3;
          direction: rtl;
          background: #110d26; /* Premium solid deep indigo-violet background color */
          border-radius: 24px;
          border: 1px solid rgba(139, 92, 246, 0.2);
        }

        .magic-card-body.is-saturday {
          background: #2a1801; /* Premium solid deep gold-amber event background color */
          border-color: rgba(245, 158, 11, 0.3);
        }

        .magic-card-details {
          display: flex;
          flex-direction: column;
          gap: 10px;
          z-index: 2;
        }

        /* Micro pill-badge */
        .magic-pill-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 850;
          color: #c084fc;
          background: rgba(168, 85, 247, 0.12);
          border: 1px solid rgba(168, 85, 247, 0.3);
          padding: 5px 12px;
          border-radius: 50px;
          width: fit-content;
          box-shadow: 0 2px 8px rgba(168, 85, 247, 0.08);
        }

        .badge-pulse-dot {
          width: 6px;
          height: 6px;
          background-color: #a855f7;
          border-radius: 50%;
          animation: badgePulse 1.8s infinite;
        }

        @keyframes badgePulse {
          0% { transform: scale(0.8); box-shadow: 0 0 0 0 rgba(168, 85, 247, 0.7); }
          70% { transform: scale(1.1); box-shadow: 0 0 0 6px rgba(168, 85, 247, 0); }
          100% { transform: scale(0.8); box-shadow: 0 0 0 0 rgba(168, 85, 247, 0); }
        }

        .magic-card-body.is-saturday .magic-pill-badge {
          color: #fbbf24;
          background: rgba(251, 191, 36, 0.12);
          border-color: rgba(251, 191, 36, 0.35);
        }

        .magic-card-body.is-saturday .badge-pulse-dot {
          background-color: #fbbf24;
          animation: badgePulseGold 1.8s infinite;
        }

        @keyframes badgePulseGold {
          0% { transform: scale(0.8); box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.7); }
          70% { transform: scale(1.1); box-shadow: 0 0 0 6px rgba(251, 191, 36, 0); }
          100% { transform: scale(0.8); box-shadow: 0 0 0 0 rgba(251, 191, 36, 0); }
        }

        /* Typography groups */
        .magic-message-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .magic-message-group strong {
          font-size: 20px;
          font-weight: 950;
          background: linear-gradient(90deg, #ffffff, #c084fc);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
        }

        .magic-message-group span {
          font-size: 13.5px;
          color: #94a3b8;
          font-weight: 500;
          opacity: 0.9;
        }

        .magic-card-body.is-saturday .magic-message-group strong {
          background: linear-gradient(90deg, #ffffff, #fcd34d);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .magic-card-body.is-saturday .magic-message-group span {
          color: #e2e8f0;
        }

        /* High-tech Action CTA */
        .magic-cta-wrapper {
          z-index: 2;
          display: flex;
          align-items: center;
        }

        .magic-action-btn {
          background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
          color: #ffffff;
          border: none;
          padding: 12px 28px;
          border-radius: 14px;
          font-weight: 900;
          font-size: 14px;
          box-shadow: 0 6px 20px rgba(139, 92, 246, 0.35);
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          display: inline-block;
          text-align: center;
          position: relative;
          overflow: hidden;
        }

        .magic-action-btn::before {
          content: '';
          position: absolute;
          top: 0; left: -100%; width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: 0.5s ease;
        }

        .wheel-magic-card:hover .magic-action-btn::before {
          left: 100%;
        }

        .wheel-magic-card:hover .magic-action-btn {
          transform: translateY(-2px) scale(1.04);
          box-shadow: 0 8px 24px rgba(139, 92, 246, 0.5);
        }

        .magic-card-body.is-saturday .magic-action-btn {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          box-shadow: 0 6px 20px rgba(245, 158, 11, 0.35);
          color: #1c1100;
        }

        .wheel-magic-card.event-active:hover .magic-action-btn {
          box-shadow: 0 8px 24px rgba(245, 158, 11, 0.5);
        }

        /* Futuristic holographic portal container */
        .magic-portal-container {
          position: absolute;
          left: 16px;
          top: 50%;
          width: 120px;
          height: 120px;
          transform: translateY(-50%);
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          z-index: 10;
          overflow: visible;
        }

        .magic-portal-ring {
          position: absolute;
          width: 135px;
          height: 135px;
          border: 2px dashed rgba(168, 85, 247, 0.4);
          border-radius: 50%;
          animation: portalRotate 10s linear infinite;
          z-index: 1;
        }

        .magic-portal-ring::before {
          content: '';
          position: absolute;
          inset: -6px;
          border: 1px solid rgba(236, 72, 153, 0.2);
          border-radius: 50%;
          animation: portalRotateInverse 15s linear infinite;
        }

        .magic-portal-container::after {
          content: '';
          position: absolute;
          width: 110px;
          height: 110px;
          background: radial-gradient(circle, rgba(168, 85, 247, 0.35) 0%, transparent 70%);
          z-index: -1;
          animation: pulsePortalGlow 3s ease-in-out infinite alternate;
        }

        .magic-card-body.is-saturday .magic-portal-ring {
          border-color: rgba(251, 191, 36, 0.45);
        }

        .magic-card-body.is-saturday .magic-portal-ring::before {
          border-color: rgba(245, 158, 11, 0.2);
        }

        .magic-card-body.is-saturday .magic-portal-container::after {
          background: radial-gradient(circle, rgba(251, 191, 36, 0.35) 0%, transparent 70%);
        }

        @keyframes portalRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes portalRotateInverse {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }

        @keyframes pulsePortalGlow {
          0% { transform: scale(0.9); opacity: 0.4; }
          100% { transform: scale(1.1); opacity: 0.8; }
        }

        /* Floating 3D lucky chest asset */
        .portal-chest-asset {
          width: 100%;
          height: 100%;
          object-fit: contain;
          z-index: 2;
          animation: floatChest 4s ease-in-out infinite;
          filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.5));
          transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        @keyframes floatChest {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-7px) rotate(1.5deg); }
        }

        .wheel-magic-card:hover .portal-chest-asset {
          transform: scale(1.1) translateY(-5px) rotate(-2deg);
          filter: drop-shadow(0 20px 35px rgba(168, 85, 247, 0.3)) drop-shadow(0 15px 25px rgba(0, 0, 0, 0.6));
        }

        .wheel-magic-card.event-active:hover .portal-chest-asset {
          filter: drop-shadow(0 20px 35px rgba(251, 191, 36, 0.3)) drop-shadow(0 15px 25px rgba(0, 0, 0, 0.6));
        }

        /* Light Theme Adaptation */
        :global(:root[data-theme="light"]) .wheel-magic-card {
          background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
          border-color: rgba(99, 102, 241, 0.18);
          box-shadow: 0 10px 25px rgba(99, 102, 241, 0.06), inset 0 1px 1px rgba(255, 255, 255, 0.8);
          animation: pulseLightGlow 6s ease-in-out infinite;
        }

        @keyframes pulseLightGlow {
          0%, 100% { box-shadow: 0 10px 25px rgba(99, 102, 241, 0.06), inset 0 1px 1px rgba(255, 255, 255, 0.8); }
          50% { box-shadow: 0 10px 30px rgba(99, 102, 241, 0.12), inset 0 1px 1px rgba(255, 255, 255, 0.95); }
        }

        :global(:root[data-theme="light"]) .magic-card-body {
          background: #f8fafc; /* Solid light slate background */
          border-color: rgba(99, 102, 241, 0.15);
        }

        :global(:root[data-theme="light"]) .magic-pill-badge {
          color: #4f46e5;
          background: rgba(99, 102, 241, 0.08);
          border-color: rgba(99, 102, 241, 0.25);
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.03);
        }

        :global(:root[data-theme="light"]) .badge-pulse-dot {
          background-color: #4f46e5;
          animation: badgePulseLight 1.8s infinite;
        }

        @keyframes badgePulseLight {
          0% { transform: scale(0.8); box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.6); }
          70% { transform: scale(1.1); box-shadow: 0 0 0 6px rgba(99, 102, 241, 0); }
          100% { transform: scale(0.8); box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }
        }

        :global(:root[data-theme="light"]) .magic-message-group strong {
          color: #1e1b4b;
          background: none;
          -webkit-text-fill-color: initial;
        }

        :global(:root[data-theme="light"]) .magic-message-group span {
          color: #4b5563;
        }

        :global(:root[data-theme="light"]) .magic-action-btn {
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          box-shadow: 0 4px 15px rgba(99, 102, 241, 0.25);
          color: #ffffff;
        }

        :global(:root[data-theme="light"]) .wheel-magic-card:hover {
          box-shadow: 0 16px 35px rgba(99, 102, 241, 0.2);
        }

        :global(:root[data-theme="light"]) .wheel-magic-card:hover .magic-action-btn {
          box-shadow: 0 6px 18px rgba(99, 102, 241, 0.35);
        }

        :global(:root[data-theme="light"]) .magic-portal-ring {
          border-color: rgba(99, 102, 241, 0.3);
        }

        :global(:root[data-theme="light"]) .magic-portal-ring::before {
          border-color: rgba(99, 102, 241, 0.15);
        }

        :global(:root[data-theme="light"]) .magic-portal-container::after {
          background: radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, transparent 70%);
        }

        /* Light Theme Saturday overrides */
        :global(:root[data-theme="light"]) .wheel-magic-card.event-active {
          background: linear-gradient(135deg, #fffbeb 0%, #fde68a 100%);
          border-color: rgba(245, 158, 11, 0.3);
          animation: pulseLightSaturdayGlow 6s ease-in-out infinite;
        }

        @keyframes pulseLightSaturdayGlow {
          0%, 100% { box-shadow: 0 10px 25px rgba(245, 158, 11, 0.08), inset 0 1px 1px rgba(255, 255, 255, 0.8); }
          50% { box-shadow: 0 10px 30px rgba(245, 158, 11, 0.18), inset 0 1px 1px rgba(255, 255, 255, 0.95); }
        }

        :global(:root[data-theme="light"]) .magic-card-body.is-saturday {
          background: #fffbeb; /* Solid light amber background */
          border-color: rgba(245, 158, 11, 0.2);
        }

        :global(:root[data-theme="light"]) .wheel-magic-card.event-active .magic-pill-badge {
          color: #b45309;
          background: rgba(245, 158, 11, 0.08);
          border-color: rgba(245, 158, 11, 0.25);
        }

        :global(:root[data-theme="light"]) .wheel-magic-card.event-active .badge-pulse-dot {
          background-color: #d97706;
          animation: badgePulseSaturdayLight 1.8s infinite;
        }

        @keyframes badgePulseWednesdayLight {
          0% { transform: scale(0.8); box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.6); }
          70% { transform: scale(1.1); box-shadow: 0 0 0 6px rgba(245, 158, 11, 0); }
          100% { transform: scale(0.8); box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
        }

        :global(:root[data-theme="light"]) .wheel-magic-card.event-active .magic-message-group strong {
          color: #78350f;
        }

        :global(:root[data-theme="light"]) .wheel-magic-card.event-active .magic-message-group span {
          color: #92400e;
        }

        :global(:root[data-theme="light"]) .wheel-magic-card.event-active .magic-action-btn {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          box-shadow: 0 4px 15px rgba(245, 158, 11, 0.25);
          color: #ffffff;
        }

        :global(:root[data-theme="light"]) .wheel-magic-card.event-active:hover {
          box-shadow: 0 16px 35px rgba(245, 158, 11, 0.25);
        }

        :global(:root[data-theme="light"]) .wheel-magic-card.event-active:hover .magic-action-btn {
          box-shadow: 0 6px 18px rgba(245, 158, 11, 0.35);
        }

        :global(:root[data-theme="light"]) .wheel-magic-card.event-active .magic-portal-ring {
          border-color: rgba(245, 158, 11, 0.35);
        }

        :global(:root[data-theme="light"]) .wheel-magic-card.event-active .magic-portal-ring::before {
          border-color: rgba(245, 158, 11, 0.15);
        }

        :global(:root[data-theme="light"]) .wheel-magic-card.event-active .magic-portal-container::after {
          background: radial-gradient(circle, rgba(245, 158, 11, 0.2) 0%, transparent 70%);
        }

        /* Responsive Breakpoints Optimization */
        @media (max-width: 900px) {
          .magic-card-body {
            padding-left: 160px;
          }
          .magic-portal-container {
            width: 130px;
            height: 130px;
            top: -15px;
            bottom: -15px;
          }
          .magic-portal-ring {
            width: 115px;
            height: 115px;
          }
        }

        @media (max-width: 768px) {
          .wheel-magic-card {
            border-radius: 20px;
          }
          .magic-card-body {
            flex-direction: column;
            align-items: flex-start;
            gap: 14px;
            padding: 20px 24px;
            padding-left: 125px;
          }
          .magic-pill-badge {
            font-size: 10px;
            padding: 4px 10px;
          }
          .magic-message-group strong {
            font-size: 16.5px;
          }
          .magic-message-group span {
            font-size: 12px;
          }
          .magic-action-btn {
            padding: 10px 22px;
            font-size: 13px;
            border-radius: 12px;
          }
          .magic-portal-container {
            width: 105px;
            height: 105px;
            top: 50%;
            bottom: auto;
            transform: translateY(-50%) translateZ(0);
            left: 6px;
          }
          .spin-banner-wheel-img {
            transform: scale(1.15) translateZ(0);
          }
          .magic-portal-ring {
            width: 90px;
            height: 90px;
          }
          .wheel-magic-card:hover .portal-chest-asset {
            transform: scale(1.06) rotate(8deg);
          }
        }

        @media (max-width: 480px) {
          .magic-card-body {
            padding-left: 105px;
          }
          .magic-portal-container {
            width: 85px;
            height: 85px;
            left: 5px;
          }
          .magic-portal-ring {
            width: 72px;
            height: 72px;
          }
        }
      `}</style>
    </section>
  );
}
