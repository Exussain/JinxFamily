import Link from 'next/link';
import Navbar from '../../components/Navbar';

export const metadata = {
  title: 'وبلاگ نوبیکس شاپ - مقالات و اخبار گیمینگ',
  description: 'آخرین اخبار، آموزش‌ها و مقالات جذاب دنیای بازی‌های ویدیویی را در بلاگ نوبیکس شاپ بخوانید.',
};

export const dynamic = 'force-dynamic';

export default async function BlogPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';
  const category = resolvedSearchParams?.category || '';
  const page = resolvedSearchParams?.page || 1;
  
  let articles = [];
  let categories = [];
  let totalPages = 1;
  
  try {
    const res = await fetch(`${apiBase}/api/blog/articles?category=${category}&page=${page}`, { next: { revalidate: 60 } });
    if (res.ok) {
      const data = await res.json();
      articles = data.results || [];
      totalPages = data.pages || 1;
    }
    
    const catRes = await fetch(`${apiBase}/api/blog/categories`, { next: { revalidate: 600 } });
    if (catRes.ok) {
      const catData = await catRes.json();
      categories = catData.results || [];
    }
  } catch (e) {
    console.error("Failed to fetch blog data:", e);
  }

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
              <Link href={`/blog/${article.slug}`} key={article.id} style={{ textDecoration: 'none' }}>
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
      </main>
    </>
  );
}
