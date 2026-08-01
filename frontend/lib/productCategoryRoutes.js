// One canonical, human-readable address per product category. This prevents
// navigation, the product index, and the sitemap from disagreeing on URLs.
export const PRODUCT_CATEGORY_ROUTES = {
  FORTNITE: 'فورتنایت',
  PUBG: 'پابجی',
  COD_MOBILE: 'کالاف-دیوتی',
  CLASH_ROYALE: 'کلش-رویال',
  CLASH_OF_CLANS: 'کلش-اف-کلنز',
  BRAWL_STARS: 'براول-استارز',
  FREE_FIRE: 'فری-فایر',
  VALORANT: 'ولورانت',
  RAINBOW_SIX: 'رینبو-سیکس',
  MARVEL_RIVALS: 'مارول-ریوالز',
  PING_REDUCTION: 'کاهش-پینگ',
  MOBILE_GAMES: 'بازی‌های-موبایل',
  ROCKET_LEAGUE: 'راکت-لیگ',
  AI: 'هوش-مصنوعی',
  GIFTCARDS: 'گیفت-کارت',
  GAMES: 'بازی‌ها',
  SUBSCRIPTIONS: 'اشتراک‌ها',
};

export const PRODUCT_CATEGORY_CODES = Object.keys(PRODUCT_CATEGORY_ROUTES);

function normalizeSlugKey(str) {
  if (!str) return '';
  return str
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[\u200c\u200d\s_]+/g, '-')
    .replace(/-+/g, '-');
}

const NORMALIZED_SLUG_MAP = {};

Object.entries(PRODUCT_CATEGORY_ROUTES).forEach(([code, slug]) => {
  NORMALIZED_SLUG_MAP[normalizeSlugKey(slug)] = code;
  NORMALIZED_SLUG_MAP[normalizeSlugKey(code)] = code;
});

// Alias mappings for variations in half-space / ZWNJ / English slugs
NORMALIZED_SLUG_MAP['بازیهای-موبایل'] = 'MOBILE_GAMES';
NORMALIZED_SLUG_MAP['بازی-های-موبایل'] = 'MOBILE_GAMES';
NORMALIZED_SLUG_MAP['mobile-games'] = 'MOBILE_GAMES';
NORMALIZED_SLUG_MAP['pubg-mobile'] = 'PUBG';
NORMALIZED_SLUG_MAP['call-of-duty'] = 'COD_MOBILE';
NORMALIZED_SLUG_MAP['cod'] = 'COD_MOBILE';
NORMALIZED_SLUG_MAP['clash-of-clans'] = 'CLASH_OF_CLANS';
NORMALIZED_SLUG_MAP['clash-royale'] = 'CLASH_ROYALE';

export function categoryPathFromCode(code) {
  const slug = PRODUCT_CATEGORY_ROUTES[String(code || '').toUpperCase()];
  return slug ? `/product-category/${encodeURIComponent(slug)}` : '/products';
}

export function categoryCodeFromSlug(slug) {
  const rawSlug = String(slug || '').trim();
  let decoded = rawSlug;
  try {
    decoded = decodeURIComponent(rawSlug);
  } catch {
    // Keep malformed route values as-is
  }

  const norm = normalizeSlugKey(decoded);
  if (NORMALIZED_SLUG_MAP[norm]) {
    return NORMALIZED_SLUG_MAP[norm];
  }

  return PRODUCT_CATEGORY_CODES.find(
    (code) => PRODUCT_CATEGORY_ROUTES[code] === decoded || code === decoded.toUpperCase(),
  ) || null;
}
