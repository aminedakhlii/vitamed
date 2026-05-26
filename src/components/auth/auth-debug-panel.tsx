import { cookies } from "next/headers";
import { getSupabaseEnvDiagnostics } from "@/lib/supabase/env";
import { createAuthServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function AuthDebugPanel({ from }: { from?: string }) {
  const env = getSupabaseEnvDiagnostics();
  const cookieStore = await cookies();
  const sbCookies = cookieStore
    .getAll()
    .filter((c) => c.name.includes("sb-"))
    .map((c) => ({ name: c.name, len: c.value.length }));

  let cookieSessionEmail: string | null = null;
  let getSessionError: string | null = null;
  let dbRole: string | null = null;

  if (env.configured) {
    try {
      const client = await createAuthServerClient();

      const { data: sessionData, error: sessionError } =
        await client.auth.getSession();

      if (sessionError) {
        getSessionError = sessionError.message;
      } else {
        cookieSessionEmail = sessionData.session?.user?.email ?? null;
      }

      if (cookieSessionEmail && env.hasServiceRoleKey) {
        const { data } = await createAdminClient()
          .from("User")
          .select("role")
          .eq("email", cookieSessionEmail)
          .maybeSingle();
        dbRole = data?.role ?? null;
      }
    } catch (e) {
      getSessionError = e instanceof Error ? e.message : "Unknown error";
    }
  }

  return (
    <div className="mt-4 rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950 space-y-1">
      <p className="font-semibold text-amber-900">Session debug (server-side)</p>
      <p>
        <span className="text-amber-700">Deployment:</span>{" "}
        {env.onVercel ? `Vercel (${env.vercelEnv})` : "local"} / {env.nodeEnv}
      </p>
      <p>
        <span className="text-amber-700">Supabase project:</span>{" "}
        {env.projectRef ?? <span className="text-red-600 font-bold">MISSING</span>}
      </p>
      <p>
        <span className="text-amber-700">Env vars:</span> URL=
        {env.hasUrl ? "ok" : <span className="text-red-600">MISSING</span>}, anon=
        {env.hasAnonKey ? "ok" : <span className="text-red-600">MISSING</span>}, service=
        {env.hasServiceRoleKey ? "ok" : <span className="text-red-600">MISSING</span>}
      </p>
      <p>
        <span className="text-amber-700">Cookie session email:</span>{" "}
        {cookieSessionEmail ?? (
          <span className="text-red-600">
            none{getSessionError ? ` (${getSessionError})` : ""}
          </span>
        )}
      </p>
      <p>
        <span className="text-amber-700">DB role:</span> {dbRole ?? "none"}
      </p>
      <p>
        <span className="text-amber-700">Return URL (from):</span> {from ?? "none"}
      </p>
      <p>
        <span className="text-amber-700">Auth cookies:</span>{" "}
        {sbCookies.length
          ? sbCookies.map((c) => `${c.name} (${c.len}b)`).join(", ")
          : <span className="text-red-600">none — cookies not set, login will fail</span>}
      </p>
      {sbCookies.length > 0 && !cookieSessionEmail ? (
        <p className="mt-1 text-red-700 font-medium">
          Cookie present but cannot be decoded. This usually means the session
          was set by a different Supabase project or is corrupted. Sign out and
          sign in again to clear it.
        </p>
      ) : null}
    </div>
  );
}
