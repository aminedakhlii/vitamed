import { createServerClient } from "./supabase/server";

export function getSupabase() {
  return createServerClient();
}
