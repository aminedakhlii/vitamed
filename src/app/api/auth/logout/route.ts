import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";

async function logout() {
  await destroySession();
  return NextResponse.redirect(new URL("/login", "http://localhost:3000"));
}

export async function POST() {
  return logout();
}

export async function GET() {
  return logout();
}
