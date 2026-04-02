"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, User, LogOut } from "lucide-react";
import { api } from "~/trpc/react";
import Avatar from "~/app/components/ui/Avatar";

type NavUser = {
  id: string;
  username: string;
  displayName?: string | null;
  photo?: string | null;
};

export default function NavSidebar({ user: initialUser }: { user: NavUser }) {
  const pathname = usePathname();
  // Keep user data live so profile picture / name changes reflect without a full reload
  const { data: me } = api.user.getMe.useQuery();
  const user = me ?? initialUser;

  const { mutate: signOut } = api.user.signOut.useMutation({
    onSuccess: () => { window.location.href = "/login"; },
  });

  const navItems = [
    { href: "/feed", icon: Home, label: "Home" },
    { href: `/profile/${user.username}`, icon: User, label: "Profile" },
  ];

  return (
    <nav className="sticky top-0 h-screen w-64 shrink-0 flex flex-col justify-between py-6 px-4 border-r border-neutral-200">
      <div className="space-y-1">
        <Link href="/feed" className="mb-6 block px-3 py-2 text-xl font-bold text-indigo-600">
          sosoc
        </Link>
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
              }`}
            >
              <Icon size={20} />
              {label}
            </Link>
          );
        })}
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
          onClick={() => signOut()}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-600 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </nav>
  );
}
