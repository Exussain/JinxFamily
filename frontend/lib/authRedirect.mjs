import { adminCacheBustHref } from "./adminUrl.mjs";

export function getAuthedLoginRedirect(user, fromParam) {
  if (fromParam === "checkout") {
    return null;
  }

  return user?.is_admin ? adminCacheBustHref() : "/panel/user";
}
