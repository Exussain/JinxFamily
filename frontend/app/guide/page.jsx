import FaqHowToBuyPage, { metadata as faqMetadata } from "../faq/how-to-buy/page.jsx";

export const metadata = {
  ...faqMetadata,
  alternates: { canonical: "/faq/how-to-buy" },
};

export default function GuidePage() {
  return <FaqHowToBuyPage />;
}
