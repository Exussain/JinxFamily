import { normalizeSlug } from '../../../lib/productSlug.mjs';
import { categoryPathFromCode } from '../../../lib/productCategoryRoutes';

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

async function fetchReviews(slug) {
  const data = await fetchApi(`/api/products/${encodeURIComponent(slug)}/comments`);
  if (!data?.success) return { stats: null, comments: [] };
  return {
    stats: data.stats?.total ? data.stats : null,
    comments: Array.isArray(data.comments) ? data.comments : [],
  };
}

function absolutize(url) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

// schema.org brand should be the actual maker, not our category label.
function brandFor(slug, product) {
  const s = (slug || '').toLowerCase();
  const cat = (product?.category || '').toLowerCase();
  if (s.includes('chatgpt')) return 'OpenAI';
  if (s.includes('gemini')) return 'Google';
  if (s.includes('spotify')) return 'Spotify';
  if (s.includes('telegram')) return 'Telegram';
  if (s.includes('gta')) return 'Rockstar Games';
  if (cat === 'rocket_league' || s.includes('rocket-league')) return 'Psyonix';
  if (s.includes('استیم') || s.includes('steam')) return 'Steam';
  if (s.includes('پلی-استیشن') || s.includes('playstation') || s.includes('psn')) return 'PlayStation';
  if (s.includes('اپل') || s.includes('apple')) return 'Apple';
  if (cat === 'fortnite' || s.includes('fortnite') || s.includes('v-bucks')) return 'Epic Games';
  return 'نوبیکس شاپ';
}

// Truncate on code points, never inside a surrogate pair — descriptions are
// full of emoji, and a split pair produces a lone surrogate that invalidates
// the JSON-LD ("Truncated Unicode character" in Search Console).
function truncateChars(str, max) {
  const chars = Array.from(str);
  if (chars.length <= max) return str;
  return chars.slice(0, max).join('') + '…';
}

function buildDescription(product) {
  const plain = (product?.description || '')
    .replace(/\s+/g, ' ')
    .trim();
  if (plain.length > 40) return truncateChars(plain, 157);
  const parts = [product?.name_fa, product?.subtitle].filter(Boolean).join(' — ');
  return `خرید ${parts} با فعال‌سازی قانونی، تحویل سریع و پشتیبانی ۲۴/۷ در نوبیکس شاپ`;
}

// Digital codes/top-ups: delivered instantly, non-returnable. Google Merchant
// flags offers without these two fields ("Missing hasMerchantReturnPolicy /
// shippingDetails"), so every Offer/AggregateOffer carries them.
const RETURN_POLICY = {
  '@type': 'MerchantReturnPolicy',
  applicableCountry: 'IR',
  returnPolicyCategory: 'https://schema.org/MerchantReturnNotPermitted',
};
const SHIPPING_DETAILS = {
  '@type': 'OfferShippingDetails',
  shippingRate: { '@type': 'MonetaryAmount', value: '0', currency: 'IRR' },
  shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'IR' },
  deliveryTime: {
    '@type': 'ShippingDeliveryTime',
    handlingTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 1, unitCode: 'DAY' },
    transitTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 0, unitCode: 'DAY' },
  },
};

