"use client";

import { useEffect, useRef } from "react";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import ProductCard from "./ProductCard";

function Arrow({ direction }) {
  const Icon = direction === "next" ? FiArrowRight : FiArrowLeft;
  return <Icon aria-hidden="true" />;
}

function ProductRail({ title, products, tone }) {
  const railRef = useRef(null);
  const move = (direction) => {
    railRef.current?.scrollBy({ left: direction * -360, behavior: "smooth" });
  };

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return undefined;

    const handleWheel = (event) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX) || rail.scrollWidth <= rail.clientWidth) return;

      event.preventDefault();
      rail.scrollBy({ left: -event.deltaY, behavior: "auto" });
    };

    rail.addEventListener("wheel", handleWheel, { passive: false });
    return () => rail.removeEventListener("wheel", handleWheel);
  }, []);

  if (!products.length) return null;

  return (
    <section className={`product-rail product-rail--${tone}`} aria-label={title}>
      <div className="product-rail__head">
        <h2>{title}</h2>
        <div className="product-rail__actions" aria-label={`کنترل ${title}`}>
          <button className="product-rail__arrow" type="button" onClick={() => move(-1)} aria-label="محصولات قبلی"><Arrow direction="previous" /></button>
          <button className="product-rail__arrow" type="button" onClick={() => move(1)} aria-label="محصولات بعدی"><Arrow direction="next" /></button>
        </div>
      </div>
      <div className="product-rail__viewport" ref={railRef} tabIndex={0}>
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
      <ProductRail title="محبوب‌ترین‌های فورتنایت" products={firstRow.length ? firstRow : purchasable.slice(0, 12)} tone="violet" />
      <ProductRail title="برای بازی و زندگی دیجیتال" products={secondRow.length ? secondRow : purchasable.slice(12, 24)} tone="blue" />
    </div>
  );
}
