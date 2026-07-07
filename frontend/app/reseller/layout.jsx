import ResellerLayoutClient from './ResellerLayoutClient';

export const metadata = {
  title: 'همکاری در فروش | پنل همکاران',
  description:
    'پنل همکاران نوبیکس شاپ: خرید عمده وی باکس و کروپک فورتنایت، گیفت کارت و اشتراک‌های دیجیتال با قیمت همکار، کیف پول اختصاصی و تسویه سریع. همین حالا درخواست همکاری ثبت کنید.',
  alternates: { canonical: '/reseller' },
  openGraph: {
    title: 'همکاری در فروش | پنل همکاران نوبیکس شاپ',
    description:
      'خرید عمده وی باکس، کروپک فورتنایت و محصولات دیجیتال با قیمت همکار و تسویه سریع.',
    url: 'https://nubixshop.ir/reseller',
    images: [
      {
        url: 'https://nubixshop.ir/og-image.webp',
        alt: 'همکاری در فروش نوبیکس شاپ',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'همکاری در فروش | پنل همکاران نوبیکس شاپ',
    description: 'خرید عمده وی باکس، کروپک فورتنایت و محصولات دیجیتال با قیمت همکار و تسویه سریع.',
    images: ['https://nubixshop.ir/og-image.webp'],
  },
};

export default function ResellerLayout({ children }) {
  return <ResellerLayoutClient>{children}</ResellerLayoutClient>;
}
