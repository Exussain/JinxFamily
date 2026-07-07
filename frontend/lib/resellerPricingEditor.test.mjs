import assert from "node:assert/strict";
import test from "node:test";
import {
  buildAutoTenTier,
  pickAutoBasePrice,
  roundPrice,
  validateTiers,
} from "./resellerPricingEditor.mjs";

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
