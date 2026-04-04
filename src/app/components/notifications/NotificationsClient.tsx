"use client";
import { useEffect } from "react";
import Link from "next/link";
import { Heart, MessageCircle, UserPlus, Bell, UserCheck } from "lucide-react";
import { api } from "~/trpc/react";
import Avatar from "~/app/components/ui/Avatar";
import { timeAgo } from "~/lib/timeAgo";
import { type NotificationType } from "@prisma/client";

function NotificationIcon({ type }: { type: NotificationType }) {
  switch (type) {
    case "NEW_LIKE":
      return <Heart size={14} className="text-red-500 fill-red-500" />;
    case "NEW_COMMENT":
      return <MessageCircle size={14} className="text-indigo-500" />;
    case "NEW_FOLLOWER":
      return <UserPlus size={14} className="text-emerald-500" />;
    case "FOLLOW_REQUEST":
      return <UserPlus size={14} className="text-amber-500" />;
    case "FOLLOW_REQUEST_ACCEPTED":
      return <UserCheck size={14} className="text-emerald-500" />;
    default:
      return <Bell size={14} className="text-neutral-400" />;
  }
}

export default function NotificationsClient() {
  const utils = api.useUtils();
  const { data: notifications, isLoading } = api.notification.getAll.useQuery();
  const { mutate: markAllRead } = api.notification.markAllRead.useMutation({
    onSuccess: () => {
      void utils.notification.getUnreadCount.invalidate();
      void utils.notification.getAll.invalidate();
    },
  });

  // Mark all as read when this page mounts
  useEffect(() => {
    markAllRead();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-neutral-100 px-4 py-3">
        <h1 className="font-bold text-neutral-900">Notifications</h1>
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        </div>
      )}

      {!isLoading && (!notifications || notifications.length === 0) && (
        <div className="flex flex-col items-center justify-center py-24 text-center px-4">
          <Bell size={40} className="text-neutral-300 mb-3" />
          <p className="text-neutral-500 text-sm">No notifications yet.</p>
          <p className="text-neutral-400 text-xs mt-1">When someone follows you, likes or comments on a post, it&apos;ll show up here.</p>
        </div>
      )}

      <div className="divide-y divide-neutral-100">
        {notifications?.map((n) => (
          <div
            key={n.id}
            className={`flex items-start gap-3 px-4 py-4 transition-colors hover:bg-neutral-50 ${
              !n.isRead ? "bg-indigo-50/50" : ""
            }`}
          >
            {/* Actor avatar */}
            <div className="relative shrink-0">
              {n.actor ? (
                <Link href={`/profile/${n.actor.username}`}>
                  <Avatar user={n.actor} size="md" />
                </Link>
              ) : (
                <div className="h-10 w-10 rounded-full bg-neutral-200 flex items-center justify-center">
                  <Bell size={16} className="text-neutral-400" />
                </div>
              )}
              {/* Type badge */}
              <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-neutral-100">
                <NotificationIcon type={n.type} />
              </span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-neutral-800">{n.content}</p>
              <p className="mt-0.5 text-xs text-neutral-400">{timeAgo(new Date(n.createdAt))}</p>
            </div>

            {/* Unread dot */}
            {!n.isRead && (
              <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-500" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
