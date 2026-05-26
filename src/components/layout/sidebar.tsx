"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Role } from "@prisma/client";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  FileText,
  Truck,
  Bell,
  Headphones,
  Users,
  Bot,
  BarChart3,
  Settings,
  LogOut,
  Boxes,
} from "lucide-react";

type NavItem = { href: string; label: string; icon: React.ElementType };

const navByRole: Record<Role, NavItem[]> = {
  ADMIN: [
    { href: "/dashboard/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/admin/products", label: "Manage Products", icon: Package },
    { href: "/catalog", label: "Catalog", icon: Boxes },
    { href: "/orders", label: "All Orders", icon: Truck },
    { href: "/quotations", label: "Quotations", icon: FileText },
    { href: "/support", label: "Support Tickets", icon: Headphones },
    { href: "/follow-ups", label: "AI Follow-ups", icon: Bot },
    { href: "/notifications", label: "Notifications", icon: Bell },
    { href: "/dashboard/admin/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/profile", label: "Settings", icon: Settings },
  ],
  SALES: [
    { href: "/dashboard/sales", label: "Overview", icon: LayoutDashboard },
    { href: "/catalog", label: "Products", icon: Package },
    { href: "/orders", label: "Orders", icon: Truck },
    { href: "/quotations", label: "Quotations", icon: FileText },
    { href: "/support", label: "Support", icon: Headphones },
    { href: "/follow-ups", label: "Follow-ups", icon: Bot },
    { href: "/notifications", label: "Notifications", icon: Bell },
    { href: "/profile", label: "Profile", icon: Settings },
  ],
  CLIENT: [
    { href: "/dashboard/client", label: "Overview", icon: LayoutDashboard },
    { href: "/catalog", label: "Catalog", icon: Package },
    { href: "/cart", label: "Cart", icon: ShoppingCart },
    { href: "/orders", label: "My Orders", icon: Truck },
    { href: "/quotations", label: "Quotations", icon: FileText },
    { href: "/support", label: "Support", icon: Headphones },
    { href: "/notifications", label: "Notifications", icon: Bell },
    { href: "/profile", label: "Profile", icon: Settings },
  ],
};

export function Sidebar({ role, userName }: { role: Role; userName: string }) {
  const pathname = usePathname();
  const items = navByRole[role];

  return (
    <aside className="w-64 min-h-screen bg-[#1e3a5f] text-white flex flex-col shrink-0">
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-white/10 flex items-center justify-center font-bold text-sm">
            CP
          </div>
          <div>
            <p className="font-semibold text-sm leading-tight">Charles Platform</p>
            <p className="text-xs text-white/60">Client & Product Management</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-colors",
                active
                  ? "bg-white/15 text-white font-medium"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
        {role === "ADMIN" && (
          <Link
            href="/dashboard/admin/users"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-colors",
              pathname.startsWith("/dashboard/admin/users")
                ? "bg-white/15 text-white font-medium"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            )}
          >
            <Users className="w-4 h-4" />
            Users
          </Link>
        )}
      </nav>

      <div className="px-4 py-4 border-t border-white/10">
        <p className="text-xs text-white/50 mb-1">Signed in as</p>
        <p className="text-sm font-medium truncate">{userName}</p>
        <Link
          href="/api/auth/logout"
          className="flex items-center gap-2 text-xs text-white/60 hover:text-white transition-colors mt-3"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </Link>
      </div>
    </aside>
  );
}
