import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "swasthyagrid_intake_session";

function secretKey() {
  return new TextEncoder().encode(process.env.SESSION_SECRET ?? "");
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;

  let session: { role?: string } | null = null;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, secretKey());
      session = payload as { role?: string };
    } catch {
      session = null;
    }
  }

  const isAdminRoute = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isProtectedApi =
    pathname.startsWith("/api/facility") ||
    pathname.startsWith("/api/medicines") ||
    pathname.startsWith("/api/beds") ||
    pathname.startsWith("/api/doctors") ||
    pathname.startsWith("/api/footfall") ||
    isAdminRoute;

  if ((isDashboardRoute || isAdminRoute || isProtectedApi) && !session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAdminRoute && session && session.role !== "admin") {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isDashboardRoute && session && session.role !== "facility") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/api/facility/:path*",
    "/api/medicines/:path*",
    "/api/beds/:path*",
    "/api/doctors/:path*",
    "/api/footfall/:path*",
    "/api/admin/:path*",
  ],
};
