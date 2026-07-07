"use client";
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import ProductCard from '../../components/ProductCard';

const categoryGradients = {
  "FORTNITE": "linear-gradient(135deg, #8B5CF6, #EC4899)",
  "AI": "linear-gradient(135deg, #0ea5e9, #6366f1)",
  "GIFTCARDS": "linear-gradient(135deg, #F59E0B, #EF4444)",
  "GAMES": "linear-gradient(135deg, #10B981, #059669)",
  "SUBSCRIPTIONS": "linear-gradient(135deg, #3B82F6, #06B6D4)",
};

const categoryIcons = {
  "FORTNITE": "🎮",
  "AI": "🤖",
  "GIFTCARDS": "🎁",
  "GAMES": "🎯",
  "SUBSCRIPTIONS": "⭐",
};

export default function ProductsClient({ categories = [] }) {
  const [activeCat, setActiveCat] = useState('');
  const scrollAreaRef = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    if (categories.length > 0 && !activeCat) {
      setActiveCat(categories[0].code);
    }
  }, [categories, activeCat]);

  // Active Category tracking via Intersection Observer
  useEffect(() => {
    const options = {
      root: null, // viewport
      rootMargin: '-20% 0px -60% 0px', // check elements around center area
      threshold: 0
    };

    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveCat(entry.target.id);
        }
      });
    }, options);

    categories.forEach((cat) => {
      const el = document.getElementById(`cat-sec-${cat.code}`);
      if (el) observerRef.current.observe(el);
    });

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [categories]);

  const scrollToSection = (code) => {
    setActiveCat(code);
    const el = document.getElementById(`cat-sec-${code}`);
    if (el) {
      // Offset scroll to account for sticky navigation header
      const yOffset = -120; 
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const styleContent = `
    .products-layout-wrapper {
      display: grid;
      grid-template-columns: 260px 1fr;
      gap: 32px;
      margin-top: 32px;
      position: relative;
    }
    
    .products-sidebar-container {
      position: sticky;
      top: 110px;
      height: fit-content;
      display: flex;
      flex-direction: column;
      gap: 12px;
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: 20px;
      padding: 16px;
      box-shadow: var(--shadow);
    }

    .sidebar-cat-btn {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 14px;
      border: 1px solid transparent;
      background: transparent;
      color: var(--text);
      font-weight: 700;
      font-size: 14px;
      cursor: pointer;
      text-align: right;
      transition: all 0.25s ease;
    }

    .sidebar-cat-btn:hover {
      background: color-mix(in srgb, var(--bg) 40%, transparent);
    }

    .sidebar-cat-btn.active {
      background: var(--primary);
      color: #fff;
      border-color: var(--primary);
      box-shadow: 0 4px 12px rgba(124, 58, 237, 0.2);
    }

    .products-main-content {
      display: flex;
      flex-direction: column;
      gap: 40px;
    }

    .cat-section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
      border-bottom: 1px solid var(--line);
      padding-bottom: 12px;
    }

    .cat-section-title-wrapper {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .cat-section-gradient-icon {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 20px;
    }

    .cat-section-title-wrapper h2 {
      margin: 0;
      font-size: 19px;
      font-weight: 800;
      color: var(--text);
    }

    .cat-section-count {
      font-size: 12px;
      color: var(--muted);
      background: color-mix(in srgb, var(--bg) 60%, transparent);
      padding: 4px 10px;
      border-radius: 99px;
      font-weight: 700;
    }

    /* Horizontal Slider Container (اسلاید طور) */
    .cat-products-slider-row {
      display: flex;
      gap: 16px;
      overflow-x: auto;
      scroll-snap-type: x mandatory;
      padding-bottom: 16px;
      scrollbar-width: thin;
      scrollbar-color: var(--line) transparent;
      -webkit-overflow-scrolling: touch;
    }

    .cat-products-slider-row::-webkit-scrollbar {
      height: 6px;
    }
    
    .cat-products-slider-row::-webkit-scrollbar-track {
      background: transparent;
    }

    .cat-products-slider-row::-webkit-scrollbar-thumb {
      background: var(--line);
      border-radius: 99px;
    }

    .slider-item-wrapper {
      flex: 0 0 280px;
      scroll-snap-align: start;
      position: relative;
    }

    /* Mobile view styles mapping */
    @media (max-width: 992px) {
      .products-layout-wrapper {
        grid-template-columns: 1fr;
        gap: 20px;
      }

      .products-sidebar-container {
        position: sticky;
        top: 75px;
        z-index: 50;
        flex-direction: row;
        overflow-x: auto;
        padding: 10px;
        border-radius: 14px;
        gap: 8px;
        background: color-mix(in srgb, var(--card) 85%, transparent);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border-color: var(--line);
        margin-bottom: 12px;
        scrollbar-width: none;
      }

      .products-sidebar-container::-webkit-scrollbar {
        display: none;
      }

      .sidebar-cat-btn {
        white-space: nowrap;
        padding: 8px 14px;
        font-size: 13px;
        border-radius: 99px;
      }
    }
  `;

  return (
    <div className="products-client-container">
      <style dangerouslySetInnerHTML={{ __html: styleContent }} />

      {/* Category landing hero banner */}
      <section className="category-hero">
        <div className="category-hero-glow" aria-hidden="true" />
        <div className="category-hero-top">
          <nav aria-label="مسیر صفحه" className="category-crumbs">
            <Link href="/" className="category-crumb-link">نوبیکس شاپ</Link>
            <span className="category-crumb-sep">/</span>
            <span className="category-crumb-current">محصولات فروشگاه</span>
          </nav>
          <Link href="/" className="category-home-btn">
            <span className="category-home-btn-arrow">←</span>
            <span>بازگشت به صفحه اصلی</span>
          </Link>
        </div>
        <div className="category-hero-body">
          <div className="category-kicker">⚡ سایدبار تعاملی و ویترین هوشمند</div>
          <h1 className="category-title" style={{ fontSize: '26px', fontWeight: '900', color: '#fff', margin: '12px 0' }}>
            خرید محصولات دیجیتال و گیمینگ
          </h1>
          <p className="category-description" style={{ color: 'rgba(255,255,255,0.75)', fontSize: '15px', lineHeight: '1.8' }}>
            محصولات را بر اساس دسته‌بندی و میزان محبوبیت مشاهده کنید. با کلیک بر روی گزینه‌های سایدبار به راحتی بین بخش‌های مختلف فروشگاه حرکت کنید.
          </p>
        </div>
      </section>

      <div className="products-layout-wrapper">
        {/* Sidebar drawer switcher */}
        <aside className="products-sidebar-container">
          {categories.map((cat) => (
            <button
              key={cat.code}
              type="button"
              className={`sidebar-cat-btn${activeCat === cat.code ? ' active' : ''}`}
              onClick={() => scrollToSection(cat.code)}
            >
              <span>{categoryIcons[cat.code] || "🛍️"}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </aside>

        {/* Staked panels */}
        <div className="products-main-content" ref={scrollAreaRef}>
          {categories.map((cat) => {
            const gradient = categoryGradients[cat.code] || "linear-gradient(135deg, #6366F1, #8B5CF6)";
            const icon = categoryIcons[cat.code] || "🛍️";
            const targetUrl = `/category/${cat.code.toLowerCase()}`;

            return (
              <section key={cat.code} id={`cat-sec-${cat.code}`} style={{ scrollMarginTop: '180px' }}>
                <div className="cat-section-header">
                  <div className="cat-section-title-wrapper">
                    <div className="cat-section-gradient-icon" style={{ background: gradient }}>
                      {icon}
                    </div>
                    <h2>{cat.name}</h2>
                  </div>
                  <Link href={targetUrl} className="cat-section-count" style={{ textDecoration: 'none' }}>
                    مشاهده همه ({cat.productCount.toLocaleString('fa-IR')}) ←
                  </Link>
                </div>

                {cat.products.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--muted)' }}>
                    محصولی در این دسته‌بندی وجود ندارد.
                  </div>
                ) : (
                  <div className="cat-products-slider-row">
                    {cat.products.map((p) => (
                      <div key={p.id || p.slug} className="slider-item-wrapper">
                        <ProductCard p={p} imageFit="cover" />
                      </div>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
