export function behaviorCrewUnitPrice(product, qty) {
  const behavior = product?.behavior_pricing;
  if (!behavior) return 0;
  const single = Number(behavior.crew_single || 0);
  const ten = Number(behavior.crew_ten || 0);
  if (qty >= 10 && ten > 0) return ten;
  return single > 0 ? single : 0;
}

export function buildEffectiveResellerTiers(product, tiers = []) {
  const single = behaviorCrewUnitPrice(product, 1);
  if (!single) return tiers || [];
  const ten = behaviorCrewUnitPrice(product, 10);
  const effective = [{ min_quantity: 1, price: single, active: true }];
  if (ten > 0 && ten !== single) {
    effective.push({ min_quantity: 10, price: ten, active: true });
  }
  return effective;
}

export function resellerUnitPriceForQuantity(product, tiers = [], qty = 1) {
  const behaviorPrice = behaviorCrewUnitPrice(product, qty);
  if (behaviorPrice > 0) return behaviorPrice;
  const active = (tiers || [])
    .filter((tier) => tier?.active !== false)
    .sort((a, b) => Number(b.min_quantity || 0) - Number(a.min_quantity || 0));
  const quantity = Number(qty || 1);
  for (const tier of active) {
    if (quantity >= Number(tier.min_quantity || 0)) return Number(tier.price || 0);
  }
  return 0;
}
