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
  
  const discountPercent = original && price < original ? Math.round(((original - price) / original) * 100) : 0;
  const targetUrl = p.link || (hasProductPage ? `/product/${p.slug}` : null);

  return (
    <div className="card product-card">
      {targetUrl && (
        <Link 
          href={targetUrl} 
          style={{ position: 'absolute', inset: 0, zIndex: 1 }} 
          aria-label={p.name_fa} 
        />
      )}
      
      <div className="product-card-media" style={{ position: 'relative', zIndex: 2, pointerEvents: 'none' }}>
        <SmartImage
          src={imageSrc}
          base={imageBase}
          alt={p.name_fa}
          fit={imageFit}
        />
        {discountPercent > 0 && (
          <div className="product-discount-badge">
            {discountPercent}٪
          </div>
        )}
        
        {/* Floating Cart Action on Image */}
        <div className="cart-action" style={{ position: 'absolute', bottom: '12px', left: '12px', zIndex: 10, pointerEvents: 'auto' }}>
          {!hasPrice ? (
            <button
              type="button"
              className="product-cart-btn disabled"
              disabled
              title="ناموجود"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          ) : p.link ? (
            <Link href={p.link} className="product-cart-btn" title="مشاهده گزینه‌ها">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            </Link>
          ) : quantity === 0 ? (
            <button
              className={`product-cart-btn ${btnPulse ? 'success success-pulse' : ''}`}
              title="افزودن به سبد خرید"
              onClick={(e) => {
                e.preventDefault(); // Prevent link click if necessary
                addItem({
                  product_id: p.id,
                  name: p.name_fa,
                  price: price,
                  quantity: 1,
                  slug: p.slug,
                  image: finalImage
                });
                setBtnPulse(true);
                setTimeout(() => setBtnPulse(false), 500);

                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('cart:add'));
                }
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
            </button>
          ) : (
            <div className="product-qty-control" style={{ backgroundColor: 'var(--card)', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
              <button
                type="button"
                className="product-qty-btn"
                onClick={(e) => {
                  e.preventDefault();
                  if (quantity <= 1) {
                    removeItem(p.id);
                  } else {
                    setQty(p.id, quantity - 1);
                  }
                }}
              >
                -
              </button>
              <div className="product-qty-value">
                {quantity}
              </div>
              <button
                type="button"
                className="product-qty-btn"
                onClick={(e) => {
                  e.preventDefault();
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
      
      <div className="product-card-body" style={{ position: 'relative', zIndex: 2, pointerEvents: 'none' }}>
        <div className="product-title-box">
          {p.name_fa}
        </div>
        
        <div className="product-subtitle-text">
          {p.subtitle || p.category_title || 'محصول فورتنایت'}
        </div>

        <div className="product-footer-row" style={{ justifyContent: 'center' }}>
          <div className="product-price-col" style={{ position: 'relative', zIndex: 0, alignItems: 'center' }}>
            {original && price < original ? (
              <div className="product-price-old">{original.toLocaleString('fa-IR')}</div>
            ) : (
              <div className="product-price-old" style={{visibility: 'hidden'}}>0</div>
            )}
            
            {hasPrice ? (
              <div className="product-price-new">
                <span className="product-price-currency">تومان</span>
                {price.toLocaleString('fa-IR')}
                {showPriceFrom && <span style={{fontSize:'12px', marginRight:'4px'}}>از</span>}
              </div>
            ) : (
              <div className="product-price-new" style={{ color: 'var(--muted)', fontSize: '15px' }}>
                ناموجود
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
