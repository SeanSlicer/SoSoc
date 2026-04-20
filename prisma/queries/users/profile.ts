import { prisma } from "~/server/db";

/**
 * Returns the public profile data for a user by username.
 * Returns null if no user is found.
 *
 * @param username  Case-insensitive username to look up
 */
export async function getUserProfile(username: string) {
  return prisma.user.findUnique({
    where: { usernameNormalized: username.toLowerCase() },
    select: {
      id: true,
      username: true,
      displayName: true,
      bio: true,
      photo: true,
      bannerUrl: true,
      isPrivate: true,
      hideFollowLists: true,
      createdAt: true,
      _count: { select: { posts: true, followers: true, follows: true } },
    },
  });
}

/**
 * Updates mutable profile fields for a user.
 * Also updates `usernameNormalized` when `username` is changed.
 *
 * @param userId  User to update
 * @param data    Fields to update (all optional)
 */
export async function updateUserProfile(
  userId: string,
  data: {
    displayName?: string;
    bio?: string;
    username?: string;
    isPrivate?: boolean;
    hideFollowLists?: boolean;
  },
) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      ...data,
      ...(data.username !== undefined ? { usernameNormalized: data.username.toLowerCase() } : {}),
      updatedAt: new Date(),
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      bio: true,
      photo: true,
      bannerUrl: true,
      isPrivate: true,
      hideFollowLists: true,
    },
  });
}

/**
 * Updates the profile photo URL for a user.
 *
 * @param userId  User to update
 * @param photo   New photo URL
 */
export async function updateUserPhoto(userId: string, photo: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { photo, updatedAt: new Date() },
    select: { id: true, photo: true },
  });
}

/**
 * Updates the banner image URL for a user.
 *
 * @param userId     User to update
 * @param bannerUrl  New banner URL
 */
export async function updateUserBanner(userId: string, bannerUrl: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { bannerUrl, updatedAt: new Date() },
    select: { id: true, bannerUrl: true },
  });
}
