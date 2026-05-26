"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";
import type { AuthChangeEvent } from "@supabase/supabase-js";

/**
 * Listens to Supabase auth state changes and keeps Next.js server state in sync.
 *
 * TOKEN_REFRESHED  → router.refresh() so server components see the new cookie.
 * SIGNED_OUT       → redirect to /login.
 *
 * Token rotation is handled automatically by the Supabase browser client
 * (autoRefreshToken: true). We don't need to manually call getUser() on tab
 * focus — the client handles it proactively.
 */
export function SupabaseAuthListener() {
  const router = useRouter();
  const supabase = useRef(createBrowserClient());

  useEffect(() => {
    const sb = supabase.current;

    const { data: { subscription } } = sb.auth.onAuthStateChange((event: AuthChangeEvent) => {
      if (event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        router.refresh();
      }
      if (event === "SIGNED_OUT") {
        window.location.href = "/login";
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  return null;
}
