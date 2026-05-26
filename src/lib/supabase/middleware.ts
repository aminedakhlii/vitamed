import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { roleDashboardPath, safeRedirectPath } from "@/lib/auth";
import type { Role } from "@/lib/types";
import { getSupabaseEnvDiagnostics, supabaseCookieDefaults } from "./env";

const publicPaths = ["/", "/login", "/register", "/forgot-password"];
const authPaths = ["/login", "/register", "/forgot-password"];

function createAdminForMiddleware() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url.trim(), key.trim(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function getUserRole(email: string): Promise<Role | null> {
  const admin = createAdminForMiddleware();
  if (!admin) return null;
  const { data } = await admin
    .from("User")
    .select("role")
    .eq("email", email)
    .maybeSingle();
  return (data?.role as Role) ?? null;
}

function copyRefreshCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach(({ name, value, ...options }) => {
    to.cookies.set(name, value, options);
  });
}

export async function updateSession(request: NextRequest) {
  const envDiag = getSupabaseEnvDiagnostics();
  if (!envDiag.configured) {
    console.error("[middleware] Supabase env missing", envDiag);
    return NextResponse.next({ request });
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.trim(),
    {
      cookieEncoding: "base64url",
      cookieOptions: supabaseCookieDefaults,
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        // When the session is refreshed (access token rotated), write the new
        // cookies to BOTH the ongoing request (so SSR sees them) and the response
        // (so the browser stores them).
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          const updatedHeaders = new Headers(request.headers);
          updatedHeaders.set("x-pathname", request.nextUrl.pathname);
          supabaseResponse = NextResponse.next({ request: { headers: updatedHeaders } });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
          if (headers) {
            Object.entries(headers).forEach(([k, v]) => supabaseResponse.headers.set(k, v));
          }
        },
      },
    }
  );

  const { pathname } = request.nextUrl;
  const isPublic =
    publicPaths.some((p) => pathname === p) ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/auth/callback");
  const isAuthPage = authPaths.includes(pathname);

  // ─── Read the session from cookies (no network round-trip) ─────────────────
  // getSession() trusts the locally-stored JWT. This avoids Vercel network
  // timeouts and race conditions between parallel RSC requests. Token rotation
  // is handled client-side by SupabaseAuthListener.
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const user = session?.user ?? null;
  const role = user?.email ? await getUserRole(user.email) : null;

  console.log("[middleware]", {
    pathname,
    hasUser: !!user,
    email: user?.email ?? null,
    role,
    sbCookies: request.cookies
      .getAll()
      .filter((c) => c.name.includes("sb-"))
      .map((c) => c.name),
  });

  if (user && isAuthPage) {
    const from = request.nextUrl.searchParams.get("from");
    const dest = safeRedirectPath(from, roleDashboardPath(role ?? "CLIENT"));
    const redirect = NextResponse.redirect(new URL(dest, request.url));
    copyRefreshCookies(supabaseResponse, redirect);
    return redirect;
  }

  if (user && pathname.startsWith("/dashboard/admin") && role && role !== "ADMIN") {
    const redirect = NextResponse.redirect(new URL(roleDashboardPath(role), request.url));
    copyRefreshCookies(supabaseResponse, redirect);
    return redirect;
  }

  if (!user && !isPublic) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    const redirect = NextResponse.redirect(loginUrl);
    // Don't copy supabaseResponse cookies here — getSession() might emit
    // clear-cookie calls that would wipe a valid session.
    return redirect;
  }

  return supabaseResponse;
}
