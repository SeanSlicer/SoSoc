import "server-only";
import { sign } from "jsonwebtoken";
import { env } from "~/env";
import type { ResponseCookies } from "next/dist/compiled/@edge-runtime/cookies";

export const AUTH_COOKIE = "user-token";

export const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // 7 days
};

export function createAuthToken(userId: string): string {
  return sign(
    { sub: userId, iat: Math.floor(Date.now() / 1000) },
    env.JWT_SECRET_KEY,
    { expiresIn: "7d", algorithm: "HS256" },
  );
}

export function setAuthCookie(cookies: ResponseCookies, token: string) {
  cookies.set(AUTH_COOKIE, token, AUTH_COOKIE_OPTIONS);
}

export function clearAuthCookie(cookies: ResponseCookies) {
  cookies.set(AUTH_COOKIE, "", { ...AUTH_COOKIE_OPTIONS, maxAge: 0 });
}
