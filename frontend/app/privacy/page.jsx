import FaqPrivacyPage, { metadata as faqMetadata } from "../faq/privacy/page.jsx";

export const metadata = {
  ...faqMetadata,
  alternates: { canonical: "/faq/privacy" },
};

export default function PrivacyPage() {
  return <FaqPrivacyPage />;
}
