import { getProductById } from "@/lib/queries";
import { notFound } from "next/navigation";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ProductForm } from "@/components/products/product-form";
import { productToFormDefaults } from "@/lib/product-form";
import { ProductDocuments } from "@/components/products/product-documents";
import Link from "next/link";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let product;
  try {
    product = await getProductById(id);
  } catch {
    notFound();
  }

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

      <div className="space-y-6">
        <Card>
          <CardHeader title="Product details" />
          <CardBody>
            <ProductForm initial={initial} mode="edit" />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Documents & Attachments" />
          <CardBody>
            <ProductDocuments productId={product.id} initialDocs={product.documents} />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
