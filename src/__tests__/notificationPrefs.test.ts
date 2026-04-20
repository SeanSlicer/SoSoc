import { describe, it, expect } from "vitest";
import type { NotificationType } from "@prisma/client";

// ─── Pref-to-type mapping (mirrors createNotification logic) ─────────────────

describe("notification preference gating", () => {
  type PrefKey =
    | "notifyNewFollower"
    | "notifyNewLike"
    | "notifyNewComment"
    | "notifyFollowRequest"
    | "notifyFollowAccepted"
    | "notifyNewMessage";

  type UserPrefs = Record<PrefKey, boolean>;

  const PREF_COLUMN: Partial<Record<NotificationType, PrefKey>> = {
    NEW_FOLLOWER:            "notifyNewFollower",
    NEW_LIKE:                "notifyNewLike",
    NEW_COMMENT:             "notifyNewComment",
    FOLLOW_REQUEST:          "notifyFollowRequest",
    FOLLOW_REQUEST_ACCEPTED: "notifyFollowAccepted",
    NEW_MESSAGE:             "notifyNewMessage",
  };

  /** Pure logic mirror of createNotification's pref check */
  function shouldSend(
    type: NotificationType,
    prefs: Partial<UserPrefs>,
    actorId: string,
    recipientId: string,
  ): boolean {
    if (actorId === recipientId) return false;
    const key = PREF_COLUMN[type];
    if (!key) return true; // unmapped types are always sent
    return prefs[key] !== false; // missing key treated as true (default ON)
  }

  const allOn: UserPrefs = {
    notifyNewFollower: true,
    notifyNewLike: true,
    notifyNewComment: true,
    notifyFollowRequest: true,
    notifyFollowAccepted: true,
    notifyNewMessage: true,
  };

  it("sends when all prefs are on", () => {
    expect(shouldSend("NEW_LIKE", allOn, "alice", "bob")).toBe(true);
  });

  it("suppresses when the matching pref is off", () => {
    const prefs = { ...allOn, notifyNewLike: false };
    expect(shouldSend("NEW_LIKE", prefs, "alice", "bob")).toBe(false);
  });

  it("suppresses NEW_FOLLOWER when notifyNewFollower is off", () => {
    expect(shouldSend("NEW_FOLLOWER", { ...allOn, notifyNewFollower: false }, "alice", "bob")).toBe(false);
  });

  it("suppresses NEW_COMMENT when notifyNewComment is off", () => {
    expect(shouldSend("NEW_COMMENT", { ...allOn, notifyNewComment: false }, "alice", "bob")).toBe(false);
  });

  it("suppresses FOLLOW_REQUEST when notifyFollowRequest is off", () => {
    expect(shouldSend("FOLLOW_REQUEST", { ...allOn, notifyFollowRequest: false }, "alice", "bob")).toBe(false);
  });

  it("suppresses FOLLOW_REQUEST_ACCEPTED when notifyFollowAccepted is off", () => {
    expect(shouldSend("FOLLOW_REQUEST_ACCEPTED", { ...allOn, notifyFollowAccepted: false }, "alice", "bob")).toBe(false);
  });

  it("suppresses NEW_MESSAGE when notifyNewMessage is off", () => {
    expect(shouldSend("NEW_MESSAGE", { ...allOn, notifyNewMessage: false }, "alice", "bob")).toBe(false);
  });

  it("never sends a notification from a user to themselves", () => {
    expect(shouldSend("NEW_LIKE", allOn, "alice", "alice")).toBe(false);
  });

  it("defaults to ON when a pref key is missing from the record", () => {
    expect(shouldSend("NEW_LIKE", {}, "alice", "bob")).toBe(true);
  });

  it("sends FRIEND_REQUEST (unmapped type) regardless of prefs", () => {
    expect(shouldSend("FRIEND_REQUEST", {}, "alice", "bob")).toBe(true);
  });
});
