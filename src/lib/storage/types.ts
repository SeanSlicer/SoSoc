export type StorageBucket = "avatars" | "posts" | "banners";

/**
 * Provider-agnostic storage interface.
 * Swap out the implementation in ./index.ts to change providers (e.g. S3).
 *
 * S3 implementation note: use presigned URLs — get a presigned PUT URL from
 * your API, upload directly to S3, return the public CDN URL. The interface
 * stays the same for callers.
 */
export interface StorageProvider {
  upload(bucket: StorageBucket, path: string, file: File): Promise<string>;
}
