"use client";
import { useState, useRef } from "react";
import { Image as ImageIcon, X } from "lucide-react";
import { api } from "~/trpc/react";
import Avatar from "~/app/components/ui/Avatar";
import { storageProvider } from "~/lib/storage";
import { resizeImage } from "~/lib/resizeImage";

const MAX_IMAGES = 15;

type PostUser = { id: string; username: string; displayName?: string | null; photo?: string | null };

export default function CreatePost({ user }: { user: PostUser }) {
  const utils = api.useUtils();
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { mutate: createPost, isPending } = api.post.create.useMutation({
    onSuccess: () => {
      setContent("");
      setImages([]);
      setIsFocused(false);
      void utils.post.getFeed.invalidate();
    },
  });

  const handleImageUpload = async (files: FileList) => {
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) return;
    const toUpload = Array.from(files).slice(0, remaining);

    setIsUploading(true);
    setUploadError("");
    try {
      const urls = await Promise.all(
        toUpload.map(async (file) => {
          const resized = await resizeImage(file, 1200);
          const path = `posts/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
          return storageProvider.upload("posts", path, resized);
        }),
      );
      setImages((prev) => [...prev, ...urls]);
    } catch {
      setUploadError("One or more images failed to upload.");
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const canPost = !isPending && content.trim().length > 0 && !isUploading && content.length <= 500;

  return (
    <div className="border-b border-neutral-100 px-4 py-4">
      <div className="flex gap-3">
        <Avatar user={user} size="md" />
        <div className="flex-1 space-y-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setIsFocused(true)}
            rows={isFocused ? 3 : 1}
            placeholder="What's on your mind?"
            className="w-full resize-none rounded-xl border-0 bg-transparent py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none"
          />

          {/* Image previews grid */}
          {images.length > 0 && (
            <div className={`grid gap-1.5 ${images.length === 1 ? "grid-cols-1" : images.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
              {images.map((url, i) => (
                <div key={i} className="relative group aspect-square overflow-hidden rounded-xl border border-neutral-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Image ${i + 1}`} className="h-full w-full object-cover" />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}

          {isFocused && (
            <div className="flex items-center justify-between border-t border-neutral-100 pt-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={isUploading || images.length >= MAX_IMAGES}
                  className="rounded-lg p-2 text-neutral-400 hover:bg-indigo-50 hover:text-indigo-500 transition-colors disabled:opacity-40"
                  title={images.length >= MAX_IMAGES ? "Maximum 15 images" : "Add images"}
                >
                  <ImageIcon size={18} />
                </button>
                {images.length > 0 && (
                  <span className="text-xs text-neutral-400">{images.length}/{MAX_IMAGES}</span>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.length) void handleImageUpload(e.target.files);
                    e.target.value = "";
                  }}
                />
              </div>

              <div className="flex items-center gap-3">
                <span className={`text-xs ${content.length > 480 ? "text-red-500" : "text-neutral-400"}`}>
                  {500 - content.length}
                </span>
                <button
                  onClick={() => createPost({ content, images })}
                  disabled={!canPost}
                  className="rounded-xl bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {isPending ? "Posting…" : isUploading ? "Uploading…" : "Post"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
