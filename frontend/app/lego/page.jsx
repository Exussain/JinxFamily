import ProductPageClient from "../product/[slug]/ProductPageClient";
import { fetchApiJson } from "../../lib/serverFetch.mjs";
import {
  fetchReviewStats,
  buildProductJsonLd,
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
} from "../../lib/seoJsonLd.mjs";

export const revalidate = 60;

const LEGO_SLUG = "lego-starter-pack";
const OG_DESCRIPTION =
  "خرید پک لگو فورتنایت Operation Brite شامل Brite Agent Outfit، Starbrite Back Bling و بسته دکور — تحویل سریع و فعال‌سازی قانونی.";

export const metadata = {
  title: "خرید لگو فورتنایت | Operation Brite Starter Pack",
  description:
    "خرید Operation Brite Starter Pack لگو فورتنایت شامل Brite Agent Outfit (LEGO Style)، Starbrite Back Bling و بسته دکور ۱۳‌تایی اتاق Brite Bomber. تحویل سریع و پشتیبانی آنلاین.",
  keywords: [
    "Operation Brite Starter Pack",
    "لگو فورتنایت",
    "بسته لگو Brite",
    "خرید Operation Brite فورتنایت",
  ],
  alternates: { canonical: "/lego" },
  openGraph: {
    type: "website",
    siteName: "نوبیکس شاپ",
    locale: "fa_IR",
    title: "خرید لگو فورتنایت | Operation Brite Starter Pack",
    description: OG_DESCRIPTION,
    url: "https://nubixshop.ir/lego",
    images: [
      {
        url: "https://nubixshop.ir/media/products/lego-starter-pack-20260605194438.webp",
        alt: "لگو فورتنایت Operation Brite",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "خرید لگو فورتنایت | Operation Brite Starter Pack",
    description: OG_DESCRIPTION,
    images: ["https://nubixshop.ir/media/products/lego-starter-pack-20260605194438.webp"],
  },
};

export default async function LegoStarterPackPage() {
  const [productData, productsPayload, stats] = await Promise.all([
    fetchApiJson(`/api/products/${LEGO_SLUG}`),
    fetchApiJson("/api/products"),
    fetchReviewStats(LEGO_SLUG),
  ]);

  const productLd = buildProductJsonLd({
    path: "/lego",
    name: productData?.name_fa || "Operation Brite Starter Pack (لگو فورتنایت)",
    description: productData?.description || OG_DESCRIPTION,
    image: productData?.cover_16_9 || productData?.image_url,
    priceToman: productData?.min_price || productData?.price,
    stats,
    brand: "Epic Games",
    variants: productData?.variants,
  });
  const breadcrumbLd = buildBreadcrumbJsonLd([
    { name: "نوبیکس شاپ", path: "/" },
    { name: "لگو فورتنایت", path: "/lego" },
  ]);
  const faqLd = buildFaqJsonLd(productData?.faq);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      {faqLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      )}
      <ProductPageClient
        slug={LEGO_SLUG}
        initialProduct={productData}
        initialProducts={productsPayload?.results || []}
        initialStats={stats}
      />
    </>
  );
}
