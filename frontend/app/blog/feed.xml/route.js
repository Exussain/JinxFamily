import { fetchApiJson } from '../../../lib/serverFetch.mjs';
import { SITE_ORIGIN } from '../../../lib/site.mjs';

const BASE_URL = SITE_ORIGIN;
const CANONICALIZED_BLOG_SLUGS = new Set([
  'remove-restriction',
  'link-unlink',
  'disable-2fa',
]);

function escapeXml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const articles = [];
  let page = 1;
  let totalPages = 1;
  do {
    const data = await fetchApiJson(`/api/blog/articles?page=${page}`);
    if (!data) break;
    articles.push(...(data.results || []));
    totalPages = Number(data.pages) || 1;
    page += 1;
  } while (page <= totalPages && page <= 20);

  const items = articles
    .filter((a) => a?.slug && !CANONICALIZED_BLOG_SLUGS.has(a.slug))
    .map((a) => {
      const url = `${BASE_URL}/blog/${encodeURIComponent(a.slug)}`;
      const pubDate = new Date(a.created_at || Date.now()).toUTCString();
      return `    <item>
      <title>${escapeXml(a.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(a.summary)}</description>
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>وبلاگ جینکس فمیلی</title>
    <link>${BASE_URL}/blog</link>
    <description>مقالات و آموزش‌های خرید وی باکس، کروپک فورتنایت، اشتراک ChatGPT و دنیای گیم</description>
    <language>fa-ir</language>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=600',
    },
  });
}
