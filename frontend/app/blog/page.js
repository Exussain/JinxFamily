import Link from 'next/link';
import Navbar from '../../components/Navbar';

export const metadata = {
  title: 'وبلاگ نوبیکس شاپ - مقالات و اخبار گیمینگ',
  description: 'آخرین اخبار، آموزش‌ها و مقالات جذاب دنیای بازی‌های ویدیویی را در بلاگ نوبیکس شاپ بخوانید.',
};

export const dynamic = 'force-dynamic';

export default async function BlogPage({ searchParams }) {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';
  const category = searchParams.category || '';
  const page = searchParams.page || 1;
  
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
          <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#fff', marginBottom: '12px' }}>وبلاگ نوبیکس شاپ</h1>
          <p style={{ color: 'var(--muted)', fontSize: '16px', maxWidth: '600px', margin: '0 auto' }}>
            آخرین اخبار، نقد و بررسی‌ها و آموزش‌های دنیای گیم را اینجا بخوانید.
          </p>
        </div>

        {/* Categories */}
        {categories.length > 0 && (
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '40px' }}>
            <Link 
              href="/blog"
              style={{
                padding: '8px 16px',
                borderRadius: '24px',
                background: !category ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                color: '#fff',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 'bold',
                transition: 'all 0.2s'
              }}
            >
              همه مقالات
            </Link>
            {categories.map(c => (
              <Link
                key={c.id}
                href={`/blog?category=${c.slug}`}
                style={{
                  padding: '8px 16px',
                  borderRadius: '24px',
                  background: category === c.slug ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                  color: '#fff',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  transition: 'all 0.2s'
                }}
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
            {articles.map(article => (
              <Link href={`/blog/${article.slug}`} key={article.id} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.2)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  {article.cover_image ? (
                    <div style={{ height: '180px', width: '100%', backgroundImage: `url(${article.cover_image})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                  ) : (
                    <div style={{ height: '180px', width: '100%', background: 'linear-gradient(135deg, #1f2937, #111827)' }} />
                  )}
                  <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    {article.category && (
                      <span style={{ fontSize: '12px', color: 'var(--primary-2)', fontWeight: 'bold', marginBottom: '8px' }}>
                        {article.category}
                      </span>
                    )}
                    <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#fff', marginBottom: '12px', lineHeight: '1.4' }}>
                      {article.title}
                    </h3>
                    <p style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: '1.6', flex: 1, marginBottom: '16px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                      {article.summary}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
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
