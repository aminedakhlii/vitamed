import { getSession } from "@/lib/auth";
import { getSupabase } from "@/lib/db";
import { notFound } from "next/navigation";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TicketActions } from "@/components/support/ticket-actions";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

const STATUS_VARIANT: Record<string, "default" | "warning" | "success" | "danger" | "info"> = {
  OPEN: "warning",
  IN_PROGRESS: "info",
  RESOLVED: "success",
  CLOSED: "default",
};

const STATUS_LABEL: Record<string, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  const supabase = getSupabase();

  const { data: ticket } = await supabase
    .from("SupportTicket")
    .select("*")
    .eq("id", id)
    .single();

  if (!ticket) notFound();

  // Clients can only view their own tickets
  if (session?.role === "CLIENT" && ticket.userId !== session.id) notFound();

  const userIds = [ticket.userId, ticket.assignedToId].filter(Boolean) as string[];
  const { data: users } = await supabase
    .from("User")
    .select("id, name, email, company, phone")
    .in("id", userIds);
  const userMap = new Map((users || []).map((u) => [u.id, u]));
  const client = userMap.get(ticket.userId);
  const assignedTo = ticket.assignedToId ? userMap.get(ticket.assignedToId) : null;

  // Linked order
  const { data: order } = ticket.orderId
    ? await supabase.from("Order").select("id, orderNumber, status").eq("id", ticket.orderId).single()
    : { data: null };

  const isStaff = session?.role === "ADMIN" || session?.role === "SALES";
  const isAssignedToMe = ticket.assignedToId === session?.id;

  return (
    <div>
      <Link
        href="/support"
        className="text-sm text-[#1e3a5f] hover:underline mb-4 inline-block"
      >
        ← Back to tickets
      </Link>

      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-slate-900">{ticket.ticketNumber}</h1>
            <Badge variant={STATUS_VARIANT[ticket.status] || "default"}>
              {STATUS_LABEL[ticket.status] || ticket.status}
            </Badge>
            <Badge variant="default">{ticket.type}</Badge>
          </div>
          <p className="text-slate-600 text-lg">{ticket.subject}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader title="Description" />
            <CardBody>
              <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                {ticket.description}
              </p>
            </CardBody>
          </Card>

          {/* Staff actions */}
          {isStaff && (
            <Card>
              <CardHeader
                title="Manage Ticket"
                description="Update status and assignment"
              />
              <CardBody>
                <TicketActions
                  ticketId={ticket.id}
                  status={ticket.status}
                  isAssignedToMe={isAssignedToMe}
                />
                {(ticket.status === "RESOLVED" || ticket.status === "CLOSED") && (
                  <p className="text-sm text-slate-500">
                    This ticket is {ticket.status.toLowerCase()} and requires no further action.
                  </p>
                )}
              </CardBody>
            </Card>
          )}
        </div>

        {/* Sidebar metadata */}
        <div className="space-y-4">
          {/* Client info — staff only */}
          {isStaff && client && (
            <Card>
              <CardHeader title="Client" />
              <CardBody className="space-y-2 text-sm">
                <div>
                  <p className="text-slate-500 text-xs">Name</p>
                  <p className="font-medium">{client.name}</p>
                </div>
                {client.company && (
                  <div>
                    <p className="text-slate-500 text-xs">Company</p>
                    <p className="font-medium">{client.company}</p>
                  </div>
                )}
                <div>
                  <p className="text-slate-500 text-xs">Email</p>
                  <a href={`mailto:${client.email}`} className="text-[#1e3a5f] hover:underline">
                    {client.email}
                  </a>
                </div>
                {client.phone && (
                  <div>
                    <p className="text-slate-500 text-xs">Phone</p>
                    <p>{client.phone}</p>
                  </div>
                )}
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader title="Details" />
            <CardBody className="space-y-3 text-sm">
              <div>
                <p className="text-slate-500 text-xs mb-0.5">Assigned to</p>
                {assignedTo ? (
                  <p className="font-medium">
                    {assignedTo.name}
                    {isAssignedToMe && <span className="text-slate-400 ml-1">(you)</span>}
                  </p>
                ) : (
                  <p className="text-slate-400">Unassigned</p>
                )}
              </div>

              {order && (
                <div>
                  <p className="text-slate-500 text-xs mb-0.5">Related order</p>
                  <Link
                    href={`/orders/${order.id}`}
                    className="font-mono text-sm text-[#1e3a5f] hover:underline"
                  >
                    {order.orderNumber}
                  </Link>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {order.status.replace(/_/g, " ")}
                  </p>
                </div>
              )}

              <div>
                <p className="text-slate-500 text-xs mb-0.5">Opened</p>
                <p>{formatDate(ticket.createdAt)}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs mb-0.5">Last updated</p>
                <p>{formatDate(ticket.updatedAt)}</p>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
