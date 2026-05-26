"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ORDER_STATUS_FLOW } from "@/lib/constants";
import type { OrderStatus } from "@/lib/types";

export function OrderStatusActions({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: OrderStatus;
}) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const currentIdx = ORDER_STATUS_FLOW.indexOf(currentStatus);
  const nextStatus = ORDER_STATUS_FLOW[currentIdx + 1];

  async function advanceStatus() {
    if (!nextStatus) return;
    setLoading(true);
    await fetch(`/api/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus, note }),
    });
    setLoading(false);
    router.refresh();
  }

  if (!nextStatus) {
    return <p className="text-sm text-slate-500">Order is at final status.</p>;
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600">
        Next: <strong>{nextStatus.replace(/_/g, " ")}</strong>
      </p>
      <textarea
        className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
        rows={2}
        placeholder="Status note (optional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <Button onClick={advanceStatus} disabled={loading} size="sm">
        {loading ? "Updating…" : "Advance status"}
      </Button>
    </div>
  );
}
