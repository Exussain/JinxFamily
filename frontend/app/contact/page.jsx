import FaqContactPage, { metadata as faqMetadata } from "../faq/contact/page.jsx";

export const metadata = {
  ...faqMetadata,
  alternates: { canonical: "/faq/contact" },
};

export default function ContactPage() {
  return <FaqContactPage />;
}
