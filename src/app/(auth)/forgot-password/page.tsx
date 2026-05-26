"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-8">
      <h1 className="text-xl font-bold text-slate-900 text-center">Reset password</h1>
      <p className="text-sm text-slate-500 text-center mt-1 mb-6">
        Enter your email and we will send reset instructions
      </p>

      {sent ? (
        <div className="text-center">
          <p className="text-sm text-slate-600">
            If an account exists for <strong>{email}</strong>, you will receive reset instructions shortly.
          </p>
          <Link href="/login" className="mt-4 inline-block text-sm text-[#1e3a5f] hover:underline">
            Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email address</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full">
            Send reset link
          </Button>
          <p className="text-center">
            <Link href="/login" className="text-sm text-[#1e3a5f] hover:underline">
              Back to sign in
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}
