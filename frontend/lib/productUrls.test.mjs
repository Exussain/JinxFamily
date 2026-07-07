import assert from "node:assert/strict";
import test from "node:test";
import { productHref } from "./productUrls.mjs";

test("productHref returns dedicated canonical product paths", () => {
  assert.equal(productHref("fortnite-crew-pack"), "/crewpack");
  assert.equal(productHref("gta6", "#reviews"), "/gta6#reviews");
  assert.equal(productHref("v-bucks"), "/vbucks");
  assert.equal(productHref("gemini-subscription"), "/gemini");
  assert.equal(productHref("lego-starter-pack"), "/lego");
});

test("productHref falls back to encoded product detail paths", () => {
  assert.equal(productHref("chatgpt-subscription"), "/product/chatgpt-subscription");
  assert.equal(
    productHref("گیفت-کارت-استیم", "#reviews"),
    "/product/%DA%AF%DB%8C%D9%81%D8%AA-%DA%A9%D8%A7%D8%B1%D8%AA-%D8%A7%D8%B3%D8%AA%DB%8C%D9%85#reviews"
  );
});
