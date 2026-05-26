import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const publicPaths = ["/", "/login", "/register", "/forgot-password"];
const authPaths = ["/login", "/register", "/forgot-password"];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // IMPORTANT: only set cookies on the response.
          // Mutating request cookies is not reliable in middleware.
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  const { pathname } = request.nextUrl;
  const isPublic = publicPaths.some(
    (p) => pathname === p || pathname.startsWith("/api/auth")
  );
  const isAuthPage = authPaths.includes(pathname);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard/client", request.url));
  }

  if (!user && !isPublic) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
