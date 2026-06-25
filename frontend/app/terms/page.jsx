import FaqRulesPage, { metadata as faqMetadata } from "../faq/rules/page.jsx";

export const metadata = {
  ...faqMetadata,
  alternates: { canonical: "/faq/rules" },
};

export default function TermsPage() {
  return <FaqRulesPage />;
}
