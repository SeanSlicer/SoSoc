"use client";
import { Edit, EyeOff, Trash2 } from "lucide-react";
import { api } from "~/trpc/react";
import Avatar from "~/app/components/ui/Avatar";
import DropdownMenu from "~/app/components/ui/DropdownMenu";
import { timeAgo } from "~/lib/shared/timeAgo";

type Props = {
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNewMessage: () => void;
  currentUserId: string;
};

export default function ConversationList({ selectedId, onSelect, onNewMessage, currentUserId }: Props) {
  const utils = api.useUtils();

  const { data: convos, isLoading } = api.messages.getConversations.useQuery();

  const invalidate = () => {
    void utils.messages.getConversations.invalidate();
    void utils.messages.getTotalUnread.invalidate();
  };

  const { mutate: hide } = api.messages.hideConversation.useMutation({ onSuccess: invalidate });
  const { mutate: del } = api.messages.deleteConversation.useMutation({ onSuccess: invalidate });

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 px-4 py-3">
        <h2 className="font-bold text-neutral-900 dark:text-neutral-100">Messages</h2>
        <button
          onClick={onNewMessage}
          className="rounded-lg p-1.5 text-neutral-400 hover:bg-indigo-50 dark:hover:bg-indigo-950 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          title="New message"
        >
          <Edit size={18} />
        </button>
      </div>

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
            <div key={c.id} className={`flex items-center gap-1 pl-4 pr-2 transition-colors ${isSelected ? "bg-indigo-50 dark:bg-indigo-950" : "hover:bg-neutral-50 dark:hover:bg-neutral-800"}`}>
              <div className="relative shrink-0 py-3">
                {displayUser ? (
                  <Avatar user={displayUser} size="md" href={`/profile/${displayUser.username}`} />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 font-bold text-sm">
                    {name.charAt(0).toUpperCase()}
                  </div>
                )}
                {c.unread > 0 && (
                  <span className="absolute -right-0.5 top-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold text-white">
                    {c.unread > 99 ? "99+" : c.unread}
                  </span>
                )}
              </div>

              <button
                onClick={() => onSelect(c.id)}
                className="flex min-w-0 flex-1 items-center gap-3 pl-3 py-3 text-left"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-1">
                    <p className={`truncate text-sm ${c.unread > 0 ? "font-semibold text-neutral-900 dark:text-neutral-100" : "font-medium text-neutral-800 dark:text-neutral-200"}`}>
                      {name}
                    </p>
                    {lastMsg && (
                      <span className="shrink-0 text-xs text-neutral-400">{timeAgo(new Date(lastMsg.createdAt))}</span>
                    )}
                  </div>
                  {lastMsg && (
                    <p className={`truncate text-xs ${c.unread > 0 ? "text-neutral-600 dark:text-neutral-300" : "text-neutral-400 dark:text-neutral-500"}`}>
                      {lastMsg.senderId === currentUserId ? "You: " : ""}
                      {lastMsg.sharedPostId ? "📎 Shared a post" : (lastMsg.content ?? "")}
                    </p>
                  )}
                </div>
              </button>

              <DropdownMenu
                label="Conversation options"
                items={[
                  { label: "Hide", icon: <EyeOff size={15} />, onClick: () => hide({ conversationId: c.id }) },
                  { label: "Delete", icon: <Trash2 size={15} />, onClick: () => del({ conversationId: c.id }), variant: "danger" },
                ]}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
