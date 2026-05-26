import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ProductForm } from "@/components/products/product-form";
import { productToFormDefaults } from "@/lib/product-form";
import Link from "next/link";

export default function NewProductPage() {
  return (
    <div>
      <Link
        href="/dashboard/admin/products"
        className="text-sm text-[#1e3a5f] hover:underline mb-4 inline-block"
      >
        ← Back to products
      </Link>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Add Product</h1>
        <p className="text-slate-500 mt-1">Create a new product for the catalog</p>
      </div>
      <Card>
        <CardHeader title="Product details" />
        <CardBody>
          <ProductForm initial={productToFormDefaults()} mode="create" />
        </CardBody>
      </Card>
    </div>
  );
}
