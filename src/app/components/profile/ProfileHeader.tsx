"use client";
import { useState } from "react";
import { Calendar, Lock } from "lucide-react";
import Image from "next/image";
import { api } from "~/trpc/react";
import Avatar from "~/app/components/ui/Avatar";
import EditProfileModal from "./EditProfileModal";
import ProfilePictureUpload from "./ProfilePictureUpload";
import BannerUpload from "./BannerUpload";
import FollowListModal from "./FollowListModal";
import FollowRequestsPanel from "./FollowRequestsPanel";
import Lightbox from "~/app/components/ui/Lightbox";

type ProfileHeaderProps = {
  username: string;
  currentUserId: string;
};

export default function ProfileHeader({ username, currentUserId }: ProfileHeaderProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAvatarLightbox, setShowAvatarLightbox] = useState(false);
  const [followListMode, setFollowListMode] = useState<"followers" | "following" | null>(null);
  const utils = api.useUtils();

  const { data: profile, isLoading } = api.user.getProfile.useQuery({ username });

  const { data: followStatus, isLoading: followStatusLoading } = api.user.getFollowStatus.useQuery(
    { userId: profile?.id ?? "" },
    { enabled: !!profile && profile.id !== currentUserId },
  );

  const invalidateProfile = () => {
    void utils.user.getProfile.invalidate({ username });
    void utils.user.getFollowStatus.invalidate({ userId: profile?.id });
  };

  const { mutate: follow, isPending: isFollowPending } = api.user.follow.useMutation({
    onSuccess: invalidateProfile,
  });
  const { mutate: unfollow, isPending: isUnfollowPending } = api.user.unfollow.useMutation({
    onSuccess: invalidateProfile,
  });
  const { mutate: cancelRequest, isPending: isCancelPending } = api.user.cancelFollowRequest.useMutation({
    onSuccess: invalidateProfile,
  });

  if (isLoading || !profile) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  const isOwnProfile = profile.id === currentUserId;
  const isFollowing = followStatus?.following ?? false;
  const hasRequested = followStatus?.requested ?? false;
  const actionPending = isFollowPending || isUnfollowPending || isCancelPending || followStatusLoading;

  // Determine button label / action for follow button
  let followLabel = "Follow";
  let followAction = () => follow({ userId: profile.id });
  if (isFollowing) {
    followLabel = "Following";
    followAction = () => unfollow({ userId: profile.id });
  } else if (hasRequested) {
    followLabel = "Requested";
    followAction = () => cancelRequest({ userId: profile.id });
  }

  return (
    <>
      <div>
        {/* Sticky back header */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-neutral-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-neutral-900">{profile.displayName ?? profile.username}</h1>
            {profile.isPrivate && <Lock size={13} className="text-neutral-400" />}
          </div>
          <p className="text-xs text-neutral-500">{profile._count.posts} posts</p>
        </div>

        {/* Banner */}
        <div className="relative h-36 overflow-hidden bg-gradient-to-br from-indigo-400 via-violet-400 to-purple-500">
          {profile.bannerUrl && (
            <Image
              src={profile.bannerUrl}
              alt="Profile banner"
              fill
              className="object-cover"
              priority
            />
          )}
          {isOwnProfile && (
            <div className="absolute bottom-2 right-2">
              <BannerUpload
                userId={profile.id}
                onUpload={() => void utils.user.getProfile.invalidate({ username })}
              />
            </div>
          )}
        </div>

        {/* Avatar row */}
        <div className="flex items-start justify-between px-4 -mt-14 pb-4">
          <div className="relative">
            <Avatar
              user={profile}
              size="xl"
              onClick={profile.photo && profile.photo !== "default.png" ? () => setShowAvatarLightbox(true) : undefined}
            />
            {isOwnProfile && (
              <ProfilePictureUpload
                userId={profile.id}
                onUpload={() => void utils.user.getProfile.invalidate({ username })}
              />
            )}
          </div>

          {/* Push button below banner edge: row top is 88px into page, banner ends at 144px, so mt-16 (64px) clears it */}
          <div className="mt-16">
            {isOwnProfile ? (
              <button
                onClick={() => setShowEditModal(true)}
                className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                Edit profile
              </button>
            ) : (
              <button
                onClick={followAction}
                disabled={actionPending}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60 ${
                  isFollowing
                    ? "border border-neutral-200 bg-white text-neutral-700 hover:border-red-300 hover:text-red-600"
                    : hasRequested
                    ? "border border-neutral-200 bg-white text-neutral-500 hover:border-red-300 hover:text-red-500"
                    : "bg-neutral-900 text-white hover:bg-neutral-700"
                }`}
              >
                {actionPending ? "…" : followLabel}
              </button>
            )}
          </div>
        </div>

        {/* Bio / info */}
        <div className="px-4 pb-4">
          <div className="flex items-center gap-1.5">
            <h2 className="text-xl font-bold text-neutral-900">
              {profile.displayName ?? profile.username}
            </h2>
            {profile.isPrivate && <Lock size={15} className="text-neutral-400" />}
          </div>
          <p className="text-sm text-neutral-500">@{profile.username}</p>

          {profile.bio && (
            <p className="mt-2 text-sm text-neutral-700 leading-relaxed">{profile.bio}</p>
          )}

          <div className="mt-2 flex items-center gap-1 text-xs text-neutral-400">
            <Calendar size={13} />
            <span>
              Joined{" "}
              {new Date(profile.createdAt).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>

          <div className="mt-3 flex gap-4 text-sm">
            <button
              onClick={() => setFollowListMode("following")}
              className="text-neutral-600 hover:underline"
            >
              <strong className="text-neutral-900">{profile._count.follows}</strong> Following
            </button>
            <button
              onClick={() => setFollowListMode("followers")}
              className="text-neutral-600 hover:underline"
            >
              <strong className="text-neutral-900">{profile._count.followers}</strong> Followers
            </button>
          </div>
        </div>

        {/* Follow requests panel (own profile only) */}
        {isOwnProfile && (
          <div className="px-4 pb-4">
            <FollowRequestsPanel onUpdate={() => void utils.user.getProfile.invalidate({ username })} />
          </div>
        )}

        <div className="border-b border-neutral-200 px-4">
          <div className="inline-block border-b-2 border-indigo-600 pb-3 text-sm font-semibold text-indigo-600">
            Posts
          </div>
        </div>
      </div>

      {isOwnProfile && (
        <EditProfileModal
          key={profile.id}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          profile={profile}
          onSaved={() => void utils.user.getProfile.invalidate({ username })}
        />
      )}

      {showAvatarLightbox && profile.photo && profile.photo !== "default.png" && (
        <Lightbox
          images={[profile.photo]}
          index={0}
          alt={profile.displayName ?? profile.username}
          onClose={() => setShowAvatarLightbox(false)}
        />
      )}

      {followListMode && (
        <FollowListModal
          username={username}
          mode={followListMode}
          isOpen={true}
          onClose={() => setFollowListMode(null)}
        />
      )}
    </>
  );
}
