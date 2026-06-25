"use client";
import { useState } from "react";
import { useCart } from "../lib/useCart";
import { resolveProductImage } from "../lib/productImageHelpers";
import SmartImage from "./SmartImage";
import Link from "next/link";

export default function ProductCard({ p, imageFit = "contain" }) {
  const { items, addItem, setQty, removeItem } = useCart();
  const [btnPulse, setBtnPulse] = useState(false);
  const hasVariants = Array.isArray(p.variants) && p.variants.length > 0;
  const price = Number(p.price) > 0 ? Number(p.price) : (Number(p.min_price) > 0 ? Number(p.min_price) : 0);
  const hasPrice = price > 0;
  const original = p.original_price || 0;
  const showPriceFrom = (p.price_from || hasVariants) && (p.slug !== 'fortnite-save-the-world');
  const cartItem = items.find((x) => x.product_id === p.id);
  const quantity = cartItem?.quantity || 0;
  const { imageBase, imageSrc } = resolveProductImage(p);
  const finalImage = imageSrc || (imageBase ? `${imageBase}.webp` : null);
  const hasProductPage = Number.isInteger(p.id) && !!p.slug;
  return (
    <div className="card product-card">
      <div className="product-card-media">
        <SmartImage
          src={imageSrc}
          base={imageBase}
          alt={p.name_fa}
          fit={imageFit}
        />
      </div>
      <div className="card-body">
        <div style={{display:'grid',gap:6}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8}}>
            <div style={{fontWeight:900,lineHeight:'1.3'}}>{p.name_fa}</div>
            <div style={{display:'grid',justifyItems:'end',flexShrink:0}}>
              {original ? (
                <div className="price-old">{original.toLocaleString('fa-IR')} تومان</div>
              ) : null}
              {hasPrice ? (
                <div className="price">{showPriceFrom ? 'از ' : ''}{price.toLocaleString('fa-IR')} تومان</div>
              ) : (
                <div className="muted" style={{ fontWeight: 800 }}>ناموجود</div>
              )}
            </div>
          </div>
          <div className="muted" style={{fontWeight:600,lineHeight:'1.4',minHeight:40}}>{p.subtitle || p.category_title || 'محصول فورتنایت'}</div>
        </div>
        {!hasPrice ? (
          <button
            type="button"
            className="btn primary"
            disabled
            style={{ textAlign: "center", opacity: 0.6, cursor: "not-allowed" }}
          >
            ناموجود
          </button>
        ) : p.link ? (
          <Link href={p.link} className="btn primary" style={{textAlign:'center'}}>
            مشاهده گزینه‌ها
          </Link>
        ) : hasProductPage ? (
          <Link
            href={`/product/${p.slug}`}
            className="btn primary"
            style={{ textAlign: "center" }}
          >
            مشاهده محصول
          </Link>
        ) : quantity === 0 ? (
          <button
            className={`btn primary ${btnPulse ? 'success-pulse' : ''}`}
            onClick={(e) => {
              addItem({
                product_id: p.id,
                name: p.name_fa,
                price: price,
                quantity: 1,
                slug: p.slug,
                image: finalImage
              });
              // Trigger success animation
              setBtnPulse(true);
              setTimeout(() => setBtnPulse(false), 500);

              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('cart:add'));
              }
              }}
            >
            خرید
          </button>
        ) : (
          <div className="qty-control">
            <button
              type="button"
              className="qty-btn"
              onClick={() => {
                if (quantity <= 1) {
                  removeItem(p.id);
                } else {
                  setQty(p.id, quantity - 1);
                }
              }}
            >
              -
            </button>
            <div className="qty-value">
              {quantity}
            </div>
            <button
              type="button"
              className="qty-btn"
              onClick={() => {
                setQty(p.id, quantity + 1);
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('cart:add'));
                }
              }}
            >
              +
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
