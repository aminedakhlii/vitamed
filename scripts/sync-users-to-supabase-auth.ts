/**
 * Creates Supabase Auth users for rows in public.User that don't exist in auth.users yet.
 *
 * Usage:
 *   DEFAULT_MIGRATED_PASSWORD="ChangeMe123!" npm run db:sync-auth-users
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const defaultPassword = process.env.DEFAULT_MIGRATED_PASSWORD;
if (!defaultPassword || defaultPassword.length < 8) {
  throw new Error(
    "Set DEFAULT_MIGRATED_PASSWORD (min 8 chars) before running this script."
  );
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  const { data: users, error } = await supabase.from("User").select("id,email,name");
  if (error) throw error;

  let created = 0;
  let existing = 0;
  let failed = 0;

  for (const user of users || []) {
    const { data: found, error: findError } =
      await supabase.auth.admin.getUserById(user.id);
    if (findError && !findError.message.toLowerCase().includes("not found")) {
      console.warn(`Could not check ${user.email}: ${findError.message}`);
    }

    if (found?.user) {
      existing += 1;
      continue;
    }

    const { error: createError } = await supabase.auth.admin.createUser({
      id: user.id,
      email: user.email,
      password: defaultPassword,
      email_confirm: true,
      user_metadata: { name: user.name },
    });

    if (createError) {
      failed += 1;
      console.error(`Failed ${user.email}: ${createError.message}`);
    } else {
      created += 1;
      console.log(`Created auth user: ${user.email}`);
    }
  }

  console.log(`Done. created=${created}, existing=${existing}, failed=${failed}`);
  console.log(
    "All migrated users now share DEFAULT_MIGRATED_PASSWORD. Prompt users to reset it."
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
