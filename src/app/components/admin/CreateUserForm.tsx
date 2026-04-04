"use client";
import { useState } from "react";
import { api } from "~/trpc/react";

type Props = { onCreated: () => void };

export default function CreateUserForm({ onCreated }: Props) {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "USER" as "USER" | "ADMIN",
  });
  const [fieldError, setFieldError] = useState("");

  const { mutate: createUser, isPending, error } = api.admin.createUser.useMutation({
    onSuccess: () => {
      setForm({ username: "", email: "", password: "", role: "USER" });
      onCreated();
    },
    onError: (err) => setFieldError(err.message),
  });

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6">
      <h2 className="mb-5 text-base font-semibold text-neutral-900">Create test user</h2>

      {(error ?? fieldError) && (
        <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {fieldError || error?.message}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">Username</label>
          <input
            type="text"
            value={form.username}
            onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
            className="w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors"
            placeholder="testuser"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors"
            placeholder="test@example.com"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">Password</label>
          <input
            type="text"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            className="w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors"
            placeholder="Min 8 characters"
          />
          <p className="mt-1 text-xs text-neutral-400">Shown in plain text for easy testing</p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">Role</label>
          <select
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as "USER" | "ADMIN" }))}
            className="w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors bg-white"
          >
            <option value="USER">USER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </div>
      </div>

      <div className="mt-5 flex justify-end">
        <button
          onClick={() => createUser(form)}
          disabled={isPending || !form.username || !form.email || !form.password}
          className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? "Creating…" : "Create user"}
        </button>
      </div>
    </div>
  );
}
