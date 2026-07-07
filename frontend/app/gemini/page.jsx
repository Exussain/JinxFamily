import ProductPageClient from "../product/[slug]/ProductPageClient";
import { fetchApiJson } from "../../lib/serverFetch.mjs";
import {
  fetchReviewStats,
  buildProductJsonLd,
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
} from "../../lib/seoJsonLd.mjs";

export const dynamic = "force-dynamic";

const GEMINI_SLUG = "gemini-subscription";
const OG_DESCRIPTION =
  "خرید اشتراک جیمینی (Google Gemini) با فعال‌سازی قانونی روی ایمیل شما — دوره‌های ۱ تا ۱۲ ماهه با تحویل فوری.";

export const metadata = {
  title: "خرید اشتراک جیمینی (Google Gemini) | تحویل فوری",
  description:
    "خرید اشتراک جیمینی (Google Gemini) با دوره‌های ۱ ماهه، ۳ ماهه، ۶ ماهه و ۱۲ ماهه و دسترسی به قابلیت‌های پیشرفته هوش مصنوعی. فعال‌سازی قانونی روی ایمیل شما.",
  keywords: [
    "خرید اشتراک جیمینی",
    "جیمینی",
    "Gemini",
    "گوگل جیمینی",
    "هوش مصنوعی",
    "Google AI",
    "اشتراک هوش مصنوعی",
  ],
  alternates: { canonical: "/gemini" },
  openGraph: {
    type: "website",
    siteName: "نوبیکس شاپ",
    locale: "fa_IR",
    title: "خرید اشتراک جیمینی (Google Gemini) | نوبیکس شاپ",
    description: OG_DESCRIPTION,
    url: "https://nubixshop.ir/gemini",
    images: [
      {
        url: "https://nubixshop.ir/products/gemini.webp",
        alt: "خرید اشتراک جیمینی (Google Gemini) از نوبیکس شاپ",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "خرید اشتراک جیمینی (Google Gemini) | نوبیکس شاپ",
    description: OG_DESCRIPTION,
    images: ["https://nubixshop.ir/products/gemini.webp"],
  },
};

export default async function GeminiPage() {
  const [productData, productsPayload, stats] = await Promise.all([
    fetchApiJson(`/api/products/${GEMINI_SLUG}`),
    fetchApiJson("/api/products"),
    fetchReviewStats(GEMINI_SLUG),
  ]);

  const productLd = buildProductJsonLd({
    path: "/gemini",
    name: productData?.name_fa || "اشتراک جیمینی (Google Gemini)",
    description: productData?.description || OG_DESCRIPTION,
    image: productData?.image_url,
    priceToman: productData?.min_price || productData?.price,
    stats,
    brand: "Google",
    variants: productData?.variants,
  });
  const breadcrumbLd = buildBreadcrumbJsonLd([
    { name: "نوبیکس شاپ", path: "/" },
    { name: "اشتراک جیمینی", path: "/gemini" },
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
        slug={GEMINI_SLUG}
        initialProduct={productData}
        initialProducts={productsPayload?.results || []}
        initialStats={stats}
      />
    </>
  );
}
