import { cookies } from "next/headers";
import { getSession } from "@/lib/auth";
import { getSupabaseEnvDiagnostics } from "@/lib/supabase/env";
import { createAdminClient, createAuthServerClient } from "@/lib/supabase/server";

export async function AuthDebugPanel({ from }: { from?: string }) {
  const env = getSupabaseEnvDiagnostics();
  const cookieStore = await cookies();
  const authCookieNames = cookieStore
    .getAll()
    .map((c) => c.name)
    .filter((n) => n.includes("sb-") || n.includes("supabase"));

  let authUserEmail: string | null = null;
  let authErrorMessage: string | null = null;
  let sessionRole: string | null = null;
  let dbRole: string | null = null;

  if (env.configured) {
    try {
      const authClient = await createAuthServerClient();
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
        <span className="text-amber-700">Supabase project:</span>{" "}
        {env.projectRef ?? "MISSING — set NEXT_PUBLIC_SUPABASE_URL on Vercel"}
      </p>
      <p>
        <span className="text-amber-700">Env vars:</span> URL={env.hasUrl ? "ok" : "MISSING"},
        anon={env.hasAnonKey ? "ok" : "MISSING"}, service=
        {env.hasServiceRoleKey ? "ok" : "MISSING"}
      </p>
      <p>
        <span className="text-amber-700">Supabase user:</span> {authUserEmail ?? "none"}
        {authErrorMessage ? ` (${authErrorMessage})` : ""}
      </p>
      <p>
        <span className="text-amber-700">App session role:</span> {sessionRole ?? "none"}
      </p>
      <p>
        <span className="text-amber-700">DB role (by email):</span> {dbRole ?? "none"}
      </p>
      <p>
        <span className="text-amber-700">Return URL (from):</span> {from ?? "none"}
      </p>
      <p>
        <span className="text-amber-700">Auth cookies in browser:</span>{" "}
        {authCookieNames.length ? authCookieNames.join(", ") : "none"}
      </p>
      {!env.configured ? (
        <p className="text-red-700 font-medium pt-1">
          .env is not deployed to Vercel. Copy all Supabase keys from .env into Vercel → Settings →
          Environment Variables (Production + Preview), then Redeploy.
        </p>
      ) : null}
      {env.configured && authCookieNames.length === 0 ? (
        <p className="text-red-700 pt-1">
          No auth cookies reached the server. After sign-in, if this stays empty, login cookies are
          not being set or were cleared — check Vercel logs for [auth:login] cookieCount.
        </p>
      ) : null}
    </div>
  );
}
