# 3x-ui API Reference

This reference is based on the provided 3x-ui documentation excerpt and the Khorshid integration behavior verified against a live panel.

## URL Shape

Panel URL parts:

- `baseUrl`: `https://example.com:2053`
- `webPath`: `/` for root-mounted panels, or a random path such as `/admin`
- Login: `{baseUrl}{webPath}/login`
- API base: `{baseUrl}{webPath}/panel/api`

For root-mounted panels, `webPath` may be empty or `/`; both should produce `/login` and `/panel/api/...`.

## Authentication

Endpoint:

- Method: `POST`
- Path: `/login`
- Body: form-urlencoded or JSON depending on panel/version; Khorshid uses form-urlencoded.
- Fields: `username`, `password`, `twoFactorCode`

Successful responses use the 3x-ui envelope:

```json
{
  "success": true,
  "msg": "You have successfully logged into your account.",
  "obj": null
}
```

Capture the `Set-Cookie` response header and send it as `Cookie` for API requests.

## Inbounds API

Base path: `/panel/api/inbounds`

Read endpoints:

- `GET /list`: get all inbounds
- `GET /get/:id`: get inbound by ID
- `GET /getClientTraffics/:email`: get client traffic by email
- `GET /getClientTrafficsById/:id`: get client traffic by inbound ID
- `POST /clientIps/:email`: get client IP addresses
- `POST /onlines`: get currently online clients
- `POST /lastOnline`: get last-online status

Write endpoints:

- `POST /add`: add inbound
- `POST /del/:id`: delete inbound by ID
- `POST /update/:id`: update inbound by ID
- `POST /clearClientIps/:email`: clear client IP addresses
- `POST /addClient`: add client to inbound
- `POST /:id/delClient/:clientId`: delete client by client ID
- `POST /updateClient/:clientId`: update client by client ID
- `POST /:id/resetClientTraffic/:email`: reset one client's traffic
- `POST /resetAllTraffics`: reset all inbound traffic
- `POST /resetAllClientTraffics/:id`: reset all clients in one inbound
- `POST /delDepletedClients/:id`: delete depleted clients in inbound; `-1` means all
- `POST /import`: import inbound configuration
- `POST /updateClientTraffic/:email`: update specific client traffic
- `POST /{id}/delClientByEmail/{email}`: delete client by email

Client ID mapping:

- VMess/VLESS: `client.id`
- Trojan: `client.password`
- Shadowsocks: `client.email`

## Server API

Base path: `/panel/api/server`

Read endpoints:

- `GET /status`: get server status
- `GET /getXrayVersion`: get available Xray versions
- `GET /getConfigJson`: download current Xray config JSON
- `GET /getDb`: download database file
- `GET /getNewUUID`: generate UUID
- `GET /getNewX25519Cert`: generate X25519 certificate
- `GET /getNewmldsa65`: generate ML-DSA-65 certificate
- `GET /getNewmlkem768`: generate ML-KEM-768 key pair
- `GET /getNewVlessEnc`: generate VLESS encryption keys

Write/control endpoints:

- `POST /stopXrayService`: stop Xray
- `POST /restartXrayService`: restart Xray
- `POST /installXray/:version`: install/update Xray
- `POST /updateGeofile`: update GeoIP/GeoSite files
- `POST /updateGeofile/:fileName`: update one geo file
- `POST /logs/:count`: get system logs
- `POST /xraylogs/:count`: get Xray logs
- `POST /importDB`: import database
- `POST /getNewEchCert`: generate ECH certificate; requires SNI

## Reverse Proxy Notes

Nginx panel reverse proxy usually forwards `/` to the panel port and must preserve upgrade headers, host, real IP, range headers, and forwarded proto. The panel URL setting should end with `/`.

Subscriptions often use a separate `/sub` location and port. The panel's subscription URI path must match the reverse proxy route.

## Operational Notes

- 3x-ui also documents SSL setup through ACME, Certbot, and Cloudflare.
- Environment variables include `XUI_LOG_LEVEL`, `XUI_DEBUG`, `XUI_BIN_FOLDER`, `XUI_DB_FOLDER`, `XUI_LOG_FOLDER`, and `XUI_ENABLE_FAIL2BAN`.
- Fail2Ban/IP limit setup depends on 3x-ui version and access log configuration.
- GeoIP/GeoSite files can be updated through the panel; custom DAT files use `ext:` routing references.
