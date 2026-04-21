import "server-only";
import jwt from "jsonwebtoken";
import { env } from "~/env";
import { getUserById } from "@queries/auth/getUser";
import type { UserJwtPayload } from "~/lib/shared/jwt";

// Re-export for convenience — callers usually only need one import.
export type { UserJwtPayload };

/**
 * Verifies a JWT signature and expiry, returning the decoded payload.
 *
 * @param token  Signed JWT from the `user-token` cookie (or equivalent Expo store).
 * @throws       Error when the signature is invalid or the token has expired.
 */
export const verifyAuth = (token: string): UserJwtPayload => {
  try {
    return jwt.verify(token, env.JWT_SECRET_KEY) as UserJwtPayload;
  } catch {
    throw new Error("Your token has expired.");
  }
};

/**
 * Verifies a token and loads the corresponding user, rejecting tokens issued
 * before `tokenValidFrom` (covers logout / password-change revocation).
 *
 * @param token  Signed JWT.
 * @returns      Full user record.
 * @throws       Error when the token is invalid, expired, revoked, or the user no longer exists.
 */
export const getUserByToken = async (token: string) => {
  try {
    const payload = verifyAuth(token);
    const user = await getUserById(payload.sub);
    if (!user) throw new Error("User not found.");
    if (payload.iat < user.tokenValidFrom.getTime() / 1000) {
      throw new Error("Token has been revoked.");
    }
    return user;
  } catch {
    throw new Error("Your token has expired.");
  }
};
