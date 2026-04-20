import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { env } from "~/env";
import { getCurrentUser } from "~/lib/getCurrentUser";

/**
 * Issues a short-lived Supabase-compatible JWT so the browser Realtime client
 * can authenticate against Row-Level Security policies.
 *
 * Requires SUPABASE_JWT_SECRET (Supabase dashboard → Settings → API → JWT Secret).
 * When unset, returns 501 and Realtime falls back to the anon key (no RLS filtering).
 */
export async function GET() {
  if (!env.SUPABASE_JWT_SECRET) {
    return NextResponse.json({ error: "RLS not configured" }, { status: 501 });
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = jwt.sign(
    { sub: user.id, role: "authenticated" },
    env.SUPABASE_JWT_SECRET,
    { expiresIn: "1h" },
  );

  return NextResponse.json({ token, expiresIn: 3600 });
}
