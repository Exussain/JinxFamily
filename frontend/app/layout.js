const SITE_NAME = 'جینکس فمیلی';
const SITE_TITLE = 'جینکس فمیلی | JinxFamily | بازار خرید و فروش اکانت و محصولات گیمینگ';
const SITE_DESCRIPTION =
  'جینکس فمیلی (JinxFamily) - بازار معتبر و امن خرید و فروش اکانت‌های بازی، وی‌باکس و کروپک فورتنایت، کوین‌های بازی و اشتراک‌های قانونی با تحویل سریع و پشتیبانی تخصصی';

export const metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    'جینکس فمیلی', 'JinxFamily', 'خرید اکانت فورتنایت', 'فروش اکانت فورتنایت', 'بازار اکانت بازی', 'معامله امن اکانت',
    'فعال‌سازی محصولات آنلاین', 'خرید اشتراک قانونی',
    'اشتراک ChatGPT', 'خرید چت جی‌پی‌تی', 'اشتراک جیمینی', 'Gemini', 'هوش مصنوعی',
    'وی‌باکس', 'وی باکس', 'V-Bucks', 'کروپک', 'بتل پس', 'استارتر پک', 'Fortnite', 'فورتنایت',
    'گیفت کارت', 'گیفت کارت پلی‌استیشن', 'گیفت کارت استیم', 'اشتراک اسپاتیفای'
  ],
  // NOTE: no root-level alternates.canonical here — App Router inherits it into
  // every child route without its own, which made the whole blog/FAQ/reseller
  // canonicalize to the homepage. Each page declares its own canonical instead.
  openGraph: {
    type: 'website',
    locale: 'fa_IR',
    url: SITE_ORIGIN,
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
    { media: '(prefers-color-scheme: light)', color: '#00bcd4' },
    { media: '(prefers-color-scheme: dark)', color: '#00f0ff' },
  ],
};

import './globals.css';
import Footer from "../components/Footer";
import DeferredTelemetry from "../components/DeferredTelemetry";
import AppShell from "../components/AppShell";
import { ThemeProvider } from "../components/ThemeProvider";
import { CartProvider } from "../lib/useCart";
import { SITE_ORIGIN } from "../lib/site.mjs";

const themeInitScript = `
(() => {
  try {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark' || stored === 'light') {
      document.documentElement.dataset.theme = stored;
    } else {
      document.documentElement.dataset.theme = 'dark';
    }
  } catch (e) {
    document.documentElement.dataset.theme = 'dark';
  }
  try {
    const ref = (new URLSearchParams(location.search).get('ref') || '').trim().toUpperCase();
    if (/^[A-Z0-9-]{3,16}$/.test(ref)) {
      localStorage.setItem('jinxfamily_ref', ref);
      document.cookie = 'jinxfamily_ref=' + ref + '; path=/; max-age=31536000; SameSite=Lax';
    }
  } catch (e) {}

  // Auto reload page on chunk load error after production build updates
  window.addEventListener('error', (e) => {
    try {
      const target = e && e.target;
      const isChunkError = (e && e.message && e.message.includes('Loading chunk')) ||
                           (target && target.tagName === 'SCRIPT' && target.src && target.src.includes('/_next/static/chunks/'));
      if (isChunkError) {
        if (!sessionStorage.getItem('chunk_reload_triggered')) {
          sessionStorage.setItem('chunk_reload_triggered', '1');
          window.location.reload();
        }
      }
    } catch (err) {}
  }, true);
})();
`;


const siteJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'OnlineStore',
      '@id': `${SITE_ORIGIN}/#organization`,
      name: SITE_NAME,
      alternateName: ['JinxFamily', 'جینکس فمیلی'],
      url: SITE_ORIGIN,
      logo: `${SITE_ORIGIN}/logo.webp`,
      sameAs: [
        'https://t.me/JinxFamily'
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        url: `${SITE_ORIGIN}/faq/contact`,
        availableLanguage: 'fa',
      },
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_ORIGIN}/#website`,
      name: SITE_NAME,
      url: SITE_ORIGIN,
      inLanguage: 'fa-IR',
      publisher: { '@id': `${SITE_ORIGIN}/#organization` },
      potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE_ORIGIN}/?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="ltr" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        {/* Preload the most-used Persian font weights (self-hosted) so text paints fast */}
        <link rel="preload" href="/fonts/vazirmatn/vazirmatn-arabic-400.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/vazirmatn/vazirmatn-arabic-700.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body dir="rtl">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
        />
        {/* Preload Kalameh (کلمه) — self-hosted Persian font, critical weights */}
        <link rel="preload" href="/fonts/kalameh/KalamehWeb-Regular.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <ThemeProvider>
          <CartProvider>
            <AppShell footer={<Footer />}>
              <div className="site-shell">
                {children}
              </div>
            </AppShell>
            <DeferredTelemetry />
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
