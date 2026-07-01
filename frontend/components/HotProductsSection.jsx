"use client";

export default function HotProductsSection() {
  const openSpin = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("open-spin-wheel"));
    }
  };

  return (
    <section className="hot-section">
      {/* 3D Spin Wheel Banner */}
      <div className="spin-banner" onClick={openSpin} role="button" tabIndex={0}>
        {/* Glow ambient background elements clipped inside the banner */}
        <div className="spin-banner-glows-wrapper" aria-hidden="true">
          <div className="spin-banner-glow-1" />
          <div className="spin-banner-glow-2" />
        </div>

        <div className="spin-banner-inner">
          {/* Right side content (RTL) */}
          <div className="spin-banner-content">
            <span className="spin-banner-badge">🎡 چهارشنبه‌های طلایی نوبیکس</span>
            <div className="spin-banner-text">
              <strong>گردونه شانس رو بچرخون!</strong>
              <span>هر هفته بچرخان، تا ۲۰٪ تخفیف یا اعتبار رایگان کیف پول برنده شو.</span>
            </div>
          </div>

          {/* Button CTA */}
          <div className="spin-banner-action">
            <span className="spin-banner-btn">بچرخون! 🚀</span>
          </div>

          {/* Left side 3D asset overflowing the container */}
          <div className="spin-banner-image-container">
            <img
              src="/images/lucky_chest.png"
              alt="صندوقچه شانس نوبیکس"
              className="spin-banner-wheel-img"
            />
          </div>
        </div>
      </div>

      <style jsx>{`
        .hot-section {
          margin: 30px 0;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        /* Spin Banner Container */
        .spin-banner {
          background: linear-gradient(135deg, #0f0c2d 0%, #171242 45%, #2c1a4d 100%);
          border-radius: 20px;
          cursor: pointer;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.08);
          transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.1), box-shadow 0.3s ease;
          overflow: visible; /* To allow the 3D asset to overflow top & bottom */
          position: relative;
        }

        /* Ambient Glow Behind Content */
        .spin-banner-glows-wrapper {
          position: absolute;
          inset: 0;
          overflow: hidden;
          border-radius: 20px;
          pointer-events: none;
          z-index: 1;
        }
        .spin-banner-glow-1 {
          position: absolute;
          right: -40px;
          top: -40px;
          width: 200px;
          height: 200px;
          background: radial-gradient(circle, rgba(168, 85, 247, 0.22) 0%, transparent 70%);
          pointer-events: none;
        }
        .spin-banner-glow-2 {
          position: absolute;
          left: 40px;
          bottom: -40px;
          width: 200px;
          height: 200px;
          background: radial-gradient(circle, rgba(6, 182, 212, 0.18) 0%, transparent 70%);
          pointer-events: none;
        }

        /* Shine Reflection Effect */
        .spin-banner::before {
          content: '';
          position: absolute;
          top: 0; left: -100%; width: 50%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
          transform: skewX(-20deg);
          animation: shine 5s infinite;
          z-index: 2;
          border-radius: 20px;
        }
        @keyframes shine {
          0% { left: -100%; }
          15% { left: 200%; }
          100% { left: 200%; }
        }

        .spin-banner:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 40px rgba(124, 58, 237, 0.35);
        }

        /* Inner Content Wrapper */
        .spin-banner-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 22px 30px;
          padding-left: 180px; /* Leave space for absolute image on left */
          position: relative;
          z-index: 3;
          direction: rtl;
        }

        /* Content Info Block */
        .spin-banner-content {
          display: flex;
          flex-direction: column;
          gap: 8px;
          z-index: 2;
        }

        /* Golden Pill Badge */
        .spin-banner-badge {
          font-size: 11.5px;
          font-weight: 800;
          color: #fbbf24;
          background: rgba(251, 191, 36, 0.08);
          border: 1px solid rgba(251, 191, 36, 0.2);
          padding: 4px 12px;
          border-radius: 100px;
          width: fit-content;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
          box-shadow: 0 2px 8px rgba(251, 191, 36, 0.1);
        }

        /* Text Block Styling */
        .spin-banner-text {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .spin-banner-text strong {
          font-size: 19px;
          font-weight: 950;
          color: #ffffff;
          text-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
        }
        .spin-banner-text span {
          font-size: 13.5px;
          color: #cbd5e1;
          font-weight: 500;
          opacity: 0.9;
        }

        /* CTA Button Container and Design */
        .spin-banner-action {
          z-index: 2;
        }
        .spin-banner-btn {
          background: #ffffff;
          color: #171242;
          border: none;
          padding: 11px 26px;
          border-radius: 12px;
          font-weight: 900;
          font-size: 14.5px;
          box-shadow: 0 4px 15px rgba(255, 255, 255, 0.25);
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          display: inline-block;
          text-align: center;
        }
        .spin-banner:hover .spin-banner-btn {
          background: #f8fafc;
          transform: scale(1.06);
          box-shadow: 0 8px 25px rgba(255, 255, 255, 0.4);
        }

        /* 3D Wheel Image Asset & Positioning */
        .spin-banner-image-container {
          position: absolute;
          left: 15px;
          top: -25px;
          bottom: -25px;
          width: 150px;
          height: 150px;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          z-index: 4;
        }
        .spin-banner-image-container::before {
          content: '';
          position: absolute;
          width: 130px;
          height: 130px;
          background: radial-gradient(circle, rgba(168, 85, 247, 0.45) 0%, rgba(236, 72, 153, 0.05) 50%, transparent 70%);
          z-index: -1;
          animation: pulse-glow 3s ease-in-out infinite alternate;
          pointer-events: none;
        }
        .spin-banner-wheel-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          animation: float-chest 4s ease-in-out infinite;
          filter: drop-shadow(0 10px 25px rgba(0, 0, 0, 0.55));
          transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .spin-banner:hover .spin-banner-wheel-img {
          transform: scale(1.1) translateY(-6px) rotate(-2deg);
          filter: drop-shadow(0 20px 40px rgba(168, 85, 247, 0.25)) drop-shadow(0 15px 30px rgba(0, 0, 0, 0.65));
        }

        @keyframes float-chest {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-7px) rotate(1.5deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }

        @keyframes pulse-glow {
          0% { transform: scale(0.9); opacity: 0.5; }
          100% { transform: scale(1.15); opacity: 0.95; }
        }

        /* Responsive Breakpoints */
        @media (max-width: 900px) {
          .spin-banner-inner {
            padding-left: 150px;
          }
          .spin-banner-image-container {
            width: 130px;
            height: 130px;
            top: -15px;
            bottom: -15px;
          }
        }

        @media (max-width: 768px) {
          .spin-banner {
            border-radius: 16px;
          }
          .spin-banner-inner {
            flex-direction: column;
            align-items: flex-start;
            gap: 14px;
            padding: 16px 20px;
            padding-left: 120px; /* Leave room for mobile sized image on left */
          }
          .spin-banner-badge {
            font-size: 10.5px;
            padding: 3px 10px;
          }
          .spin-banner-text strong {
            font-size: 15.5px;
          }
          .spin-banner-text span {
            font-size: 11.5px;
          }
          .spin-banner-btn {
            padding: 8px 18px;
            font-size: 12.5px;
            border-radius: 10px;
          }
          .spin-banner-image-container {
            width: 100px;
            height: 100px;
            top: 50%;
            bottom: auto;
            transform: translateY(-50%);
            left: 10px;
          }
          .spin-banner:hover .spin-banner-wheel-img {
            transform: scale(1.05) rotate(15deg);
          }
        }

        @media (max-width: 480px) {
          .spin-banner-inner {
            padding-left: 105px;
          }
          .spin-banner-image-container {
            width: 85px;
            height: 85px;
            left: 5px;
          }
        }
      `}</style>
    </section>
  );
}
