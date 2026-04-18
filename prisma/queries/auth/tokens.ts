import crypto from "crypto";
import { prisma } from "~/server/db";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex"); // 64-char hex, URL-safe
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// ---------------------------------------------------------------------------
// Email verification
// ---------------------------------------------------------------------------

/** Create (or replace) a pending email verification token for a user. */
export async function createEmailVerificationToken(userId: string) {
  const token = generateToken();
  const tokenHash = hashToken(token);

  // Invalidate any existing tokens for this user first
  await prisma.emailVerificationToken.deleteMany({ where: { userId } });

  await prisma.emailVerificationToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    },
  });

  return token; // return the plain token to send in the email
}

/** Verify an email token. Returns the userId on success, null on failure. */
export async function verifyEmailToken(token: string): Promise<string | null> {
  const tokenHash = hashToken(token);
  const record = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash },
  });

  if (!record || record.expiresAt < new Date()) return null;

  // Mark the email as verified and clean up the token in one transaction
  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { emailVerified: new Date() },
    }),
    prisma.emailVerificationToken.delete({ where: { id: record.id } }),
  ]);

  return record.userId;
}

// ---------------------------------------------------------------------------
// Password reset
// ---------------------------------------------------------------------------

/** Create a password reset token for the given email. Returns null if the
 *  email doesn't belong to any user (don't leak this to the caller). */
export async function createPasswordResetToken(
  email: string,
): Promise<{ token: string; userEmail: string } | null> {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) return null;

  const token = generateToken();
  const tokenHash = hashToken(token);

  // Invalidate any existing tokens for this user
  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    },
  });

  return { token, userEmail: user.email };
}

/** Verify a password reset token. Returns the userId on success, null on failure. */
export async function verifyPasswordResetToken(
  token: string,
): Promise<string | null> {
  const tokenHash = hashToken(token);
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
  });

  if (!record || record.expiresAt < new Date() || record.usedAt) return null;

  return record.userId;
}

/** Mark a password reset token as used and update the user's password. */
export async function consumePasswordResetToken(
  token: string,
  newHashedPassword: string,
): Promise<boolean> {
  const tokenHash = hashToken(token);
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
  });

  if (!record || record.expiresAt < new Date() || record.usedAt) return false;

  const now = new Date();
  await prisma.$transaction([
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: now },
    }),
    // Update password AND bump tokenValidFrom — invalidates all existing sessions
    prisma.user.update({
      where: { id: record.userId },
      data: { password: newHashedPassword, tokenValidFrom: now },
    }),
  ]);

  return true;
}
