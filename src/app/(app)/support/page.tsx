import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TicketForm } from "@/components/support/ticket-form";
import { formatDate } from "@/lib/utils";

export default async function SupportPage() {
  const session = await getSession();
  const where = session?.role === "CLIENT" ? { userId: session.id } : {};

  const tickets = await prisma.supportTicket.findMany({
    where,
    include: {
      user: { select: { name: true, company: true } },
      assignedTo: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

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
            <CardHeader title={`Tickets (${tickets.length})`} />
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
                  {tickets.map((t) => (
                    <tr key={t.id}>
                      <td className="font-medium">{t.ticketNumber}</td>
                      {session?.role !== "CLIENT" && (
                        <td>{t.user.company || t.user.name}</td>
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
                      <td>{t.assignedTo?.name || "Unassigned"}</td>
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
