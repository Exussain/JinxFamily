import Link from 'next/link';
import Image from 'next/image';
import { resolveProductImage } from '../lib/productImageHelpers';
import { productHref } from '../lib/productUrls.mjs';

export default function StaticProductCard({ product, priority = false }) {
  const { imageSrc, imageBase } = resolveProductImage(product);
  const mainImage = imageSrc || (imageBase ? `${imageBase}.webp` : '/logo.webp');
  
  const rawImages = product.images || product.page_customization?.images || product.page_customization?.gallery || [];
  let images = Array.isArray(rawImages) ? rawImages.filter(Boolean) : [];
  if (mainImage && !images.includes(mainImage)) {
    images = [mainImage, ...images];
  }
  const primaryImg = images[0] || mainImage;
  const secondaryImg = images.length > 1 ? images[1] : null;

  const isAccount =
    (product.category || "").toUpperCase() === "ACCOUNTS" ||
    product.is_account ||
    product.subcategory === "accounts" ||
    (product.slug && product.slug.toLowerCase().includes("account"));

  const href = product.link || productHref(product.slug);
  const price = Number(product.min_price || product.price || 0);
  const original = Number(product.original_price || 0);
  const hasDiscount = original > price && price > 0;
  const discountPercent = hasDiscount ? Math.round(((original - price) / original) * 100) : 0;
  const isUnavailable = product.purchasable === false || !!product.ordering_disabled || !!product.customer_ordering_disabled || price <= 0;
  
  return (
    <article className={`card product-card jf-product-card static-product-card ${isAccount ? "is-account-card" : ""}`}>
      <div className={`product-card-media jf-product-media ${isAccount ? "is-account-media" : ""}`}>
        {hasDiscount && (
          <div
            className="product-badge discount-badge jf-product-discount"
            aria-label={`تخفیف ${discountPercent.toLocaleString('fa-IR')} درصد`}
            title={`تخفیف ${discountPercent.toLocaleString('fa-IR')} درصد`}
          >
            {discountPercent.toLocaleString('fa-IR')}٪ تخفیف
          </div>
        )}
        <Link href={href} prefetch={false} className="jf-product-media-link">
          <Image
            src={primaryImg}
            alt={product.name_fa}
            width={480}
            height={300}
            priority={priority}
            sizes="(max-width: 720px) 48vw, (max-width: 1100px) 31vw, 260px"
            style={{ objectFit: isAccount ? "contain" : "cover" }}
          />
          {secondaryImg && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={secondaryImg}
              alt={`${product.name_fa} - عکس دوم`}
              className="secondary-hover-img"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: isAccount ? "contain" : "cover",
                opacity: 0,
                transition: "opacity 0.3s ease",
                pointerEvents: "none"
              }}
            />
          )}
        </Link>
      </div>
      <div className="product-card-body jf-product-body">
        <div className="jf-product-copy">
          <Link href={href} prefetch={false}><h3>{product.name_fa}</h3></Link>
          <p>{product.subtitle || 'فعال‌سازی قانونی و تحویل سریع'}</p>
        </div>
        <div className="jf-product-price">
          {hasDiscount && !isUnavailable ? <span className="jf-product-old-price">{original.toLocaleString('fa-IR')} تومان</span> : <span className="jf-product-old-price" aria-hidden="true">&nbsp;</span>}
          <strong className={!isUnavailable ? "" : "is-unavailable"}>
            {!isUnavailable ? <>{price.toLocaleString('fa-IR')} <small>تومان</small></> : 'ناموجود'}
          </strong>
        </div>
        {isUnavailable ? (
          <Link href={href} prefetch={false} className="jf-cart-button is-disabled" style={{ opacity: 0.8, background: "rgba(255, 255, 255, 0.08)", color: "var(--muted)" }}>
            مشاهده جزییات (ناموجود)
          </Link>
        ) : (
          <Link href={href} prefetch={false} className="jf-cart-button">مشاهده و خرید</Link>
        )}
      </div>
    </article>
  );
}
