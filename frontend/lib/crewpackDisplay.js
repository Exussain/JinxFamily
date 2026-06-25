import { resolveProductImage } from "./productImageHelpers.js";

const DEFAULT_OPTIONS = [
  { duration: "۱ ماهه", price: 649000, variant_id: "m1" },
  { duration: "۲ ماهه", price: 1290000, variant_id: "m2" },
  { duration: "۳ ماهه", price: 1795000, variant_id: "m3" },
];

function normalizeDurationTitle(title, fallbackIndex) {
  const text = typeof title === "string" ? title.trim() : "";
  if (!text) {
    return DEFAULT_OPTIONS[fallbackIndex]?.duration || `گزینه ${fallbackIndex + 1}`;
  }

  const normalized = text
    .replace(/\s+/g, " ")
    .replace(/[ًٌٍَُِّٔـ]/g, "")
    .toLowerCase();

  if (normalized.includes("3") || normalized.includes("۳") || normalized.includes("سه ماهه")) {
    return "۳ ماهه";
  }
  if (normalized.includes("2") || normalized.includes("۲") || normalized.includes("دو ماهه") || normalized.includes("2 month")) {
    return "۲ ماهه";
  }
  if (normalized.includes("1") || normalized.includes("۱") || normalized.includes("یک ماهه")) {
    return "۱ ماهه";
  }

  return text;
}

function buildOptionsFromVariants(product) {
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  if (!variants.length) return [];

  return variants
    .map((variant, index) => {
      const duration = normalizeDurationTitle(variant?.title, index);
      const price = Number(variant?.price) || Number(product?.min_price) || Number(product?.price) || DEFAULT_OPTIONS[index]?.price || 0;
      return {
        duration,
        price,
        variant_id: variant?.id ?? DEFAULT_OPTIONS[index]?.variant_id ?? `variant-${index}`,
      };
    })
    .filter((option) => option.price > 0);
}

export function buildCrewpackPresentation(product = null) {
  const fallbackProduct = product || { slug: "fortnite-crew-pack" };
  const { imageSrc, imageBase } = resolveProductImage(fallbackProduct);

  const liveOptions = buildOptionsFromVariants(product);
  const options = liveOptions.length
    ? liveOptions
    : DEFAULT_OPTIONS.map((option, index) => ({
        ...option,
        price:
          index === 0
            ? Number(product?.price) || Number(product?.min_price) || option.price
            : option.price,
      }));

  return {
    imageSrc,
    imageBase,
    options,
    selectedVariantId: options[0]?.variant_id || DEFAULT_OPTIONS[0].variant_id,
  };
}
