"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Trash2, Plus, ExternalLink } from "lucide-react";

type ProductDoc = {
  id: string;
  productId: string;
  name: string;
  docType: string;
  fileUrl: string;
};

const DOC_TYPES = [
  "Specification Sheet",
  "Certificate",
  "Technical Manual",
  "Safety Data Sheet",
  "Product Brochure",
  "Test Report",
  "Declaration of Conformity",
  "Other",
];

export function ProductDocuments({
  productId,
  initialDocs,
}: {
  productId: string;
  initialDocs: ProductDoc[];
}) {
  const router = useRouter();
  const [docs, setDocs] = useState(initialDocs);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", docType: DOC_TYPES[0], fileUrl: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function addDoc() {
    if (!form.name.trim() || !form.fileUrl.trim()) {
      setError("Name and URL are required.");
      return;
    }
    setLoading(true);
    setError("");

    const res = await fetch(`/api/admin/products/${productId}/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setLoading(false);
    if (res.ok) {
      const created = await res.json();
      setDocs((prev) => [...prev, created]);
      setForm({ name: "", docType: DOC_TYPES[0], fileUrl: "" });
      setAdding(false);
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Failed to add document.");
    }
  }

  async function removeDoc(docId: string) {
    const res = await fetch(`/api/admin/products/${productId}/documents/${docId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setDocs((prev) => prev.filter((d) => d.id !== docId));
      router.refresh();
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Product Documents</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Specification sheets, certificates, manuals and other attachments
          </p>
        </div>
        {!adding && (
          <Button size="sm" variant="outline" onClick={() => setAdding(true)} className="gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            Add document
          </Button>
        )}
      </div>

      {/* Existing docs */}
      {docs.length > 0 ? (
        <div className="space-y-2 mb-4">
          {docs.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg bg-slate-50"
            >
              <FileText className="w-4 h-4 text-[#1e3a5f] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{doc.name}</p>
                <p className="text-xs text-slate-500">{doc.docType}</p>
              </div>
              <a
                href={doc.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 text-slate-400 hover:text-[#1e3a5f] rounded"
                title="Open document"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                onClick={() => removeDoc(doc.id)}
                className="p-1.5 text-slate-400 hover:text-red-600 rounded"
                title="Remove document"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        !adding && (
          <p className="text-sm text-slate-400 mb-4">No documents attached yet.</p>
        )
      )}

      {/* Add document form */}
      {adding && (
        <div className="border border-slate-200 rounded-lg p-4 bg-white space-y-3">
          <p className="text-sm font-semibold text-slate-800">Add document</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Document name <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="e.g. CE Certificate 2025"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Document type <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30"
                value={form.docType}
                onChange={(e) => setForm({ ...form, docType: e.target.value })}
              >
                {DOC_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              URL <span className="text-red-500">*</span>
              <span className="text-slate-400 font-normal ml-1">(link to the file, e.g. Google Drive, Dropbox, or direct PDF URL)</span>
            </label>
            <Input
              type="url"
              placeholder="https://…"
              value={form.fileUrl}
              onChange={(e) => setForm({ ...form, fileUrl: e.target.value })}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <Button size="sm" onClick={addDoc} disabled={loading}>
              {loading ? "Adding…" : "Add"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => { setAdding(false); setError(""); setForm({ name: "", docType: DOC_TYPES[0], fileUrl: "" }); }}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
