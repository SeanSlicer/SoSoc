"use client";
import { Lock } from "lucide-react";
import Modal from "~/app/components/ui/Modal";
import { api } from "~/trpc/react";
import Avatar from "~/app/components/ui/Avatar";
import Link from "next/link";

type Props = {
  username: string;
  mode: "followers" | "following";
  isOpen: boolean;
  onClose: () => void;
};

export default function FollowListModal({ username, mode, isOpen, onClose }: Props) {
  const followersQuery = api.user.getFollowers.useQuery(
    { username },
    { enabled: isOpen && mode === "followers" },
  );
  const followingQuery = api.user.getFollowing.useQuery(
    { username },
    { enabled: isOpen && mode === "following" },
  );

  const result = mode === "followers" ? followersQuery.data : followingQuery.data;
  const isLoading = mode === "followers" ? followersQuery.isLoading : followingQuery.isLoading;

  const title = mode === "followers" ? "Followers" : "Following";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        </div>
      )}

      {result?.hidden && (
        <div className="flex flex-col items-center gap-2 py-8 text-neutral-400">
          <Lock size={24} />
          <p className="text-sm">This list is private</p>
        </div>
      )}

      {result && !result.hidden && result.list.length === 0 && (
        <p className="py-8 text-center text-sm text-neutral-400">
          {mode === "followers" ? "No followers yet" : "Not following anyone yet"}
        </p>
      )}

      {result && !result.hidden && result.list.length > 0 && (
        <ul className="divide-y divide-neutral-100 -mx-4">
          {result.list.map((user) => (
            <li key={user.id}>
              <Link
                href={`/profile/${user.username}`}
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 transition-colors"
              >
                <Avatar user={user} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-neutral-900">
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
    </Modal>
  );
}
