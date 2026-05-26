import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export default async function QuotationsPage() {
  const session = await getSession();
  const where = session?.role === "CLIENT" ? { userId: session.id } : {};

  const quotations = await prisma.quotation.findMany({
    where,
    include: { user: { select: { name: true, company: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  const statusVariant: Record<string, "default" | "warning" | "success" | "danger" | "info"> = {
    DRAFT: "default",
    PENDING: "warning",
    APPROVED: "success",
    REJECTED: "danger",
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Quotations</h1>
        <p className="text-slate-500 mt-1">Quotation requests and approval status</p>
      </div>

      <Card>
        <CardHeader title={`Quotations (${quotations.length})`} />
        <CardBody className="p-0">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                {session?.role !== "CLIENT" && <th>Client</th>}
                <th>Status</th>
                <th>Incoterm</th>
                <th>Country</th>
                <th>Items</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {quotations.map((q) => {
                const items = JSON.parse(q.items) as { name: string; quantity: number }[];
                return (
                  <tr key={q.id}>
                    <td className="font-mono text-xs">{q.id.slice(0, 8)}…</td>
                    {session?.role !== "CLIENT" && (
                      <td>{q.user.company || q.user.name}</td>
                    )}
                    <td>
                      <Badge variant={statusVariant[q.status] || "default"}>
                        {q.status}
                      </Badge>
                    </td>
                    <td>{q.incoterm || "—"}</td>
                    <td>{q.country || "—"}</td>
                    <td className="text-xs">
                      {items.map((i) => `${i.name} (${i.quantity})`).join(", ")}
                    </td>
                    <td>{formatDate(q.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
