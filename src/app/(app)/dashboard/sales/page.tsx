import { getSession } from "@/lib/auth";
import { getSupabase } from "@/lib/db";
import { getOrdersWithUsers } from "@/lib/queries";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function SalesDashboardPage() {
  const session = await getSession();
  const supabase = getSupabase();

  const [
    { count: pendingQuotes },
    { count: followUps },
    { count: tickets },
    recentOrders,
    { data: automatedFollowUps },
  ] = await Promise.all([
    supabase.from("Quotation").select("*", { count: "exact", head: true }).eq("status", "PENDING"),
    supabase.from("FollowUp").select("*", { count: "exact", head: true }).eq("completed", false).eq("salesUserId", session?.id || ""),
    supabase.from("SupportTicket").select("*", { count: "exact", head: true }).in("status", ["OPEN", "IN_PROGRESS"]),
    getOrdersWithUsers().then((o) => o.slice(0, 5)),
    supabase
      .from("FollowUp")
      .select("*")
      .eq("completed", false)
      .eq("automated", true)
      .order("scheduledAt", { ascending: true })
      .limit(5),
  ]);

  const clientIds = [...new Set((automatedFollowUps || []).map((f) => f.clientId))];
  const { data: clients } = await supabase.from("User").select("id, name").in("id", clientIds);
  const clientMap = new Map((clients || []).map((c) => [c.id, c]));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Sales Dashboard</h1>
        <p className="text-slate-500 mt-1">Quotations, follow-ups, and client activity</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Pending Quotations", value: pendingQuotes || 0 },
          { label: "My Follow-ups", value: followUps || 0 },
          { label: "Open Tickets", value: tickets || 0 },
          { label: "AI Automations", value: automatedFollowUps?.length || 0 },
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
            {!automatedFollowUps?.length ? (
              <p className="text-sm text-slate-500">No pending automated follow-ups.</p>
            ) : (
              automatedFollowUps.map((f) => (
                <div key={f.id} className="flex justify-between items-start py-2 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{f.subject}</p>
                    <p className="text-xs text-slate-500">{clientMap.get(f.clientId)?.name} · {f.type}</p>
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
                    <td>{o.user?.company || o.user?.name}</td>
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
