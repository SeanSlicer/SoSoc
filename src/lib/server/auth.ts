import "server-only";
import { sign } from "jsonwebtoken";
import { env } from "~/env";
import type { UserRole } from "@prisma/client";
import type { ResponseCookies } from "next/dist/compiled/@edge-runtime/cookies";

export const AUTH_COOKIE = "user-token";
export const ADMIN_COOKIE = "admin-token"; // stores the real admin token during impersonation

export const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // 7 days
};

const IMPERSONATION_COOKIE_OPTIONS = {
  ...AUTH_COOKIE_OPTIONS,
  maxAge: 60 * 60 * 4, // 4 hours — impersonation sessions are short-lived
};

export function createAuthToken(userId: string, role: UserRole): string {
  return sign(
    { sub: userId, role, iat: Math.floor(Date.now() / 1000) },
    env.JWT_SECRET_KEY,
    { expiresIn: "7d", algorithm: "HS256" },
  );
}

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

export function setAuthCookie(cookies: ResponseCookies, token: string) {
  cookies.set(AUTH_COOKIE, token, AUTH_COOKIE_OPTIONS);
}

export function clearAuthCookie(cookies: ResponseCookies) {
  cookies.set(AUTH_COOKIE, "", { ...AUTH_COOKIE_OPTIONS, maxAge: 0 });
}

export function startImpersonation(cookies: ResponseCookies, adminToken: string, impersonationToken: string) {
  // Preserve the admin's real session
  cookies.set(ADMIN_COOKIE, adminToken, AUTH_COOKIE_OPTIONS);
  // Replace the active session with the impersonation token
  cookies.set(AUTH_COOKIE, impersonationToken, IMPERSONATION_COOKIE_OPTIONS);
}

export function exitImpersonation(cookies: ResponseCookies, adminToken: string) {
  cookies.set(AUTH_COOKIE, adminToken, AUTH_COOKIE_OPTIONS);
  cookies.set(ADMIN_COOKIE, "", { ...AUTH_COOKIE_OPTIONS, maxAge: 0 });
}
