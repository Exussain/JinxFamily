// One canonical, human-readable address per product category. This prevents
// navigation, the product index, and the sitemap from disagreeing on URLs.
export const PRODUCT_CATEGORY_ROUTES = {
  FORTNITE: 'فورتنایت',
  ROCKET_LEAGUE: 'راکت-لیگ',
  AI: 'هوش-مصنوعی',
  GIFTCARDS: 'گیفت-کارت',
  GAMES: 'بازی‌ها',
  SUBSCRIPTIONS: 'اشتراک‌ها',
};

export const PRODUCT_CATEGORY_CODES = Object.keys(PRODUCT_CATEGORY_ROUTES);

export function categoryPathFromCode(code) {
  const slug = PRODUCT_CATEGORY_ROUTES[String(code || '').toUpperCase()];
  return slug ? `/product-category/${slug}` : '/products';
}

export function categoryCodeFromSlug(slug) {
  const rawSlug = String(slug || '').trim();
  let normalizedSlug = rawSlug;
  try {
    normalizedSlug = decodeURIComponent(rawSlug);
  } catch {
    // Keep malformed route values as-is so they simply resolve to notFound.
  }
  return PRODUCT_CATEGORY_CODES.find(
    (code) => PRODUCT_CATEGORY_ROUTES[code] === normalizedSlug,
  ) || null;
}
