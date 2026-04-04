"use client";
import { useState } from "react";
import { Search, X } from "lucide-react";
import Modal from "~/app/components/ui/Modal";
import { api } from "~/trpc/react";
import Avatar from "~/app/components/ui/Avatar";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConversationReady: (id: string) => void;
};

type UserResult = {
  id: string;
  username: string;
  displayName: string | null;
  photo: string | null;
  isPrivate: boolean;
  _count: { followers: number };
};

export default function NewConversationModal({ isOpen, onClose, onConversationReady }: Props) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<UserResult[]>([]);
  const [groupName, setGroupName] = useState("");

  const { data: results } = api.user.search.useQuery(
    { query },
    { enabled: query.trim().length > 0 },
  );

  const { mutate: getOrCreateDM, isPending: isDMPending } = api.messages.getOrCreateDM.useMutation({
    onSuccess: (convo) => {
      onConversationReady(convo.id);
      onClose();
      reset();
    },
  });

  const { mutate: createGroup, isPending: isGroupPending } = api.messages.createGroup.useMutation({
    onSuccess: (convo) => {
      onConversationReady(convo.id);
      onClose();
      reset();
    },
  });

  const reset = () => {
    setQuery("");
    setSelected([]);
    setGroupName("");
  };

  const toggle = (user: UserResult) => {
    setSelected((prev) =>
      prev.find((u) => u.id === user.id) ? prev.filter((u) => u.id !== user.id) : [...prev, user],
    );
  };

  const isGroup = selected.length > 1;

  const handleStart = () => {
    if (selected.length === 0) return;
    if (isGroup) {
      if (!groupName.trim()) return;
      createGroup({ memberIds: selected.map((u) => u.id), name: groupName.trim() });
    } else if (selected[0]) {
      getOrCreateDM({ userId: selected[0].id });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={() => { onClose(); reset(); }} title="New message">
      <div className="space-y-3">
        {/* Selected chips */}
        {selected.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {selected.map((u) => (
              <span key={u.id} className="flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-medium text-indigo-700">
                {u.displayName ?? u.username}
                <button onClick={() => toggle(u)}><X size={11} /></button>
              </span>
            ))}
          </div>
        )}

        {/* Group name (only when 2+ selected) */}
        {isGroup && (
          <input
            type="text"
            placeholder="Group name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors"
          />
        )}

        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people…"
            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-2.5 pl-8 pr-3 text-sm focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors"
          />
        </div>

        {/* Results */}
        {results && results.length > 0 && (
          <ul className="-mx-4 divide-y divide-neutral-100 max-h-56 overflow-y-auto">
            {results.map((user) => {
              const isSelected = !!selected.find((u) => u.id === user.id);
              return (
                <li key={user.id}>
                  <button
                    onClick={() => toggle(user)}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${isSelected ? "bg-indigo-50" : "hover:bg-neutral-50"}`}
                  >
                    <Avatar user={user} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-neutral-900">{user.displayName ?? user.username}</p>
                      <p className="truncate text-xs text-neutral-500">@{user.username}</p>
                    </div>
                    {isSelected && <div className="h-4 w-4 shrink-0 rounded-full bg-indigo-600" />}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button onClick={() => { onClose(); reset(); }} className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleStart}
            disabled={selected.length === 0 || (isGroup && !groupName.trim()) || isDMPending || isGroupPending}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
          >
            {isDMPending || isGroupPending ? "Opening…" : isGroup ? "Create group" : "Open chat"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
