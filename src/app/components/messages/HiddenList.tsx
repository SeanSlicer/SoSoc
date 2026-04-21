"use client";
import { Eye, Trash2 } from "lucide-react";
import { api } from "~/trpc/react";
import Avatar from "~/app/components/ui/Avatar";
import DropdownMenu from "~/app/components/ui/DropdownMenu";
import { timeAgo } from "~/lib/shared/timeAgo";

type Props = {
  selectedId: string | null;
  onSelect: (id: string) => void;
  currentUserId: string;
};

export default function HiddenList({ selectedId, onSelect, currentUserId }: Props) {
  const utils = api.useUtils();
  const { data: hidden, isLoading } = api.messages.getHidden.useQuery();

  const invalidate = () => void utils.messages.getHidden.invalidate();

  const { mutate: unhide } = api.messages.unhideConversation.useMutation({
    onSuccess: () => {
      void utils.messages.getConversations.invalidate();
      invalidate();
    },
  });

  const { mutate: del } = api.messages.deleteConversation.useMutation({ onSuccess: invalidate });

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-neutral-100 dark:border-neutral-800 px-4 py-3">
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Hidden conversations won&apos;t appear in Messages unless you unhide them.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="flex justify-center py-12">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          </div>
        )}

        {!isLoading && hidden?.length === 0 && (
          <p className="py-12 text-center text-sm text-neutral-400">No hidden conversations</p>
        )}

        {hidden?.map((c) => {
          const otherMembers = c.members.filter((m) => m.userId !== currentUserId);
          const displayUser = otherMembers[0]?.user;
          const name = c.name ?? displayUser?.displayName ?? displayUser?.username ?? "Unknown";
          const lastMsg = c.messages[0];
          const isSelected = selectedId === c.id;

          return (
            <div key={c.id} className={`flex items-center gap-1 pl-4 pr-2 transition-colors ${isSelected ? "bg-indigo-50 dark:bg-indigo-950" : "hover:bg-neutral-50 dark:hover:bg-neutral-800"}`}>
              <div className="shrink-0 py-3">
                {displayUser ? (
                  <Avatar user={displayUser} size="md" href={`/profile/${displayUser.username}`} />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 font-bold text-sm">
                    {name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <button
                onClick={() => onSelect(c.id)}
                className="flex min-w-0 flex-1 items-center gap-3 pl-3 py-3 text-left"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-1">
                    <p className="truncate text-sm font-medium text-neutral-600 dark:text-neutral-400">{name}</p>
                    {lastMsg && (
                      <span className="shrink-0 text-xs text-neutral-400">{timeAgo(new Date(lastMsg.createdAt))}</span>
                    )}
                  </div>
                  {lastMsg && (
                    <p className="truncate text-xs text-neutral-400 dark:text-neutral-500">
                      {lastMsg.sharedPostId ? "📎 Shared a post" : (lastMsg.content ?? "")}
                    </p>
                  )}
                </div>
              </button>

              <DropdownMenu
                label="Conversation options"
                items={[
                  { label: "Unhide", icon: <Eye size={15} />, onClick: () => unhide({ conversationId: c.id }) },
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
