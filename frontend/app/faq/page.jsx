import FaqSectionLayout from "../../components/FaqSectionLayout";
import { faqItems } from "./data.jsx";
import FaqCatalog from "./FaqCatalog";

export const metadata = {
  title: "سوالات متداول",
  alternates: { canonical: "/faq" },
  description:
    "پاسخ به سوالات شما درباره نحوه خرید، تحویل، پیگیری سفارشات و پرداخت در جینکس فمیلی. راهنمای جامع و کامل مشتریان.",
  openGraph: {
    title: "سوالات متداول | جینکس فمیلی",
    description: "پاسخ به سوالات شما درباره نحوه خرید، تحویل، پیگیری سفارشات و پرداخت در جینکس فمیلی.",
    type: "website",
    locale: "fa_IR",
    url: "https://jinxfamily.ir/faq",
    images: [
      {
        url: "https://jinxfamily.ir/og-image.webp",
        alt: "سوالات متداول جینکس فمیلی",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "سوالات متداول | جینکس فمیلی",
    description: "پاسخ به سوالات شما درباره نحوه خرید، تحویل، پیگیری سفارشات و پرداخت در جینکس فمیلی.",
    images: ["https://jinxfamily.ir/og-image.webp"],
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: item.answer },
  })),
};

export default function FaqHomePage() {
  return (
    <FaqSectionLayout
      title="سوالات متداول"
      subtitle="پاسخ جامع به پرتکرارترین پرسش‌های کاربران جینکس فمیلی؛ شفافیت در خرید و پشتیبانی."
      activeSection="faq"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <FaqCatalog />
    </FaqSectionLayout>
  );
}
