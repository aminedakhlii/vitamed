"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEMO_USERS } from "@/lib/constants";
import { createBrowserClient } from "@/lib/supabase/client";

export function LoginForm({ from, error: initialError }: { from?: string; error?: string }) {
  const [error, setError] = useState(initialError ?? "");
  const [loading, setLoading] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  function fillDemo(demoEmail: string, demoPassword: string) {
    if (emailRef.current) emailRef.current.value = demoEmail;
    if (passwordRef.current) passwordRef.current.value = demoPassword;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = emailRef.current?.value?.trim() ?? "";
    const password = passwordRef.current?.value ?? "";

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const supabase = createBrowserClient();

      // Sign in via Supabase browser client — it writes the session cookies
      // directly to document.cookie. No server round-trip for auth.
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError("Invalid email or password.");
        setLoading(false);
        return;
      }

      // Fetch role from server now that cookies are set in the browser.
      let destination = from && from.startsWith("/") && !from.startsWith("//")
        ? from
        : null;

      if (!destination) {
        try {
          const resp = await fetch("/api/auth/role");
          if (resp.ok) {
            const data = await resp.json();
            destination = data.redirect ?? "/dashboard/client";
          } else {
            destination = "/dashboard/client";
          }
        } catch {
          destination = "/dashboard/client";
        }
      }

      // Hard navigation ensures the new cookies are sent with the request.
      window.location.href = destination ?? "/dashboard/client";
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-8">
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded bg-[#1e3a5f] text-white flex items-center justify-center font-bold mx-auto mb-4">
          CP
        </div>
        <h1 className="text-xl font-bold text-slate-900">Sign in to Charles Platform</h1>
        <p className="text-sm text-slate-500 mt-1">Enter your credentials to access your portal</p>
        {from && (
          <p className="text-xs text-slate-400 mt-2">
            You will be redirected to <span className="font-mono">{from}</span> after sign-in.
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="login-email">
            Email address
          </label>
          <Input
            id="login-email"
            ref={emailRef}
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
            ref={passwordRef}
            type="password"
            autoComplete="current-password"
            required
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
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
