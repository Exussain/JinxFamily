import '../../globals.css';

export const metadata = {
  title: 'آموزش اتصال و قطع اتصال اکانت اپیک گیمز',
  description: 'راهنمای گام‌به‌گام لینک و آنلینک کردن اکانت Epic Games به کنسول و پلتفرم‌های دیگر.',
  alternates: { canonical: '/guides/link-unlink' },
};

const breadcrumbLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'جینکس فمیلی', item: 'https://jinxfamily.ir' },
    { '@type': 'ListItem', position: 2, name: 'مرکز پشتیبانی', item: 'https://jinxfamily.ir/faq' },
    { '@type': 'ListItem', position: 3, name: 'آموزش اتصال و قطع اتصال اکانت اپیک گیمز', item: 'https://jinxfamily.ir/guides/link-unlink' },
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
