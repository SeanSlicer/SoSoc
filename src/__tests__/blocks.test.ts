import { describe, it, expect } from "vitest";

/**
 * Pure-logic tests for the blocking feature that don't require a database.
 * DB-layer behavior (blockUser, unblockUser, etc.) is covered by the schema
 * constraints: @@unique([blockerId, blockedId]) and cascade deletes.
 */

describe("block self-guard", () => {
  // Mirrors the tRPC mutation guard: ctx.userId === input.userId
  function canBlock(actorId: string, targetId: string): boolean {
    return actorId !== targetId;
  }

  it("allows blocking another user", () => {
    expect(canBlock("user-1", "user-2")).toBe(true);
  });

  it("prevents blocking yourself", () => {
    expect(canBlock("user-1", "user-1")).toBe(false);
  });
});

describe("block direction logic", () => {
  type Block = { blockerId: string; blockedId: string };

  function isBlockedInAnyDirection(blocks: Block[], userA: string, userB: string): boolean {
    return blocks.some(
      (b) =>
        (b.blockerId === userA && b.blockedId === userB) ||
        (b.blockerId === userB && b.blockedId === userA),
    );
  }

  const blocks: Block[] = [{ blockerId: "alice", blockedId: "bob" }];

  it("detects a direct block", () => {
    expect(isBlockedInAnyDirection(blocks, "alice", "bob")).toBe(true);
  });

  it("detects a reverse block", () => {
    expect(isBlockedInAnyDirection(blocks, "bob", "alice")).toBe(true);
  });

  it("returns false when no block exists", () => {
    expect(isBlockedInAnyDirection(blocks, "alice", "carol")).toBe(false);
  });

  it("returns false for unrelated pair", () => {
    expect(isBlockedInAnyDirection(blocks, "carol", "dave")).toBe(false);
  });
});

describe("feed block filter", () => {
  type Post = { authorId: string };
  type Block = { blockerId: string; blockedId: string };

  function filterFeed(posts: Post[], blocks: Block[], viewerId: string): Post[] {
    return posts.filter((post) => {
      if (post.authorId === viewerId) return true;
      return !blocks.some(
        (b) =>
          (b.blockerId === viewerId && b.blockedId === post.authorId) ||
          (b.blockerId === post.authorId && b.blockedId === viewerId),
      );
    });
  }

  const posts: Post[] = [
    { authorId: "viewer" },
    { authorId: "alice" },
    { authorId: "bob" },
    { authorId: "carol" },
  ];
  const blocks: Block[] = [
    { blockerId: "viewer", blockedId: "alice" }, // viewer blocked alice
    { blockerId: "bob", blockedId: "viewer" },   // bob blocked viewer
  ];

  it("keeps viewer's own posts", () => {
    const result = filterFeed(posts, blocks, "viewer");
    expect(result.some((p) => p.authorId === "viewer")).toBe(true);
  });

  it("hides posts from users the viewer blocked", () => {
    const result = filterFeed(posts, blocks, "viewer");
    expect(result.some((p) => p.authorId === "alice")).toBe(false);
  });

  it("hides posts from users who blocked the viewer", () => {
    const result = filterFeed(posts, blocks, "viewer");
    expect(result.some((p) => p.authorId === "bob")).toBe(false);
  });

  it("keeps posts from unrelated users", () => {
    const result = filterFeed(posts, blocks, "viewer");
    expect(result.some((p) => p.authorId === "carol")).toBe(true);
  });
});
