"use client";
import { useState } from "react";
import { api } from "~/trpc/react";
import UserTable from "./UserTable";
import CreateUserForm from "./CreateUserForm";

export default function AdminDashboard() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { data: users, isLoading, refetch } = api.admin.getUsers.useQuery();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Users</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
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
    </div>
  );
}
