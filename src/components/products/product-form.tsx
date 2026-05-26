"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { COUNTRIES } from "@/lib/constants";
import {
  type ProductFormData,
  textToSpecs,
  csvToArray,
} from "@/lib/product-form";

export function ProductForm({
  initial,
  mode,
}: {
  initial: ProductFormData;
  mode: "create" | "edit";
}) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function updatePrice(index: number, field: keyof ProductFormData["countryPrices"][0], value: string) {
    const prices = [...form.countryPrices];
    prices[index] = { ...prices[index], [field]: value };
    if (field === "country") {
      const c = COUNTRIES.find((x) => x.code === value);
      if (c) prices[index].currency = c.currency;
    }
    setForm({ ...form, countryPrices: prices });
  }

  function addPriceRow() {
    setForm({
      ...form,
      countryPrices: [...form.countryPrices, { country: "FR", currency: "EUR", price: "" }],
    });
  }

  function removePriceRow(index: number) {
    setForm({
      ...form,
      countryPrices: form.countryPrices.filter((_, i) => i !== index),
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const prices = form.countryPrices
      .filter((p) => p.price && parseFloat(p.price) > 0)
      .map((p) => ({
        country: p.country,
        currency: p.currency,
        price: parseFloat(p.price),
      }));

    const payload = {
      code: form.code,
      name: form.name,
      category: form.category,
      description: form.description,
      materials: form.materials,
      certifications: form.certifications,
      modelNumber: form.modelNumber || undefined,
      imageUrl: form.imageUrl || undefined,
      active: form.active,
      colors: csvToArray(form.colors),
      sizes: csvToArray(form.sizes),
      specifications: textToSpecs(form.specifications),
      countryPrices: prices,
    };

    const url = mode === "create" ? "/api/products" : `/api/products/${form.id}`;
    const method = mode === "create" ? "POST" : "PATCH";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Failed to save product");
      return;
    }

    router.push("/dashboard/admin/products");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Product code *</label>
          <Input
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            placeholder="e.g. IND-4500"
            required
            disabled={mode === "edit"}
          />
          {mode === "edit" && (
            <p className="text-xs text-slate-500 mt-1">Code cannot be changed after creation.</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Model number</label>
          <Input
            value={form.modelNumber}
            onChange={(e) => setForm({ ...form, modelNumber: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Product name *</label>
        <Input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
          <Input
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            placeholder="e.g. Industrial Components"
            required
          />
        </div>
        <div className="flex items-end pb-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
              className="rounded"
            />
            Active (visible in catalog)
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Description *</label>
        <textarea
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
          rows={3}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Colors</label>
          <Input
            value={form.colors}
            onChange={(e) => setForm({ ...form, colors: e.target.value })}
            placeholder="Silver, Black"
          />
          <p className="text-xs text-slate-500 mt-1">Comma-separated</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Sizes</label>
          <Input
            value={form.sizes}
            onChange={(e) => setForm({ ...form, sizes: e.target.value })}
            placeholder="Standard, Large"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Materials</label>
          <Input
            value={form.materials}
            onChange={(e) => setForm({ ...form, materials: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Certifications</label>
          <Input
            value={form.certifications}
            onChange={(e) => setForm({ ...form, certifications: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Technical specifications</label>
        <textarea
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded font-mono"
          rows={4}
          value={form.specifications}
          onChange={(e) => setForm({ ...form, specifications: e.target.value })}
          placeholder={"pressure: 150 PSI\ndiameter: 4 inch"}
        />
        <p className="text-xs text-slate-500 mt-1">One per line, format: key: value</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Image URL</label>
        <Input
          value={form.imageUrl}
          onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
          placeholder="https://..."
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-slate-700">Country pricing</label>
          <Button type="button" variant="outline" size="sm" onClick={addPriceRow}>
            Add market
          </Button>
        </div>
        <div className="space-y-2">
          {form.countryPrices.map((p, i) => (
            <div key={i} className="flex gap-2 items-center">
              <select
                className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded"
                value={p.country}
                onChange={(e) => updatePrice(i, "country", e.target.value)}
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
              <Input
                className="w-20"
                value={p.currency}
                onChange={(e) => updatePrice(i, "currency", e.target.value)}
                placeholder="USD"
              />
              <Input
                className="w-28"
                type="number"
                min="0"
                step="0.01"
                value={p.price}
                onChange={(e) => updatePrice(i, "price", e.target.value)}
                placeholder="Price"
              />
              {form.countryPrices.length > 1 && (
                <Button type="button" variant="ghost" size="sm" onClick={() => removePriceRow(i)}>
                  Remove
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving…" : mode === "create" ? "Create product" : "Save changes"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
