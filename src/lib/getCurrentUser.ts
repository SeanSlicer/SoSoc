import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { getUserByToken } from "~/../lib/client/auth";

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
