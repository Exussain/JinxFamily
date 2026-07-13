import assert from "node:assert/strict";
import test from "node:test";
import {
  buildSmartPricingTiers,
  buildAutoTenTier,
  commitDisplayedPrice,
  pickAutoBasePrice,
  roundPrice,
  shouldAutoCreateTiers,
  validateTiers,
} from "./resellerPricingEditor.mjs";

test("manual tiers always prevent automatic smart pricing", () => {
  assert.equal(shouldAutoCreateTiers([{ min_quantity: 1, price: 123456 }]), false);
  assert.equal(shouldAutoCreateTiers([{ min_quantity: 1, price: 0 }]), true);
  assert.equal(shouldAutoCreateTiers([]), true);
  assert.equal(shouldAutoCreateTiers(null), true);
});

test("smart pricing builds and converts quantity 1 and 10 tiers", () => {
  assert.deepEqual(buildSmartPricingTiers({
    effectivePriceLira: 100,
    liraRate: 5000,
    priceFromDisplay: (price) => Math.round(price / 2),
  }), [
    { min_quantity: 1, price: 287000, active: true },
    { min_quantity: 10, price: 276500, active: true },
  ]);
});

test("smart pricing returns no tiers when no pricing basis exists", () => {
  assert.deepEqual(buildSmartPricingTiers({}), []);
});

test("manual display price is converted exactly once when committed", () => {
  let calls = 0;
  const raw = commitDisplayedPrice("123456", (displayPrice) => {
    calls += 1;
    assert.equal(displayPrice, 123456);
    return 61728;
  });
  assert.equal(raw, 61728);
  assert.equal(calls, 1);
});

test("buildAutoTenTier creates a 10 percent discount for quantity 10", () => {
  assert.deepEqual(
    buildAutoTenTier({ product: { price: 100000 } }),
    [
      { min_quantity: 1, price: 100000, active: true },
      { min_quantity: 10, price: 90000, active: true },
    ],
  );
});

test("buildAutoTenTier rounds prices to the nearest thousand", () => {
  assert.deepEqual(
    buildAutoTenTier({ product: { price: 100400 } }),
    [
      { min_quantity: 1, price: 100000, active: true },
      { min_quantity: 10, price: 90000, active: true },
    ],
  );
});

test("pickAutoBasePrice prefers tier, then product price, then ideal minimum", () => {
  assert.equal(pickAutoBasePrice({ tiers: [{ min_quantity: 1, price: 120000 }], product: { price: 100000 }, idealMinPrice: 90000 }), 120000);
  assert.equal(pickAutoBasePrice({ tiers: [], product: { price: 100000 }, idealMinPrice: 90000 }), 100000);
  assert.equal(pickAutoBasePrice({ tiers: [], product: { price: 0 }, idealMinPrice: 90000 }), 90000);
});

test("validateTiers sorts tiers and rejects duplicate quantities", () => {
  assert.deepEqual(validateTiers([
    { min_quantity: 10, price: 90000, active: true },
    { min_quantity: 1, price: 100000, active: true },
  ]), {
    ok: true,
    message: "",
    tiers: [
      { min_quantity: 1, price: 100000, active: true },
      { min_quantity: 10, price: 90000, active: true },
    ],
  });

  assert.equal(validateTiers([
    { min_quantity: 1, price: 100000 },
    { min_quantity: 1, price: 90000 },
  ]).ok, false);
});

test("roundPrice handles invalid input safely", () => {
  assert.equal(roundPrice(null), 0);
  assert.equal(roundPrice(-1000), 0);
  assert.equal(roundPrice(99499), 99000);
});
