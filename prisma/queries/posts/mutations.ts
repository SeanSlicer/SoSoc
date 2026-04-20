import { prisma } from "~/server/db";
import { type PostType } from "@prisma/client";
import { createNotification } from "../notifications/notifications";

/**
 * Creates a new post.
 *
 * @param authorId  ID of the user creating the post
 * @param content   Post text content
 * @param type      Post type: PHOTO, VIDEO, or CAPTION
 * @param images    Array of image URLs (up to 15)
 * @param videoUrl  Optional video URL (VIDEO type only)
 */
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

/**
 * Updates the text content of a post. Only succeeds if the userId is the author.
 *
 * @param postId    Post to update
 * @param authorId  Must match the post's authorId
 * @param content   New content string
 */
export async function updatePostContent(postId: string, authorId: string, content: string) {
  return prisma.post.updateMany({
    where: { id: postId, authorId },
    data: { content, updatedAt: new Date() },
  });
}

/**
 * Deletes a post and all associated likes and comments.
 * Only succeeds if the userId is the author.
 *
 * @param postId    Post to delete
 * @param authorId  Must match the post's authorId
 */
export async function deletePost(postId: string, authorId: string) {
  await prisma.like.deleteMany({ where: { postId } });
  await prisma.comment.deleteMany({ where: { postId } });
  return prisma.post.deleteMany({ where: { id: postId, authorId } });
}

/**
 * Toggles a like on a post. Creates the like if it doesn't exist, deletes it if it does.
 * Sends a NEW_LIKE notification to the post author when liking.
 *
 * @param userId  User toggling the like
 * @param postId  Post to like/unlike
 * @returns `true` if the post is now liked, `false` if unliked
 */
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

/**
 * Returns a cursor-paginated list of comments for a post, oldest first.
 *
 * @param postId  Post whose comments to return
 * @param cursor  Last comment ID from the previous page
 * @param limit   Comments per page (default 10)
 */
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

/**
 * Creates a comment on a post.
 * Throws if a block relationship exists between the commenter and the post author.
 * Sends a NEW_COMMENT notification to the post author.
 *
 * @param userId   User posting the comment
 * @param postId   Post to comment on
 * @param content  Comment text
 */
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

/**
 * Deletes a comment. Only succeeds if the userId is the comment author.
 *
 * @param commentId  Comment to delete
 * @param userId     Must match the comment's userId
 */
export async function deleteComment(commentId: string, userId: string) {
  return prisma.comment.deleteMany({ where: { id: commentId, userId } });
}
