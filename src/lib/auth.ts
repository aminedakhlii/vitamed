import { createAdminClient, createAuthServerClient } from "./supabase/server";
import type { NotificationType, Role } from "./types";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  language: string;
  country: string | null;
};

export async function getSession(): Promise<SessionUser | null> {
  const authClient = await createAuthServerClient();
  const {
    data: { user: authUser },
  } = await authClient.auth.getUser();

  if (!authUser?.email) return null;

  const { data: appUser } = await createAdminClient()
    .from("User")
    .select("id, email, name, role, language, country")
    .eq("email", authUser.email)
    .maybeSingle();

  if (!appUser) return null;

  return {
    id: appUser.id,
    email: appUser.email,
    name: appUser.name,
    role: appUser.role as Role,
    language: appUser.language,
    country: appUser.country,
  };
}

export async function requireSession(roles?: Role[]) {
  const session = await getSession();
  if (!session) return null;
  if (roles && !roles.includes(session.role)) return null;
  return session;
}

export function roleDashboardPath(role: Role) {
  switch (role) {
    case "ADMIN":
      return "/dashboard/admin";
    case "SALES":
      return "/dashboard/sales";
    default:
      return "/dashboard/client";
  }
}

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: NotificationType = "SYSTEM"
) {
  const { data, error } = await createAdminClient()
    .from("Notification")
    .insert({
      id: crypto.randomUUID(),
      userId,
      title,
      message,
      type,
      read: false,
      createdAt: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}
