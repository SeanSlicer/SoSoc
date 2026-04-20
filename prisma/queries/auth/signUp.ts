import { prisma } from "~/server/db";
import bcrypt from "bcrypt";
import { TRPCError } from "@trpc/server";
import { type User } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";

export async function createUser(
  username: string,
  email: string,
  password: string,
): Promise<User> {
  try {
    // now TypeScript knows bcrypt.hash returns Promise<string>
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username: username.trim(),
        usernameNormalized: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        password: hashedPassword,
      },
    });

    return user;
  } catch (error: unknown) {
    // fully narrow 'error' before using it:
    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Username or email already exists",
      });
    }
    if (error instanceof Error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to create user: ${error.message}`,
      });
    }
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to create user",
    });
  }
}
