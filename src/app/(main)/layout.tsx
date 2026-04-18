import { redirect } from "next/navigation";
import { getCurrentUser } from "~/lib/getCurrentUser";
import NavSidebar from "~/app/components/layout/NavSidebar";
import ImpersonationBanner from "~/app/components/layout/ImpersonationBanner";
import VerifyEmailBanner from "~/app/components/layout/VerifyEmailBanner";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <ImpersonationBanner />
      {!user.emailVerified && <VerifyEmailBanner />}
      <div className="mx-auto max-w-6xl flex">
        <NavSidebar user={{ id: user.id, username: user.username, displayName: user.displayName, photo: user.photo }} />
        <main
          className="flex-1 min-h-screen md:border-x md:border-neutral-200 dark:md:border-neutral-800 max-w-2xl md:pb-0"
          style={{ paddingBottom: "calc(72px + env(safe-area-inset-bottom))" }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
