export const metadata = {
  title: 'آموزش غیرفعال کردن تایید دو مرحله‌ای اپیک گیمز',
  description: 'راهنمای گام‌به‌گام غیرفعال کردن 2FA اکانت Epic Games برای فعال‌سازی محصولات فورتنایت در نوبیکس شاپ.',
  alternates: { canonical: '/guides/disable-2fa' },
};

const breadcrumbLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'نوبیکس شاپ', item: 'https://nubixshop.ir' },
    { '@type': 'ListItem', position: 2, name: 'مرکز پشتیبانی', item: 'https://nubixshop.ir/faq' },
    { '@type': 'ListItem', position: 3, name: 'آموزش غیرفعال کردن تایید دو مرحله‌ای', item: 'https://nubixshop.ir/guides/disable-2fa' },
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

