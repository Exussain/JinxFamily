# Khorshid-Style Integration Patterns

Use these patterns for SvelteKit/product apps that manage 3x-ui panels, inbounds, clients, traffic, and service links.

## Existing Helper Shape

Prefer an app-local helper module similar to `src/lib/server/xui.ts`:

- `buildPanelUrl(panel, pathname)` joins `baseUrl`, `webPath`, and route.
- `buildApiUrl(panel, pathname)` prefixes `/panel/api`.
- `loginToPanel(panel)` posts form-urlencoded credentials to `/login`, captures cookies, and returns a resolved panel/session.
- `requestPanelApi<T>(panel, pathname, options)` logs in, sends the API request with cookies, parses JSON, and checks `success`.
- Domain functions wrap API calls: `listXuiInbounds`, `addXuiClient`, `updateXuiClient`, `deleteXuiClient`, usage lookups, health checks.

Do not scatter direct fetch/curl logic across route files when a helper already exists.

## Root Web Path Handling

Root-mounted panels are valid. Do not require a random path.

Recommended normalization:

```ts
function normalizePanelWebPath(input: string) {
  const value = input.trim();

  if (!value || value === '/') {
    return '/';
  }

  return `/${value.replace(/^\/+/, '').replace(/\/+$/, '')}`;
}
```

Recommended URL join behavior:

```ts
const base = panel.baseUrl.replace(/\/+$/, '');
const webPath = panel.webPath.replace(/\/+$/, '');
const route = pathname.startsWith('/') ? pathname : `/${pathname}`;
return `${base}${webPath}${route}`;
```

With `webPath === '/'`, this produces `https://host:2053/login`, not `https://host:2053//login`.

## Admin UI Rules

- Web path input should accept empty or `/`.
- Placeholder should mention both modes, for example `/ or /randompath`.
- Show the stored path in admin details so root-mounted panels are visible as `/`.
- Do not mark web path as required unless the product truly requires obfuscated panel paths.

## Safe Verification

For "does this panel work?" checks:

1. Login.
2. List inbounds.
3. Optionally call server status.

Avoid add/delete test clients for simple verification. If an existing health check does add/delete a temporary client, label it clearly and do not run it during passive UI rendering.

## Error Handling

Return messages that identify the likely layer:

- "Unable to login to 3x-ui panel" for auth or login envelope failure.
- "3x-ui panel did not return a session cookie" for broken login/session behavior.
- "Panel request timed out" for network or reverse proxy hangs.
- "Invalid JSON response from 3x-ui panel" for HTML/error pages or wrong routes.
- "No enabled supported inbound was found" when the API works but there is no usable inbound.

When debugging production issues, check app logs and reverse proxy logs before changing panel logic.

## Credentials And Logs

- Never log password, session cookie, subscription URL, or raw inbound settings.
- Log panel ID/name, endpoint category, status code, timing, and sanitized error.
- Redact or omit UUID/client email unless needed for the user's explicit task.

## Writes

Before calling write endpoints:

- Confirm inbound ID and protocol.
- Map client identifier by protocol: VLESS/VMess uses `client.id`, Trojan uses `client.password`, Shadowsocks uses `client.email`.
- Preserve existing client fields when updating; do not rebuild from partial UI data unless the API expects full replacement.
- For traffic resets and service restarts, make the operation explicit because it changes live service behavior.
