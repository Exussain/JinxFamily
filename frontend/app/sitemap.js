const BASE_URL = 'https://nubixshop.ir';

async function getProductSlugs() {
  const bases = [
    (process.env.INTERNAL_API_BASE_URL || '').trim(),
    'http://127.0.0.1:8001',
    (process.env.NEXT_PUBLIC_API_BASE_URL || '').trim(),
  ].filter(Boolean);

  for (const base of bases) {
    try {
      const res = await fetch(`${base.replace(/\/+$/, '')}/api/products`, { cache: 'no-store' });
      if (!res.ok) continue;
      const data = await res.json();
      const list = data?.results || data || [];
      return list.map((p) => (p?.slug || '').trim()).filter(Boolean);
    } catch {
      continue;
    }
  }
  return [];
}

export default async function sitemap() {
  const staticRoutes = [
    { path: '/', priority: 1.0, changeFrequency: 'daily' },
    { path: '/crewpack', priority: 0.9, changeFrequency: 'daily' },
    { path: '/vbucks', priority: 0.9, changeFrequency: 'daily' },
    { path: '/gemini', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/lego', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/faq', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/faq/how-to-buy', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/faq/rules', priority: 0.5, changeFrequency: 'monthly' },
    { path: '/faq/privacy', priority: 0.5, changeFrequency: 'monthly' },
    { path: '/faq/contact', priority: 0.5, changeFrequency: 'monthly' },
    { path: '/contact', priority: 0.5, changeFrequency: 'monthly' },
    { path: '/help', priority: 0.5, changeFrequency: 'monthly' },
    { path: '/guide', priority: 0.5, changeFrequency: 'monthly' },
    { path: '/guides/disable-2fa', priority: 0.4, changeFrequency: 'monthly' },
    { path: '/guides/link-unlink', priority: 0.4, changeFrequency: 'monthly' },
    { path: '/guides/remove-restriction', priority: 0.4, changeFrequency: 'monthly' },
    { path: '/terms', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' },
  ];

  const now = new Date();
  const entries = staticRoutes.map(({ path, priority, changeFrequency }) => ({
    url: `${BASE_URL}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));

  const slugs = await getProductSlugs();
  for (const slug of slugs) {
    if (slug === 'fortnite-crew-pack') continue; // redirects to /crewpack
    entries.push({
      url: `${BASE_URL}/product/${slug}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    });
  }

  return entries;
}
