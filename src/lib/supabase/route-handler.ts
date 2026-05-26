import type { NextResponse } from "next/server";
import type { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseEnv, supabaseCookieDefaults } from "./env";

type CookieStore = Awaited<ReturnType<typeof cookies>>;

export type AuthCookieEntry = {
  name: string;
  value: string;
  options?: Parameters<CookieStore["set"]>[2];
};

/**
 * Supabase client for Route Handlers — writes session cookies onto the outgoing Response
 * (required on Vercel; cookieStore alone is not always enough on 303 redirects).
 */
export function createSupabaseRouteHandlerClient(
  cookieStore: CookieStore,
  response: NextResponse,
  authCookies: AuthCookieEntry[]
) {
  const { url, anonKey } = getSupabaseEnv();

  return createServerClient(url, anonKey, {
    cookieOptions: supabaseCookieDefaults,
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
          response.cookies.set(name, value, options);
          authCookies.push({ name, value, options });
        });
        if (headers) {
          Object.entries(headers).forEach(([key, value]) => {
            response.headers.set(key, value);
          });
        }
      },
    },
  });
}

export function applyAuthCookies(response: NextResponse, authCookies: AuthCookieEntry[]) {
  authCookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });
}