export async function generateMetadata({ params }) {
  const { slug: rawSlug } = await params;
  const slug = normalizeSlug(rawSlug);
  const product = await fetchProduct(slug);
  if (!product) {
    return { title: 'محصول', robots: { index: false } };
  }

  const title = product.subtitle
    ? `${product.name_fa} | ${product.subtitle}`
    : product.name_fa;
  const description = buildDescription(product);
  const image = absolutize(product.cover_16_9 || product.image_url) || `${BASE_URL}/web_logo.webp`;
  const canonicalPath = `/product/${encodeURIComponent(slug)}`;

  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      type: 'website',
      url: `${BASE_URL}${canonicalPath}`,
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
  const { slug: rawSlug } = await params;
  const slug = normalizeSlug(rawSlug);
  const [product, { stats, comments }] = await Promise.all([
    fetchProduct(slug),
    fetchReviews(slug),
  ]);

  const scripts = [];

  if (product?.name_fa) {
    const productUrl = `${BASE_URL}/product/${encodeURIComponent(slug)}`;
    // API prices are in toman; schema.org IRR is rial (1 toman = 10 rial).
    const variantPrices = (product.variants || [])
      .map((v) => Number(v?.price) || 0)
      .filter((p) => p > 0)
      .map((p) => p * 10);
    // Fall back to the cheapest variant when the product-level price is 0 —
    // a Product without offers is invalid for rich results.
    let minPrice = Number(product.min_price || product.price || 0) * 10;
    if (!minPrice && variantPrices.length) minPrice = Math.min(...variantPrices);
    const maxPrice = variantPrices.length ? Math.max(...variantPrices) : minPrice;
    const priceValidUntil = new Date(Date.now() + 30 * 24 * 3600 * 1000)
      .toISOString()
      .slice(0, 10);
    const availability =
      product.purchasable === false
        ? 'https://schema.org/OutOfStock'
        : 'https://schema.org/InStock';

    const offers =
      variantPrices.length > 1 && maxPrice > minPrice
        ? {
            '@type': 'AggregateOffer',
            lowPrice: String(minPrice),
            highPrice: String(maxPrice),
            offerCount: variantPrices.length,
            priceCurrency: 'IRR',
            validFrom: new Date().toISOString().slice(0, 10),
            priceValidUntil,
            availability,
            url: productUrl,
            hasMerchantReturnPolicy: RETURN_POLICY,
            shippingDetails: SHIPPING_DETAILS,
          }
        : minPrice > 0
          ? {
              '@type': 'Offer',
              price: String(minPrice),
              priceCurrency: 'IRR',
              validFrom: new Date().toISOString().slice(0, 10),
              priceValidUntil,
              availability,
              url: productUrl,
              hasMerchantReturnPolicy: RETURN_POLICY,
              shippingDetails: SHIPPING_DETAILS,
            }
          : null;

    scripts.push({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name_fa,
      description: buildDescription(product),
      image: absolutize(product.cover_16_9 || product.image_url) || `${BASE_URL}/web_logo.webp`,
      url: productUrl,
      brand: { '@type': 'Brand', name: brandFor(slug, product) },
      ...(offers && { offers }),
      ...(stats && {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: Number(stats.average_rating).toFixed(1),
          reviewCount: stats.total,
          bestRating: 5,
          worstRating: 1,
        },
      }),
      ...(comments.length && {
        review: comments.slice(0, 5).map((c) => ({
          '@type': 'Review',
          author: { '@type': 'Person', name: c.author_name || 'کاربر نوبیکس' },
          reviewRating: {
            '@type': 'Rating',
            ratingValue: c.rating,
            bestRating: 5,
            worstRating: 1,
          },
          reviewBody: c.text,
          ...(c.created_at && { datePublished: String(c.created_at).slice(0, 10) }),
        })),
      }),
    });

    scripts.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'نوبیکس شاپ', item: BASE_URL },
        ...(product.category === 'ROCKET_LEAGUE'
          ? [{ '@type': 'ListItem', position: 2, name: 'راکت لیگ', item: `${BASE_URL}${categoryPathFromCode('ROCKET_LEAGUE')}` }]
          : []),
        { '@type': 'ListItem', position: product.category === 'ROCKET_LEAGUE' ? 3 : 2, name: product.name_fa, item: productUrl },
      ],
    });

    if (Array.isArray(product.faq) && product.faq.length) {
      const faqEntities = product.faq
        .filter((f) => f?.q && f?.a)
        .map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        }));
      if (faqEntities.length) {
        scripts.push({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqEntities,
        });
      }
    }
  }

  return (
    <>
      {scripts.map((data, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
      ))}
      {children}
    </>
  );
}
