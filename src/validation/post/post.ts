import { z } from "zod";

const httpUrlSchema = z
  .string()
  .url()
  .refine((url) => /^https?:\/\//i.test(url), "URL must use http or https");

export const createPostSchema = z.object({
  content: z.string().min(1, "Post cannot be empty").max(500, "Post too long"),
  images: z.array(httpUrlSchema).max(15).default([]),
  videoUrl: httpUrlSchema.optional(),
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
  isPrivate: z.boolean().optional(),
  hideFollowLists: z.boolean().optional(),
});
