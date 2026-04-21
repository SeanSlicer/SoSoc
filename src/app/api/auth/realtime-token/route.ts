import { type NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { env } from "~/env";
import { getUserFromRequest } from "~/lib/server/getCurrentUser";
import { applyCorsHeaders, corsPreflight } from "~/lib/server/cors";

export function OPTIONS(req: NextRequest) {
  return corsPreflight(req.headers.get("origin"));
}

/**
 * Issues a short-lived Supabase-compatible JWT so the browser Realtime client
 * (or mobile app) can authenticate against Row-Level Security policies.
 *
 * Uses JWT_SECRET_KEY, which should match the Supabase project JWT secret
 * (Supabase dashboard → Settings → API → JWT Secret).
 */
export async function GET(req: NextRequest) {
  const origin = req.headers.get("origin");
  const user = await getUserFromRequest(req);

  const baseRes = (body: unknown, init?: ResponseInit) => {
    const res = NextResponse.json(body, init);
    applyCorsHeaders(res.headers, origin);
    return res;
  };

  if (!user) return baseRes({ error: "Unauthorized" }, { status: 401 });

  const token = jwt.sign(
    { sub: user.id, role: "authenticated" },
    env.JWT_SECRET_KEY,
    { expiresIn: "1h" },
  );

  return baseRes({ token, expiresIn: 3600 });
}
