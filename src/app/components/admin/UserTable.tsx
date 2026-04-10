"use client";
import { useState } from "react";
import { type RouterOutputs } from "~/trpc/react";
import Avatar from "~/app/components/ui/Avatar";

type User = RouterOutputs["admin"]["getUsers"][number];

export default function UserTable({ users }: { users: User[] }) {
  const [impersonating, setImpersonating] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleImpersonate = async (userId: string) => {
    setImpersonating(userId);
    setError("");
    try {
      const res = await fetch("/api/admin/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Failed to impersonate");
        return;
      }
      window.location.href = "/feed";
    } catch {
      setError("Something went wrong");
    } finally {
      setImpersonating(null);
    }
  };

  if (users.length === 0) {
    return (
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 py-16 text-center">
        <p className="text-sm text-neutral-400 dark:text-neutral-500">No users yet</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 overflow-hidden">
      {error && (
        <div className="border-b border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            <th className="px-4 py-3">User</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Role</th>
            <th className="px-4 py-3 text-right">Posts</th>
            <th className="px-4 py-3 text-right">Followers</th>
            <th className="px-4 py-3">Joined</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <Avatar user={user} size="sm" />
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-neutral-100">
                      {user.displayName ?? user.username}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">@{user.username}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">{user.email}</td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    user.role === "ADMIN"
                      ? "bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300"
                      : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                  }`}
                >
                  {user.role}
                </span>
              </td>
              <td className="px-4 py-3 text-right text-neutral-600 dark:text-neutral-400">{user._count.posts}</td>
              <td className="px-4 py-3 text-right text-neutral-600 dark:text-neutral-400">{user._count.followers}</td>
              <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400 text-xs">
                {new Date(user.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => void handleImpersonate(user.id)}
                  disabled={impersonating === user.id}
                  className="rounded-lg border border-neutral-200 dark:border-neutral-700 px-3 py-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950 hover:text-indigo-700 dark:hover:text-indigo-300 disabled:opacity-50 transition-colors"
                >
                  {impersonating === user.id ? "…" : "Log in as"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
