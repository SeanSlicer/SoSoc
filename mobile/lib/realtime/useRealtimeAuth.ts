import { useEffect } from "react";
import { apiUrl } from "../api";
import { useAuthToken } from "../auth";
import { supabase } from "../supabase";

/**
 * Keeps the Supabase Realtime client authenticated with a short-lived
 * Supabase-compatible JWT issued by the web backend. Refreshes 5 minutes
 * before expiry.
 *
 * Mount this once at the app root, inside AuthProvider.
 */
export function useRealtimeAuth() {
  const token = useAuthToken();

  useEffect(() => {
    if (!token) {
      supabase.realtime.setAuth(null);
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const refresh = async () => {
      try {
        const res = await fetch(apiUrl("/api/auth/realtime-token"), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = (await res.json()) as { token: string; expiresIn: number };
        if (cancelled) return;
        supabase.realtime.setAuth(data.token);
        // Refresh 5 minutes before expiry
        const refreshInMs = Math.max(60_000, (data.expiresIn - 300) * 1000);
        timer = setTimeout(() => void refresh(), refreshInMs);
      } catch {
        // Silent — realtime will reconnect on its own when auth succeeds
      }
    };

    void refresh();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [token]);
}
