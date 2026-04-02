"use client";
import { useState, useEffect } from "react";
import { api } from "~/trpc/react";
import PostCard from "./PostCard";
import CreatePost from "./CreatePost";
import type { RouterOutputs } from "~/trpc/react";

type FeedPost = RouterOutputs["post"]["getFeed"]["posts"][number];

export default function FeedClient() {
  const { data: me } = api.user.getMe.useQuery();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [cursor, setCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(true);
  const [loadMoreCursor, setLoadMoreCursor] = useState<string | undefined>();

  const { data, isFetching } = api.post.getFeed.useQuery({ cursor: undefined });

  useEffect(() => {
    if (data) {
      setPosts(data.posts);
      setHasMore(!!data.nextCursor);
      setCursor(data.nextCursor);
    }
  }, [data]);

  const { data: moreData, refetch: fetchMore, isFetching: isFetchingMore } = api.post.getFeed.useQuery(
    { cursor: loadMoreCursor },
    { enabled: false },
  );

  useEffect(() => {
    if (moreData) {
      setPosts((prev) => [...prev, ...moreData.posts]);
      setHasMore(!!moreData.nextCursor);
      setCursor(moreData.nextCursor);
    }
  }, [moreData]);

  const handleLoadMore = () => {
    setLoadMoreCursor(cursor);
    void fetchMore();
  };

  const handlePostCreated = (post: FeedPost) => {
    setPosts((prev) => [post, ...prev]);
  };

  const handlePostDeleted = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const handlePostUpdated = (postId: string, content: string) => {
    setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, content } : p));
  };

  if (!me) return null;

  return (
    <div>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-neutral-100 px-4 py-3">
        <h1 className="font-bold text-neutral-900">Home</h1>
      </div>

      <CreatePost user={me} onPostCreated={handlePostCreated} />

      {isFetching && posts.length === 0 ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        </div>
      ) : posts.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-neutral-400 text-sm">No posts yet. Be the first to post!</p>
        </div>
      ) : (
        <>
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={me.id}
              onDelete={handlePostDeleted}
              onUpdate={handlePostUpdated}
            />
          ))}

          {hasMore && (
            <div className="flex justify-center py-6">
              <button
                onClick={handleLoadMore}
                disabled={isFetchingMore}
                className="rounded-xl border border-neutral-200 px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-50 disabled:opacity-50 transition-colors"
              >
                {isFetchingMore ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
