import { type NextRequest, NextResponse } from "next/server";
import { getUserByUsernameOrEmailAndPassword } from "@queries/auth/getUser";
import { createAuthToken } from "~/lib/server/auth";
import { checkRateLimit } from "~/lib/server/rateLimit";

/**
 * Mobile login — returns the JWT in the response body instead of setting a
 * cookie. Mobile clients store the token in secure storage and send it as
 * `Authorization: Bearer <token>` on subsequent requests.
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limit = checkRateLimit(`mobile-login:${ip}`, 10, 15 * 60 * 1000);
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
    return NextResponse.json({
      token,
      user: { id: user.id, username: user.username, role: user.role },
    });
  } catch (err) {
    console.error("[auth/mobile-login]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
