import { getSession } from "@/lib/auth";
import { getSupabase } from "@/lib/db";
import { getOrdersWithUsers } from "@/lib/queries";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import type { OrderStatus } from "@/lib/types";

export default async function ClientDashboardPage() {
  const session = await getSession();
  if (!session) return null;

  const supabase = getSupabase();
  const orders = (await getOrdersWithUsers(session.id)).slice(0, 3);

  const { data: quotations } = await supabase
    .from("Quotation")
    .select("*")
    .eq("userId", session.id)
    .order("createdAt", { ascending: false })
    .limit(3);

  const { count: cartCount } = await supabase
    .from("CartItem")
    .select("*", { count: "exact", head: true })
    .eq("userId", session.id);

  const { count: unreadNotifs } = await supabase
    .from("Notification")
    .select("*", { count: "exact", head: true })
    .eq("userId", session.id)
    .eq("read", false);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Welcome, {session.name}</h1>
        <p className="text-slate-500 mt-1">Your orders, quotations, and account activity</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Active Orders", value: orders.length },
          { label: "Cart Items", value: cartCount || 0 },
          { label: "Quotations", value: quotations?.length || 0 },
          { label: "Unread Notifications", value: unreadNotifs || 0 },
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
            title="Recent Orders"
            action={<Link href="/orders"><Button variant="outline" size="sm">Track orders</Button></Link>}
          />
          <CardBody className="space-y-3">
            {orders.length === 0 ? (
              <p className="text-sm text-slate-500">No orders yet. Browse the catalog to get started.</p>
            ) : (
              orders.map((o) => (
                <Link
                  key={o.id}
                  href={`/orders/${o.id}`}
                  className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0 hover:bg-slate-50 -mx-2 px-2 rounded"
                >
                  <div>
                    <p className="text-sm font-medium text-[#1e3a5f]">{o.orderNumber}</p>
                    <p className="text-xs text-slate-500">{ORDER_STATUS_LABELS[o.status as OrderStatus]}</p>
                  </div>
                  {o.trackingNumber && (
                    <Badge variant="info">{o.trackingNumber}</Badge>
                  )}
                </Link>
              ))
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Quick Actions" description="Common tasks" />
          <CardBody className="flex flex-col gap-3">
            <Link href="/catalog"><Button className="w-full justify-center">Browse Product Catalog</Button></Link>
            <Link href="/cart"><Button variant="outline" className="w-full justify-center">View Cart ({cartCount || 0})</Button></Link>
            <Link href="/support"><Button variant="outline" className="w-full justify-center">Submit Support Request</Button></Link>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
