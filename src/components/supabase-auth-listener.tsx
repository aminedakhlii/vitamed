"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";

/**
 * Keeps the browser cookie session fresh and syncs Next.js server state.
 *
 * On Vercel, middleware skips getUser() (avoids network round-trips) and trusts
 * the cookie directly. This component is the counterpart: it runs in the
 * browser and proactively refreshes the access token so the cookie always has a
 * valid session when the server reads it.
 */
export function SupabaseAuthListener() {
  const router = useRouter();
  const supabase = useRef(createBrowserClient());

  useEffect(() => {
    const sb = supabase.current;

    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((event) => {
      if (
        event === "TOKEN_REFRESHED" ||
        event === "SIGNED_IN" ||
        event === "SIGNED_OUT" ||
        event === "USER_UPDATED"
      ) {
        // Tell Next.js to re-fetch server components so they see updated cookies.
        router.refresh();
      }
    });

    const handleVisibilityChange = async () => {
      if (document.visibilityState !== "visible") return;

      // When returning to the tab, call getUser() which forces Supabase to
      // validate and — if expired — refresh the access token using the refresh
      // token in the cookie. Without this, a backgrounded tab may hold a stale
      // token that server components reject after a navigation.
      const { data, error } = await sb.auth.getUser();

      if (data.user) {
        // Token was valid or just refreshed — re-sync the server state.
        router.refresh();
      } else if (error) {
        // Refresh token is also expired/revoked — redirect to login.
        const from = encodeURIComponent(window.location.pathname);
        router.push(`/login?from=${from}`);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [router]);

  return null;
}
