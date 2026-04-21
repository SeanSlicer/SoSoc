import { type NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { revokeUserTokens } from "@queries/auth/getUser";

/**
 * Mobile logout — revokes server-side tokens for the caller. Mobile clients
 * must also delete the token from secure storage.
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization") ?? req.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : undefined;

  if (token) {
    try {
      const payload = jwt.decode(token) as { sub?: string } | null;
      if (payload?.sub) await revokeUserTokens(payload.sub);
    } catch {
      // Malformed token — nothing to revoke
    }
  }

  return NextResponse.json({ success: true });
}
