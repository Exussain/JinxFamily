import assert from "node:assert/strict";
import test from "node:test";
import { getRelatedProducts } from "./relatedProducts.mjs";

const products = [
  { id: 1, slug: "fortnite-crew-pack", category: "FORTNITE", sold_count: 10 },
  { id: 2, slug: "fortnite-starter-pack", category: "FORTNITE", sold_count: 3 },
  { id: 3, slug: "v-bucks", category: "FORTNITE", sold_count: 20 },
  { id: 4, slug: "fortnite-battle-pass", category: "FORTNITE", sold_count: 5 },
  { id: 5, slug: "chatgpt-subscription", category: "AI", sold_count: 8 },
  { id: 6, slug: "gemini-subscription", category: "AI", sold_count: 7 },
  { id: 7, slug: "spotify-subscription", category: "SUBSCRIPTIONS", sold_count: 1 },
];

test("uses manual Fortnite ordering before category fallback", () => {
  const related = getRelatedProducts(products[0], products, 4).map((p) => p.slug);
  assert.deepEqual(related, [
    "fortnite-starter-pack",
    "v-bucks",
    "fortnite-battle-pass",
    "chatgpt-subscription",
  ]);
});

test("connects subscription and AI products", () => {
  const related = getRelatedProducts(products[4], products, 3).map((p) => p.slug);
  assert.deepEqual(related, [
    "gemini-subscription",
    "spotify-subscription",
    "v-bucks",
  ]);
});

test("excludes current product and falls back to same category", () => {
  const related = getRelatedProducts(
    { id: 99, slug: "custom-fortnite", category: "FORTNITE" },
    products,
    2
  ).map((p) => p.slug);
  assert.deepEqual(related, ["v-bucks", "fortnite-crew-pack"]);
});
