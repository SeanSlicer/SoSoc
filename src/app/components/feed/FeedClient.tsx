"use client";
import { useState, useEffect, useRef } from "react";
import { api } from "~/trpc/react";
import PostCard from "./PostCard";
import CreatePost from "./CreatePost";
import SharePostModal from "~/app/components/messages/SharePostModal";

type FeedType = "all" | "following";

function PostCardSkeleton() {
  return (
    <div className="border-b border-neutral-100 dark:border-neutral-800 px-4 py-5 animate-pulse">
      <div className="flex gap-3">
        <div className="h-10 w-10 rounded-full bg-neutral-200 dark:bg-neutral-700 shrink-0" />
        <div className="min-w-0 flex-1 space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="h-3.5 w-28 rounded-full bg-neutral-200 dark:bg-neutral-700" />
            <div className="h-3 w-16 rounded-full bg-neutral-200 dark:bg-neutral-700" />
          </div>
          <div className="h-3 w-full rounded-full bg-neutral-200 dark:bg-neutral-700" />
          <div className="h-3 w-4/5 rounded-full bg-neutral-200 dark:bg-neutral-700" />
          <div className="mt-3 flex gap-4">
            <div className="h-3 w-10 rounded-full bg-neutral-200 dark:bg-neutral-700" />
            <div className="h-3 w-10 rounded-full bg-neutral-200 dark:bg-neutral-700" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FeedClient() {
  const { data: me, isLoading: meLoading } = api.user.getMe.useQuery();
  const [feedType, setFeedType] = useState<FeedType>("all");
  const [sharingPostId, setSharingPostId] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: feedLoading,
  } = api.post.getFeed.useInfiniteQuery(
    { feedType },
    { getNextPageParam: (lastPage) => lastPage.nextCursor },
  );

  // Auto-load next page when the sentinel div scrolls into view
  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const posts = data?.pages.flatMap((page) => page.posts) ?? [];

  if (meLoading || feedLoading) {
    return (
      <>
        <FeedHeader feedType={feedType} onTabChange={setFeedType} />
        {[0, 1, 2].map((i) => <PostCardSkeleton key={i} />)}
      </>
    );
  }

  if (!me) return null;

  return (
    <div>
      <FeedHeader feedType={feedType} onTabChange={setFeedType} />

      <CreatePost user={me} />

      {posts.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-neutral-400 text-sm">
            {feedType === "following"
              ? "Follow some people to see their posts here."
              : "No posts yet. Be the first to post!"}
          </p>
        </div>
      ) : (
        <>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} currentUserId={me.id} onShare={setSharingPostId} />
          ))}

          {/* Sentinel div — IntersectionObserver triggers the next page fetch */}
          <div ref={sentinelRef} className="py-3 flex justify-center">
            {isFetchingNextPage && (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
            )}
          </div>
        </>
      )}

      <SharePostModal postId={sharingPostId} onClose={() => setSharingPostId(null)} />
    </div>
  );
}

function FeedHeader({
  feedType,
  onTabChange,
}: {
  feedType: FeedType;
  onTabChange: (t: FeedType) => void;
}) {
  return (
    <div className="sticky top-0 z-10 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm border-b border-neutral-100 dark:border-neutral-800">
      <div className="px-4 pt-3 pb-0">
        <h1 className="font-bold text-neutral-900 dark:text-neutral-100">Home</h1>
      </div>
      <div className="flex">
        {(["all", "following"] as const).map((type) => (
          <button
            key={type}
            onClick={() => onTabChange(type)}
            className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${
              feedType === type
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
            }`}
          >
            {type === "all" ? "For You" : "Following"}
          </button>
        ))}
      </div>
    </div>
  );
}
