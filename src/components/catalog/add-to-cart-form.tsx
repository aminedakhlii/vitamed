"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
export function AddToCartForm({
  productId,
  colors,
  sizes,
}: {
  productId: string;
  colors: string[];
  sizes: string[];
}) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [color, setColor] = useState(colors[0] || "");
  const [size, setSize] = useState(sizes[0] || "");
  const [packaging, setPackaging] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleAdd() {
    setLoading(true);
    setMessage("");
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId,
        quantity,
        color: color || undefined,
        size: size || undefined,
        packaging: packaging || undefined,
        deliveryNotes: deliveryNotes || undefined,
      }),
    });
    setLoading(false);
    if (res.ok) {
      setMessage("Added to cart");
      router.refresh();
    } else {
      setMessage("Failed to add to cart");
    }
  }

  return (
    <div className="space-y-4 border-t border-slate-100 pt-6">
      <h3 className="font-semibold text-slate-900">Add to cart</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
          <Input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
          />
        </div>
        {colors.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Color</label>
            <select
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            >
              {colors.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        )}
        {sizes.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Size</label>
            <select
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
              value={size}
              onChange={(e) => setSize(e.target.value)}
            >
              {sizes.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Packaging</label>
          <Input
            value={packaging}
            onChange={(e) => setPackaging(e.target.value)}
            placeholder="e.g. Export pallet"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">Delivery instructions</label>
          <Input
            value={deliveryNotes}
            onChange={(e) => setDeliveryNotes(e.target.value)}
            placeholder="Special delivery notes"
          />
        </div>
      </div>
      {message && <p className="text-sm text-emerald-700">{message}</p>}
      <Button onClick={handleAdd} disabled={loading}>
        {loading ? "Adding…" : "Add to cart"}
      </Button>
    </div>
  );
}
