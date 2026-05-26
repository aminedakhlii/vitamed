import { createAdminClient } from "./supabase/server";

export function getSupabase() {
  return createAdminClient();
}
