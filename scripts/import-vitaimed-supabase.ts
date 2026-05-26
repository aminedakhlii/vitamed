/**
 * Import VITAIMED catalogue JSON into Supabase (replaces existing products).
 * Run after supabase/schema.sql and optionally db:migrate-to-supabase for users.
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";
import { newId, nowIso } from "../src/lib/id";

const DOC_PATH = "/docs/VITAIMED--Catalogue.pdf";

type VitaimedProduct = {
  code: string;
  name: string;
  category: string;
  description: string;
  features: string[];
};

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, { auth: { persistSession: false } });
}

async function clearProducts(supabase: ReturnType<typeof createClient>) {
  const tables = ["CartItem", "OrderStatusHistory", "Order", "Quotation", "ProductDocument", "CountryPrice", "Product"];
  for (const t of tables) {
    await supabase.from(t).delete().neq("id", "00000000-0000-0000-0000-000000000000");
  }
}

async function main() {
  const jsonPath = join(process.cwd(), "prisma/vitaimed-products.json");
  const items: VitaimedProduct[] = JSON.parse(readFileSync(jsonPath, "utf-8"));
  const supabase = getSupabase();

  console.log(`Importing ${items.length} products to Supabase...`);
  await clearProducts(supabase);

  for (const item of items) {
    const now = nowIso();
    const id = newId();
    const featureText = item.features.length ? "\n\n• " + item.features.slice(0, 12).join("\n• ") : "";

    await supabase.from("Product").insert({
      id,
      code: item.code,
      name: item.name,
      category: item.category,
      description: (item.description + featureText).slice(0, 4000),
      specifications: "{}",
      colors: "[]",
      sizes: "[]",
      materials: "Medical-grade PVC / silicone (per catalogue)",
      certifications: "CE, ISO (VITAIMED catalogue)",
      modelNumber: item.code,
      imageUrl: null,
      active: true,
      createdAt: now,
      updatedAt: now,
    });

    await supabase.from("ProductDocument").insert({
      id: newId(),
      productId: id,
      name: "VITAIMED Product Catalogue",
      docType: "PDF",
      fileUrl: DOC_PATH,
    });

    for (const country of ["US", "FR", "DE", "GB"]) {
      const currency = country === "US" ? "USD" : country === "GB" ? "GBP" : "EUR";
      await supabase.from("CountryPrice").insert({
        id: newId(),
        productId: id,
        country,
        currency,
        price: 0,
      });
    }
  }

  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
