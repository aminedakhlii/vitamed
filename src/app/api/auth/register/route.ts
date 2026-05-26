import { NextResponse } from "next/server";
import { createAdminClient, createAuthRouteClient } from "@/lib/supabase/server";
import { roleDashboardPath } from "@/lib/auth";
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

    const admin = createAdminClient();
    const { data: existing } = await admin
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
      passwordHash: null,
      name: data.name,
      role: "CLIENT" as Role,
      company: data.company ?? null,
      country: data.country ?? null,
      language: data.language,
      phone: null,
      createdAt: now,
      updatedAt: now,
    };

    const authClient = await createAuthRouteClient();
    const { error: authError } = await authClient.auth.signUp({
      email: data.email,
      password: data.password,
    });
    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const { error } = await admin.from("User").insert(user);
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

    return NextResponse.json({
      user: sessionUser,
      redirect: roleDashboardPath(user.role),
    });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
