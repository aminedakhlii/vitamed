import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr";
import { supabaseCookieDefaults } from "./env";

export function createBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return createSupabaseBrowserClient(url, key, {
    cookieEncoding: "base64url",
    cookieOptions: supabaseCookieDefaults,
  });
}
