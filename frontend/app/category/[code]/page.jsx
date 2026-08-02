import { notFound, permanentRedirect } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../../components/Navbar';
import CategoriesSection from '../../../components/CategoriesSection';
import CategoryProductGrid from '../../../components/CategoryProductGrid';
import { fetchApiJson } from '../../../lib/serverFetch.mjs';
import { categoryPathFromCode } from '../../../lib/productCategoryRoutes';

export const revalidate = 60;

const BASE_URL = 'https://nubixshop.ir';

// URL codes are lowercase; the backend category codes are uppercase.
const KNOWN_CODES = new Set([
  'fortnite', 'pubg', 'cod-mobile', 'clash-royale', 'clash-of-clans',
  'brawl-stars', 'free-fire', 'valorant', 'rainbow-six', 'marvel-rivals',
  'ping-reduction', 'mobile-games', 'rocket-league', 'ai', 'giftcards',
  'games', 'subscriptions'
]);
const CATEGORY_NAVIGATION = [
  'فورتنایت', 'ولورانت', 'بازی‌ها', 'هوش مصنوعی', 'راکت لیگ',
  'کلش اف کلنز', 'کلش رویال', 'پابجی', 'کالاف دیوتی', 'براول استارز',
  'فری فایر', 'رینبو سیکس', 'مارول ریوالز', 'سرویس کاهش پینگ',
  'بازی‌های موبایل', 'گیفت کارت‌ها', 'اشتراک‌ها'
];

// Persian buying-intent titles per category (fallback: generic pattern).
const TITLES = {
  fortnite: 'خرید محصولات فورتنایت؛ وی باکس، کروپک و بتل پس',
  pubg: 'خرید یوسی و آفرهای پابجی موبایل؛ شارژ سریع و قانونی',
  'cod-mobile': 'خرید سی پی و آفرهای کالاف دیوتی موبایل',
  'clash-royale': 'خرید رویال پس و آفرهای کلش رویال',
  'clash-of-clans': 'خرید بلیت طلایی و جم کلش اف کلنز',
  'brawl-stars': 'خرید جم و براول پس براول استارز',
  'free-fire': 'خرید جم و آفرهای فری فایر',
  valorant: 'خرید ولورانت پوینت (VP) و آیتم‌های ولورانت',
  'rainbow-six': 'خرید ممبرشیپ و کردیت رینبو سیکس سیج',
  'marvel-rivals': 'خرید لاتیس و آیتم‌های مارول ریوالز',
  'ping-reduction': 'خرید اشتراک سرویس کاهش پینگ و رفع تحریم',
  'mobile-games': 'خرید آنلاین جم، یوسی و سکه بازی‌های موبایل',
  'rocket-league': 'خرید کردیت راکت لیگ؛ شارژ سریع و قانونی',
  ai: 'خرید اشتراک هوش مصنوعی؛ ChatGPT و Gemini',
  giftcards: 'خرید گیفت کارت؛ پلی‌استیشن، استیم، ایکس‌باکس و گوگل پلی',
  games: 'خرید محصولات بازی‌ها؛ پیش‌خرید GTA VI و بازی روز',
  subscriptions: 'خرید اشتراک‌های دیجیتال با فعال‌سازی قانونی',
};

async function getCategory(code) {
  if (!KNOWN_CODES.has(code)) return null;
  return fetchApiJson(`/api/categories/${code.toUpperCase().replace(/-/g, '_')}`);
}

export function generateStaticParams() {
  return [...KNOWN_CODES].map((code) => ({ code }));
}

export async function generateMetadata({ params }) {
  const { code } = await params;
  const data = await getCategory((code || '').toLowerCase());
  if (!data?.category) {
    return { title: 'دسته‌بندی پیدا نشد', robots: { index: false } };
  }
  const cat = data.category;
  const title = TITLES[code.toLowerCase()] || `خرید محصولات ${cat.name}`;
  const description = `${cat.description} — خرید با فعال‌سازی قانونی، تحویل سریع و پشتیبانی ۲۴/۷ از نوبیکس شاپ. ${data.count} محصول فعال.`;
  const canonicalPath = categoryPathFromCode(code.toUpperCase().replace(/-/g, '_'));
  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title: `${title} | نوبیکس شاپ`,
      description,
      url: `${BASE_URL}${canonicalPath}`,
      type: 'website',
      locale: 'fa_IR',
    },
  };
}

export default async function CategoryPage({ params, canonicalCode = null }) {
  const { code: rawCode } = await params;
  const code = (rawCode || '').toLowerCase();
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
  const products = Array.isArray(data.products) ? data.products : [];
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
      { '@type': 'ListItem', position: 1, name: 'نوبیکس شاپ', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: cat.name, item: `${BASE_URL}${canonicalPath}` },
    ],
  };

  return (
    <>
      <Navbar />
      <main className="container section" style={{ paddingTop: 20, paddingBottom: 80 }}>
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
              <Link href="/" className="category-crumb-link">نوبیکس شاپ</Link>
              <span className="category-crumb-sep">/</span>
              <span className="category-crumb-current">{cat.name}</span>
            </nav>
            <Link href="/" className="category-home-btn">
              <span className="category-home-btn-arrow">←</span>
              <span>بازگشت به صفحه اصلی</span>
            </Link>
          </div>
        </section>

        <CategoriesSection
          categories={CATEGORY_NAVIGATION}
          variant="products"
          className="category-page-navigation"
          activeCategoryCode={categoryCode}
        />

        {products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--muted)' }}>
            محصولی در این دسته‌بندی فعال نیست.
          </div>
        ) : (
          <CategoryProductGrid products={products} />
        )}

        <section style={{ marginTop: 40 }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)', marginBottom: 12 }}>
            سایر دسته‌بندی‌ها
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {[...KNOWN_CODES]
              .filter((c) => c !== code)
              .map((c) => (
                <Link key={c} href={categoryPathFromCode(c.toUpperCase().replace(/-/g, '_'))} className="ghost-btn">
                  {TITLES[c].split('؛')[0]}
                </Link>
              ))}
            <Link href="/blog" className="ghost-btn">وبلاگ نوبیکس شاپ</Link>
          </div>
        </section>
      </main>
    </>
  );
}
