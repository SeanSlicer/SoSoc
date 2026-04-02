"use client";
import { api } from "~/trpc/react";
import PostCard from "~/app/components/feed/PostCard";

type Props = { username: string; currentUserId: string };

export default function UserPostsList({ username, currentUserId }: Props) {
  const { data: posts, isLoading } = api.post.getUserPosts.useQuery({ username });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (!posts?.length) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-neutral-400">No posts yet</p>
      </div>
    );
  }

  return (
    <div>
      {posts.map((post) => (
        <PostCard key={post.id} post={post} currentUserId={currentUserId} />
      ))}
    </div>
  );
}
