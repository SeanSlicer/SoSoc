import { prisma } from "~/server/db";
import { type PostType } from "@prisma/client";

export async function createPost(authorId: string, content: string, type: PostType, images: string[]) {
  return prisma.post.create({
    data: {
      content,
      type,
      images,
      imageUrl: images[0] ?? null, // keep for backward compat with existing queries
      authorId,
    },
    include: {
      author: { select: { id: true, username: true, displayName: true, photo: true } },
      _count: { select: { likes: true, comments: true } },
    },
  });
}

export async function updatePostContent(postId: string, authorId: string, content: string) {
  return prisma.post.updateMany({
    where: { id: postId, authorId },
    data: { content, updatedAt: new Date() },
  });
}

export async function deletePost(postId: string, authorId: string) {
  // Delete related records first
  await prisma.like.deleteMany({ where: { postId } });
  await prisma.comment.deleteMany({ where: { postId } });
  return prisma.post.deleteMany({ where: { id: postId, authorId } });
}

export async function toggleLike(userId: string, postId: string) {
  const existing = await prisma.like.findUnique({
    where: { userId_postId: { userId, postId } },
  });
  if (existing) {
    await prisma.like.delete({ where: { userId_postId: { userId, postId } } });
    return false;
  }
  await prisma.like.create({ data: { userId, postId } });
  return true;
}

export async function getComments(postId: string) {
  return prisma.comment.findMany({
    where: { postId },
    orderBy: { createdAt: "asc" },
    include: {
      user: { select: { id: true, username: true, displayName: true, photo: true } },
    },
  });
}

export async function createComment(userId: string, postId: string, content: string) {
  return prisma.comment.create({
    data: { userId, postId, content },
    include: {
      user: { select: { id: true, username: true, displayName: true, photo: true } },
    },
  });
}

export async function deleteComment(commentId: string, userId: string) {
  return prisma.comment.deleteMany({ where: { id: commentId, userId } });
}
