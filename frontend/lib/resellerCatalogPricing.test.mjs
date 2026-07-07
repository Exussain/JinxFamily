import assert from "node:assert/strict";
import test from "node:test";
import {
  buildEffectiveResellerTiers,
  resellerUnitPriceForQuantity,
} from "./resellerCatalogPricing.mjs";

test("Crew behavior pricing overrides raw catalog tiers for single quantity", () => {
  const product = { behavior_pricing: { crew_single: 505000, crew_ten: 469000 } };
  const tiers = [{ min_quantity: 1, price: 546000, active: true }];

  assert.equal(resellerUnitPriceForQuantity(product, tiers, 1), 505000);
});

test("Crew behavior pricing uses the 10+ behavior price for bulk orders", () => {
  const product = { behavior_pricing: { crew_single: 505000, crew_ten: 469000 } };
  const tiers = [
    { min_quantity: 1, price: 546000, active: true },
    { min_quantity: 10, price: 528000, active: true },
  ];

  assert.equal(resellerUnitPriceForQuantity(product, tiers, 10), 469000);
});

test("effective tiers mirror backend behavior prices instead of raw tiers", () => {
  const product = { behavior_pricing: { crew_single: 505000, crew_ten: 469000 } };

  assert.deepEqual(buildEffectiveResellerTiers(product, [
    { min_quantity: 1, price: 546000, active: true },
    { min_quantity: 10, price: 528000, active: true },
  ]), [
    { min_quantity: 1, price: 505000, active: true },
    { min_quantity: 10, price: 469000, active: true },
  ]);
});

test("non-behavior products keep normal tier pricing", () => {
  const tiers = [
    { min_quantity: 1, price: 100000, active: true },
    { min_quantity: 10, price: 90000, active: true },
  ];

  assert.equal(resellerUnitPriceForQuantity({}, tiers, 12), 90000);
});
