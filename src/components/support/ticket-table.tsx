"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { UserCheck, CheckCircle, XCircle } from "lucide-react";

type Ticket = {
  id: string;
  ticketNumber: string;
  userId: string;
  assignedToId: string | null;
  orderId: string | null;
  type: string;
  subject: string;
  status: string;
  createdAt: string;
  user?: { name: string; company: string | null } | null;
  assignedTo?: { name: string } | null;
  order?: { orderNumber: string } | null;
};

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

export function TicketTable({
  initial,
  isStaff,
  currentUserId,
}: {
  initial: Ticket[];
  isStaff: boolean;
  currentUserId: string;
}) {
  const router = useRouter();
  const [tickets, setTickets] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);

  async function doAction(ticketId: string, action: "ACCEPT" | "RESOLVE" | "CLOSE") {
    setBusy(ticketId);
    const res = await fetch(`/api/support/${ticketId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setBusy(null);
    if (res.ok) {
      const updated = await res.json();
      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId
            ? { ...t, status: updated.status, assignedToId: updated.assignedToId }
            : t
        )
      );
      router.refresh();
    }
  }

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Ticket #</th>
          {isStaff && <th>Client</th>}
          <th>Type</th>
          <th>Subject</th>
          <th>Order</th>
          <th>Status</th>
          <th>Assigned</th>
          <th>Date</th>
          {isStaff && <th>Actions</th>}
        </tr>
      </thead>
      <tbody>
        {tickets.map((t) => {
          const isLoading = busy === t.id;
          return (
            <tr key={t.id}>
              <td className="font-medium">{t.ticketNumber}</td>
              {isStaff && (
                <td>{t.user?.company || t.user?.name || "—"}</td>
              )}
              <td>
                <Badge variant="default">{t.type}</Badge>
              </td>
              <td className="max-w-[200px] truncate">{t.subject}</td>
              <td>
                {t.order ? (
                  <span className="font-mono text-xs text-[#1e3a5f]">{t.order.orderNumber}</span>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </td>
              <td>
                <Badge variant={STATUS_VARIANT[t.status] || "default"}>
                  {STATUS_LABEL[t.status] || t.status}
                </Badge>
              </td>
              <td>
                {t.assignedToId === currentUserId
                  ? <span className="text-[#1e3a5f] font-medium text-xs">You</span>
                  : t.assignedTo?.name || <span className="text-slate-400">Unassigned</span>}
              </td>
              <td>{formatDate(t.createdAt)}</td>
              {isStaff && (
                <td>
                  <div className="flex items-center gap-1.5">
                    {t.status === "OPEN" && (
                      <button
                        type="button"
                        onClick={() => doAction(t.id, "ACCEPT")}
                        disabled={isLoading}
                        title="Accept — assign to me and mark In Progress"
                        className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-[#1e3a5f] text-white hover:bg-[#1e3a5f]/80 disabled:opacity-50"
                      >
                        <UserCheck className="w-3 h-3" />
                        Accept
                      </button>
                    )}
                    {t.status === "IN_PROGRESS" && (
                      <button
                        type="button"
                        onClick={() => doAction(t.id, "RESOLVE")}
                        disabled={isLoading}
                        title="Mark as Resolved"
                        className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        <CheckCircle className="w-3 h-3" />
                        Resolve
                      </button>
                    )}
                    {(t.status === "OPEN" || t.status === "IN_PROGRESS") && (
                      <button
                        type="button"
                        onClick={() => doAction(t.id, "CLOSE")}
                        disabled={isLoading}
                        title="Close ticket"
                        className="flex items-center gap-1 px-2 py-1 text-xs rounded border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                      >
                        <XCircle className="w-3 h-3" />
                        Close
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
