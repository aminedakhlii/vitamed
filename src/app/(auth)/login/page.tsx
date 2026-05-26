import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { AuthDebugPanel } from "@/components/auth/auth-debug-panel";
import { getSession, roleDashboardPath, safeRedirectPath } from "@/lib/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; error?: string }>;
}) {
  const { from, error } = await searchParams;
  const session = await getSession();

  if (session) {
    const destination = safeRedirectPath(from, roleDashboardPath(session.role));
    console.log("[auth:login-page]", {
      email: session.email,
      role: session.role,
      from: from ?? null,
      destination,
      action: "already-signed-in-redirect",
    });
    redirect(destination);
  }

  return (
    <>
      <LoginForm from={from} error={error} />
      <AuthDebugPanel from={from} />
    </>
  );
}
