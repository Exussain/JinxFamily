import VBucksClient from "./VBucksClient";
import { fetchReviewStats, buildProductJsonLd, buildBreadcrumbJsonLd } from "../../lib/seoJsonLd.mjs";
import { fetchApiJson } from "../../lib/serverFetch.mjs";

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'خرید وی‌باکس فورتنایت (V-Bucks)',
  description: 'خرید وی‌باکس فورتنایت با بهترین قیمت و تحویل فوری — شارژ مستقیم و قانونی روی اکانت شما در همه پلتفرم‌ها. پشتیبانی ۲۴/۷ نوبیکس شاپ.',
  alternates: { canonical: '/vbucks' },
  openGraph: {
    title: 'خرید وی‌باکس فورتنایت (V-Bucks) | نوبیکس شاپ',
    description: 'خرید وی‌باکس با بهترین قیمت و تحویل فوری — شارژ مستقیم و قانونی روی اکانت شما.',
    url: 'https://nubixshop.ir/vbucks',
  },
};

export default async function VBucksPage() {
  const [initialProductData, stats] = await Promise.all([
    fetchApiJson("/api/products/v-bucks"),
    fetchReviewStats("v-bucks"),
  ]);
  const productLd = buildProductJsonLd({
    path: "/vbucks",
    name: initialProductData?.name_fa || "وی‌باکس فورتنایت (V-Bucks)",
    description: "خرید وی‌باکس فورتنایت با بهترین قیمت و تحویل فوری — شارژ مستقیم و قانونی روی اکانت شما.",
    image: initialProductData?.image_url,
    priceToman: initialProductData?.min_price || initialProductData?.price,
    stats,
  });
  const breadcrumbLd = buildBreadcrumbJsonLd([
    { name: "نوبیکس شاپ", path: "/" },
    { name: "وی‌باکس فورتنایت", path: "/vbucks" },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <VBucksClient initialProductData={initialProductData} />
    </>
  );
}
