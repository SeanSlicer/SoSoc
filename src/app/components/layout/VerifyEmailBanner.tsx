"use client";
import { useState } from "react";
import { Mail, X } from "lucide-react";

export default function VerifyEmailBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  if (dismissed) return null;

  const handleResend = async () => {
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/auth/resend-verification", { method: "POST" });
      if (res.status === 429) {
        setError("Too many requests — please wait before trying again.");
        return;
      }
      if (!res.ok) {
        setError("Failed to send. Please try again.");
        return;
      }
      setSent(true);
    } catch {
      setError("Something went wrong.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800">
      <div className="mx-auto max-w-6xl px-4 py-2.5 flex items-center gap-3">
        <Mail size={15} className="shrink-0 text-amber-600 dark:text-amber-400" />
        <p className="flex-1 text-xs text-amber-800 dark:text-amber-300">
          {sent ? (
            "Verification email sent — check your inbox."
          ) : (
            <>
              Please verify your email address.{" "}
              {error ? (
                <span className="text-red-600 dark:text-red-400">{error}</span>
              ) : (
                <button
                  onClick={() => void handleResend()}
                  disabled={sending}
                  className="font-semibold underline underline-offset-2 hover:no-underline disabled:opacity-60"
                >
                  {sending ? "Sending…" : "Resend email"}
                </button>
              )}
            </>
          )}
        </p>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="shrink-0 rounded p-0.5 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900 transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
