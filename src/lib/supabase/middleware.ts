import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { roleDashboardPath } from "@/lib/auth";
import type { Role } from "@/lib/types";

const publicPaths = ["/", "/login", "/register", "/forgot-password"];
const authPaths = ["/login", "/register", "/forgot-password"];

function createAdminForMiddleware() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
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
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
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
  } = await supabase.auth.getUser();

  if (user && isAuthPage) {
    const role = (await getUserRole(user.email!)) ?? "CLIENT";
    const redirect = NextResponse.redirect(
      new URL(roleDashboardPath(role), request.url)
    );
    copyCookies(supabaseResponse, redirect);
    return redirect;
  }

  if (user && pathname.startsWith("/dashboard/admin")) {
    const role = await getUserRole(user.email!);
    if (role && role !== "ADMIN") {
      const redirect = NextResponse.redirect(
        new URL(roleDashboardPath(role), request.url)
      );
      copyCookies(supabaseResponse, redirect);
      return redirect;
    }
  }

  if (!user && !isPublic) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    const redirect = NextResponse.redirect(loginUrl);
    copyCookies(supabaseResponse, redirect);
    return redirect;
  }

  return supabaseResponse;
}
