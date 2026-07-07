const STATIC_IMAGE_MAP = {
  "fortnite-freediver": "/products/freediver.webp",
  "fortnite-crew-pack": "/products/crewpack.webp",
  "fortnite-starter-pack": "/products/starterpack.webp",
  "fortnite-battle-pass": "/products/battlepass.webp",
  "fortnite-music-pass": "/products/musicpass.webp",
  "gift-battle-pass": "/products/battlepass.webp",
  "fortnite-save-the-world": "/products/savetheworld.webp",
  "fortnite-glided-elite-pack": "/products/pack_glided_elites.webp",
  "v-bucks": "/products/product_vbucks.webp",
  "lego-starter-pack": "/products/lego_starter_pack.webp",
  "pack-agency-renegades": "/products/pack_agency_renegades.webp",
  "agency-renegades": "/products/pack_agency_renegades.webp",
  "pack-frozen-legends": "/products/pack_frozen_legends.webp",
  "frozen-legends": "/products/pack_frozen_legends.webp",
  "pack-polar-legends": "/products/pack_polar_legends.webp",
  "polar-legends": "/products/pack_polar_legends.webp",
  "spotify-subscription": "/products/spotify.webp",
  "chatgpt-subscription": "/products/chatgpt.webp",
  "gemini-subscription": "/products/gemini.webp",
  "change-region-turkey": "/products/change-region-turkey.webp",
};

function stripExt(path) {
  if (typeof path !== "string") return "";
  return path.replace(/\.(webp|png|jpe?g|svg)$/i, "");
}

function resolveMediaUrl(path) {
  if (typeof path !== "string" || !path.startsWith("/media/")) return path;
  const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/+$/, "");
  return apiBase ? `${apiBase}${path}` : path;
}

export function resolveProductImage(product = {}) {
  const slug = typeof product.slug === "string" ? product.slug.trim().toLowerCase() : "";
  const staticUrl = slug ? STATIC_IMAGE_MAP[slug] : "";

  const imageUrl =
    product.image_url ||
    product.imageUrl ||
    product.image ||
    product.imageSrc ||
    staticUrl ||
    "";

  const base =
    product.image_base ||
    product.imageBase ||
    (typeof imageUrl === "string" && imageUrl.startsWith("/") ? stripExt(imageUrl) : "");

  const imageSrc =
    typeof imageUrl === "string" && imageUrl.length > 0
      ? resolveMediaUrl(imageUrl)
      : typeof base === "string" && /\.[a-z0-9]+$/i.test(base)
        ? resolveMediaUrl(base)
        : "";

  const imageBase =
    typeof base === "string" && base.length > 0 && !/\.[a-z0-9]+$/i.test(base)
      ? base
      : typeof imageSrc === "string" && imageSrc.startsWith("/")
        ? stripExt(imageSrc)
        : "";

  return { imageBase, imageSrc };
}
