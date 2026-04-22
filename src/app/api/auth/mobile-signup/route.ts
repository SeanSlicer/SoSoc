import { type NextRequest, NextResponse } from "next/server";
import { createUser } from "@queries/auth/signUp";
import { signUpSchema } from "~/validation/auth/auth";
import { createAuthToken } from "~/lib/server/auth";
import { createEmailVerificationToken } from "@queries/auth/tokens";
import { sendVerificationEmail } from "~/lib/server/email";
import { checkRateLimit } from "~/lib/server/rateLimit";
import { applyCorsHeaders, corsPreflight } from "~/lib/server/cors";
import { TRPCError } from "@trpc/server";

export function OPTIONS(req: NextRequest) {
  return corsPreflight(req.headers.get("origin"));
}

function respond(body: unknown, init: ResponseInit | undefined, origin: string | null) {
  const res = NextResponse.json(body, init);
  applyCorsHeaders(res.headers, origin);
  return res;
}

/**
 * Mobile signup — returns the JWT in the response body instead of setting a
 * cookie. Mirrors the web `/api/auth/signup` flow otherwise.
 */
export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limit = checkRateLimit(`mobile-signup:${ip}`, 5, 60 * 60 * 1000);
  if (!limit.allowed) {
    return respond(
      { error: "Too many accounts created from this IP. Please try again later." },
      { status: 429 },
      origin,
    );
  }

  try {
    const body = await req.json() as unknown;
    const parsed = signUpSchema.safeParse(body);

    if (!parsed.success) {
      return respond({ error: parsed.error.flatten().fieldErrors }, { status: 400 }, origin);
    }

    const { username, email, password } = parsed.data;
    const user = await createUser(username, email, password);
    const token = createAuthToken(user.id, user.role);

    try {
      const verificationToken = await createEmailVerificationToken(user.id);
      await sendVerificationEmail(user.email, verificationToken);
    } catch (emailErr) {
      console.error("[auth/mobile-signup] Failed to send verification email:", emailErr);
    }

    return respond(
      {
        token,
        user: { id: user.id, username: user.username, role: user.role },
        pendingVerification: true,
      },
      undefined,
      origin,
    );
  } catch (err) {
    if (err instanceof TRPCError && err.code === "CONFLICT") {
      return respond({ error: "Username or email already taken" }, { status: 409 }, origin);
    }
    console.error("[auth/mobile-signup]", err);
    return respond({ error: "Internal server error" }, { status: 500 }, origin);
  }
}
