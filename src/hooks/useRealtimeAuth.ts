"use client";
import { useEffect } from "react";
import { supabase } from "~/lib/supabase";

/**
 * Fetches a Supabase-compatible JWT from /api/auth/realtime-token and sets it
 * on the Supabase Realtime client, enabling Row-Level Security filtering on
 * postgres_changes subscriptions.
 *
 * No-ops when SUPABASE_JWT_SECRET is not configured (endpoint returns 501).
 * Refreshes the token 5 minutes before expiry.
 */
export function useRealtimeAuth() {
  useEffect(() => {
    let refreshTimer: ReturnType<typeof setTimeout>;

    async function fetchAndSet() {
      const res = await fetch("/api/auth/realtime-token");
      if (!res.ok) return;

      const data = (await res.json()) as { token: string; expiresIn: number };
      await supabase.realtime.setAuth(data.token);

      // Schedule a refresh 5 minutes before the token expires
      const refreshIn = Math.max((data.expiresIn - 300) * 1000, 60_000);
      refreshTimer = setTimeout(() => void fetchAndSet(), refreshIn);
    }

    void fetchAndSet();
    return () => clearTimeout(refreshTimer);
  }, []);
}
