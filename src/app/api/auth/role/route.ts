import { NextResponse } from "next/server";
import { createAdminClient, createAuthServerClient } from "@/lib/supabase/server";
import { roleDashboardPath } from "@/lib/auth";
import type { Role } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Lightweight endpoint called after browser-side signInWithPassword().
 * The browser has already set the auth cookie; this reads it and returns
 * the user's role + the correct dashboard redirect path.
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

    const email = session.user.email!;

    const { data: userRow } = await createAdminClient()
      .from("User")
      .select("role")
      .eq("email", email)
      .maybeSingle();

    const role = (userRow?.role as Role) ?? "CLIENT";

    return NextResponse.json({ role, redirect: roleDashboardPath(role) });
  } catch {
    return NextResponse.json({ role: "CLIENT", redirect: "/dashboard/client" });
  }
}
