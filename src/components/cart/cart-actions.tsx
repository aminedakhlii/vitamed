"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { INCOTERMS, COUNTRIES } from "@/lib/constants";

type CartItem = {
  id: string;
  productId: string;
  quantity: number;
  color: string | null;
  size: string | null;
  packaging: string | null;
  product: { name: string; code: string; countryPrices: { country: string; currency: string; price: number }[] };
};

export function CartActions({ items, userCountry }: { items: CartItem[]; userCountry: string }) {
  const router = useRouter();
  const [incoterm, setIncoterm] = useState("FOB");
  const [country, setCountry] = useState(userCountry);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function requestQuotation() {
    setLoading(true);
    setMessage("");

    const quoteItems = items.map((item) => {
      const price = item.product.countryPrices.find((p) => p.country === country)
        ?? item.product.countryPrices[0];
      return {
        productId: item.productId,
        name: item.product.name,
        quantity: item.quantity,
        unitPrice: price?.price,
        color: item.color,
        size: item.size,
        packaging: item.packaging,
      };
    });

    const res = await fetch("/api/quotations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: quoteItems, notes, incoterm, country }),
    });

    setLoading(false);
    if (res.ok) {
      setMessage("Quotation request submitted successfully.");
      router.push("/quotations");
      router.refresh();
    } else {
      setMessage("Failed to submit quotation.");
    }
  }

  async function removeItem(id: string) {
    await fetch(`/api/cart?id=${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Incoterm</label>
          <select
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
            value={incoterm}
            onChange={(e) => setIncoterm(e.target.value)}
          >
            {INCOTERMS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Destination country</label>
          <select
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Notes for sales team</label>
        <textarea
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Delivery requirements, volume discounts, etc."
        />
      </div>
      {message && <p className="text-sm text-emerald-700">{message}</p>}
      <div className="flex gap-3">
        <Button onClick={requestQuotation} disabled={loading || items.length === 0}>
          {loading ? "Submitting…" : "Request quotation"}
        </Button>
      </div>
      <div className="border-t border-slate-100 pt-4 space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span className="text-slate-600">{item.product.name} × {item.quantity}</span>
            <button
              type="button"
              onClick={() => removeItem(item.id)}
              className="text-red-600 hover:underline text-xs"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
