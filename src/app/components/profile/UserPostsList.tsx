"use client";
import { useState, useEffect } from "react";
import { api, type RouterOutputs } from "~/trpc/react";
import PostCard from "~/app/components/feed/PostCard";

type FeedPost = RouterOutputs["post"]["getUserPosts"][number];

type Props = { username: string; currentUserId: string };

export default function UserPostsList({ username, currentUserId }: Props) {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const { data } = api.post.getUserPosts.useQuery({ username });

  useEffect(() => {
    if (data) setPosts(data);
  }, [data]);

  const handleDelete = (postId: string) => setPosts((p) => p.filter((x) => x.id !== postId));
  const handleUpdate = (postId: string, content: string) =>
    setPosts((p) => p.map((x) => (x.id === postId ? { ...x, content } : x)));

  if (posts.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-neutral-400">No posts yet</p>
      </div>
    );
  }

  return (
    <div>
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          currentUserId={currentUserId}
          onDelete={handleDelete}
          onUpdate={handleUpdate}
        />
      ))}
    </div>
  );
}
