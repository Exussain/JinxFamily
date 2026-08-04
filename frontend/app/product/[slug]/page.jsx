import { notFound } from "next/navigation";
import ProductPurchaseIsland from "./ProductPurchaseIsland";
import DeferredProductReviews from "./DeferredProductReviews";
import StaticProductCard from "../../../components/StaticProductCard";
import { fetchApiJsonWithStatus } from "../../../lib/serverFetch.mjs";
import { fetchReviewStats } from "../../../lib/seoJsonLd.mjs";
import { normalizeSlug } from "../../../lib/productSlug.mjs";
import { getRelatedProducts } from "../../../lib/relatedProducts.mjs";
import Image from "next/image";
import ProductJinxGuide from "../../../components/ProductJinxGuide";
import ExpandableDescription from "../../../components/ExpandableDescription";

export const revalidate = 60;

function plainText(value = "") {
  return String(value)
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<\/p>|<\/h\d>|<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n\n")
    .trim();
}

function productImage(product) {
  return product?.image_url || "/logo.webp";
}

export default async function ProductPage({ params }) {
  const { slug: rawSlug } = await params;
  const slug = normalizeSlug(rawSlug);
  const [{ data: product, status }, productsPayload, stats] = await Promise.all([
    fetchApiJsonWithStatus(`/api/products/${encodeURIComponent(slug)}`, { next: { revalidate: 60 } }),
    fetchApiJsonWithStatus("/api/products?view=card&limit=20", { next: { revalidate: 60 } }),
    fetchReviewStats(slug, { next: { revalidate: 120 } }),
  ]);

  if (!product && status === 404) notFound();
  if (!product) return <main className="container product-server-page"><p>دریافت اطلاعات محصول موقتاً ممکن نیست.</p></main>;

  const image = productImage(product);
  const pageCustomization = product.page_customization || {};
  const description = plainText(product.description || product.subtitle);
  const subtitle = plainText(product.subtitle);
  const faq = Array.isArray(product.faq) ? product.faq : [];
  const allProducts = productsPayload?.data?.results || [];
  const related = getRelatedProducts(product, allProducts, 4);
  const price = Number(product.min_price || product.price || 0);
  const purchaseProduct = {
    id: product.id,
    slug: product.slug,
    name_fa: product.name_fa,
    category: product.category,
    price: product.price,
    min_price: product.min_price,
    purchasable: product.purchasable,
    ordering_disabled: product.ordering_disabled,
    customer_ordering_disabled: product.customer_ordering_disabled,
    is_g4a4: product.is_g4a4,
    variants: product.variants || [],
    custom_fields: product.custom_fields || [],
  };

  return (
    <main className={`container product-server-page product-theme-${pageCustomization.theme || "default"}`}>
      {pageCustomization.banner_text && (
        <div className={`product-custom-banner banner-color-${pageCustomization.banner_color || "blue"}`}>
          <span className="banner-icon">✦</span>
          <p>{pageCustomization.banner_text}</p>
        </div>
      )}

      <nav className="product-breadcrumb" aria-label="مسیر صفحه">
        <a href="/" rel="home">خانه</a><span>／</span><a href="/products">محصولات</a><span>／</span><span>{product.name_fa}</span>
      </nav>

      <article className="product-server-hero">
        <div className="product-server-media">
          <Image src={image} alt={product.name_fa} width={720} height={720} priority sizes="(max-width: 720px) 120px, 520px" />
        </div>
        <header className="product-server-copy">
          <span className="product-server-category">{product.category_title || product.category}</span>
          <h1>{product.name_fa}</h1>
          {subtitle && <p className="product-server-subtitle">{subtitle}</p>}
          <div className="product-server-price">
            <span>شروع قیمت از</span>
            <strong>{price > 0 ? `${price.toLocaleString("fa-IR")} تومان` : "ناموجود"}</strong>
          </div>
          <ul className="product-server-trust">
            <li>تحویل سریع و قانونی</li><li>پشتیبانی تخصصی</li><li>اعتبارسنجی قیمت در سبد خرید</li>
          </ul>
          <ProductPurchaseIsland product={purchaseProduct} image={image} customButtonText={pageCustomization.purchase_btn_text} />
        </header>
      </article>

      <ProductJinxGuide product={product} />

      {description && <ExpandableDescription description={description} />}

      {faq.length > 0 && !pageCustomization.hide_faq && (
        <section className="product-server-faq below-fold" aria-labelledby="faq-title">
          <h2 id="faq-title">پرسش‌های متداول</h2>
          {faq.map((item, index) => <details key={item.question || index}><summary>{item.question}</summary><p>{plainText(item.answer)}</p></details>)}
        </section>
      )}

      {related.length > 0 && !pageCustomization.hide_related && (
        <section className="product-server-related below-fold" aria-labelledby="related-title">
          <div className="home-section-heading"><h2 id="related-title">محصولات مرتبط</h2><a href="/products">مشاهده همه</a></div>
          <div className="product-server-related-grid">{related.map((item) => <StaticProductCard key={item.id || item.slug} product={item} />)}</div>
        </section>
      )}
      {!pageCustomization.hide_reviews && (
        <DeferredProductReviews slug={slug} title={product.name_fa} stats={stats} />
      )}
    </main>
  );
}
