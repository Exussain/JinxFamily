import { NextResponse } from "next/server";
import { adminCacheBustHref, ADMIN_PANEL_CACHE_BUSTER } from "./lib/adminUrl.mjs";

const PUBLIC_API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://nubixshop.ir";
const INTERNAL_API_BASE =
  process.env.INTERNAL_API_BASE_URL || PUBLIC_API_BASE;

// Temporary site-wide gate: only admins see the live site while a large
// batch of changes is in progress. Flip back to false (and HardReload) to
// restore normal public access — nothing else in this file depends on it.
const MAINTENANCE_MODE = false;

async function fetchAuthStatus(cookie, baseUrl) {
  if (!baseUrl) {
    throw new Error("Missing API base URL");
  }
  const url = new URL("/api/auth/me", baseUrl);
  return fetch(url, {
    headers: {
      cookie,
    },
    cache: "no-store",
  });
}

function addAdminCacheBustHeaders(response) {
  response.headers.set("Cache-Control", "private, no-cache, no-store, max-age=0, must-revalidate");
  response.headers.set("Clear-Site-Data", '"cache"');
  return response;
}

function buildAdminCacheBustPage(reqUrl) {
  // Redirect back to the SAME URL the user requested, with the cb marker
  // appended so the proxy lets the second request through to the auth check.
  // Preserves sub-routes (e.g. /panel/admin/ai-playground) that were previously
  // lost when the target was hardcoded to the base admin page.
  const u = new URL(reqUrl);
  u.searchParams.set("cb", ADMIN_PANEL_CACHE_BUSTER);
  const target = `${u.pathname}${u.search}`;
  return new Response(
    `<!doctype html>
<html lang="fa">
<head>
  <meta charset="utf-8">
  <meta name="robots" content="noindex,nofollow">
  <title>Refreshing admin cache</title>
</head>
<body>
  <script>window.location.replace(${JSON.stringify(target)});</script>
</body>
</html>`,
    {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "private, no-cache, no-store, max-age=0, must-revalidate",
        "Clear-Site-Data": '"cache"',
        "Refresh": `0; url=${target}`,
      },
    },
  );
}

function buildMaintenanceResponse() {
  return new Response(
    `<!doctype html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>در حال به‌روزرسانی | نوبیکس شاپ</title>
<style>
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0b1020;color:#fff;font-family:Tahoma,Arial,sans-serif;text-align:center;padding:24px;box-sizing:border-box}
  .box{max-width:420px}
  h1{font-size:22px;margin:0 0 12px}
  p{font-size:15px;line-height:1.9;color:#c6c9d8;margin:0}
</style>
</head>
<body>
  <div class="box">
    <h1>نوبیکس شاپ در حال به‌روزرسانی است</h1>
    <p>در حال انجام تغییرات هستیم، به‌زودی برمی‌گردیم. لطفاً دوباره سر بزنید.</p>
  </div>
</body>
</html>`,
    {
      status: 503,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "Retry-After": "1800",
      },
    },
  );
}

async function isAdminRequest(req) {
  const cookie = req.headers.get("cookie") || "";
  const { origin } = req.nextUrl;
  const candidates = [INTERNAL_API_BASE, origin, PUBLIC_API_BASE].filter(Boolean);
  for (const base of candidates) {
    try {
      const response = await fetchAuthStatus(cookie, base);
      if (!response.ok) return false;
      const data = await response.json().catch(() => null);
      return Boolean(data?.is_admin);
    } catch (err) {
      continue;
    }
  }
  return false;
}

export default async function proxy(req) {
  const { pathname, origin } = req.nextUrl;
  const host = req.headers.get("host") || "";

  if (MAINTENANCE_MODE) {
    const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/otp-login");
    if (!isAuthRoute && !(await isAdminRequest(req))) {
      return buildMaintenanceResponse();
    }
  }

  if (host.includes("vip-reseller")) {
    if (pathname === "/") {
      return NextResponse.redirect(new URL("/reseller", req.url));
    }
    if (
      pathname.startsWith("/login") ||
      pathname.startsWith("/signup") ||
      pathname.startsWith("/otp-login") ||
      pathname.startsWith("/panel/admin") ||
      pathname.startsWith("/panel/user")
    ) {
      return NextResponse.redirect(new URL("/reseller", req.url));
    }
  }

  if (pathname.startsWith("/login") || pathname.startsWith("/signup") || pathname.startsWith("/otp-login")) {
    return addAdminCacheBustHeaders(NextResponse.next());
  }

  // Reseller pages have NO captcha, so they don't need stale-captcha cache
  // busting. Emitting Clear-Site-Data: "cache" here wiped the immutable
  // /_next/static CSS chunks mid-navigation, intermittently painting the page
  // fully unstyled (same failure mode documented for crewpack/checkout in
  // next.config.js). Freshness is handled by no-store headers in next.config.js.
  if (pathname.startsWith("/reseller")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/panel/admin") && !req.nextUrl.searchParams.has("cb")) {
    return buildAdminCacheBustPage(req.url);
  }

  if (!pathname.startsWith("/panel/admin")) {
    return NextResponse.next();
  }

  const cookie = req.headers.get("cookie") || "";
  const candidates = [
    INTERNAL_API_BASE,
    origin,
    PUBLIC_API_BASE,
  ].filter(Boolean);

  let response;
  for (const base of candidates) {
    try {
      response = await fetchAuthStatus(cookie, base);
      break;
    } catch (err) {
      response = null;
      continue;
    }
  }

  if (!response) {
    return addAdminCacheBustHeaders(NextResponse.redirect(new URL("/login?from=protected", req.url)));
  }

  if (response.status === 401) {
    return addAdminCacheBustHeaders(NextResponse.redirect(new URL("/login?from=protected", req.url)));
  }

  if (!response.ok) {
    return addAdminCacheBustHeaders(NextResponse.redirect(new URL("/login?from=protected", req.url)));
  }

  const data = await response.json().catch(() => null);
  if (!data?.is_admin) {
    return addAdminCacheBustHeaders(NextResponse.redirect(new URL("/panel/user", req.url)));
  }

  return addAdminCacheBustHeaders(NextResponse.next());
}

export const config = {
  // While MAINTENANCE_MODE is on, this needs to run on (almost) every page
  // route so non-admin visitors hit the gate everywhere, not just the
  // previously-listed auth/admin/reseller paths. Static assets and /api are
  // excluded so they aren't slowed down by a per-request admin check.
  matcher: [
    "/((?!api|_next/static|_next/image|.*\\.(?:ico|png|jpg|jpeg|svg|gif|webp|css|js|woff2?|ttf|map)$).*)",
  ],
};
