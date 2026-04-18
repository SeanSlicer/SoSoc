import "server-only";
import { Resend } from "resend";
import { env } from "~/env";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

const FROM = "sosoc <onboarding@resend.dev>";

function logFallback(label: string, url: string) {
  console.warn(`[email] RESEND_API_KEY not set — ${label} email not sent.`);
  console.info(`[email] ${label} URL: ${url}`);
}

export async function sendVerificationEmail(to: string, token: string) {
  const verifyUrl = `${env.NEXT_PUBLIC_APP_URL}/api/auth/verify-email?token=${token}`;

  if (!resend) {
    logFallback("Verification", verifyUrl);
    return;
  }

  await resend.emails.send({
    from: FROM,
    to,
    subject: "Verify your sosoc email",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 16px">
        <h1 style="font-size:24px;font-weight:700;margin-bottom:8px">Verify your email</h1>
        <p style="color:#555;margin-bottom:24px">
          Click the button below to confirm your email address and activate your sosoc account.
          This link expires in 24 hours.
        </p>
        <a href="${verifyUrl}"
           style="display:inline-block;background:#4f46e5;color:#fff;font-weight:600;
                  padding:12px 24px;border-radius:12px;text-decoration:none">
          Verify email
        </a>
        <p style="margin-top:24px;font-size:12px;color:#999">
          If you didn't create a sosoc account, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const resetUrl = `${env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

  if (!resend) {
    logFallback("Password reset", resetUrl);
    return;
  }

  await resend.emails.send({
    from: FROM,
    to,
    subject: "Reset your sosoc password",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 16px">
        <h1 style="font-size:24px;font-weight:700;margin-bottom:8px">Reset your password</h1>
        <p style="color:#555;margin-bottom:24px">
          Click the button below to choose a new password.
          This link expires in 1 hour and can only be used once.
        </p>
        <a href="${resetUrl}"
           style="display:inline-block;background:#4f46e5;color:#fff;font-weight:600;
                  padding:12px 24px;border-radius:12px;text-decoration:none">
          Reset password
        </a>
        <p style="margin-top:24px;font-size:12px;color:#999">
          If you didn't request a password reset, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}
