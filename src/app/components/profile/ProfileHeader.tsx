"use client";
import { useState, useRef, useEffect } from "react";
import { Calendar, Lock, MoreHorizontal, Settings } from "lucide-react";
import Link from "next/link";
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
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const utils = api.useUtils();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { data: profile, isLoading } = api.user.getProfile.useQuery({ username });

  const { data: followStatus, isLoading: followStatusLoading } = api.user.getFollowStatus.useQuery(
    { userId: profile?.id ?? "" },
    { enabled: !!profile && profile.id !== currentUserId },
  );

  const { data: isBlockedByMe } = api.user.getBlockStatus.useQuery(
    { userId: profile?.id ?? "" },
    { enabled: !!profile && profile.id !== currentUserId },
  );

  const invalidateProfile = () => {
    void utils.user.getProfile.invalidate({ username });
    void utils.user.getFollowStatus.invalidate({ userId: profile?.id });
    void utils.user.getBlockStatus.invalidate({ userId: profile?.id });
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
  const { mutate: block, isPending: isBlockPending } = api.user.block.useMutation({
    onSuccess: () => { setShowMenu(false); invalidateProfile(); },
  });
  const { mutate: unblock, isPending: isUnblockPending } = api.user.unblock.useMutation({
    onSuccess: () => { setShowMenu(false); invalidateProfile(); },
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
        <div className="sticky top-0 z-10 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm border-b border-neutral-100 dark:border-neutral-800 px-4 py-3">
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-neutral-900 dark:text-neutral-100">{profile.displayName ?? profile.username}</h1>
            {profile.isPrivate && <Lock size={13} className="text-neutral-400" />}
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">{profile._count.posts} posts</p>
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
          <div className="mt-16 flex items-center gap-2">
            {isOwnProfile ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowEditModal(true)}
                  className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                >
                  Edit profile
                </button>
                <Link
                  href="/settings"
                  className="md:hidden rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-2 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                  aria-label="Settings"
                >
                  <Settings size={18} />
                </Link>
              </div>
            ) : (
              <>
                {!isBlockedByMe && (
                  <button
                    onClick={followAction}
                    disabled={actionPending}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60 ${
                      isFollowing
                        ? "border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-red-300 hover:text-red-600"
                        : hasRequested
                        ? "border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:border-red-300 hover:text-red-500"
                        : "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-700 dark:hover:bg-neutral-300"
                    }`}
                  >
                    {actionPending ? "…" : followLabel}
                  </button>
                )}

                {/* More options menu */}
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setShowMenu((v) => !v)}
                    className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                    aria-label="More options"
                  >
                    <MoreHorizontal size={18} />
                  </button>
                  {showMenu && (
                    <div className="absolute right-0 top-10 z-20 w-40 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-lg overflow-hidden">
                      {isBlockedByMe ? (
                        <button
                          onClick={() => unblock({ userId: profile.id })}
                          disabled={isUnblockPending}
                          className="w-full px-4 py-3 text-left text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-60"
                        >
                          Unblock
                        </button>
                      ) : (
                        <button
                          onClick={() => block({ userId: profile.id })}
                          disabled={isBlockPending}
                          className="w-full px-4 py-3 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 disabled:opacity-60"
                        >
                          Block
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Bio / info */}
        <div className="px-4 pb-4">
          <div className="flex items-center gap-1.5">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
              {profile.displayName ?? profile.username}
            </h2>
            {profile.isPrivate && <Lock size={15} className="text-neutral-400 dark:text-neutral-500" />}
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">@{profile.username}</p>

          {profile.bio && (
            <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">{profile.bio}</p>
          )}

          <div className="mt-2 flex items-center gap-1 text-xs text-neutral-400 dark:text-neutral-500">
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
              className="text-neutral-600 dark:text-neutral-400 hover:underline"
            >
              <strong className="text-neutral-900 dark:text-neutral-100">{profile._count.follows}</strong> Following
            </button>
            <button
              onClick={() => setFollowListMode("followers")}
              className="text-neutral-600 dark:text-neutral-400 hover:underline"
            >
              <strong className="text-neutral-900 dark:text-neutral-100">{profile._count.followers}</strong> Followers
            </button>
          </div>
        </div>

        {/* Follow requests panel (own profile only) */}
        {isOwnProfile && (
          <div className="px-4 pb-4">
            <FollowRequestsPanel onUpdate={() => void utils.user.getProfile.invalidate({ username })} />
          </div>
        )}

        <div className="border-b border-neutral-200 dark:border-neutral-800 px-4">
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
