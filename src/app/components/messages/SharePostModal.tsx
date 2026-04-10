"use client";
import { useState } from "react";
import { Search } from "lucide-react";
import Modal from "~/app/components/ui/Modal";
import { api } from "~/trpc/react";
import Avatar from "~/app/components/ui/Avatar";

type Props = {
  postId: string | null;
  onClose: () => void;
};

export default function SharePostModal({ postId, onClose }: Props) {
  const utils = api.useUtils();
  const [query, setQuery] = useState("");
  const [sentTo, setSentTo] = useState<string[]>([]);

  const { data: convos } = api.messages.getConversations.useQuery(undefined, { enabled: !!postId });
  const { data: searchResults } = api.user.search.useQuery({ query }, { enabled: query.trim().length > 0 });

  const { mutate: getOrCreateDM } = api.messages.getOrCreateDM.useMutation({
    onSuccess: (convo) => sendToConvo(convo.id),
  });

  const { mutate: send } = api.messages.send.useMutation({
    onSuccess: (msg) => {
      setSentTo((prev) => [...prev, msg.conversationId]);
      void utils.messages.getConversations.invalidate();
    },
  });

  const sendToConvo = (conversationId: string) => {
    if (!postId || sentTo.includes(conversationId)) return;
    send({ conversationId, sharedPostId: postId });
  };

  const handleClose = () => {
    setSentTo([]);
    setQuery("");
    onClose();
  };

  return (
    <Modal isOpen={!!postId} onClose={handleClose} title="Share post">
      <div className="space-y-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search conversations or people…"
            className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 py-2.5 pl-8 pr-3 text-sm focus:border-indigo-400 focus:bg-white dark:focus:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors"
          />
        </div>

        <div className="max-h-72 overflow-y-auto -mx-4 divide-y divide-neutral-100 dark:divide-neutral-800">
          {/* Existing conversations when not searching */}
          {!query && convos?.map((c) => {
            const others = c.members.filter((m) => m.userId !== c.members[0]?.userId);
            const displayName = c.name ?? others[0]?.user.displayName ?? others[0]?.user.username ?? "Conversation";
            const isSent = sentTo.includes(c.id);

            return (
              <button
                key={c.id}
                onClick={() => sendToConvo(c.id)}
                disabled={isSent}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-60 transition-colors"
              >
                {others[0]?.user && <Avatar user={others[0].user} size="sm" />}
                <span className="flex-1 truncate text-sm font-medium text-neutral-800 dark:text-neutral-200">{displayName}</span>
                {isSent && <span className="text-xs text-emerald-600 font-medium">Sent</span>}
              </button>
            );
          })}

          {/* User search results — creates a new DM */}
          {query && searchResults?.map((user) => (
            <button
              key={user.id}
              onClick={() => getOrCreateDM({ userId: user.id })}
              className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-neutral-50 transition-colors"
            >
              <Avatar user={user} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-neutral-900">{user.displayName ?? user.username}</p>
                <p className="truncate text-xs text-neutral-500">@{user.username}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}
