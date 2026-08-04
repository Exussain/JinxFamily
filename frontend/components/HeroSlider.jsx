"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Heart, Minus, Plus, ShoppingBag, Sparkles } from "lucide-react";
import { useCart } from "../lib/useCart";
import { useWishlist } from "../lib/useWishlist";
import { resolveProductImage } from "../lib/productImageHelpers";
import { productHref } from "../lib/productUrls.mjs";
import "./HeroSlider.css";

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

  let stripped = decoded.replace(/<[^>]*>/g, "");
  return stripped.replace(/\s+/g, " ").trim();
}

const fallbackProducts = [
  { id: 1, slug: "fortnite-crew-pack", name_fa: "کروپک فورتنایت", subtitle: "بتل پس، ۱۰۰۰ وی باکس و اسکین ماه", image_url: "/products/crewpack.webp", price: 567000, original_price: 770000 },
  { id: 34, slug: "gta6", name_fa: "پیش خرید GTA VI", subtitle: "نسخه رسمی پلی استیشن و ایکس باکس", image_url: "/products/gta6/ps5-ultimate.webp", price: 5258000, original_price: 6199000 },
  { id: 29, slug: "starterpack", name_fa: "استارتر پک فورتنایت", subtitle: "اسکین اختصاصی و ۸۰۰ وی باکس", image_url: "/products/starterpack.webp", price: 769000, original_price: 1100000 },
  { id: 8, slug: "spotify-subscription", name_fa: "اسپاتیفای پریمیوم", subtitle: "اشتراک قانونی روی اکانت شخصی", image_url: "/products/spotify.webp", price: 159000, original_price: 250000 },
];

export default function HeroSlider({ heroProducts = [] }) {
  const { items, addItem, setQty, removeItem } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const seconds = Math.max(0, Math.floor((end - now) / 1000));
      setTimeLeft({ hours: Math.floor(seconds / 3600), minutes: Math.floor((seconds % 3600) / 60), seconds: seconds % 60 });
    };
    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, []);

  const products = useMemo(() => fallbackProducts.map((fallback) => {
    const live = heroProducts.find((product) => product.slug === fallback.slug);
    if (!live) return fallback;
    return {
      ...fallback,
      ...live,
      price: Number(live.price) || Number(live.min_price) || fallback.price,
      original_price: Number(live.original_price) || fallback.original_price,
    };
  }), [heroProducts]);

  const addProduct = (product, image) => {
    addItem({ product_id: product.id, name: product.name_fa, price: Number(product.price), quantity: 1, slug: product.slug, image });
    window.dispatchEvent(new CustomEvent("cart:add"));
  };

  // Duplicate items array during auto-scroll for seamless infinite loop
  const displayProducts = autoScrollActive && products.length > 0 ? [...products, ...products] : products;

  return (
    <section className="jinxfamily-hero-slider" aria-labelledby="daily-drop-title">
      <div className="jf-offer-noise" aria-hidden="true" />
      <header className="jf-offer-header">
        <span className="jf-offer-kicker"><Sparkles size={15} /> انتخاب‌های امروز جینکس</span>
        <h2 id="daily-drop-title">دراپ نیمه‌شب</h2>
        <p>چهار انتخاب محبوب با قیمت ویژه؛ قبل از عوض شدن لیست امشب بردارشان.</p>
      </header>

      <div className="jf-offer-countdown" aria-label="زمان باقی‌مانده تا پایان پیشنهاد">
        {[[timeLeft.hours, "ساعت"], [timeLeft.minutes, "دقیقه"], [timeLeft.seconds, "ثانیه"]].map(([value, label]) => (
          <div className="jf-time-unit" key={label}>
            <strong>{Number(value).toLocaleString("fa-IR", { minimumIntegerDigits: 2 })}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>

      <div className="jf-offer-products">
        {products.map((product, index) => {
          const price = Number(product.price) || Number(product.min_price) || 0;
          const original = Number(product.original_price) || 0;
          const discount = original > price ? Math.round(((original - price) / original) * 100) : 0;
          const cartItem = items.find((item) => item.product_id === product.id);
          const quantity = cartItem?.quantity || 0;
          const wished = isWishlisted(product.id);
          const { imageSrc } = resolveProductImage(product);

          const dest = productHref(product.slug);
          const requiresConfiguration = Boolean(product.has_variants || product.has_required_custom_fields);
          const sanitizedSubtitle = stripHtml(product.subtitle);

          return (
            <article className="jf-offer-card" key={product.slug}>
              <div className="jf-offer-media" style={{ pointerEvents: "auto" }}>
                <Link href={dest} style={{ display: "block", width: "100%", height: "100%" }}>
                  <img src={imageSrc} alt={product.name_fa} decoding="async" {...(index === 0 ? { fetchPriority: "high" } : {})} />
                </Link>
                {discount > 0 && <span className="jf-offer-discount" style={{ pointerEvents: "none" }}>{discount.toLocaleString("fa-IR")}٪</span>}
                <button className={`jf-offer-heart ${wished ? "is-active" : ""}`} type="button" title="علاقه‌مندی‌ها" aria-label={wished ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"} onClick={(event) => { event.preventDefault(); toggleWishlist(product.id); }}>
                  <Heart size={18} fill={wished ? "currentColor" : "none"} />
                </button>
              </div>
              <div className="jf-offer-card-body">
                <div className="jf-offer-copy">
                  <Link href={dest} style={{ textDecoration: "none", color: "inherit" }}>
                    <h3>{product.name_fa}</h3>
                  </Link>
                  <p>{sanitizedSubtitle}</p>
                </div>
                <div className="jf-offer-price">
                  <span>{original > price ? `${original.toLocaleString("fa-IR")} تومان` : ""}</span>
                  <strong>{price.toLocaleString("fa-IR")} <small>تومان</small></strong>
                </div>
                {requiresConfiguration ? (
                  <Link href={dest} className="jf-offer-cart"><ShoppingBag size={17} /> انتخاب گزینه‌ها</Link>
                ) : quantity === 0 ? (
                  <button className="jf-offer-cart" type="button" onClick={(event) => { event.preventDefault(); addProduct(product, imageSrc); }}><ShoppingBag size={17} /> افزودن به سبد</button>
                ) : (
                  <div className="jf-offer-qty">
                    <button type="button" aria-label="کاهش تعداد" onClick={() => quantity <= 1 ? removeItem(product.id) : setQty(product.id, quantity - 1)}><Minus size={17} /></button>
                    <span>{quantity.toLocaleString("fa-IR")} در سبد</span>
                    <button type="button" aria-label="افزایش تعداد" onClick={() => setQty(product.id, quantity + 1)}><Plus size={17} /></button>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <Link href="/products" className="jf-offer-all">دیدن همه محصولات <ArrowLeft size={17} /></Link>
    </section>
  );
}

