import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../../components/Navbar';
import StaticProductCard from '../../../components/StaticProductCard';
import { fetchApiJson } from '../../../lib/serverFetch.mjs';
import { SITE_ORIGIN } from '../../../lib/site.mjs';
import { categoryPathFromCode, categoryCodeFromSlug } from '../../../lib/productCategoryRoutes';

export const revalidate = 60;

const BASE_URL = SITE_ORIGIN;

// URL codes are lowercase; the backend category codes are uppercase.
const KNOWN_CODES = new Set(['fortnite', 'ai', 'giftcards', 'games', 'subscriptions', 'ingame', 'battlenet', 'accounts', 'coc', 'clash_royal', 'cod', 'battlefield6']);

// Persian buying-intent titles per category (fallback: generic pattern).
const TITLES = {
  fortnite: 'خرید محصولات فورتنایت؛ وی باکس، کروپک و بتل پس',
  ingame: 'خرید جم، یوسی و سکه بازی‌های آنلاین و موبایل',
  ai: 'خرید اشتراک هوش مصنوعی؛ ChatGPT و Gemini',
  giftcards: 'خرید گیفت کارت؛ پلی‌استیشن، استیم، ایکس‌باکس و گوگل پلی',
  battlenet: 'خرید بالانس بتل نت، اورواچ ۲ و محصولات دیابلو',
  games: 'خرید محصولات بازی‌ها؛ جم، سکه و آیتم',
  subscriptions: 'خرید اشتراک‌های دیجیتال با فعال‌سازی قانونی',
  coc: 'خرید اکانت و بلیت کلش اف کلنز',
  clash_royal: 'خرید جم و آفر کلش رویال',
  cod: 'خرید سی پی کالاف دیوتی',
  battlefield6: 'خرید بتلفیلد',
};

async function getCategory(code) {
  if (code === 'accounts' || code === 'account' || code === 'market') return { isMarketRedirect: true };
  if (!KNOWN_CODES.has(code)) return null;
  return fetchApiJson(`/api/categories/${code.toUpperCase().replace(/-/g, '_')}`);
}

export function generateStaticParams() {
  return [...KNOWN_CODES].map((code) => ({ code }));
}

export async function generateMetadata({ params }) {
  const { code } = await params;
  const cCode = (code || '').toLowerCase();
  if (cCode === 'accounts' || cCode === 'account' || cCode === 'market') {
    return { title: 'بازارچه خرید و فروش اکانت فورتنایت و آنلاین | جینکس فمیلی' };
  }
  const data = await getCategory(cCode);
  if (!data?.category) {
    return { title: 'دسته‌بندی پیدا نشد', robots: { index: false } };
  }
  const cat = data.category;
  const title = TITLES[cCode] || `خرید محصولات ${cat.name}`;
  const description = `${cat.description} — خرید با فعال‌سازی قانونی، تحویل سریع و پشتیبانی ۲۴/۷ از جینکس فمیلی. ${data.count} محصول فعال.`;
  return {
    title,
    description,
    alternates: { canonical: `/category/${cCode}` },
    openGraph: {
      title: `${title} | جینکس فمیلی`,
      description,
      url: `${BASE_URL}/category/${cCode}`,
      type: 'website',
      locale: 'fa_IR',
    },
  };
}

const SUBCATEGORIES = {
  ingame: [
    { key: 'all', label: 'همه آیتم‌ها' },
    { key: 'pubg-mobile', label: 'یوسی پابجی' },
    { key: 'free-fire', label: 'الماس فری فایر' },
    { key: 'cod-cp', label: 'سی پی کالاف' },
    { key: 'valorant-points', label: 'ولورانت پوینت' },
    { key: 'roblox', label: 'روباکس' },
    { key: 'mobile-legends', label: 'موبایل لجندز' },
    { key: 'supercell', label: 'جم سوپرسل' },
  ],
  giftcards: [
    { key: 'all', label: 'همه گیفت کارت‌ها' },
    { key: 'ps', label: 'پلی‌استیشن' },
    { key: 'steam', label: 'استیم' },
    { key: 'xbox', label: 'ایکس‌باکس' },
    { key: 'itunes', label: 'آیتونز' },
    { key: 'googleplay', label: 'گوگل‌پلی' },
  ],
  battlenet: [
    { key: 'all', label: 'همه محصولات' },
    { key: 'overwatch-2', label: 'اورواچ ۲' },
    { key: 'battlenet', label: 'گیفت کارت بتل نت' },
  ],
  games: [
    { key: 'all', label: 'همه بازی‌ها' },
    { key: 'battlenet', label: 'بتل نت' },
    { key: 'epicgames', label: 'ایپیک گیمز' },
  ]
};

