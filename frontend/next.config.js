/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {},
  webpack: (config, { dev }) => {
    if (dev) {
      // Prevent Webpack from climbing up parent directories on Z: drive and hanging.
      // Also ignore next.config.js itself to avoid false "config changed" restarts
      // caused by unreliable file metadata on the network (Z:) drive.
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          '**/node_modules/**',
          '**/next.config.js',
          'Z:/root/!(Projects)/**',
          'Z:/root/Projects/!(NubixShop)/**',
          'Z:/root/Projects/NubixShop/!(frontend)/**',
          'Z:/root/Projects/NubixShop/frontend/!(app|components|lib|public)/**',
        ],
      };
    }
    return config;
  },
  outputFileTracingRoot: __dirname,
  async redirects() {
    return [
      {
        source: '/product/nubixshopirproductstelegram-premium-3',
        destination: '/product/telegram-premium',
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:8001/api/:path*',
      },
    ];
  },
  async headers() {
    const noStore = [
      {
        key: "Cache-Control",
        value: "private, no-cache, no-store, max-age=0, must-revalidate",
      },
    ];
    const forceCacheBust = [
      {
        key: "Cache-Control",
        value: "private, no-cache, no-store, max-age=0, must-revalidate",
      },
      {
        key: "Clear-Site-Data",
        value: '"cache"',
      },
    ];

    return [
      // Self-hosted fonts never change content — cache them for a year.
      { source: '/fonts/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
      { source: '/', headers: noStore },
      // NOTE: crewpack/checkout must NOT use Clear-Site-Data. They have no
      // captcha, and "cache" wipes the immutable /_next/static chunks on every
      // visit -> every visitor re-downloads ~700KB, which buckles the hero
      // product page under load. no-store keeps prices fresh; assets stay cached.
      { source: '/checkout', headers: noStore },
      { source: '/crewpack', headers: noStore },
      { source: '/vbucks', headers: noStore },
      { source: '/lego', headers: noStore },
      { source: '/gemini', headers: noStore },
      { source: '/login', headers: forceCacheBust },
      { source: '/product/:slug*', headers: noStore },
      { source: '/panel/admin', headers: noStore },
      { source: '/panel/admin/:path*', headers: noStore },
      { source: '/reseller', headers: noStore },
      { source: '/reseller/:path*', headers: noStore },
    ];
  },
};

module.exports = nextConfig;
