import { prisma } from "~/server/db";

export async function getUserProfile(username: string) {
  return prisma.user.findUnique({
    where: { username },
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
    data: { ...data, updatedAt: new Date() },
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

export async function updateUserPhoto(userId: string, photo: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { photo, updatedAt: new Date() },
    select: { id: true, photo: true },
  });
}

export async function updateUserBanner(userId: string, bannerUrl: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { bannerUrl, updatedAt: new Date() },
    select: { id: true, bannerUrl: true },
  });
}
