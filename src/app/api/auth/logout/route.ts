import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  applyAuthCookies,
  createSupabaseRouteHandlerClient,
  type AuthCookieEntry,
} from "@/lib/supabase/route-handler";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function logout(request: Request) {
  const cookieStore = await cookies();
  const origin = new URL(request.url).origin;
  const authCookies: AuthCookieEntry[] = [];
  let response = NextResponse.redirect(new URL("/login", origin));

  const supabase = createSupabaseRouteHandlerClient(cookieStore, response, authCookies);
  await supabase.auth.signOut();
  applyAuthCookies(response, authCookies);
  return response;
}

export async function POST(request: Request) {
  return logout(request);
}

export async function GET(request: Request) {
  return logout(request);
}
