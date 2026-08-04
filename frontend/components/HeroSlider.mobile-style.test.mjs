import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(__dirname, "HeroSlider.css"), "utf8");

test("HeroSlider mobile CSS defines the responsive slider layout for small screens", () => {
  assert.match(css, /@media\s*\(max-width:\s*540px\)/);
  assert.match(css, /\.jinxfamily-hero-slider\s*\{[^}]*width:\s*calc\(100%\s*\+\s*24px\);/s);
  assert.match(css, /\.jf-offer-products\s*\{[^}]*display:\s*flex;/s);
  assert.match(css, /\.jf-offer-card\s*\{[^}]*flex:\s*0\s*0\s*73%/s);
});
