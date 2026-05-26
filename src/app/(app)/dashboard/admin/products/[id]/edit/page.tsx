import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ProductForm } from "@/components/products/product-form";
import { productToFormDefaults } from "@/lib/product-form";
import Link from "next/link";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { countryPrices: true },
  });

  if (!product) notFound();

  const initial = productToFormDefaults({ ...product, id: product.id });

  return (
    <div>
      <Link
        href="/dashboard/admin/products"
        className="text-sm text-[#1e3a5f] hover:underline mb-4 inline-block"
      >
        ← Back to products
      </Link>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Edit Product</h1>
        <p className="text-slate-500 mt-1">
          {product.code} — {product.name}
        </p>
      </div>
      <Card>
        <CardHeader title="Product details" />
        <CardBody>
          <ProductForm initial={initial} mode="edit" />
        </CardBody>
      </Card>
    </div>
  );
}
