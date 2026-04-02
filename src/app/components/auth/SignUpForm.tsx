"use client";
import { useState, type ChangeEvent } from "react";
import Link from "next/link";
import { api } from "~/trpc/react";
import type { SignUp } from "~/validation/auth/auth";

export default function SignUpForm() {
  const [formData, setFormData] = useState<SignUp>({
    username: "",
    email: "",
    password: "",
  });

  const {
    mutate: signUp,
    isPending,
    error,
  } = api.user.signUp.useMutation({
    onSuccess: () => { window.location.href = "/feed"; },
  });

  const fieldErrors = error?.data?.zodError?.fieldErrors;

  const hasErrors = !!fieldErrors && Object.keys(fieldErrors).length > 0;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="w-full max-w-sm">
      <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-neutral-900">Join sosoc</h1>
          <p className="mt-1 text-sm text-neutral-500">Create your account</p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void signUp(formData);
          }}
          className="space-y-4"
        >
          {hasErrors && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              <ul className="list-disc space-y-1 pl-5">
                {Object.entries(fieldErrors).flatMap(([field, messages]) =>
                  (messages ?? []).map((msg, i) => (
                    <li key={`${field}-${i}`}>
                      <span className="font-medium capitalize">{field}:</span>{" "}
                      {msg}
                    </li>
                  )),
                )}
              </ul>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">
              Username
            </label>
            <input
              name="username"
              type="text"
              autoComplete="username"
              required
              value={formData.username}
              onChange={handleChange}
              className="w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
              placeholder="yourname"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">
              Email
            </label>
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">
              Password
            </label>
            <input
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
              placeholder="Min 8 chars, 1 uppercase, 1 number"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-500">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
