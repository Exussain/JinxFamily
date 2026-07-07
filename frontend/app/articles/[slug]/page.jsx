// Single-article route for the magazine. Two content sources, one template:
//   • authored news/guides  → local body (sections + steps) from mock data.
//   • any other slug         → fetched live from /api/blog/articles/<slug>
//                              (the real published post) and re-skinned here.
// Next.js 16: `params` is a Promise and must be awaited. `noindex` keeps this
// showcase from competing with the canonical /blog articles in search.
import { notFound } from 'next/navigation';
import DOMPurify from 'isomorphic-dompurify';
import ArticleClient from './ArticleClient';
import { getAuthoredArticle } from '../../../lib/articlesMockData.mjs';
import { getServerApiBases } from '../../../lib/serverFetch.mjs';

export const dynamic = 'force-dynamic';

// Imported blog HTML is admin-authored, but we sanitize it here (server-side,
// before it's ever serialized into the SSR HTML) as defense-in-depth against
// stored XSS — client-only sanitization would be too late, since a payload in
// the server-rendered markup runs before hydration. Strips scripts, event
// handlers, javascript:/data: URLs (DOMPurify defaults) plus embedding/form
// tags; keeps the formatting tags real posts use (headings, lists, links, img).
function sanitizeHtml(html) {
  if (!html) return '';
  return DOMPurify.sanitize(html, {
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'textarea', 'button'],
    ADD_ATTR: ['target'],
  });
}

export const metadata = {
  title: 'مقاله — مجله نوبیکس شاپ',
  robots: { index: false, follow: false },
};

// Distinguish a real 404 (missing post) from a network blip (throw → 5xx).
async function fetchImported(slug) {
  let networkFail = false;
  for (const base of getServerApiBases()) {
    try {
      const res = await fetch(`${base}/api/blog/articles/${encodeURIComponent(slug)}`, {
        cache: 'no-store',
      });
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

function toFaDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return '';
  }
}

export default async function ArticleShowcasePage({ params }) {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug);

  // 1) Authored article (news or category guide) → render the local body.
  const authored = getAuthoredArticle(decoded);
  if (authored) {
    return (
      <ArticleClient
        article={{
          ...authored,
          ...(authored.body || {}),
          author: authored.author || 'تیم نوبیکس شاپ',
          readingTime: authored.readingTime || '۴ دقیقه',
        }}
      />
    );
  }

  // 2) Otherwise import a real published post and re-skin it in this template.
  const { article, missing } = await fetchImported(decoded);
  if (missing || !article) notFound();

  return (
    <ArticleClient
      article={{
        slug: decoded,
        cat: 'guides',
        tag: article.category || 'راهنما',
        author: article.author && article.author !== 'admin' ? article.author : 'تیم نوبیکس شاپ',
        date: toFaDate(article.created_at),
        readingTime: '۵ دقیقه',
        title: article.title,
        theme: 'guides',
        label: '',
        image: article.cover_image || null,
        lead: article.summary || '',
        htmlContent: sanitizeHtml(article.content),
        imported: true,
      }}
    />
  );
}
