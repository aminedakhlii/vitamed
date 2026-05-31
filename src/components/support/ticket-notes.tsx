"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Check, Pencil } from "lucide-react";

export function TicketNotes({
  ticketId,
  initialNotes,
}: {
  ticketId: string;
  initialNotes: string | null;
}) {
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(notes);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function startEdit() {
    setDraft(notes);
    setEditing(true);
    setTimeout(() => textareaRef.current?.focus(), 0);
  }

  async function save() {
    if (draft === notes) { setEditing(false); return; }
    setSaving(true);
    const res = await fetch(`/api/support/${ticketId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: draft }),
    });
    setSaving(false);
    if (res.ok) {
      setNotes(draft);
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  function cancel() {
    setDraft(notes);
    setEditing(false);
  }

  return (
    <div>
      {editing ? (
        <div className="space-y-3">
          <textarea
            ref={textareaRef}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30"
            rows={6}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add internal notes, actions taken, client communication history…"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={save} disabled={saving} className="gap-1.5">
              <Check className="w-3.5 h-3.5" />
              {saving ? "Saving…" : "Save"}
            </Button>
            <Button size="sm" variant="outline" onClick={cancel} disabled={saving}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div
          className="group relative cursor-text rounded-lg"
          onClick={startEdit}
        >
          {notes ? (
            <div className="px-3 py-2 border border-transparent rounded-lg hover:border-slate-200 hover:bg-slate-50 transition-colors">
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {notes}
              </p>
              <div className="flex items-center gap-1.5 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Pencil className="w-3 h-3 text-slate-400" />
                <span className="text-xs text-slate-400">Click to edit</span>
                {saved && <span className="text-xs text-emerald-600 ml-2">Saved ✓</span>}
              </div>
            </div>
          ) : (
            <div className="px-3 py-3 border border-dashed border-slate-300 rounded-lg hover:border-[#1e3a5f]/40 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-2 text-slate-400">
                <Pencil className="w-3.5 h-3.5" />
                <span className="text-sm">Click to add internal notes…</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
