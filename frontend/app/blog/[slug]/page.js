import { notFound } from 'next/navigation';
import Navbar from '../../../components/Navbar';
import Link from 'next/link';

export async function generateMetadata({ params }) {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';
  try {
    const res = await fetch(`${apiBase}/api/blog/articles/${params.slug}`);
    if (res.ok) {
      const article = await res.json();
      return {
        title: `${article.title} | نوبیکس شاپ`,
        description: article.summary,
      };
    }
  } catch (e) {}
  return { title: 'مقاله پیدا نشد' };
}

export const dynamic = 'force-dynamic';

export default async function ArticlePage({ params }) {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';
  let article = null;
  
  try {
    const res = await fetch(`${apiBase}/api/blog/articles/${params.slug}`, { cache: 'no-store' });
    if (res.ok) {
      article = await res.json();
    }
  } catch (e) {
    console.error(e);
  }

  if (!article) {
    notFound();
  }

  return (
    <>
      <Navbar />
      <main className="container section" style={{ paddingTop: '100px', paddingBottom: '100px' }}>
        <article style={{
          maxWidth: '800px',
          margin: '0 auto',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.05)',
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
            {article.category && (
              <Link href={`/blog?category=${article.category_slug}`} style={{
                display: 'inline-block',
                padding: '6px 12px',
                background: 'rgba(44, 75, 255, 0.1)',
                color: 'var(--primary-2)',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 'bold',
                textDecoration: 'none',
                marginBottom: '16px'
              }}>
                {article.category}
              </Link>
            )}
            
            <h1 style={{ fontSize: '36px', fontWeight: '900', color: '#fff', marginBottom: '24px', lineHeight: '1.4' }}>
              {article.title}
            </h1>
            
            <div style={{ display: 'flex', gap: '24px', alignItems: 'center', marginBottom: '40px', paddingBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--muted)', fontSize: '14px' }}>
                <span className="icon" style={{ fontSize: '18px' }}>✍️</span> {article.author}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--muted)', fontSize: '14px' }}>
                <span className="icon" style={{ fontSize: '18px' }}>📅</span> 
                {new Date(article.created_at).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
            
            <div 
              className="article-content"
              style={{
                color: '#cbd5e1',
                fontSize: '16px',
                lineHeight: '1.9',
              }}
              dangerouslySetInnerHTML={{ __html: article.content }} 
            />
          </div>
        </article>
      </main>

    </>
  );
}
