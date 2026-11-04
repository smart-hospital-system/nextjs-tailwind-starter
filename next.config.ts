import type { NextConfig } from "next";

/**
 * Security headers applied to every response.
 *
 * HSTS is only meaningful over HTTPS; browsers ignore it on plain HTTP, so it
 * is safe to send in development too.
 */
const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

/**
 * Framing protection is production-only on purpose.
 *
 * `X-Frame-Options: DENY` would also block the app from being embedded by
 * development tooling and preview environments that render the app in an
 * iframe. Production traffic gets the strict value; local development keeps
 * the tooling usable. `frame-ancestors` below is reported either way.
 */
const framingHeaders =
  process.env.NODE_ENV === "production"
    ? [{ key: "X-Frame-Options", value: "DENY" }]
    : [];

/**
 * Content Security Policy, reporting mode only.
 *
 * App Router injects inline bootstrap scripts for hydration, so enforcing a
 * CSP without a per-request nonce breaks the page. A nonce requires
 * `middleware.ts` and forces every route to render dynamically, which is
 * planned together with authentication (SEC-01, phase 1). Until then the
 * policy runs in `Content-Security-Policy-Report-Only`: violations are
 * reported by the browser without blocking anything, which gives us the data
 * needed to tighten the policy before enforcing it.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  // Do not advertise the framework via the X-Powered-By header.
  poweredByHeader: false,
  // Never ship source maps to the browser.
  productionBrowserSourceMaps: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          ...securityHeaders,
          ...framingHeaders,
          {
            key: "Content-Security-Policy-Report-Only",
            value: contentSecurityPolicy,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
