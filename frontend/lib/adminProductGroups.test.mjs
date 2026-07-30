import assert from "node:assert/strict";
import { groupAdminProducts } from "./adminProductGroups.mjs";

const products = [
  { id: 1, name_fa: "Steam Gift", slug: "steam-gift", category: "GIFTCARDS" },
  { id: 2, name_fa: "ChatGPT Plus", slug: "chatgpt-plus", category: "AI" },
  { id: 3, name_fa: "Crew Pack", slug: "crew-pack", category: "FORTNITE" },
  { id: 4, name_fa: "Spotify", slug: "spotify", category: "SUBSCRIPTIONS" },
  { id: 5, name_fa: "GTA VI", slug: "gta6", category: "GAMES" },
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
  "gta6",
  "steam-gift",
]);

const activeSortGroups = groupAdminProducts([
  { id: 10, name_fa: "آیتم غیرفعال الف", slug: "inactive-a", category: "FORTNITE", active: false },
  { id: 11, name_fa: "آیتم فعال ی", slug: "active-z", category: "FORTNITE", active: true },
  { id: 12, name_fa: "آیتم فعال ب", slug: "active-b", category: "FORTNITE", active: true },
]);

assert.deepEqual(activeSortGroups.find((group) => group.key === "fortnite").products.map((p) => p.slug), [
  "active-b",
  "active-z",
  "inactive-a",
]);
