"use client";
import { useState, useEffect, useRef } from "react";
import { Send, ArrowLeft } from "lucide-react";
import { api, type RouterOutputs } from "~/trpc/react";
import Avatar from "~/app/components/ui/Avatar";
import { timeAgo } from "~/lib/timeAgo";
import Link from "next/link";

type Conversation = RouterOutputs["messages"]["getConversations"][number];
type Message = RouterOutputs["messages"]["getMessages"]["messages"][number];

type Props = {
  conversationId: string;
  conversation: Conversation | undefined;
  currentUserId: string;
  onBack: () => void;
};

// Renders a shared post preview inside a message bubble
function SharedPostPreview({ post }: { post: NonNullable<Message["sharedPost"]> }) {
  return (
    <Link
      href={`/profile/${post.author.username}`}
      className="mt-1 block rounded-xl border border-neutral-200 bg-neutral-50 p-3 hover:bg-neutral-100 transition-colors"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <Avatar user={post.author} size="sm" />
        <span className="text-xs font-semibold text-neutral-700">{post.author.displayName ?? post.author.username}</span>
      </div>
      <p className="text-xs text-neutral-600 line-clamp-2">{post.content}</p>
      {post.images && post.images.length > 0 && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.images[0]} alt="Post" className="mt-1.5 w-full max-h-32 object-cover rounded-lg" />
      )}
      {post.videoUrl && (
        <video src={post.videoUrl} className="mt-1.5 w-full max-h-32 rounded-lg" preload="metadata" />
      )}
    </Link>
  );
}

export default function MessageThread({ conversationId, conversation, currentUserId, onBack }: Props) {
  const utils = api.useUtils();
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = api.messages.getMessages.useQuery(
    { conversationId },
    { refetchInterval: 3000 },
  );

  const { mutate: send, isPending } = api.messages.send.useMutation({
    onSuccess: () => {
      setText("");
      void utils.messages.getMessages.invalidate({ conversationId });
      void utils.messages.getConversations.invalidate();
    },
  });

  const { mutate: markRead } = api.messages.markRead.useMutation();

  // Mark as read when the thread opens and when new messages arrive
  useEffect(() => {
    markRead({ conversationId });
    void utils.messages.getTotalUnread.invalidate();
    void utils.messages.getConversations.invalidate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, data?.messages.length]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data?.messages.length]);

  const otherMembers = conversation?.members.filter((m) => m.userId !== currentUserId) ?? [];
  const threadName =
    conversation?.name ??
    otherMembers[0]?.user.displayName ??
    otherMembers[0]?.user.username ??
    "Conversation";

  const handleSend = () => {
    if (!text.trim()) return;
    send({ conversationId, content: text.trim() });
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-neutral-100 px-4 py-3">
        <button onClick={onBack} className="md:hidden rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 transition-colors">
          <ArrowLeft size={18} />
        </button>
        {otherMembers[0]?.user && <Avatar user={otherMembers[0].user} size="sm" />}
        <div>
          <p className="font-semibold text-sm text-neutral-900">{threadName}</p>
          {otherMembers.length === 1 && otherMembers[0]?.user && (
            <p className="text-xs text-neutral-400">@{otherMembers[0].user.username}</p>
          )}
          {otherMembers.length > 1 && (
            <p className="text-xs text-neutral-400">{otherMembers.length + 1} members</p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {isLoading && (
          <div className="flex justify-center py-12">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          </div>
        )}

        {data?.messages.map((msg, i) => {
          const isOwn = msg.senderId === currentUserId;
          const prevMsg = data.messages[i - 1];
          const showAvatar = !isOwn && msg.senderId !== prevMsg?.senderId;

          return (
            <div key={msg.id} className={`flex items-end gap-2 ${isOwn ? "flex-row-reverse" : ""}`}>
              <div className="w-7 shrink-0">
                {showAvatar && !isOwn && <Avatar user={msg.sender} size="sm" />}
              </div>
              <div className={`max-w-[70%] ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
                {msg.content && (
                  <div className={`rounded-2xl px-3.5 py-2 text-sm ${
                    isOwn
                      ? "rounded-br-sm bg-indigo-600 text-white"
                      : "rounded-bl-sm bg-neutral-100 text-neutral-900"
                  }`}>
                    {msg.content}
                  </div>
                )}
                {msg.sharedPost && <SharedPostPreview post={msg.sharedPost} />}
                <span className="mt-0.5 px-1 text-[10px] text-neutral-400">
                  {timeAgo(new Date(msg.createdAt))}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-neutral-100 px-4 py-3">
        <div className="flex items-end gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Message…"
            rows={1}
            className="flex-1 resize-none rounded-2xl border border-neutral-200 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={isPending || !text.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
