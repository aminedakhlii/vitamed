"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEMO_USERS } from "@/lib/constants";

export function LoginForm({
  from,
  error,
}: {
  from?: string;
  error?: string;
}) {
  function fillDemo(demoEmail: string, demoPassword: string) {
    const emailInput = document.getElementById("login-email") as HTMLInputElement | null;
    const passwordInput = document.getElementById("login-password") as HTMLInputElement | null;
    if (emailInput) emailInput.value = demoEmail;
    if (passwordInput) passwordInput.value = demoPassword;
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-8">
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded bg-[#1e3a5f] text-white flex items-center justify-center font-bold mx-auto mb-4">
          CP
        </div>
        <h1 className="text-xl font-bold text-slate-900">Sign in to Charles Platform</h1>
        <p className="text-sm text-slate-500 mt-1">Enter your credentials to access your portal</p>
        {from ? (
          <p className="text-xs text-slate-400 mt-2">
            After sign-in you will return to <span className="font-mono">{from}</span>
          </p>
        ) : null}
      </div>

      <form action="/api/auth/login" method="POST" className="space-y-4">
        {from ? <input type="hidden" name="from" value={from} /> : null}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="login-email">
            Email address
          </label>
          <Input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="login-password">
            Password
          </label>
          <Input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Button type="submit" className="w-full">
          Sign in
        </Button>
      </form>

      <div className="mt-4 text-center">
        <Link href="/forgot-password" className="text-sm text-[#1e3a5f] hover:underline">
          Forgot password?
        </Link>
      </div>

      <p className="mt-6 text-center text-sm text-slate-500">
        No account?{" "}
        <Link href="/register" className="text-[#1e3a5f] font-medium hover:underline">
          Register
        </Link>
      </p>

      <div className="mt-6 pt-6 border-t border-slate-100">
        <p className="text-xs text-slate-500 mb-2 text-center">Demo accounts</p>
        <div className="flex flex-col gap-1.5">
          {DEMO_USERS.map((u) => (
            <button
              key={u.email}
              type="button"
              onClick={() => fillDemo(u.email, u.password)}
              className="text-xs text-left px-3 py-2 rounded border border-slate-200 hover:bg-slate-50 text-slate-600"
            >
              <span className="font-medium capitalize">{u.role.toLowerCase()}</span> — {u.email}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
