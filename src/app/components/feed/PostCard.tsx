"use client";
import { useState } from "react";
import Link from "next/link";
import { Heart, MessageCircle, Trash2, Edit2, X, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { api, type RouterOutputs } from "~/trpc/react";
import Avatar from "~/app/components/ui/Avatar";
import Lightbox from "~/app/components/ui/Lightbox";
import { timeAgo } from "~/lib/timeAgo";

export type FeedPost = RouterOutputs["post"]["getFeed"]["posts"][number];

type PostCardProps = {
  post: FeedPost;
  currentUserId: string;
};

// Inline carousel for post image collections
function ImageCarousel({
  images,
  onImageClick,
}: {
  images: string[];
  onImageClick: (index: number) => void;
}) {
  const [carouselIndex, setCarouselIndex] = useState(0);

  if (images.length === 0) return null;

  if (images.length === 1) {
    return (
      <div
        className="mt-3 cursor-zoom-in overflow-hidden rounded-xl border border-neutral-100"
        onClick={() => onImageClick(0)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[0]} alt="Post image" className="w-full max-h-96 object-cover" />
      </div>
    );
  }

  return (
    <div className="mt-3 relative overflow-hidden rounded-xl border border-neutral-100">
      <div
        className="cursor-zoom-in"
        onClick={() => onImageClick(carouselIndex)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[carouselIndex]}
          alt={`Image ${carouselIndex + 1} of ${images.length}`}
          className="w-full max-h-96 object-cover"
        />
      </div>

      {/* Prev */}
      {carouselIndex > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); setCarouselIndex((i) => i - 1); }}
          className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70 transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
      )}

      {/* Next */}
      {carouselIndex < images.length - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); setCarouselIndex((i) => i + 1); }}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70 transition-colors"
        >
          <ChevronRight size={18} />
        </button>
      )}

      {/* Dot indicators */}
      <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={(e) => { e.stopPropagation(); setCarouselIndex(i); }}
            className={`h-1.5 w-1.5 rounded-full transition-colors ${
              i === carouselIndex ? "bg-white" : "bg-white/50"
            }`}
          />
        ))}
      </div>

      {/* Count badge */}
      <span className="absolute right-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-xs text-white">
        {carouselIndex + 1}/{images.length}
      </span>
    </div>
  );
}

