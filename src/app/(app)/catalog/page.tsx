import { getSession } from "@/lib/auth";
import { getProductsWithRelations } from "@/lib/queries";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { formatCurrency, parseJsonArray } from "@/lib/utils";
import { Package } from "lucide-react";

export default async function CatalogPage() {
  const session = await getSession();
  const products = await getProductsWithRelations(true);
  const country = session?.country || "US";

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Product Catalog</h1>
        <p className="text-slate-500 mt-1">
          Browse products, specifications, and documents
          {session && ` · Pricing shown for ${country}`}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {products.map((product) => {
          const price = product.countryPrices.find((p: { country: string; price: number; currency: string }) => p.country === country)
            ?? product.countryPrices[0];
          const colors = parseJsonArray<string>(product.colors);

          return (
            <Card key={product.id}>
              <CardBody>
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded bg-slate-100 flex items-center justify-center shrink-0">
                    <Package className="w-8 h-8 text-[#1e3a5f]/40" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs text-slate-500 font-mono">{product.code}</p>
                        <h3 className="font-semibold text-slate-900">{product.name}</h3>
                      </div>
                      {price && (
                        <p className="text-sm font-bold text-[#1e3a5f] shrink-0">
                          {formatCurrency(price.price, price.currency)}
                        </p>
                      )}
                    </div>
                    <Badge variant="default" className="mt-1">{product.category}</Badge>
                    <p className="text-sm text-slate-600 mt-2 line-clamp-2">{product.description}</p>
                    {colors.length > 0 && (
                      <p className="text-xs text-slate-500 mt-1">Colors: {colors.join(", ")}</p>
                    )}
                    <div className="mt-3 flex items-center gap-3">
                      <Link
                        href={`/catalog/${product.id}`}
                        className="text-sm font-medium text-[#1e3a5f] hover:underline"
                      >
                        View details →
                      </Link>
                      {product.documents.length > 0 && (
                        <span className="text-xs text-slate-400">
                          {product.documents.length} document(s)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
