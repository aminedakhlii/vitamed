import { NextResponse } from "next/server";
import { createAdminClient, createAuthServerClient } from "@/lib/supabase/server";
import { roleDashboardPath } from "@/lib/auth";
import { nowIso } from "@/lib/id";
import type { Role } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Lightweight endpoint called after browser-side signInWithPassword().
 * The browser has already set the auth cookie; this reads it, ensures a
 * User profile row exists (auto-provisions if needed), and returns the
 * user's role + the correct dashboard redirect path.
 */
export async function GET() {
  try {
    const authClient = await createAuthServerClient();
    const {
      data: { session },
    } = await authClient.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ role: null, redirect: "/login" }, { status: 401 });
    }

    const authUser = session.user;
    const email = authUser.email!;
    const admin = createAdminClient();

    let { data: userRow } = await admin
      .from("User")
      .select("id, role")
      .eq("email", email)
      .maybeSingle();

    if (!userRow) {
      const meta = authUser.user_metadata ?? {};
      const now = nowIso();
      const { data: created, error: createErr } = await admin
        .from("User")
        .insert({
          id: authUser.id,
          email,
          passwordHash: "SUPABASE_AUTH",
          name: (meta.name as string) || email.split("@")[0],
          role: (meta.role as Role) || "CLIENT",
          company: (meta.company as string) ?? null,
          country: (meta.country as string) ?? null,
          language: (meta.language as string) || "en",
          phone: null,
          createdAt: now,
          updatedAt: now,
        })
        .select("id, role")
        .single();

      if (createErr) {
        console.error("[auth:role] failed to auto-provision User row:", createErr.message);
      } else {
        userRow = created;
      }
    }

    const role = (userRow?.role as Role) ?? "CLIENT";
    return NextResponse.json({ role, redirect: roleDashboardPath(role) });
  } catch (err) {
    console.error("[auth:role] unexpected error:", err);
    return NextResponse.json({ role: "CLIENT", redirect: "/dashboard/client" });
  }
}
