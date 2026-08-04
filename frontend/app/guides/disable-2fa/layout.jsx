import '../../globals.css';

export const metadata = {
  title: 'آموزش غیرفعال کردن تایید دو مرحله‌ای اپیک گیمز',
  description: 'راهنمای گام‌به‌گام غیرفعال کردن 2FA اکانت Epic Games برای فعال‌سازی محصولات فورتنایت در جینکس فمیلی.',
  alternates: { canonical: '/guides/disable-2fa' },
  openGraph: {
    type: 'article',
    url: '/guides/disable-2fa',
    title: 'آموزش غیرفعال کردن تایید دو مرحله‌ای (2FA) اپیک گیمز',
    description: 'مراحل خاموش کردن 2FA در Epic Games، Xbox و PlayStation.',
    locale: 'fa_IR',
    images: [{ url: '/og-image.webp', width: 1200, height: 630, alt: 'راهنمای 2FA نوبیکس شاپ' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'آموزش غیرفعال کردن تایید دو مرحله‌ای (2FA) اپیک گیمز',
    description: 'مراحل خاموش کردن 2FA در Epic Games، Xbox و PlayStation.',
    images: ['/og-image.webp'],
  },
};

const pageLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'جینکس فمیلی', item: 'https://jinxfamily.ir' },
    { '@type': 'ListItem', position: 2, name: 'مرکز پشتیبانی', item: 'https://jinxfamily.ir/faq' },
    { '@type': 'ListItem', position: 3, name: 'آموزش غیرفعال کردن تایید دو مرحله‌ای', item: 'https://jinxfamily.ir/guides/disable-2fa' },
  ],
};

export default function GuideLayout({ children }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageLd) }}
      />
      {children}
    </>
  );
}
