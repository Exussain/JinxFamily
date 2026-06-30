"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import CountUp from "./CountUp";
import "./CounterStat.css";

const FALLBACK_TESTIMONIALS = [
  {
    id: 1,
    date: { day: "8", month: "تیر" },
    username: "رادمان پیرا",
    product: "کروپک فورتنایت",
    productSlug: "fortnite-crew-pack",
    review: "عالی کیفیت سفارش عالی",
    rating: 5,
    isVerified: true,
  },
  {
    id: 2,
    date: { day: "6", month: "تیر" },
    username: "Sleepy ODi",
    product: "کروپک فورتنایت",
    productSlug: "fortnite-crew-pack",
    review: "همیشه سریع عالی و بهترین قیمت",
    rating: 5,
    isVerified: true,
  },
  {
    id: 3,
    date: { day: "6", month: "تیر" },
    username: "Sleepy ODi",
    product: "پیشخرید GTA VI (Grand Theft Auto VI)",
    productSlug: "gta6",
    review: "مثل همیشه عالی پشتیبانی عالی تر کارتون درسته",
    rating: 5,
    isVerified: true,
  },
  {
    id: 4,
    date: { day: "5", month: "تیر" },
    username: "Arian夜ツ",
    product: "کروپک فورتنایت",
    productSlug: "fortnite-crew-pack",
    review: "پشتیبانی عالی اصلا هرچی بگم کمه الان برام اومد",
    rating: 5,
    isVerified: true,
  },
  {
    id: 5,
    date: { day: "5", month: "تیر" },
    username: "برسام زینی",
    product: "کروپک فورتنایت",
    productSlug: "fortnite-crew-pack",
    review: "عالی و سریع ممنون از نوبیکس شاپ❤️🔥",
    rating: 5,
    isVerified: true,
  },
  {
    id: 6,
    date: { day: "4", month: "تیر" },
    username: "Fenrirexe",
    product: "کروپک فورتنایت",
    productSlug: "fortnite-crew-pack",
    review: "مناسب ترین قیمت بهترین پشتیبانی سریعترین فعالسازی واقعا عالیه",
    rating: 5,
    isVerified: true,
  },
  {
    id: 7,
    date: { day: "4", month: "تیر" },
    username: "علیرضا",
    product: "پیشخرید GTA VI (Grand Theft Auto VI)",
    productSlug: "gta6",
    review: "مرسی از نوبیکس، امیدوارم هر چه سریعتر به دستم برسه",
    rating: 5,
    isVerified: true,
  }
];

export default function CounterStat({ to = 0, label = "سفارش‌های موفق" }) {
  const [testimonials, setTestimonials] = useState(FALLBACK_TESTIMONIALS);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Fetch testimonials from API if available
  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "";
    fetch(`${apiBase}/api/testimonials`, { cache: "no-store" })
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

  // Auto-slide every 5 seconds
  useEffect(() => {
    if (testimonials.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [testimonials]);

  return (
    <div className="mini-hero stat combined-stat-testimonials">
      {/* Header Info */}
      <div className="stat-card-header">
        <div className="stat-info-group">
          <h3 className="stat-count-title">
            <CountUp to={to || 1417} duration={2500} />
            <span className="stat-label"> {label}</span>
          </h3>
          <span className="stat-growth-text">هر روز درحال افزایش</span>
        </div>
        
        <div className="stat-avatar-circle">
          <img 
            src="/customer-service-people-3d-avatar-free-png.webp" 
            alt="پشتیبانی نوبیکس شاپ" 
            className="stat-avatar-image" 
          />
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="compact-tm-wrapper">
        <div className="compact-tm-carousel-body">
          {testimonials.map((t, idx) => {
            const href = t.productSlug ? `/product/${t.productSlug}#comment-${t.id}` : null;
            const CardContent = (
              <>
                <div className="compact-tm-card-header">
                  <div className="compact-tm-user-info">
                    <div className="compact-tm-avatar">{t.username.charAt(0)}</div>
                    <div className="compact-tm-user-meta">
                      <div className="compact-tm-username">{t.username}</div>
                      <div className="compact-tm-product" title={t.product}>{t.product}</div>
                    </div>
                  </div>
                  <div className="compact-tm-rating">
                    {"★".repeat(t.rating)}
                  </div>
                </div>
                <div className="compact-tm-review">"{t.review}"</div>
                <div className="compact-tm-footer">
                  <span className="compact-tm-verified">✓ خرید تایید شده</span>
                  <span className="compact-tm-date">{t.date.day} {t.date.month}</span>
                </div>
              </>
            );

            return href ? (
              <Link 
                href={href} 
                key={idx} 
                className={`compact-tm-slide ${idx === currentIndex ? 'active' : ''}`}
                style={{ textDecoration: "none" }}
              >
                <div className="compact-tm-card-inner">
                  {CardContent}
                </div>
              </Link>
            ) : (
              <div 
                key={idx} 
                className={`compact-tm-slide ${idx === currentIndex ? 'active' : ''}`}
              >
                <div className="compact-tm-card-inner">
                  {CardContent}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
