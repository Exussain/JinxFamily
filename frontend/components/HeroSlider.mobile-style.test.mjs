import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(__dirname, "HeroSlider.css"), "utf8");

const marker = "/* ===== Mobile Story Hero Card ===== */";
const markerIndex = css.indexOf(marker);
const mobileStoryCss = markerIndex >= 0 ? css.slice(markerIndex) : "";

test("HeroSlider mobile CSS defines a story-card layout without mobile arrows", () => {
  assert.ok(markerIndex >= 0, "mobile story-card CSS marker is missing");
  assert.match(mobileStoryCss, /@media\s*\(max-width:\s*768px\)/);
  assert.match(mobileStoryCss, /\.nav-arrow\s*\{[^}]*display:\s*none\s*!important;/s);
  assert.match(mobileStoryCss, /\.hero-slide\s*\{[^}]*height:\s*clamp\(480px,\s*72vh,\s*540px\);/s);
  assert.match(mobileStoryCss, /\.hero-slide\s*\{[^}]*min-height:\s*unset;/s);
  assert.match(mobileStoryCss, /\.slide-content\s*\{[^}]*display:\s*grid;/s);
  assert.match(mobileStoryCss, /\.slide-content\s*\{[^}]*grid-template-rows:\s*minmax\(180px,\s*44%\)\s*1fr;/s);
  assert.match(mobileStoryCss, /\.slide-visual\s*\{[^}]*order:\s*1;/s);
  assert.match(mobileStoryCss, /\.slide-text\s*\{[^}]*order:\s*2;/s);
  assert.match(mobileStoryCss, /\.slider-dots\s*\{[^}]*bottom:\s*(18|20)px;/s);
});

test("HeroSlider mobile CSS reserves compact visual and CTA areas per slide", () => {
  assert.match(mobileStoryCss, /\.fortnite-carousel\s*\{[^}]*width:\s*clamp\(170px,\s*56vw,\s*250px\);/s);
  assert.match(mobileStoryCss, /\.social-image-wrapper\s*\{[^}]*width:\s*clamp\(150px,\s*52vw,\s*230px\);/s);
  assert.match(mobileStoryCss, /\.social-actions\s*\{[^}]*display:\s*grid;/s);
  assert.match(mobileStoryCss, /\.social-btn\s*\{[^}]*width:\s*min\(280px,\s*100%\);/s);
  assert.match(mobileStoryCss, /\.vouches-visual\s*\{[^}]*height:\s*clamp\(200px,\s*42vw,\s*240px\);/s);
  assert.match(mobileStoryCss, /\.slide-actions\s*\{[^}]*position:\s*static;/s);
});
