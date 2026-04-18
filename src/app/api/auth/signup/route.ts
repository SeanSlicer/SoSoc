import { type NextRequest, NextResponse } from "next/server";
import { createUser } from "~/../prisma/queries/auth/signUp";
import { signUpSchema } from "~/validation/auth/auth";
import { createAuthToken, setAuthCookie } from "~/lib/server/auth";
import { createEmailVerificationToken } from "~/../prisma/queries/auth/tokens";
import { sendVerificationEmail } from "~/lib/server/email";
import { checkRateLimit } from "~/lib/server/rateLimit";
import { TRPCError } from "@trpc/server";

export async function POST(req: NextRequest) {
  // Rate limit: 5 signups per hour per IP
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limit = checkRateLimit(`signup:${ip}`, 5, 60 * 60 * 1000);
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

    // Issue an auth cookie so the user is logged in while they verify
    const token = createAuthToken(user.id, user.role);
    const response = NextResponse.json({ success: true, pendingVerification: true });
    setAuthCookie(response.cookies, token);

    // Send verification email (non-blocking — don't fail signup if email fails)
    try {
      const verificationToken = await createEmailVerificationToken(user.id);
      await sendVerificationEmail(user.email, verificationToken);
    } catch (emailErr) {
      console.error("[auth/signup] Failed to send verification email:", emailErr);
    }

    return response;
  } catch (err) {
    if (err instanceof TRPCError && err.code === "CONFLICT") {
      return NextResponse.json({ error: "Username or email already taken" }, { status: 409 });
    }
    console.error("[auth/signup]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
