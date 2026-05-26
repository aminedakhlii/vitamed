import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function SalesDashboardPage() {
  const session = await getSession();
  const [pendingQuotes, followUps, recentOrders, tickets] = await Promise.all([
    prisma.quotation.count({ where: { status: "PENDING" } }),
    prisma.followUp.count({ where: { completed: false, salesUserId: session?.id } }),
    prisma.order.findMany({
      take: 5,
      orderBy: { updatedAt: "desc" },
      include: { user: { select: { name: true, company: true } } },
    }),
    prisma.supportTicket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
  ]);

  const automatedFollowUps = await prisma.followUp.findMany({
    where: { completed: false, automated: true },
    take: 5,
    include: { client: { select: { name: true } } },
    orderBy: { scheduledAt: "asc" },
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Sales Dashboard</h1>
        <p className="text-slate-500 mt-1">Quotations, follow-ups, and client activity</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Pending Quotations", value: pendingQuotes },
          { label: "My Follow-ups", value: followUps },
          { label: "Open Tickets", value: tickets },
          { label: "AI Automations", value: automatedFollowUps.length },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <p className="label">{s.label}</p>
            <p className="value">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader
            title="AI Follow-up Queue"
            description="Automated client reminders"
            action={<Link href="/follow-ups"><Button variant="outline" size="sm">Manage</Button></Link>}
          />
          <CardBody className="space-y-3">
            {automatedFollowUps.length === 0 ? (
              <p className="text-sm text-slate-500">No pending automated follow-ups.</p>
            ) : (
              automatedFollowUps.map((f) => (
                <div key={f.id} className="flex justify-between items-start py-2 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{f.subject}</p>
                    <p className="text-xs text-slate-500">{f.client.name} · {f.type}</p>
                  </div>
                  <Badge variant="info">AI</Badge>
                </div>
              ))
            )}
          </CardBody>
        </Card>

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
                {recentOrders.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <Link href={`/orders/${o.id}`} className="text-[#1e3a5f] hover:underline font-medium">
                        {o.orderNumber}
                      </Link>
                    </td>
                    <td>{o.user.company || o.user.name}</td>
                    <td>
                      <Badge variant="navy">{o.status.replace(/_/g, " ")}</Badge>
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
