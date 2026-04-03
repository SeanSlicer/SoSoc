"use client";
import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { storageProvider } from "~/lib/storage";
import { resizeImage } from "~/lib/resizeImage";
import { api } from "~/trpc/react";

type Props = { userId: string; onUpload: () => void };

export default function ProfilePictureUpload({ userId, onUpload }: Props) {
  const [isUploading, setIsUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { mutate: updatePhoto } = api.user.updatePhoto.useMutation({
    onSuccess: onUpload,
  });

  const handleFile = async (file: File) => {
    setIsUploading(true);
    try {
      const resized = await resizeImage(file, 400);
      const path = `${userId}-${Date.now()}.jpg`;
      const publicUrl = await storageProvider.upload("avatars", path, resized);
      updatePhoto({ photo: publicUrl });
    } catch (err) {
      console.error("Profile picture upload failed:", err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => fileRef.current?.click()}
        disabled={isUploading}
        className="absolute bottom-1 right-1 flex items-center justify-center rounded-full bg-indigo-600 p-2 text-white shadow-md hover:bg-indigo-700 disabled:opacity-60 transition-colors border-2 border-white"
        title="Change profile picture"
      >
        {isUploading ? (
          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : (
          <Camera size={14} />
        )}
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
