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

/**
 * Reads the current user from a route handler's `Request`, supporting both the
 * web cookie (`user-token`) and the mobile `Authorization: Bearer <jwt>` header.
 *
 * Use this in API route handlers that must serve both the web app and the
 * mobile app (e.g. `/api/upload`). Returns `null` on any failure.
 */
export async function getUserFromRequest(req: Request) {
  try {
    const cookieToken = req.headers
      .get("cookie")
      ?.split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith("user-token="))
      ?.slice("user-token=".length);

    const authHeader = req.headers.get("authorization") ?? req.headers.get("Authorization");
    const bearerToken = authHeader?.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length).trim()
      : undefined;

    const token = cookieToken ?? bearerToken;
    if (!token) return null;
    return await getUserByToken(token);
  } catch {
    return null;
  }
}
