"use client";
import { useState, useMemo } from 'react';
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
  const [activeCat, setActiveCat] = useState('FORTNITE');
  const [searchQuery, setSearchQuery] = useState('');
  const [showOutOfStock, setShowOutOfStock] = useState(true);
  const [sortBy, setSortBy] = useState('popularity');

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
  const activeGradient = categoryGradients[activeCat] || "linear-gradient(135deg, #6366F1, #8B5CF6)";
  const activeIcon = categoryIcons[activeCat] || "🛍️";

  const styleContent = `
    .products-layout-wrapper {
      display: grid;
      grid-template-columns: 300px 1fr;
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
      gap: 24px;
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: 24px;
      padding: 24px;
      box-shadow: var(--shadow);
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .filter-title {
      font-size: 14px;
      font-weight: 800;
      color: var(--text);
      border-bottom: 1px solid var(--line);
      padding-bottom: 8px;
      margin: 0;
    }

    .sidebar-cat-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
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
      width: 100%;
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
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 22px;
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

    /* Grid Layout (منظم و مرتب) */
    .products-clean-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
    }

    @media (max-width: 1200px) {
      .products-clean-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 992px) {
      .products-layout-wrapper {
        grid-template-columns: 1fr;
        gap: 24px;
      }

      .products-sidebar-container {
        position: relative;
        top: 0;
        padding: 20px;
        border-radius: 20px;
      }

      .products-clean-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 576px) {
      .products-clean-grid {
        grid-template-columns: 1fr;
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
          <div className="category-kicker">🛍️ ویترین محصولات و فیلتر پیشرفته</div>
          <h1 className="category-title" style={{ fontSize: '26px', fontWeight: '900', color: '#fff', margin: '12px 0' }}>
            خرید محصولات دیجیتال و گیمینگ
          </h1>
          <p className="category-description" style={{ color: 'rgba(255,255,255,0.75)', fontSize: '15px', lineHeight: '1.8' }}>
            دسته‌بندی مورد نظر خود را انتخاب کرده و از فیلترهای پیشرفته جهت جستجو و مرتب‌سازی دقیق استفاده کنید. امکان نمایش محصولات ناموجود جهت اطلاع‌رسانی موجودی فعال است.
          </p>
        </div>
      </section>

      <div className="products-layout-wrapper">
        {/* Sidebar Filters on the Right */}
        <aside className="products-sidebar-container">
          {/* 1) Search */}
          <div className="filter-group">
            <h3 className="filter-title">🔍 جستجوی محصول</h3>
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

          {/* 2) Categories */}
          <div className="filter-group">
            <h3 className="filter-title">📁 دسته‌بندی‌ها</h3>
            <div className="sidebar-cat-list">
              {categories.map((cat) => (
                <button
                  key={cat.code}
                  type="button"
                  className={`sidebar-cat-btn${activeCat === cat.code ? ' active' : ''}`}
                  onClick={() => setActiveCat(cat.code)}
                >
                  <span>{categoryIcons[cat.code] || "🛍️"}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 3) Stock Availability */}
          <div className="filter-group">
            <h3 className="filter-title">📦 فیلتر موجودی</h3>
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

          {/* 4) Sorting */}
          <div className="filter-group">
            <h3 className="filter-title">📊 مرتب‌سازی بر اساس</h3>
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
                <div className="cat-section-gradient-icon" style={{ background: activeGradient }}>
                  {activeIcon}
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
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
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
