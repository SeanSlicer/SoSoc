import { type NextRequest, NextResponse } from "next/server";
import { getUserByUsernameOrEmailAndPassword } from "@queries/auth/getUser";
import { createAuthToken } from "~/lib/server/auth";
import { checkRateLimit } from "~/lib/server/rateLimit";
import { applyCorsHeaders, corsPreflight } from "~/lib/server/cors";

export function OPTIONS(req: NextRequest) {
  return corsPreflight(req.headers.get("origin"));
}

function respond(body: unknown, init: ResponseInit | undefined, origin: string | null) {
  const res = NextResponse.json(body, init);
  applyCorsHeaders(res.headers, origin);
  return res;
}

/**
 * Mobile login — returns the JWT in the response body instead of setting a
 * cookie. Mobile clients store the token in secure storage and send it as
 * `Authorization: Bearer <token>` on subsequent requests.
 */
export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limit = checkRateLimit(`mobile-login:${ip}`, 10, 15 * 60 * 1000);
  if (!limit.allowed) {
    return respond(
      { error: "Too many login attempts. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(limit.retryAfterMs / 1000)) },
      },
      origin,
    );
  }

  try {
    const body = await req.json() as { usernameOrEmail?: string; password?: string };
    const { usernameOrEmail, password } = body;

    if (!usernameOrEmail || !password) {
      return respond({ error: "Missing credentials" }, { status: 400 }, origin);
    }

    const user = await getUserByUsernameOrEmailAndPassword(usernameOrEmail, password);
    if (!user) {
      return respond({ error: "Invalid username or password" }, { status: 401 }, origin);
    }

    const token = createAuthToken(user.id, user.role);
    return respond(
      { token, user: { id: user.id, username: user.username, role: user.role } },
      undefined,
      origin,
    );
  } catch (err) {
    console.error("[auth/mobile-login]", err);
    return respond({ error: "Internal server error" }, { status: 500 }, origin);
  }
}
