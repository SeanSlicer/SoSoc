"use client";
import { useEffect } from "react";
import { supabase } from "~/lib/client/supabase";
import { api } from "~/trpc/react";

/**
 * Subscribes to new messages in a specific conversation via Supabase Realtime.
 * When a message is inserted, invalidates the tRPC message cache so the UI
 * updates instantly without polling.
 *
 * Requires the `messages` table to be added to the supabase_realtime publication:
 *   ALTER PUBLICATION supabase_realtime ADD TABLE messages;
 */
export function useRealtimeMessages(conversationId: string) {
  const utils = api.useUtils();

  useEffect(() => {
    const channel = supabase
      .channel(`messages:${conversationId}`)
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

/**
 * Subscribes to any new message across all conversations via Supabase Realtime.
 * Used by the nav sidebar to update the unread badge and conversation list
 * without polling.
 */
export function useRealtimeConversations() {
  const utils = api.useUtils();

  useEffect(() => {
    const channel = supabase
      .channel("all-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        () => {
          void utils.messages.getTotalUnread.invalidate();
          void utils.messages.getConversations.invalidate();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [utils]);
}
