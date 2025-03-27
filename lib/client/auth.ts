import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";
import type { NextResponse } from "next/server";
import { env } from "~/../src/env.js";
import { getUserById } from "~/../prisma/queries/auth/getUser";
import { type User } from "@prisma/client";

interface UserJwtPayload {
  jti: string;
  iat: number;
  exp: number;
  username?: string;
}

const JWT_SECRET = env.JWT_SECRET_KEY;

/**
 * Verifies token and returns payload
 */
export const verifyAuth = (token: string): UserJwtPayload => {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as UserJwtPayload;
    return payload;
  } catch (err) {
    throw new Error("Your token has expired.");
  }
};

export const getUserByToken = async (token: string) => {
  try {
    const payload = verifyAuth(token);
    return getUserById(payload.jti);
  } catch (err) {
    throw new Error("Your token has expired.");
  }
};

/**
 * Adds the user token cookie to a response
 */
export function setUserCookie(res: NextResponse, setExpirationHours: string) {
  const expirationSeconds = parseInt(setExpirationHours) * 60 * 60;

  const token = jwt.sign(
    {
      jti: nanoid(),
      iat: Math.floor(Date.now() / 1000),
    },
    JWT_SECRET,
    {
      expiresIn: expirationSeconds,
      algorithm: "HS256",
    },
  );

  res.cookies.set("user-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: parseInt(setExpirationHours) * 60 * 60, // Convert hours to seconds
  });

  return res;
}
