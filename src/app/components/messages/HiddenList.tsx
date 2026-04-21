"use client";
import { useState, useRef } from "react";
import { MoreHorizontal, Eye, Trash2 } from "lucide-react";
import { api } from "~/trpc/react";
import Avatar from "~/app/components/ui/Avatar";
import { timeAgo } from "~/lib/timeAgo";

type Props = {
  selectedId: string | null;
  onSelect: (id: string) => void;
  currentUserId: string;
};

function HiddenConvoMenu({ onUnhide, onDelete }: { onUnhide: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        onBlur={(e) => { if (!ref.current?.contains(e.relatedTarget as Node)) setOpen(false); }}
        aria-label="Conversation options"
        className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 dark:text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
      >
        <MoreHorizontal size={15} />
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-30 w-40 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-lg overflow-hidden">
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => { e.stopPropagation(); setOpen(false); onUnhide(); }}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            <Eye size={15} />
            Unhide
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => { e.stopPropagation(); setOpen(false); onDelete(); }}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
          >
            <Trash2 size={15} />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

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

              <HiddenConvoMenu
                onUnhide={() => unhide({ conversationId: c.id })}
                onDelete={() => del({ conversationId: c.id })}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