export default function PostCard({ post, currentUserId }: PostCardProps) {
  const utils = api.useUtils();

  const [showComments, setShowComments] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [commentText, setCommentText] = useState("");
  const [liked, setLiked] = useState(post.isLiked);
  const [likeCount, setLikeCount] = useState(post._count.likes);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const isOwn = post.author.id === currentUserId;

  // Resolve images: new posts use the images array; old posts fall back to imageUrl
  const postImages: string[] =
    post.images && post.images.length > 0
      ? post.images
      : post.imageUrl
        ? [post.imageUrl]
        : [];

  const invalidatePosts = () => {
    void utils.post.getFeed.invalidate();
    void utils.post.getUserPosts.invalidate();
  };

  const { mutate: toggleLike } = api.post.toggleLike.useMutation({
    onMutate: () => {
      const wasLiked = liked;
      setLiked(!wasLiked);
      setLikeCount((c) => (wasLiked ? c - 1 : c + 1));
    },
  });

  const { mutate: deletePost } = api.post.delete.useMutation({ onSuccess: invalidatePosts });

  const { mutate: updatePost, isPending: isUpdating } = api.post.update.useMutation({
    onSuccess: () => { invalidatePosts(); setIsEditing(false); },
  });

  const { data: comments, refetch: refetchComments } = api.post.getComments.useQuery(
    { postId: post.id },
    { enabled: showComments },
  );

  const { mutate: addComment, isPending: isAddingComment } = api.post.addComment.useMutation({
    onSuccess: () => { setCommentText(""); void refetchComments(); },
  });

  const { mutate: deleteComment } = api.post.deleteComment.useMutation({
    onSuccess: () => void refetchComments(),
  });

  return (
    <>
      <article className="border-b border-neutral-100 px-4 py-5 hover:bg-neutral-50/50 transition-colors">
        <div className="flex gap-3">
          <Link href={`/profile/${post.author.username}`} className="shrink-0">
            <Avatar user={post.author} size="md" />
          </Link>

          <div className="min-w-0 flex-1">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <Link
                  href={`/profile/${post.author.username}`}
                  className="font-semibold text-neutral-900 hover:underline text-sm"
                >
                  {post.author.displayName ?? post.author.username}
                </Link>
                <span className="text-neutral-500 text-sm">@{post.author.username}</span>
                <span className="text-neutral-400 text-xs">·</span>
                <span className="text-neutral-400 text-xs">{timeAgo(new Date(post.createdAt))}</span>
              </div>

              {isOwn && !isEditing && (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors"
                    title="Edit post"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => deletePost({ postId: post.id })}
                    className="rounded-lg p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                    title="Delete post"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              )}
            </div>

            {/* Content */}
            {isEditing ? (
              <div className="mt-2 space-y-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm text-neutral-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none resize-none transition-colors"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => { setIsEditing(false); setEditContent(post.content); }}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-100 transition-colors"
                  >
                    <X size={13} /> Cancel
                  </button>
                  <button
                    onClick={() => updatePost({ postId: post.id, content: editContent })}
                    disabled={isUpdating || !editContent.trim()}
                    className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
                  >
                    <Check size={13} /> {isUpdating ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>
            ) : (
              <p className="mt-1.5 text-sm text-neutral-800 leading-relaxed whitespace-pre-wrap">
                {post.content}
              </p>
            )}

            {/* Images */}
            {!isEditing && postImages.length > 0 && (
              <ImageCarousel images={postImages} onImageClick={(i) => setLightboxIndex(i)} />
            )}

            {/* Actions */}
            <div className="mt-3 flex items-center gap-5">
              <button
                onClick={() => toggleLike({ postId: post.id })}
                className={`flex items-center gap-1.5 text-sm transition-colors ${
                  liked ? "text-red-500" : "text-neutral-400 hover:text-red-400"
                }`}
              >
                <Heart size={17} className={liked ? "fill-red-500" : ""} />
                <span>{likeCount}</span>
              </button>

              <button
                onClick={() => setShowComments((s) => !s)}
                className="flex items-center gap-1.5 text-sm text-neutral-400 hover:text-indigo-500 transition-colors"
              >
                <MessageCircle size={17} />
                <span>{post._count.comments}</span>
              </button>
            </div>

            {/* Comments */}
            {showComments && (
              <div className="mt-3 space-y-3">
                <div className="flex gap-2">
                  <input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment…"
                    className="flex-1 rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey && commentText.trim()) {
                        e.preventDefault();
                        addComment({ postId: post.id, content: commentText });
                      }
                    }}
                  />
                  <button
                    onClick={() => addComment({ postId: post.id, content: commentText })}
                    disabled={isAddingComment || !commentText.trim()}
                    className="rounded-xl bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
                  >
                    Post
                  </button>
                </div>

                {comments?.map((comment) => (
                  <div key={comment.id} className="flex gap-2.5">
                    <Avatar user={comment.user} size="sm" />
                    <div className="flex-1 rounded-xl bg-neutral-100 px-3 py-2">
                      <div className="flex items-start justify-between">
                        <span className="text-xs font-semibold text-neutral-900">
                          {comment.user.displayName ?? comment.user.username}
                        </span>
                        {comment.user.id === currentUserId && (
                          <button
                            onClick={() => deleteComment({ commentId: comment.id })}
                            className="text-neutral-300 hover:text-red-400 transition-colors"
                          >
                            <X size={13} />
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-neutral-700 mt-0.5">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </article>

      {lightboxIndex !== null && postImages.length > 0 && (
        <Lightbox
          images={postImages}
          index={lightboxIndex}
          alt="Post image"
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </>
  );
}
