"use client";
import { Edit } from "lucide-react";
import { api } from "~/trpc/react";
import Avatar from "~/app/components/ui/Avatar";
import { timeAgo } from "~/lib/timeAgo";

type Props = {
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNewMessage: () => void;
  currentUserId: string;
};

export default function ConversationList({ selectedId, onSelect, onNewMessage, currentUserId }: Props) {
  const { data: convos, isLoading } = api.messages.getConversations.useQuery(undefined, {
    refetchInterval: 5000,
  });

  return (
    <div className="flex h-full flex-col border-r border-neutral-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
        <h2 className="font-bold text-neutral-900">Messages</h2>
        <button
          onClick={onNewMessage}
          className="rounded-lg p-1.5 text-neutral-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
          title="New message"
        >
          <Edit size={18} />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="flex justify-center py-12">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          </div>
        )}

        {!isLoading && convos?.length === 0 && (
          <p className="py-12 text-center text-sm text-neutral-400">No conversations yet</p>
        )}

        {convos?.map((c) => {
          const otherMembers = c.members.filter((m) => m.userId !== currentUserId);
          const displayUser = otherMembers[0]?.user;
          const name = c.name ?? displayUser?.displayName ?? displayUser?.username ?? "Unknown";
          const lastMsg = c.messages[0];
          const isSelected = selectedId === c.id;

          return (
            <button
              key={c.id}
              onClick={() => onSelect(c.id)}
              className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                isSelected ? "bg-indigo-50" : "hover:bg-neutral-50"
              }`}
            >
              {/* Avatar — show group indicator for multi-member */}
              <div className="relative shrink-0">
                {displayUser ? (
                  <Avatar user={displayUser} size="md" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 font-bold text-sm">
                    {name.charAt(0).toUpperCase()}
                  </div>
                )}
                {c.unread > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold text-white">
                    {c.unread > 99 ? "99+" : c.unread}
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-1">
                  <p className={`truncate text-sm ${c.unread > 0 ? "font-semibold text-neutral-900" : "font-medium text-neutral-800"}`}>
                    {name}
                  </p>
                  {lastMsg && (
                    <span className="shrink-0 text-xs text-neutral-400">{timeAgo(new Date(lastMsg.createdAt))}</span>
                  )}
                </div>
                {lastMsg && (
                  <p className={`truncate text-xs ${c.unread > 0 ? "text-neutral-600" : "text-neutral-400"}`}>
                    {lastMsg.senderId === currentUserId ? "You: " : ""}
                    {lastMsg.sharedPostId ? "📎 Shared a post" : (lastMsg.content ?? "")}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
