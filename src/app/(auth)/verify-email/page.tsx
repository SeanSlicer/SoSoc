"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Mail, AlertCircle } from "lucide-react";
import Link from "next/link";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [resendError, setResendError] = useState("");

  const handleResend = async () => {
    setSending(true);
    setResendError("");
    try {
      const res = await fetch("/api/auth/resend-verification", { method: "POST" });
      if (res.status === 429) {
        setResendError("Too many requests. Please wait a few minutes.");
        return;
      }
      if (!res.ok) {
        setResendError("Failed to send. Please try again.");
        return;
      }
      setSent(true);
    } catch {
      setResendError("Something went wrong.");
    } finally {
      setSending(false);
    }
  };

  if (error) {
    return (
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-8 shadow-sm text-center">
          <AlertCircle size={40} className="mx-auto mb-4 text-red-500" />
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">Link expired</h1>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            {error === "expired"
              ? "This verification link has expired."
              : "This verification link is invalid."}
          </p>
          <button
            onClick={() => void handleResend()}
            disabled={sending || sent}
            className="mt-6 w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {sent ? "Email sent!" : sending ? "Sending…" : "Resend verification email"}
          </button>
          {resendError && (
            <p className="mt-2 text-xs text-red-500">{resendError}</p>
          )}
          <Link href="/feed" className="mt-3 block text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200">
            Continue to feed
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-8 shadow-sm text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950">
          <Mail size={28} className="text-indigo-600 dark:text-indigo-400" />
        </div>
        <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">Verify your email</h1>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          We sent a verification link to your email. Click it to activate your account.
        </p>

        {sent ? (
          <p className="mt-6 text-sm font-medium text-emerald-600 dark:text-emerald-400">
            Email sent — check your inbox!
          </p>
        ) : (
          <>
            <button
              onClick={() => void handleResend()}
              disabled={sending}
              className="mt-6 w-full rounded-xl border border-neutral-200 dark:border-neutral-700 px-4 py-2.5 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {sending ? "Sending…" : "Resend email"}
            </button>
            {resendError && (
              <p className="mt-2 text-xs text-red-500">{resendError}</p>
            )}
          </>
        )}

        <Link href="/feed" className="mt-3 block text-sm text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300">
          Skip for now
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
