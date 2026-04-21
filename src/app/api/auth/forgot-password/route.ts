import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createPasswordResetToken } from "@queries/auth/tokens";
import { sendPasswordResetEmail } from "~/lib/server/email";
import { checkRateLimit } from "~/lib/server/rateLimit";

const schema = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  // Rate limit: 5 requests per 15 minutes per IP
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limit = checkRateLimit(`forgot-password:${ip}`, 5, 15 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(limit.retryAfterMs / 1000)) },
      },
    );
  }

  const body = await req.json() as unknown;
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const result = await createPasswordResetToken(parsed.data.email);

  // Always return 200 — never reveal whether an email exists in the system
  if (result) {
    await sendPasswordResetEmail(result.userEmail, result.token);
  }

  return NextResponse.json({
    message: "If that email is registered, a reset link is on its way.",
  });
}
