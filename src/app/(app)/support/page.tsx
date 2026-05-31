import { getSession } from "@/lib/auth";
import { getSupabase } from "@/lib/db";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { TicketForm } from "@/components/support/ticket-form";
import { TicketTable } from "@/components/support/ticket-table";

export default async function SupportPage() {
  const session = await getSession();
  const supabase = getSupabase();

  const isClient = session?.role === "CLIENT";
  const isStaff = session?.role === "ADMIN" || session?.role === "SALES";

  // Clients see only their own tickets; staff see all
  let q = supabase.from("SupportTicket").select("*").order("createdAt", { ascending: false });
  if (isClient) q = q.eq("userId", session!.id);
  const { data: tickets } = await q;

  // Enrich with user + assignee names
  const userIds = new Set<string>();
  for (const t of tickets || []) {
    userIds.add(t.userId);
    if (t.assignedToId) userIds.add(t.assignedToId);
  }
  const { data: users } = await supabase
    .from("User")
    .select("id, name, company")
    .in("id", [...userIds]);
  const userMap = new Map((users || []).map((u) => [u.id, u]));

  // Enrich with linked order numbers
  const orderIds = [...new Set((tickets || []).map((t) => t.orderId).filter(Boolean))];
  const { data: linkedOrders } = orderIds.length
    ? await supabase.from("Order").select("id, orderNumber").in("id", orderIds)
    : { data: [] };
  const orderMap = new Map((linkedOrders || []).map((o) => [o.id, o]));

  const enriched = (tickets || []).map((t) => ({
    ...t,
    user: userMap.get(t.userId) ?? null,
    assignedTo: t.assignedToId ? (userMap.get(t.assignedToId) ?? null) : null,
    order: t.orderId ? (orderMap.get(t.orderId) ?? null) : null,
  }));

  // For client ticket form: load their orders
  let clientOrders: { id: string; orderNumber: string }[] = [];
  if (isClient) {
    const { data } = await supabase
      .from("Order")
      .select("id, orderNumber")
      .eq("userId", session!.id)
      .order("createdAt", { ascending: false });
    clientOrders = data || [];
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">After-Sales Support</h1>
        <p className="text-slate-500 mt-1">
          {isStaff
            ? "Review and manage client support tickets — click a ticket number to open it"
            : "Submit complaints, returns, and track ticket resolution"}
        </p>
      </div>

      {isClient ? (
        <div className="grid lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader title="New Support Ticket" />
            <CardBody>
              <TicketForm orders={clientOrders} />
            </CardBody>
          </Card>
          <div className="lg:col-span-2">
            <Card>
              <CardHeader title={`My Tickets (${enriched.length})`} />
              <CardBody className="p-0">
                <TicketTable
                  initial={enriched}
                  isStaff={false}
                  currentUserId={session?.id ?? ""}
                />
              </CardBody>
            </Card>
          </div>
        </div>
      ) : (
        <Card>
          <CardHeader title={`All Tickets (${enriched.length})`} />
          <CardBody className="p-0">
            <TicketTable
              initial={enriched}
              isStaff={!!isStaff}
              currentUserId={session?.id ?? ""}
            />
          </CardBody>
        </Card>
      )}
    </div>
  );
}
