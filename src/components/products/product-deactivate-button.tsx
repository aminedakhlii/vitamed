"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ProductDeactivateButton({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function deactivate() {
    if (!confirm(`Deactivate "${productName}"? It will be hidden from the catalog.`)) return;
    setLoading(true);
    await fetch(`/api/products/${productId}`, { method: "DELETE" });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={deactivate}
      disabled={loading}
      className="text-sm text-red-600 hover:underline disabled:opacity-50"
    >
      {loading ? "…" : "Deactivate"}
    </button>
  );
}
