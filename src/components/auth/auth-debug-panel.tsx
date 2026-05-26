import { cookies } from "next/headers";
import { getSession } from "@/lib/auth";
import { createAdminClient, createAuthServerClient } from "@/lib/supabase/server";

export async function AuthDebugPanel({ from }: { from?: string }) {
  const authClient = await createAuthServerClient();
  const {
    data: { user: authUser },
    error: authError,
  } = await authClient.auth.getUser();

  const session = await getSession();

  let dbRole: string | null = null;
  if (authUser?.email) {
    const { data } = await createAdminClient()
      .from("User")
      .select("role, email, id")
      .eq("email", authUser.email)
      .maybeSingle();
    dbRole = data?.role ?? null;
  }

  const cookieStore = await cookies();
  const authCookieNames = cookieStore
    .getAll()
    .map((c) => c.name)
    .filter((n) => n.includes("sb-") || n.includes("supabase"));

  return (
    <div className="mt-4 rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950 space-y-1">
      <p className="font-semibold">Session debug</p>
      <p>
        <span className="text-amber-700">Supabase user:</span>{" "}
        {authUser?.email ?? "none"}
        {authError ? ` (${authError.message})` : ""}
      </p>
      <p>
        <span className="text-amber-700">App session role:</span> {session?.role ?? "none"}
      </p>
      <p>
        <span className="text-amber-700">DB role (by email):</span> {dbRole ?? "none"}
      </p>
      <p>
        <span className="text-amber-700">Auth user id:</span> {authUser?.id ?? "none"}
      </p>
      <p>
        <span className="text-amber-700">Return URL (from):</span> {from ?? "none"}
      </p>
      <p>
        <span className="text-amber-700">Auth cookies:</span>{" "}
        {authCookieNames.length ? authCookieNames.join(", ") : "none"}
      </p>
    </div>
  );
}
