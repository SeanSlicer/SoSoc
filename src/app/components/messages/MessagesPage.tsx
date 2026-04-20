"use client";
import { useState } from "react";
import { MessageSquare } from "lucide-react";
import ConversationList from "./ConversationList";
import RequestList from "./RequestList";
import MessageThread from "./MessageThread";
import NewConversationModal from "./NewConversationModal";
import { api, type RouterOutputs } from "~/trpc/react";

type ActiveConversation = RouterOutputs["messages"]["getConversations"][number];
type RequestConversation = RouterOutputs["messages"]["getRequests"][number];
type AnyConversation = ActiveConversation | RequestConversation;

type Props = { currentUserId: string };

type Tab = "messages" | "requests";

export default function MessagesPage({ currentUserId }: Props) {
  const [tab, setTab] = useState<Tab>("messages");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);

  const { data: convos } = api.messages.getConversations.useQuery();
  const { data: requests } = api.messages.getRequests.useQuery();
  const { data: requestCount = 0 } = api.messages.getRequestCount.useQuery();

  const selectedConvo: AnyConversation | undefined =
    (convos?.find((c) => c.id === selectedId) ?? requests?.find((c) => c.id === selectedId)) as AnyConversation | undefined;

  const handleSelect = (id: string, fromTab: Tab) => {
    setTab(fromTab);
    setSelectedId(id);
  };

  return (
    <>
      <div className="flex h-[calc(100vh-4rem)] md:h-screen overflow-hidden">
        {/* Sidebar — hidden on mobile when thread is open */}
        <div className={`w-full md:w-80 shrink-0 ${selectedId ? "hidden md:flex" : "flex"} flex-col border-r border-neutral-200 dark:border-neutral-800`}>
          {/* Tab bar */}
          <div className="flex border-b border-neutral-100 dark:border-neutral-800">
            <button
              onClick={() => setTab("messages")}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                tab === "messages"
                  ? "border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400"
                  : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
              }`}
            >
              Messages
            </button>
            <button
              onClick={() => setTab("requests")}
              className={`relative flex-1 py-3 text-sm font-medium transition-colors ${
                tab === "requests"
                  ? "border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400"
                  : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
              }`}
            >
              Requests
              {requestCount > 0 && (
                <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold text-white">
                  {requestCount > 99 ? "99+" : requestCount}
                </span>
              )}
            </button>
          </div>

          {/* List content */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {tab === "messages" ? (
              <ConversationList
                selectedId={selectedId}
                onSelect={(id) => handleSelect(id, "messages")}
                onNewMessage={() => setShowNewModal(true)}
                currentUserId={currentUserId}
              />
            ) : (
              <RequestList
                selectedId={selectedId}
                onSelect={(id) => handleSelect(id, "requests")}
                currentUserId={currentUserId}
              />
            )}
          </div>
        </div>

        {/* Thread panel */}
        <div className={`flex-1 ${!selectedId ? "hidden md:flex" : "flex"} flex-col`}>
          {selectedId ? (
            <MessageThread
              conversationId={selectedId}
              conversation={selectedConvo as ActiveConversation | undefined}
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
