import { getSession } from "@/lib/auth";
import { getSupabase } from "@/lib/db";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ProposalRow } from "@/components/proposals/proposal-row";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Role } from "@/lib/types";

export default async function ProposalsPage() {
  const session = await getSession();
  const supabase = getSupabase();

  let q = supabase
    .from("Quotation")
    .select("*")
    .order("createdAt", { ascending: false });

  if (session?.role === "CLIENT") q = q.eq("userId", session.id);

  const { data: proposals } = await q;

  const userIds = [...new Set((proposals || []).map((p) => p.userId))];
  const { data: users } = await supabase
    .from("User")
    .select("id, name, company, email")
    .in("id", userIds);
  const userMap = new Map((users || []).map((u) => [u.id, u]));

  const enriched = (proposals || []).map((p) => ({
    ...p,
    salesMessage: p.salesMessage ?? null,
    respondedAt: p.respondedAt ?? null,
    user: userMap.get(p.userId) ?? null,
  }));

  const pending = enriched.filter((p) => p.status === "PENDING");
  const rest = enriched.filter((p) => p.status !== "PENDING");

  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Proposals</h1>
          <p className="text-slate-500 mt-1">
            {session?.role === "CLIENT"
              ? "Your pricing proposals and their approval status"
              : "Client proposals awaiting review or already decided"}
          </p>
        </div>
        {session?.role === "CLIENT" && (
          <Link href="/cart">
            <Button variant="outline">New proposal →</Button>
          </Link>
        )}
      </div>

      {pending.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">
            Awaiting review ({pending.length})
          </h2>
          <div className="space-y-3">
            {pending.map((p) => (
              <ProposalRow key={p.id} proposal={p} role={session?.role as Role} />
            ))}
          </div>
        </div>
      )}

      {rest.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">
            {pending.length > 0 ? "Decided" : "All proposals"} ({rest.length})
          </h2>
          <div className="space-y-3">
            {rest.map((p) => (
              <ProposalRow key={p.id} proposal={p} role={session?.role as Role} />
            ))}
          </div>
        </div>
      )}

      {enriched.length === 0 && (
        <Card>
          <CardBody className="text-center py-16">
            <p className="text-slate-500 mb-4">No proposals yet.</p>
            {session?.role === "CLIENT" && (
              <Link href="/catalog">
                <Button>Browse catalog to get started</Button>
              </Link>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
