/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'jinxfamily.ir', pathname: '/media/**' },
      { protocol: 'https', hostname: 'www.jinxfamily.ir', pathname: '/media/**' },
    ],
    formats: ['image/avif', 'image/webp'],
  },
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
          'Z:/root/Projects/!(JinxFamily)/**',
          'Z:/root/Projects/JinxFamily/!(frontend)/**',
          'Z:/root/Projects/JinxFamily/frontend/!(app|components|lib|public)/**',
        ],
      };
    }
    return config;
  },
  outputFileTracingRoot: __dirname,
  async redirects() {
    return [
      {
        source: '/product/jinxfamilyirproductstelegram-premium-3',
        destination: '/product/telegram-premium',
        permanent: true,
      },
      // SEO consolidation: each dedicated landing page is the single canonical
      // URL for its product — the generic /product/* twins 308 here so Google
      // stops splitting ranking signals between two competing pages.
      { source: '/product/gta6', destination: '/gta6', permanent: true },
      { source: '/product/v-bucks', destination: '/vbucks', permanent: true },
      { source: '/product/gemini-subscription', destination: '/gemini', permanent: true },
      { source: '/product/lego-starter-pack', destination: '/lego', permanent: true },
      // /help was a stale duplicate of /faq; /lol pointed at a product that no
      // longer exists in the catalog.
      { source: '/help', destination: '/faq', permanent: true },
      { source: '/lol', destination: '/', permanent: true },
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
      { source: '/orders', destination: '/panel/user', permanent: true },
      { source: '/index.php', destination: '/', permanent: true },
      { source: '/feed', destination: '/blog/feed.xml', permanent: true },
      // Next serves the PWA manifest at /manifest.webmanifest (app/manifest.js);
      // old crawlers still request /manifest.json.
      { source: '/manifest.json', destination: '/manifest.webmanifest', permanent: true },
      // Legacy WordPress WooCommerce redirects
      { source: '/shop-4', destination: '/products', permanent: true },
      { source: '/new/shop', destination: '/products', permanent: true },
      { source: '/product-category/epicgames/buy-fortnite-account', destination: '/market/fortnite', permanent: true },
      { source: '/about-us', destination: '/faq/about', permanent: true },
      { source: '/lost-password', destination: '/forgot-password', permanent: true },
      { source: '/my-account', destination: '/login', permanent: true },
      { source: '/favorites', destination: '/panel/user', permanent: true },
      { source: '/cart', destination: '/checkout', permanent: true },
      { source: '/new/:path*', destination: '/:path*', permanent: true },
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
    ];
  },
  async headers() {
    const noStore = [
      {
        key: "Cache-Control",
        value: "private, no-cache, no-store, max-age=0, must-revalidate",
      },
    ];
    const publicShortCache = [
      {
        key: "Cache-Control",
        value: "public, max-age=60, stale-while-revalidate=300",
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
      { source: '/logo.webp', headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }] },
      { source: '/', headers: publicShortCache },
      { source: '/faq/about', headers: noStore },
      // NOTE: crewpack/checkout must NOT use Clear-Site-Data. They have no
      // captcha, and "cache" wipes the immutable /_next/static chunks on every
      // visit -> every visitor re-downloads ~700KB, which buckles the hero
      // product page under load. no-store keeps prices fresh; assets stay cached.
      { source: '/checkout', headers: noStore },
      { source: '/crewpack', headers: publicShortCache },
      { source: '/vbucks', headers: publicShortCache },
      { source: '/products', headers: publicShortCache },
      { source: '/category/:path*', headers: publicShortCache },
      { source: '/lego', headers: publicShortCache },
      { source: '/gemini', headers: publicShortCache },
      { source: '/gta6', headers: publicShortCache },
      { source: '/login', headers: noStore },
      { source: '/signup', headers: noStore },
      { source: '/otp-login', headers: noStore },
      { source: '/product/:slug*', headers: publicShortCache },
      { source: '/panel/admin', headers: noStore },
      { source: '/panel/admin/:path*', headers: noStore },
      { source: '/reseller', headers: noStore },
      { source: '/reseller/:path*', headers: noStore },
    ];
  },
};

module.exports = nextConfig;
