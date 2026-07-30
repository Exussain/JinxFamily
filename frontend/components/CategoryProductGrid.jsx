"use client";

import { useMemo, useState } from "react";
import ProductCard from "./ProductCard";

const SORT_OPTIONS = [
  { value: "popular", label: "پرفروش‌ترین" },
  { value: "showcase", label: "ترتیب ویترین" },
  { value: "price-asc", label: "ارزان‌ترین" },
  { value: "price-desc", label: "گران‌ترین" },
  { value: "newest", label: "جدیدترین" },
];

function productPrice(product) {
  const price = Number(product?.price);
  const minPrice = Number(product?.min_price);
  return price > 0 ? price : (minPrice > 0 ? minPrice : Number.POSITIVE_INFINITY);
}

function byShowcase(a, b) {
  const showcaseDifference = Number(a.display_order || 0) - Number(b.display_order || 0);
  return showcaseDifference || Number(b.id || 0) - Number(a.id || 0);
}

export default function CategoryProductGrid({ products = [] }) {
  const [sort, setSort] = useState("popular");

  const sortedProducts = useMemo(() => {
    const items = [...products];
    items.sort((a, b) => {
      if (sort === "price-asc") return productPrice(a) - productPrice(b) || byShowcase(a, b);
      if (sort === "price-desc") return productPrice(b) - productPrice(a) || byShowcase(a, b);
      if (sort === "newest") return Number(b.id || 0) - Number(a.id || 0);
      if (sort === "showcase") return byShowcase(a, b);

      // Default: completed-sales ranking. The admin showcase order resolves ties,
      // so its manual product order is still respected where sales are equal.
      return Number(b.sold_count || 0) - Number(a.sold_count || 0) || byShowcase(a, b);
    });
    return items;
  }, [products, sort]);

  return (
    <section className="category-products-section" aria-label="محصولات دسته‌بندی">
      <div className="category-product-toolbar">
        <div>
          <p className="category-product-toolbar-label">مرتب‌سازی محصولات</p>
          <h2 className="category-product-toolbar-title">محصولات این دسته‌بندی</h2>
        </div>
        <div className="category-sort-options" role="group" aria-label="مرتب‌سازی محصولات">
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`category-sort-option${sort === option.value ? " is-active" : ""}`}
              aria-pressed={sort === option.value}
              onClick={() => setSort(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <div className="cards">
        {sortedProducts.map((product) => (
          <ProductCard key={product.id || product.slug} p={product} imageFit="cover" />
        ))}
      </div>
    </section>
  );
}
