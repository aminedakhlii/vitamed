import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabase/server";
import { roleDashboardPath } from "@/lib/auth";
import { nowIso } from "@/lib/id";
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

    const cookieStore = await cookies();
    const authCookies: { name: string; value: string; options?: Parameters<typeof cookieStore.set>[2] }[] =
      [];

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
              authCookies.push({ name, value, options });
            });
          },
        },
      }
    );

    const { data: signUpData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
          role: "CLIENT",
          language: data.language,
          country: data.country ?? null,
        },
      },
    });
    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const authUserId = signUpData.user?.id;
    if (!authUserId) {
      return NextResponse.json(
        { error: "Check your email to confirm your account before signing in." },
        { status: 400 }
      );
    }

    const now = nowIso();
    const user = {
      id: authUserId,
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

    const response = NextResponse.json({
      user: sessionUser,
      redirect: roleDashboardPath(user.role),
    });
    authCookies.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options);
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
