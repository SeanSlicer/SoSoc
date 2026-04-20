import { z } from "zod";

/**
 * Shared validators
 */
const usernameRegex = /^[a-zA-Z0-9_]+$/;

const passwordSchema = z
  .string()
  .min(8, "Must be at least 8 characters")
  .regex(/[A-Z]/, "One uppercase character")
  .regex(/\d/, "One number");

const emailSchema = z.string().email("Invalid email address");

/**
 * Base fields
 */
const baseAuthSchema = {
  password: passwordSchema,
};

/**
 * Schemas
 */
export const signUpSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Username must be at least 3 characters")
    .max(25, "Username must be under 25 characters")
    .regex(usernameRegex, "Only letters, numbers, and underscores"),
  email: emailSchema,
  ...baseAuthSchema,
});

export const loginSchemaEmail = z.object({
  email: emailSchema,
  ...baseAuthSchema,
});

export const loginSchemaUsername = z.object({
  username: z.string().trim(),
  ...baseAuthSchema,
});

/**
 * Types
 */
export type SignUp = z.infer<typeof signUpSchema>;
export type LoginEmail = z.infer<typeof loginSchemaEmail>;
export type LoginUsername = z.infer<typeof loginSchemaUsername>;

/**
 * API types
 */
export type UserData = {
  id: string;
  email?: string;
  username: string;
};

export type AuthResult = {
  accessToken: string;
  refreshToken: string;
  user: UserData;
};

export type TokenPayload = {
  userId: string;
  username: string;
};
