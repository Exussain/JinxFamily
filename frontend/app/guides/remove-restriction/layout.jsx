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
    images: [{ url: '/og-image.webp', width: 1200, height: 630, alt: 'راهنمای رفع محدودیت نوبیکس شاپ' }],
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
  '@graph': [
    {
      '@type': 'Article',
      '@id': 'https://nubixshop.ir/guides/remove-restriction/#article',
      headline: 'آموزش رفع محدودیت اکانت Epic Games، Xbox و PlayStation',
      description: 'راهنمای گام‌به‌گام رفع محدودیت ورود، قفل موقت و خطاهای امنیتی حساب بازی.',
      url: 'https://nubixshop.ir/guides/remove-restriction',
      inLanguage: 'fa-IR',
      dateModified: '2026-07-02',
      author: { '@type': 'Organization', name: 'نوبیکس شاپ', url: 'https://nubixshop.ir' },
      publisher: { '@id': 'https://nubixshop.ir/#organization' },
      mainEntityOfPage: 'https://nubixshop.ir/guides/remove-restriction',
      image: 'https://nubixshop.ir/og-image.webp',
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'نوبیکس شاپ', item: 'https://nubixshop.ir' },
        { '@type': 'ListItem', position: 2, name: 'مرکز پشتیبانی', item: 'https://nubixshop.ir/faq' },
        { '@type': 'ListItem', position: 3, name: 'آموزش رفع محدودیت اکانت اپیک گیمز', item: 'https://nubixshop.ir/guides/remove-restriction' },
      ],
    },
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
