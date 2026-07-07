import Link from 'next/link';
import Navbar from '../../components/Navbar';
import { fetchApiJson } from '../../lib/serverFetch.mjs';

export const dynamic = 'force-dynamic';

const CANONICAL_ARTICLE_PATHS = {
  'remove-restriction': '/guides/remove-restriction',
  'link-unlink': '/guides/link-unlink',
  'disable-2fa': '/guides/disable-2fa',
};

function articleHref(slug) {
  return CANONICAL_ARTICLE_PATHS[slug] || `/blog/${slug}`;
}

export async function generateMetadata({ searchParams }) {
  const resolved = await searchParams;
  const category = (resolved?.category || '').trim();
  const page = Number(resolved?.page) > 1 ? Number(resolved.page) : 1;

  // Each filter/page combination gets its own self-referencing canonical so
  // parameter URLs don't collapse into (or duplicate) the main listing.
  let canonical = '/blog';
  if (category) canonical = `/blog?category=${encodeURIComponent(category)}`;
  else if (page > 1) canonical = `/blog?page=${page}`;

  let title = 'وبلاگ نوبیکس شاپ؛ مقالات و آموزش‌های گیمینگ';
  if (category) {
    const catData = await fetchApiJson('/api/blog/categories');
    const cat = (catData?.results || []).find((c) => c.slug === category);
    if (cat?.name) title = `مقالات ${cat.name} | وبلاگ`;
  } else if (page > 1) {
    title = `وبلاگ نوبیکس شاپ — صفحه ${page}`;
  }

  return {
    title,
    description:
      'آخرین اخبار، آموزش‌ها و راهنمای خرید وی باکس، کروپک فورتنایت، اشتراک ChatGPT و دنیای گیم را در وبلاگ نوبیکس شاپ بخوانید.',
    alternates: {
      canonical,
      types: { 'application/rss+xml': `${'https://nubixshop.ir'}/blog/feed.xml` },
    },
    openGraph: {
      title,
      description: 'مقالات و آموزش‌های دنیای گیم و محصولات دیجیتال در وبلاگ نوبیکس شاپ.',
      url: `https://nubixshop.ir${canonical}`,
      type: 'website',
      locale: 'fa_IR',
      images: [
        {
          url: 'https://nubixshop.ir/og-image.webp',
          alt: 'وبلاگ نوبیکس شاپ',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: 'مقالات و آموزش‌های دنیای گیم و محصولات دیجیتال در وبلاگ نوبیکس شاپ.',
      images: ['https://nubixshop.ir/og-image.webp'],
    },
  };
}

export default async function BlogPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const category = resolvedSearchParams?.category || '';
  const page = Number(resolvedSearchParams?.page) > 1 ? Number(resolvedSearchParams.page) : 1;

  let articles = [];
  let categories = [];
  let totalPages = 1;

  const data = await fetchApiJson(
    `/api/blog/articles?category=${encodeURIComponent(category)}&page=${page}`,
    { next: { revalidate: 60 } }
  );
  if (data) {
    articles = data.results || [];
    totalPages = Number(data.pages) || 1;
  }
  const catData = await fetchApiJson('/api/blog/categories', { next: { revalidate: 600 } });
  if (catData) categories = catData.results || [];

  const pageHref = (n) => {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (n > 1) params.set('page', String(n));
    const qs = params.toString();
    return qs ? `/blog?${qs}` : '/blog';
  };

  return (
    <>
      <Navbar />
      <main className="container section" style={{ paddingTop: '100px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '900', color: 'var(--text)', marginBottom: '12px' }}>وبلاگ نوبیکس شاپ</h1>
          <p style={{ color: 'var(--muted)', fontSize: '16px', maxWidth: '600px', margin: '0 auto' }}>
            آخرین اخبار، نقد و بررسی‌ها و آموزش‌های دنیای گیم را اینجا بخوانید.
          </p>
        </div>

        {/* Categories */}
        {categories.length > 0 && (
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '40px' }}>
            <Link 
              href="/blog"
              className={`blog-category-link ${!category ? 'active' : ''}`}
            >
              همه مقالات
            </Link>
            {categories.map(c => (
              <Link
                key={c.id}
                href={`/blog?category=${c.slug}`}
                className={`blog-category-link ${category === c.slug ? 'active' : ''}`}
              >
                {c.name}
              </Link>
            ))}
          </div>
        )}

        {/* Articles Grid */}
        {articles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--muted)' }}>
            مقاله‌ای یافت نشد.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
            <style>{`
              .blog-category-link {
                padding: 8px 16px;
                border-radius: 24px;
                background: var(--line);
                color: var(--text);
                text-decoration: none;
                font-size: 14px;
                font-weight: bold;
                transition: all 0.2s;
                border: 1px solid var(--line);
              }
              .blog-category-link:hover {
                background: var(--card);
                border-color: var(--primary);
                color: var(--primary);
              }
              .blog-category-link.active {
                background: var(--primary);
                color: #fff;
                border-color: var(--primary);
              }
              :root[data-theme="dark"] .blog-category-link.active {
                color: #13112c;
              }
              .article-card {
                background: var(--card);
                border: 1px solid var(--line);
                border-radius: 20px;
                overflow: hidden;
                display: flex;
                flex-direction: column;
                height: 100%;
                transition: transform 0.2s, box-shadow 0.2s, background-color 0.2s, border-color 0.2s;
              }
              .article-card:hover {
                transform: translateY(-4px);
                box-shadow: var(--shadow);
                border-color: var(--primary);
              }
            `}</style>
            {articles.map(article => (
              <Link href={articleHref(article.slug)} key={article.id} style={{ textDecoration: 'none' }}>
                <div className="article-card">
                  {article.cover_image ? (
                    <div style={{ height: '180px', width: '100%', backgroundImage: `url(${article.cover_image})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                  ) : (
                    <div style={{ height: '180px', width: '100%', background: 'linear-gradient(135deg, #1f2937, #111827)' }} />
                  )}
                  <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    {article.category && (
                      <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 'bold', marginBottom: '8px' }}>
                        {article.category}
                      </span>
                    )}
                    <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text)', marginBottom: '12px', lineHeight: '1.4' }}>
                      {article.title}
                    </h3>
                    <p style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: '1.6', flex: 1, marginBottom: '16px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                      {article.summary}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--line)' }}>
                      <span style={{ fontSize: '12px', color: 'var(--muted)' }}>✍️ {article.author}</span>
                      <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                        {new Date(article.created_at).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination — server-rendered links so every page is crawlable */}
        {totalPages > 1 && (
          <nav
            aria-label="صفحه‌بندی مقالات"
            style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center', margin: '40px 0 16px', flexWrap: 'wrap' }}
          >
            {page > 1 && (
              <Link href={pageHref(page - 1)} className="blog-category-link">← قبلی</Link>
            )}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <Link
                key={n}
                href={pageHref(n)}
                className={`blog-category-link ${n === page ? 'active' : ''}`}
                aria-current={n === page ? 'page' : undefined}
              >
                {n.toLocaleString('fa-IR')}
              </Link>
            ))}
            {page < totalPages && (
              <Link href={pageHref(page + 1)} className="blog-category-link">بعدی →</Link>
            )}
          </nav>
        )}
      </main>
    </>
  );
}
