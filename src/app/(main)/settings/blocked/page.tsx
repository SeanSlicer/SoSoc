"use client";
import { api } from "~/trpc/react";
import Avatar from "~/app/components/ui/Avatar";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function BlockedUsersPage() {
  const utils = api.useUtils();
  const { data: blocked, isLoading } = api.user.getBlockedUsers.useQuery();
  const { mutate: unblock } = api.user.unblock.useMutation({
    onSuccess: () => void utils.user.getBlockedUsers.invalidate(),
  });

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900">
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm border-b border-neutral-100 dark:border-neutral-800 px-4 py-3 flex items-center gap-3">
        <Link href="/settings" className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-bold text-neutral-900 dark:text-neutral-100">Blocked accounts</h1>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        </div>
      )}

      {!isLoading && blocked?.length === 0 && (
        <p className="px-4 py-12 text-center text-sm text-neutral-500 dark:text-neutral-400">
          You haven&apos;t blocked anyone.
        </p>
      )}

      <ul>
        {blocked?.map((user) => (
          <li
            key={user.id}
            className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 dark:border-neutral-800"
          >
            <Link href={`/profile/${user.username}`} className="flex items-center gap-3 min-w-0">
              <Avatar user={user} size="sm" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                  {user.displayName ?? user.username}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">@{user.username}</p>
              </div>
            </Link>
            <button
              onClick={() => unblock({ userId: user.id })}
              className="ml-3 shrink-0 rounded-xl border border-neutral-200 dark:border-neutral-700 px-3 py-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              Unblock
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
