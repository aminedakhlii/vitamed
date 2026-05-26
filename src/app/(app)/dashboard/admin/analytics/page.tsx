import { prisma } from "@/lib/db";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { COUNTRIES } from "@/lib/constants";

export default async function AnalyticsPage() {
  const [orders, products, tickets] = await Promise.all([
    prisma.order.findMany({ include: { user: { select: { country: true } } } }),
    prisma.product.findMany({ include: { countryPrices: true } }),
    prisma.supportTicket.groupBy({ by: ["status"], _count: true }),
  ]);

  const countrySales: Record<string, number> = {};
  for (const o of orders) {
    const country = o.destinationCountry || o.user.country || "Unknown";
    const items = JSON.parse(o.items) as { quantity: number; unitPrice?: number }[];
    const total = items.reduce((s, i) => s + (i.unitPrice || 0) * i.quantity, 0);
    countrySales[country] = (countrySales[country] || 0) + total;
  }

  const productPerformance = products.map((p) => ({
    name: p.name,
    category: p.category,
    priceCount: p.countryPrices.length,
  }));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
        <p className="text-slate-500 mt-1">Revenue, country sales, product performance, and support metrics</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Country Sales Statistics" />
          <CardBody className="p-0">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Country</th>
                  <th>Revenue (est.)</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(countrySales).map(([code, revenue]) => {
                  const country = COUNTRIES.find((c) => c.code === code);
                  return (
                    <tr key={code}>
                      <td>{country?.name || code}</td>
                      <td className="font-medium">{formatCurrency(revenue)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Complaint Statistics" />
          <CardBody className="space-y-3">
            {tickets.map((t) => (
              <div key={t.status} className="flex justify-between text-sm">
                <span className="text-slate-600">{t.status.replace(/_/g, " ")}</span>
                <span className="font-bold text-[#1e3a5f]">{t._count}</span>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Product Performance" />
          <CardBody className="p-0">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Markets priced</th>
                </tr>
              </thead>
              <tbody>
                {productPerformance.map((p) => (
                  <tr key={p.name}>
                    <td className="font-medium">{p.name}</td>
                    <td>{p.category}</td>
                    <td>{p.priceCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
