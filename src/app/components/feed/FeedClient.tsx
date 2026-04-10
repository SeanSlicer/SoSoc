"use client";
import { useState } from "react";
import { api } from "~/trpc/react";
import PostCard from "./PostCard";
import CreatePost from "./CreatePost";
import SharePostModal from "~/app/components/messages/SharePostModal";

type FeedType = "all" | "following";

export default function FeedClient() {
  const { data: me, isLoading: meLoading } = api.user.getMe.useQuery();
  const [feedType, setFeedType] = useState<FeedType>("all");
  const [sharingPostId, setSharingPostId] = useState<string | null>(null);

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

  const posts = data?.pages.flatMap((page) => page.posts) ?? [];

  if (meLoading || feedLoading) {
    return (
      <>
        <FeedHeader feedType={feedType} onTabChange={setFeedType} />
        <div className="flex justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        </div>
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

          {hasNextPage && (
            <div className="flex justify-center py-6">
              <button
                onClick={() => void fetchNextPage()}
                disabled={isFetchingNextPage}
                className="rounded-xl border border-neutral-200 dark:border-neutral-700 px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-50 transition-colors"
              >
                {isFetchingNextPage ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
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
