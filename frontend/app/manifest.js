export default function manifest() {
  return {
    name: 'جینکس فمیلی',
    short_name: 'جینکس فمیلی',
    description:
      'بازار خرید و فروش اکانت‌های بازی و ارائه دهنده رسمی وی‌باکس، کوین بازی‌ها و اشتراک‌های دیجیتال',
    start_url: '/',
    display: 'standalone',
    dir: 'rtl',
    lang: 'fa-IR',
    background_color: '#ffffff',
    theme_color: '#150a26',
    icons: [
      { src: '/icons/app/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/app/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
