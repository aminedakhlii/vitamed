import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { CartActions } from "@/components/cart/cart-actions";
import Link from "next/link";

export default async function CartPage() {
  const session = await getSession();
  if (!session || session.role !== "CLIENT") redirect("/dashboard/client");

  const items = await prisma.cartItem.findMany({
    where: { userId: session.id },
    include: { product: { include: { countryPrices: true } } },
  });

  const country = session.country || "US";

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Shopping Cart</h1>
        <p className="text-slate-500 mt-1">Review items and submit a quotation request</p>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12">
            <p className="text-slate-500">Your cart is empty.</p>
            <Link href="/catalog" className="mt-4 inline-block text-[#1e3a5f] font-medium hover:underline">
              Browse catalog →
            </Link>
          </CardBody>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader title={`Cart Items (${items.length})`} />
              <CardBody className="p-0">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Specs</th>
                      <th>Qty</th>
                      <th>Est. Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => {
                      const price = item.product.countryPrices.find((p) => p.country === country)
                        ?? item.product.countryPrices[0];
                      return (
                        <tr key={item.id}>
                          <td>
                            <p className="font-medium">{item.product.name}</p>
                            <p className="text-xs text-slate-500">{item.product.code}</p>
                          </td>
                          <td className="text-xs text-slate-500">
                            {[item.color, item.size, item.packaging].filter(Boolean).join(" · ") || "—"}
                          </td>
                          <td>{item.quantity}</td>
                          <td>
                            {price
                              ? formatCurrency(price.price * item.quantity, price.currency)
                              : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardBody>
            </Card>
          </div>
          <Card>
            <CardHeader title="Submit Quotation" description="Shipping & delivery preferences" />
            <CardBody>
              <CartActions items={items} userCountry={country} />
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
