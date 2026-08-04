export const SITE_ORIGIN = (process.env.NEXT_PUBLIC_SITE_ORIGIN || "https://jinxfamily.ir").replace(/\/+$/, "");

export function absoluteUrl(pathname = "/") {
  if (/^https?:\/\//i.test(pathname)) return pathname;
  return `${SITE_ORIGIN}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}
