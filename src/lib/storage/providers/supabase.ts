"use client";
import { supabase } from "~/lib/supabase";
import type { StorageBucket, StorageProvider } from "../types";

export const supabaseStorageProvider: StorageProvider = {
  async upload(bucket: StorageBucket, path: string, file: File): Promise<string> {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: true });

    if (error) throw error;

    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(data.path);

    return publicUrl;
  },
};
