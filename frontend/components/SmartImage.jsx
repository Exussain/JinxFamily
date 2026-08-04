"use client";
import Image from "next/image";

const WEBP_IMAGE_RE = /\.webp(?:[?#].*)?$/i;
const DIRECT_IMAGE_RE = /^(https?:)?\/\//i;

export default function SmartImage({ src, alt, base, fit = "cover", eager = false }) {
  // If neither a direct src nor a base path is provided,
  // avoid generating invalid URLs like "undefined.svg".
  const imageSrc = src || (base ? `${base}.webp` : null);
  if (!imageSrc) {
    return null;
  }

  const preserveOriginal = WEBP_IMAGE_RE.test(imageSrc);
  if (DIRECT_IMAGE_RE.test(imageSrc)) {
    return (
      <img
        src={imageSrc}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : undefined}
        decoding="async"
        style={{ width: "100%", height: "100%", objectFit: fit }}
        draggable="false"
      />
    );
  }

  return (
    <Image
      src={imageSrc}
      alt={alt}
      fill
      sizes="(max-width: 640px) 100vw, 33vw"
      // Next only permits configured image quality values in production. 75 is
      // its default supported value and avoids broken optimized PNG/JPEG URLs.
      quality={75}
      unoptimized={preserveOriginal}
      priority={eager}
      style={{ objectFit: fit }}
    />
  );
}
