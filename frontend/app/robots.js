import { SITE_ORIGIN } from '../lib/site.mjs';

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/panel/',
          '/checkout',
          '/payment/',
          '/track/',
          '/login',
          '/signup',
          '/otp-login',
          '/email-login',
          '/forgot-password',
          '/admin-cache-bust',
          '/nxd9k2m',
          '/api/',
          '/fonts/',
          '/?q=',
          '/?cat=',
          '/*?q=',
          '/*?cat=',
          // Private reseller portal pages — the /reseller landing and
          // /reseller/apply stay crawlable.
          '/reseller/dashboard',
          '/reseller/catalog',
          '/reseller/orders',
          '/reseller/wallet',
          '/reseller/profile',
          '/reseller/referrals',
          '/reseller/support',
          '/reseller/onboarding',
          '/reseller/pending',
          '/reseller/welcome',
        ],
      },
    ],
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
  };
}
