import test from "node:test";
import assert from "node:assert/strict";
import { resolveProductImage } from "./productImageHelpers.js";

test("resolveProductImage prefers admin image_url over the static fallback", () => {
  const result = resolveProductImage({
    slug: "fortnite-crew-pack",
    image_url: "/media/products/custom-crew.webp",
  });

  assert.deepEqual(result, {
    imageBase: "/media/products/custom-crew",
    imageSrc: "/media/products/custom-crew.webp",
  });
});

