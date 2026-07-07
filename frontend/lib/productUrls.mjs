export const DEDICATED_PRODUCT_PATHS = {
  "fortnite-crew-pack": "/crewpack",
  gta6: "/gta6",
  "v-bucks": "/vbucks",
  "gemini-subscription": "/gemini",
  "lego-starter-pack": "/lego",
};

export function productHref(slug, suffix = "") {
  const normalized = typeof slug === "string" ? slug.trim() : "";
  if (!normalized) return "/";
  const base = DEDICATED_PRODUCT_PATHS[normalized] || `/product/${encodeURIComponent(normalized)}`;
  return `${base}${suffix || ""}`;
}
