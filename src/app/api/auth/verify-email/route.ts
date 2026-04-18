import { type NextRequest, NextResponse } from "next/server";
import { verifyEmailToken } from "~/../prisma/queries/auth/tokens";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token || token.length !== 64) {
    return NextResponse.redirect(new URL("/verify-email?error=invalid", req.url));
  }

  const userId = await verifyEmailToken(token);

  if (!userId) {
    return NextResponse.redirect(new URL("/verify-email?error=expired", req.url));
  }

  return NextResponse.redirect(new URL("/feed?verified=1", req.url));
}
