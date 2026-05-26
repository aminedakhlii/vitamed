import { getSession } from "@/lib/auth";
import { getSupabase } from "@/lib/db";
import { redirect } from "next/navigation";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { FollowUpActions } from "@/components/follow-ups/follow-up-actions";
import { Bot } from "lucide-react";

export default async function FollowUpsPage() {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "SALES")) {
    redirect("/dashboard/client");
  }

  const { data: followUps } = await getSupabase()
    .from("FollowUp")
    .select("*")
    .order("scheduledAt", { ascending: true });

  const clientIds = [...new Set((followUps || []).map((f) => f.clientId))];
  const salesIds = [...new Set((followUps || []).map((f) => f.salesUserId).filter(Boolean))] as string[];
  const { data: clients } = await getSupabase()
    .from("User")
    .select("id, name, email, company")
    .in("id", clientIds);
  const { data: sales } = salesIds.length
    ? await getSupabase().from("User").select("id, name").in("id", salesIds)
    : { data: [] };

  const clientMap = new Map((clients || []).map((c) => [c.id, c]));
  const salesMap = new Map((sales || []).map((s) => [s.id, s]));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Bot className="w-7 h-7 text-[#1e3a5f]" />
          Client Follow-up Automation
        </h1>
        <p className="text-slate-500 mt-1">
          AI-generated reminders, email follow-ups, and lead prioritization
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Pending", value: (followUps || []).filter((f) => !f.completed).length },
          { label: "Automated", value: (followUps || []).filter((f) => f.automated && !f.completed).length },
          { label: "Completed", value: (followUps || []).filter((f) => f.completed).length },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <p className="label">{s.label}</p>
            <p className="value">{s.value}</p>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader title="Follow-up Queue" description="Automated and manual client touchpoints" />
        <CardBody className="space-y-4">
          {(followUps || []).map((f) => (
            <div
              key={f.id}
              className="flex items-start justify-between gap-4 p-4 border border-slate-200 rounded-lg"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-slate-900">{f.subject}</p>
                  {f.automated && <Badge variant="info">AI Automated</Badge>}
                  {f.completed && <Badge variant="success">Completed</Badge>}
                </div>
                <p className="text-sm text-slate-600">{f.message}</p>
                <p className="text-xs text-slate-500 mt-2">
                  Client: {clientMap.get(f.clientId)?.company || clientMap.get(f.clientId)?.name} · Type: {f.type} ·
                  Scheduled: {formatDate(f.scheduledAt)}
                  {f.salesUserId && salesMap.get(f.salesUserId) && ` · Sales: ${salesMap.get(f.salesUserId)?.name}`}
                </p>
              </div>
              {!f.completed && <FollowUpActions followUpId={f.id} />}
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
