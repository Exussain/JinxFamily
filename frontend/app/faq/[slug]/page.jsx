import { notFound } from 'next/navigation';
import Link from 'next/link';
import FaqSectionLayout from '../../../components/FaqSectionLayout';
import HelpfulnessWidget from '../HelpfulnessWidget';
import { faqItems } from '../data.jsx';

export function generateStaticParams() {
  return faqItems.map((f) => ({ slug: f.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const item = faqItems.find((f) => f.slug === slug);
  if (item) {
    return {
      title: item.question,
      description: item.answer,
      alternates: { canonical: `/faq/${slug}` },
      openGraph: {
        title: item.question,
        description: item.answer,
        url: `https://nubixshop.ir/faq/${slug}`,
        type: 'article',
        images: [
          {
            url: 'https://nubixshop.ir/og-image.webp',
            alt: 'سوالات متداول نوبیکس شاپ',
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: item.question,
        description: item.answer,
        images: ['https://nubixshop.ir/og-image.webp'],
      },
    };
  }
  return { title: 'مقاله یافت نشد', robots: { index: false } };
}

export default async function FaqDetailPage({ params }) {
  const { slug } = await params;
  const article = faqItems.find((f) => f.slug === slug);

  if (!article) {
    notFound();
  }

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'نوبیکس شاپ', item: 'https://nubixshop.ir' },
      { '@type': 'ListItem', position: 2, name: 'مرکز پشتیبانی', item: 'https://nubixshop.ir/faq' },
      { '@type': 'ListItem', position: 3, name: article.question, item: `https://nubixshop.ir/faq/${slug}` },
    ],
  };

  // Get related articles (exclude current one, get up to 2 items)
  const relatedArticles = faqItems
    .filter((f) => f.slug !== article.slug)
    .slice(0, 2);

  return (
    <FaqSectionLayout
      title={article.question}
      subtitle={`بخش سوالات متداول • دسته‌بندی ${article.category}`}
      activeSection="faq"
    >
      <div className="faq-article-container">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
        />
        <style>{`
          .faq-article-container {
            display: flex;
            flex-direction: column;
            gap: 24px;
            width: 100%;
          }
          
          /* Breadcrumbs */
          .faq-breadcrumbs {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
            color: var(--muted);
          }
          
          .faq-breadcrumbs a {
            color: var(--muted);
            text-decoration: none;
            transition: color 0.2s;
          }
          
          .faq-breadcrumbs a:hover {
            color: var(--primary);
          }
          
          .faq-breadcrumb-separator {
            opacity: 0.6;
          }
          
          /* Main Article Box */
          .faq-article-box {
            background: var(--card);
            border: 1px solid var(--line);
            border-radius: 24px;
            overflow: hidden;
            box-shadow: var(--shadow);
          }
          
          .faq-article-banner {
            height: 180px;
            background: linear-gradient(135deg, var(--primary), var(--primary-2));
            position: relative;
            padding: 40px;
            display: flex;
            align-items: flex-end;
            overflow: hidden;
          }
          
          .faq-article-banner::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: radial-gradient(circle at 80% 20%, rgba(255,255,255,0.15) 0%, transparent 60%);
            pointer-events: none;
          }
          
          .faq-article-banner-icon {
            position: absolute;
            top: 20px;
            left: 20px;
            font-size: 80px;
            opacity: 0.15;
            user-select: none;
          }
          
          .faq-article-meta {
            display: flex;
            flex-direction: column;
            gap: 8px;
            z-index: 1;
          }
          
          .faq-article-tag {
            align-self: flex-start;
            font-size: 12px;
            font-weight: 800;
            color: #fff;
            background: rgba(255, 255, 255, 0.2);
            padding: 4px 12px;
            border-radius: 99px;
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
          }
          
          .faq-article-banner .page-banner-title {
            margin: 0;
            font-size: 28px;
            font-weight: 900;
            color: #fff;
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          
          .faq-article-info-bar {
            display: flex;
            gap: 20px;
            padding: 16px 40px;
            background: rgba(255, 255, 255, 0.02);
            border-bottom: 1px solid var(--line);
            font-size: 13px;
            color: var(--muted);
          }
          
          .faq-info-item {
            display: flex;
            align-items: center;
            gap: 6px;
          }
          
          .faq-article-content {
            padding: 40px;
            color: var(--text);
            font-size: 16px;
            line-height: 1.9;
          }
          
          .faq-article-content :global(h3) {
            font-size: 20px;
            font-weight: 800;
            margin: 32px 0 16px;
            color: var(--text);
            border-bottom: 1px solid var(--line);
            padding-bottom: 10px;
          }
          
          .faq-article-content :global(p) {
            margin: 0 0 20px;
            color: var(--text);
            opacity: 0.95;
          }
          
          .faq-article-content :global(ul), .faq-article-content :global(ol) {
            margin: 0 0 24px;
            padding-inline-start: 24px;
          }
          
          .faq-article-content :global(li) {
            margin-bottom: 8px;
            color: var(--text);
            opacity: 0.95;
          }
          
          .faq-article-content :global(strong) {
            color: var(--text);
            font-weight: 700;
          }
          
          /* Related Articles */
          .faq-related-section {
            margin-top: 24px;
          }
          
          .faq-related-title {
            font-size: 16px;
            font-weight: 800;
            color: var(--text);
            margin: 0 0 16px;
          }
          
          .faq-related-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
          }
          
          .faq-related-card {
            background: var(--card);
            border: 1px solid var(--line);
            border-radius: 18px;
            padding: 20px;
            text-decoration: none;
            color: var(--text);
            transition: all 0.25s ease;
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          
          .faq-related-card:hover {
            transform: translateY(-3px);
            border-color: var(--primary);
            box-shadow: var(--shadow);
          }
          
          .faq-related-card h4 {
            margin: 0;
            font-size: 15px;
            font-weight: 800;
            color: var(--text);
            transition: color 0.2s;
          }
          
          .faq-related-card:hover h4 {
            color: var(--primary);
          }
          
          .faq-related-desc {
            font-size: 13px;
            color: var(--muted);
            line-height: 1.6;
            margin: 0;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          
          @media (max-width: 768px) {
            .faq-article-banner {
              height: 140px;
              padding: 24px;
            }
            .faq-article-banner .page-banner-title {
              font-size: 20px;
            }
            .faq-article-info-bar {
              padding: 12px 24px;
              flex-wrap: wrap;
              gap: 12px;
            }
            .faq-article-content {
              padding: 24px;
              font-size: 15px;
            }
            .faq-related-grid {
              grid-template-columns: 1fr;
              gap: 12px;
            }
          }
        `}</style>

        {/* Breadcrumbs */}
        <div className="faq-breadcrumbs">
          <Link href="/">نوبیکس شاپ</Link>
          <span className="faq-breadcrumb-separator">/</span>
          <Link href="/faq">مرکز پشتیبانی</Link>
          <span className="faq-breadcrumb-separator">/</span>
          <span style={{ color: 'var(--text)', fontWeight: 600 }}>{article.question}</span>
        </div>

        {/* Article Box */}
        <article className="faq-article-box">
          <div className="faq-article-banner">
            <span className="faq-article-banner-icon">{article.icon}</span>
            <div className="faq-article-meta">
              <span className="faq-article-tag">{article.category}</span>
              <h2 className="page-banner-title">{article.question}</h2>
            </div>
          </div>
          
          <div className="faq-article-info-bar">
            <div className="faq-info-item">
              <span>✍️</span>
              <span>نویسنده: {article.author}</span>
            </div>
            <div className="faq-info-item">
              <span>📅</span>
              <span>بروزرسانی: {article.date}</span>
            </div>
            <div className="faq-info-item">
              <span>⏱️</span>
              <span>زمان مطالعه: {article.readTime}</span>
            </div>
          </div>

          <div 
            className="faq-article-content" 
            dangerouslySetInnerHTML={{ __html: article.content }} 
          />
        </article>

        {/* Interactive Feedback */}
        <HelpfulnessWidget />

        {/* Related Articles */}
        <div className="faq-related-section">
          <h3 className="faq-related-title">شاید برای شما مفید باشد:</h3>
          <div className="faq-related-grid">
            {relatedArticles.map((rel) => (
              <Link key={rel.slug} href={`/faq/${rel.slug}`} className="faq-related-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '18px' }}>{rel.icon}</span>
                  <h4>{rel.question}</h4>
                </div>
                <p className="faq-related-desc">{rel.answer}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </FaqSectionLayout>
  );
}
