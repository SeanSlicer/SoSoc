import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { getUserByToken } from "~/lib/server/jwt";

/**
 * Reads the current user from the `user-token` cookie in a React Server Component.
 *
 * Wrapped in `cache()` so multiple calls within a single RSC render share one
 * DB lookup. Returns `null` on any failure — callers should treat a null user
 * as "signed out" rather than assuming it's an error.
 */
export const getCurrentUser = cache(async () => {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("user-token")?.value;
    if (!token) return null;
    return await getUserByToken(token);
  } catch {
    return null;
  }
});
