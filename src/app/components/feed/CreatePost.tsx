"use client";
import { useState, useRef } from "react";
import { Image as ImageIcon, Video, X } from "lucide-react";
import { api } from "~/trpc/react";
import Avatar from "~/app/components/ui/Avatar";
import { storageProvider } from "~/lib/storage";
import { resizeImage } from "~/lib/resizeImage";

const MAX_IMAGES = 15;
const MAX_VIDEO_MB = 100;

type PostUser = { id: string; username: string; displayName?: string | null; photo?: string | null };

export default function CreatePost({ user }: { user: PostUser }) {
  const utils = api.useUtils();
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [mode, setMode] = useState<"photo" | "video">("photo");
  const imageRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  const { mutate: createPost, isPending } = api.post.create.useMutation({
    onSuccess: () => {
      setContent("");
      setImages([]);
      setVideoUrl(null);
      setIsFocused(false);
      setMode("photo");
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

  const handleVideoUpload = async (file: File) => {
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
      setUploadError(`Video must be under ${MAX_VIDEO_MB}MB.`);
      return;
    }
    setIsUploading(true);
    setUploadError("");
    try {
      const path = `videos/${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name}`;
      const url = await storageProvider.upload("posts", path, file as unknown as File);
      setVideoUrl(url);
    } catch {
      setUploadError("Video upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => setImages((prev) => prev.filter((_, i) => i !== index));

  const canPost =
    !isPending &&
    content.trim().length > 0 &&
    !isUploading &&
    content.length <= 500 &&
    (mode === "photo" || !!videoUrl);

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

          {/* Image previews */}
          {mode === "photo" && images.length > 0 && (
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

          {/* Video preview */}
          {mode === "video" && videoUrl && (
            <div className="relative overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100">
              <video src={videoUrl} controls className="w-full max-h-64" preload="metadata" />
              <button
                onClick={() => { setVideoUrl(null); }}
                className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80 transition-colors"
              >
                <X size={13} />
              </button>
            </div>
          )}

          {/* Video placeholder when no video yet */}
          {mode === "video" && !videoUrl && !isUploading && isFocused && (
            <button
              onClick={() => videoRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-neutral-200 py-8 text-sm text-neutral-400 hover:border-indigo-300 hover:text-indigo-500 transition-colors"
            >
              <Video size={20} />
              Click to upload a video (max {MAX_VIDEO_MB}MB)
            </button>
          )}

          {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}

          {isFocused && (
            <div className="flex items-center justify-between border-t border-neutral-100 pt-3">
              <div className="flex items-center gap-1">
                {/* Mode toggle */}
                <button
                  onClick={() => { setMode("photo"); setVideoUrl(null); }}
                  className={`rounded-lg p-2 transition-colors ${mode === "photo" ? "text-indigo-500 bg-indigo-50" : "text-neutral-400 hover:bg-indigo-50 hover:text-indigo-500"}`}
                  title="Photo mode"
                >
                  <ImageIcon size={18} />
                </button>
                <button
                  onClick={() => { setMode("video"); setImages([]); }}
                  className={`rounded-lg p-2 transition-colors ${mode === "video" ? "text-indigo-500 bg-indigo-50" : "text-neutral-400 hover:bg-indigo-50 hover:text-indigo-500"}`}
                  title="Video mode"
                >
                  <Video size={18} />
                </button>

                {/* Photo add button */}
                {mode === "photo" && (
                  <>
                    <button
                      onClick={() => imageRef.current?.click()}
                      disabled={isUploading || images.length >= MAX_IMAGES}
                      className="rounded-lg p-2 text-neutral-400 hover:bg-indigo-50 hover:text-indigo-500 transition-colors disabled:opacity-40"
                      title={images.length >= MAX_IMAGES ? "Maximum 15 images" : "Add images"}
                    >
                      <ImageIcon size={18} />
                    </button>
                    {images.length > 0 && (
                      <span className="text-xs text-neutral-400">{images.length}/{MAX_IMAGES}</span>
                    )}
                  </>
                )}

                {/* Video select button */}
                {mode === "video" && !videoUrl && (
                  <button
                    onClick={() => videoRef.current?.click()}
                    disabled={isUploading}
                    className="rounded-lg p-2 text-neutral-400 hover:bg-indigo-50 hover:text-indigo-500 transition-colors disabled:opacity-40"
                  >
                    <Video size={18} />
                  </button>
                )}

                {isUploading && (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                )}
              </div>

              <div className="flex items-center gap-3">
                <span className={`text-xs ${content.length > 480 ? "text-red-500" : "text-neutral-400"}`}>
                  {500 - content.length}
                </span>
                <button
                  onClick={() => createPost({ content, images, videoUrl: videoUrl ?? undefined })}
                  disabled={!canPost}
                  className="rounded-xl bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {isPending ? "Posting…" : isUploading ? "Uploading…" : "Post"}
                </button>
              </div>
            </div>
          )}

          <input ref={imageRef} type="file" accept="image/*" multiple className="hidden"
            onChange={(e) => { if (e.target.files?.length) void handleImageUpload(e.target.files); e.target.value = ""; }}
          />
          <input ref={videoRef} type="file" accept="video/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleVideoUpload(f); e.target.value = ""; }}
          />
        </div>
      </div>
    </div>
  );
}
