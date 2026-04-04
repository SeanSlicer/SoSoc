"use client";
import { api } from "~/trpc/react";

export default function ImpersonationBanner() {
  const { data: me } = api.user.getMe.useQuery();

  if (!me?.isImpersonating) return null;

  const handleExit = async () => {
    await fetch("/api/admin/impersonate/exit", { method: "POST" });
    window.location.href = "/admin";
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between bg-amber-500 px-4 py-2 text-sm font-medium text-white shadow-md">
      <span>
        Impersonating <strong>@{me.username}</strong> — changes you make will affect this account
      </span>
      <button
        onClick={() => void handleExit()}
        className="rounded-lg border border-white/40 px-3 py-1 text-xs font-semibold hover:bg-white/20 transition-colors"
      >
        Exit impersonation
      </button>
    </div>
  );
}
