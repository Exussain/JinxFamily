---
name: xui-panel-integration
description: Work with 3x-ui/x-ui panel APIs in app projects like Khorshid. Use when verifying panel credentials or web paths, integrating panel CRUD/health checks, debugging x-ui API errors, handling root-path panels without random paths, normalizing panel URLs, or implementing safe client/inbound operations against /login and /panel/api endpoints.
---

# XUI Panel Integration

Use this skill for 3x-ui/x-ui panels connected to product apps. Treat panel access as an external system integration: verify the live API first, make read-only checks before writes, and keep credentials out of logs.

## Workflow

1. Locate the project's existing x-ui helper before adding new code. Reuse its request, timeout, cookie, URL-normalization, and error-handling patterns.
2. Normalize panel URLs conservatively:
   - `baseUrl`: scheme + host + optional port, without trailing slash.
   - `webPath`: allow `""` and `/` for root-mounted panels; normalize random paths to `/randompath`.
   - API URLs are `{baseUrl}{webPath}/panel/api/...`; login is `{baseUrl}{webPath}/login`.
3. Verify read-only access:
   - POST `/login` with `application/x-www-form-urlencoded` body: `username`, `password`, `twoFactorCode`.
   - Reuse returned session cookies.
   - GET `/panel/api/inbounds/list`.
4. Only after read-only verification, implement or run writes such as `addClient`, `updateClient`, `delClient`, traffic reset, or service restart.
5. When debugging, distinguish integration failures:
   - Auth failure: bad username/password/two-factor or missing session cookie.
   - URL failure: wrong scheme, port, reverse proxy route, or web path.
   - API failure: 3x-ui JSON envelope has `success: false`.
   - App validation failure: local code rejects valid root path `/` or empty path.
6. Do not print passwords, cookies, full subscription links, UUIDs, or client identifiers unless the user explicitly asks and it is necessary.

## Probe Script

Use `scripts/probe-xui-panel.mjs` for read-only verification without touching app code:

```bash
export XUI_USERNAME='...'
export XUI_PASSWORD='...'
node /root/.codex/skills/xui-panel-integration/scripts/probe-xui-panel.mjs \
  --base-url https://panel.example.com:2053 \
  --web-path / \
  --insecure
```

The script logs login success, inbound count, and summarized inbound metadata. Use `--status` to also call `/panel/api/server/status`. Use `--insecure` only when the panel uses a self-signed or mismatched certificate, matching many x-ui deployments.

## References

- Read `references/api.md` when implementing or debugging endpoint behavior.
- Read `references/khorshid-patterns.md` when changing a SvelteKit or Khorshid-like app integration.

## Implementation Rules

- Store credentials encrypted or in the project's existing secret storage; never hard-code them in committed files.
- Prefer one login per operation unless the app already has a secure session cache.
- Preserve 3x-ui's response envelope shape: `{ success, msg, obj }`.
- Use short request timeouts and actionable errors; do not let panel calls hang user-facing requests.
- Test root-path panels explicitly. A missing random path is valid when the panel is mounted at `/`.
- For health checks, prefer read-only `list`/`status`. If the existing app uses add/delete test clients, make that behavior explicit and avoid running it during simple connection tests.
