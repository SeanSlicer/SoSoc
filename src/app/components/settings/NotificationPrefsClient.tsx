"use client";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { api } from "~/trpc/react";

type PrefKey =
  | "notifyNewFollower"
  | "notifyNewLike"
  | "notifyNewComment"
  | "notifyFollowRequest"
  | "notifyFollowAccepted"
  | "notifyNewMessage";

const PREFS: { key: PrefKey; label: string; description: string }[] = [
  { key: "notifyNewFollower",    label: "New followers",           description: "When someone follows you" },
  { key: "notifyNewLike",        label: "Likes",                   description: "When someone likes your post" },
  { key: "notifyNewComment",     label: "Comments",                description: "When someone comments on your post" },
  { key: "notifyFollowRequest",  label: "Follow requests",         description: "When someone requests to follow you" },
  { key: "notifyFollowAccepted", label: "Follow request accepted", description: "When your follow request is accepted" },
  { key: "notifyNewMessage",     label: "Direct messages",         description: "When you receive a new message" },
];

export default function NotificationPrefsClient() {
  const utils = api.useUtils();
  const { data: prefs, isLoading } = api.notification.getPrefs.useQuery();
  const { mutate: updatePrefs } = api.notification.updatePrefs.useMutation({
    onSuccess: () => void utils.notification.getPrefs.invalidate(),
  });

  const handleToggle = (key: PrefKey, value: boolean) => {
    updatePrefs({ [key]: value });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900">
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm border-b border-neutral-100 dark:border-neutral-800 px-4 py-3 flex items-center gap-3">
        <Link href="/settings" className="rounded-lg p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors">
          <ChevronLeft size={20} />
        </Link>
        <h1 className="font-bold text-neutral-900 dark:text-neutral-100">Notifications</h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        </div>
      ) : (
        <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {PREFS.map(({ key, label, description }) => {
            const enabled = prefs?.[key] ?? true;
            return (
              <li key={key} className="flex items-center justify-between gap-4 px-4 py-4">
                <div>
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{label}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{description}</p>
                </div>
                <button
                  role="switch"
                  aria-checked={enabled}
                  onClick={() => handleToggle(key, !enabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900 ${
                    enabled ? "bg-indigo-600" : "bg-neutral-200 dark:bg-neutral-700"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 mt-0.5 ${
                      enabled ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
