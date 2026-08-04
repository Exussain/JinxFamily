"use client";

import ProductCard from "./ProductCard";
import { getRelatedProducts } from "../lib/relatedProducts.mjs";

export default function RelatedProducts({ currentProduct, products = [], title = "محصولات مرتبط" }) {
  const relatedProducts = getRelatedProducts(currentProduct, products, 8);

  if (!relatedProducts.length) return null;

  return (
    <section className="related-products-section card section" aria-labelledby="related-products-title">
      <div className="related-products-head">
        <div>
          <p className="related-products-eyebrow">پیشنهاد بعدی جینکس فمیلی</p>
          <h2 id="related-products-title">{title}</h2>
        </div>
        <a className="related-products-all" href="/#products">
          همه محصولات
        </a>
      </div>
      <div className="related-products-scroll" role="list">
        {relatedProducts.map((product) => (
          <div className="related-products-item" role="listitem" key={product.slug || product.id}>
            <ProductCard p={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
