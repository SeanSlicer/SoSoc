"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, User, Bell, LogOut, Shield, Search, MessageSquare, Sun, Moon, Monitor } from "lucide-react";
import { api } from "~/trpc/react";
import Avatar from "~/app/components/ui/Avatar";
import { useRealtimeConversations } from "~/hooks/useRealtimeMessages";
import { useRealtimeNotifications } from "~/hooks/useRealtimeNotifications";
import { useTheme, type Theme } from "~/app/components/theme/ThemeProvider";

type NavUser = {
  id: string;
  username: string;
  displayName?: string | null;
  photo?: string | null;
};

function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white leading-none">
      {count > 99 ? "99+" : count}
    </span>
  );
}

const themeOptions: { value: Theme; icon: typeof Sun; label: string }[] = [
  { value: "light", icon: Sun, label: "Light" },
  { value: "system", icon: Monitor, label: "System" },
  { value: "dark", icon: Moon, label: "Dark" },
];

export default function NavSidebar({ user: initialUser }: { user: NavUser }) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { data: me } = api.user.getMe.useQuery();
  const user = me ?? initialUser;

  // Event-driven updates via Supabase Realtime — no polling needed.
  // NavSidebar is always mounted so it's the right place for global subscriptions.
  useRealtimeConversations();
  useRealtimeNotifications();

  const { data: unreadCount = 0 } = api.notification.getUnreadCount.useQuery();
  const { data: unreadMessages = 0 } = api.messages.getTotalUnread.useQuery();

  const handleSignOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  // Core tabs shown everywhere
  const coreNavItems = [
    { href: "/feed", icon: Home, label: "Home", badge: 0 },
    { href: "/search", icon: Search, label: "Search", badge: 0 },
    { href: "/messages", icon: MessageSquare, label: "Messages", badge: unreadMessages },
    { href: "/notifications", icon: Bell, label: "Notifications", badge: unreadCount },
    { href: `/profile/${user.username}`, icon: User, label: "Profile", badge: 0 },
  ];

  // Admin link only in desktop sidebar — rare use case, doesn't belong in mobile tab bar
  const allNavItems = [
    ...coreNavItems,
    ...(me?.role === "ADMIN" ? [{ href: "/admin", icon: Shield, label: "Admin", badge: 0 }] : []),
  ];

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      {/* ── Desktop sidebar (md and up) ── */}
      <nav className="hidden md:flex sticky top-0 h-screen w-64 shrink-0 flex-col justify-between py-6 px-4 border-r border-neutral-200 dark:border-neutral-800">
        <div className="space-y-1">
          <Link href="/feed" className="mb-6 block px-3 py-2 text-xl font-bold text-indigo-600">
            sosoc
          </Link>
          {allNavItems.map(({ href, icon: Icon, label, badge }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive(href)
                  ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300"
                  : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100"
              }`}
            >
              <span className="relative">
                <Icon size={20} />
                <Badge count={badge} />
              </span>
              {label}
            </Link>
          ))}
        </div>

        <div className="space-y-3">
          {/* Theme toggle: Light / System / Dark */}
          <div className="flex items-center rounded-xl bg-neutral-100 dark:bg-neutral-800 p-1">
            {themeOptions.map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                aria-label={`${label} mode`}
                className={`flex flex-1 items-center justify-center rounded-lg py-1.5 transition-colors ${
                  theme === value
                    ? "bg-white dark:bg-neutral-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                }`}
              >
                <Icon size={14} />
              </button>
            ))}
          </div>

          <Link
            href={`/profile/${user.username}`}
            className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <Avatar user={user} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
                {user.displayName ?? user.username}
              </p>
              <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">@{user.username}</p>
            </div>
          </Link>
          <button
            onClick={() => void handleSignOut()}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </nav>

      {/* ── Mobile bottom tab bar (below md) ──
          Icons only — no labels — so all 5 tabs fit comfortably at any phone width.
          safe-area-inset-bottom pads the bar above the iPhone home indicator swipe zone.
          backdrop-blur makes it feel native even when content scrolls under it.        */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden items-center justify-around border-t border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm px-2 pt-2"
        style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}
      >
        {coreNavItems.map(({ href, icon: Icon, label, badge }) => {
          const isProfile = label === "Profile";
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className={`relative flex items-center justify-center rounded-xl p-3 transition-colors ${
                isActive(href)
                  ? "text-indigo-600 dark:text-indigo-400"
                  : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200"
              }`}
            >
              {isProfile ? (
                <span className={`block rounded-full ${isActive(href) ? "ring-2 ring-indigo-500 ring-offset-1 ring-offset-white dark:ring-offset-neutral-900" : ""}`}>
                  <Avatar user={user} size="sm" />
                </span>
              ) : (
                <Icon size={24} strokeWidth={isActive(href) ? 2.5 : 2} />
              )}
              <Badge count={badge} />
            </Link>
          );
        })}
        <button
          onClick={() => void handleSignOut()}
          aria-label="Sign out"
          className="relative flex items-center justify-center rounded-xl p-3 text-neutral-500 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
        >
          <LogOut size={24} strokeWidth={2} />
        </button>
      </nav>
    </>
  );
}
