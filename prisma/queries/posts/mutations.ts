import { prisma } from "~/server/db";
import { type PostType } from "@prisma/client";
import { createNotification } from "../notifications/notifications";

export async function createPost(
  authorId: string,
  content: string,
  type: PostType,
  images: string[],
  videoUrl?: string,
) {
  return prisma.post.create({
    data: {
      content,
      type,
      images,
      imageUrl: images[0] ?? null,
      videoUrl: videoUrl ?? null,
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

  const [, post, liker] = await Promise.all([
    prisma.like.create({ data: { userId, postId } }),
    prisma.post.findUnique({ where: { id: postId }, select: { authorId: true } }),
    prisma.user.findUnique({ where: { id: userId }, select: { username: true, displayName: true } }),
  ]);

  if (post) {
    const name = liker?.displayName ?? liker?.username ?? "Someone";
    void createNotification(post.authorId, userId, "NEW_LIKE", `${name} liked your post`, postId);
  }
  return true;
}

export async function getComments(postId: string, cursor?: string, limit = 10) {
  const comments = await prisma.comment.findMany({
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    where: { postId },
    orderBy: { createdAt: "asc" },
    include: {
      user: { select: { id: true, username: true, displayName: true, photo: true } },
    },
  });

  let nextCursor: string | undefined;
  if (comments.length > limit) {
    nextCursor = comments.pop()!.id;
  }

  return { comments, nextCursor };
}

export async function createComment(userId: string, postId: string, content: string) {
  const [post, commenter] = await Promise.all([
    prisma.post.findUnique({ where: { id: postId }, select: { authorId: true } }),
    prisma.user.findUnique({ where: { id: userId }, select: { username: true, displayName: true } }),
  ]);

  if (post && post.authorId !== userId) {
    const block = await prisma.blockedUser.findFirst({
      where: {
        OR: [
          { blockerId: userId, blockedId: post.authorId },
          { blockerId: post.authorId, blockedId: userId },
        ],
      },
      select: { blockerId: true },
    });
    if (block) throw new Error("Cannot comment on this post");
  }

  const comment = await prisma.comment.create({
    data: { userId, postId, content },
    include: { user: { select: { id: true, username: true, displayName: true, photo: true } } },
  });

  if (post) {
    const name = commenter?.displayName ?? commenter?.username ?? "Someone";
    void createNotification(post.authorId, userId, "NEW_COMMENT", `${name} commented on your post`, postId);
  }
  return comment;
}

export async function deleteComment(commentId: string, userId: string) {
  return prisma.comment.deleteMany({ where: { id: commentId, userId } });
}
