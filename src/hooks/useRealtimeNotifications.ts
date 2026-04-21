"use client";
import { useEffect } from "react";
import { supabase } from "~/lib/client/supabase";
import { api } from "~/trpc/react";

/**
 * Subscribes to new notifications via Supabase Realtime.
 * When a notification is inserted, invalidates the tRPC notification cache
 * so the bell badge updates instantly without polling.
 *
 * Requires the `notifications` table to be added to the supabase_realtime publication:
 *   ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
 */
export function useRealtimeNotifications() {
  const utils = api.useUtils();

  useEffect(() => {
    const channel = supabase
      .channel("all-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        () => {
          void utils.notification.getUnreadCount.invalidate();
          void utils.notification.getAll.invalidate();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [utils]);
}
