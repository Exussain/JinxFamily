"use client";

import Image from "next/image";
import Link from "next/link";
import { categoryPathFromCode } from "../lib/productCategoryRoutes";

const promoCards = [
  {
    id: "free-fire",
    title: "فری فایر",
    image: "/images/game-cards/free-fire.webp",
    href: categoryPathFromCode("FREE_FIRE"),
  },
  {
    id: "pubg-mobile",
    title: "پابجی موبایل",
    image: "/images/game-cards/pubg-mobile.webp",
    href: categoryPathFromCode("PUBG"),
  },
  {
    id: "call-of-duty",
    title: "کالاف دیوتی",
    image: "/images/game-cards/call-of-duty.webp",
    href: categoryPathFromCode("COD_MOBILE"),
  },
  {
    id: "fortnite",
    title: "فورتنایت",
    image: "/images/game-cards/fortnite.webp",
    href: categoryPathFromCode("FORTNITE"),
    isCenter: true,
  },
  {
    id: "valorant",
    title: "والورانت",
    image: "/images/game-cards/valorant.webp",
    href: categoryPathFromCode("VALORANT"),
  },
  {
    id: "clash-royale",
    title: "کلش رویال",
    image: "/images/game-cards/clash-royale.webp",
    href: categoryPathFromCode("CLASH_ROYALE"),
  },
  {
    id: "clash-of-clans",
    title: "کلش اف کلنز",
    image: "/images/game-cards/clash-of-clans.webp",
    href: categoryPathFromCode("CLASH_OF_CLANS"),
  },
];

