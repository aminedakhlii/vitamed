import { createAdminClient, createAuthServerClient } from "./supabase/server";
import type { NotificationType, Role } from "./types";
import type { User } from "@supabase/supabase-js";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  language: string;
  country: string | null;
};

const userSelect = "id, email, name, role, language, country";

function sessionFromRow(row: {
  id: string;
  email: string;
  name: string;
  role: string;
  language: string;
  country: string | null;
}): SessionUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role as Role,
    language: row.language,
    country: row.country,
  };
}

async function profileForAuthUser(authUser: User): Promise<SessionUser | null> {
  const admin = createAdminClient();

  const { data: byId } = await admin
    .from("User")
    .select(userSelect)
    .eq("id", authUser.id)
    .maybeSingle();

  if (byId) return sessionFromRow(byId);

  if (authUser.email) {
    const { data: byEmail } = await admin
      .from("User")
      .select(userSelect)
      .eq("email", authUser.email)
      .maybeSingle();

    if (byEmail) return sessionFromRow(byEmail);
  }

  // Auth user exists but no profile row — use metadata
  const meta = authUser.user_metadata ?? {};
  return {
    id: authUser.id,
    email: authUser.email ?? "",
    name: (meta.name as string) || authUser.email || "Unknown",
    role: (meta.role as Role) || "CLIENT",
    language: (meta.language as string) || "en",
    country: (meta.country as string) ?? null,
  };
}

export async function getSession(): Promise<SessionUser | null> {
  const authClient = await createAuthServerClient();

  // Primary: read from cookie without a network call.
  // This works even when the access token is close to expiry — the browser
  // client (SupabaseAuthListener) will rotate it proactively.
  const {
    data: { session },
  } = await authClient.auth.getSession();

  if (session?.user) {
    return profileForAuthUser(session.user);
  }

  // Fallback: validate with Supabase (this does a network call and can rotate
  // the access token when running in route handlers / server actions).
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) return null;

  return profileForAuthUser(user);
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

/** Safe internal path for post-login redirect (blocks open redirects). */
export function safeRedirectPath(from: string | null | undefined, fallback: string) {
  if (from && from.startsWith("/") && !from.startsWith("//")) {
    return from;
  }
  return fallback;
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
