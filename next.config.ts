import type { NextConfig } from "next";

const apiUrl =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
  "http://localhost:5000";

function toWsOrigin(httpUrl: string) {
  try {
    const u = new URL(httpUrl);
    u.protocol = u.protocol === "https:" ? "wss:" : "ws:";
    return u.origin;
  } catch {
    return "";
  }
}

const apiOrigin = (() => {
  try {
    return new URL(apiUrl).origin;
  } catch {
    return "http://localhost:5000";
  }
})();

const wsOrigin = toWsOrigin(apiUrl);

const isProd = process.env.NODE_ENV === "production";

/**
 * Baseline CSP for the marketplace app.
 * Allows API + Socket.IO, media/images from https, and Next.js inline styles.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https: http://localhost:* http://127.0.0.1:*",
  "font-src 'self' data:",
  `connect-src 'self' ${apiOrigin} ${wsOrigin}`.trim(),
  "worker-src 'self' blob:",
  ...(isProd ? ["upgrade-insecure-requests"] : []),
]
  .join("; ")
  .replace(/\s+/g, " ")
  .trim();

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
