import "server-only";
import { sign } from "jsonwebtoken";
import { env } from "~/env";
import type { UserRole } from "@prisma/client";
import type { ResponseCookies } from "next/dist/compiled/@edge-runtime/cookies";

export const AUTH_COOKIE = "user-token";
/** Stores the real admin token while an impersonation session is active. */
export const ADMIN_COOKIE = "admin-token";

export const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // 7 days
};

const IMPERSONATION_COOKIE_OPTIONS = {
  ...AUTH_COOKIE_OPTIONS,
  maxAge: 60 * 60 * 4, // 4 hours — impersonation sessions are short-lived
};

/**
 * Creates a signed HS256 JWT for a regular user session (7-day expiry).
 *
 * @param userId  Subject claim
 * @param role    User's role — stored in the JWT so DB lookups are not needed per request
 */
export function createAuthToken(userId: string, role: UserRole): string {
  return sign(
    { sub: userId, role, iat: Math.floor(Date.now() / 1000) },
    env.JWT_SECRET_KEY,
    { expiresIn: "7d", algorithm: "HS256" },
  );
}

/**
 * Creates a short-lived impersonation token (4-hour expiry).
 * The `imp` claim carries the admin's real user ID so impersonation can be detected.
 *
 * @param targetUserId  User being impersonated
 * @param targetRole    Role of the target user
 * @param adminUserId   The admin performing the impersonation
 */
export function createImpersonationToken(
  targetUserId: string,
  targetRole: UserRole,
  adminUserId: string,
): string {
  return sign(
    { sub: targetUserId, role: targetRole, imp: adminUserId, iat: Math.floor(Date.now() / 1000) },
    env.JWT_SECRET_KEY,
    { expiresIn: "4h", algorithm: "HS256" },
  );
}

/**
 * Sets the auth cookie on a response.
 *
 * @param cookies  Next.js ResponseCookies instance
 * @param token    Signed JWT to store
 */
export function setAuthCookie(cookies: ResponseCookies, token: string) {
  cookies.set(AUTH_COOKIE, token, AUTH_COOKIE_OPTIONS);
}

/**
 * Clears the auth cookie (effectively logs the user out).
 *
 * @param cookies  Next.js ResponseCookies instance
 */
export function clearAuthCookie(cookies: ResponseCookies) {
  cookies.set(AUTH_COOKIE, "", { ...AUTH_COOKIE_OPTIONS, maxAge: 0 });
}

/**
 * Begins an admin impersonation session.
 * Saves the real admin token in `admin-token` and replaces `user-token` with
 * a short-lived impersonation token.
 *
 * @param cookies             Next.js ResponseCookies instance
 * @param adminToken          The admin's current auth token (preserved)
 * @param impersonationToken  Short-lived token for the impersonated user
 */
export function startImpersonation(cookies: ResponseCookies, adminToken: string, impersonationToken: string) {
  cookies.set(ADMIN_COOKIE, adminToken, AUTH_COOKIE_OPTIONS);
  cookies.set(AUTH_COOKIE, impersonationToken, IMPERSONATION_COOKIE_OPTIONS);
}

/**
 * Exits an impersonation session, restoring the admin's original token.
 *
 * @param cookies     Next.js ResponseCookies instance
 * @param adminToken  The admin's real token to restore
 */
export function exitImpersonation(cookies: ResponseCookies, adminToken: string) {
  cookies.set(AUTH_COOKIE, adminToken, AUTH_COOKIE_OPTIONS);
  cookies.set(ADMIN_COOKIE, "", { ...AUTH_COOKIE_OPTIONS, maxAge: 0 });
}
