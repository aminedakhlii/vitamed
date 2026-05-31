"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserCheck, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TicketActions({
  ticketId,
  status,
  isAssignedToMe,
}: {
  ticketId: string;
  status: string;
  isAssignedToMe: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function doAction(action: "ACCEPT" | "RESOLVE" | "CLOSE") {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/support/${ticketId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setLoading(false);
    if (res.ok) {
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Action failed.");
    }
  }

  if (status === "RESOLVED" || status === "CLOSED") return null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {status === "OPEN" && (
          <Button
            onClick={() => doAction("ACCEPT")}
            disabled={loading}
            className="gap-2"
          >
            <UserCheck className="w-4 h-4" />
            {loading ? "Processing…" : "Accept — assign to me"}
          </Button>
        )}
        {status === "IN_PROGRESS" && (
          <Button
            onClick={() => doAction("RESOLVE")}
            disabled={loading}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700"
          >
            <CheckCircle className="w-4 h-4" />
            {loading ? "Processing…" : "Mark as resolved"}
          </Button>
        )}
        {(status === "OPEN" || status === "IN_PROGRESS") && (
          <Button
            variant="outline"
            onClick={() => doAction("CLOSE")}
            disabled={loading}
            className="gap-2"
          >
            <XCircle className="w-4 h-4" />
            Close ticket
          </Button>
        )}
      </div>
      {isAssignedToMe && status === "IN_PROGRESS" && (
        <p className="text-xs text-slate-500">This ticket is assigned to you.</p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
