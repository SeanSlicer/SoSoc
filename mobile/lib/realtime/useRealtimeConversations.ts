import { useEffect } from "react";
import { supabase } from "../supabase";
import { trpc } from "../trpc";

/**
 * Subscribes to message inserts across all conversations so the list view's
 * unread counts and previews update without polling. Mirrors the web hook in
 * `src/hooks/useRealtimeMessages.ts`.
 */
export function useRealtimeConversations(currentUserId: string) {
  const utils = trpc.useUtils();

  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel("mobile-all-messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => {
          void utils.messages.getTotalUnread.invalidate();
          void utils.messages.getConversations.invalidate();
          void utils.messages.getRequests.invalidate();
          void utils.messages.getRequestCount.invalidate();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [currentUserId, utils]);
}

/**
 * Subscribes to message inserts for a specific conversation. Invalidates the
 * thread's message list so the UI updates instantly on new sends.
 */
export function useRealtimeThread(conversationId: string) {
  const utils = trpc.useUtils();

  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`mobile-messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          void utils.messages.getMessages.invalidate({ conversationId });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId, utils]);
}
