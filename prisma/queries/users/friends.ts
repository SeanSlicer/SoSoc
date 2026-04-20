import { prisma } from "~/server/db";

/**
 * Returns true if userId1 and userId2 both follow each other (mutual follow).
 * Friends can message each other without going to the requests tab.
 */
export async function isFriends(userId1: string, userId2: string): Promise<boolean> {
  const [ab, ba] = await Promise.all([
    prisma.user.findFirst({
      where: { id: userId1, follows: { some: { id: userId2 } } },
      select: { id: true },
    }),
    prisma.user.findFirst({
      where: { id: userId2, follows: { some: { id: userId1 } } },
      select: { id: true },
    }),
  ]);
  return ab !== null && ba !== null;
}
