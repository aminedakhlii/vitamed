import { prisma } from "@/lib/db";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { ProductDeactivateButton } from "@/components/products/product-deactivate-button";

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    include: { countryPrices: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manage Products</h1>
          <p className="text-slate-500 mt-1">Add, edit, and deactivate products in the catalog</p>
        </div>
        <Link href="/dashboard/admin/products/new">
          <Button>Add product</Button>
        </Link>
      </div>

      <Card>
        <CardHeader title={`All Products (${products.length})`} />
        <CardBody className="p-0">
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Category</th>
                <th>Markets</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const usPrice = p.countryPrices.find((cp) => cp.country === "US") ?? p.countryPrices[0];
                return (
                  <tr key={p.id}>
                    <td className="font-mono text-xs">{p.code}</td>
                    <td className="font-medium">{p.name}</td>
                    <td>{p.category}</td>
                    <td>
                      {usPrice
                        ? formatCurrency(usPrice.price, usPrice.currency)
                        : `${p.countryPrices.length} market(s)`}
                    </td>
                    <td>
                      <Badge variant={p.active ? "success" : "default"}>
                        {p.active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/admin/products/${p.id}/edit`}
                          className="text-sm text-[#1e3a5f] hover:underline"
                        >
                          Edit
                        </Link>
                        <span className="text-slate-300">|</span>
                        <Link
                          href={`/catalog/${p.id}`}
                          className="text-sm text-slate-500 hover:underline"
                        >
                          View
                        </Link>
                        {p.active && (
                          <>
                            <span className="text-slate-300">|</span>
                            <ProductDeactivateButton productId={p.id} productName={p.name} />
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
