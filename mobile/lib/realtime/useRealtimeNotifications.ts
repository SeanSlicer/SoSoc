import { useEffect } from "react";
import { supabase } from "../supabase";
import { trpc } from "../trpc";

/**
 * Subscribes to notification inserts so the bell badge and list update
 * instantly without polling. Mirrors `src/hooks/useRealtimeNotifications.ts`.
 */
export function useRealtimeNotifications(currentUserId: string) {
  const utils = trpc.useUtils();

  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel("mobile-all-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        () => {
          void utils.notification.getUnreadCount.invalidate();
          void utils.notification.getAll.invalidate();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [currentUserId, utils]);
}
