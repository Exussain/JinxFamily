const BASE_URL = 'https://nubixshop.ir';

async function fetchApi(path) {
  const bases = [
    (process.env.INTERNAL_API_BASE_URL || '').trim(),
    'http://127.0.0.1:8001',
    (process.env.NEXT_PUBLIC_API_BASE_URL || '').trim(),
  ].filter(Boolean);

  for (const base of bases) {
    try {
      const res = await fetch(`${base.replace(/\/+$/, '')}${path}`, { cache: 'no-store' });
      if (res.ok) return await res.json();
    } catch {
      continue;
    }
  }
  return null;
}

function fetchProduct(slug) {
  return fetchApi(`/api/products/${encodeURIComponent(slug)}`);
}

async function fetchReviewStats(slug) {
  const data = await fetchApi(`/api/products/${encodeURIComponent(slug)}/comments`);
  if (!data?.success || !data?.stats?.total) return null;
  return data.stats;
}

function buildDescription(product) {
  const plain = (product?.description || '')
    .replace(/\s+/g, ' ')
    .trim();
  if (plain.length > 40) return plain.slice(0, 157) + (plain.length > 157 ? '…' : '');
  const parts = [product?.name_fa, product?.subtitle].filter(Boolean).join(' — ');
  return `خرید ${parts} با فعال‌سازی قانونی، تحویل سریع و پشتیبانی ۲۴/۷ در نوبیکس شاپ`;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const product = await fetchProduct(slug);
  if (!product) {
    return { title: 'محصول', robots: { index: false } };
  }

  const title = product.subtitle
    ? `${product.name_fa} | ${product.subtitle}`
    : product.name_fa;
  const description = buildDescription(product);
  const image = product.image_url || '/web_logo.webp';

  return {
    title,
    description,
    alternates: { canonical: `/product/${slug}` },
    openGraph: {
      type: 'website',
      url: `${BASE_URL}/product/${slug}`,
      title,
      description,
      images: [{ url: image, alt: product.name_fa }],
      locale: 'fa_IR',
      siteName: 'نوبیکس شاپ',
    },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  };
}

export default async function ProductLayout({ children, params }) {
  const { slug } = await params;
  const [product, reviewStats] = await Promise.all([
    fetchProduct(slug),
    fetchReviewStats(slug),
  ]);

  let jsonLd = null;
  if (product?.name_fa) {
    // API prices are in toman; schema.org IRR is rial (1 toman = 10 rial).
    const price = Number(product.min_price || product.price || 0) * 10;
    jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name_fa,
      description: buildDescription(product),
      image: product.image_url || `${BASE_URL}/web_logo.webp`,
      url: `${BASE_URL}/product/${slug}`,
      brand: { '@type': 'Brand', name: product.category_title || 'نوبیکس شاپ' },
      ...(price > 0 && {
        offers: {
          '@type': 'Offer',
          price: String(price),
          priceCurrency: 'IRR',
          availability: 'https://schema.org/InStock',
          url: `${BASE_URL}/product/${slug}`,
        },
      }),
      ...(reviewStats && {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: Number(reviewStats.average_rating).toFixed(1),
          reviewCount: reviewStats.total,
          bestRating: 5,
          worstRating: 1,
        },
      }),
    };
  }

  const breadcrumbLd = product?.name_fa
    ? {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'نوبیکس شاپ', item: BASE_URL },
          ...(product.category_title
            ? [{
                '@type': 'ListItem',
                position: 2,
                name: product.category_title,
                item: `${BASE_URL}/?cat=${encodeURIComponent(product.category_title)}`,
              }]
            : []),
          {
            '@type': 'ListItem',
            position: product.category_title ? 3 : 2,
            name: product.name_fa,
            item: `${BASE_URL}/product/${slug}`,
          },
        ],
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {breadcrumbLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
        />
      )}
      {children}
    </>
  );
}
