export function dedupeProducts(list) {
  if (!Array.isArray(list)) return [];

  const seen = new Set();
  const result = [];

  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const slug = typeof item.slug === "string" ? item.slug.trim() : "";
    const id = item.id ?? item.product_id ?? null;
    const key = slug ? `slug:${slug}` : id !== null ? `id:${id}` : null;

    if (!key) {
      result.push(item);
      continue;
    }
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }

  return result;
}
