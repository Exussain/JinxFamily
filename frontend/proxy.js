import { NextResponse } from "next/server";
import { adminCacheBustHref, ADMIN_PANEL_CACHE_BUSTER } from "./lib/adminUrl.mjs";

const PUBLIC_API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://nubixshop.ir";
const INTERNAL_API_BASE =
  process.env.INTERNAL_API_BASE_URL || PUBLIC_API_BASE;

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

export default async function proxy(req) {
  const { pathname, origin } = req.nextUrl;
  const host = req.headers.get("host") || "";

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
  matcher: [
    "/",
    "/login",
    "/login/:path*",
    "/signup",
    "/signup/:path*",
    "/otp-login",
    "/otp-login/:path*",
    "/panel/admin",
    "/panel/admin/:path*",
    "/panel/user",
    "/panel/user/:path*",
    "/reseller",
    "/reseller/:path*",
  ],
};
