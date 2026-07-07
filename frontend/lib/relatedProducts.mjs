const MANUAL_RELATED_SLUGS = {
  "fortnite-crew-pack": [
    "fortnite-starter-pack",
    "v-bucks",
    "fortnite-battle-pass",
    "lego-starter-pack",
    "fortnite-music-pass",
  ],
  "v-bucks": [
    "fortnite-crew-pack",
    "fortnite-starter-pack",
    "fortnite-battle-pass",
    "lego-starter-pack",
    "fortnite-music-pass",
  ],
  "fortnite-starter-pack": [
    "fortnite-crew-pack",
    "v-bucks",
    "fortnite-battle-pass",
    "lego-starter-pack",
    "fortnite-music-pass",
  ],
  "fortnite-battle-pass": [
    "v-bucks",
    "fortnite-crew-pack",
    "fortnite-starter-pack",
    "lego-starter-pack",
  ],
  "lego-starter-pack": [
    "fortnite-starter-pack",
    "v-bucks",
    "fortnite-crew-pack",
    "fortnite-battle-pass",
  ],
  "chatgpt-subscription": [
    "gemini-subscription",
    "spotify-subscription",
    "v-bucks",
  ],
  "gemini-subscription": [
    "chatgpt-subscription",
    "spotify-subscription",
    "v-bucks",
  ],
  "spotify-subscription": [
    "chatgpt-subscription",
    "gemini-subscription",
    "v-bucks",
  ],
};

const RELATED_CATEGORY_GROUPS = {
  FORTNITE: ["FORTNITE", "GAMES"],
  AI: ["AI", "SUBSCRIPTIONS"],
  SUBSCRIPTIONS: ["SUBSCRIPTIONS", "AI"],
  GAMES: ["GAMES", "FORTNITE"],
  GIFTCARDS: ["GIFTCARDS"],
};

function normalizeSlug(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function scoreProduct(product) {
  const sold = Number(product?.sold_count) || 0;
  const displayOrder = Number(product?.display_order) || 9999;
  const id = Number(product?.id) || 0;
  return sold * 100000 - displayOrder * 100 - id;
}

function uniqueBySlug(products) {
  const seen = new Set();
  const result = [];
  for (const product of products) {
    const slug = normalizeSlug(product?.slug);
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    result.push(product);
  }
  return result;
}

export function getRelatedProducts(currentProduct, allProducts, limit = 8) {
  if (!currentProduct || !Array.isArray(allProducts) || limit <= 0) return [];

  const currentSlug = normalizeSlug(currentProduct.slug);
  const currentId = Number(currentProduct.id) || null;
  const currentCategory = String(currentProduct.category || "").toUpperCase();
  const candidates = allProducts.filter((product) => {
    const slug = normalizeSlug(product?.slug);
    if (!slug) return false;
    if (currentSlug && slug === currentSlug) return false;
    if (currentId && Number(product?.id) === currentId) return false;
    return true;
  });

  const bySlug = new Map(candidates.map((product) => [normalizeSlug(product.slug), product]));
  const manual = (MANUAL_RELATED_SLUGS[currentSlug] || [])
    .map((slug) => bySlug.get(slug))
    .filter(Boolean);

  const categoryGroup = RELATED_CATEGORY_GROUPS[currentCategory] || [currentCategory];
  const categoryMatches = candidates
    .filter((product) => categoryGroup.includes(String(product?.category || "").toUpperCase()))
    .sort((a, b) => scoreProduct(b) - scoreProduct(a));

  const fallback = candidates
    .filter((product) => !categoryGroup.includes(String(product?.category || "").toUpperCase()))
    .sort((a, b) => scoreProduct(b) - scoreProduct(a));

  return uniqueBySlug([...manual, ...categoryMatches, ...fallback]).slice(0, limit);
}
