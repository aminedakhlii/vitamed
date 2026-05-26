import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabase/server";
import { roleDashboardPath, safeRedirectPath } from "@/lib/auth";
import type { Role } from "@/lib/types";

function loginErrorRedirect(request: Request, message: string, from?: string) {
  const url = new URL("/login", request.url);
  url.searchParams.set("error", message);
  if (from) url.searchParams.set("from", from);
  return NextResponse.redirect(url, { status: 303 });
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  let email: string;
  let password: string;
  let from = "";

  if (contentType.includes("application/json")) {
    try {
      const body = await request.json();
      email = String(body.email ?? "").trim();
      password = String(body.password ?? "");
      from = String(body.from ?? "");
    } catch {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
  } else {
    const formData = await request.formData();
    email = String(formData.get("email") ?? "").trim();
    password = String(formData.get("password") ?? "");
    from = String(formData.get("from") ?? "");
  }

  if (!email || !password) {
    if (contentType.includes("application/json")) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }
    return loginErrorRedirect(request, "Email and password are required", from);
  }

  const cookieStore = await cookies();
  const authCookies: {
    name: string;
    value: string;
    options?: Parameters<typeof cookieStore.set>[2];
  }[] = [];

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
    if (contentType.includes("application/json")) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }
    return loginErrorRedirect(request, "Invalid email or password", from);
  }

  const { data: user } = await createAdminClient()
    .from("User")
    .select("id, email, name, role, language, country")
    .eq("email", email)
    .maybeSingle();

  if (!user) {
    if (contentType.includes("application/json")) {
      return NextResponse.json({ error: "User profile missing" }, { status: 400 });
    }
    return loginErrorRedirect(request, "User profile missing in database", from);
  }

  const role = user.role as Role;
  const destination = safeRedirectPath(from, roleDashboardPath(role));

  console.log("[auth:login]", {
    email,
    role,
    from: from || null,
    destination,
    cookieCount: authCookies.length,
  });

  if (contentType.includes("application/json")) {
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role,
        language: user.language,
        country: user.country,
      },
      redirect: destination,
    });
    authCookies.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options);
    });
    return response;
  }

  const response = NextResponse.redirect(new URL(destination, request.url), {
    status: 303,
  });
  authCookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });
  return response;
}
