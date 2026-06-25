import test from "node:test";
import assert from "node:assert/strict";
import { buildCrewpackPresentation } from "./crewpackDisplay.js";

test("buildCrewpackPresentation uses the live product image and variant prices", () => {
  const product = {
    id: 1,
    slug: "fortnite-crew-pack",
    name_fa: "کروپک فورتنایت",
    image_url: "/media/products/new-crewpack.webp",
    price: 450000,
    min_price: 450000,
    variants: [
      { id: 21, title: "۱ ماهه", price: 450000 },
      { id: 22, title: "۳ ماهه", price: 1250000 },
    ],
  };

  const result = buildCrewpackPresentation(product);

  assert.equal(result.imageSrc, "/media/products/new-crewpack.webp");
  assert.deepEqual(result.options, [
    { duration: "۱ ماهه", price: 450000, variant_id: 21 },
    { duration: "۳ ماهه", price: 1250000, variant_id: 22 },
  ]);
  assert.equal(result.selectedVariantId, 21);
});

test("buildCrewpackPresentation falls back to the new 1/2/3 month crewpack options", () => {
  const result = buildCrewpackPresentation(null);

  assert.deepEqual(result.options, [
    { duration: "۱ ماهه", price: 649000, variant_id: "m1" },
    { duration: "۲ ماهه", price: 1290000, variant_id: "m2" },
    { duration: "۳ ماهه", price: 1795000, variant_id: "m3" },
  ]);
  assert.equal(result.selectedVariantId, "m1");
});
