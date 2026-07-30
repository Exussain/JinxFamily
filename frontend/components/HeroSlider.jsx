"use client";
import { useEffect, useState, useMemo, useRef, useCallback } from "react";
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
    discount_override: 26,
    badge_label: "🔥 پرفروش هفته"
  },
  {
    id: 3,
    slug: "v-bucks",
    name_fa: "وی‌باکس فورتنایت",
    subtitle: "شارژ سریع و قانونی اکانت",
    image_url: "/products/product_vbucks.webp",
    price: 345000,
    original_price: 450000,
    discount_override: 23,
    badge_label: "⚡ محبوب‌ترین"
  },
  {
    id: 34,
    slug: "gta6",
    name_fa: "پیش‌خرید GTA VI (Grand Theft Auto VI)",
    subtitle: "نسخه استاندارد و آلتیمیت — PS5 و Xbox",
    image_url: "/products/gta6/ps5-ultimate.webp",
    price: 5258000,
    original_price: 6199000,
    discount_override: 15,
    badge_label: "🚀 داغ‌ترین"
  },
  {
    id: 10,
    slug: "gemini-subscription",
    name_fa: "اشتراک گوگل جیمینای پریمیوم",
    subtitle: "هوش مصنوعی فوق پیشرفته گوگل",
    image_url: "/products/gemini.webp",
    price: 890000,
    original_price: 1150000,
    discount_override: 22,
    badge_label: "🤖 پر مخاطب"
  },
  {
    id: 9,
    slug: "chatgpt-subscription",
    name_fa: "اشتراک ChatGPT Plus",
    subtitle: "دسترسی به GPT-4o و استدلال هوشمند",
    image_url: "/products/chatgpt.webp",
    price: 980000,
    original_price: 1250000,
    discount_override: 21,
    badge_label: "💎 ویژه"
  },
  {
    id: 29,
    slug: "starterpack",
    name_fa: "استارتر پک The Ace فورتنایت",
    subtitle: "The Ace Pack | اسکین انحصاری + ۸۰۰ ویباکس",
    image_url: "/media/products/starterpack-20260611201541.webp",
    price: 769000,
    original_price: 1100000,
    discount_override: 30,
    badge_label: "🔥 آفر طلایی"
  },
  {
    id: 8,
    slug: "spotify-subscription",
    name_fa: "اشتراک اسپاتیفای پریمیوم",
    subtitle: "پریمیوم بدون قطعی و کاملا قانونی",
    image_url: "/media/products/spotify-subscription-20260611210226.webp",
    price: 528000,
    original_price: 660000,
    discount_override: 20,
    badge_label: "🎵 پرفروش"
  },
  {
    id: 11,
    slug: "lego-starter-pack",
    name_fa: "استارتر پک لگو فورتنایت",
    subtitle: "Lego Starter Pack فورتنایت",
    image_url: "/products/lego_starter_pack.webp",
    price: 490000,
    original_price: 650000,
    discount_override: 25,
    badge_label: "⚡ محبوب"
  }
];

const toFa = (s) => String(s).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);

function DailyCountdown() {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

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

  return (
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
  );
}

