import { type NextRequest, NextResponse } from "next/server";
import { getUserByUsernameOrEmailAndPassword } from "@queries/auth/getUser";
import { createAuthToken, setAuthCookie } from "~/lib/server/auth";
import { checkRateLimit } from "~/lib/server/rateLimit";

export async function POST(req: NextRequest) {
  // Rate limit: 10 attempts per 15 minutes per IP
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limit = checkRateLimit(`login:${ip}`, 10, 15 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(limit.retryAfterMs / 1000)) },
      },
    );
  }

  try {
    const body = await req.json() as { usernameOrEmail?: string; password?: string };
    const { usernameOrEmail, password } = body;

    if (!usernameOrEmail || !password) {
      return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
    }

    const user = await getUserByUsernameOrEmailAndPassword(usernameOrEmail, password);
    if (!user) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    const token = createAuthToken(user.id, user.role);
    const response = NextResponse.json({ success: true });
    setAuthCookie(response.cookies, token);
    return response;
  } catch (err) {
    console.error("[auth/login]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
