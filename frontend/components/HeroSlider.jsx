"use client";
import { useEffect, useState, useMemo } from "react";
import { useCart } from "../lib/useCart";
import { resolveProductImage } from "../lib/productImageHelpers";
import Link from "next/link";
import "./HeroSlider.css";

const fallbackProducts = [
  {
    id: 1,
    slug: "fortnite-crew-pack",
    name_fa: "کروپک فورتنایت",
    subtitle: "بتل پس + ۱۰۰۰ ویباکس + اسکین",
    image_url: "/media/products/fortnite-crew-pack-20260603004614.webp",
    price: 567000,
    original_price: 770000,
    discount_override: 26
  },
  {
    id: 34,
    slug: "gta6",
    name_fa: "پیش‌خرید GTA VI (Grand Theft Auto VI)",
    subtitle: "نسخه استاندارد و آلتیمیت — PS5 و Xbox",
    image_url: "/products/gta6/ps5-ultimate.jpg",
    price: 5258000,
    original_price: 6199000,
    discount_override: 15
  },
  {
    id: 29,
    slug: "starterpack",
    name_fa: "استارتر پک The Ace فورتنایت",
    subtitle: "The Ace Pack | اسکین انحصاری + ۸۰۰ ویباکس",
    image_url: "/media/products/starterpack-20260611201541.jpg",
    price: 769000,
    original_price: 1100000,
    discount_override: 30
  },
  {
    id: 8,
    slug: "spotify-subscription",
    name_fa: "اشتراک اسپاتیفای پریمیوم",
    subtitle: "پریمیوم بدون قطعی",
    image_url: "/media/products/spotify-subscription-20260611210226.jpg",
    price: 159000,
    original_price: 250000,
    discount_override: 36
  }
];

const toFa = (s) => String(s).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);

export default function HeroSlider({ trustCount, heroProducts = [], heroSeed = 1 }) {
  const { items, addItem, setQty } = useCart();
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  // Update timer every second
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
      const diff = midnight.getTime() - now.getTime();
      
      const totalSec = Math.floor(Math.max(0, diff) / 1000);
      const hours = Math.floor(totalSec / 3600);
      const mins = Math.floor((totalSec % 3600) / 60);
      const secs = totalSec % 60;
      
      setTimeLeft({ hours, minutes: mins, seconds: secs });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  // Merge API products and fallbacks dynamically
  const products = useMemo(() => {
    const targetSlugs = ["fortnite-crew-pack", "gta6", "starterpack", "spotify-subscription"];
    return targetSlugs.map(slug => {
      const apiProd = heroProducts.find(p => p.slug === slug);
      const fallback = fallbackProducts.find(p => p.slug === slug);
      if (apiProd) {
        return {
          ...fallback,
          ...apiProd,
          price: Number(apiProd.price) > 0 ? Number(apiProd.price) : (Number(apiProd.min_price) > 0 ? Number(apiProd.min_price) : fallback.price),
          original_price: Number(apiProd.original_price) > 0 ? Number(apiProd.original_price) : fallback.original_price
        };
      }
      return fallback;
    }).filter(Boolean);
  }, [heroProducts]);

  const handleAddToCart = (e, p) => {
    e.preventDefault();
    e.stopPropagation();
    
    const price = Number(p.price) > 0 ? Number(p.price) : (Number(p.min_price) > 0 ? Number(p.min_price) : 0);
    const { imageSrc } = resolveProductImage(p);
    
    addItem({
      product_id: p.id,
      name: p.name_fa,
      price: price,
      quantity: 1,
      slug: p.slug,
      image: imageSrc
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cart:add'));
    }
  };

  return (
    <section className="nubix-hero-slider">
      {/* Background glow or accent */}
      <div className="discount-glow-accent" />
      
      {/* Header section */}
      <div className="discount-header">
        <div className="discount-badge-alert">
          ⚡ آفر طلایی امروز (فرصت محدود)
        </div>
        <h2 className="discount-title">
          تخفیفات ویژه را از دست ندهید!
        </h2>
        <p className="discount-subtitle">
          تخفیفات داغ و روزانه نوبیکس شاپ؛ هر روز ۴ آفر ویژه با قیمت‌های استثنایی که فقط تا پایان امروز اعتبار دارند!
        </p>
      </div>

      {/* Countdown Timer */}
      <div className="discount-timer-wrapper">
        <div className="timer-box">
          <span className="timer-value">{toFa(timeLeft.seconds.toString().padStart(2, "0"))}</span>
          <span className="timer-label">ثانیه</span>
        </div>
        <div className="timer-box">
          <span className="timer-value">{toFa(timeLeft.minutes.toString().padStart(2, "0"))}</span>
          <span className="timer-label">دقیقه</span>
        </div>
        <div className="timer-box">
          <span className="timer-value">{toFa(timeLeft.hours.toString().padStart(2, "0"))}</span>
          <span className="timer-label">ساعت</span>
        </div>
      </div>

      {/* Product cards container */}
      <div className="discount-products-grid">
        {products.map(p => {
          const price = Number(p.price) > 0 ? Number(p.price) : (Number(p.min_price) > 0 ? Number(p.min_price) : 0);
          const original = Number(p.original_price) > 0 ? Number(p.original_price) : Math.round(price * 1.15);
          
          // Let's compute discount percent
          let discountPercent = p.discount_override;
          if (!discountPercent) {
            discountPercent = original && price < original ? Math.round(((original - price) / original) * 100) : 0;
          }

          const hasCartItem = items.some(x => x.product_id === p.id);
          const { imageSrc } = resolveProductImage(p);

          return (
            <div key={p.slug} className="discount-product-card">
              <Link href={`/product/${p.slug}`} className="card-link-overlay" aria-label={p.name_fa} />
              
              <div className="product-card-img-wrapper">
                <img src={imageSrc} alt={p.name_fa} loading="lazy" />
              </div>

              <div className="product-card-info">
                <h3 className="product-card-title">{p.name_fa}</h3>
                
                <div className="product-card-badge-row">
                  <span className="discount-tag">فوق ویژه: {toFa(discountPercent)}٪ تخفیف</span>
                </div>

                <div className="product-card-price-row">
                  <div className="price-column">
                    <span className="old-price">
                      {toFa(original.toLocaleString('fa-IR'))} تومان
                    </span>
                    <span className="current-price">
                      {toFa(price.toLocaleString('fa-IR'))} تومان
                    </span>
                  </div>
                  
                  {hasCartItem ? (
                    <div className="product-qty-control" onClick={(e) => e.stopPropagation()}>
                      <button 
                        className="qty-btn minus"
                        onClick={(e) => {
                          e.preventDefault();
                          const item = items.find(x => x.product_id === p.id);
                          if (item) {
                            setQty(p.id, item.quantity - 1);
                          }
                        }}
                        aria-label="کاهش تعداد"
                      >
                        −
                      </button>
                      <span className="qty-value">{toFa(items.find(x => x.product_id === p.id)?.quantity || 1)}</span>
                      <button 
                        className="qty-btn plus"
                        onClick={(e) => {
                          e.preventDefault();
                          const item = items.find(x => x.product_id === p.id);
                          if (item) {
                            setQty(p.id, item.quantity + 1);
                          }
                        }}
                        aria-label="افزایش تعداد"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={(e) => handleAddToCart(e, p)}
                      className="add-to-cart-icon-btn"
                      aria-label="افزودن به سبد خرید"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="9" cy="21" r="1"></circle>
                        <circle cx="20" cy="21" r="1"></circle>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
