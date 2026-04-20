import { describe, it, expect } from "vitest";

// ─── isFriends logic ──────────────────────────────────────────────────────────

describe("isFriends", () => {
  type Follow = { followerId: string; followingId: string };

  function isFriends(follows: Follow[], userA: string, userB: string): boolean {
    const aFollowsB = follows.some((f) => f.followerId === userA && f.followingId === userB);
    const bFollowsA = follows.some((f) => f.followerId === userB && f.followingId === userA);
    return aFollowsB && bFollowsA;
  }

  const follows: Follow[] = [
    { followerId: "alice", followingId: "bob" },
    { followerId: "bob", followingId: "alice" },
    { followerId: "alice", followingId: "carol" },
  ];

  it("returns true for a mutual follow", () => {
    expect(isFriends(follows, "alice", "bob")).toBe(true);
  });

  it("returns true regardless of argument order", () => {
    expect(isFriends(follows, "bob", "alice")).toBe(true);
  });

  it("returns false when only one side follows", () => {
    // alice follows carol but carol doesn't follow alice
    expect(isFriends(follows, "alice", "carol")).toBe(false);
  });

  it("returns false when neither follows the other", () => {
    expect(isFriends(follows, "bob", "carol")).toBe(false);
  });
});

// ─── DM status routing ────────────────────────────────────────────────────────

describe("DM creation status routing", () => {
  type MemberStatus = "ACTIVE" | "REQUEST" | "HIDDEN";

  /** Mirrors the getOrCreateDM logic: sender is always ACTIVE; recipient gets REQUEST if not friends. */
  function getInitialStatuses(
    senderId: string,
    recipientId: string,
    areFriends: boolean,
  ): Record<string, MemberStatus> {
    return {
      [senderId]: "ACTIVE",
      [recipientId]: areFriends ? "ACTIVE" : "REQUEST",
    };
  }

  it("both members are ACTIVE when the users are friends", () => {
    const statuses = getInitialStatuses("alice", "bob", true);
    expect(statuses["alice"]).toBe("ACTIVE");
    expect(statuses["bob"]).toBe("ACTIVE");
  });

  it("sender is ACTIVE, recipient is REQUEST when not friends", () => {
    const statuses = getInitialStatuses("alice", "carol", false);
    expect(statuses["alice"]).toBe("ACTIVE");
    expect(statuses["carol"]).toBe("REQUEST");
  });
});

// ─── Message request actions ──────────────────────────────────────────────────

describe("message request accept / decline", () => {
  type MemberStatus = "ACTIVE" | "REQUEST" | "HIDDEN";
  type Member = { userId: string; status: MemberStatus };

  function acceptRequest(members: Member[], userId: string): Member[] {
    return members.map((m) =>
      m.userId === userId && m.status === "REQUEST" ? { ...m, status: "ACTIVE" } : m,
    );
  }

  function declineRequest(members: Member[], userId: string): Member[] {
    return members.map((m) =>
      m.userId === userId && m.status === "REQUEST" ? { ...m, status: "HIDDEN" } : m,
    );
  }

  const initial: Member[] = [
    { userId: "alice", status: "ACTIVE" },
    { userId: "bob", status: "REQUEST" },
  ];

  it("accepting moves the recipient from REQUEST to ACTIVE", () => {
    const result = acceptRequest(initial, "bob");
    expect(result.find((m) => m.userId === "bob")?.status).toBe("ACTIVE");
  });

  it("accepting does not change other members' statuses", () => {
    const result = acceptRequest(initial, "bob");
    expect(result.find((m) => m.userId === "alice")?.status).toBe("ACTIVE");
  });

  it("declining moves the recipient from REQUEST to HIDDEN", () => {
    const result = declineRequest(initial, "bob");
    expect(result.find((m) => m.userId === "bob")?.status).toBe("HIDDEN");
  });

  it("declining does not affect members not in REQUEST status", () => {
    const result = declineRequest(initial, "alice");
    expect(result.find((m) => m.userId === "alice")?.status).toBe("ACTIVE");
  });
});

// ─── Conversation hiding ──────────────────────────────────────────────────────

describe("conversation hiding", () => {
  type MemberStatus = "ACTIVE" | "REQUEST" | "HIDDEN";
  type Member = { userId: string; status: MemberStatus };

  function hideConversation(members: Member[], userId: string): Member[] {
    return members.map((m) => (m.userId === userId ? { ...m, status: "HIDDEN" } : m));
  }

  it("sets the requesting user's status to HIDDEN", () => {
    const members: Member[] = [
      { userId: "alice", status: "ACTIVE" },
      { userId: "bob", status: "ACTIVE" },
    ];
    const result = hideConversation(members, "alice");
    expect(result.find((m) => m.userId === "alice")?.status).toBe("HIDDEN");
  });

  it("does not change the other member's status", () => {
    const members: Member[] = [
      { userId: "alice", status: "ACTIVE" },
      { userId: "bob", status: "ACTIVE" },
    ];
    const result = hideConversation(members, "alice");
    expect(result.find((m) => m.userId === "bob")?.status).toBe("ACTIVE");
  });
});

// ─── HIDDEN → REQUEST restore on new message ─────────────────────────────────

describe("restore hidden conversation on new message", () => {
  type MemberStatus = "ACTIVE" | "REQUEST" | "HIDDEN";
  type Member = { userId: string; status: MemberStatus };

  /** Mirrors sendMessage: HIDDEN members (other than sender) are bumped back to REQUEST. */
  function restoreHidden(members: Member[], senderId: string): Member[] {
    return members.map((m) =>
      m.userId !== senderId && m.status === "HIDDEN" ? { ...m, status: "REQUEST" } : m,
    );
  }

  it("surfaces a HIDDEN conversation as REQUEST when a new message arrives", () => {
    const members: Member[] = [
      { userId: "alice", status: "ACTIVE" },
      { userId: "bob", status: "HIDDEN" },
    ];
    const result = restoreHidden(members, "alice");
    expect(result.find((m) => m.userId === "bob")?.status).toBe("REQUEST");
  });

  it("does not change the sender's status", () => {
    const members: Member[] = [
      { userId: "alice", status: "ACTIVE" },
      { userId: "bob", status: "HIDDEN" },
    ];
    const result = restoreHidden(members, "alice");
    expect(result.find((m) => m.userId === "alice")?.status).toBe("ACTIVE");
  });

  it("does not affect members who are already ACTIVE", () => {
    const members: Member[] = [
      { userId: "alice", status: "ACTIVE" },
      { userId: "bob", status: "ACTIVE" },
    ];
    const result = restoreHidden(members, "alice");
    expect(result.find((m) => m.userId === "bob")?.status).toBe("ACTIVE");
  });

  it("does not affect members in REQUEST status", () => {
    const members: Member[] = [
      { userId: "alice", status: "ACTIVE" },
      { userId: "bob", status: "REQUEST" },
    ];
    const result = restoreHidden(members, "alice");
    expect(result.find((m) => m.userId === "bob")?.status).toBe("REQUEST");
  });
});
