import { getSession } from "@/lib/auth";
import { getSupabase } from "@/lib/db";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TicketForm } from "@/components/support/ticket-form";
import { formatDate } from "@/lib/utils";

export default async function SupportPage() {
  const session = await getSession();
  const supabase = getSupabase();

  let q = supabase.from("SupportTicket").select("*").order("createdAt", { ascending: false });
  if (session?.role === "CLIENT") q = q.eq("userId", session!.id);
  const { data: tickets } = await q;

  const userIds = new Set<string>();
  for (const t of tickets || []) {
    userIds.add(t.userId);
    if (t.assignedToId) userIds.add(t.assignedToId);
  }
  const { data: users } = await supabase.from("User").select("id, name, company").in("id", [...userIds]);
  const userMap = new Map((users || []).map((u) => [u.id, u]));

  const statusVariant: Record<string, "default" | "warning" | "success" | "danger" | "info"> = {
    OPEN: "warning",
    IN_PROGRESS: "info",
    RESOLVED: "success",
    CLOSED: "default",
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">After-Sales Support</h1>
        <p className="text-slate-500 mt-1">Submit complaints, returns, and track ticket resolution</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {session?.role === "CLIENT" && (
          <Card>
            <CardHeader title="New Support Ticket" />
            <CardBody>
              <TicketForm />
            </CardBody>
          </Card>
        )}

        <div className={session?.role === "CLIENT" ? "lg:col-span-2" : "lg:col-span-3"}>
          <Card>
            <CardHeader title={`Tickets (${tickets?.length || 0})`} />
            <CardBody className="p-0">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Ticket #</th>
                    {session?.role !== "CLIENT" && <th>Client</th>}
                    <th>Type</th>
                    <th>Subject</th>
                    <th>Status</th>
                    <th>Assigned</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {(tickets || []).map((t) => (
                    <tr key={t.id}>
                      <td className="font-medium">{t.ticketNumber}</td>
                      {session?.role !== "CLIENT" && (
                        <td>{userMap.get(t.userId)?.company || userMap.get(t.userId)?.name}</td>
                      )}
                      <td>
                        <Badge variant="default">{t.type}</Badge>
                      </td>
                      <td>{t.subject}</td>
                      <td>
                        <Badge variant={statusVariant[t.status] || "default"}>
                          {t.status.replace(/_/g, " ")}
                        </Badge>
                      </td>
                      <td>{t.assignedToId ? userMap.get(t.assignedToId)?.name : "Unassigned"}</td>
                      <td>{formatDate(t.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
