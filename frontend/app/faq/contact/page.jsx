import ContactClient from "./ContactClient";

export const metadata = {
  title: "تماس با جینکس فمیلی",
  alternates: { canonical: "/faq/contact" },
  description: "راه‌های ارتباطی، پشتیبانی تلفنی، آدرس آیدی رسمی تلگرام و اطلاعات شعب جینکس فمیلی.",
};

export default function FaqContactPage() {
  return <ContactClient />;
}
