# Security headers

This document records the HTTP security headers set in `next.config.ts` and the
reasoning behind each one. Referenced from `next.config.ts` comments.

## What is applied

Every response — pages, API routes and static assets under `/_next/*` — gets the
headers below, via `headers()` in `next.config.ts` with `source: "/:path*"`.

| Header | Value | Why |
|---|---|---|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Pins the origin to HTTPS for two years, preventing protocol-downgrade and cookie-hijacking attacks. Ignored by browsers on plain HTTP, so harmless locally. Requires HTTPS in production to have any effect. |
| `X-Content-Type-Options` | `nosniff` | Stops the browser from MIME-sniffing a response into a type we did not declare (e.g. treating an uploaded file as a script). |
| `X-Frame-Options` | `DENY` (production only) | Blocks clickjacking for browsers that do not implement `frame-ancestors`. See the development exception below. |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Prevents internal paths and patient identifiers from leaking through the `Referer` header to third parties. |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=(), usb=()` | Denies access to powerful browser APIs the app does not use. Revisit when features need them (e.g. document capture). |
| `Cross-Origin-Opener-Policy` | `same-origin` | Isolates the browsing context from cross-origin windows. |
| `Cross-Origin-Resource-Policy` | `same-origin` | Prevents other origins from embedding our resources. |
| `X-DNS-Prefetch-Control` | `on` | Allows DNS prefetching for performance; no security impact on its own. |
| `X-Powered-By` | removed (`poweredByHeader: false`) | Avoids advertising the framework and version to attackers. |

## Content Security Policy: report-only

`Content-Security-Policy-Report-Only` is sent with:

```
default-src 'self';
script-src 'self' 'unsafe-inline';
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob:;
font-src 'self' data:;
connect-src 'self';
object-src 'none';
base-uri 'self';
form-action 'self';
frame-ancestors 'none';
upgrade-insecure-requests
```

**Why not enforce it yet?** The App Router injects inline bootstrap scripts
(`self.__next_f.push(...)`) for hydration. Enforcing `script-src` without a
per-request nonce breaks rendering. A nonce requires `middleware.ts`, which
forces every route to render dynamically — work that belongs with the
authentication layer (`SEC-01`, phase 1). Until then the policy only reports
violations, so we collect real data without risking a white screen in a clinical
environment.

`'unsafe-inline'` in `script-src` is the temporary concession that a nonce will
remove. It is deliberately visible here so it does not become permanent
invisibility.

## Development exception for framing

`X-Frame-Options: DENY` is **not** sent when `NODE_ENV !== "production"`.

Reason: development tooling and preview environments embed the app in an
iframe. A cross-origin `DENY`/`SAMEORIGIN` would render a blank preview and make
local UI work impossible. Production keeps `DENY`, and the report-only CSP still
reports `frame-ancestors` on every environment.

## Not covered here

- **No CSP report endpoint yet.** Violations appear in the browser console only.
  Adding `report-to`/`report-uri` needs a collection route; deferred to phase 1.
- **No `rate limiting`, authentication or authorization** — see `SEC-01`.
- **No HTTPS termination config.** HSTS assumes TLS is terminated in front of
  the app (reverse proxy / load balancer / Vercel).

## Verifying

```bash
npm run build && npm start -- -p 3100 &
curl -sSI http://127.0.0.1:3100/ | grep -iE 'strict-transport|content-security|x-frame|referrer|permissions|origin-opener|origin-resource|powered-by'
```

Expected: the headers above are present, `X-Frame-Options: DENY` appears in a
production build, and `X-Powered-By` is absent.
