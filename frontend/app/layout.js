const SITE_NAME = 'نوبیکس شاپ';
const SITE_TITLE = 'نوبیکس شاپ | خرید وی‌باکس، کروپک فورتنایت، اشتراک ChatGPT و گیفت کارت';
const SITE_DESCRIPTION =
  'خرید و فعال‌سازی قانونی محصولات دیجیتال: اشتراک ChatGPT و Gemini، کروپک و وی باکس فورتنایت، گیفت کارت و اشتراک‌های آنلاین — تحویل سریع، پرداخت امن و پشتیبانی ۲۴/۷';

export const metadata = {
  metadataBase: new URL('https://nubixshop.ir'),
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    'نوبیکس شاپ', 'نوبیکس', 'نوبيکس', 'نوبيکس شاپ', 'نوبيكس', 'نوبيكس شاپ',
    'نوبیكس', 'نوبیكس شاپ',
    'nubixshop', 'nubix shop', 'nubix', 'nubixshop.ir',
    'فعال‌سازی محصولات آنلاین', 'خرید اشتراک قانونی', 'اشتراک ChatGPT',
    'خرید چت جی‌پی‌تی', 'اشتراک جیمینی', 'Gemini', 'هوش مصنوعی',
    'وی‌باکس', 'وی باکس', 'V-Bucks', 'کروپک', 'بتل پس', 'استارتر پک', 'Fortnite', 'فورتنایت',
    'گیفت کارت', 'گیفت کارت پلی‌استیشن', 'گیفت کارت استیم', 'اشتراک اسپاتیفای'
  ],
  // NOTE: no root-level alternates.canonical here — App Router inherits it into
  // every child route without its own, which made the whole blog/FAQ/reseller
  // canonicalize to the homepage. Each page declares its own canonical instead.
  openGraph: {
    type: 'website',
    locale: 'fa_IR',
    url: 'https://nubixshop.ir',
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [{ url: '/og-image.webp', width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ['/og-image.webp'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  icons: [
    { rel: 'icon', url: '/favicon.ico', sizes: '48x48' },
    { rel: 'icon', url: '/icons/app/icon-192.png', type: 'image/png', sizes: '192x192' },
    { rel: 'apple-touch-icon', url: '/icons/app/apple-icon-180.png', sizes: '180x180' },
    { rel: 'shortcut icon', url: '/favicon.ico' }
  ],
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION && {
    verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION },
  }),
};

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#7c3aed' },
    { media: '(prefers-color-scheme: dark)', color: '#a78bfa' },
  ],
};

import './globals.css';
import { CartProvider } from "../lib/useCart";
import { ThemeProvider } from "../components/ThemeProvider";
import AnnouncementBar from "../components/AnnouncementBar";
import Footer from "../components/Footer";
import DeferredWidgets from "../components/DeferredWidgets";
import AppShell from "../components/AppShell";

const themeInitScript = `
(() => {
  try {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark' || stored === 'light') {
      document.documentElement.dataset.theme = stored;
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.dataset.theme = prefersDark ? 'dark' : 'light';
    }
  } catch (e) {
    document.documentElement.dataset.theme = 'light';
  }
})();
`;


const siteJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'OnlineStore',
      '@id': 'https://nubixshop.ir/#organization',
      name: SITE_NAME,
      alternateName: [
        'NubixShop', 'Nubix Shop', 'نوبیکس', 'نوبیکس شاپ', 'نوبيکس',
        'نوبيکس شاپ', 'نوبيكس', 'نوبيكس شاپ', 'نوبیكس', 'نوبیكس شاپ', 'nubixshop.ir'
      ],
      url: 'https://nubixshop.ir',
      logo: 'https://nubixshop.ir/web_logo.webp',
      sameAs: [
        'https://t.me/NubixShopIR',
        'https://instagram.com/NubixShop.ir',
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        url: 'https://nubixshop.ir/faq/contact',
        availableLanguage: 'fa',
      },
    },
    {
      '@type': 'WebSite',
      '@id': 'https://nubixshop.ir/#website',
      name: SITE_NAME,
      url: 'https://nubixshop.ir',
      inLanguage: 'fa-IR',
      publisher: { '@id': 'https://nubixshop.ir/#organization' },
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://nubixshop.ir/?q={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
    },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl" data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
        />
        {/* Preload the most-used Persian font weights (self-hosted) so text paints fast */}
        <link rel="preload" href="/fonts/vazirmatn/vazirmatn-arabic-400.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/vazirmatn/vazirmatn-arabic-700.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <ThemeProvider>
          <CartProvider>
            <div className="snow-overlay" aria-hidden="true" />
            <div className="snow-overlay snow-overlay-secondary" aria-hidden="true" />
            <div className="site-shell">
              <AppShell>{children}</AppShell>
            </div>
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
