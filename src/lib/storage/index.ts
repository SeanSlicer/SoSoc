"use client";
/**
 * Active storage provider.
 * To switch providers (e.g. to S3), replace the import below and export
 * your new provider. No other files need to change.
 */
export { supabaseStorageProvider as storageProvider } from "./providers/supabase";
export type { StorageBucket, StorageProvider } from "./types";
