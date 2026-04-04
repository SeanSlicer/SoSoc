import { redirect } from "next/navigation";
import { getCurrentUser } from "~/lib/getCurrentUser";
import NavSidebar from "~/app/components/layout/NavSidebar";
import ImpersonationBanner from "~/app/components/layout/ImpersonationBanner";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-neutral-50">
      <ImpersonationBanner />
      <div className="mx-auto max-w-6xl flex">
        <NavSidebar user={{ id: user.id, username: user.username, displayName: user.displayName, photo: user.photo }} />
        <main className="flex-1 min-h-screen md:border-x md:border-neutral-200 max-w-2xl pb-20 md:pb-0">
          {children}
        </main>
      </div>
    </div>
  );
}
