export const metadata = {
  title: 'آموزش رفع محدودیت خرید اکانت اپیک گیمز',
  description: 'راهنمای گام‌به‌گام رفع محدودیت (Restriction) خرید در اکانت Epic Games برای فعال‌سازی محصولات فورتنایت.',
  alternates: { canonical: '/guides/remove-restriction' },
};

const breadcrumbLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'نوبیکس شاپ', item: 'https://nubixshop.ir' },
    { '@type': 'ListItem', position: 2, name: 'مرکز پشتیبانی', item: 'https://nubixshop.ir/faq' },
    { '@type': 'ListItem', position: 3, name: 'آموزش رفع محدودیت خرید اکانت اپیک گیمز', item: 'https://nubixshop.ir/guides/remove-restriction' },
  ],
};

export default function GuideLayout({ children }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      {children}
    </>
  );
}

