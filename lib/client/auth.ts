import jwt from "jsonwebtoken";
import { env } from "~/../src/env.js";
import { getUserById } from "~/../prisma/queries/auth/getUser";

interface UserJwtPayload {
  sub: string;
  iat: number;
  exp: number;
}

const JWT_SECRET = env.JWT_SECRET_KEY;

/**
 * Verifies token and returns payload
 */
export const verifyAuth = (token: string): UserJwtPayload => {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as UserJwtPayload;
    return payload;
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
