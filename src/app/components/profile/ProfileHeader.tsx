"use client";
import { useState } from "react";
import { Calendar } from "lucide-react";
import { api } from "~/trpc/react";
import Avatar from "~/app/components/ui/Avatar";
import EditProfileModal from "./EditProfileModal";
import ProfilePictureUpload from "./ProfilePictureUpload";

type ProfileHeaderProps = {
  username: string;
  currentUserId: string;
};

export default function ProfileHeader({ username, currentUserId }: ProfileHeaderProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const { data: profile, refetch } = api.user.getProfile.useQuery({ username });

  if (!profile) return (
    <div className="flex justify-center py-12">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
    </div>
  );

  const isOwnProfile = profile.id === currentUserId;

  return (
    <>
      <div>
        {/* Sticky header */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-neutral-100 px-4 py-3">
          <h1 className="font-bold text-neutral-900">{profile.displayName ?? profile.username}</h1>
          <p className="text-xs text-neutral-500">{profile._count.posts} posts</p>
        </div>

        {/* Cover */}
        <div className="h-36 bg-gradient-to-br from-indigo-400 via-violet-400 to-purple-500" />

        {/* Avatar row */}
        <div className="flex items-end justify-between px-4 -mt-14 pb-4">
          <div className="relative">
            <Avatar user={profile} size="xl" />
            {isOwnProfile && (
              <ProfilePictureUpload userId={profile.id} onUpload={() => void refetch()} />
            )}
          </div>
          {isOwnProfile && (
            <button
              onClick={() => setShowEditModal(true)}
              className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              Edit profile
            </button>
          )}
        </div>

        {/* Info */}
        <div className="px-4 pb-5">
          <h2 className="text-xl font-bold text-neutral-900">
            {profile.displayName ?? profile.username}
          </h2>
          <p className="text-sm text-neutral-500">@{profile.username}</p>

          {profile.bio && (
            <p className="mt-2 text-sm text-neutral-700 leading-relaxed">{profile.bio}</p>
          )}

          <div className="mt-2 flex items-center gap-1 text-xs text-neutral-400">
            <Calendar size={13} />
            <span>Joined {new Date(profile.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
          </div>

          <div className="mt-3 flex gap-4 text-sm">
            <span className="text-neutral-600">
              <strong className="text-neutral-900">{profile._count.follows}</strong> Following
            </span>
            <span className="text-neutral-600">
              <strong className="text-neutral-900">{profile._count.followers}</strong> Followers
            </span>
          </div>
        </div>

        <div className="border-b border-neutral-200 px-4">
          <div className="inline-block border-b-2 border-indigo-600 pb-3 text-sm font-semibold text-indigo-600">
            Posts
          </div>
        </div>
      </div>

      {isOwnProfile && (
        <EditProfileModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          profile={profile}
          onSaved={() => void refetch()}
        />
      )}
    </>
  );
}
