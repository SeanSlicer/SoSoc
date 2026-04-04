import { prisma } from "~/server/db";
import bcrypt from "bcrypt";
import type { UserRole } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

export async function listAllUsers() {
  return prisma.user.findMany({
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      photo: true,
      displayName: true,
      createdAt: true,
      _count: { select: { posts: true, followers: true, follows: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function adminCreateUser(data: {
  username: string;
  email: string;
  password: string;
  role: UserRole;
}) {
  const hashedPassword = await bcrypt.hash(data.password, 10);
  try {
    return await prisma.user.create({
      data: {
        username: data.username.trim(),
        email: data.email.trim().toLowerCase(),
        password: hashedPassword,
        role: data.role,
      },
      select: { id: true, username: true, email: true, role: true, createdAt: true },
    });
  } catch (err) {
    if (err instanceof PrismaClientKnownRequestError && err.code === "P2002") {
      throw new Error("Username or email already taken");
    }
    throw err;
  }
}

export async function getUserForImpersonation(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, role: true },
  });
}
