import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import {
  applyAuthCookies,
  createSupabaseRouteHandlerClient,
  type AuthCookieEntry,
} from "@/lib/supabase/route-handler";
import { getSupabaseEnvDiagnostics } from "@/lib/supabase/env";
import { roleDashboardPath, safeRedirectPath } from "@/lib/auth";
import { nowIso } from "@/lib/id";
import type { Role } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function loginErrorRedirect(request: Request, message: string, from?: string) {
  const url = new URL("/login", request.url);
  url.searchParams.set("error", message);
  if (from) url.searchParams.set("from", from);
  return NextResponse.redirect(url, { status: 303 });
}

export async function POST(request: Request) {
  const envDiag = getSupabaseEnvDiagnostics();
  if (!envDiag.configured) {
    const msg = "Server misconfiguration: Supabase env vars missing.";
    if (request.headers.get("content-type")?.includes("application/json")) {
      return NextResponse.json({ error: msg }, { status: 500 });
    }
    return loginErrorRedirect(request, msg);
  }

  const contentType = request.headers.get("content-type") ?? "";
  let email: string;
  let password: string;
  let from = "";

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
    const formData = await request.formData();
    email = String(formData.get("email") ?? "").trim();
    password = String(formData.get("password") ?? "");
    from = String(formData.get("from") ?? "");
  }

  if (!email || !password) {
    if (contentType.includes("application/json")) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }
    return loginErrorRedirect(request, "Email and password are required", from);
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
    console.error("[auth:login] signIn failed", { email, message: signInError.message });
    if (contentType.includes("application/json")) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }
    return loginErrorRedirect(request, "Invalid email or password", from);
  }

  if (!signInData.session || authCookies.length === 0) {
    const msg = "Login succeeded but session cookies were not written.";
    console.error("[auth:login] no session cookies", {
      email,
      hasSession: !!signInData.session,
      cookieCount: authCookies.length,
    });
    if (contentType.includes("application/json")) {
      return NextResponse.json({ error: msg }, { status: 500 });
    }
    return loginErrorRedirect(request, msg, from);
  }

  const admin = createAdminClient();
  let { data: user } = await admin
    .from("User")
    .select("id, email, name, role, language, country")
    .eq("email", email)
    .maybeSingle();

  // ── Auto-provision ──────────────────────────────────────────────────────────
  // If the user exists in Supabase Auth but NOT in the public.User table (e.g.
  // added manually via the Supabase Dashboard), create a minimal profile row so
  // they can sign in. Role defaults to CLIENT; an admin can promote it later.
  if (!user && signInData.user) {
    const authUser = signInData.user;
    const meta = authUser.user_metadata ?? {};
    const now = nowIso();
    const newUser = {
      id: authUser.id,
      email: authUser.email ?? email,
      passwordHash: null,
      name: (meta.name as string) || (authUser.email ?? email).split("@")[0],
      role: (meta.role as Role) || "CLIENT",
      company: (meta.company as string) ?? null,
      country: (meta.country as string) ?? null,
      language: (meta.language as string) || "en",
      phone: null,
      createdAt: now,
      updatedAt: now,
    };

    const { data: created, error: createError } = await admin
      .from("User")
      .insert(newUser)
      .select("id, email, name, role, language, country")
      .single();

    if (createError) {
      console.error("[auth:login] failed to auto-create User row", createError.message);
    } else {
      user = created;
      console.log("[auth:login] auto-created User row for", email, "role=", newUser.role);
    }
  }

  if (!user) {
    if (contentType.includes("application/json")) {
      return NextResponse.json({ error: "User profile could not be created." }, { status: 400 });
    }
    return loginErrorRedirect(request, "User profile could not be created.", from);
  }

  const role = user.role as Role;
  const destination = safeRedirectPath(from, roleDashboardPath(role));

  console.log("[auth:login] success", {
    email,
    role,
    destination,
    cookieCount: authCookies.length,
    cookieNames: authCookies.map((c) => c.name),
  });

  if (contentType.includes("application/json")) {
    const jsonResponse = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role,
        language: user.language,
        country: user.country,
      },
      redirect: destination,
    });
    applyAuthCookies(jsonResponse, authCookies);
    return jsonResponse;
  }

  const redirectResponse = NextResponse.redirect(new URL(destination, request.url), {
    status: 303,
  });
  applyAuthCookies(redirectResponse, authCookies);
  return redirectResponse;
}
