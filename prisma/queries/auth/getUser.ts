import { prisma } from '~/server/db';
import bcrypt from 'bcrypt';
import type { User } from '@prisma/client';

export async function getUserById(id: string): Promise<User | null> {
  return prisma.user.findFirst({
    where: { id },
  });
}

/** Bump tokenValidFrom to now, immediately invalidating all existing JWTs for this user. */
export async function revokeUserTokens(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { tokenValidFrom: new Date() },
  });
}

export async function getUserByUsernameOrEmailAndPassword(
  usernameOrEmail: string,
  password: string
) {
  const normalized = usernameOrEmail.trim().toLowerCase();
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { usernameNormalized: normalized },
        { email: normalized },
      ],
    },
  });

  if (user && (await bcrypt.compare(password, user.password))) {
    return user;
  }

  return null; // Return null if no matching user or invalid password
}