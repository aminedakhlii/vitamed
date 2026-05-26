import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function AdminDashboardPage() {
  const [orderCount, clientCount, productCount, ticketCount, orders, tickets] = await Promise.all([
    prisma.order.count(),
    prisma.user.count({ where: { role: "CLIENT" } }),
    prisma.product.count({ where: { active: true } }),
    prisma.supportTicket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    prisma.order.findMany({ take: 5, orderBy: { createdAt: "desc" }, include: { user: { select: { name: true } } } }),
    prisma.supportTicket.findMany({
      where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
      take: 5,
      include: { user: { select: { name: true } } },
    }),
  ]);

  const revenue = orders.reduce((sum, o) => {
    const items = JSON.parse(o.items) as { quantity: number; unitPrice?: number }[];
    return sum + items.reduce((s, i) => s + (i.unitPrice || 0) * i.quantity, 0);
  }, 0);

  const stats = [
    { label: "Total Orders", value: orderCount.toString() },
    { label: "Revenue (sample)", value: formatCurrency(revenue) },
    { label: "Active Clients", value: clientCount.toString() },
    { label: "Products", value: productCount.toString() },
    { label: "Open Tickets", value: ticketCount.toString() },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-500 mt-1">Platform overview and operational metrics</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <p className="label">{s.label}</p>
            <p className="value">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Recent Orders" action={<Link href="/orders"><Button variant="outline" size="sm">View all</Button></Link>} />
          <CardBody className="p-0">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Client</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <Link href={`/orders/${o.id}`} className="text-[#1e3a5f] hover:underline font-medium">
                        {o.orderNumber}
                      </Link>
                    </td>
                    <td>{o.user.name}</td>
                    <td>
                      <Badge variant="navy">{o.status.replace(/_/g, " ")}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Open Support Tickets" action={<Link href="/support"><Button variant="outline" size="sm">View all</Button></Link>} />
          <CardBody className="p-0">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Client</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id}>
                    <td className="font-medium">{t.ticketNumber}</td>
                    <td>{t.user.name}</td>
                    <td>
                      <Badge variant="warning">{t.status.replace(/_/g, " ")}</Badge>
                    </td>
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
