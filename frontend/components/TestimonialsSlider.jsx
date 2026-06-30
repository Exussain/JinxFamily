"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';

const FALLBACK_TESTIMONIALS = [
  {
    id: 1,
    date: { day: '24', month: 'آبان' },
    username: 'محمدرضا',
    product: 'کرو پک فورتنایت',
    productSlug: 'fortnite-crew-pack',
    review: 'دومین خریدم بود و این بار هم کمتر از ۱۰ دقیقه فعال شد؛ مثل همیشه بی‌دردسر.',
    rating: 5,
  },
  {
    id: 2,
    date: { day: '22', month: 'آبان' },
    username: 'رادین',
    product: 'V-Bucks 2400',
    productSlug: null,
    review: 'کد خیلی سریع تحویل شد و پشتیبانی تلگرام هم محترمانه همراهی کرد؛ عالی بود.',
    rating: 5,
  },
  {
    id: 3,
    date: { day: '21', month: 'آبان' },
    username: 'الهه',
    product: 'اشتراک Spotify',
    productSlug: 'spotify-subscription',
    review: 'اول شک داشتم ولی همه چیز فوری و شفاف انجام شد؛ حس اعتماد کامل گرفتم.',
    rating: 5,
  },
  {
    id: 4,
    date: { day: '18', month: 'آبان' },
    username: 'مهدی',
    product: 'GTA VI - Ultimate',
    productSlug: 'gta6',
    review: 'پیش خرید رو انجام دادم، پشتیبانی بسیار عالی و سریع جواب دادن.',
    rating: 5,
  }
];

export default function TestimonialsSlider() {
  const [testimonials, setTestimonials] = useState(FALLBACK_TESTIMONIALS);

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || '';
    fetch(`${apiBase}/api/testimonials`, { cache: 'no-store' })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data && Array.isArray(data.testimonials) && data.testimonials.length > 0) {
          const mapped = data.testimonials.map((t) => ({
            id: t.id,
            date: t.date,
            username: t.author_name,
            product: t.product_name,
            productSlug: t.product_slug || null,
            review: t.text,
            rating: t.rating || 5,
            isVerified: t.is_verified_purchase,
          }));
          setTestimonials(mapped);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="tm-slider-wrapper">
      <div className="tm-header">
        <h3 className="tm-title">نظرات خریداران</h3>
        <p className="tm-subtitle">نظرات واقعی کاربرانی که به ما اعتماد کردند</p>
      </div>
      
      <div className="tm-track-container">
        <div className="tm-track">
          {testimonials.map((t, idx) => {
            const href = t.productSlug ? `/product/${t.productSlug}#comment-${t.id}` : null;
            const Card = (
              <div className="tm-card" key={idx}>
                <div className="tm-card-header">
                  <div className="tm-user-info">
                    <div className="tm-avatar">{t.username.charAt(0)}</div>
                    <div>
                      <div className="tm-username">{t.username}</div>
                      <div className="tm-product">{t.product}</div>
                    </div>
                  </div>
                  <div className="tm-rating">
                    {"★".repeat(t.rating)}{"☆".repeat(5-t.rating)}
                  </div>
                </div>
                <div className="tm-review">"{t.review}"</div>
                <div className="tm-date">{t.date.day} {t.date.month}</div>
              </div>
            );
            return href ? (
              <Link href={href} key={idx} style={{ textDecoration: 'none' }}>
                {Card}
              </Link>
            ) : Card;
          })}
        </div>
      </div>

      <style jsx>{`
        .tm-slider-wrapper {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-top: 24px;
          max-width: 100%;
          overflow: hidden;
        }
        .tm-header {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .tm-title {
          font-size: 18px;
          font-weight: 900;
          color: #fff;
          margin: 0;
        }
        .tm-subtitle {
          font-size: 12px;
          color: #a5b4cf;
          margin: 0;
        }
        .tm-track-container {
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          scrollbar-width: none; /* Firefox */
          -webkit-overflow-scrolling: touch;
          padding-bottom: 8px;
          margin: 0 -16px; /* Negate padding on mobile to scroll to edge */
          padding: 0 16px 8px 16px;
        }
        .tm-track-container::-webkit-scrollbar {
          display: none; /* Chrome/Safari/Edge */
        }
        .tm-track {
          display: inline-flex;
          gap: 16px;
        }
        .tm-card {
          width: 280px;
          min-width: 280px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          scroll-snap-align: start;
          transition: transform 0.2s, background 0.2s;
        }
        .tm-card:hover {
          transform: translateY(-2px);
          background: rgba(255,255,255,0.05);
          border-color: rgba(255,255,255,0.15);
        }
        .tm-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .tm-user-info {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .tm-avatar {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, #10b981, #059669);
          color: #fff;
          font-weight: 900;
          display: grid;
          place-items: center;
          font-size: 16px;
        }
        .tm-username {
          font-size: 14px;
          font-weight: 800;
          color: #fff;
        }
        .tm-product {
          font-size: 11px;
          color: #a5b4cf;
          margin-top: 2px;
        }
        .tm-rating {
          color: #fbbf24;
          font-size: 12px;
          letter-spacing: 1px;
        }
        .tm-review {
          font-size: 13px;
          color: #cbd5e1;
          line-height: 1.6;
          flex: 1;
        }
        .tm-date {
          font-size: 11px;
          color: #64748b;
          text-align: left;
        }
      `}</style>
    </div>
  );
}
