import { type NextRequest, NextResponse } from "next/server";
import { verifyEmailToken } from "@queries/auth/tokens";
import { createAuthToken, setAuthCookie } from "~/lib/server/auth";
import { prisma } from "~/server/db";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (token?.length !== 64) {
    return NextResponse.redirect(new URL("/verify-email?error=invalid", req.url));
  }

  const userId = await verifyEmailToken(token);

  if (!userId) {
    return NextResponse.redirect(new URL("/verify-email?error=expired", req.url));
  }

  // Issue a new JWT with emailVerified: true so the cookie is updated immediately
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  const response = NextResponse.redirect(new URL("/feed?verified=1", req.url));
  if (user) {
    setAuthCookie(response.cookies, createAuthToken(userId, user.role, true));
  }

  return response;
}
