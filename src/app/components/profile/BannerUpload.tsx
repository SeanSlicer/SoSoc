"use client";
import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { storageProvider } from "~/lib/storage";
import { resizeImage } from "~/lib/client/resizeImage";
import { api } from "~/trpc/react";

type Props = { userId: string; onUpload: () => void };

export default function BannerUpload({ userId, onUpload }: Props) {
  const [isUploading, setIsUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { mutate: updateBanner } = api.user.updateBanner.useMutation({
    onSuccess: onUpload,
  });

  const handleFile = async (file: File) => {
    setIsUploading(true);
    try {
      // Resize to 1500px wide max, keeping aspect ratio
      const resized = await resizeImage(file, 1500);
      const path = `${userId}-${Date.now()}.jpg`;
      const publicUrl = await storageProvider.upload("banners", path, resized);
      updateBanner({ bannerUrl: publicUrl });
    } catch (err) {
      console.error("Banner upload failed:", err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => fileRef.current?.click()}
        disabled={isUploading}
        className="flex items-center gap-1.5 rounded-lg bg-black/40 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm hover:bg-black/60 disabled:opacity-60 transition-colors"
        title="Change banner"
      >
        {isUploading ? (
          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : (
          <Camera size={13} />
        )}
        {isUploading ? "Uploading…" : "Edit banner"}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />
    </>
  );
}
