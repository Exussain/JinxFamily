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
        ],
      },
    ],
    sitemap: 'https://nubixshop.ir/sitemap.xml',
  };
}
