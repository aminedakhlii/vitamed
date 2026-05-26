import { NextResponse } from "next/server";
import { createAdminClient, createAuthRouteClient } from "@/lib/supabase/server";
import { roleDashboardPath } from "@/lib/auth";
import type { Role } from "@/lib/types";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = schema.parse(body);

    const authClient = await createAuthRouteClient();
    const { error: signInError } = await authClient.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const { data: user } = await createAdminClient()
      .from("User")
      .select("id, email, name, role, language, country")
      .eq("email", email)
      .maybeSingle();
    if (!user) {
      return NextResponse.json({ error: "User profile missing" }, { status: 400 });
    }

    const sessionUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as Role,
      language: user.language,
      country: user.country,
    };

    return NextResponse.json({
      user: sessionUser,
      redirect: roleDashboardPath(user.role as Role),
    });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
