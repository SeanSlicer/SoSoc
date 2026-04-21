"use client";
import { Check, X } from "lucide-react";
import { api } from "~/trpc/react";
import Avatar from "~/app/components/ui/Avatar";
import { timeAgo } from "~/lib/shared/timeAgo";

type Props = {
  selectedId: string | null;
  onSelect: (id: string) => void;
  currentUserId: string;
};

export default function RequestList({ selectedId, onSelect, currentUserId }: Props) {
  const utils = api.useUtils();
  const { data: requests, isLoading } = api.messages.getRequests.useQuery();

  const invalidate = () => {
    void utils.messages.getRequests.invalidate();
    void utils.messages.getRequestCount.invalidate();
  };

  const { mutate: accept } = api.messages.acceptRequest.useMutation({ onSuccess: () => {
    void utils.messages.getConversations.invalidate();
    invalidate();
  }});

  const { mutate: decline } = api.messages.declineRequest.useMutation({ onSuccess: invalidate });

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-neutral-100 dark:border-neutral-800 px-4 py-3">
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Message requests are from people you don't follow back.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="flex justify-center py-12">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          </div>
        )}

        {!isLoading && requests?.length === 0 && (
          <p className="py-12 text-center text-sm text-neutral-400">No message requests</p>
        )}

        {requests?.map((c) => {
          const otherMembers = c.members.filter((m) => m.userId !== currentUserId);
          const displayUser = otherMembers[0]?.user;
          const name = displayUser?.displayName ?? displayUser?.username ?? "Unknown";
          const lastMsg = c.messages[0];
          const isSelected = selectedId === c.id;

          return (
            <div
              key={c.id}
              className={`flex items-center gap-3 pl-4 pr-3 py-3 transition-colors ${
                isSelected ? "bg-indigo-50 dark:bg-indigo-950" : "hover:bg-neutral-50 dark:hover:bg-neutral-800"
              }`}
            >
              <div className="shrink-0">
                {displayUser ? (
                  <Avatar user={displayUser} size="md" href={`/profile/${displayUser.username}`} />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 font-bold text-sm">
                    {name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <button onClick={() => onSelect(c.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-1">
                    <p className="truncate text-sm font-medium text-neutral-800 dark:text-neutral-200">{name}</p>
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

              {/* Accept / Decline */}
              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => accept({ conversationId: c.id })}
                  title="Accept"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors"
                >
                  <Check size={14} />
                </button>
                <button
                  onClick={() => decline({ conversationId: c.id })}
                  title="Decline"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:bg-red-100 dark:hover:bg-red-950 hover:text-red-500 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
