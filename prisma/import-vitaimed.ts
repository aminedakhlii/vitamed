import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { join } from "path";

const prisma = new PrismaClient();

type VitaimedProduct = {
  code: string;
  name: string;
  category: string;
  description: string;
  capacity: string;
  packaging: string;
  features: string[];
};

const DOC_PATH = "/docs/VITAIMED--Catalogue.pdf";

async function main() {
  const jsonPath = join(__dirname, "vitaimed-products.json");
  const items: VitaimedProduct[] = JSON.parse(readFileSync(jsonPath, "utf-8"));

  console.log(`Importing ${items.length} VITAIMED catalogue products...`);

  // Clear product-related data (keep users, orders history optional)
  await prisma.cartItem.deleteMany();
  await prisma.orderStatusHistory.deleteMany();
  await prisma.order.deleteMany();
  await prisma.quotation.deleteMany();
  await prisma.productDocument.deleteMany();
  await prisma.countryPrice.deleteMany();
  await prisma.product.deleteMany();

  let created = 0;
  for (const item of items) {
    const specs: Record<string, string> = {};
    if (item.capacity) specs.capacity = item.capacity;
    if (item.packaging) specs.packaging = item.packaging;

    const featureText =
      item.features.length > 0
        ? "\n\n" + item.features.slice(0, 12).join("\n• ")
        : "";
    const fullDescription = (item.description || item.name) + featureText;

    await prisma.product.create({
      data: {
        code: item.code,
        name: item.name,
        category: item.category,
        description: fullDescription.slice(0, 4000),
        specifications: JSON.stringify(specs),
        colors: JSON.stringify([]),
        sizes: JSON.stringify([]),
        materials: "Medical-grade PVC / silicone (per catalogue)",
        certifications: "CE, ISO (VITAIMED catalogue)",
        modelNumber: item.code,
        active: true,
        documents: {
          create: [
            {
              name: "VITAIMED Product Catalogue",
              docType: "PDF",
              fileUrl: DOC_PATH,
            },
          ],
        },
        countryPrices: {
          create: [
            { country: "US", currency: "USD", price: 0 },
            { country: "FR", currency: "EUR", price: 0 },
            { country: "DE", currency: "EUR", price: 0 },
            { country: "GB", currency: "GBP", price: 0 },
          ],
        },
      },
    });
    created++;
  }

  console.log(`✓ Imported ${created} products from VITAIMED catalogue (page 14+).`);
  console.log("  Pricing set to 0 — update country prices in Admin → Manage Products.");
  console.log(`  Catalogue PDF linked at ${DOC_PATH}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
