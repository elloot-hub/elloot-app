import { NextResponse, type NextRequest } from "next/server";

/** Must match API `ACCESS_COOKIE_NAME` (elloot-api/src/lib/auth-cookie.ts). */
const ACCESS_COOKIE = "elloot_at";
/** Must match `SESSION_HINT_COOKIE` — API JWT is on another host (Vercel ↔ Square Cloud). */
const SESSION_HINT_COOKIE = "elloot_session";

const PROTECTED_PREFIXES = ["/dashboard", "/sell", "/orders"] as const;

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isAuthPage(pathname: string): boolean {
  return (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password"
  );
}

function safeInternalNext(value: string | null): string {
  if (!value) return "/dashboard";
  if (/[\\]/.test(value) || /%5c/i.test(value)) return "/dashboard";
  if (!value.startsWith("/")) return "/dashboard";
  if (value.startsWith("//")) return "/dashboard";
  if (value.includes("://")) return "/dashboard";
  if (value.startsWith("/login") || value.startsWith("/register")) {
    return "/dashboard";
  }
  return value;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
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

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/sell",
    "/sell/:path*",
    "/orders",
    "/orders/:path*",
    "/login",
    "/register",
    "/forgot-password",
  ],
};
