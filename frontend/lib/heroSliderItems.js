import { resolveProductImage } from "./productImageHelpers.js";

// Tie-break order for products with equal (or missing) sales counts.
const FALLBACK_PRIORITY_SLUGS = [
  "fortnite-crew-pack",
  "fortnite-battle-pass",
  "fortnite-starter-pack",
  "fortnite-save-the-world",
  "fortnite-glided-elite-pack",
  "v-bucks",
  "fortnite-freediver",
  "fortnite-music-pass",
];

function normalizeSlug(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizeCategory(value) {
  return typeof value === "string" ? value.trim().toUpperCase() : "";
}

function soldCount(product) {
  const value = Number(product?.sold_count);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function fallbackPriority(slug) {
  const idx = FALLBACK_PRIORITY_SLUGS.indexOf(slug);
  return idx === -1 ? FALLBACK_PRIORITY_SLUGS.length : idx;
}

function collectCategoryEntries(products, categories) {
  const wanted = new Set(categories.map(normalizeCategory));
  const productBySlug = new Map();

  for (const product of Array.isArray(products) ? products : []) {
    if (!product || product.active === false) continue;
    if (!wanted.has(normalizeCategory(product.category))) continue;
    const slug = normalizeSlug(product.slug);
    if (!slug || productBySlug.has(slug)) continue;
    productBySlug.set(slug, product);
  }

  return [...productBySlug.entries()].map(([slug, product], order) => ({
    slug,
    product,
    order,
  }));
}

function entriesToHeroItems(entries) {
  return entries.flatMap(({ slug, product }) => {
    const { imageSrc, imageBase } = resolveProductImage(product);
    const img = imageSrc || (imageBase ? `${imageBase}.webp` : "");
    if (!img) return [];

    return [
      {
        img,
        name: product.name_fa || product.name || product.title || slug,
        slug,
      },
    ];
  });
}

// Deterministic PRNG so the server render and client hydration agree on order.
function mulberry32(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle(entries, seed) {
  const random = mulberry32(Number.isFinite(seed) ? seed : 1);
  const shuffled = [...entries];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function buildCategoryHeroItems(products = [], categories = []) {
  const entries = collectCategoryEntries(products, categories);

  entries.sort((a, b) => {
    const soldDiff = soldCount(b.product) - soldCount(a.product);
    if (soldDiff) return soldDiff;
    const priorityDiff = fallbackPriority(a.slug) - fallbackPriority(b.slug);
    if (priorityDiff) return priorityDiff;
    return a.order - b.order;
  });

  return entriesToHeroItems(entries);
}

const GAMING_CATEGORIES = ["FORTNITE", "GAMES", "GIFTCARDS"];

export function buildGamingHeroItems(products = [], seed = 1) {
  const entries = collectCategoryEntries(products, GAMING_CATEGORIES);
  return entriesToHeroItems(seededShuffle(entries, seed));
}

export function buildFortniteHeroItems(products = []) {
  return buildCategoryHeroItems(products, ["FORTNITE"]);
}

export function buildSubscriptionHeroItems(products = []) {
  return buildCategoryHeroItems(products, ["AI", "SUBSCRIPTIONS"]);
}
