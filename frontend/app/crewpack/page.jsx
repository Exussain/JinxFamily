import { preload } from "react-dom";
import CrewPackClient from "./CrewPackClient";
import { fetchReviewStats, buildProductJsonLd, buildBreadcrumbJsonLd, buildFaqJsonLd } from "../../lib/seoJsonLd.mjs";
import { fetchApiJson } from "../../lib/serverFetch.mjs";

export const revalidate = 60;

  const OG_IMAGE = 'https://nubixshop.ir/media/products/fortnite-crew-pack-20260701063129.webp';
const OG_DESCRIPTION = 'اشتراک کروپک فورتنایت با فعال‌سازی قانونی — اسکین انحصاری، ۱۰۰۰ وی‌باکس و بتل پس.';

export const metadata = {
  title: 'خرید کروپک فورتنایت (Fortnite Crew)',
  description: 'خرید اشتراک کروپک فورتنایت با فعال‌سازی قانونی روی اکانت شما — شامل اسکین انحصاری، ۱۰۰۰ وی‌باکس و بتل پس. تحویل سریع و پشتیبانی ۲۴/۷.',
  alternates: { canonical: '/crewpack' },
  openGraph: {
    type: 'website',
    siteName: 'نوبیکس شاپ',
    locale: 'fa_IR',
    title: 'خرید کروپک فورتنایت (Fortnite Crew) | نوبیکس شاپ',
    description: OG_DESCRIPTION,
    url: 'https://nubixshop.ir/crewpack',
    images: [{ url: OG_IMAGE, alt: 'خرید کروپک فورتنایت' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'خرید کروپک فورتنایت (Fortnite Crew) | نوبیکس شاپ',
    description: OG_DESCRIPTION,
    images: [OG_IMAGE],
  },
};

export default async function CrewPackPage() {
  const [initialProduct, stats, productsPayload] = await Promise.all([
    fetchApiJson("/api/products/fortnite-crew-pack"),
    fetchReviewStats("fortnite-crew-pack"),
    fetchApiJson("/api/products"),
  ]);
  // The hero image is the LCP element — start its download from the <head>
  // instead of waiting for body parse (React 19 dedupes into one preload).
  preload(initialProduct?.cover_16_9 || initialProduct?.image_url || OG_IMAGE, { as: "image", fetchPriority: "high" });
  const productLd = buildProductJsonLd({
    path: "/crewpack",
    name: initialProduct?.name_fa || "کروپک فورتنایت (Fortnite Crew)",
    description: "اشتراک کروپک فورتنایت با فعال‌سازی قانونی — اسکین انحصاری، ۱۰۰۰ وی‌باکس و بتل پس.",
    image: initialProduct?.cover_16_9 || initialProduct?.image_url,
    priceToman: initialProduct?.min_price || initialProduct?.price,
    stats,
    brand: "Epic Games",
    variants: initialProduct?.variants,
  });
  const breadcrumbLd = buildBreadcrumbJsonLd([
    { name: "نوبیکس شاپ", path: "/" },
    { name: "کروپک فورتنایت", path: "/crewpack" },
  ]);
  const faqLd = buildFaqJsonLd(initialProduct?.faq);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      {faqLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      )}
      <CrewPackClient
        initialProduct={initialProduct}
        initialStats={stats}
        initialProducts={productsPayload?.results || []}
      />
    </>
  );
}
