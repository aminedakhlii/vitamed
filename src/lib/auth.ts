import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { getSupabase } from "./db";
import type { NotificationType, Role } from "./types";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "charles-platform-dev-secret"
);

export const COOKIE_NAME = "charles_session";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  language: string;
  country: string | null;
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(user: SessionUser) {
  const token = await new SignJWT({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    language: user.language,
    country: user.country,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(SECRET);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SECRET);
    return {
      id: payload.id as string,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as Role,
      language: payload.language as string,
      country: (payload.country as string) ?? null,
    };
  } catch {
    return null;
  }
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
  const { data, error } = await getSupabase()
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
