import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "charles-platform-dev-secret"
);

const publicPaths = ["/", "/login", "/register", "/forgot-password"];
const authPaths = ["/login", "/register", "/forgot-password"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = publicPaths.some(
    (p) => pathname === p || pathname.startsWith("/api/auth")
  );
  const isAuthPage = authPaths.includes(pathname);

  const token = request.cookies.get("charles_session")?.value;
  let session: { role?: string } | null = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, SECRET);
      session = payload as { role?: string };
    } catch {
      session = null;
    }
  }

  if (session && isAuthPage) {
    const role = session.role;
    const dest =
      role === "ADMIN"
        ? "/dashboard/admin"
        : role === "SALES"
          ? "/dashboard/sales"
          : "/dashboard/client";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  if (!session && !isPublic) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (session && pathname.startsWith("/dashboard/admin") && session.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard/client", request.url));
  }

  if (session && pathname.startsWith("/dashboard/sales") && session.role !== "SALES" && session.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard/client", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
