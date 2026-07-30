export const metadata = {
  title: 'آموزش غیرفعال کردن تایید دو مرحله‌ای (2FA) اپیک گیمز',
  description: 'راهنمای گام‌به‌گام خاموش کردن تایید دو مرحله‌ای (2FA) در Epic Games، Xbox و PlayStation برای تکمیل سفارش فورتنایت.',
  keywords: ['غیرفعال کردن 2FA اپیک گیمز', 'خاموش کردن تایید دو مرحله ای', 'غیرفعال کردن 2FA ایکس باکس', 'غیرفعال کردن 2FA پلی استیشن'],
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
  '@graph': [
    {
      '@type': 'Article',
      '@id': 'https://nubixshop.ir/guides/disable-2fa/#article',
      headline: 'آموزش غیرفعال کردن تایید دو مرحله‌ای (2FA) اپیک گیمز',
      description: 'راهنمای گام‌به‌گام خاموش کردن تایید دو مرحله‌ای در Epic Games، Xbox و PlayStation.',
      url: 'https://nubixshop.ir/guides/disable-2fa',
      inLanguage: 'fa-IR',
      dateModified: '2026-07-02',
      author: { '@type': 'Organization', name: 'نوبیکس شاپ', url: 'https://nubixshop.ir' },
      publisher: { '@id': 'https://nubixshop.ir/#organization' },
      mainEntityOfPage: 'https://nubixshop.ir/guides/disable-2fa',
      image: 'https://nubixshop.ir/og-image.webp',
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'نوبیکس شاپ', item: 'https://nubixshop.ir' },
        { '@type': 'ListItem', position: 2, name: 'مرکز پشتیبانی', item: 'https://nubixshop.ir/faq' },
        { '@type': 'ListItem', position: 3, name: 'آموزش غیرفعال کردن تایید دو مرحله‌ای', item: 'https://nubixshop.ir/guides/disable-2fa' },
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
