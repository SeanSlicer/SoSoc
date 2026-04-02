import { prisma } from '~/server/db';
import bcrypt from 'bcrypt';
import type { User } from '@prisma/client';

export async function getUserById(id: string): Promise<User | null> {
  return prisma.user.findFirst({
    where: { id },
  });
}

export async function getUserByUsernameOrEmailAndPassword(
  usernameOrEmail: string,
  password: string
) {
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        {
          username: usernameOrEmail,
        },
        {
          email: usernameOrEmail,
        },
      ],
    },
  });

  if (user && (await bcrypt.compare(password, user.password))) {
    return user;
  }

  return null; // Return null if no matching user or invalid password
}