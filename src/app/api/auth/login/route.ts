import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabase/server";
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

    const { error: signInError } = await supabase.auth.signInWithPassword({
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

    const response = NextResponse.json({
      user: sessionUser,
      redirect: roleDashboardPath(user.role as Role),
    });
    authCookies.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options);
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
