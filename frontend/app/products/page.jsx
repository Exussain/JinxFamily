import Link from 'next/link';
import Navbar from '../../components/Navbar';
import { fetchApiJson } from '../../lib/serverFetch.mjs';
import { productHref } from '../../lib/productUrls.mjs';

export const dynamic = 'force-dynamic';

const categoryGradients = {
  "FORTNITE": "linear-gradient(135deg, #8B5CF6, #EC4899)",
  "AI": "linear-gradient(135deg, #0ea5e9, #6366f1)",
  "GIFTCARDS": "linear-gradient(135deg, #F59E0B, #EF4444)",
  "GAMES": "linear-gradient(135deg, #10B981, #059669)",
  "SUBSCRIPTIONS": "linear-gradient(135deg, #3B82F6, #06B6D4)",
};

const categoryIcons = {
  "FORTNITE": "🎮",
  "AI": "🤖",
  "GIFTCARDS": "🎁",
  "GAMES": "🎯",
  "SUBSCRIPTIONS": "⭐",
};

export async function generateMetadata() {
  return {
    title: 'خرید محصولات دیجیتال و گیمینگ | نوبیکس شاپ',
    description: 'لیست تمامی دسته‌بندی‌ها و محصولات نوبیکس شاپ؛ خرید قانونی وی‌باکس و کروپک فورتنایت، اشتراک ChatGPT، Gemini، اسپاتیفای و گیفت کارت‌ها با تحویل سریع.',
    alternates: { canonical: '/products' },
    openGraph: {
      title: 'خرید محصولات دیجیتال و گیمینگ | نوبیکس شاپ',
      description: 'لیست تمامی دسته‌بندی‌ها و محصولات نوبیکس شاپ؛ خرید قانونی وی‌باکس و کروپک فورتنایت، اشتراک ChatGPT، Gemini، اسپاتیفای و گیفت کارت‌ها با تحویل سریع.',
      url: 'https://nubixshop.ir/products',
      type: 'website',
      locale: 'fa_IR',
    },
  };
}

