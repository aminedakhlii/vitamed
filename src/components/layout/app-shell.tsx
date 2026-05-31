import { headers } from "next/headers";
import { getSession } from "@/lib/auth";
import { getSupabase } from "@/lib/db";
import { redirect } from "next/navigation";
import { Sidebar } from "./sidebar";
import { SupabaseAuthListener } from "@/components/supabase-auth-listener";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) {
    const headersList = await headers();
    const pathname = headersList.get("x-pathname");
    if (pathname) {
      redirect(`/login?from=${encodeURIComponent(pathname)}`);
    }
    redirect("/login");
  }

  const { count: unreadCount } = await getSupabase()
    .from("Notification")
    .select("*", { count: "exact", head: true })
    .eq("userId", session.id)
    .eq("read", false);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <SupabaseAuthListener />
      <Sidebar role={session.role} userName={session.name} unreadNotifications={unreadCount ?? 0} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div />
          <div className="flex items-center gap-4 text-sm text-slate-600">
            <span className="capitalize px-2 py-0.5 bg-slate-100 rounded text-xs font-medium">
              {session.role.toLowerCase()}
            </span>
            <span>{session.email}</span>
          </div>
        </header>
        <main className="flex-1 p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
