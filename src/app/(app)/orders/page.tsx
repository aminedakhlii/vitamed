import { getSession } from "@/lib/auth";
import { getOrdersWithUsers } from "@/lib/queries";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

export default async function OrdersPage() {
  const session = await getSession();
  const orders = await getOrdersWithUsers(session?.role === "CLIENT" ? session.id : undefined);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
        <p className="text-slate-500 mt-1">Track order status and shipping information</p>
      </div>

      <Card>
        <CardHeader title={`All Orders (${orders.length})`} />
        <CardBody className="p-0">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order #</th>
                {session?.role !== "CLIENT" && <th>Client</th>}
                <th>Status</th>
                <th>Incoterm</th>
                <th>Destination</th>
                <th>Tracking</th>
                <th>Est. Delivery</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>
                    <Link href={`/orders/${o.id}`} className="font-medium text-[#1e3a5f] hover:underline">
                      {o.orderNumber}
                    </Link>
                  </td>
                  {session?.role !== "CLIENT" && (
                    <td>{o.user?.company || o.user?.name}</td>
                  )}
                  <td>
                    <Badge variant="navy">{ORDER_STATUS_LABELS[o.status as keyof typeof ORDER_STATUS_LABELS]}</Badge>
                  </td>
                  <td>{o.incoterm || "—"}</td>
                  <td>{o.destinationCountry || "—"}</td>
                  <td className="font-mono text-xs">{o.trackingNumber || "—"}</td>
                  <td>{o.estimatedDelivery ? formatDate(o.estimatedDelivery) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
