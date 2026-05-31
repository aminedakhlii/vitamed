"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  link: string | null;
  createdAt: string;
};

export function NotificationList({ initial }: { initial: Notification[] }) {
  const router = useRouter();
  const [notifications, setNotifications] = useState(initial);

  async function markRead(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setNotifications((n) => n.map((x) => (x.id === id ? { ...x, read: true } : x)));
  }

  async function handleClick(n: Notification) {
    if (!n.read) {
      await markRead(n.id);
      router.refresh();
    }
    if (n.link) {
      router.push(n.link);
    }
  }

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    });
    setNotifications((n) => n.map((x) => ({ ...x, read: true })));
    router.refresh();
  }

  const typeVariant: Record<string, "default" | "info" | "warning" | "success"> = {
    ORDER: "info",
    SHIPPING: "success",
    PAYMENT: "warning",
    COMPLAINT: "warning",
    FOLLOW_UP: "info",
    SYSTEM: "default",
  };

  const typeLabel: Record<string, string> = {
    ORDER: "Order",
    SHIPPING: "Shipping",
    PAYMENT: "Payment",
    COMPLAINT: "Support",
    FOLLOW_UP: "Follow-up",
    SYSTEM: "System",
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button variant="outline" size="sm" onClick={markAllRead}>
          Mark all as read
        </Button>
      </div>
      <div className="space-y-3">
        {notifications.map((n) => {
          const clickable = !!n.link;
          return (
            <div
              key={n.id}
              onClick={() => handleClick(n)}
              className={`p-4 border rounded-lg transition-colors ${
                n.read
                  ? "border-slate-100 bg-white"
                  : "border-[#1e3a5f]/20 bg-blue-50/30"
              } ${clickable ? "cursor-pointer hover:border-[#1e3a5f]/40 hover:bg-blue-50/50" : ""}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-slate-900">{n.title}</p>
                    <Badge variant={typeVariant[n.type] || "default"}>
                      {typeLabel[n.type] || n.type}
                    </Badge>
                    {!n.read && <Badge variant="info">New</Badge>}
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{n.message}</p>
                  <p className="text-xs text-slate-400 mt-1">{formatDate(n.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!n.read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); markRead(n.id); }}
                    >
                      Mark read
                    </Button>
                  )}
                  {clickable && (
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
