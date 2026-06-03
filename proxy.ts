import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

/**
 * Protect the authenticated app area. Unauthenticated requests to /dashboard,
 * /cases, and /settings are redirected to /login. (Next.js 16 "proxy"
 * convention — formerly "middleware".)
 */
export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/cases") ||
    pathname.startsWith("/settings");

  if (isProtected && !req.auth) {
    const url = new URL("/login", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/cases/:path*", "/settings/:path*"],
};
