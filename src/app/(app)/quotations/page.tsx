import { getSession } from "@/lib/auth";
import { getSupabase } from "@/lib/db";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export default async function QuotationsPage() {
  const session = await getSession();
  const supabase = getSupabase();

  let q = supabase.from("Quotation").select("*").order("createdAt", { ascending: false });
  if (session?.role === "CLIENT") q = q.eq("userId", session!.id);
  const { data: quotations } = await q;

  const userIds = [...new Set((quotations || []).map((x) => x.userId))];
  const { data: users } = await supabase.from("User").select("id, name, company, email").in("id", userIds);
  const userMap = new Map((users || []).map((u) => [u.id, u]));

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
        <CardHeader title={`Quotations (${quotations?.length || 0})`} />
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
              {(quotations || []).map((q) => {
                const items = JSON.parse(q.items) as { name: string; quantity: number }[];
                const user = userMap.get(q.userId);
                return (
                  <tr key={q.id}>
                    <td className="font-mono text-xs">{q.id.slice(0, 8)}…</td>
                    {session?.role !== "CLIENT" && (
                      <td>{user?.company || user?.name}</td>
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
