"use client";
import { useState, useRef } from "react";
import { Image as ImageIcon, X } from "lucide-react";
import { api } from "~/trpc/react";
import Avatar from "~/app/components/ui/Avatar";
import { storageProvider } from "~/lib/storage";
import { resizeImage } from "~/lib/resizeImage";

type PostUser = { id: string; username: string; displayName?: string | null; photo?: string | null };

export default function CreatePost({ user }: { user: PostUser }) {
  const utils = api.useUtils();
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { mutate: createPost, isPending } = api.post.create.useMutation({
    onSuccess: () => {
      setContent("");
      setImageUrl("");
      setIsFocused(false);
      void utils.post.getFeed.invalidate();
    },
  });

  const handleImageUpload = async (file: File) => {
    setIsUploading(true);
    setUploadError("");
    try {
      const resized = await resizeImage(file, 1200);
      const path = `posts/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
      const url = await storageProvider.upload("posts", path, resized);
      setImageUrl(url);
    } catch {
      setUploadError("Image upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

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

          {imageUrl && (
            <div className="relative inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="Preview" className="max-h-48 rounded-xl border border-neutral-200 object-cover" />
              <button
                onClick={() => setImageUrl("")}
                className="absolute right-2 top-2 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}

          {isFocused && (
            <div className="flex items-center justify-between border-t border-neutral-100 pt-3">
              <div className="flex gap-1">
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={isUploading}
                  className="rounded-lg p-2 text-neutral-400 hover:bg-indigo-50 hover:text-indigo-500 transition-colors disabled:opacity-50"
                  title="Add image"
                >
                  <ImageIcon size={18} />
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleImageUpload(file);
                  }}
                />
              </div>

              <div className="flex items-center gap-3">
                <span className={`text-xs ${content.length > 480 ? "text-red-500" : "text-neutral-400"}`}>
                  {500 - content.length}
                </span>
                <button
                  onClick={() => createPost({ content, imageUrl: imageUrl || undefined })}
                  disabled={isPending || !content.trim() || isUploading || content.length > 500}
                  className="rounded-xl bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {isPending ? "Posting…" : "Post"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
