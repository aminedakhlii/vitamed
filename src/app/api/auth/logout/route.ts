import { NextResponse } from "next/server";
import { createAuthRouteClient } from "@/lib/supabase/server";

async function logout() {
  const authClient = await createAuthRouteClient();
  await authClient.auth.signOut();
  return NextResponse.redirect(new URL("/login", "http://localhost:3000"));
}

export async function POST() {
  return logout();
}

export async function GET() {
  return logout();
}
