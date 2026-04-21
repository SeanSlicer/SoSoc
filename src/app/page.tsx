import { redirect } from "next/navigation";
import { getCurrentUser } from "~/lib/server/getCurrentUser";
import Link from "next/link";

export default async function Home() {
  const user = await getCurrentUser();
  if (user) redirect("/feed");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm text-center space-y-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-neutral-900">sosoc</h1>
          <p className="mt-2 text-neutral-500">Share moments with people you care about.</p>
        </div>
        <div className="flex flex-col gap-3">
          <Link href="/login" className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">
            Log in
          </Link>
          <Link href="/signup" className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors">
            Create account
          </Link>
        </div>
      </div>
    </main>
  );
}
