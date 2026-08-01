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
      return Number(b.sold_count || 0) - Number(a.sold_count || 0) || byShowcase(a, b);
    });
  }, [activeCategory, searchQuery, showOutOfStock, sortBy]);

  return (
    <div className="products-catalogue">
      <section className="category-page-top products-page-top">
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
