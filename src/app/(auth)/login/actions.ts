"use server";

import { redirect } from "next/navigation";
import { createAdminClient, createAuthServerClient } from "@/lib/supabase/server";
import { roleDashboardPath } from "@/lib/auth";
import type { Role } from "@/lib/types";

export type LoginState = { error?: string };

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const from = String(formData.get("from") ?? "").trim();

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  const authClient = await createAuthServerClient();
  const { error: signInError } = await authClient.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    return { error: "Invalid email or password" };
  }

  const { data: user } = await createAdminClient()
    .from("User")
    .select("role")
    .eq("email", email)
    .maybeSingle();

  const role = (user?.role as Role) ?? "CLIENT";
  const destination =
    from && from.startsWith("/") && !from.startsWith("//")
      ? from
      : roleDashboardPath(role);

  redirect(destination);
}