export default function GamePromoBanner() {
  return (
    <section className="clean-promo-banner" aria-label="فروشگاه محصولات دیجیتال گیمینگ">
      <div className="banner-card">
        {/* Floating 3D Geometric Accents matching reference image */}
        <div className="floating-shape shape-orange-left" aria-hidden="true" />
        <div className="floating-shape shape-dark-left" aria-hidden="true" />
        <div className="floating-shape shape-blue-left" aria-hidden="true" />
        <div className="floating-shape shape-blue-right" aria-hidden="true" />
        <div className="floating-shape shape-orange-right" aria-hidden="true" />
        <div className="floating-shape shape-dark-right" aria-hidden="true" />

        {/* Clean Center Header */}
        <div className="banner-header">
          <h2 className="banner-title">
            جینکس فمیلی، فروشگاه محصولات دیجیتال گیمینگ
          </h2>
          <p className="banner-subtitle">
            خانه‌ای برای گیمرها و خرید محصولات دیجیتال شما ❤️
          </p>
        </div>

        {/* Proportional WEBP Game Cards Grid with Centered Hero Fortnite */}
        <div className="cards-grid">
          {promoCards.map((card, idx) => (
            <Link
              key={card.id}
              href={card.href}
              className={`game-card-link ${card.isCenter ? "is-center-hero" : ""}`}
              aria-label={card.title}
            >
              <div className="card-media">
                <Image
                  src={card.image}
                  alt={card.title}
                  fill
                  sizes="(max-width: 640px) 28vw, 14vw"
                  className="card-img"
                  priority={card.isCenter || idx < 4}
                />
              </div>
            </Link>
          ))}
        </div>
      </div>

      <style jsx>{`
        .clean-promo-banner {
          position: relative;
          width: 100%;
          padding: 16px 0 24px 0;
        }

        .banner-card {
          position: relative;
          max-width: 1280px;
          margin: 0 auto;
          background: var(--card, #ffffff);
          border-radius: 28px;
          padding: 38px 24px 34px 24px;
          box-shadow: var(--shadow, 0 10px 30px rgba(0, 0, 0, 0.06));
          overflow: hidden;
          border: 1px solid var(--line, rgba(226, 232, 240, 0.8));
          transition: background 0.3s ease, border-color 0.3s ease;
        }

        /* Floating 3D Geometric Accents */
        .floating-shape {
          position: absolute;
          pointer-events: none;
          z-index: 1;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
        }

        .shape-orange-left {
          top: 28px;
          right: 10%;
          width: 22px;
          height: 22px;
          background: linear-gradient(135deg, #ff9f43, #ff5252);
          border-radius: 7px;
          transform: rotate(25deg);
          animation: floatSlow 6s ease-in-out infinite alternate;
        }

        .shape-dark-left {
          top: 70px;
          right: 4%;
          width: 28px;
          height: 28px;
          background: #2d3748;
          border-radius: 8px;
          transform: rotate(-18deg);
          animation: floatSlow 7s ease-in-out 1s infinite alternate;
        }

        .shape-blue-left {
          top: 115px;
          right: 9%;
          width: 32px;
          height: 22px;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          border-radius: 8px;
          transform: rotate(38deg);
          animation: floatSlow 5.5s ease-in-out 0.5s infinite alternate;
        }

        .shape-blue-right {
          top: 32px;
          left: 6%;
          width: 36px;
          height: 28px;
          background: linear-gradient(135deg, #4f46e5, #3b82f6);
          border-radius: 10px;
          transform: rotate(-22deg);
          animation: floatSlow 6.5s ease-in-out 1.5s infinite alternate;
        }

        .shape-orange-right {
          top: 100px;
          left: 10%;
          width: 22px;
          height: 22px;
          background: linear-gradient(135deg, #ff9f43, #f59e0b);
          border-radius: 7px;
          transform: rotate(15deg);
          animation: floatSlow 7.5s ease-in-out 0.2s infinite alternate;
        }

        .shape-dark-right {
          top: 125px;
          left: 4%;
          width: 26px;
          height: 26px;
          background: #1a202c;
          border-radius: 8px;
          transform: rotate(-12deg);
          animation: floatSlow 6s ease-in-out 0.8s infinite alternate;
        }

        @keyframes floatSlow {
          0% {
            transform: translateY(0px) rotate(0deg);
          }
          100% {
            transform: translateY(-6px) rotate(5deg);
          }
        }

        .banner-header {
          position: relative;
          z-index: 2;
          text-align: center;
          max-width: 780px;
          margin: 0 auto 28px auto;
        }

        .banner-title {
          font-size: 1.85rem;
          font-weight: 800;
          color: var(--text, #0f172a);
          letter-spacing: -0.02em;
          line-height: 1.35;
          margin: 0 0 10px 0;
        }

        .banner-subtitle {
          font-size: 0.9rem;
          line-height: 1.7;
          color: var(--muted, #64748b);
          margin: 0;
          font-weight: 500;
        }

        /* 7-column CSS Grid placing Fortnite at exact center slot */
        .cards-grid {
          position: relative;
          z-index: 2;
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          gap: 14px;
          align-items: center;
          width: 100%;
        }

        /* Standard game cards (40% glow of Fortnite) */
        .game-card-link {
          display: block;
          position: relative;
          width: 100%;
          border-radius: 18px;
          overflow: visible;
          text-decoration: none;
          filter: drop-shadow(0 0 7px rgba(147, 197, 253, 0.35)) drop-shadow(0 4px 10px rgba(0, 0, 0, 0.15));
          transition: all 0.35s cubic-bezier(0.25, 0.8, 0.25, 1);
        }

        .game-card-link:hover {
          transform: translateY(-6px) scale(1.06);
          filter: drop-shadow(0 0 14px rgba(147, 197, 253, 0.65)) drop-shadow(0 8px 18px rgba(0, 0, 0, 0.3));
        }

        /* Center Hero Fortnite card (100% vibrant animated glow & enlarged scale) */
        .game-card-link.is-center-hero {
          z-index: 5;
          transform: scale(1.16);
          filter: drop-shadow(0 0 16px rgba(59, 130, 246, 0.85)) drop-shadow(0 0 32px rgba(96, 165, 250, 0.6)) drop-shadow(0 10px 24px rgba(37, 99, 235, 0.5));
          animation: fortniteGlowPulse 4s ease-in-out infinite alternate;
        }

        .game-card-link.is-center-hero:hover {
          transform: scale(1.22) translateY(-4px);
          filter: drop-shadow(0 0 24px rgba(59, 130, 246, 1)) drop-shadow(0 0 45px rgba(147, 197, 253, 0.85)) drop-shadow(0 14px 30px rgba(37, 99, 235, 0.7));
        }

        @keyframes fortniteGlowPulse {
          0% {
            filter: drop-shadow(0 0 14px rgba(59, 130, 246, 0.75)) drop-shadow(0 0 28px rgba(96, 165, 250, 0.5));
            transform: scale(1.15);
          }
          100% {
            filter: drop-shadow(0 0 22px rgba(59, 130, 246, 0.95)) drop-shadow(0 0 42px rgba(147, 197, 253, 0.75)) drop-shadow(0 12px 28px rgba(37, 99, 235, 0.6));
            transform: scale(1.18);
          }
        }

        .card-media {
          position: relative;
          width: 100%;
          padding-top: 135%;
          background: transparent !important;
        }

        :global(.card-img) {
          object-fit: contain !important;
          background: transparent !important;
          transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
        }

        .game-card-link:hover :global(.card-img) {
          transform: scale(1.06);
        }

        @media (max-width: 768px) {
          .cards-grid {
            grid-template-columns: repeat(7, minmax(0, 1fr));
            gap: 6px;
          }
          .game-card-link.is-center-hero {
            transform: scale(1.12);
          }
          .banner-card {
            padding: 24px 12px 18px 12px;
            border-radius: 20px;
          }
          .banner-title {
            font-size: 1.35rem;
          }
          .banner-subtitle {
            font-size: 0.82rem;
          }
          .floating-shape {
            opacity: 0.35;
            scale: 0.6;
          }
        }

        @media (max-width: 480px) {
          .cards-grid {
            display: flex;
            flex-wrap: nowrap;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            padding: 10px 4px;
            scrollbar-width: none;
            -webkit-overflow-scrolling: touch;
          }
          .cards-grid::-webkit-scrollbar {
            display: none;
          }
          .game-card-link {
            flex: 0 0 95px;
            scroll-snap-align: center;
          }
          .game-card-link.is-center-hero {
            flex: 0 0 110px;
            transform: scale(1.08);
          }
        }
      `}</style>
    </section>
  );
}
