"use client";
import { useState } from "react";
import { useCart } from "../lib/useCart";
import { resolveProductImage } from "../lib/productImageHelpers";
import { productHref } from "../lib/productUrls.mjs";
import SmartImage from "./SmartImage";
import Link from "next/link";
import { Heart, Minus, Plus, ShoppingBag } from "lucide-react";
import { useWishlist } from "../lib/useWishlist";

function stripHtml(html) {
  if (!html) return "";
  let decoded = html
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&nbsp;/g, " ");

  // Remove HTML tags
  let stripped = decoded.replace(/<[^>]*>/g, "");

  // Collapse multiple spaces
  return stripped.replace(/\s+/g, " ").trim();
}

export default function ProductCard({ p, imageFit = "contain" }) {
  const { items, addItem, setQty, removeItem } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const [btnPulse, setBtnPulse] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const isAccount =
    (p.category || "").toUpperCase() === "ACCOUNTS" ||
    p.is_account ||
    p.subcategory === "accounts" ||
    (p.slug && p.slug.toLowerCase().includes("account"));

  const effectiveFit = isAccount ? "contain" : imageFit;

  const hasVariants = Array.isArray(p.variants) && p.variants.length > 0;
  const requiresConfiguration = hasVariants || p.has_variants || p.has_required_custom_fields;
  const price = Number(p.price) > 0 ? Number(p.price) : (Number(p.min_price) > 0 ? Number(p.min_price) : 0);
  const hasPrice = price > 0;
  const original = p.original_price || 0;
  const showPriceFrom = (p.price_from || hasVariants) && (p.slug !== 'fortnite-save-the-world');
  const cartItem = items.find((x) => x.product_id === p.id);
  const quantity = cartItem?.quantity || 0;
  const { imageBase, imageSrc } = resolveProductImage(p);
  const finalImage = imageSrc || (imageBase ? `${imageBase}.webp` : null);
  const hasProductPage = Number.isInteger(p.id) && !!p.slug;
  
  // Collect images array (for 2nd image on hover)
  const rawImages = p.images || p.page_customization?.images || p.page_customization?.gallery || [];
  let images = Array.isArray(rawImages) ? rawImages.filter(Boolean) : [];
  if (finalImage && !images.includes(finalImage)) {
    images = [finalImage, ...images];
  }
  if (images.length === 0 && finalImage) {
    images = [finalImage];
  }

  const primaryImage = images[0] || finalImage || "/logo.webp";
  const secondaryImage = images.length > 1 ? images[1] : null;

  const discountPercent = original && price < original ? Math.round(((original - price) / original) * 100) : 0;
  const getFallbackSubtitle = (category) => {
    const cat = (category || "").toUpperCase();
    if (cat === "GIFTCARDS") return "تحویل فوری کد دیجیتال";
    if (cat === "FORTNITE") return "فعال‌سازی قانونی روی اکانت";
    if (cat === "SUBSCRIPTIONS") return "فعال‌سازی قانونی و تضمینی";
    if (cat === "AI") return "دسترسی سریع و قانونی";
    if (cat === "GAMES") return "پشتیبانی و فعال‌سازی سریع";
    return "تحویل سریع و تضمینی";
  };
  const subtitleText = stripHtml(p.subtitle || getFallbackSubtitle(p.category));
  const targetUrl =
    p.link || (hasProductPage ? productHref(p.slug) : null);

  const unavailable = !hasPrice || p.ordering_disabled || p.customer_ordering_disabled || p.purchasable === false;
  const wished = isWishlisted(p.id);

  const addToCart = () => {
    addItem({ product_id: p.id, name: p.name_fa, price, quantity: 1, slug: p.slug, image: finalImage });
    setBtnPulse(true);
    setTimeout(() => setBtnPulse(false), 500);
    window.dispatchEvent(new CustomEvent("cart:add"));
  };

  return (
    <article
      className={`card product-card jf-product-card ${isAccount ? "is-account-card" : ""}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`product-card-media jf-product-media ${isAccount ? "is-account-media" : ""}`} style={{ pointerEvents: "auto" }}>
        {targetUrl ? (
          <Link href={targetUrl} className="jf-product-media-link" style={{ display: "block", width: "100%", height: "100%", position: "relative" }}>
            <SmartImage
              src={isHovered && secondaryImage ? secondaryImage : primaryImage}
              base={isHovered && secondaryImage ? null : imageBase}
              alt={p.name_fa}
              fit={effectiveFit}
            />
            {secondaryImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={secondaryImage}
                alt={`${p.name_fa} - عکس دوم`}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: effectiveFit,
                  opacity: isHovered ? 1 : 0,
                  transition: "opacity 0.3s ease",
                  pointerEvents: "none",
                }}
              />
            )}
          </Link>
        ) : (
          <div style={{ position: "relative", width: "100%", height: "100%" }}>
            <SmartImage
              src={primaryImage}
              base={imageBase}
              alt={p.name_fa}
              fit={effectiveFit}
            />
            {secondaryImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={secondaryImage}
                alt={`${p.name_fa} - عکس دوم`}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: effectiveFit,
                  opacity: isHovered ? 1 : 0,
                  transition: "opacity 0.3s ease",
                  pointerEvents: "none",
                }}
              />
            )}
          </div>
        )}
        {discountPercent > 0 && (
          <div
            className="product-badge discount-badge jf-product-discount"
            style={{ pointerEvents: "none" }}
            aria-label={`تخفیف ${discountPercent.toLocaleString("fa-IR")} درصد`}
            title={`تخفیف ${discountPercent.toLocaleString("fa-IR")} درصد`}
          >
            {discountPercent.toLocaleString("fa-IR")}٪ تخفیف
          </div>
        )}
        <button
          type="button"
          className={`jf-wishlist-btn ${wished ? "is-active" : ""}`}
          aria-label={wished ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}
          title={wished ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}
          onClick={(event) => { event.preventDefault(); toggleWishlist(p.id); }}
        >
          <Heart size={19} fill={wished ? "currentColor" : "none"} />
        </button>
      </div>
      
      <div className="product-card-body jf-product-body">
        <div className="jf-product-copy">
          {targetUrl ? (
            <Link href={targetUrl} style={{ textDecoration: "none", color: "inherit" }}>
              <h3>{p.name_fa}</h3>
            </Link>
          ) : (
            <h3>{p.name_fa}</h3>
          )}
          <p>{subtitleText}</p>
        </div>

        <div className="jf-product-price">
          {original && price < original ? (
            <span className="jf-product-old-price">{original.toLocaleString('fa-IR')} تومان</span>
          ) : <span className="jf-product-old-price" aria-hidden="true">&nbsp;</span>}
          {!unavailable ? (
            <strong>
              {showPriceFrom && <small>از</small>}
              {price.toLocaleString('fa-IR')}
              <small>تومان</small>
            </strong>
          ) : (
            <strong className="is-unavailable">ناموجود</strong>
          )}
        </div>

        <div className="jf-product-action">
          {unavailable ? (
            <button type="button" className="jf-cart-button" disabled>فعلاً ناموجود</button>
          ) : (p.link || requiresConfiguration) && targetUrl ? (
            <Link href={targetUrl} className="jf-cart-button">مشاهده گزینه‌ها</Link>
          ) : quantity === 0 ? (
            <button
              type="button"
              className={`jf-cart-button ${btnPulse ? "success-pulse" : ""}`}
              onClick={(event) => { event.preventDefault(); addToCart(); }}
            >
              <ShoppingBag size={18} /> افزودن به سبد
            </button>
          ) : (
            <div className="jf-qty-control">
              <button type="button" aria-label="کاهش تعداد" onClick={(event) => { event.preventDefault(); quantity <= 1 ? removeItem(p.id) : setQty(p.id, quantity - 1); }}><Minus size={17} /></button>
              <span>{quantity.toLocaleString("fa-IR")}</span>
              <button type="button" aria-label="افزایش تعداد" onClick={(event) => { event.preventDefault(); setQty(p.id, quantity + 1); window.dispatchEvent(new CustomEvent("cart:add")); }}><Plus size={17} /></button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
