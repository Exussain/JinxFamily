import Gta6Client from "./Gta6Client";
import { fetchReviewStats, buildProductJsonLd, buildBreadcrumbJsonLd, buildFaqJsonLd } from "../../lib/seoJsonLd.mjs";
import { fetchApiJson } from "../../lib/serverFetch.mjs";

export const dynamic = "force-dynamic";

const OG_IMAGE = "https://nubixshop.ir/products/gta6/ps5-ultimate.webp";
const OG_DESCRIPTION =
  "پیش‌خرید Grand Theft Auto VI برای PS5 و Xbox — نسخه استاندارد و آلتیمیت با ظرفیت‌های مختلف و فعال‌سازی قانونی.";

export const metadata = {
  title: "پیش‌خرید GTA VI (Grand Theft Auto VI) — PS5 و Xbox",
  description:
    "پیش‌خرید رسمی Grand Theft Auto VI برای PS5 و Xbox Series X|S — نسخه استاندارد و آلتیمیت، ظرفیت‌های ۱، ۲، ۳ و کامل، فعال‌سازی قانونی و راهنمای کامل. نوبیکس شاپ.",
  alternates: { canonical: "/gta6" },
  openGraph: {
    type: "website",
    siteName: "نوبیکس شاپ",
    locale: "fa_IR",
    title: "پیش‌خرید GTA VI | نوبیکس شاپ",
    description: OG_DESCRIPTION,
    url: "https://nubixshop.ir/gta6",
    images: [{ url: OG_IMAGE, width: 512, height: 512, alt: "GTA VI Pre Order" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "پیش‌خرید GTA VI | نوبیکس شاپ",
    description: OG_DESCRIPTION,
    images: [OG_IMAGE],
  },
};

export default async function Gta6Page() {
  const [product, stats] = await Promise.all([
    fetchApiJson("/api/products/gta6"),
    fetchReviewStats("gta6"),
  ]);

  const productLd = buildProductJsonLd({
    path: "/gta6",
    name: product?.name_fa || "پیش‌خرید GTA VI (Grand Theft Auto VI)",
    description: OG_DESCRIPTION,
    image: product?.image_url || OG_IMAGE,
    priceToman: product?.min_price || product?.price,
    stats,
    brand: "Rockstar Games",
    variants: product?.variants,
  });
  const breadcrumbLd = buildBreadcrumbJsonLd([
    { name: "نوبیکس شاپ", path: "/" },
    { name: "پیش‌خرید GTA VI", path: "/gta6" },
  ]);
  const faqLd = buildFaqJsonLd(product?.faq);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      {faqLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      )}
      <Gta6Client />
    </>
  );
}
