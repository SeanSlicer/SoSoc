import { prisma } from "~/server/db";

/**
 * Searches users by username or display name, excluding blocked users in either direction.
 *
 * @param query        Search string (case-insensitive)
 * @param currentUserId Viewer's user ID used to filter out blocked users
 * @param limit        Maximum results to return (default 20)
 */
export async function searchUsers(query: string, currentUserId: string, limit = 20) {
  if (!query.trim()) return [];

  return prisma.user.findMany({
    where: {
      AND: [
        { blocking: { none: { blockedId: currentUserId } } },
        { blockedBy: { none: { blockerId: currentUserId } } },
        {
          OR: [
            { username: { contains: query, mode: "insensitive" } },
            { displayName: { contains: query, mode: "insensitive" } },
          ],
        },
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

/**
 * Returns the follower list for a user by username.
 * Returns null if the user is not found.
 * Returns `{ hidden: true, list: [] }` when the user has hidden their follow lists.
 *
 * @param username      Case-insensitive username
 * @param _currentUserId Reserved for future visibility checks
 */
export async function getFollowerList(username: string, _currentUserId: string) {
  const user = await prisma.user.findUnique({
    where: { usernameNormalized: username.toLowerCase() },
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

/**
 * Returns the following list for a user by username.
 * Returns null if the user is not found.
 *
 * @param username  Case-insensitive username
 */
export async function getFollowingList(username: string) {
  const user = await prisma.user.findUnique({
    where: { usernameNormalized: username.toLowerCase() },
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
