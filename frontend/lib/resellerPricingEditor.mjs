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
