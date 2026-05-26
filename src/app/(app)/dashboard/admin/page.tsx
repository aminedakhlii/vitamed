import { getSupabase } from "@/lib/db";
import { getOrdersWithUsers } from "@/lib/queries";
import { formatCurrency } from "@/lib/utils";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function AdminDashboardPage() {
  const supabase = getSupabase();

  const [
    { count: orderCount },
    { count: clientCount },
    { count: productCount },
    { count: ticketCount },
    orders,
    { data: tickets },
  ] = await Promise.all([
    supabase.from("Order").select("*", { count: "exact", head: true }),
    supabase.from("User").select("*", { count: "exact", head: true }).eq("role", "CLIENT"),
    supabase.from("Product").select("*", { count: "exact", head: true }).eq("active", true),
    supabase.from("SupportTicket").select("*", { count: "exact", head: true }).in("status", ["OPEN", "IN_PROGRESS"]),
    getOrdersWithUsers(),
    supabase
      .from("SupportTicket")
      .select("*")
      .in("status", ["OPEN", "IN_PROGRESS"])
      .order("createdAt", { ascending: false })
      .limit(5),
  ]);

  const recentOrders = orders.slice(0, 5);
  const revenue = recentOrders.reduce((sum, o) => {
    const items = JSON.parse(o.items) as { quantity: number; unitPrice?: number }[];
    return sum + items.reduce((s, i) => s + (i.unitPrice || 0) * i.quantity, 0);
  }, 0);

  const ticketUserIds = [...new Set((tickets || []).map((t) => t.userId))];
  const { data: ticketUsers } = await supabase.from("User").select("id, name").in("id", ticketUserIds);
  const ticketUserMap = new Map((ticketUsers || []).map((u) => [u.id, u]));

  const stats = [
    { label: "Total Orders", value: String(orderCount || 0) },
    { label: "Revenue (sample)", value: formatCurrency(revenue) },
    { label: "Active Clients", value: String(clientCount || 0) },
    { label: "Products", value: String(productCount || 0) },
    { label: "Open Tickets", value: String(ticketCount || 0) },
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
                {recentOrders.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <Link href={`/orders/${o.id}`} className="text-[#1e3a5f] hover:underline font-medium">
                        {o.orderNumber}
                      </Link>
                    </td>
                    <td>{o.user?.name}</td>
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
                {(tickets || []).map((t) => (
                  <tr key={t.id}>
                    <td className="font-medium">{t.ticketNumber}</td>
                    <td>{ticketUserMap.get(t.userId)?.name}</td>
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