export default async function ProductsDirectoryPage() {
  const catData = await fetchApiJson('/api/categories');
  const rawCategories = catData?.results || [];

  // Sort categories based on order
  const categoriesList = [...rawCategories].sort((a, b) => (a.order || 0) - (b.order || 0));

  // Parallel fetch products for each category
  const categorizedProducts = await Promise.all(
    categoriesList.map(async (cat) => {
      const data = await fetchApiJson(`/api/categories/${cat.code.toUpperCase()}`);
      return {
        code: cat.code,
        name: cat.name,
        description: cat.description,
        productCount: cat.product_count || 0,
        products: Array.isArray(data?.products) ? data.products.slice(0, 4) : [],
      };
    })
  );

  const styleContent = `
    .products-grid-container {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 24px;
      margin-top: 32px;
    }
    @media (max-width: 992px) {
      .products-grid-container {
        grid-template-columns: 1fr;
      }
    }
    .cat-directory-card {
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: 24px;
      overflow: hidden;
      box-shadow: var(--shadow);
      transition: transform 0.3s ease, border-color 0.3s ease;
      display: flex;
      flex-direction: column;
    }
    .cat-directory-card:hover {
      transform: translateY(-4px);
      border-color: var(--primary-2);
    }
    .cat-card-header {
      padding: 24px;
      color: #fff;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .cat-card-header-bg {
      position: absolute;
      inset: 0;
      opacity: 0.95;
      z-index: 1;
    }
    .cat-card-header-content {
      position: relative;
      z-index: 2;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .cat-card-icon {
      font-size: 28px;
    }
    .cat-card-title-group h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 800;
    }
    .cat-card-badge {
      position: relative;
      z-index: 2;
      font-size: 12px;
      font-weight: 700;
      background: rgba(255, 255, 255, 0.2);
      padding: 6px 12px;
      border-radius: 99px;
      border: 1px solid rgba(255, 255, 255, 0.25);
      backdrop-filter: blur(4px);
    }
    .cat-card-body {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      flex-grow: 1;
    }
    .cat-card-desc {
      color: var(--muted);
      font-size: 14.5px;
      line-height: 1.6;
      margin: 0;
    }
    .cat-products-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      border-top: 1px dashed var(--line);
      padding-top: 16px;
    }
    .cat-product-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px;
      border-radius: 14px;
      background: color-mix(in srgb, var(--bg) 25%, transparent);
      text-decoration: none;
      transition: background 0.2s ease, transform 0.2s ease;
      border: 1px solid transparent;
    }
    .cat-product-item:hover {
      background: color-mix(in srgb, var(--bg) 45%, transparent);
      border-color: var(--line);
      transform: translateX(-4px);
    }
    .cat-product-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .cat-product-thumb {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      object-fit: contain;
      background: var(--card);
      border: 1px solid var(--line);
    }
    .cat-product-name {
      font-weight: 700;
      font-size: 14px;
      color: var(--text);
    }
    .cat-product-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .cat-product-price {
      font-size: 13.5px;
      font-weight: 800;
      color: var(--primary);
    }
    .cat-product-arrow {
      color: var(--muted);
      font-size: 14px;
      transition: color 0.2s ease;
    }
    .cat-product-item:hover .cat-product-arrow {
      color: var(--primary);
    }
    .cat-card-footer {
      padding: 0 24px 24px;
    }
    .cat-browse-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      padding: 12px;
      border-radius: 14px;
      border: 1px solid var(--line);
      background: var(--card);
      color: var(--text);
      font-weight: 800;
      text-decoration: none;
      font-size: 14px;
      transition: all 0.2s ease;
    }
    .cat-browse-btn:hover {
      background: var(--primary);
      color: #fff;
      border-color: var(--primary);
    }
  `;

  const collectionLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'خرید محصولات دیجیتال و گیمینگ | نوبیکس شاپ',
    description: 'لیست تمامی دسته‌بندی‌ها و محصولات نوبیکس شاپ؛ خرید قانونی وی‌باکس و کروپک فورتنایت، اشتراک ChatGPT، Gemini، اسپاتیفای و گیفت کارت‌ها با تحویل سریع.',
    url: 'https://nubixshop.ir/products',
    inLanguage: 'fa-IR',
    isPartOf: { '@id': 'https://nubixshop.ir/#website' },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: categoriesList.length,
      itemListElement: categoriesList.map((cat, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: cat.name,
        url: `https://nubixshop.ir/category/${cat.code.toLowerCase()}`
      }))
    }
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'نوبیکس شاپ', item: 'https://nubixshop.ir' },
      { '@type': 'ListItem', position: 2, name: 'محصولات', item: 'https://nubixshop.ir/products' }
    ]
  };

  return (
    <>
      <Navbar />
      <main className="container section" style={{ paddingTop: 100, paddingBottom: 80 }}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
        />
        <style dangerouslySetInnerHTML={{ __html: styleContent }} />

        <section className="category-hero">
          <div className="category-hero-glow" aria-hidden="true" />
          <div className="category-hero-top">
            <nav aria-label="مسیر صفحه" className="category-crumbs">
              <Link href="/" className="category-crumb-link">نوبیکس شاپ</Link>
              <span className="category-crumb-sep">/</span>
              <span className="category-crumb-current">محصولات فروشگاه</span>
            </nav>
            <Link href="/" className="category-home-btn">
              <span className="category-home-btn-arrow">←</span>
              <span>بازگشت به صفحه اصلی</span>
            </Link>
          </div>
          <div className="category-hero-body">
            <div className="category-kicker">🛍️ ویترین دسته‌بندی‌ها</div>
            <h1 className="category-title" style={{ fontSize: '26px', fontWeight: '900', color: '#fff', margin: '12px 0' }}>
              خرید محصولات دیجیتال و گیمینگ
            </h1>
            <p className="category-description" style={{ color: 'rgba(255,255,255,0.75)', fontSize: '15px', lineHeight: '1.8' }}>
              لیست تمام دسته‌بندی‌های فعال نوبیکس شاپ. از خرید وی‌باکس و کروپک فورتنایت تا اکانت هوش مصنوعی و اشتراک‌های بین‌المللی با فعال‌سازی فوری و ضمانت قیمت.
            </p>
          </div>
        </section>

        <div className="products-grid-container">
          {categorizedProducts.map((catGroup) => {
            const gradient = categoryGradients[catGroup.code.toUpperCase()] || "linear-gradient(135deg, #6366F1, #8B5CF6)";
            const icon = categoryIcons[catGroup.code.toUpperCase()] || "🛍️";
            const targetUrl = `/category/${catGroup.code.toLowerCase()}`;

            return (
              <div key={catGroup.code} className="cat-directory-card">
                <div className="cat-card-header">
                  <div className="cat-card-header-bg" style={{ background: gradient }} />
                  <div className="cat-card-header-content">
                    <span className="cat-card-icon">{icon}</span>
                    <div className="cat-card-title-group">
                      <h2>{catGroup.name}</h2>
                    </div>
                  </div>
                  <span className="cat-card-badge">
                    {catGroup.productCount.toLocaleString('fa-IR')} محصول فعال
                  </span>
                </div>

                <div className="cat-card-body">
                  <p className="cat-card-desc">{catGroup.description}</p>
                  
                  {catGroup.products.length > 0 && (
                    <div className="cat-products-list">
                      {catGroup.products.map((p) => (
                        <Link key={p.id || p.slug} href={productHref(p.slug)} className="cat-product-item">
                          <div className="cat-product-right">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={p.image_url} alt={p.name_fa} className="cat-product-thumb" loading="lazy" />
                            <span className="cat-product-name">{p.name_fa}</span>
                          </div>
                          <div className="cat-product-left">
                            <span className="cat-product-price">
                              {p.price ? `${p.price.toLocaleString('fa-IR')} تومان` : 'ناموجود'}
                            </span>
                            <span className="cat-product-arrow">←</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                <div className="cat-card-footer">
                  <Link href={targetUrl} className="cat-browse-btn">
                    مشاهده همه محصولات {catGroup.name}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}
