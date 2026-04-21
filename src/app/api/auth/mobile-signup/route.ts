import { type NextRequest, NextResponse } from "next/server";
import { createUser } from "@queries/auth/signUp";
import { signUpSchema } from "~/validation/auth/auth";
import { createAuthToken } from "~/lib/server/auth";
import { createEmailVerificationToken } from "@queries/auth/tokens";
import { sendVerificationEmail } from "~/lib/server/email";
import { checkRateLimit } from "~/lib/server/rateLimit";
import { TRPCError } from "@trpc/server";

/**
 * Mobile signup — returns the JWT in the response body instead of setting a
 * cookie. Mirrors the web `/api/auth/signup` flow otherwise.
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limit = checkRateLimit(`mobile-signup:${ip}`, 5, 60 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many accounts created from this IP. Please try again later." },
      { status: 429 },
    );
  }

  try {
    const body = await req.json() as unknown;
    const parsed = signUpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
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

    return NextResponse.json({
      token,
      user: { id: user.id, username: user.username, role: user.role },
      pendingVerification: true,
    });
  } catch (err) {
    if (err instanceof TRPCError && err.code === "CONFLICT") {
      return NextResponse.json({ error: "Username or email already taken" }, { status: 409 });
    }
    console.error("[auth/mobile-signup]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
