export const ADMIN_PANEL_CACHE_BUSTER = "20260607c";

export function adminPanelHref() {
  return `/panel/admin?cb=${ADMIN_PANEL_CACHE_BUSTER}`;
}

export function adminCacheBustHref() {
  return `/api/admin-cache-bust?next=${encodeURIComponent(adminPanelHref())}`;
}
