/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['172.24.37.105', 'localhost', '127.0.0.1', '0.0.0.0'],
  distDir: process.env.NEXT_DIST_DIR || '.next',
  turbopack: {},
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          '**/node_modules/**',
          '**/.next/**',
          '**/next.config.js',
        ],
      };
    }
    return config;
  },
  outputFileTracingRoot: __dirname,
  images: {
    qualities: [75, 85, 95],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'nubixshop.ir',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/product/nubixshopirproductstelegram-premium-3',
        destination: '/product/telegram-premium',
        permanent: true,
      },
      // SEO consolidation: each dedicated landing page is the single canonical
      // URL for its product — the generic /product/* twins 308 here so Google
      // stops splitting ranking signals between two competing pages.
      { source: '/product/fortnite-crew-pack', destination: '/crewpack', permanent: true },
      { source: '/product/gta6', destination: '/gta6', permanent: true },
      { source: '/product/v-bucks', destination: '/vbucks', permanent: true },
      { source: '/product/gemini-subscription', destination: '/gemini', permanent: true },
      { source: '/product/lego-starter-pack', destination: '/lego', permanent: true },
      // /help was a stale duplicate of /faq; /lol pointed at a product that no
      // longer exists in the catalog.
      { source: '/help', destination: '/faq', permanent: true },
      { source: '/lol', destination: '/product/league-of-legends-rp', permanent: true },
      // Former alias routes that rendered /faq/* content with a canonical tag.
      // GSC kept reporting them as "Alternate page with proper canonical tag";
      // a 308 consolidates signals instead of serving duplicates.
      { source: '/contact', destination: '/faq/contact', permanent: true },
      { source: '/privacy', destination: '/faq/privacy', permanent: true },
      { source: '/guide', destination: '/faq/how-to-buy', permanent: true },
      { source: '/terms', destination: '/faq/rules', permanent: true },
      // Legacy WordPress-era URLs still crawled by Google (GSC "Not found").
      // Only map ones with a live equivalent; removed products stay 404.
      { source: '/products/gemini', destination: '/gemini', permanent: true },
      { source: '/products/crewpack', destination: '/crewpack', permanent: true },
      { source: '/products/product_vbucks', destination: '/vbucks', permanent: true },
      { source: '/products/chatgpt', destination: '/product/chatgpt-subscription', permanent: true },
      { source: '/products/battlepass', destination: '/product/fortnite-battle-pass', permanent: true },
      { source: '/products/starterpack', destination: '/product/starterpack', permanent: true },
      { source: '/products/fortnite-starter-pack', destination: '/product/starterpack', permanent: true },
      { source: '/products/spotify', destination: '/product/spotify-subscription', permanent: true },
      { source: '/product/frozenlegends', destination: '/product/frozen-legends', permanent: true },
      { source: '/product/nubixshopirrocket-leaguecredits', destination: '/product/rocket-league-credits', permanent: true },
      { source: '/products/lol_rp', destination: '/product/league-of-legends-rp', permanent: true },
      { source: '/products/lol_rp_', destination: '/product/league-of-legends-rp', permanent: true },
      { source: '/blog/unlink-xbox-from-epic-games', destination: '/guides/link-unlink', permanent: true },
      { source: '/blog/category', destination: '/blog', permanent: true },
      { source: '/quides/:path*', destination: '/guides/:path*', permanent: true },
      { source: '/products/:slug', destination: '/product/:slug', permanent: true },
      { source: '/orders', destination: '/panel/user', permanent: true },
      { source: '/index.php', destination: '/', permanent: true },
      { source: '/feed', destination: '/blog/feed.xml', permanent: true },
      // Next serves the PWA manifest at /manifest.webmanifest (app/manifest.js);
      // old crawlers still request /manifest.json.
      { source: '/manifest.json', destination: '/manifest.webmanifest', permanent: true },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:8001/api/:path*',
      },
      {
        source: '/media/:path*',
        destination: 'http://127.0.0.1:8001/media/:path*',
      },
      {
        source: '/emalls',
        destination: 'http://127.0.0.1:8001/api/emalls',
      },
      {
        source: '/emalls.json',
        destination: 'http://127.0.0.1:8001/api/emalls.json',
      },
      {
        source: '/emalls/products',
        destination: 'http://127.0.0.1:8001/api/emalls/products',
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
      // Product/category images were served with max-age=0, forcing a
      // revalidation round-trip on every visit — that delay lands directly on
      // LCP (the hero image is the LCP element on /, /crewpack, /product/*).
      // NOT immutable: static files are replaced in place under the same
      // name; /media uploads get timestamped names but stay conservative.
      { source: '/products/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }] },
      { source: '/categories/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }] },
      { source: '/media/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }] },
      { source: '/icons/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }] },
      { source: '/web_logo.webp', headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }] },
      // NOTE: checkout must NOT use Clear-Site-Data. They have no
      // captcha, and "cache" wipes the immutable /_next/static chunks on every
      // visit -> every visitor re-downloads ~700KB, which buckles the hero
      // product page under load. no-store keeps prices fresh; assets stay cached.
      { source: '/checkout', headers: noStore },
      { source: '/login', headers: noStore },
      { source: '/signup', headers: noStore },
      { source: '/otp-login', headers: noStore },
      { source: '/panel/admin', headers: noStore },
      { source: '/panel/admin/:path*', headers: noStore },
      { source: '/reseller', headers: noStore },
      { source: '/reseller/:path*', headers: noStore },
    ];
  },
};

module.exports = nextConfig;
