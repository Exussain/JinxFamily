"use client";

import { useRef } from "react";
import ProductCard from "./ProductCard";

function Arrow({ direction }) {
  return direction === "next" ? "‹" : "›";
}

function ProductRail({ title, description, products, tone }) {
  const railRef = useRef(null);
  const move = (direction) => {
    railRef.current?.scrollBy({ left: direction * -360, behavior: "smooth" });
  };

  if (!products.length) return null;

  return (
    <section className={`product-rail product-rail--${tone}`} aria-label={title}>
      <div className="product-rail__head">
        <div>
          <span className="product-rail__eyebrow">انتخاب نوبیکس</span>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <div className="product-rail__actions" aria-label={`کنترل ${title}`}>
          <button type="button" onClick={() => move(-1)} aria-label="محصولات قبلی"><Arrow direction="previous" /></button>
          <button type="button" onClick={() => move(1)} aria-label="محصولات بعدی"><Arrow direction="next" /></button>
        </div>
      </div>
      <div className="product-rail__viewport" ref={railRef}>
        {products.map((product) => <ProductCard key={product.id || product.slug} p={product} imageFit="cover" />)}
      </div>
    </section>
  );
}

export default function ProductSliders({ products = [] }) {
  const purchasable = products.filter((product) => product?.purchasable !== false);
  const isFortnite = (product) => {
    const source = `${product?.category || ""} ${product?.category_title || ""} ${product?.slug || ""}`.toLowerCase();
    return source.includes("fortnite") || source.includes("فورتنایت");
  };
  const firstRow = purchasable.filter(isFortnite).slice(0, 12);
  const secondRow = purchasable.filter((product) => !firstRow.includes(product)).slice(0, 12);

  return (
    <div className="product-rails" id="popular">
      <ProductRail title="محبوب‌ترین‌های فورتنایت" description="آیتم‌هایی که همین حالا بیشترین انتخاب را دارند." products={firstRow.length ? firstRow : purchasable.slice(0, 12)} tone="violet" />
      <ProductRail title="برای بازی و زندگی دیجیتال" description="اشتراک‌ها، گیفت‌کارت‌ها و آیتم‌های تازه در یک نگاه." products={secondRow.length ? secondRow : purchasable.slice(12, 24)} tone="blue" />
    </div>
  );
}
