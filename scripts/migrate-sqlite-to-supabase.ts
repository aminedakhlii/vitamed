/**
 * Copies all data from local SQLite (prisma/dev.db) into Supabase.
 *
 * Prerequisites:
 * 1. Run supabase/schema.sql in Supabase SQL Editor
 * 2. Set env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage: npm run db:migrate-to-supabase
 */
import "dotenv/config";
import Database from "better-sqlite3";
import { createClient } from "@supabase/supabase-js";
import { join } from "path";

const SQLITE_PATH = join(process.cwd(), "prisma/dev.db");

const TABLES_IN_ORDER = [
  "User",
  "Product",
  "ProductDocument",
  "CountryPrice",
  "CartItem",
  "Quotation",
  "Order",
  "OrderStatusHistory",
  "Notification",
  "SupportTicket",
  "FollowUp",
] as const;

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env"
    );
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

function rowToRecord(row: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    if (v === undefined) continue;
    if (typeof v === "number" && (k === "active" || k === "read" || k === "completed" || k === "automated")) {
      out[k] = Boolean(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

async function clearTable(supabase: ReturnType<typeof createClient>, table: string) {
  const { error } = await supabase.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (error) console.warn(`  clear ${table}:`, error.message);
}

async function main() {
  const sqlite = new Database(SQLITE_PATH, { readonly: true });
  const supabase = getSupabase();

  console.log(`Reading from ${SQLITE_PATH}`);
  console.log(`Target: ${process.env.NEXT_PUBLIC_SUPABASE_URL}\n`);

  for (const table of TABLES_IN_ORDER) {
    const rows = sqlite.prepare(`SELECT * FROM "${table}"`).all() as Record<string, unknown>[];
    if (rows.length === 0) {
      console.log(`⏭  ${table}: 0 rows`);
      continue;
    }

    await clearTable(supabase, table);

    const batchSize = 100;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize).map(rowToRecord);
      const { error } = await supabase.from(table).insert(batch);
      if (error) {
        console.error(`✗ ${table} batch ${i}:`, error.message);
        process.exit(1);
      }
    }
    console.log(`✓ ${table}: ${rows.length} rows`);
  }

  sqlite.close();
  console.log("\nDone. Verify in Supabase Table Editor.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
