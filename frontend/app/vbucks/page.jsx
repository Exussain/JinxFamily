import VBucksClient from "./VBucksClient";
import { fetchReviewStats, buildProductJsonLd, buildBreadcrumbJsonLd, buildFaqJsonLd } from "../../lib/seoJsonLd.mjs";
import { fetchApiJson } from "../../lib/serverFetch.mjs";
import Navbar from "../../components/Navbar";
import '../globals.css';

export const dynamic = 'force-dynamic';

const OG_DESCRIPTION = 'خرید وی‌باکس با بهترین قیمت و تحویل فوری — شارژ مستقیم و قانونی روی اکانت شما.';

export const metadata = {
  title: 'خرید وی باکس فورتنایت (V-Bucks) با تحویل فوری',
  description: 'خرید وی باکس فورتنایت با بهترین قیمت و تحویل فوری — شارژ مستقیم و قانونی روی اکانت شما در همه پلتفرم‌ها. پشتیبانی ۲۴/۷ جینکس فمیلی.',
  alternates: { canonical: '/vbucks' },
  openGraph: {
    type: 'website',
    siteName: 'جینکس فمیلی',
    locale: 'fa_IR',
    title: 'خرید وی باکس فورتنایت (V-Bucks) | جینکس فمیلی',
    description: OG_DESCRIPTION,
    url: 'https://jinxfamily.ir/vbucks',
    images: [{ url: 'https://jinxfamily.ir/media/products/v-bucks-20260605194216.webp', alt: 'خرید وی باکس فورتنایت' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'خرید وی باکس فورتنایت (V-Bucks) | جینکس فمیلی',
    description: OG_DESCRIPTION,
    images: ['https://jinxfamily.ir/media/products/v-bucks-20260605194216.webp'],
  },
};

export default async function VBucksPage() {
  const [initialProductData, stats, productsPayload] = await Promise.all([
    fetchApiJson("/api/products/v-bucks"),
    fetchReviewStats("v-bucks"),
    fetchApiJson("/api/products?view=card&limit=20", { next: { revalidate: 60 } }),
  ]);
  const productLd = buildProductJsonLd({
    path: "/vbucks",
    name: initialProductData?.name_fa || "وی‌باکس فورتنایت (V-Bucks)",
    description: "خرید وی‌باکس فورتنایت با بهترین قیمت و تحویل فوری — شارژ مستقیم و قانونی روی اکانت شما.",
    image: initialProductData?.image_url,
    priceToman: initialProductData?.min_price || initialProductData?.price,
    stats,
    brand: "Epic Games",
    variants: initialProductData?.variants,
  });
  const breadcrumbLd = buildBreadcrumbJsonLd([
    { name: "جینکس فمیلی", path: "/" },
    { name: "وی‌باکس فورتنایت", path: "/vbucks" },
  ]);
  const faqLd = buildFaqJsonLd(initialProductData?.faq);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      {faqLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      )}
      <Navbar />
      <VBucksClient
        initialProductData={initialProductData}
        initialProducts={productsPayload?.results || []}
        initialStats={stats}
      />
    </>
  );
}
