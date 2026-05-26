import { ORDER_STATUS_FLOW, ORDER_STATUS_LABELS } from "@/lib/constants";
import type { OrderStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export function OrderTimeline({
  currentStatus,
  history,
}: {
  currentStatus: OrderStatus;
  history: { status: OrderStatus; note?: string | null; createdAt: Date }[];
}) {
  const currentIdx = ORDER_STATUS_FLOW.indexOf(currentStatus);

  return (
    <div className="space-y-0">
      {ORDER_STATUS_FLOW.map((status, idx) => {
        const done = idx <= currentIdx;
        const active = idx === currentIdx;
        const entry = history.find((h) => h.status === status);

        return (
          <div key={status} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center border-2 shrink-0",
                  done
                    ? "bg-[#1e3a5f] border-[#1e3a5f] text-white"
                    : "bg-white border-slate-200 text-slate-300"
                )}
              >
                {done && <Check className="w-4 h-4" />}
              </div>
              {idx < ORDER_STATUS_FLOW.length - 1 && (
                <div className={cn("w-0.5 flex-1 min-h-8", done ? "bg-[#1e3a5f]" : "bg-slate-200")} />
              )}
            </div>
            <div className={cn("pb-6", active && "font-medium")}>
              <p className={cn("text-sm", done ? "text-slate-900" : "text-slate-400")}>
                {ORDER_STATUS_LABELS[status]}
              </p>
              {entry?.note && <p className="text-xs text-slate-500 mt-0.5">{entry.note}</p>}
              {entry && (
                <p className="text-xs text-slate-400 mt-0.5">
                  {new Date(entry.createdAt).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
