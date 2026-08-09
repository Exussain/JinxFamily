import '../../globals.css';

export const metadata = {
  title: 'آموزش رفع محدودیت اکانت Epic Games، Xbox و PlayStation',
  description: 'راهنمای گام‌به‌گام رفع محدودیت ورود، قفل موقت و خطاهای امنیتی در حساب‌های Epic Games، Xbox و PlayStation.',
  keywords: ['رفع محدودیت اکانت اپیک گیمز', 'رفع قفل اکانت Xbox', 'رفع محدودیت پلی استیشن', 'رفع Restriction اکانت فورتنایت'],
  alternates: { canonical: '/guides/remove-restriction' },
  openGraph: {
    type: 'article',
    url: '/guides/remove-restriction',
    title: 'آموزش رفع محدودیت اکانت Epic Games، Xbox و PlayStation',
    description: 'مراحل رفع محدودیت ورود، قفل موقت و خطاهای امنیتی حساب بازی.',
    locale: 'fa_IR',
    images: [{ url: '/og-image.webp', width: 1200, height: 630, alt: 'راهنمای رفع محدودیت جینکس فمیلی' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'آموزش رفع محدودیت اکانت Epic Games، Xbox و PlayStation',
    description: 'مراحل رفع محدودیت ورود، قفل موقت و خطاهای امنیتی حساب بازی.',
    images: ['/og-image.webp'],
  },
};

const pageLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'جینکس فمیلی', item: 'https://jinxfamily.ir' },
    { '@type': 'ListItem', position: 2, name: 'مرکز پشتیبانی', item: 'https://jinxfamily.ir/faq' },
    { '@type': 'ListItem', position: 3, name: 'آموزش رفع محدودیت خرید اکانت اپیک گیمز', item: 'https://jinxfamily.ir/guides/remove-restriction' },
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
