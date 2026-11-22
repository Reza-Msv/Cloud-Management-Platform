import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Extract locale prefix from pathname if present (e.g., /en/login, /fa/login or /login)
  const segments = pathname.split("/").filter(Boolean);
  const isLocaleInPath = segments.length > 0 && routing.locales.includes(segments[0] as any);
  const routePath = isLocaleInPath ? `/${segments.slice(1).join("/")}` : pathname;
  const currentLocale = isLocaleInPath ? segments[0] : routing.defaultLocale;

  // Check authentication session cookie
  const sessionCookie = request.cookies.get("sessionid")?.value;
  const isAuthenticated = Boolean(sessionCookie && sessionCookie.trim() !== "");

  // If user is already authenticated and visits /login, redirect to /dashboard
  if (routePath === "/login" && isAuthenticated) {
    const dashboardUrl = new URL(`/${currentLocale}/dashboard`, request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return intlMiddleware(request);
}

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
