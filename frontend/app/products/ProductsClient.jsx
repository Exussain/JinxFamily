"use client";
import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ProductCard from '../../components/ProductCard';
import CategoriesSection from '../../components/CategoriesSection';

const categoryGradients = {
  "FORTNITE": "linear-gradient(135deg, #8B5CF6, #EC4899)",
  "AI": "linear-gradient(135deg, #0ea5e9, #6366f1)",
  "GIFTCARDS": "linear-gradient(135deg, #F59E0B, #EF4444)",
  "GAMES": "linear-gradient(135deg, #10B981, #059669)",
  "ROCKET_LEAGUE": "linear-gradient(135deg, #2563eb, #f97316)",
  "SUBSCRIPTIONS": "linear-gradient(135deg, #3B82F6, #06B6D4)",
};

const categorySvgIcons = {
  "FORTNITE": (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"></rect><path d="M12 12h.01"></path><path d="M17 10h2"></path><path d="M8 12H6"></path><path d="M7 11v2"></path></svg>
  ),
  "AI": (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"></rect><rect x="9" y="9" width="6" height="6"></rect><path d="M9 1v3"></path><path d="M15 1v3"></path><path d="M9 20v3"></path><path d="M15 20v3"></path><path d="M20 9h3"></path><path d="M20 15h3"></path><path d="M1 9h3"></path><path d="M1 15h3"></path></svg>
  ),
  "GIFTCARDS": (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"></rect><path d="M12 2v20"></path><path d="M2 11h20"></path><path d="M12 7.5a2.5 2.5 0 0 0 2.5-2.5C14.5 3 12 2 12 2s-2.5 1-2.5 3a2.5 2.5 0 0 0 2.5 2.5z"></path><path d="M12 7.5A2.5 2.5 0 0 0 9.5 5C9.5 3 12 2 12 2s2.5 1 2.5 3a2.5 2.5 0 0 0-2.5 2.5z"></path></svg>
  ),
  "GAMES": (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line></svg>
  ),
  "ROCKET_LEAGUE": (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"></circle><path d="M12 3v18M3 12h18"></path><path d="M8 8l8 8M16 8l-8 8"></path></svg>
  ),
  "SUBSCRIPTIONS": (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
  )
};

// Custom sorting weights for Fortnite products
const fortniteOrderMap = {
  "fortnite-crew-pack": 0,
  "crewpack": 0,
  "fortnite-starter-pack": 1,
  "lego-starter-pack": 1,
  "starterpack": 1,
  "v-bucks": 2,
  "fortnite-battle-pass": 3,
  "change-region-turkey": 4
};

