"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import CategoriesSection from "../../components/CategoriesSection";
import ProductCard from "../../components/ProductCard";

const SORT_OPTIONS = [
  { value: "popularity", label: "پرفروش‌ترین" },
  { value: "showcase", label: "ترتیب ویترین" },
  { value: "price_asc", label: "ارزان‌ترین" },
  { value: "price_desc", label: "گران‌ترین" },
  { value: "alphabetical", label: "الفبایی" },
];

const fortniteOrderMap = {
  "fortnite-crew-pack": 0,
  crewpack: 0,
  "fortnite-starter-pack": 1,
  "lego-starter-pack": 1,
  starterpack: 1,
  "v-bucks": 2,
  "fortnite-battle-pass": 3,
  "change-region-turkey": 4,
};

const priceOf = (product) => {
  const price = Number(product?.price);
  const minPrice = Number(product?.min_price);
  return price > 0 ? price : (minPrice > 0 ? minPrice : Number.POSITIVE_INFINITY);
};

const byShowcase = (a, b) =>
  Number(a.display_order ?? 999) - Number(b.display_order ?? 999) || Number(b.id || 0) - Number(a.id || 0);

export default function ProductsClient({ categories = [] }) {
  const searchParams = useSearchParams();
  const [activeCat, setActiveCat] = useState("FORTNITE");
  const [searchQuery, setSearchQuery] = useState("");
  const [showOutOfStock, setShowOutOfStock] = useState(true);
  const [sortBy, setSortBy] = useState("popularity");

  useEffect(() => {
    const rawCategory = searchParams.get("category") || searchParams.get("cat") || "";
    if (!rawCategory) return;
    const category = categories.find(
      (item) => item.code.toUpperCase() === rawCategory.trim().toUpperCase() || item.name === rawCategory.trim(),
    );
    if (category) setActiveCat(category.code);
  }, [searchParams, categories]);

  const activeCategory = categories.find((category) => category.code === activeCat) || categories[0];

  const filteredProducts = useMemo(() => {
    if (!activeCategory) return [];

    const query = searchQuery.trim().toLowerCase();
    const items = activeCategory.products.filter((product) => {
      if (!showOutOfStock && (product.ordering_disabled || product.customer_ordering_disabled || product.purchasable === false)) {
        return false;
      }
      if (!query) return true;
      return [product.name_fa, product.subtitle, product.slug].some((value) => value?.toLowerCase().includes(query));
    });

    return items.sort((a, b) => {
      if (sortBy === "price_asc") return priceOf(a) - priceOf(b) || byShowcase(a, b);
      if (sortBy === "price_desc") return priceOf(b) - priceOf(a) || byShowcase(a, b);
      if (sortBy === "alphabetical") return (a.name_fa || "").localeCompare(b.name_fa || "", "fa");
      if (sortBy === "showcase") return byShowcase(a, b);

      if (activeCategory.code === "FORTNITE") {
        const rankDifference = (fortniteOrderMap[a.slug] ?? 999) - (fortniteOrderMap[b.slug] ?? 999);
        if (rankDifference) return rankDifference;
      }
      return byShowcase(a, b);
    });
  }, [activeCategory, searchQuery, showOutOfStock, sortBy]);

  const styleContent = `
    @media (max-width: 992px) {
      .products-layout-wrapper {
        grid-template-columns: 1fr;
        gap: 24px;
      }

      .products-sidebar-container {
        position: relative;
        top: 0;
        padding: 12px;
        border-radius: 16px;
        flex-direction: row;
        align-items: flex-end;
        gap: 10px;
        overflow-x: auto;
        overscroll-behavior-inline: contain;
        scrollbar-width: thin;
      }

      .products-sidebar-container .filter-group {
        flex: 0 0 auto;
        min-width: 180px;
        gap: 7px;
      }

      .products-sidebar-container .filter-group:nth-child(2) {
        min-width: max-content;
      }

      .sidebar-cat-list {
        flex-direction: row;
        gap: 6px;
      }

      .sidebar-cat-btn {
        width: auto;
        min-height: 42px;
        padding: 9px 12px;
        white-space: nowrap;
      }

      .products-clean-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 576px) {
      .products-page-main {
        padding: 18px 12px 44px !important;
      }

      .products-client-container {
        margin-inline: -4px;
      }

      .products-minimal-header {
        padding: 8px 0 12px;
        margin-bottom: 14px;
      }

      .products-minimal-top {
        margin-bottom: 8px !important;
      }

      .products-minimal-top .category-home-btn {
        padding: 7px 9px !important;
      }

      .products-minimal-top .category-home-btn span:not(.category-home-btn-arrow) {
        display: none;
      }

      .products-minimal-title {
        margin-top: 4px;
        font-size: 21px;
      }

      .products-fomo-subtitle {
        font-size: 11.5px;
      }

      .products-layout-wrapper {
        gap: 16px;
        margin-top: 14px;
      }

      .products-sidebar-container {
        margin-inline: -8px;
        padding: 8px;
        gap: 8px;
        border-radius: 12px;
      }

      .products-sidebar-container .filter-title {
        display: none !important;
      }

      .products-sidebar-container .filter-group {
        min-width: 158px;
        gap: 0;
      }

      .products-sidebar-container .filter-group:nth-child(2) {
        min-width: max-content;
      }

      .products-sidebar-container .filter-group:nth-child(3) {
        min-width: max-content;
        align-self: center;
      }

      .search-input,
      .sort-select {
        min-height: 40px;
        padding: 9px 11px;
        border-width: 1px;
        border-radius: 10px;
        font-size: 12px;
      }

      .sidebar-cat-btn {
        min-height: 40px;
        padding: 8px 10px;
        border-radius: 10px;
        font-size: 12px;
      }

      .checkbox-label {
        min-height: 40px;
        padding: 0 10px;
        border: 1px solid var(--line);
        border-radius: 10px;
        white-space: nowrap;
        font-size: 12px;
      }

      .checkbox-input {
        width: 16px;
        height: 16px;
      }

      .cat-section-header {
        padding-bottom: 10px;
      }

      .cat-section-gradient-icon {
        width: 34px !important;
        height: 34px !important;
      }

      .cat-section-title-wrapper h2 {
        font-size: 16px;
      }

      .cat-section-count {
        padding: 5px 8px;
        font-size: 10px;
      }

      .products-clean-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
      }
    }

    @media (max-width: 340px) {
      .products-clean-grid {
        grid-template-columns: 1fr;
      }
    }
  `;

  return (
    <div className="products-client-container">
      <style dangerouslySetInnerHTML={{ __html: styleContent }} />

      {/* Products Minimal Header */}
      <section className="products-minimal-header">
        <div className="products-minimal-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <nav aria-label="مسیر صفحه" className="category-crumbs" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Link href="/" className="category-crumb-link" style={{ color: 'var(--muted)', fontSize: '13.5px', textDecoration: 'none' }}>جینکس فمیلی</Link>
            <span className="category-crumb-sep" style={{ color: 'var(--muted)', fontSize: '12px' }}>/</span>
            <span className="category-crumb-current" style={{ color: 'var(--text)', fontSize: '13.5px', fontWeight: '700' }}>محصولات فروشگاه</span>
          </nav>
          <Link href="/" className="category-home-btn">
            <span className="category-home-btn-arrow">←</span>
            <span>بازگشت به صفحه اصلی</span>
          </Link>
        </div>
        <h1 className="products-minimal-title">محصولات جینکس فمیلی</h1>
        <div className="products-fomo-subtitle">
          <span className="products-fomo-pulse"></span>
          <span>هر روز تخفیف‌های ویژه برای تمام سرویس‌ها</span>
        </div>
      </section>

      <CategoriesSection
        categories={categories.map((category) => category.name)}
        variant="products"
        className="category-page-navigation"
        activeCategoryCode={activeCategory?.code}
      />

      <section className="category-products-section products-catalogue-section" aria-label="محصولات فروشگاه">
        <div className="category-product-toolbar products-catalogue-toolbar">
          <div>
            <p className="category-product-toolbar-label">{activeCategory?.name || "محصولات فروشگاه"}</p>
            <h1 className="category-product-toolbar-title">محصولات فروشگاه</h1>
          </div>
          <div className="category-sort-options" role="group" aria-label="مرتب‌سازی محصولات">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`category-sort-option${sortBy === option.value ? " is-active" : ""}`}
                aria-pressed={sortBy === option.value}
                onClick={() => setSortBy(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="products-catalogue-filters">
          <label className="products-catalogue-search">
            <span className="sr-only">جستجوی محصول</span>
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
            <input
              type="search"
              placeholder="جستجو در محصولات این دسته‌بندی..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </label>
          <label className="products-catalogue-stock-toggle">
            <input
              type="checkbox"
              checked={showOutOfStock}
              onChange={(event) => setShowOutOfStock(event.target.checked)}
            />
            <span>نمایش محصولات ناموجود</span>
          </label>
          <span className="products-catalogue-count">{filteredProducts.length.toLocaleString("fa-IR")} محصول</span>
        </div>

        {filteredProducts.length ? (
          <div className="cards">
            {filteredProducts.map((product) => <ProductCard key={product.id || product.slug} p={product} imageFit="cover" />)}
          </div>
        ) : (
          <div className="products-catalogue-empty">
            <h2>محصولی یافت نشد</h2>
            <p>فیلترها یا عبارت جستجو را تغییر دهید و دوباره تلاش کنید.</p>
          </div>
        )}
      </section>
    </div>
  );
}
