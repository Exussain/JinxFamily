import CrewPackClient from "./CrewPackClient";
import { fetchReviewStats, buildProductJsonLd, buildBreadcrumbJsonLd } from "../../lib/seoJsonLd.mjs";
import { fetchApiJson } from "../../lib/serverFetch.mjs";

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'خرید کروپک فورتنایت (Fortnite Crew)',
  description: 'خرید اشتراک کروپک فورتنایت با فعال‌سازی قانونی روی اکانت شما — شامل اسکین انحصاری، ۱۰۰۰ وی‌باکس و بتل پس. تحویل سریع و پشتیبانی ۲۴/۷.',
  alternates: { canonical: '/crewpack' },
  openGraph: {
    title: 'خرید کروپک فورتنایت (Fortnite Crew) | نوبیکس شاپ',
    description: 'اشتراک کروپک فورتنایت با فعال‌سازی قانونی — اسکین انحصاری، ۱۰۰۰ وی‌باکس و بتل پس.',
    url: 'https://nubixshop.ir/crewpack',
  },
};

export default async function CrewPackPage() {
  const [initialProduct, stats] = await Promise.all([
    fetchApiJson("/api/products/fortnite-crew-pack"),
    fetchReviewStats("fortnite-crew-pack"),
  ]);
  const productLd = buildProductJsonLd({
    path: "/crewpack",
    name: initialProduct?.name_fa || "کروپک فورتنایت (Fortnite Crew)",
    description: "اشتراک کروپک فورتنایت با فعال‌سازی قانونی — اسکین انحصاری، ۱۰۰۰ وی‌باکس و بتل پس.",
    image: initialProduct?.image_url,
    priceToman: initialProduct?.min_price || initialProduct?.price,
    stats,
  });
  const breadcrumbLd = buildBreadcrumbJsonLd([
    { name: "نوبیکس شاپ", path: "/" },
    { name: "کروپک فورتنایت", path: "/crewpack" },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <CrewPackClient initialProduct={initialProduct} />
    </>
  );
}
