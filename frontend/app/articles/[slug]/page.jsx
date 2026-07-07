// Single-article route for the magazine. Two content sources, one template:
//   • authored news/guides  → local body (sections + steps) from mock data.
//   • any other slug         → fetched live from /api/blog/articles/<slug>
//                              (the real published post) and re-skinned here.
// Next.js 16: `params` is a Promise and must be awaited. `noindex` keeps this
// showcase from competing with the canonical /blog articles in search.
import { notFound } from 'next/navigation';
import ArticleClient from './ArticleClient';
import { getAuthoredArticle } from '../../../lib/articlesMockData.mjs';
import { getServerApiBases } from '../../../lib/serverFetch.mjs';

export const dynamic = 'force-dynamic';

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
        htmlContent: article.content || '',
        imported: true,
      }}
    />
  );
}
