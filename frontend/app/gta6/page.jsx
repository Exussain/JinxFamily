import Gta6Client from "./Gta6Client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "پیش‌خرید GTA VI (Grand Theft Auto VI) — PS5 و Xbox",
  description:
    "پیش‌خرید رسمی Grand Theft Auto VI برای PS5 و Xbox Series X|S — نسخه استاندارد و آلتیمیت، ظرفیت‌های ۱، ۲، ۳ و کامل، فعال‌سازی قانونی و راهنمای کامل. نوبیکس شاپ.",
  alternates: { canonical: "/gta6" },
  openGraph: {
    title: "پیش‌خرید GTA VI | نوبیکس شاپ",
    description:
      "پیش‌خرید Grand Theft Auto VI برای PS5 و Xbox — نسخه استاندارد و آلتیمیت با ظرفیت‌های مختلف و فعال‌سازی قانونی.",
    url: "https://nubixshop.ir/gta6",
    images: [{ url: "/products/gta6/ps5-ultimate.jpg", width: 512, height: 512, alt: "GTA VI Pre Order" }],
  },
};

export default function Gta6Page() {
  return <Gta6Client />;
}
