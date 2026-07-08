// /blog — the public, indexed blog, rendered in the magazine layout.
// The hero features the newest real CMS posts; the archive combines the
// authored product guides with the real posts. The site's main <Navbar> is the
// header (the bespoke magazine header was intentionally dropped).
import Navbar from '../../components/Navbar';
import BlogArchiveClient from './BlogArchiveClient';
import { fetchApiJson } from '../../lib/serverFetch.mjs';
import { ARTICLES } from '../../lib/articlesMockData.mjs';

const BASE_URL = 'https://nubixshop.ir';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const title = 'وبلاگ نوبیکس شاپ؛ مقالات و آموزش‌های گیمینگ';
  const description =
    'آخرین اخبار، آموزش‌ها و راهنمای خرید وی‌باکس، کروپک فورتنایت، اشتراک ChatGPT و دنیای گیم را در وبلاگ نوبیکس شاپ بخوانید.';
  return {
    title,
    description,
    alternates: {
      canonical: '/blog',
      types: { 'application/rss+xml': `${BASE_URL}/blog/feed.xml` },
    },
    openGraph: {
      title,
      description: 'مقالات و آموزش‌های دنیای گیم و محصولات دیجیتال در وبلاگ نوبیکس شاپ.',
      url: `${BASE_URL}/blog`,
      type: 'website',
      locale: 'fa_IR',
      images: [{ url: `${BASE_URL}/og-image.webp`, alt: 'وبلاگ نوبیکس شاپ' }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: 'مقالات و آموزش‌های دنیای گیم و محصولات دیجیتال در وبلاگ نوبیکس شاپ.',
      images: [`${BASE_URL}/og-image.webp`],
    },
  };
}

function toFaDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return '';
  }
}

// Map a real CMS post to the card/slide shape the magazine components expect.
function mapPost(p) {
  return {
    id: p.id,
    slug: p.slug,
    cat: 'guides',
    tag: p.category || 'راهنما',
    author: p.author && p.author !== 'admin' ? p.author : 'تیم نوبیکس شاپ',
    date: toFaDate(p.created_at),
    createdAt: p.created_at,
    title: p.title,
    excerpt: p.summary,
    theme: 'guides',
    label: '',
    image: p.cover_image || null,
    cover_image: p.cover_image || null,
  };
}

async function getRealPosts() {
  const posts = [];
  // The API paginates (~10/page); pull the first couple of pages to cover all.
  for (let page = 1; page <= 3; page += 1) {
    const data = await fetchApiJson(`/api/blog/articles?page=${page}`, { next: { revalidate: 120 } });
    const results = data?.results || [];
    posts.push(...results);
    if (!data || page >= (Number(data.pages) || 1)) break;
  }
  return posts.map(mapPost);
}

export default async function BlogPage() {
  const realPosts = await getRealPosts();

  // Hero = newest real posts (fall back to nothing if the API is unreachable).
  const featured = [...realPosts]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 5);

  // Archive = authored product guides + all real posts.
  const items = [...ARTICLES, ...realPosts];

  const blogJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'وبلاگ نوبیکس شاپ',
    url: `${BASE_URL}/blog`,
    inLanguage: 'fa-IR',
    publisher: { '@id': `${BASE_URL}/#organization` },
  };
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'نوبیکس شاپ', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: 'وبلاگ', item: `${BASE_URL}/blog` },
    ],
  };

  return (
    <>
      <Navbar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <BlogArchiveClient featured={featured} items={items} />
    </>
  );
}
