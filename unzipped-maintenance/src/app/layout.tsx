import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Vazirmatn } from "next/font/google";
import "./globals.css";

const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  display: "swap",
  variable: "--font-vazirmatn",
});

export const metadata: Metadata = {
  title: "NubixShop.ir | در حال بروزرسانی",
  description:
    "NubixShop.ir موقتاً در حال بروزرسانی است و امکانات جدیدی به وبسایت اضافه می‌شود. لطفاً کمی بعد دوباره سر بزنید.",
  metadataBase: new URL("https://nubixshop.ir"),
  openGraph: {
    title: "NubixShop.ir | در حال بروزرسانی",
    description:
      "در حال اضافه کردن امکانات جدید به وبسایت هستیم. لطفاً کمی بعد دوباره سر بزنید.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#040711",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fa" dir="rtl" className={vazirmatn.variable}>
      <body className="bg-[#040711] text-slate-100 antialiased">{children}</body>
    </html>
  );
}
