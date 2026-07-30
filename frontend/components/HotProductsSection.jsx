"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function HotProductsSection() {
  const [isWednesday, setIsWednesday] = useState(false);

  useEffect(() => {
    setIsWednesday(new Date().getDay() === 3);
  }, []);

  const openSpin = (e) => {
    if (typeof window !== "undefined") {
      // Crawlers follow the real /spin href; JS users get the modal instead.
      e.preventDefault();
      window.dispatchEvent(new Event("open-spin-wheel"));
    }
  };

  return (
    <section className="hot-section">
      {/* 3D Spin Wheel Banner */}
      <Link href="/spin" className={`spin-banner ${isWednesday ? "is-wednesday" : ""}`} onClick={openSpin}>
        <div className="spin-banner-inner">
          {/* Right side content (RTL) */}
          <div className="spin-banner-content">
            <span className="spin-banner-badge">
              <span className="badge-pulse-dot" />
              {isWednesday ? "امروز چهارشنبه‌ست ✨" : "🎡 چهارشنبه‌های طلایی نوبیکس"}
            </span>
            <div className="spin-banner-text">
              <strong>{isWednesday ? "چهارشنبه‌ست، بیا گردونتو بچرخون" : "گردونه شانس رو بچرخون!"}</strong>
              <span>{isWednesday ? "امروز شانس طلایی داری: الماس، کد تخفیف یا جایزه واقعی بگیر." : "هر هفته بچرخان، تا ۲۰٪ تخفیف یا الماس رایگان برنده شو."}</span>
            </div>
          </div>

          {/* Button CTA */}
          <div className="spin-banner-action">
            <span className="spin-banner-btn">{isWednesday ? "گردونه طلایی رو بچرخون" : "بچرخون! 🚀"}</span>
          </div>

          {/* Left side 3D asset overflowing the container */}
          <div className="spin-banner-image-container">
            <img
              src="/images/lucky_chest.webp"
              alt="صندوقچه شانس نوبیکس"
              className="spin-banner-wheel-img"
              width={150}
              height={150}
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      </Link>

      <style jsx>{`
        .hot-section {
          margin: 28px 0;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        /* Spin Banner Container */
        .spin-banner {
          display: block;
          text-decoration: none;
          color: inherit;
          cursor: pointer;
          position: relative;
          overflow: visible !important;
          margin: 32px 0;
          transition: transform 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.15);
          will-change: transform;
        }
        .spin-banner:hover {
          transform: translateY(-4px);
        }

        /* Inner Content Wrapper - Single Visible Gold Banner Card */
        .spin-banner-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px 32px;
          padding-left: 210px; /* Space for absolute 3D chest on left */
          position: relative;
          z-index: 3;
          direction: rtl;
          background:
            radial-gradient(ellipse at 85% 15%, rgba(254, 240, 138, 0.98) 0%, transparent 55%),
            radial-gradient(ellipse at 15% 85%, rgba(245, 158, 11, 0.95) 0%, transparent 60%),
            linear-gradient(135deg, #fef08a 0%, #facc15 25%, #f59e0b 60%, #d97706 100%);
          border-radius: 24px;
          border: 1.5px solid rgba(254, 240, 138, 0.85);
          box-shadow: 0 16px 40px rgba(217, 119, 6, 0.35), inset 0 1px 2px rgba(255, 255, 255, 0.85);
          overflow: visible !important;
        }

        /* Shine Reflection Effect on the Inner Gold Card */
        .spin-banner-inner::before {
          content: '';
          position: absolute;
          top: 0; left: -100%; width: 55%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.55), transparent);
          transform: skewX(-20deg) translateZ(0);
          animation: shine 4.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          z-index: 1;
          border-radius: 24px;
          pointer-events: none;
          will-change: left;
        }
        @keyframes shine {
          0% { left: -100%; }
          20% { left: 200%; }
          100% { left: 200%; }
        }

        /* Sparkle particles on the Inner Gold Card */
        .spin-banner-inner::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 24px;
          pointer-events: none;
          z-index: 1;
          background-image:
            radial-gradient(circle at 12% 30%, rgba(255, 255, 255, 0.95) 0px, rgba(255, 255, 255, 0) 2px),
            radial-gradient(circle at 28% 70%, rgba(255, 255, 255, 0.9) 0px, rgba(255, 255, 255, 0) 2.4px),
            radial-gradient(circle at 46% 18%, rgba(255, 255, 255, 0.95) 0px, rgba(255, 255, 255, 0) 1.8px),
            radial-gradient(circle at 62% 78%, rgba(255, 255, 255, 0.9) 0px, rgba(255, 255, 255, 0) 2.2px),
            radial-gradient(circle at 78% 35%, rgba(255, 255, 255, 0.95) 0px, rgba(255, 255, 255, 0) 2px),
            radial-gradient(circle at 88% 62%, rgba(255, 255, 255, 0.85) 0px, rgba(255, 255, 255, 0) 1.6px);
          background-size: 100% 100%;
          background-repeat: no-repeat;
          animation: sparkles 3.5s ease-in-out infinite;
          mix-blend-mode: screen;
          will-change: opacity;
        }
        @keyframes sparkles {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }

        .spin-banner.is-wednesday .spin-banner-inner {
          background:
            radial-gradient(circle at 18% 50%, rgba(255, 255, 255, 0.3), transparent 18%),
            linear-gradient(135deg, #2e1c00 0%, #7c4500 40%, #f59e0b 100%);
          border-color: rgba(253, 230, 138, 0.75);
          box-shadow: 0 20px 48px rgba(217, 119, 6, 0.42), inset 0 1px 1px rgba(255, 255, 255, 0.3);
        }

        /* Content Info Block */
        .spin-banner-content {
          display: flex;
          flex-direction: column;
          gap: 10px;
          z-index: 2;
        }

        /* Golden Pill Badge */
        .spin-banner-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 850;
          color: #451a03;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1.5px solid rgba(217, 119, 6, 0.4);
          padding: 5px 14px;
          border-radius: 100px;
          width: fit-content;
          box-shadow: 0 3px 10px rgba(180, 83, 9, 0.18);
          letter-spacing: -0.2px;
        }
        .badge-pulse-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: #d97706;
          box-shadow: 0 0 8px #d97706;
          animation: pulseDot 2s infinite ease-in-out;
        }
        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }

        /* Text Block Styling */
        .spin-banner-text {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .spin-banner-text strong {
          font-size: 20.5px;
          font-weight: 950;
          color: #2e1003;
          text-shadow: 0 1px 1px rgba(255, 255, 255, 0.6);
          line-height: 1.35;
        }
        .spin-banner-text span {
          font-size: 13.5px;
          color: #78350f;
          font-weight: 700;
          opacity: 0.95;
          line-height: 1.5;
        }

        /* CTA Button Container and Design */
        .spin-banner-action {
          z-index: 2;
          display: flex;
          align-items: center;
        }
        .spin-banner-btn {
          background: linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%);
          color: #fde68a;
          border: 1px solid rgba(253, 230, 138, 0.35);
          padding: 12px 28px;
          border-radius: 14px;
          font-weight: 900;
          font-size: 14.5px;
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.35);
          cursor: pointer;
          transition: transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.25s ease, background 0.25s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          text-align: center;
          white-space: nowrap;
          will-change: transform;
        }
        .spin-banner:hover .spin-banner-btn {
          background: linear-gradient(135deg, #312e81 0%, #1e1b4b 100%);
          color: #ffffff;
          transform: scale(1.08) translateY(-2px);
          box-shadow: 0 12px 30px rgba(15, 23, 42, 0.5);
        }
        .spin-banner-btn:active {
          transform: scale(0.96) translateY(1px);
        }
        :global(:root[data-theme="light"]) .spin-banner-badge {
          color: #4f46e5;
          background: rgba(99, 102, 241, 0.1);
          border: 1px solid rgba(99, 102, 241, 0.25);
          text-shadow: none;
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.08);
        }
        :global(:root[data-theme="light"]) .badge-pulse-dot {
          background-color: #6366f1;
          box-shadow: 0 0 8px #6366f1;
        }
        :global(:root[data-theme="light"]) .spin-banner-text strong {
          color: #1e1b4b;
          background: none;
          -webkit-background-clip: initial;
          -webkit-text-fill-color: initial;
          text-shadow: none;
          filter: none;
        }
        :global(:root[data-theme="light"]) .spin-banner-text span {
          color: #4338ca;
          opacity: 0.95;
        }
        :global(:root[data-theme="light"]) .spin-banner-btn {
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          color: #ffffff;
          box-shadow: 0 6px 18px rgba(99, 102, 241, 0.35);
        }
        :global(:root[data-theme="light"]) .spin-banner:hover .spin-banner-btn {
          background: linear-gradient(135deg, #4f46e5, #4338ca);
          box-shadow: 0 10px 24px rgba(99, 102, 241, 0.45);
        }
        :global(:root[data-theme="light"]) .spin-banner.is-wednesday .spin-banner-inner {
          background:
            radial-gradient(circle at 18% 50%, rgba(255, 255, 255, 0.65), transparent 18%),
            linear-gradient(135deg, #fff7ed 0%, #fde68a 48%, #f59e0b 100%);
          border-color: rgba(217, 119, 6, 0.4);
          box-shadow: 0 18px 42px rgba(217, 119, 6, 0.22);
        }

        /* 3D Wheel Image Asset & Positioning - Escaping Boundaries */
        .spin-banner-image-container {
          position: absolute;
          left: 10px;
          top: -40px;
          width: 200px;
          height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          z-index: 10;
          overflow: visible !important;
        }
        .spin-banner-image-container::before {
          content: '';
          position: absolute;
          width: 170px;
          height: 170px;
          background: radial-gradient(circle, rgba(245, 158, 11, 0.65) 0%, rgba(168, 85, 247, 0.35) 50%, transparent 70%);
          z-index: -1;
          animation: pulse-glow 3s ease-in-out infinite alternate;
          pointer-events: none;
          transform: translateZ(0);
        }
        .spin-banner-wheel-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          transform: scale(1.3) translateZ(0);
          animation: float-chest 4s ease-in-out infinite;
          filter: drop-shadow(0 20px 38px rgba(0, 0, 0, 0.7)) drop-shadow(0 0 24px rgba(245, 158, 11, 0.5));
          transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), filter 0.4s ease;
          will-change: transform, filter;
        }
        .spin-banner:hover .spin-banner-wheel-img {
          transform: scale(1.45) translateY(-14px) rotate(-5deg);
          filter: drop-shadow(0 30px 60px rgba(168, 85, 247, 0.55)) drop-shadow(0 24px 50px rgba(0, 0, 0, 0.85));
        }

        @keyframes float-chest {
          0% { transform: scale(1.28) translateY(0px) rotate(0deg); }
          50% { transform: scale(1.28) translateY(-16px) rotate(3deg); }
          100% { transform: scale(1.28) translateY(0px) rotate(0deg); }
        }

        @keyframes pulse-glow {
          0% { transform: scale(0.85); opacity: 0.5; }
          100% { transform: scale(1.3); opacity: 1; }
        }

        /* Responsive Breakpoints Optimization */
        @media (max-width: 900px) {
          .spin-banner-inner {
            padding-left: 170px;
            padding-right: 24px;
          }
          .spin-banner-image-container {
            width: 160px;
            height: 160px;
            top: -25px;
            left: 8px;
          }
        }

        @media (max-width: 768px) {
          .spin-banner {
            margin: 20px 0;
          }
          .spin-banner-inner {
            flex-direction: column;
            align-items: flex-start;
            gap: 14px;
            padding: 18px 20px;
            padding-left: 120px;
            border-radius: 20px;
          }
          .spin-banner-badge {
            font-size: 11px;
            padding: 4px 11px;
          }
          .spin-banner-text strong {
            font-size: 16px;
          }
          .spin-banner-text span {
            font-size: 12px;
          }
          .spin-banner-btn {
            padding: 9px 20px;
            font-size: 13px;
            border-radius: 11px;
          }
          .spin-banner-image-container {
            width: 115px;
            height: 115px;
            top: 50%;
            bottom: auto;
            transform: translateY(-50%) translateZ(0);
            left: 6px;
          }
          .spin-banner-wheel-img {
            transform: scale(1.15) translateZ(0);
          }
          .spin-banner:hover .spin-banner-wheel-img {
            transform: scale(1.22) rotate(-3deg);
          }
        }

        @media (max-width: 480px) {
          .spin-banner-inner {
            padding-left: 98px;
            padding-right: 14px;
            padding-top: 14px;
            padding-bottom: 14px;
            border-radius: 16px;
          }
          .spin-banner-image-container {
            width: 90px;
            height: 90px;
            left: 4px;
          }
          .spin-banner-text strong {
            font-size: 14px;
            line-height: 1.3;
          }
          .spin-banner-text span {
            font-size: 10.5px;
            line-height: 1.35;
          }
          .spin-banner-btn {
            padding: 8px 16px;
            font-size: 12px;
            border-radius: 10px;
          }
        }
      `}</style>
    </section>
  );
}
