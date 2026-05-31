/**
 * Legacy server-side login — kept for API clients (e.g. mobile, scripts).
 * The web UI now uses browser-side Supabase auth via src/components/auth/login-form.tsx.
 */
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import {
  applyAuthCookies,
  createSupabaseRouteHandlerClient,
  type AuthCookieEntry,
} from "@/lib/supabase/route-handler";
import { roleDashboardPath, safeRedirectPath } from "@/lib/auth";
import { nowIso } from "@/lib/id";
import type { Role } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  let email: string;
  let password: string;
  let from = "";

  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      const body = await request.json();
      email = String(body.email ?? "").trim();
      password = String(body.password ?? "");
      from = String(body.from ?? "");
    } catch {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
  } else {
    const fd = await request.formData();
    email = String(fd.get("email") ?? "").trim();
    password = String(fd.get("password") ?? "");
    from = String(fd.get("from") ?? "");
  }

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const authCookies: AuthCookieEntry[] = [];
  const signInResponse = NextResponse.json({ ok: true });
  const supabase = createSupabaseRouteHandlerClient(cookieStore, signInResponse, authCookies);

  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const admin = createAdminClient();
  let { data: user } = await admin
    .from("User")
    .select("id, email, name, role, language, country")
    .eq("email", email)
    .maybeSingle();

  if (!user && signInData.user) {
    const authUser = signInData.user;
    const meta = authUser.user_metadata ?? {};
    const now = nowIso();
    const { data: created } = await admin
      .from("User")
      .insert({
        id: authUser.id,
        email: authUser.email ?? email,
        passwordHash: "SUPABASE_AUTH",
        name: (meta.name as string) || (authUser.email ?? email).split("@")[0],
        role: (meta.role as Role) || "CLIENT",
        company: (meta.company as string) ?? null,
        country: (meta.country as string) ?? null,
        language: (meta.language as string) || "en",
        phone: null,
        createdAt: now,
        updatedAt: now,
      })
      .select("id, email, name, role, language, country")
      .single();
    user = created;
  }

  if (!user) {
    return NextResponse.json({ error: "User profile could not be created." }, { status: 400 });
  }

  const role = user.role as Role;
  const destination = safeRedirectPath(from, roleDashboardPath(role));

  const response = NextResponse.json({ user, redirect: destination });
  applyAuthCookies(response, authCookies);
  return response;
}
