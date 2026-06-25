import FaqSectionLayout from "../../components/FaqSectionLayout";
import { faqItems } from "./data.jsx";
import FaqAccordion from "./FaqAccordion";

export const metadata = {
  title: "سوالات متداول | نوبیکس شاپ",
  description:
    "پاسخ به سوالات شما درباره نحوه خرید، تحویل، پیگیری سفارشات و پرداخت در نوبیکس شاپ. راهنمای جامع و کامل مشتریان.",
  openGraph: {
    title: "سوالات متداول | نوبیکس شاپ",
    description: "پاسخ به سوالات شما درباره نحوه خرید، تحویل، پیگیری سفارشات و پرداخت در نوبیکس شاپ.",
    type: "website",
    locale: "fa_IR",
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
      <FaqAccordion items={faqItems} />
    </FaqSectionLayout>
  );
}
