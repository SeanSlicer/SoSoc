import { apiUrl } from "./api";
import { secureStorage, AUTH_TOKEN_KEY } from "./secureStore";

export type UploadBucket = "avatars" | "posts" | "banners";

/**
 * Upload a local file URI (from expo-image-picker / expo-document-picker) to
 * the web app's `/api/upload` endpoint. The endpoint handles storage-provider
 * specifics server-side and returns a public URL.
 *
 * @param uri       Local file URI (e.g. `file:///var/mobile/.../abc.jpg`)
 * @param bucket    Target Supabase bucket
 * @param path      Storage key (unique per upload — include userId/timestamp/uuid)
 * @param mimeType  Content-Type to send; defaults to `image/jpeg`
 */
export async function uploadFile(
  uri: string,
  bucket: UploadBucket,
  path: string,
  mimeType = "image/jpeg",
): Promise<string> {
  const token = await secureStorage.get(AUTH_TOKEN_KEY);
  if (!token) throw new Error("Not signed in");

  const form = new FormData();
  // React Native's FormData accepts the { uri, name, type } shape directly.
  form.append("file", {
    uri,
    name: path.split("/").pop() ?? "upload.jpg",
    type: mimeType,
  } as unknown as Blob);
  form.append("bucket", bucket);
  form.append("path", path);

  const res = await fetch(apiUrl("/api/upload"), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      // IMPORTANT: don't set Content-Type — fetch computes the multipart
      // boundary for us. Setting it manually would break the request.
    },
    body: form,
  });

  const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!res.ok || !data.url) {
    throw new Error(data.error ?? `Upload failed (${res.status})`);
  }
  return data.url;
}

/** Build a unique storage path with user + timestamp + optional suffix. */
export function uploadPath(userId: string, suffix?: string, ext = "jpg"): string {
  const base = `${userId}/${Date.now()}${suffix ? `-${suffix}` : ""}`;
  return `${base}.${ext}`;
}
