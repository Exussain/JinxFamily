import assert from "node:assert/strict";
import { adminCacheBustHref } from "./adminUrl.mjs";
import { getAuthedLoginRedirect } from "./authRedirect.mjs";

assert.equal(getAuthedLoginRedirect({ is_admin: true }, null), adminCacheBustHref());
assert.equal(getAuthedLoginRedirect({ is_admin: false }, null), "/panel/user");
assert.equal(getAuthedLoginRedirect({ is_admin: true }, "protected"), adminCacheBustHref());
assert.equal(getAuthedLoginRedirect({ is_admin: false }, "protected"), "/panel/user");
assert.equal(getAuthedLoginRedirect({ is_admin: false }, "checkout"), null);
