export const AUTO_TIER_DISCOUNT = 0.1;
export const PRICE_ROUND_STEP = 1000;

export function roundPrice(value, step = PRICE_ROUND_STEP) {
  const n = Number(value || 0);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.max(0, Math.round(n / step) * step);
}

export function sortTiers(tiers) {
  return [...(tiers || [])].sort((a, b) => Number(a.min_quantity || 0) - Number(b.min_quantity || 0));
}

export function normalizeEditableTiers(tiers) {
  return sortTiers(tiers).map((tier) => ({
    min_quantity: Math.max(1, parseInt(tier.min_quantity, 10) || 1),
    price: Math.max(0, parseInt(tier.price, 10) || 0),
    active: tier.active !== false,
  }));
}

export function shouldAutoCreateTiers(tiers) {
  return !Array.isArray(tiers) || !tiers.some((tier) => Number(tier?.price || 0) > 0);
}

export function commitDisplayedPrice(displayValue, priceFromDisplay = (value) => value) {
  const parsed = parseInt(String(displayValue ?? "").trim(), 10);
  const displayPrice = Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
  return Math.max(0, parseInt(priceFromDisplay(displayPrice), 10) || 0);
}

export function buildSmartPricingTiers({
  isCrew = false,
  effectivePriceLira = 0,
  liraRate = 0,
  productPrice = 0,
  productSlug = "",
  variantTitle = "",
  priceFromDisplay = (value) => value,
} = {}) {
  let single = 0;
  let ten = 0;
  if (isCrew) {
    single = 505000;
    ten = 469000;
  } else if (Number(effectivePriceLira) > 0 && Number(liraRate) > 0) {
    const cost = Number(effectivePriceLira) * Number(liraRate);
    const lowBoost = Math.max(0, (800000 - cost) / 800000);
    const premiumBoost = Math.max(0, (cost - 5000000) / 3000000);
    let singleMargin = 0.112 + 0.095 * lowBoost + 0.028 * premiumBoost;
    let tenMargin = 0.087 + 0.05 * lowBoost + 0.018 * premiumBoost;
    if (productSlug === "starterpack") singleMargin -= 0.015;
    if (productSlug === "minty-legends-pack") singleMargin -= 0.005;
    if (productSlug === "v-bucks" && variantTitle.includes("2400")) singleMargin += 0.05;
    if (productSlug === "v-bucks" && variantTitle.includes("4500")) singleMargin += 0.008;
    single = roundPrice(cost * (1 + singleMargin));
    ten = roundPrice(cost * (1 + tenMargin));
  } else if (Number(productPrice) > 0) {
    single = roundPrice(Number(productPrice) * 0.9);
    ten = roundPrice(single * 0.9);
  }
  if (single <= 0 || ten <= 0) return [];
  return normalizeEditableTiers([
    { min_quantity: 1, price: priceFromDisplay(single), active: true },
    { min_quantity: 10, price: priceFromDisplay(ten), active: true },
  ]);
}

export function pickAutoBasePrice({ tiers = [], product = null, idealMinPrice = 0 } = {}) {
  const firstTier = normalizeEditableTiers(tiers).find((tier) => tier.min_quantity === 1 && tier.price > 0);
  if (firstTier) return firstTier.price;
  const productPrice = Number(product?.price || product?.base_price || 0);
  if (productPrice > 0) return productPrice;
  const ideal = Number(idealMinPrice || 0);
  if (ideal > 0) return ideal;
  return 0;
}

export function buildAutoTenTier({ tiers = [], product = null, idealMinPrice = 0 } = {}) {
  const base = roundPrice(pickAutoBasePrice({ tiers, product, idealMinPrice }));
  if (base <= 0) return [];
  return normalizeEditableTiers([
    { min_quantity: 1, price: base, active: true },
    { min_quantity: 10, price: roundPrice(base * (1 - AUTO_TIER_DISCOUNT)), active: true },
  ]);
}

export function validateTiers(tiers) {
  const normalized = normalizeEditableTiers(tiers);
  if (normalized.length === 0) {
    return { ok: false, message: "حداقل یک پله قیمت لازم است.", tiers: normalized };
  }
  const seen = new Set();
  for (const tier of normalized) {
    if (tier.min_quantity < 1 || tier.price < 0) {
      return { ok: false, message: "تعداد و قیمت پله‌ها نامعتبر است.", tiers: normalized };
    }
    if (seen.has(tier.min_quantity)) {
      return { ok: false, message: "حداقل تعداد پله‌ها نباید تکراری باشد.", tiers: normalized };
    }
    seen.add(tier.min_quantity);
  }
  return { ok: true, message: "", tiers: normalized };
}