export default function ProductsClient({ categories = [] }) {
  const searchParams = useSearchParams();
  const [activeCat, setActiveCat] = useState('FORTNITE');
  const [searchQuery, setSearchQuery] = useState('');
  const [showOutOfStock, setShowOutOfStock] = useState(true);
  const [sortBy, setSortBy] = useState('popularity');

  // Automatically select active category if passed in URL (?category=... or ?cat=...)
  useEffect(() => {
    const rawCatParam = searchParams.get('category') || searchParams.get('cat') || '';
    if (!rawCatParam) return;
    const cleanParam = rawCatParam.trim();
    const matchedCategory = categories.find(
      cat => cat.code.toUpperCase() === cleanParam.toUpperCase() || cat.name === cleanParam
    );
    if (matchedCategory) {
      setActiveCat(matchedCategory.code);
    }
  }, [searchParams, categories]);

  // Filter and sort products dynamically
  const filteredProducts = useMemo(() => {
    const selectedCategory = categories.find(cat => cat.code === activeCat);
    if (!selectedCategory) return [];

    let list = [...selectedCategory.products];

    // 1) Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(p => 
        p.name_fa?.toLowerCase().includes(q) || 
        p.subtitle?.toLowerCase().includes(q) ||
        p.slug?.toLowerCase().includes(q)
      );
    }

    // 2) Filter by Out of Stock (if false, hide them)
    if (!showOutOfStock) {
      list = list.filter(p => {
        const isOutOfStock = p.ordering_disabled || p.customer_ordering_disabled || p.purchasable === false;
        return !isOutOfStock;
      });
    }

    // 3) Sort products
    list.sort((a, b) => {
      // Primary sorting logic
      if (sortBy === 'popularity') {
        if (activeCat === 'FORTNITE') {
          const aRank = fortniteOrderMap[a.slug] !== undefined ? fortniteOrderMap[a.slug] : 999;
          const bRank = fortniteOrderMap[b.slug] !== undefined ? fortniteOrderMap[b.slug] : 999;
          if (aRank !== bRank) return aRank - bRank;
        }
        // Fallback to default display order
        const aOrder = a.display_order !== undefined ? a.display_order : 999;
        const bOrder = b.display_order !== undefined ? b.display_order : 999;
        return aOrder - bOrder;
      }

      if (sortBy === 'price_asc') {
        const aPrice = Number(a.price ?? a.min_price ?? 0);
        const bPrice = Number(b.price ?? b.min_price ?? 0);
        // Handle 0 price (out of stock/no price) by placing them last
        if (aPrice === 0) return 1;
        if (bPrice === 0) return -1;
        return aPrice - bPrice;
      }

      if (sortBy === 'price_desc') {
        const aPrice = Number(a.price ?? a.min_price ?? 0);
        const bPrice = Number(b.price ?? b.min_price ?? 0);
        return bPrice - aPrice;
      }

      if (sortBy === 'alphabetical') {
        return (a.name_fa || "").localeCompare(b.name_fa || " ", 'fa');
      }

      return 0;
    });

    return list;
  }, [categories, activeCat, searchQuery, showOutOfStock, sortBy]);

  const activeCategoryInfo = categories.find(cat => cat.code === activeCat);
  const styleContent = `
    .products-minimal-header {
      padding: 16px 0;
      border-bottom: 1px solid var(--line);
      margin-bottom: 24px;
    }
    
    .products-minimal-title {
      font-size: 28px;
      font-weight: 900;
      color: var(--text);
      margin: 8px 0 6px 0;
    }
    
    .products-fomo-subtitle {
      font-size: 13.5px;
      font-weight: 700;
      color: var(--primary);
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .products-fomo-pulse {
      width: 8px;
      height: 8px;
      background-color: var(--primary);
      border-radius: 50%;
      display: inline-block;
      animation: products-pulse-anim 1.5s infinite ease-in-out;
    }

    @keyframes products-pulse-anim {
      0% { transform: scale(0.8); opacity: 0.5; }
      50% { transform: scale(1.2); opacity: 1; }
      100% { transform: scale(0.8); opacity: 0.5; }
    }

    .products-layout-wrapper {
      display: grid;
      grid-template-columns: 264px minmax(0, 1fr);
      gap: 24px;
      margin-top: 32px;
      position: relative;
    }
    
    .products-sidebar-container {
      position: sticky;
      top: 110px;
      height: fit-content;
      display: flex;
      flex-direction: column;
      gap: 0;
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: 16px;
      padding: 4px 16px;
      box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 14px 0;
    }

    .filter-group + .filter-group {
      border-top: 1px solid var(--line);
    }

    .filter-title {
      font-size: 14px;
      font-weight: 800;
      color: var(--text);
      margin: 0;
    }

    .search-input-wrapper {
      position: relative;
    }

    .search-input {
      width: 100%;
      padding: 12px 16px;
      border-radius: 14px;
      border: 2px solid var(--line);
      background: var(--bg);
      color: var(--text);
      font-size: 13.5px;
      outline: none;
      transition: border-color 0.2s ease;
    }

    .search-input:focus {
      border-color: var(--primary);
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 13.5px;
      font-weight: 700;
      color: var(--text);
      cursor: pointer;
    }

    .checkbox-input {
      width: 18px;
      height: 18px;
      accent-color: var(--primary);
      cursor: pointer;
    }

    .sort-select {
      width: 100%;
      padding: 12px 14px;
      border-radius: 14px;
      border: 2px solid var(--line);
      background: var(--bg);
      color: var(--text);
      font-size: 13.5px;
      outline: none;
      cursor: pointer;
      font-weight: 700;
    }

    .products-main-content {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .products-home-cta {
      align-items: center;
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: 14px;
      color: var(--text);
      display: flex;
      font-size: 13px;
      font-weight: 800;
      gap: 8px;
      justify-content: center;
      margin: 0 0 12px;
      min-height: 42px;
      padding: 9px 16px;
      text-decoration: none;
      transition: border-color .2s ease, background-color .2s ease, color .2s ease;
      width: 100%;
    }

    .products-home-cta:hover,
    .products-home-cta:focus-visible {
      background: color-mix(in srgb, var(--primary) 9%, var(--card));
      border-color: var(--primary);
      color: var(--primary);
      outline: none;
    }

    .products-category-navigation {
      margin-bottom: 24px;
    }

    .cat-section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--line);
      padding-bottom: 16px;
    }

    .cat-section-title-wrapper {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .cat-section-gradient-icon {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      background: var(--bg);
      border: 1px solid var(--line);
      overflow: hidden;
    }

    .cat-section-gradient-icon img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .cat-section-title-wrapper h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 900;
      color: var(--text);
    }

    .cat-section-count {
      font-size: 13px;
      color: var(--muted);
      background: color-mix(in srgb, var(--bg) 60%, transparent);
      padding: 6px 14px;
      border-radius: 99px;
      font-weight: 700;
    }

    /* Keep the catalogue in two clear columns at every viewport width. */
    .products-clean-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 20px;
    }

    @media (max-width: 992px) {
      .products-layout-wrapper {
        grid-template-columns: 1fr;
        gap: 24px;
      }

      .products-sidebar-container {
        position: relative;
        top: 0;
        padding: 4px 16px;
        border-radius: 16px;
      }

      .products-clean-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

  `;

  return (
    <div className="products-client-container">
      <style dangerouslySetInnerHTML={{ __html: styleContent }} />

      {/* Products Minimal Header */}
      <section className="products-minimal-header">
        <div className="products-minimal-top" style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
          <nav aria-label="مسیر صفحه" className="category-crumbs" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Link href="/" className="category-crumb-link" style={{ color: 'var(--muted)', fontSize: '13.5px', textDecoration: 'none' }}>نوبیکس شاپ</Link>
            <span className="category-crumb-sep" style={{ color: 'var(--muted)', fontSize: '12px' }}>/</span>
            <span className="category-crumb-current" style={{ color: 'var(--text)', fontSize: '13.5px', fontWeight: '700' }}>محصولات فروشگاه</span>
          </nav>
        </div>
        <h1 className="products-minimal-title">محصولات نوبیکس شاپ</h1>
        <div className="products-fomo-subtitle">
          <span className="products-fomo-pulse"></span>
          <span>هر روز تخفیف‌های ویژه برای تمام سرویس‌ها</span>
        </div>
      </section>

      <Link href="/" className="products-home-cta">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
          <path d="M9 22V12h6v10" />
        </svg>
        <span>بازگشت به صفحه اصلی</span>
      </Link>

      <CategoriesSection
        categories={categories.map((category) => category.name)}
        variant="products"
        className="products-category-navigation"
      />

      <div className="products-layout-wrapper">
        {/* Sidebar Filters on the Right */}
        <aside className="products-sidebar-container">
          {/* 1) Search */}
          <div className="filter-group">
            <h3 className="filter-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <span>جستجوی محصول</span>
            </h3>
            <div className="search-input-wrapper">
              <input
                type="text"
                placeholder="نام محصول را وارد کنید..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          {/* 2) Stock Availability */}
          <div className="filter-group">
            <h3 className="filter-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line><polygon points="12 22.08 12 12 3 6.92 3 17.08 12 22.08"></polygon><polygon points="12 12 21 6.92 21 17.08 12 22.08"></polygon><polygon points="12 2 3 6.92 12 12 21 6.92 12 2"></polygon><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
              <span>فیلتر موجودی</span>
            </h3>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={showOutOfStock}
                onChange={(e) => setShowOutOfStock(e.target.checked)}
                className="checkbox-input"
              />
              <span>نمایش محصولات ناموجود</span>
            </label>
          </div>

          {/* 3) Sorting */}
          <div className="filter-group">
            <h3 className="filter-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="12" x2="20" y2="12"></line><line x1="4" y1="6" x2="20" y2="6"></line><line x1="4" y1="18" x2="20" y2="18"></line></svg>
              <span>مرتب‌سازی بر اساس</span>
            </h3>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="popularity">پرفروش‌ترین‌ها (پیش‌فرض)</option>
              <option value="price_asc">قیمت: از کم به زیاد</option>
              <option value="price_desc">قیمت: از زیاد به کم</option>
              <option value="alphabetical">حروف الفبا (الف-ی)</option>
            </select>
          </div>
        </aside>

        {/* Product Grid on the Left */}
        <div className="products-main-content">
          {activeCategoryInfo && (
            <div className="cat-section-header">
              <div className="cat-section-title-wrapper">
                <div className="cat-section-gradient-icon">
                  {/* The API-provided image is the actual category artwork. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={activeCategoryInfo.image} alt="" />
                </div>
                <h2>{activeCategoryInfo.name}</h2>
              </div>
              <span className="cat-section-count">
                تعداد نتایج: {filteredProducts.length.toLocaleString('fa-IR')} محصول
              </span>
            </div>
          )}

          {filteredProducts.length === 0 ? (
            <div style={{ padding: '64px 24px', textAlign: 'center', color: 'var(--muted)', background: 'var(--card)', border: '1px solid var(--line)', borderRadius: '24px' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px', display: 'inline-block' }}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <h3 style={{ margin: '0 0 8px 0', color: 'var(--text)', fontWeight: 800 }}>محصولی یافت نشد!</h3>
              <p style={{ margin: 0, fontSize: '14px' }}>هیچ محصولی با فیلترها و کلمات جستجو شده همخوانی ندارد.</p>
            </div>
          ) : (
            <div className="products-clean-grid">
              {filteredProducts.map((p) => (
                <div key={p.id || p.slug} style={{ position: 'relative' }}>
                  <ProductCard p={p} imageFit="cover" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
