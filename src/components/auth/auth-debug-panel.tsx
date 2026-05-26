import { cookies } from "next/headers";
import { getSession } from "@/lib/auth";
import { getSupabaseEnvDiagnostics } from "@/lib/supabase/env";
import { createAdminClient, createAuthServerClient } from "@/lib/supabase/server";

export async function AuthDebugPanel({ from }: { from?: string }) {
  const env = getSupabaseEnvDiagnostics();
  const cookieStore = await cookies();
  const authCookies = cookieStore.getAll().filter((c) => c.name.includes("sb-"));

  let authUserEmail: string | null = null;
  let authErrorMessage: string | null = null;
  let sessionRole: string | null = null;
  let dbRole: string | null = null;
  let cookieSessionEmail: string | null = null;

  if (env.configured) {
    try {
      const authClient = await createAuthServerClient();

      const {
        data: { session: cookieSession },
      } = await authClient.auth.getSession();
      cookieSessionEmail = cookieSession?.user?.email ?? null;

      const {
        data: { user: authUser },
        error: authError,
      } = await authClient.auth.getUser();
      authUserEmail = authUser?.email ?? null;
      authErrorMessage = authError?.message ?? null;

      const session = await getSession();
      sessionRole = session?.role ?? null;

      if (authUser?.email && env.hasServiceRoleKey) {
        const { data } = await createAdminClient()
          .from("User")
          .select("role")
          .eq("email", authUser.email)
          .maybeSingle();
        dbRole = data?.role ?? null;
      } else if (cookieSession?.user?.email && env.hasServiceRoleKey) {
        const { data } = await createAdminClient()
          .from("User")
          .select("role")
          .eq("email", cookieSession.user.email)
          .maybeSingle();
        dbRole = data?.role ?? null;
      }
    } catch (e) {
      authErrorMessage = e instanceof Error ? e.message : "Unknown auth error";
    }
  } else {
    authErrorMessage = "Supabase env vars missing on this server";
  }

  return (
    <div className="mt-4 rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950 space-y-1">
      <p className="font-semibold">Session debug</p>
      <p>
        <span className="text-amber-700">Deployment:</span>{" "}
        {env.onVercel ? `Vercel (${env.vercelEnv ?? "unknown"})` : "local"} / {env.nodeEnv}
      </p>
      <p>
        <span className="text-amber-700">Supabase project:</span> {env.projectRef ?? "MISSING"}
      </p>
      <p>
        <span className="text-amber-700">Cookie session (local read):</span>{" "}
        {cookieSessionEmail ?? "none"}
      </p>
      <p>
        <span className="text-amber-700">Supabase user (getUser):</span> {authUserEmail ?? "none"}
        {authErrorMessage ? ` (${authErrorMessage})` : ""}
      </p>
      <p>
        <span className="text-amber-700">App session role:</span> {sessionRole ?? "none"}
      </p>
      <p>
        <span className="text-amber-700">DB role:</span> {dbRole ?? "none"}
      </p>
      <p>
        <span className="text-amber-700">Return URL (from):</span> {from ?? "none"}
      </p>
      <p>
        <span className="text-amber-700">Auth cookies:</span>{" "}
        {authCookies.length
          ? authCookies.map((c) => `${c.name} (${c.value.length} chars)`).join(", ")
          : "none"}
      </p>
      {cookieSessionEmail && !authUserEmail ? (
        <p className="text-red-700 pt-1">
          Cookie session exists but getUser failed — usually an expired access token after a
          background tab. The auth listener should refresh on tab focus after this deploy.
        </p>
      ) : null}
      {authCookies.length > 0 && !cookieSessionEmail ? (
        <p className="text-red-700 pt-1">
          Auth cookie present but unreadable (corrupted chunks). Sign out and sign in again.
        </p>
      ) : null}
    </div>
  );
}
