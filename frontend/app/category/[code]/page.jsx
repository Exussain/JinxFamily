import { notFound } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../../components/Navbar';
import ProductCard from '../../../components/ProductCard';
import { fetchApiJson } from '../../../lib/serverFetch.mjs';

export const dynamic = 'force-dynamic';

const BASE_URL = 'https://nubixshop.ir';

// URL codes are lowercase; the backend category codes are uppercase.
const KNOWN_CODES = new Set(['fortnite', 'ai', 'giftcards', 'games', 'subscriptions']);

// Persian buying-intent titles per category (fallback: generic pattern).
const TITLES = {
  fortnite: 'خرید محصولات فورتنایت؛ وی باکس، کروپک و بتل پس',
  ai: 'خرید اشتراک هوش مصنوعی؛ ChatGPT و Gemini',
  giftcards: 'خرید گیفت کارت؛ پلی‌استیشن، استیم، ایکس‌باکس و گوگل پلی',
  games: 'خرید محصولات بازی‌ها؛ جم، سکه و آیتم',
  subscriptions: 'خرید اشتراک‌های دیجیتال با فعال‌سازی قانونی',
};

async function getCategory(code) {
  if (!KNOWN_CODES.has(code)) return null;
  return fetchApiJson(`/api/categories/${code.toUpperCase()}`);
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
  return {
    title,
    description,
    alternates: { canonical: `/category/${code.toLowerCase()}` },
    openGraph: {
      title: `${title} | نوبیکس شاپ`,
      description,
      url: `${BASE_URL}/category/${code.toLowerCase()}`,
      type: 'website',
      locale: 'fa_IR',
    },
  };
}

export default async function CategoryPage({ params }) {
  const { code: rawCode } = await params;
  const code = (rawCode || '').toLowerCase();
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
    url: `${BASE_URL}/category/${code}`,
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
      { '@type': 'ListItem', position: 2, name: cat.name, item: `${BASE_URL}/category/${code}` },
    ],
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

        <section className="category-hero">
          <div className="category-hero-glow" aria-hidden="true" />
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
          <div className="category-hero-body">
            <div className="category-kicker">{cat.icon} دسته‌بندی ویژه</div>
            <h1 className="category-title">{title}</h1>
            <p className="category-description">
              {cat.description} — همه محصولات این دسته با فعال‌سازی قانونی روی اکانت شما، پرداخت امن
              زرین‌پال و پشتیبانی ۲۴ ساعته نوبیکس شاپ ارائه می‌شوند.
            </p>
          </div>
        </section>

        {products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--muted)' }}>
            محصولی در این دسته‌بندی فعال نیست.
          </div>
        ) : (
          <div className="cards">
            {products.map((p) => (
              <ProductCard key={p.id || p.slug} p={p} imageFit="cover" />
            ))}
          </div>
        )}

        <section style={{ marginTop: 40 }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)', marginBottom: 12 }}>
            سایر دسته‌بندی‌ها
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {[...KNOWN_CODES]
              .filter((c) => c !== code)
              .map((c) => (
                <Link key={c} href={`/category/${c}`} className="ghost-btn">
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
