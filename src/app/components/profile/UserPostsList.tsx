"use client";
import { Lock } from "lucide-react";
import { api } from "~/trpc/react";
import PostCard from "~/app/components/feed/PostCard";

type Props = { username: string; currentUserId: string };

export default function UserPostsList({ username, currentUserId }: Props) {
  const { data, isLoading } = api.post.getUserPosts.useQuery({ username });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (data?.locked) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center px-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-neutral-200">
          <Lock size={24} className="text-neutral-400" />
        </div>
        <div>
          <p className="font-semibold text-neutral-800">This account is private</p>
          <p className="mt-1 text-sm text-neutral-500">Follow this account to see their posts.</p>
        </div>
      </div>
    );
  }

  if (!data?.posts.length) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-neutral-400">No posts yet</p>
      </div>
    );
  }

  return (
    <div>
      {data.posts.map((post) => (
        <PostCard key={post.id} post={post} currentUserId={currentUserId} />
      ))}
    </div>
  );
}
