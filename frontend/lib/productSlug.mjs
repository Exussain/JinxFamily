// params.slug arrives percent-encoded for Persian slugs — decode once at the
// route boundary, re-encode only at fetch time. Without this the API sees a
// double-encoded slug and returns 404 (which silently dropped metadata and
// JSON-LD on every Persian-slug product page).
export function normalizeSlug(rawSlug) {
  try {
    return decodeURIComponent(rawSlug || '');
  } catch {
    return rawSlug || '';
  }
}
