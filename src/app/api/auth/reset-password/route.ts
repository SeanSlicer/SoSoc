import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcrypt";
import { consumePasswordResetToken, verifyPasswordResetToken } from "@queries/auth/tokens";
import { checkRateLimit } from "~/lib/server/rateLimit";

const schema = z.object({
  token: z.string().length(64),
  password: z
    .string()
    .min(8, "Must be at least 8 characters")
    .regex(/[A-Z]/, "One uppercase character required")
    .regex(/\d/, "One number required"),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limit = checkRateLimit(`reset-password:${ip}`, 10, 15 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 },
    );
  }

  const body = await req.json() as unknown;
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { token, password } = parsed.data;

  // Verify token is valid before hashing the password (fail fast)
  const userId = await verifyPasswordResetToken(token);
  if (!userId) {
    return NextResponse.json(
      { error: "This reset link is invalid or has expired." },
      { status: 400 },
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const consumed = await consumePasswordResetToken(token, hashedPassword);

  if (!consumed) {
    return NextResponse.json(
      { error: "This reset link is invalid or has already been used." },
      { status: 400 },
    );
  }

  return NextResponse.json({ message: "Password updated. You can now sign in." });
}
