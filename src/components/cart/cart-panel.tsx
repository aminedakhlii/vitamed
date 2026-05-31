"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { INCOTERMS, COUNTRIES } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { Minus, Plus, Trash2 } from "lucide-react";

type CartItem = {
  id: string;
  productId: string;
  quantity: number;
  color: string | null;
  size: string | null;
  packaging: string | null;
  product: {
    name: string;
    code: string;
    countryPrices: { country: string; currency: string; price: number }[];
  };
};

export function CartPanel({
  initialItems,
  userCountry,
}: {
  initialItems: CartItem[];
  userCountry: string;
}) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [incoterm, setIncoterm] = useState("FOB");
  const [country, setCountry] = useState(userCountry);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  function getListPrice(item: CartItem) {
    return (
      item.product.countryPrices.find((p) => p.country === country) ??
      item.product.countryPrices[0]
    );
  }

  async function updateQuantity(item: CartItem, delta: number) {
    const newQty = Math.max(1, item.quantity + delta);
    if (newQty === item.quantity) return;

    const res = await fetch("/api/cart", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, quantity: newQty }),
    });
    if (res.ok) {
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, quantity: newQty } : i))
      );
    }
  }

  async function removeItem(id: string) {
    await fetch(`/api/cart?id=${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i.id !== id));
    setPrices((prev) => { const next = { ...prev }; delete next[id]; return next; });
  }

  async function submitProposal() {
    setLoading(true);
    setMessage(null);

    const quoteItems = items.map((item) => {
      const listPrice = getListPrice(item);
      const rawPrice = prices[item.id]?.trim();
      const unitPrice = rawPrice ? parseFloat(rawPrice) : (listPrice?.price ?? undefined);
      return {
        productId: item.productId,
        name: item.product.name,
        quantity: item.quantity,
        unitPrice: unitPrice && !isNaN(unitPrice) ? unitPrice : undefined,
        color: item.color ?? undefined,
        size: item.size ?? undefined,
        packaging: item.packaging ?? undefined,
      };
    });

    const res = await fetch("/api/quotations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: quoteItems, notes, incoterm, country }),
    });

    setLoading(false);
    if (res.ok) {
      router.push("/proposals");
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      setMessage({ text: d.error || "Failed to submit proposal.", ok: false });
    }
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500">
        <p>Your cart is empty.</p>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Items */}
      <div className="lg:col-span-2">
        <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Cart items ({items.length})</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {items.map((item) => {
              const listPrice = getListPrice(item);
              const currency = listPrice?.currency ?? "USD";
              return (
                <div key={item.id} className="p-4 flex gap-4 items-start">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900">{item.product.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{item.product.code}</p>
                    {(item.color || item.size || item.packaging) && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        {[item.color, item.size, item.packaging].filter(Boolean).join(" · ")}
                      </p>
                    )}

                    {/* Target price input */}
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-xs text-slate-500">Target price / unit</span>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                          {currency}
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="pl-10 pr-3 py-1 text-sm border border-slate-300 rounded w-32 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30"
                          placeholder={listPrice ? String(listPrice.price) : "0.00"}
                          value={prices[item.id] ?? ""}
                          onChange={(e) =>
                            setPrices((prev) => ({ ...prev, [item.id]: e.target.value }))
                          }
                        />
                      </div>
                      {listPrice && (
                        <span className="text-xs text-slate-400">
                          (list: {formatCurrency(listPrice.price, currency)})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item, -1)}
                      disabled={item.quantity <= 1}
                      className="w-7 h-7 flex items-center justify-center rounded border border-slate-300 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item, 1)}
                      className="w-7 h-7 flex items-center justify-center rounded border border-slate-300 text-slate-600 hover:bg-slate-100"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="w-7 h-7 flex items-center justify-center rounded text-red-400 hover:text-red-600 hover:bg-red-50 ml-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Proposal settings */}
      <div>
        <div className="border border-slate-200 rounded-lg bg-white overflow-hidden sticky top-6">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Submit proposal</h2>
            <p className="text-xs text-slate-500 mt-0.5">Shipping & delivery preferences</p>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Incoterm</label>
              <select
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30"
                value={incoterm}
                onChange={(e) => setIncoterm(e.target.value)}
              >
                {INCOTERMS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Destination country</label>
              <select
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Notes for sales team</label>
              <textarea
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Delivery timeline, volume requirements, special conditions…"
              />
            </div>

            {message && (
              <p className={`text-sm ${message.ok ? "text-emerald-700" : "text-red-600"}`}>
                {message.text}
              </p>
            )}

            <Button
              className="w-full justify-center"
              onClick={submitProposal}
              disabled={loading || items.length === 0}
            >
              {loading ? "Submitting…" : "Submit proposal"}
            </Button>

            <p className="text-xs text-slate-400 text-center">
              Target prices are optional. Our sales team will review and respond.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
