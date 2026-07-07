import { notFound } from 'next/navigation';
import Navbar from '../../../components/Navbar';
import Link from 'next/link';
import { getServerApiBases } from '../../../lib/serverFetch.mjs';

const BASE_URL = 'https://nubixshop.ir';

// A few articles mirror the /guides/* pages almost verbatim — canonicalize
// them to the guide so the two URLs stop competing.
const CANONICAL_OVERRIDES = {
  'remove-restriction': '/guides/remove-restriction',
  'link-unlink': '/guides/link-unlink',
  'disable-2fa': '/guides/disable-2fa',
};

// Media URLs from loopback fetches reflect the internal host — rewrite them
// to the public domain before putting them in metadata/JSON-LD.
function absolutizeMedia(url) {
  if (!url) return null;
  try {
    const u = new URL(url, BASE_URL);
    return `${BASE_URL}${u.pathname}${u.search}`;
  } catch {
    return null;
  }
}

// Distinguish a real 404 (drop the page) from a network failure (throw so
// Next serves a 5xx that Google retries, instead of a permanent 404).
async function fetchArticle(slug) {
  let sawNetworkFailure = false;
  for (const base of getServerApiBases()) {
    try {
      const res = await fetch(`${base}/api/blog/articles/${encodeURIComponent(slug)}`, {
        cache: 'no-store',
      });
      if (res.status === 404) return { article: null, missing: true };
      if (!res.ok) continue;
      return { article: await res.json(), missing: false };
    } catch {
      sawNetworkFailure = true;
      continue;
    }
  }
  if (sawNetworkFailure) throw new Error('blog article fetch failed on all API bases');
  return { article: null, missing: true };
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  try {
    const { article } = await fetchArticle(slug);
    if (article) {
      const cover = absolutizeMedia(article.cover_image);
      const canonical = CANONICAL_OVERRIDES[slug] || `/blog/${slug}`;
      return {
        title: article.title,
        description: article.summary,
        alternates: { canonical },
        openGraph: {
          type: 'article',
          url: `${BASE_URL}/blog/${slug}`,
          title: article.title,
          description: article.summary,
          publishedTime: article.created_at,
          modifiedTime: article.updated_at || article.created_at,
          locale: 'fa_IR',
          siteName: 'نوبیکس شاپ',
          ...(cover && { images: [{ url: cover, alt: article.title }] }),
        },
        twitter: {
          card: cover ? 'summary_large_image' : 'summary',
          title: article.title,
          description: article.summary,
          ...(cover && { images: [cover] }),
        },
      };
    }
  } catch {}
  return { title: 'مقاله پیدا نشد', robots: { index: false } };
}

export const dynamic = 'force-dynamic';

export default async function ArticlePage({ params }) {
  const { slug } = await params;
  const { article, missing } = await fetchArticle(slug);

  if (missing || !article) {
    notFound();
  }

  const cover = absolutizeMedia(article.cover_image);
  const authorName = article.author || 'تیم نوبیکس شاپ';

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.title,
    description: article.summary,
    ...(cover && { image: cover }),
    datePublished: article.created_at,
    dateModified: article.updated_at || article.created_at,
    inLanguage: 'fa-IR',
    author: { '@type': 'Organization', name: 'نوبیکس شاپ' },
    publisher: { '@id': `${BASE_URL}/#organization` },
    mainEntityOfPage: `${BASE_URL}/blog/${slug}`,
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'نوبیکس شاپ', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: 'وبلاگ', item: `${BASE_URL}/blog` },
      { '@type': 'ListItem', position: 3, name: article.title, item: `${BASE_URL}/blog/${slug}` },
    ],
  };

  return (
    <>
      <Navbar />
      <main className="container section" style={{ paddingTop: '100px', paddingBottom: '100px' }}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
        <article style={{
          maxWidth: '800px',
          margin: '0 auto',
          background: 'var(--card)',
          border: '1px solid var(--line)',
          borderRadius: '24px',
          overflow: 'hidden'
        }}>
          {article.cover_image && (
            <div style={{
              width: '100%',
              height: '400px',
              backgroundImage: `url(${article.cover_image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }} />
          )}

          <div style={{ padding: '40px 32px' }}>
            <nav aria-label="مسیر صفحه" style={{ display: 'flex', gap: '8px', fontSize: '13px', color: 'var(--muted)', marginBottom: '16px' }}>
              <Link href="/" style={{ color: 'var(--muted)', textDecoration: 'none' }}>نوبیکس شاپ</Link>
              <span>/</span>
              <Link href="/blog" style={{ color: 'var(--muted)', textDecoration: 'none' }}>وبلاگ</Link>
            </nav>

            {article.category && (
              <Link href={`/blog?category=${article.category_slug}`} style={{
                display: 'inline-block',
                padding: '6px 12px',
                background: 'rgba(124, 58, 237, 0.1)',
                color: 'var(--primary)',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 'bold',
                textDecoration: 'none',
                marginBottom: '16px'
              }}>
                {article.category}
              </Link>
            )}

            <h1 style={{ fontSize: '36px', fontWeight: '900', color: 'var(--text)', marginBottom: '24px', lineHeight: '1.4' }}>
              {article.title}
            </h1>

            <div style={{ display: 'flex', gap: '24px', alignItems: 'center', marginBottom: '40px', paddingBottom: '24px', borderBottom: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--muted)', fontSize: '14px' }}>
                <span className="icon" style={{ fontSize: '18px' }}>✍️</span> {authorName}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--muted)', fontSize: '14px' }}>
                <span className="icon" style={{ fontSize: '18px' }}>📅</span>
                {new Date(article.created_at).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>

            <div
              className="article-content"
              style={{
                color: 'var(--text)',
                fontSize: '16px',
                lineHeight: '1.9',
              }}
              dangerouslySetInnerHTML={{ __html: article.content }}
            />

            {/* CTA: connect blog content to the store's money pages */}
            <aside style={{
              marginTop: '40px',
              padding: '24px',
              borderRadius: '16px',
              border: '1px solid var(--line)',
              background: 'rgba(124, 58, 237, 0.04)'
            }}>
              <h2 style={{ fontSize: '17px', fontWeight: '800', color: 'var(--text)', margin: '0 0 12px' }}>
                خرید از نوبیکس شاپ
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: '2', margin: '0 0 16px' }}>
                برای خرید قانونی و تحویل سریع محصولات دیجیتال، این صفحه‌ها را ببینید:
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                <Link href="/vbucks" className="ghost-btn">خرید وی باکس فورتنایت</Link>
                <Link href="/crewpack" className="ghost-btn">خرید کروپک فورتنایت</Link>
                <Link href="/product/chatgpt-subscription" className="ghost-btn">اشتراک ChatGPT</Link>
                <Link href="/gemini" className="ghost-btn">اشتراک Gemini</Link>
              </div>
            </aside>
          </div>
        </article>
      </main>

    </>
  );
}
