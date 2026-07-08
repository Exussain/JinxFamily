import { faqItems } from './faq/data.jsx';

const BASE_URL = 'https://nubixshop.ir';

// Product slugs that permanently redirect to a dedicated landing page
// (see next.config.js redirects) — never list them in the sitemap.
const REDIRECTED_PRODUCT_SLUGS = new Set([
  'fortnite-crew-pack', // → /crewpack
  'gta6', // → /gta6
  'v-bucks', // → /vbucks
  'gemini-subscription', // → /gemini
  'lego-starter-pack', // → /lego
]);

// Blog copies of the guide pages deliberately canonicalize to /guides/* in
// app/blog/[slug]/page.js, so the canonical guide URLs are the only sitemap
// entries. Listing the blog twins creates avoidable "alternate canonical" GSC
// noise.
const CANONICALIZED_BLOG_SLUGS = new Set([
  'remove-restriction',
  'link-unlink',
  'disable-2fa',
]);

function getApiBases() {
  return [
    (process.env.INTERNAL_API_BASE_URL || '').trim(),
    'http://127.0.0.1:8001',
    (process.env.NEXT_PUBLIC_API_BASE_URL || '').trim(),
  ].filter(Boolean);
}

async function fetchApi(path) {
  for (const base of getApiBases()) {
    try {
      const res = await fetch(`${base.replace(/\/+$/, '')}${path}`, { cache: 'no-store' });
      if (!res.ok) continue;
      return await res.json();
    } catch {
      continue;
    }
  }
  return null;
}

async function getProducts() {
  const data = await fetchApi('/api/products');
  const list = data?.results || data || [];
  return (Array.isArray(list) ? list : [])
    .map((p) => ({
      slug: (p?.slug || '').trim(),
      updatedAt: p?.updated_at || p?.created_at || null,
    }))
    .filter((p) => p.slug);
}

async function getBlogArticles() {
  const articles = [];
  let page = 1;
  let totalPages = 1;
  do {
    const data = await fetchApi(`/api/blog/articles?page=${page}`);
    if (!data) break;
    for (const a of data.results || []) {
      if (a?.slug) {
        articles.push({ slug: a.slug, updatedAt: a.updated_at || a.created_at || null });
      }
    }
    totalPages = Number(data.pages) || 1;
    page += 1;
  } while (page <= totalPages && page <= 20);
  return articles;
}

// The /blog page mixes the real CMS posts with seven hand-written product
// guides served from a local module. The CMS API doesn't know about them, so
// we list them here directly. The slugs must stay in sync with
// frontend/lib/articlesMockData.mjs `ARTICLES`.
const AUTHORED_GUIDE_SLUGS = [
  'guide-buy-vbucks',
  'guide-crew-pack',
  'guide-buy-chatgpt-plus',
  'guide-gemini-advanced',
  'guide-buy-steam-giftcard',
  'guide-preorder-gta6',
  'guide-spotify-premium',
];

export default async function sitemap() {
  // Only canonical URLs here: alias routes (/contact, /help, /guide, /terms,
  // /privacy) canonicalize or redirect to /faq/* pages, so they are omitted.
  const staticRoutes = [
    { path: '/', priority: 1.0, changeFrequency: 'daily' },
    { path: '/crewpack', priority: 0.9, changeFrequency: 'daily' },
    { path: '/vbucks', priority: 0.9, changeFrequency: 'daily' },
    { path: '/gta6', priority: 0.9, changeFrequency: 'daily' },
    { path: '/gemini', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/lego', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/blog', priority: 0.7, changeFrequency: 'weekly' },
    { path: '/category/fortnite', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/category/ai', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/category/giftcards', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/category/games', priority: 0.7, changeFrequency: 'weekly' },
    { path: '/category/subscriptions', priority: 0.7, changeFrequency: 'weekly' },
    { path: '/faq', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/faq/about', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/faq/how-to-buy', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/faq/rules', priority: 0.5, changeFrequency: 'monthly' },
    { path: '/faq/privacy', priority: 0.5, changeFrequency: 'monthly' },
    { path: '/faq/contact', priority: 0.5, changeFrequency: 'monthly' },
    { path: '/guides/disable-2fa', priority: 0.4, changeFrequency: 'monthly' },
    { path: '/guides/link-unlink', priority: 0.4, changeFrequency: 'monthly' },
    { path: '/guides/remove-restriction', priority: 0.4, changeFrequency: 'monthly' },
    { path: '/reseller', priority: 0.5, changeFrequency: 'monthly' },
    { path: '/spin', priority: 0.4, changeFrequency: 'monthly' },
  ];

  // No fabricated lastModified on static routes — Google learns to distrust
  // sitemaps whose lastmod changes on every fetch.
  const entries = staticRoutes.map(({ path, priority, changeFrequency }) => ({
    url: `${BASE_URL}${path}`,
    changeFrequency,
    priority,
  }));

  for (const item of faqItems) {
    if (item?.slug) {
      entries.push({
        url: `${BASE_URL}/faq/${item.slug}`,
        changeFrequency: 'monthly',
        priority: 0.5,
      });
    }
  }

  const [products, articles] = await Promise.all([getProducts(), getBlogArticles()]);

  for (const { slug, updatedAt } of products) {
    if (REDIRECTED_PRODUCT_SLUGS.has(slug)) continue;
    entries.push({
      url: `${BASE_URL}/product/${encodeURIComponent(slug)}`,
      ...(updatedAt && { lastModified: new Date(updatedAt) }),
      changeFrequency: 'daily',
      priority: 0.8,
    });
  }

  for (const { slug, updatedAt } of articles) {
    if (CANONICALIZED_BLOG_SLUGS.has(slug)) continue;
    entries.push({
      url: `${BASE_URL}/blog/${encodeURIComponent(slug)}`,
      ...(updatedAt && { lastModified: new Date(updatedAt) }),
      changeFrequency: 'monthly',
      priority: 0.6,
    });
  }

  // Hand-written product guides live in articlesMockData.mjs; the CMS API
  // can't see them, so we list them here directly.
  for (const slug of AUTHORED_GUIDE_SLUGS) {
    if (CANONICALIZED_BLOG_SLUGS.has(slug)) continue;
    entries.push({
      url: `${BASE_URL}/blog/${encodeURIComponent(slug)}`,
      changeFrequency: 'monthly',
      priority: 0.6,
    });
  }

  return entries;
}
