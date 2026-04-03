import { z } from "zod";

export const createPostSchema = z.object({
  content: z.string().min(1, "Post cannot be empty").max(500, "Post too long"),
  images: z.array(z.string().url()).max(15).default([]),
});

export const updatePostSchema = z.object({
  postId: z.string().min(1),
  content: z.string().min(1, "Post cannot be empty").max(500, "Post too long"),
});

export const updateProfileSchema = z.object({
  displayName: z.string().max(50).optional(),
  bio: z.string().max(160).optional(),
  username: z
    .string()
    .min(3)
    .max(25)
    .regex(/^[a-zA-Z0-9_]*$/, "Only letters, numbers, and underscores")
    .optional(),
});
