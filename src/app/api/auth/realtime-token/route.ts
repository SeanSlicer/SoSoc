import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { env } from "~/env";
import { getCurrentUser } from "~/lib/server/getCurrentUser";

/**
 * Issues a short-lived Supabase-compatible JWT so the browser Realtime client
 * can authenticate against Row-Level Security policies.
 *
 * Uses JWT_SECRET_KEY, which should match the Supabase project JWT secret
 * (Supabase dashboard → Settings → API → JWT Secret).
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = jwt.sign(
    { sub: user.id, role: "authenticated" },
    env.JWT_SECRET_KEY,
    { expiresIn: "1h" },
  );

  return NextResponse.json({ token, expiresIn: 3600 });
}
