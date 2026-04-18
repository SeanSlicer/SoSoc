import { type NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { clearAuthCookie, AUTH_COOKIE } from "~/lib/server/auth";
import { revokeUserTokens } from "~/../prisma/queries/auth/getUser";

export async function POST(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE)?.value;
  if (token) {
    try {
      // Decode without verification — we just need the userId to bump tokenValidFrom.
      // Full signature verification isn't required here; an invalid token simply won't
      // match any user in revokeUserTokens.
      const payload = jwt.decode(token) as { sub?: string } | null;
      if (payload?.sub) {
        await revokeUserTokens(payload.sub);
      }
    } catch {
      // Malformed token — nothing to revoke
    }
  }
  const response = NextResponse.json({ success: true });
  clearAuthCookie(response.cookies);
  return response;
}
