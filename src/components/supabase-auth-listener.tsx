"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";

/**
 * Keeps the browser cookie session fresh and syncs Next.js server state.
 *
 * Strategy:
 * - On tab focus: ask Supabase to validate/refresh the token (network call).
 *   If it succeeds, refresh the server components. If it fails, do NOTHING —
 *   middleware already uses getSession() (cookie-only, no network), so the user
 *   will stay on the page. Only redirect to login if getSession() also returns
 *   null (truly no session in the cookie at all).
 * - On TOKEN_REFRESHED: sync new cookies to the server via router.refresh().
 */
export function SupabaseAuthListener() {
  const router = useRouter();
  const supabase = useRef(createBrowserClient());

  useEffect(() => {
    const sb = supabase.current;

    const { data: { subscription } } = sb.auth.onAuthStateChange((event) => {
      if (event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        router.refresh();
      }
      if (event === "SIGNED_OUT") {
        router.push("/login");
      }
    });

    const handleVisibilityChange = async () => {
      if (document.visibilityState !== "visible") return;

      // First check if there's a session in the cookie (no network).
      const { data: sessionData } = await sb.auth.getSession();

      if (!sessionData.session) {
        // No session cookie at all — let the user navigate and middleware
        // will redirect to login when they click a link.
        return;
      }

      // Session cookie exists. Try to validate / refresh it.
      // This call makes a network request to Supabase. If it succeeds, the
      // new access token is written to the cookie and TOKEN_REFRESHED fires
      // (which triggers router.refresh() above). If it fails (network error,
      // temporary Supabase issue), we still have a valid session cookie that
      // the server-side getSession() can read — so we do NOT redirect to login.
      await sb.auth.getUser();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [router]);

  return null;
}
