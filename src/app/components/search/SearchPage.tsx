"use client";
import { useState } from "react";
import { Search } from "lucide-react";
import { api } from "~/trpc/react";
import Avatar from "~/app/components/ui/Avatar";
import Link from "next/link";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Simple debounce via timeout ref
  const handleChange = (value: string) => {
    setQuery(value);
    const timer = setTimeout(() => setDebouncedQuery(value), 300);
    return () => clearTimeout(timer);
  };

  const { data: results, isFetching } = api.user.search.useQuery(
    { query: debouncedQuery },
    { enabled: debouncedQuery.trim().length > 0 },
  );

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <div className="sticky top-0 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm pb-4 z-10">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Search people…"
            className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 py-2.5 pl-9 pr-4 text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:border-indigo-400 focus:bg-white dark:focus:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors"
          />
        </div>
      </div>

      {isFetching && (
        <div className="flex justify-center py-8">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        </div>
      )}

      {!isFetching && results?.length === 0 && debouncedQuery.trim() && (
        <p className="py-8 text-center text-sm text-neutral-500">No results for &ldquo;{debouncedQuery}&rdquo;</p>
      )}

      {results && results.length > 0 && (
        <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {results.map((user) => (
            <li key={user.id}>
              <Link
                href={`/profile/${user.username}`}
                className="flex items-center gap-3 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-xl px-2 transition-colors"
              >
                <Avatar user={user} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    {user.displayName ?? user.username}
                    {user.isPrivate && (
                      <span className="ml-1.5 text-xs font-normal text-neutral-400">Private</span>
                    )}
                  </p>
                  <p className="truncate text-xs text-neutral-500">@{user.username}</p>
                </div>
                <span className="text-xs text-neutral-400 shrink-0">
                  {user._count.followers} followers
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {!debouncedQuery.trim() && (
        <p className="py-12 text-center text-sm text-neutral-400">Search for people by name or username</p>
      )}
    </div>
  );
}
