import Link from "next/link";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Package, Truck, Bot, BarChart3, Shield } from "lucide-react";

export default async function HomePage() {
  const session = await getSession();
  if (session) {
    const dest =
      session.role === "ADMIN"
        ? "/dashboard/admin"
        : session.role === "SALES"
          ? "/dashboard/sales"
          : "/dashboard/client";
    redirect(dest);
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-[#1e3a5f] text-white flex items-center justify-center font-bold text-sm">
              CP
            </div>
            <span className="font-semibold text-[#1e3a5f]">Charles Platform</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="outline" size="sm">
                Sign in
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Register</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-[#1e3a5f] uppercase tracking-wider mb-3">
            Enterprise Client & Product Management
          </p>
          <h1 className="text-4xl font-bold text-slate-900 leading-tight">
            Automate sales operations. Centralize orders. Delight your clients.
          </h1>
          <p className="mt-4 text-lg text-slate-600 leading-relaxed">
            An AI-supported platform for product catalogs, quotations, order tracking,
            shipping coordination, and after-sales service — built for global B2B teams.
          </p>
          <div className="mt-8 flex gap-4">
            <Link href="/register">
              <Button size="lg">Get started</Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg">
                Client portal sign in
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-16 grid md:grid-cols-3 gap-6">
          {[
            { icon: Package, title: "Product Catalog", desc: "Centralized product data, documents, and country-based pricing." },
            { icon: Truck, title: "Order Tracking", desc: "Real-time visibility from quotation through delivery." },
            { icon: Bot, title: "AI Follow-ups", desc: "Automated client reminders and smart sales prioritization." },
            { icon: BarChart3, title: "Analytics", desc: "Executive dashboards for orders, revenue, and performance." },
            { icon: Shield, title: "Role-Based Access", desc: "Secure portals for admins, sales teams, and clients." },
          ].map((f) => (
            <div key={f.title} className="p-6 border border-slate-200 rounded-lg">
              <f.icon className="w-8 h-8 text-[#1e3a5f] mb-3" />
              <h3 className="font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-200 py-6 text-center text-sm text-slate-500">
        © 2026 Charles Platform. All rights reserved.
      </footer>
    </div>
  );
}
