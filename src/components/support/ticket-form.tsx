"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type OrderOption = { id: string; orderNumber: string };

export function TicketForm({ orders = [] }: { orders?: OrderOption[] }) {
  const router = useRouter();
  const [form, setForm] = useState({
    type: "COMPLAINT" as "COMPLAINT" | "RETURN" | "REPLACEMENT" | "FEEDBACK",
    subject: "",
    description: "",
    orderId: "" as string,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        orderId: form.orderId || null,
      }),
    });

    setLoading(false);
    if (!res.ok) {
      setError("Failed to submit ticket");
      return;
    }

    router.refresh();
    setForm({ type: "COMPLAINT", subject: "", description: "", orderId: "" });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
        <select
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30"
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value as typeof form.type })}
        >
          <option value="COMPLAINT">Complaint</option>
          <option value="RETURN">Return request</option>
          <option value="REPLACEMENT">Replacement request</option>
          <option value="FEEDBACK">Feedback</option>
        </select>
      </div>

      {orders.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Related order <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <select
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30"
            value={form.orderId}
            onChange={(e) => setForm({ ...form, orderId: e.target.value })}
          >
            <option value="">— Not linked to a specific order —</option>
            {orders.map((o) => (
              <option key={o.id} value={o.id}>{o.orderNumber}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
        <Input
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
        <textarea
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30"
          rows={4}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          required
          minLength={10}
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? "Submitting…" : "Submit ticket"}
      </Button>
    </form>
  );
}
