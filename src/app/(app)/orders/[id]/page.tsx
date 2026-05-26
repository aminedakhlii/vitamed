import { getSession } from "@/lib/auth";
import { getOrderById } from "@/lib/queries";
import { notFound } from "next/navigation";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import { OrderStatusActions } from "@/components/orders/order-status-actions";
import type { OrderStatus } from "@/lib/types";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();

  let order;
  try {
    order = await getOrderById(id);
  } catch {
    notFound();
  }

  if (session?.role === "CLIENT" && order.userId !== session.id) notFound();

  const items = JSON.parse(order.items) as {
    name: string;
    quantity: number;
    unitPrice?: number;
  }[];

  return (
    <div>
      <Link href="/orders" className="text-sm text-[#1e3a5f] hover:underline mb-4 inline-block">
        ← Back to orders
      </Link>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{order.orderNumber}</h1>
          <p className="text-slate-500 mt-1">
            {session?.role !== "CLIENT" && `${order.user?.company || order.user?.name} · `}
            Created {formatDate(order.createdAt)}
          </p>
        </div>
        <Badge variant="navy">{ORDER_STATUS_LABELS[order.status as OrderStatus]}</Badge>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader title="Order Timeline" description="Real-time production and shipping updates" />
            <CardBody>
              <OrderTimeline
                currentStatus={order.status as OrderStatus}
                history={order.statusHistory.map((h) => ({
                  status: h.status as OrderStatus,
                  note: h.note,
                  createdAt: new Date(h.createdAt),
                }))}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Order Items" />
            <CardBody className="p-0">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={i}>
                      <td>{item.name}</td>
                      <td>{item.quantity}</td>
                      <td>{item.unitPrice ? formatCurrency(item.unitPrice) : "—"}</td>
                      <td>
                        {item.unitPrice
                          ? formatCurrency(item.unitPrice * item.quantity)
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Shipping & Logistics" />
            <CardBody className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Incoterm</span>
                <span className="font-medium">{order.incoterm || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Destination</span>
                <span className="font-medium">{order.destinationCountry || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Shipping cost</span>
                <span className="font-medium">
                  {order.shippingCost ? formatCurrency(order.shippingCost) : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tracking #</span>
                <span className="font-mono text-xs">{order.trackingNumber || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Est. delivery</span>
                <span className="font-medium">
                  {order.estimatedDelivery ? formatDate(order.estimatedDelivery) : "—"}
                </span>
              </div>
            </CardBody>
          </Card>

          {(session?.role === "ADMIN" || session?.role === "SALES") && (
            <Card>
              <CardHeader title="Update Status" description="Advance order through production pipeline" />
              <CardBody>
                <OrderStatusActions orderId={order.id} currentStatus={order.status as OrderStatus} />
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
