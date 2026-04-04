import jwt from "jsonwebtoken";
import { env } from "~/../src/env.js";
import { getUserById } from "~/../prisma/queries/auth/getUser";

export interface UserJwtPayload {
  sub: string;      // user id
  role: string;     // "ADMIN" | "USER"
  imp?: string;     // present when an admin is impersonating — holds the admin's user id
  iat: number;
  exp: number;
}

const JWT_SECRET = env.JWT_SECRET_KEY;

export const verifyAuth = (token: string): UserJwtPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as UserJwtPayload;
  } catch {
    throw new Error("Your token has expired.");
  }
};

export const getUserByToken = async (token: string) => {
  try {
    const payload = verifyAuth(token);
    return getUserById(payload.sub);
  } catch {
    throw new Error("Your token has expired.");
  }
};
