// /blog/<slug> — a single article in the magazine template. Two content
// sources, one template: authored product guides (local body) and real CMS
// posts (fetched live, HTML sanitized server-side). SEO metadata, JSON-LD and
// the guide→/guides canonical overrides are preserved from the original blog.
import { notFound } from 'next/navigation';
import DOMPurify from 'isomorphic-dompurify';
import Navbar from '../../../components/Navbar';
import ArticleView from '../../../components/articles/ArticleView';
import { getServerApiBases } from '../../../lib/serverFetch.mjs';
import { getAuthoredArticle } from '../../../lib/articlesMockData.mjs';

export const dynamic = 'force-dynamic';

const BASE_URL = 'https://nubixshop.ir';

// A few posts mirror the /guides/* pages — canonicalize them to the guide so
// the two URLs don't compete in search.
const CANONICAL_OVERRIDES = {
  'remove-restriction': '/guides/remove-restriction',
  'link-unlink': '/guides/link-unlink',
  'disable-2fa': '/guides/disable-2fa',
};

// Imported CMS HTML is admin-authored, but we sanitize it here — server-side,
// before it's serialized into the SSR markup — as defense-in-depth against
// stored XSS (client-only sanitization would be too late, since a payload in
// the server-rendered HTML runs before hydration).
function sanitizeHtml(html) {
  if (!html) return '';
  return DOMPurify.sanitize(html, {
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'textarea', 'button'],
    ADD_ATTR: ['target'],
  });
}

function absolutizeMedia(url) {
  if (!url) return null;
  try {
    const u = new URL(url, BASE_URL);
    return `${BASE_URL}${u.pathname}${u.search}`;
  } catch {
    return null;
  }
}

function toFaDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return '';
  }
}

// Real 404 (drop the page) vs. network failure (throw → 5xx that Google retries).
async function fetchArticle(slug) {
  let networkFail = false;
  for (const base of getServerApiBases()) {
    try {
      const res = await fetch(`${base}/api/blog/articles/${encodeURIComponent(slug)}`, { cache: 'no-store' });
      if (res.status === 404) return { article: null, missing: true };
      if (!res.ok) continue;
      return { article: await res.json(), missing: false };
    } catch {
      networkFail = true;
    }
  }
  if (networkFail) throw new Error('blog article fetch failed on all API bases');
  return { article: null, missing: true };
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug);

  const authored = getAuthoredArticle(decoded);
  if (authored) {
    return {
      title: `${authored.title} | وبلاگ نوبیکس شاپ`,
      description: authored.excerpt,
      alternates: { canonical: `/blog/${decoded}` },
      openGraph: {
        type: 'article',
        url: `${BASE_URL}/blog/${decoded}`,
        title: authored.title,
        description: authored.excerpt,
        locale: 'fa_IR',
        siteName: 'نوبیکس شاپ',
      },
    };
  }

  try {
    const { article } = await fetchArticle(decoded);
    if (article) {
      const cover = absolutizeMedia(article.cover_image);
      const canonical = CANONICAL_OVERRIDES[decoded] || `/blog/${decoded}`;
      return {
        title: article.title,
        description: article.summary,
        alternates: { canonical },
        openGraph: {
          type: 'article',
          url: `${BASE_URL}/blog/${decoded}`,
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

export default async function BlogArticlePage({ params }) {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug);

  // 1) Authored product guide → render the local body.
  const authored = getAuthoredArticle(decoded);
  let article = null;
  let jsonLd = null;

  if (authored) {
    article = {
      ...authored,
      ...(authored.body || {}),
      author: authored.author || 'تیم نوبیکس شاپ',
      readingTime: authored.readingTime || '۴ دقیقه',
    };
    jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: authored.title,
      description: authored.excerpt,
      inLanguage: 'fa-IR',
      author: { '@type': 'Organization', name: 'نوبیکس شاپ' },
      publisher: { '@id': `${BASE_URL}/#organization` },
      mainEntityOfPage: `${BASE_URL}/blog/${decoded}`,
    };
  } else {
    // 2) Real CMS post → fetch + sanitize + re-skin.
    const { article: post, missing } = await fetchArticle(decoded);
    if (missing || !post) notFound();
    const cover = absolutizeMedia(post.cover_image);
    article = {
      slug: decoded,
      cat: 'guides',
      tag: post.category || 'راهنما',
      author: post.author && post.author !== 'admin' ? post.author : 'تیم نوبیکس شاپ',
      date: toFaDate(post.created_at),
      readingTime: '۵ دقیقه',
      title: post.title,
      theme: 'guides',
      label: '',
      image: post.cover_image || null,
      lead: post.summary || '',
      htmlContent: sanitizeHtml(post.content),
    };
    jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.summary,
      ...(cover && { image: cover }),
      datePublished: post.created_at,
      dateModified: post.updated_at || post.created_at,
      inLanguage: 'fa-IR',
      author: { '@type': 'Organization', name: 'نوبیکس شاپ' },
      publisher: { '@id': `${BASE_URL}/#organization` },
      mainEntityOfPage: `${BASE_URL}/blog/${decoded}`,
    };
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'نوبیکس شاپ', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: 'وبلاگ', item: `${BASE_URL}/blog` },
      { '@type': 'ListItem', position: 3, name: article.title, item: `${BASE_URL}/blog/${decoded}` },
    ],
  };

  return (
    <>
      <Navbar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <ArticleView article={article} />
    </>
  );
}