export default async function CategoryPage({ params, searchParams }) {
  const { code: rawCode } = await params;
  const resolvedSearchParams = (await searchParams) || {};
  const sub = (resolvedSearchParams.sub || '').toLowerCase();
  
  const code = (rawCode || '').toLowerCase();
  const canonicalCode = categoryCodeFromSlug(code);
  const categoryCode = canonicalCode || code.toUpperCase().replace(/-/g, '_');
  const canonicalPath = categoryPathFromCode(categoryCode);

  // The former English-code addresses are retained only as permanent aliases;
  // a category has one indexable, Persian human-readable address.
  if (!canonicalCode) {
    permanentRedirect(canonicalPath);
  }
  const data = await getCategory(code);

  if (!data?.category) {
    notFound();
  }

  const cat = data.category;
  const allProducts = Array.isArray(data.products) ? data.products : [];
  
  // Filter products by sub parameter if it's specified and not 'all'
  let products = allProducts;
  if (sub && sub !== 'all') {
    products = allProducts.filter((p) => {
      const pSub = (p.subcategory || p.sub || '').toLowerCase();
      const pSlug = (p.slug || '').toLowerCase();
      return pSub === sub || pSlug.includes(sub) || pSlug.replace(/-/g, '').includes(sub);
    });
  }

  const title = TITLES[code] || `خرید محصولات ${cat.name}`;

  const collectionLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: title,
    description: cat.description,
    url: `${BASE_URL}${canonicalPath}`,
    inLanguage: 'fa-IR',
    isPartOf: { '@id': `${BASE_URL}/#website` },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: products.length,
      itemListElement: products
        .filter((p) => p.slug)
        .map((p, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: p.name_fa,
          url: `${BASE_URL}/product/${encodeURIComponent(p.slug)}`,
        })),
    },
  };
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'جینکس فمیلی', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: cat.name, item: `${BASE_URL}/category/${code}` },
    ],
  };

  return (
    <>
      <Navbar />
      <main className="container section" style={{ paddingTop: 30, paddingBottom: 80 }}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
        />

        <section className="category-page-top">
          <h1 className="sr-only">{title}</h1>
          <div className="category-hero-top">
            <nav aria-label="مسیر صفحه" className="category-crumbs">
              <Link href="/" className="category-crumb-link">جینکس فمیلی</Link>
              <span className="category-crumb-sep">/</span>
              <span className="category-crumb-current">{cat.name}</span>
            </nav>
            <Link href="/" className="category-home-btn">
              <span className="category-home-btn-arrow">←</span>
              <span>بازگشت به صفحه اصلی</span>
            </Link>
          </div>
          <div className="category-hero-body">
            <div className="category-kicker">{cat.icon} دسته‌بندی ویژه</div>
            <h1 className="category-title">{title}</h1>
            <p className="category-description">
              {cat.description} — همه محصولات این دسته با فعال‌سازی قانونی روی اکانت شما، پرداخت امن
              زرین‌پال و پشتیبانی ۲۴ ساعته جینکس فمیلی ارائه می‌شوند.
            </p>
          </div>
        </section>

        {/* Subcategory Chips Nav */}
        {SUBCATEGORIES[code] && (
          <div className="subnav" style={{ marginBottom: '32px' }}>
            <div className="chip-row" style={{ margin: 0 }}>
              {SUBCATEGORIES[code].map((sc) => {
                const isActive = (!sub && sc.key === 'all') || sub === sc.key;
                const href = sc.key === 'all' ? `/category/${code}` : `/category/${code}?sub=${sc.key}`;
                return (
                  <Link
                    key={sc.key}
                    href={href}
                    className={`chip${isActive ? ' active' : ''}`}
                  >
                    {sc.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--muted)' }}>
            محصولی در این دسته‌بندی فعال نیست.
          </div>
        ) : (
          <div className="cards">
            {products.map((p) => (
              <StaticProductCard key={p.id || p.slug} product={p} />
            ))}
          </div>
        )}

        <section style={{ marginTop: 40 }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)', marginBottom: 12 }}>
            سایر دسته‌بندی‌ها
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {[...KNOWN_CODES]
              .filter((c) => c !== code && c !== 'accounts' && c !== 'account' && c !== 'market')
              .map((c) => (
                <Link key={c} href={`/category/${c}`} className="ghost-btn">
                  {(TITLES[c] || `خرید محصولات ${c}`).split('؛')[0]}
                </Link>
              ))}
            <Link href="/blog" className="ghost-btn">وبلاگ جینکس فمیلی</Link>
          </div>
        </section>
      </main>
    </>
  );
}
