export const metadata = {
  title: 'آموزش لینک و آنلینک اکانت Epic Games به Xbox و PlayStation',
  description: 'راهنمای گام‌به‌گام اتصال (Link) و قطع اتصال (Unlink) اکانت Epic Games به Xbox و PlayStation برای همگام‌سازی آیتم‌های فورتنایت.',
  keywords: ['لینک اکانت اپیک گیمز به ایکس باکس', 'لینک اکانت اپیک گیمز به پلی استیشن', 'آنلینک اکانت اپیک گیمز', 'قطع اتصال اکانت Epic Games'],
  alternates: { canonical: '/guides/link-unlink' },
  openGraph: {
    type: 'article',
    url: '/guides/link-unlink',
    title: 'آموزش لینک و آنلینک اکانت Epic Games به Xbox و PlayStation',
    description: 'مراحل اتصال و قطع اتصال حساب‌های Epic Games، Xbox و PlayStation.',
    locale: 'fa_IR',
    images: [{ url: '/og-image.webp', width: 1200, height: 630, alt: 'راهنمای لینک و آنلینک نوبیکس شاپ' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'آموزش لینک و آنلینک اکانت Epic Games',
    description: 'مراحل اتصال و قطع اتصال حساب‌های Epic Games، Xbox و PlayStation.',
    images: ['/og-image.webp'],
  },
};

const pageLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Article',
      '@id': 'https://nubixshop.ir/guides/link-unlink/#article',
      headline: 'آموزش لینک و آنلینک اکانت Epic Games به Xbox و PlayStation',
      description: 'راهنمای گام‌به‌گام اتصال و قطع اتصال اکانت Epic Games به Xbox و PlayStation.',
      url: 'https://nubixshop.ir/guides/link-unlink',
      inLanguage: 'fa-IR',
      dateModified: '2026-07-02',
      author: { '@type': 'Organization', name: 'نوبیکس شاپ', url: 'https://nubixshop.ir' },
      publisher: { '@id': 'https://nubixshop.ir/#organization' },
      mainEntityOfPage: 'https://nubixshop.ir/guides/link-unlink',
      image: 'https://nubixshop.ir/og-image.webp',
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'نوبیکس شاپ', item: 'https://nubixshop.ir' },
        { '@type': 'ListItem', position: 2, name: 'مرکز پشتیبانی', item: 'https://nubixshop.ir/faq' },
        { '@type': 'ListItem', position: 3, name: 'آموزش اتصال و قطع اتصال اکانت اپیک گیمز', item: 'https://nubixshop.ir/guides/link-unlink' },
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
