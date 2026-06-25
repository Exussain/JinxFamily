import assert from "node:assert/strict";
import { groupAdminProducts } from "./adminProductGroups.mjs";

const products = [
  { id: 1, name_fa: "Steam Gift", slug: "steam-gift", category: "GIFTCARDS" },
  { id: 2, name_fa: "ChatGPT Plus", slug: "chatgpt-plus", category: "AI" },
  { id: 3, name_fa: "Crew Pack", slug: "crew-pack", category: "FORTNITE" },
  { id: 4, name_fa: "Spotify", slug: "spotify", category: "SUBSCRIPTIONS" },
  { id: 5, name_fa: "LOL RP", slug: "lol-rp", category: "GAMES" },
];

const groups = groupAdminProducts(products);

assert.deepEqual(groups.map((group) => group.key), [
  "fortnite",
  "ai",
  "subscriptions",
  "other-games",
]);

assert.deepEqual(groups.map((group) => group.count), [1, 1, 1, 2]);
assert.deepEqual(groups.find((group) => group.key === "other-games").products.map((p) => p.slug), [
  "lol-rp",
  "steam-gift",
]);
