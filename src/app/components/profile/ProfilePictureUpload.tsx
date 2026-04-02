"use client";
import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { supabase } from "~/lib/supabase";
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
      const ext = file.name.split(".").pop() ?? "jpg";
      const filename = `${userId}-${Date.now()}.${ext}`;
      const { data, error } = await supabase.storage.from("avatars").upload(filename, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(data.path);
      updatePhoto({ photo: publicUrl });
    } catch (err) {
      console.error("Upload failed:", err);
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
