/** Server-only Supabase env helpers (safe to log diagnostics, never log secrets). */

export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
        "On Vercel, add these in Project Settings → Environment Variables, then redeploy."
    );
  }

  return { url, anonKey, serviceRoleKey };
}

export function getSupabaseProjectRef(url: string) {
  try {
    return new URL(url).hostname.split(".")[0] ?? "unknown";
  } catch {
    return "invalid-url";
  }
}

/** Non-secret env status for the login debug panel. */
export function getSupabaseEnvDiagnostics() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  return {
    hasUrl: Boolean(url),
    hasAnonKey: Boolean(anonKey),
    hasServiceRoleKey: Boolean(serviceRoleKey),
    projectRef: url ? getSupabaseProjectRef(url) : null,
    nodeEnv: process.env.NODE_ENV ?? "unknown",
    onVercel: Boolean(process.env.VERCEL),
    vercelEnv: process.env.VERCEL_ENV ?? null,
    configured: Boolean(url && anonKey),
  };
}

export const supabaseCookieDefaults = {
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};
