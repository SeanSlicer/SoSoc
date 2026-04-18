"use client";
import { useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";

export default function LoginForm() {
  const [input, setInput] = useState({ usernameOrEmail: "", password: "" });
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInput((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsPending(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Login failed");
        return;
      }
      window.location.href = "/feed";
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <div className="rounded-2xl bg-white dark:bg-neutral-900 p-8 shadow-sm border border-neutral-200 dark:border-neutral-700">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Welcome back</h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Sign in to your account</p>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          {error && (
            <div className="rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              Username or Email
            </label>
            <input
              name="usernameOrEmail"
              type="text"
              autoComplete="username"
              required
              value={input.usernameOrEmail}
              onChange={handleChange}
              className={`w-full rounded-xl border bg-white dark:bg-neutral-800 px-3.5 py-2.5 text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:ring-2 focus:outline-none transition-colors ${
                error
                  ? "border-red-400 dark:border-red-600 focus:border-red-400 focus:ring-red-500/20"
                  : "border-neutral-200 dark:border-neutral-700 focus:border-indigo-500 focus:ring-indigo-500/20"
              }`}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Password</label>
              <Link href="/forgot-password" className="text-xs font-medium text-indigo-600 hover:text-indigo-500">
                Forgot password?
              </Link>
            </div>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={input.password}
              onChange={handleChange}
              className={`w-full rounded-xl border bg-white dark:bg-neutral-800 px-3.5 py-2.5 text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:ring-2 focus:outline-none transition-colors ${
                error
                  ? "border-red-400 dark:border-red-600 focus:border-red-400 focus:ring-red-500/20"
                  : "border-neutral-200 dark:border-neutral-700 focus:border-indigo-500 focus:ring-indigo-500/20"
              }`}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-indigo-600 hover:text-indigo-500">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
