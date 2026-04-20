import { prisma } from "~/server/db";

export async function searchUsers(query: string, limit = 20) {
  if (!query.trim()) return [];

  return prisma.user.findMany({
    where: {
      OR: [
        { username: { contains: query, mode: "insensitive" } },
        { displayName: { contains: query, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      photo: true,
      isPrivate: true,
      _count: { select: { followers: true } },
    },
    take: limit,
    orderBy: { username: "asc" },
  });
}

export async function getFollowerList(username: string, _currentUserId: string) {
  const user = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
    select: {
      hideFollowLists: true,
      followers: {
        select: {
          id: true,
          username: true,
          displayName: true,
          photo: true,
          isPrivate: true,
          _count: { select: { followers: true } },
        },
        orderBy: { username: "asc" },
      },
    },
  });

  if (!user) return null;
  return { hidden: user.hideFollowLists, list: user.followers };
}

export async function getFollowingList(username: string) {
  const user = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
    select: {
      hideFollowLists: true,
      follows: {
        select: {
          id: true,
          username: true,
          displayName: true,
          photo: true,
          isPrivate: true,
          _count: { select: { followers: true } },
        },
        orderBy: { username: "asc" },
      },
    },
  });

  if (!user) return null;
  return { hidden: user.hideFollowLists, list: user.follows };
}
