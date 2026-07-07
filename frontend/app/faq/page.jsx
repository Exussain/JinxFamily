import FaqSectionLayout from "../../components/FaqSectionLayout";
import { faqItems } from "./data.jsx";
import FaqCatalog from "./FaqCatalog";

export const metadata = {
  title: "سوالات متداول",
  alternates: { canonical: "/faq" },
  description:
    "پاسخ به سوالات شما درباره نحوه خرید، تحویل، پیگیری سفارشات و پرداخت در نوبیکس شاپ. راهنمای جامع و کامل مشتریان.",
  openGraph: {
    title: "سوالات متداول | نوبیکس شاپ",
    description: "پاسخ به سوالات شما درباره نحوه خرید، تحویل، پیگیری سفارشات و پرداخت در نوبیکس شاپ.",
    type: "website",
    locale: "fa_IR",
    url: "https://nubixshop.ir/faq",
    images: [
      {
        url: "https://nubixshop.ir/og-image.webp",
        alt: "سوالات متداول نوبیکس شاپ",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "سوالات متداول | نوبیکس شاپ",
    description: "پاسخ به سوالات شما درباره نحوه خرید، تحویل، پیگیری سفارشات و پرداخت در نوبیکس شاپ.",
    images: ["https://nubixshop.ir/og-image.webp"],
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
      subtitle="پاسخ جامع به پرتکرارترین پرسش‌های کاربران نوبیکس شاپ؛ شفافیت در خرید و پشتیبانی."
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
