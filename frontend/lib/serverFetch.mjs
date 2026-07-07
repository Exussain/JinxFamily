// Resilient server-side (SSR) fetch for backend API calls.
//
// Server components must use an ABSOLUTE URL. Pointing them at the public
// domain (e.g. https://nubixshop.ir) is fragile: after an IP/server
// migration, or behind Cloudflare/hairpin-NAT, the box often cannot reach
// its own public hostname, so the fetch fails and the page renders blank.
//
// Strategy: prefer internal/loopback access (no DNS/SSL), then fall back to
// the public base. Mirrors the fallback chain in app/page.js.
export function getServerApiBases() {
  const internal = (process.env.INTERNAL_API_BASE_URL || "").trim();
  const publicBase = (process.env.NEXT_PUBLIC_API_BASE_URL || "").trim();
  const candidates = [internal, "http://127.0.0.1:8001", publicBase]
    .filter(Boolean)
    .map((b) => b.replace(/\/+$/, ""));
  return [...new Set(candidates)];
}

// Fetch JSON from `path` (e.g. "/api/products/v-bucks"), trying each base in
// turn. Returns parsed JSON or null if every base fails.
export async function fetchApiJson(path, init = { cache: "no-store" }) {
  for (const base of getServerApiBases()) {
    try {
      const res = await fetch(`${base}${path}`, init);
      if (res.ok) return await res.json();
    } catch {
      // try next base
    }
  }
  return null;
}

// Like fetchApiJson, but distinguishes "the API said 404" (resource is gone —
// the page should return a real HTTP 404 via notFound()) from "no base was
// reachable" (transient backend outage — degrade gracefully, never 404 live
// pages because of it). status is 404 when any base answered 404, 0 when
// every base failed with a network error or 5xx.
export async function fetchApiJsonWithStatus(path, init = { cache: "no-store" }) {
  for (const base of getServerApiBases()) {
    try {
      const res = await fetch(`${base}${path}`, init);
      if (res.ok) return { data: await res.json(), status: res.status };
      if (res.status === 404) return { data: null, status: 404 };
      // 5xx/other: try the next base
    } catch {
      // unreachable: try the next base
    }
  }
  return { data: null, status: 0 };
}
