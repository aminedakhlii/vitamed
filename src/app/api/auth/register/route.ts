import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/db";
import { createSession, hashPassword, roleDashboardPath } from "@/lib/auth";
import { newId, nowIso } from "@/lib/id";
import type { Role } from "@/lib/types";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  company: z.string().optional(),
  country: z.string().optional(),
  language: z.string().default("en"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = schema.parse(body);

    const { data: existing } = await getSupabase()
      .from("User")
      .select("id")
      .eq("email", data.email)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const now = nowIso();
    const user = {
      id: newId(),
      email: data.email,
      passwordHash: await hashPassword(data.password),
      name: data.name,
      role: "CLIENT" as Role,
      company: data.company ?? null,
      country: data.country ?? null,
      language: data.language,
      phone: null,
      createdAt: now,
      updatedAt: now,
    };

    const { error } = await getSupabase().from("User").insert(user);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const sessionUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      language: user.language,
      country: user.country,
    };

    await createSession(sessionUser);

    return NextResponse.json({
      user: sessionUser,
      redirect: roleDashboardPath(user.role),
    });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
