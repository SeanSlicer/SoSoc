"use client";
import { useState } from "react";
import { MessageSquare } from "lucide-react";
import ConversationList from "./ConversationList";
import MessageThread from "./MessageThread";
import NewConversationModal from "./NewConversationModal";
import { api } from "~/trpc/react";

type Props = { currentUserId: string };

export default function MessagesPage({ currentUserId }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);

  // Cache is invalidated by NavSidebar's useRealtimeConversations() subscription.
  const { data: convos } = api.messages.getConversations.useQuery();

  const selectedConvo = convos?.find((c) => c.id === selectedId);

  return (
    <>
      <div className="flex h-[calc(100vh-4rem)] md:h-screen overflow-hidden">
        {/* Sidebar — hidden on mobile when thread is open */}
        <div className={`w-full md:w-80 shrink-0 ${selectedId ? "hidden md:flex" : "flex"} flex-col`}>
          <ConversationList
            selectedId={selectedId}
            onSelect={setSelectedId}
            onNewMessage={() => setShowNewModal(true)}
            currentUserId={currentUserId}
          />
        </div>

        {/* Thread panel */}
        <div className={`flex-1 ${!selectedId ? "hidden md:flex" : "flex"} flex-col`}>
          {selectedId ? (
            <MessageThread
              conversationId={selectedId}
              conversation={selectedConvo}
              currentUserId={currentUserId}
              onBack={() => setSelectedId(null)}
            />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-neutral-400 dark:text-neutral-500">
              <MessageSquare size={40} className="text-neutral-300 dark:text-neutral-700" />
              <p className="text-sm">Select a conversation or start a new one</p>
            </div>
          )}
        </div>
      </div>

      <NewConversationModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        onConversationReady={(id) => { setSelectedId(id); setShowNewModal(false); }}
      />
    </>
  );
}
