import "server-only";
import { cookies } from "next/headers";
import { getUserByToken } from "~/../lib/client/auth";

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("user-token")?.value;
    if (!token) return null;
    return await getUserByToken(token);
  } catch {
    return null;
  }
}