export default function HeroSlider({ heroProducts = [] }) {
  const { items, addItem, setQty } = useCart();
  const scrollRef = useRef(null);
  
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const [hasMoved, setHasMoved] = useState(false);

  // Smart selection algorithm: only pick active & purchasable products from site
  const products = useMemo(() => {
    const activeApiProds = (heroProducts || []).filter(p => 
      p && 
      p.slug && 
      p.purchasable !== false && 
      p.active !== false && 
      !p.ordering_disabled
    );

    const sourceList = activeApiProds.length > 0 ? activeApiProds : fallbackProducts;

    const prioritySlugs = [
      "fortnite-crew-pack",
      "v-bucks",
      "gta6",
      "gemini-subscription",
      "chatgpt-subscription",
      "starterpack",
      "fortnite-battle-pass",
      "spotify-subscription",
      "lego-starter-pack",
      "rocket-league-credits"
    ];

    const mapped = sourceList.map(p => {
      const fb = fallbackProducts.find(f => f.slug === p.slug);
      const currentPrice = Number(p.price) > 0 ? Number(p.price) : (Number(p.min_price) > 0 ? Number(p.min_price) : (fb?.price || 0));
      let origPrice = Number(p.original_price);
      if (!origPrice || origPrice <= currentPrice) {
        if (fb?.original_price && fb.original_price > currentPrice) {
          origPrice = fb.original_price;
        } else {
          origPrice = Math.round(currentPrice * 1.20);
        }
      }
      const discount = p.discount_override || (fb?.discount_override) || (origPrice > currentPrice ? Math.round(((origPrice - currentPrice) / origPrice) * 100) : 15);
      
      const badge = fb?.badge_label || (discount >= 25 ? "🔥 آفر طلایی" : (p.is_hot ? "⚡ پرفروش" : "⭐ پر مخاطب"));

      return {
        ...fb,
        ...p,
        price: currentPrice,
        original_price: origPrice,
        discount_override: discount,
        badge_label: badge
      };
    });

    const scored = mapped.map(p => {
      let score = 0;
      const pIdx = prioritySlugs.indexOf(p.slug);
      if (pIdx !== -1) {
        score += (prioritySlugs.length - pIdx) * 10;
      }
      if (p.discount_override) {
        score += Number(p.discount_override);
      }
      if (p.display_order && p.display_order > 0) {
        score += 20;
      }
      if (p.is_hot) score += 15;
      return { product: p, score };
    });

    scored.sort((a, b) => b.score - a.score);

    return scored.map(s => s.product);
  }, [heroProducts]);

  const [autoScrollActive, setAutoScrollActive] = useState(true);
  const autoScrollActiveRef = useRef(true);

  const stopAutoScroll = useCallback(() => {
    if (autoScrollActiveRef.current) {
      autoScrollActiveRef.current = false;
      setAutoScrollActive(false);
    }
  }, []);

  // Infinite smooth ultra-slow auto-scroll loop (~24px per second)
  useEffect(() => {
    if (!autoScrollActive) return;

    let animId;
    let lastTime = performance.now();
    let currentPos = 0;

    const step = (now) => {
      if (!autoScrollActiveRef.current || !scrollRef.current) return;

      const el = scrollRef.current;
      const elapsed = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      // Half of scrollWidth is 1 full set of products (since list is duplicated)
      const singleSetWidth = el.scrollWidth / 2;

      if (singleSetWidth > 0) {
        // Smooth auto-scroll speed: 36px per second (1.5x faster)
        const speed = 36;
        currentPos += speed * elapsed;

        if (currentPos >= singleSetWidth) {
          currentPos %= singleSetWidth;
        }

        // Apply RTL scroll
        el.scrollLeft = -currentPos;
      }

      if (autoScrollActiveRef.current) {
        animId = requestAnimationFrame(step);
      }
    };

    animId = requestAnimationFrame(step);

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [autoScrollActive]);

  const scrollSlider = (direction) => {
    stopAutoScroll();
    if (!scrollRef.current) return;
    const scrollAmount = 300;
    const delta = direction === "left" ? -scrollAmount : scrollAmount;
    scrollRef.current.scrollBy({ left: delta, behavior: "smooth" });
  };

  const handleMouseDown = (e) => {
    stopAutoScroll();
    if (!scrollRef.current) return;
    isDraggingRef.current = true;
    startXRef.current = e.pageX - scrollRef.current.offsetLeft;
    scrollLeftRef.current = scrollRef.current.scrollLeft;
    setHasMoved(false);
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current || !scrollRef.current) return;
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.3;
    if (Math.abs(walk) > 4) {
      setHasMoved(true);
    }
    scrollRef.current.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleAddToCart = (e, p) => {
    stopAutoScroll();
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

  // Duplicate items array during auto-scroll for seamless infinite loop
  const displayProducts = autoScrollActive && products.length > 0 ? [...products, ...products] : products;

  return (
    <section className="nubix-hero-slider">
      {/* Background glow or accent */}
      <div className="discount-glow-accent" />
      
      {/* Header section */}
      <div className="discount-header">
        <h1 className="discount-title">
          داغ‌ترین و پرفروش‌ترین محصولات این هفته
        </h1>
        <p className="discount-subtitle">
          محبوب‌ترین محصولات سایت بر اساس بیشترین بازدید و فروش؛ پیشنهادهای ویژه با قیمت‌های استثنایی!
        </p>
      </div>

      {/* Isolated countdown timer */}
      <DailyCountdown />

      {/* Products Horizontal Slider Wrapper */}
      <div className="discount-slider-wrapper">
        <button 
          type="button" 
          className="slider-nav-btn prev-btn" 
          onClick={() => scrollSlider('right')} 
          aria-label="محصولات قبلی"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>

        <button 
          type="button" 
          className="slider-nav-btn next-btn" 
          onClick={() => scrollSlider('left')} 
          aria-label="محصولات بعدی"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>

        <div 
          ref={scrollRef} 
          className={`discount-products-grid horizontal-scroll ${autoScrollActive ? 'is-autoscrolling' : ''}`}
          onMouseDown={handleMouseDown}
          onTouchStart={stopAutoScroll}
          onWheel={stopAutoScroll}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {displayProducts.map((p, heroIdx) => {
            const price = Number(p.price) > 0 ? Number(p.price) : (Number(p.min_price) > 0 ? Number(p.min_price) : 0);
            let original = Number(p.original_price) > 0 ? Number(p.original_price) : Math.round(price * 1.20);
            if (original <= price) {
              original = Math.round(price * 1.20);
            }
            
            let discountPercent = p.discount_override;
            if (!discountPercent || original <= price) {
              discountPercent = original && price < original ? Math.round(((original - price) / original) * 100) : 0;
            }

            const hasCartItem = items.some(x => x.product_id === p.id);
            const { imageSrc } = resolveProductImage(p);

            const cardHref = {
              'fortnite-crew-pack': '/crewpack',
              'gta6': '/gta6',
              'v-bucks': '/vbucks',
              'gemini-subscription': '/gemini',
              'lego-starter-pack': '/lego'
            }[p.slug] || `/product/${p.slug}`;

            return (
              <div key={p.slug || p.id || heroIdx} className="discount-product-card">
                {p.badge_label && (
                  <div className="card-popular-badge">
                    {p.badge_label}
                  </div>
                )}

                <Link
                  href={cardHref}
                  className="card-link-overlay"
                  aria-label={p.name_fa}
                  onClick={(e) => {
                    if (hasMoved) {
                      e.preventDefault();
                      e.stopPropagation();
                    }
                  }}
                />
                
                <div className="product-card-img-wrapper">
                  <img
                    src={imageSrc}
                    alt={p.name_fa}
                    decoding="async"
                    loading={heroIdx < 4 ? "eager" : "lazy"}
                    {...(heroIdx === 0 ? { fetchPriority: 'high' } : {})}
                  />
                </div>

                <div className="product-card-info">
                  <h3 className="product-card-title">{p.name_fa}</h3>
                  
                  <div className="product-card-badge-row">
                    <span className="discount-tag">تخفیف ویژه: {toFa(discountPercent)}٪</span>
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
      </div>
    </section>
  );
}

