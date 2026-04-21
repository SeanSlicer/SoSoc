import { type Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "~/lib/server/getCurrentUser";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Admin — sosoc" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/feed");

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950">
      <header className="border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/feed" className="text-lg font-bold text-indigo-600">
            sosoc
          </Link>
          <span className="rounded bg-indigo-100 dark:bg-indigo-900 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
            Admin
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400">
          <span>Signed in as <strong className="text-neutral-900 dark:text-neutral-100">{user.username}</strong></span>
          <Link href="/feed" className="hover:text-indigo-600 transition-colors">
            ← Back to app
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
