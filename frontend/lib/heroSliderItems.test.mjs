import test from "node:test";
import assert from "node:assert/strict";
import {
  buildCategoryHeroItems,
  buildFortniteHeroItems,
  buildGamingHeroItems,
  buildSubscriptionHeroItems,
} from "./heroSliderItems.js";

test("buildFortniteHeroItems keeps only active fortnite products with resolved images", () => {
  const items = buildFortniteHeroItems([
    { slug: "fortnite-starter-pack", name_fa: "استارتر پک", active: true, category: "FORTNITE" },
    { slug: "fortnite-battle-pass", name_fa: "بتل پس", active: false, category: "FORTNITE" },
    { slug: "fortnite-crew-pack", name_fa: "کروپک فورتنایت", active: true, category: "FORTNITE", image_url: "" },
    { slug: "spotify-subscription", name_fa: "اسپاتیفای", active: true, category: "SUBSCRIPTIONS" },
  ]);

  assert.deepEqual(items, [
    {
      img: "/products/crewpack.webp",
      name: "کروپک فورتنایت",
      slug: "fortnite-crew-pack",
    },
    {
      img: "/products/starterpack.webp",
      name: "استارتر پک",
      slug: "fortnite-starter-pack",
    },
  ]);
});

test("buildCategoryHeroItems orders by sold_count, then fallback priority, then API order", () => {
  const items = buildCategoryHeroItems(
    [
      { slug: "fortnite-crew-pack", name_fa: "کروپک", active: true, category: "FORTNITE", sold_count: 5 },
      { slug: "v-bucks", name_fa: "ویباکس", active: true, category: "FORTNITE", sold_count: 40 },
      { slug: "fortnite-battle-pass", name_fa: "بتل پس", active: true, category: "FORTNITE", sold_count: 0 },
      { slug: "fortnite-starter-pack", name_fa: "استارتر پک", active: true, category: "FORTNITE" },
    ],
    ["FORTNITE"]
  );

  assert.deepEqual(
    items.map((item) => item.slug),
    ["v-bucks", "fortnite-crew-pack", "fortnite-battle-pass", "fortnite-starter-pack"]
  );
});

test("buildCategoryHeroItems matches category case-insensitively (placeholder data)", () => {
  const items = buildCategoryHeroItems(
    [{ slug: "fortnite-crew-pack", name_fa: "کروپک", active: true, category: "fortnite" }],
    ["FORTNITE"]
  );

  assert.deepEqual(
    items.map((item) => item.slug),
    ["fortnite-crew-pack"]
  );
});

test("buildGamingHeroItems mixes gaming categories, shuffled deterministically by seed", () => {
  const products = [
    { slug: "fortnite-crew-pack", name_fa: "کروپک", active: true, category: "FORTNITE" },
    { slug: "v-bucks", name_fa: "ویباکس", active: true, category: "FORTNITE" },
    { slug: "gta6", name_fa: "جی‌تی‌ای ۶", active: true, category: "GAMES", image_url: "/products/gta6/ps5-standard.webp" },
    { slug: "fortnite-starter-pack", name_fa: "استارتر پک", active: true, category: "GIFTCARDS" },
    { slug: "gemini-subscription", name_fa: "جیمینی", active: true, category: "AI" },
  ];

  const itemsA = buildGamingHeroItems(products, 42);
  const itemsB = buildGamingHeroItems(products, 42);

  assert.deepEqual(itemsA, itemsB, "same seed must give the same order");
  assert.deepEqual(
    itemsA.map((item) => item.slug).sort(),
    ["fortnite-crew-pack", "fortnite-starter-pack", "gta6", "v-bucks"],
    "includes FORTNITE/GAMES/GIFTCARDS and excludes AI"
  );
});

test("buildSubscriptionHeroItems keeps AI and subscription products ordered by sales", () => {
  const items = buildSubscriptionHeroItems([
    { slug: "gemini-subscription", name_fa: "جیمینی", active: true, category: "AI", sold_count: 2 },
    { slug: "spotify-subscription", name_fa: "اسپاتیفای", active: true, category: "SUBSCRIPTIONS", sold_count: 7 },
    { slug: "fortnite-crew-pack", name_fa: "کروپک", active: true, category: "FORTNITE", sold_count: 100 },
  ]);

  assert.deepEqual(
    items.map((item) => item.slug),
    ["spotify-subscription", "gemini-subscription"]
  );
});
