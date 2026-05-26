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

  // If already signed in, redirect immediately.
  const session = await getSession();
  if (session) {
    redirect(safeRedirectPath(from, roleDashboardPath(session.role)));
  }

  return (
    <>
      <LoginForm from={from} error={error} />
      <AuthDebugPanel from={from} />
    </>
  );
}
