import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr";

let _client: ReturnType<typeof createSupabaseBrowserClient> | null = null;

/**
 * Singleton Supabase browser client.
 * Uses @supabase/ssr so cookies are shared with the server (not localStorage).
 */
export function createBrowserClient() {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  _client = createSupabaseBrowserClient(url, key);
  return _client;
}
