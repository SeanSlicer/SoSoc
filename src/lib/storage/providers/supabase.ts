"use client";
import type { StorageBucket, StorageProvider } from "../types";

export const supabaseStorageProvider: StorageProvider = {
  async upload(bucket: StorageBucket, path: string, file: File): Promise<string> {
    const body = new FormData();
    body.append("file", file);
    body.append("bucket", bucket);
    body.append("path", path);

    const res = await fetch("/api/upload", { method: "POST", body });
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      throw new Error(data.error ?? "Upload failed");
    }
    const { url } = (await res.json()) as { url: string };
    return url;
  },
};
