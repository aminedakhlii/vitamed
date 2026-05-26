/**
 * Server-side sign-out (kept for compatibility / direct URL access).
 * The web UI uses browser-side supabase.auth.signOut() via the sidebar.
 */
import { NextResponse } from "next/server";
import { createAuthServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function signOutAndRedirect(request: Request) {
  const origin = new URL(request.url).origin;
  const response = NextResponse.redirect(new URL("/login", origin));

  try {
    const authClient = await createAuthServerClient();
    await authClient.auth.signOut();
  } catch {
    // Best-effort
  }

  // Clear all sb- cookies by setting them to expired.
  const { cookies: reqCookies } = await import("next/headers");
  const cookieStore = await reqCookies();
  const sbCookies = cookieStore.getAll().filter((c) => c.name.startsWith("sb-"));
  for (const c of sbCookies) {
    response.cookies.set(c.name, "", { maxAge: 0, path: "/" });
  }

  return response;
}

export async function GET(request: Request) {
  return signOutAndRedirect(request);
}

export async function POST(request: Request) {
  return signOutAndRedirect(request);
}
