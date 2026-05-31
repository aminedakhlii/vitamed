"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatCurrency } from "@/lib/utils";
import { CheckCircle, XCircle, ChevronDown, ChevronUp, ShoppingBag, RefreshCw } from "lucide-react";
import type { Role } from "@/lib/types";

type ProposalItem = {
  productId: string;
  name: string;
  quantity: number;
  unitPrice?: number;
  color?: string;
  size?: string;
  packaging?: string;
};

type Proposal = {
  id: string;
  status: string;
  items: string;
  notes: string | null;
  incoterm: string | null;
  country: string | null;
  salesMessage: string | null;
  respondedAt: string | null;
  createdAt: string;
  user?: { name: string; company: string | null; email: string } | null;
};

const STATUS_VARIANT: Record<string, "default" | "warning" | "success" | "danger" | "info"> = {
  DRAFT: "default",
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft",
  PENDING: "Awaiting review",
  APPROVED: "Approved",
  REJECTED: "Requires revision",
};

export function ProposalRow({
  proposal,
  role,
}: {
  proposal: Proposal;
  role: Role;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [responding, setResponding] = useState(false);
  const [action, setAction] = useState<"APPROVE" | "REJECT" | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const items: ProposalItem[] = (() => {
    try { return JSON.parse(proposal.items); }
    catch { return []; }
  })();

  async function submitResponse() {
    if (!action || !message.trim()) { setError("A message is required."); return; }
    setLoading(true); setError("");
    const res = await fetch(`/api/quotations/${proposal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, message: message.trim() }),
    });
    setLoading(false);
    if (res.ok) {
      setResponding(false); setMessage(""); setAction(null);
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Failed to submit response.");
    }
  }

  async function confirmOrder() {
    setLoading(true); setError("");
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proposalId: proposal.id }),
    });
    setLoading(false);
    if (res.ok) {
      router.push("/orders");
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Failed to confirm order.");
    }
  }

  const isSales = role === "SALES" || role === "ADMIN";

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      {/* Header row */}
      <div className="flex items-center gap-4 p-4 bg-white hover:bg-slate-50">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono text-xs text-slate-500">{proposal.id.slice(0, 8)}…</span>
            <Badge variant={STATUS_VARIANT[proposal.status] ?? "default"}>
              {STATUS_LABEL[proposal.status] ?? proposal.status}
            </Badge>
            {proposal.incoterm && (
              <span className="text-xs text-slate-500">{proposal.incoterm}</span>
            )}
            {proposal.country && (
              <span className="text-xs text-slate-500">→ {proposal.country}</span>
            )}
          </div>
          <div className="flex items-center gap-4 mt-1 text-xs text-slate-500 flex-wrap">
            {isSales && proposal.user && (
              <span className="font-medium text-slate-700">
                {proposal.user.company || proposal.user.name}
              </span>
            )}
            <span>{items.length} item{items.length !== 1 ? "s" : ""}</span>
            <span>Submitted {formatDate(proposal.createdAt)}</span>
            {proposal.respondedAt && (
              <span>Reviewed {formatDate(proposal.respondedAt)}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Client actions */}
          {!isSales && proposal.status === "APPROVED" && (
            <Button
              size="sm"
              onClick={confirmOrder}
              disabled={loading}
              className="gap-1.5"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              {loading ? "Processing…" : "Confirm Order"}
            </Button>
          )}
          {!isSales && proposal.status === "REJECTED" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push("/cart")}
              className="gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              New Proposal
            </Button>
          )}

          {/* Sales actions */}
          {isSales && proposal.status === "PENDING" && !responding && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => { setResponding(true); setExpanded(true); }}
              className="text-slate-700"
            >
              Respond
            </Button>
          )}

          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50 p-4 space-y-4">
          {/* Items table */}
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 border-b border-slate-200">
                <th className="text-left pb-2 font-medium">Product</th>
                <th className="text-left pb-2 font-medium">Specs</th>
                <th className="text-right pb-2 font-medium">Qty</th>
                <th className="text-right pb-2 font-medium">Target price / unit</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} className="border-b border-slate-100 last:border-0">
                  <td className="py-2 font-medium">{item.name}</td>
                  <td className="py-2 text-slate-500 text-xs">
                    {[item.color, item.size, item.packaging].filter(Boolean).join(" · ") || "—"}
                  </td>
                  <td className="py-2 text-right">{item.quantity}</td>
                  <td className="py-2 text-right">
                    {item.unitPrice != null
                      ? formatCurrency(item.unitPrice, "USD")
                      : <span className="text-slate-400">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {proposal.notes && (
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">Client notes</p>
              <p className="text-sm text-slate-700">{proposal.notes}</p>
            </div>
          )}

          {/* Sales message */}
          {proposal.salesMessage && (
            <div className={`rounded-lg p-3 ${proposal.status === "APPROVED" ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200"}`}>
              <div className="flex items-center gap-2 mb-1">
                {proposal.status === "APPROVED"
                  ? <CheckCircle className="w-4 h-4 text-emerald-600" />
                  : <XCircle className="w-4 h-4 text-red-600" />}
                <span className={`text-xs font-semibold ${proposal.status === "APPROVED" ? "text-emerald-700" : "text-red-700"}`}>
                  {proposal.status === "APPROVED" ? "Approved" : "Requires revision"} — Sales team
                </span>
              </div>
              <p className="text-sm text-slate-700 ml-6">{proposal.salesMessage}</p>
            </div>
          )}

          {/* Error display */}
          {error && <p className="text-sm text-red-600">{error}</p>}

          {/* Sales respond form */}
          {isSales && responding && (
            <div className="border border-slate-200 rounded-lg bg-white p-4 space-y-3">
              <p className="text-sm font-semibold text-slate-800">Respond to proposal</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAction("APPROVE")}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded text-sm font-medium border transition-colors ${
                    action === "APPROVE"
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "border-slate-300 text-slate-700 hover:border-emerald-500 hover:text-emerald-700"
                  }`}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => setAction("REJECT")}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded text-sm font-medium border transition-colors ${
                    action === "REJECT"
                      ? "bg-red-600 text-white border-red-600"
                      : "border-slate-300 text-slate-700 hover:border-red-500 hover:text-red-700"
                  }`}
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Request revision
                </button>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Message to client <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30"
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={
                    action === "APPROVE"
                      ? "e.g. Approved. We can meet your target price. Production begins next week."
                      : "e.g. The requested price is below our minimum. Please revise to $X per unit."
                  }
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={submitResponse} disabled={loading || !action}>
                  {loading ? "Sending…" : "Send response"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { setResponding(false); setAction(null); setMessage(""); setError(""); }}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
