import { NextResponse, type NextRequest } from "next/server";

/** Must match API `ACCESS_COOKIE_NAME` (elloot-api/src/lib/auth-cookie.ts). */
const ACCESS_COOKIE = "elloot_at";
/** Must match `SESSION_HINT_COOKIE` — API JWT is on another host (Vercel ↔ Square Cloud). */
const SESSION_HINT_COOKIE = "elloot_session";

const PROTECTED_PREFIXES = ["/dashboard", "/sell", "/orders"] as const;
const isProd = process.env.NODE_ENV === "production";

const apiUrl =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
  "http://localhost:5000";

function apiOrigin(): string {
  try {
    return new URL(apiUrl).origin;
  } catch {
    return "http://localhost:5000";
  }
}

function wsOrigin(): string {
  try {
    const u = new URL(apiUrl);
    u.protocol = u.protocol === "https:" ? "wss:" : "ws:";
    return u.origin;
  } catch {
    return "";
  }
}

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isAuthPage(pathname: string): boolean {
  return (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password"
  );
}

function safeInternalNext(value: string | null): string {
  if (!value) return "/";
  if (/[\\]/.test(value) || /%5c/i.test(value)) return "/";
  if (!value.startsWith("/")) return "/";
  if (value.startsWith("//")) return "/";
  if (value.includes("://")) return "/";
  if (
    value.startsWith("/login") ||
    value.startsWith("/register") ||
    value.startsWith("/forgot-password") ||
    value.startsWith("/reset-password") ||
    value.startsWith("/auth/")
  ) {
    return "/";
  }
  return value;
}

function buildCsp(nonce: string): string {
  const marketingScriptHosts = [
    "https://connect.facebook.net",
    "https://www.facebook.com",
    "https://analytics.tiktok.com",
    "https://www.googletagmanager.com",
    "https://www.google-analytics.com",
    "https://googleads.g.doubleclick.net",
    "https://www.googleadservices.com",
  ].join(" ");

  const marketingConnectHosts = [
    "https://www.facebook.com",
    "https://connect.facebook.net",
    "https://analytics.tiktok.com",
    "https://www.googletagmanager.com",
    "https://www.google-analytics.com",
    "https://region1.google-analytics.com",
    "https://googleads.g.doubleclick.net",
    "https://www.google.com",
    "https://www.googleadservices.com",
  ].join(" ");

  // Prod: nonce only (no unsafe-inline/eval for scripts). Dev: keep eval for Next HMR.
  const scriptSrc = isProd
    ? `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ${marketingScriptHosts}`
    : `script-src 'self' 'nonce-${nonce}' 'unsafe-eval' ${marketingScriptHosts}`;

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https: http://localhost:* http://127.0.0.1:*",
    "font-src 'self' data:",
    `connect-src 'self' ${apiOrigin()} ${wsOrigin()} ${marketingConnectHosts}`.trim(),
    "frame-src 'self' https://www.googletagmanager.com https://www.facebook.com",
    "worker-src 'self' blob:",
    ...(isProd ? ["upgrade-insecure-requests"] : []),
  ]
    .join("; ")
    .replace(/\s+/g, " ")
    .trim();
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  if (isProd && (pathname === "/ui" || pathname.startsWith("/ui/"))) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const token = request.cookies.get(ACCESS_COOKIE)?.value;
  const hint = request.cookies.get(SESSION_HINT_COOKIE)?.value;
  const hasSession = Boolean((token && token.length > 10) || hint === "1");

  if (isProtectedPath(pathname) && !hasSession) {
    const login = new URL("/login", request.url);
    const next = `${pathname}${request.nextUrl.search}`;
    login.searchParams.set("next", next);
    return NextResponse.redirect(login);
  }

  if (isAuthPage(pathname) && hasSession) {
    const dest = safeInternalNext(request.nextUrl.searchParams.get("next"));
    return NextResponse.redirect(new URL(dest, request.url));
  }

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set("Content-Security-Policy", buildCsp(nonce));
  response.headers.set("x-nonce", nonce);
  return response;
}

export const config = {
  matcher: [
    /*
     * Apply CSP nonce to all app routes; skip static assets.
     */
    {
      source:
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
    },
  ],
};
