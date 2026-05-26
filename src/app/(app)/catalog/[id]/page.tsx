import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, parseJsonArray } from "@/lib/utils";
import { AddToCartForm } from "@/components/catalog/add-to-cart-form";
import Link from "next/link";
import { FileText } from "lucide-react";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  const product = await prisma.product.findUnique({
    where: { id },
    include: { countryPrices: true, documents: true },
  });

  if (!product) notFound();

  const country = session?.country || "US";
  const price = product.countryPrices.find((p) => p.country === country) ?? product.countryPrices[0];
  const colors = parseJsonArray<string>(product.colors);
  const sizes = parseJsonArray<string>(product.sizes);
  const specs = JSON.parse(product.specifications || "{}") as Record<string, string>;

  return (
    <div>
      <Link href="/catalog" className="text-sm text-[#1e3a5f] hover:underline mb-4 inline-block">
        ← Back to catalog
      </Link>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader title={product.name} description={`Code: ${product.code} · ${product.category}`} />
            <CardBody>
              <p className="text-slate-600">{product.description}</p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                {product.materials && (
                  <div><span className="text-slate-500">Materials:</span> {product.materials}</div>
                )}
                {product.certifications && (
                  <div><span className="text-slate-500">Certifications:</span> {product.certifications}</div>
                )}
                {product.modelNumber && (
                  <div><span className="text-slate-500">Model:</span> {product.modelNumber}</div>
                )}
              </div>
              {Object.keys(specs).length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-slate-900 mb-2">Technical Specifications</h4>
                  <table className="data-table">
                    <tbody>
                      {Object.entries(specs).map(([k, v]) => (
                        <tr key={k}>
                          <td className="font-medium capitalize w-1/3">{k}</td>
                          <td>{v}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>

          {product.documents.length > 0 && (
            <Card>
              <CardHeader title="Product Documents" description="Specification sheets, manuals, certificates" />
              <CardBody className="space-y-2">
                {product.documents.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
                    <FileText className="w-4 h-4 text-[#1e3a5f]" />
                    <div>
                      <p className="text-sm font-medium">{doc.name}</p>
                      <p className="text-xs text-slate-500">{doc.docType}</p>
                    </div>
                    <Badge variant="default" className="ml-auto">{doc.fileUrl}</Badge>
                  </div>
                ))}
              </CardBody>
            </Card>
          )}
        </div>

        <div>
          <Card>
            <CardBody>
              {price && (
                <p className="text-2xl font-bold text-[#1e3a5f]">
                  {formatCurrency(price.price, price.currency)}
                </p>
              )}
              <p className="text-xs text-slate-500 mt-1">Price for {country}</p>
              {session?.role === "CLIENT" && (
                <AddToCartForm productId={product.id} colors={colors} sizes={sizes} />
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
