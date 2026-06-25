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

export function buildProductJsonLd({ path, name, description, image, priceToman, stats }) {
  // Prices are in toman; schema.org IRR is rial (1 toman = 10 rial).
  const price = Number(priceToman || 0) * 10;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    image: image || `${BASE_URL}/web_logo.webp`,
    url: `${BASE_URL}${path}`,
    brand: { "@type": "Brand", name: "نوبیکس شاپ" },
    ...(price > 0 && {
      offers: {
        "@type": "Offer",
        price: String(price),
        priceCurrency: "IRR",
        availability: "https://schema.org/InStock",
        url: `${BASE_URL}${path}`,
      },
    }),
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
