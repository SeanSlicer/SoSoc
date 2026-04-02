import { type Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurrentUser } from "~/lib/getCurrentUser";
import ProfileHeader from "~/app/components/profile/ProfileHeader";
import UserPostsList from "~/app/components/profile/UserPostsList";

export const metadata: Metadata = { title: "Profile — sosoc" };

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const currentUser = await getCurrentUser();
  if (!currentUser) notFound();

  return (
    <div>
      <ProfileHeader username={username} currentUserId={currentUser.id} />
      <UserPostsList username={username} currentUserId={currentUser.id} />
    </div>
  );
}
