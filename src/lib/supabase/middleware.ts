import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { roleDashboardPath, safeRedirectPath } from "@/lib/auth";
import type { Role } from "@/lib/types";
import { getSupabaseEnvDiagnostics, supabaseCookieDefaults } from "./env";

const publicPaths = ["/", "/login", "/register", "/forgot-password"];
const authPaths = ["/login", "/register", "/forgot-password"];

function createAdminForMiddleware() {
  const diag = getSupabaseEnvDiagnostics();
  if (!diag.configured || !diag.hasServiceRoleKey) return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!.trim();
  return createClient(url, key, {
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

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach(({ name, value, ...options }) => {
    to.cookies.set(name, value, options);
  });
}

export async function updateSession(request: NextRequest) {
  const envDiag = getSupabaseEnvDiagnostics();
  if (!envDiag.configured) {
    console.error("[auth:middleware] Supabase env not configured on this deployment", envDiag);
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.trim(),
    {
      cookieOptions: supabaseCookieDefaults,
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
          if (headers) {
            Object.entries(headers).forEach(([key, value]) => {
              supabaseResponse.headers.set(key, value);
            });
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

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  const role = user?.email ? await getUserRole(user.email) : null;

  console.log("[auth:middleware]", {
    pathname,
    hasUser: !!user,
    email: user?.email ?? null,
    role,
    authError: authError?.message ?? null,
    from: request.nextUrl.searchParams.get("from"),
    env: envDiag,
    incomingAuthCookies: request.cookies
      .getAll()
      .map((c) => c.name)
      .filter((n) => n.includes("sb-")),
  });

  if (user && isAuthPage) {
    const from = request.nextUrl.searchParams.get("from");
    const destination = safeRedirectPath(from, roleDashboardPath(role ?? "CLIENT"));
    const redirect = NextResponse.redirect(new URL(destination, request.url));
    copyCookies(supabaseResponse, redirect);
    return redirect;
  }

  if (user && pathname.startsWith("/dashboard/admin")) {
    if (role && role !== "ADMIN") {
      const redirect = NextResponse.redirect(
        new URL(roleDashboardPath(role), request.url)
      );
      copyCookies(supabaseResponse, redirect);
      return redirect;
    }
    if (role === null) {
      console.warn("[auth:middleware] ADMIN route but no DB role for", user.email);
    }
  }

  if (!user && !isPublic) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    // Do NOT copy middleware cookies here — failed getUser() may emit cookie clears
    // that would wipe a valid session set by /api/auth/login on the previous response.
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}
