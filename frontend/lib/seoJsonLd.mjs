const BASE_URL = "https://nubixshop.ir";

export async function fetchReviewStats(slug) {
  const bases = [
    (process.env.INTERNAL_API_BASE_URL || "").trim(),
    "http://127.0.0.1:8001",
    (process.env.NEXT_PUBLIC_API_BASE_URL || "").trim(),
  ].filter(Boolean);

  for (const base of bases) {
    try {
      const res = await fetch(
        `${base.replace(/\/+$/, "")}/api/products/${encodeURIComponent(slug)}/comments`,
        { cache: "no-store" }
      );
      if (!res.ok) continue;
      const data = await res.json();
      if (data?.success && data?.stats?.total) return data.stats;
      return null;
    } catch {
      continue;
    }
  }
  return null;
}

function absolutize(url) {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

// Digital codes/top-ups: delivered instantly, non-returnable. Google Merchant
// flags offers missing these two fields, so every Offer/AggregateOffer
// carries them (mirrored in app/product/[slug]/layout.jsx).
const RETURN_POLICY = {
  "@type": "MerchantReturnPolicy",
  applicableCountry: "IR",
  returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted",
};
const SHIPPING_DETAILS = {
  "@type": "OfferShippingDetails",
  shippingRate: { "@type": "MonetaryAmount", value: "0", currency: "IRR" },
  shippingDestination: { "@type": "DefinedRegion", addressCountry: "IR" },
  deliveryTime: {
    "@type": "ShippingDeliveryTime",
    handlingTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 1, unitCode: "DAY" },
    transitTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 0, unitCode: "DAY" },
  },
};

export function buildProductJsonLd({ path, name, description, image, priceToman, stats, brand, variants }) {
  // Prices are in toman; schema.org IRR is rial (1 toman = 10 rial).
  const variantPrices = (variants || [])
    .map((v) => Number(v?.price) || 0)
    .filter((p) => p > 0)
    .map((p) => p * 10);
  // Fall back to the cheapest variant when the product-level price is 0 —
  // a Product without offers is invalid for rich results.
  let price = Number(priceToman || 0) * 10;
  if (!price && variantPrices.length) price = Math.min(...variantPrices);
  const highPrice = variantPrices.length ? Math.max(...variantPrices) : price;
  const priceValidUntil = new Date(Date.now() + 30 * 24 * 3600 * 1000)
    .toISOString()
    .slice(0, 10);

  const offers =
    variantPrices.length > 1 && highPrice > price
      ? {
          "@type": "AggregateOffer",
          lowPrice: String(price),
          highPrice: String(highPrice),
          offerCount: variantPrices.length,
          priceCurrency: "IRR",
          validFrom: new Date().toISOString().slice(0, 10),
          priceValidUntil,
          availability: "https://schema.org/InStock",
          url: `${BASE_URL}${path}`,
          hasMerchantReturnPolicy: RETURN_POLICY,
          shippingDetails: SHIPPING_DETAILS,
        }
      : price > 0
        ? {
            "@type": "Offer",
            price: String(price),
            priceCurrency: "IRR",
            validFrom: new Date().toISOString().slice(0, 10),
            priceValidUntil,
            availability: "https://schema.org/InStock",
            url: `${BASE_URL}${path}`,
            hasMerchantReturnPolicy: RETURN_POLICY,
            shippingDetails: SHIPPING_DETAILS,
          }
        : null;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    image: absolutize(image) || `${BASE_URL}/web_logo.webp`,
    url: `${BASE_URL}${path}`,
    brand: { "@type": "Brand", name: brand || "نوبیکس شاپ" },
    ...(offers && { offers }),
    ...(stats && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: Number(stats.average_rating).toFixed(1),
        reviewCount: stats.total,
        bestRating: 5,
        worstRating: 1,
      },
    }),
  };
}

export function buildFaqJsonLd(items) {
  const entities = (items || [])
    .filter((f) => f && (f.q || f.question) && (f.a || f.answer))
    .map((f) => ({
      "@type": "Question",
      name: f.q || f.question,
      acceptedAnswer: { "@type": "Answer", text: f.a || f.answer },
    }));
  if (!entities.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entities,
  };
}

export function buildBreadcrumbJsonLd(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map(({ name, path }, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name,
      item: `${BASE_URL}${path}`,
    })),
  };
}
