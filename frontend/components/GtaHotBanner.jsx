"use client";
import { useRouter } from "next/navigation";

// Standalone "HOT" GTA VI pre-order banner — sits between the hero slider and
// the products grid on the homepage (see how_should_ot_be_placed_homepage sketch).
export default function GtaHotBanner() {
  const router = useRouter();
  const go = () => router.push("/gta6");

  return (
    <section className="gta-banner" onClick={go} role="link" tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } }}
      aria-label="پیش‌خرید GTA VI">
      <div className="gta-banner-bg" aria-hidden="true" />
      <div className="gta-banner-inner">
        <div className="gta-banner-art">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/products/gta6/ps5-ultimate.webp" alt="Grand Theft Auto VI" loading="lazy" decoding="async" />
          <span className="gta-banner-glow" aria-hidden="true" />
        </div>
        <div className="gta-banner-copy">
          <span className="gta-banner-hot">🔥 HOT · داغ‌ترین عرضه</span>
          <h2 className="gta-banner-title">پیش‌خرید <i>GTA VI</i></h2>
          <p className="gta-banner-sub">
            Grand Theft Auto VI برای PS5 و Xbox Series X|S — نسخه استاندارد و آلتیمیت،
            ظرفیت‌های متنوع و فعال‌سازی قانونی.
          </p>
          <div className="gta-banner-tags">
            <span>PlayStation 5</span>
            <span>Xbox Series X|S</span>
            <span>Standard &amp; Ultimate</span>
          </div>
          <button type="button" className="gta-banner-cta" onClick={(e) => { e.stopPropagation(); go(); }}>
            مشاهده و پیش‌خرید
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
      </div>

      <style jsx>{`
        .gta-banner {
          position: relative; margin-top: 22px; border-radius: 22px; overflow: hidden; cursor: pointer;
          border: 1px solid rgba(124,77,255,0.4); box-shadow: 0 20px 50px rgba(124,77,255,0.18);
          isolation: isolate; transition: transform .2s ease, box-shadow .2s ease;
        }
        .gta-banner:hover { transform: translateY(-3px); box-shadow: 0 26px 60px rgba(255,45,155,0.25); }
        .gta-banner:focus-visible { outline: 3px solid #21d4fd; outline-offset: 3px; }
        .gta-banner-bg {
          position: absolute; inset: 0; z-index: 0;
          background:
            radial-gradient(circle at 8% 10%, rgba(255,45,155,0.35), transparent 40%),
            radial-gradient(circle at 95% 20%, rgba(33,212,253,0.22), transparent 45%),
            radial-gradient(circle at 60% 110%, rgba(124,77,255,0.40), transparent 55%),
            linear-gradient(120deg, #1a0b34 0%, #0c0a22 55%, #06121b 100%);
        }
        .gta-banner-inner {
          position: relative; z-index: 1; display: grid; grid-template-columns: 200px 1fr; gap: 24px;
          align-items: center; padding: 22px 26px;
        }
        .gta-banner-art { position: relative; }
        .gta-banner-art img {
          width: 100%; height: auto; display: block; border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.12); box-shadow: 0 16px 40px rgba(0,0,0,0.5); position: relative; z-index: 1;
        }
        .gta-banner-glow {
          position: absolute; inset: -10px; z-index: 0; border-radius: 22px; filter: blur(22px); opacity: 0.6;
          background: conic-gradient(from 120deg, #ff2d9b, #21d4fd, #7c4dff, #ff2d9b);
        }
        .gta-banner-copy { display: grid; gap: 10px; }
        .gta-banner-hot {
          justify-self: start; font-size: 12px; font-weight: 900; color: #fff; padding: 5px 12px; border-radius: 999px;
          background: linear-gradient(135deg, #ff2d9b, #7c4dff); box-shadow: 0 8px 20px rgba(255,45,155,0.4);
          animation: gtaHotPulse 2s ease-in-out infinite;
        }
        @keyframes gtaHotPulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.04); } }
        .gta-banner-title { margin: 0; font-size: clamp(26px, 4.5vw, 40px); font-weight: 900; color: #fff; line-height: 1; }
        .gta-banner-title i {
          font-style: italic; background: linear-gradient(135deg, #fff, #21d4fd 45%, #ff2d9b);
          -webkit-background-clip: text; background-clip: text; color: transparent;
        }
        .gta-banner-sub { margin: 0; font-size: 13.5px; line-height: 1.85; color: #d7d2ff; max-width: 620px; }
        .gta-banner-tags { display: flex; gap: 8px; flex-wrap: wrap; }
        .gta-banner-tags span {
          font-size: 11.5px; font-weight: 800; color: #e8e6ff; padding: 4px 11px; border-radius: 999px;
          background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.14);
        }
        .gta-banner-cta {
          justify-self: start; margin-top: 4px; display: inline-flex; align-items: center; gap: 8px;
          padding: 12px 22px; border: none; border-radius: 13px; cursor: pointer; font-family: inherit;
          font-weight: 900; font-size: 15px; color: #1a0b34; background: linear-gradient(135deg, #21d4fd, #b721ff);
          box-shadow: 0 12px 28px rgba(183,33,255,0.35); transition: transform .15s ease, filter .15s ease;
        }
        .gta-banner-cta:hover { transform: translateY(-2px); filter: brightness(1.06); }
        .gta-banner-cta svg { transition: transform .15s ease; }
        .gta-banner:hover .gta-banner-cta svg { transform: translateX(-4px); }

        @media (max-width: 760px) {
          .gta-banner-inner { grid-template-columns: 1fr; gap: 16px; padding: 18px; text-align: center; }
          .gta-banner-art { max-width: 200px; margin: 0 auto; }
          .gta-banner-hot, .gta-banner-cta { justify-self: center; }
          .gta-banner-tags { justify-content: center; }
        }
      `}</style>
    </section>
  );
}
