import { NextResponse } from "next/server";
import { verifyToken, COOKIE_NAME } from "@/lib/jwt";

const PUBLIC_PATHS = ["/login", "/register"];

export async function middleware(req) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const session = await verifyToken(token);

  // Logged-in users shouldn't see login/register.
  if (session && PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Public pages are open.
  if (PUBLIC_PATHS.includes(pathname)) return NextResponse.next();

  // Everything else requires a session.
  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // SuperAdmin-only area — except /admin/reports, which Admins may also view.
  if (pathname.startsWith("/admin") && session.role !== "superadmin") {
    const adminAllowed = pathname.startsWith("/admin/reports") && session.role === "admin";
    if (!adminAllowed) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  // Admin + SuperAdmin areas.
  const staffOnly = ["/results", "/search", "/people"];
  if (staffOnly.some((p) => pathname.startsWith(p)) &&
      !["admin", "superadmin"].includes(session.role)) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  // Run on app routes, skip static assets and Next internals.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
