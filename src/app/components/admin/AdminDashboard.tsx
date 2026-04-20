"use client";
import { useState } from "react";
import { api } from "~/trpc/react";
import UserTable from "./UserTable";
import CreateUserForm from "./CreateUserForm";
import RateLimitsTable from "./RateLimitsTable";

type Tab = "users" | "rate-limits";

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("users");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { data: users, isLoading, refetch } = api.admin.getUsers.useQuery();

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex border-b border-neutral-200 dark:border-neutral-800 gap-6">
        {(["users", "rate-limits"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-3 text-sm font-medium capitalize transition-colors ${
              tab === t
                ? "border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
            }`}
          >
            {t === "rate-limits" ? "Rate Limits" : "Users"}
          </button>
        ))}
      </div>

      {tab === "users" && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Users</h1>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                {users?.length ?? "—"} total accounts
              </p>
            </div>
            <button
              onClick={() => setShowCreateForm((v) => !v)}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
            >
              {showCreateForm ? "Cancel" : "+ Create test user"}
            </button>
          </div>

          {showCreateForm && (
            <CreateUserForm
              onCreated={() => {
                void refetch();
                setShowCreateForm(false);
              }}
            />
          )}

          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
            </div>
          ) : (
            <UserTable users={users ?? []} />
          )}
        </>
      )}

      {tab === "rate-limits" && <RateLimitsTable />}
    </div>
  );
}
