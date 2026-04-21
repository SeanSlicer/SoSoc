import { type NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "~/lib/server/getCurrentUser";
import { createEmailVerificationToken } from "@queries/auth/tokens";
import { sendVerificationEmail } from "~/lib/server/email";
import { checkRateLimit } from "~/lib/server/rateLimit";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (user.emailVerified) {
    return NextResponse.json({ error: "Email is already verified" }, { status: 400 });
  }

  // Rate limit: 3 resends per hour per user
  const limit = checkRateLimit(`resend-verification:${user.id}`, 3, 60 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before requesting another email." },
      { status: 429 },
    );
  }

  const token = await createEmailVerificationToken(user.id);
  await sendVerificationEmail(user.email, token);

  return NextResponse.json({ message: "Verification email sent." });
}
