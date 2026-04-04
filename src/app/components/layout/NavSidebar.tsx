"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, User, Bell, LogOut, Shield, Search } from "lucide-react";
import { api } from "~/trpc/react";
import Avatar from "~/app/components/ui/Avatar";

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

export default function NavSidebar({ user: initialUser }: { user: NavUser }) {
  const pathname = usePathname();
  const { data: me } = api.user.getMe.useQuery();
  const user = me ?? initialUser;
  const { data: unreadCount = 0 } = api.notification.getUnreadCount.useQuery(undefined, {
    refetchInterval: 30_000,
  });

  const handleSignOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  const navItems = [
    { href: "/feed", icon: Home, label: "Home", badge: 0 },
    { href: "/search", icon: Search, label: "Search", badge: 0 },
    { href: "/notifications", icon: Bell, label: "Notifications", badge: unreadCount },
    { href: `/profile/${user.username}`, icon: User, label: "Profile", badge: 0 },
    ...(me?.role === "ADMIN"
      ? [{ href: "/admin", icon: Shield, label: "Admin", badge: 0 }]
      : []),
  ];

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      {/* ── Desktop sidebar (md and up) ── */}
      <nav className="hidden md:flex sticky top-0 h-screen w-64 shrink-0 flex-col justify-between py-6 px-4 border-r border-neutral-200">
        <div className="space-y-1">
          <Link href="/feed" className="mb-6 block px-3 py-2 text-xl font-bold text-indigo-600">
            sosoc
          </Link>
          {navItems.map(({ href, icon: Icon, label, badge }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive(href)
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
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
          <div className="flex items-center gap-3 rounded-xl px-3 py-2">
            <Avatar user={user} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-neutral-900">
                {user.displayName ?? user.username}
              </p>
              <p className="truncate text-xs text-neutral-500">@{user.username}</p>
            </div>
          </div>
          <button
            onClick={() => void handleSignOut()}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </nav>

      {/* ── Mobile bottom tab bar (below md) ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden items-center justify-around border-t border-neutral-200 bg-white px-2 py-2">
        {navItems.map(({ href, icon: Icon, label, badge }) => (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-0.5 rounded-xl px-5 py-2 text-xs font-medium transition-colors ${
              isActive(href) ? "text-indigo-600" : "text-neutral-500 hover:text-neutral-800"
            }`}
          >
            <span className="relative">
              <Icon size={22} />
              <Badge count={badge} />
            </span>
            {label}
          </Link>
        ))}
        <button
          onClick={() => void handleSignOut()}
          className="flex flex-col items-center gap-0.5 rounded-xl px-5 py-2 text-xs font-medium text-neutral-500 hover:text-red-600 transition-colors"
        >
          <LogOut size={22} />
          Sign out
        </button>
      </nav>
    </>
  );
}
