import { z } from "zod";

const specialCharacters = /^[a-zA-Z0-9_]*$/;

export const loginSchemaEmail = z.object({
  email: z.string().email(),
  password: z
    .string()
    .regex(new RegExp(".*[A-Z].*"), "One uppercase character")
    .regex(new RegExp(".*\\d.*"), "One number")
    .min(8, "Must be at least 8 characters in length"),
});

export const signUpSchema = loginSchemaEmail.extend({
  username: z
    .string()
    .min(3, "Username must me greater than 3 characters")
    .max(25, "Username must be under 25 characters")
    .refine((value) => specialCharacters.test(value), {
      message: "Username should not contain special characters",
    }),
});

export const loginSchemaUsername = signUpSchema.omit({ email: true });

export type LoginEmail = z.infer<typeof loginSchemaEmail>;
export type LoginUsername = z.infer<typeof loginSchemaUsername>;
export type SignUp = z.infer<typeof signUpSchema>;
export type AuthResult = {
  accessToken: string;
  refreshToken: string;
  user: UserData;
};

export type UserData = {
  id: string;
  email?: string;
  username: string;
};

export type TokenPayload = {
  userId: string;
  username: string;
};
