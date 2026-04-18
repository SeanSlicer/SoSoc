import { describe, it, expect } from "vitest";
import { signUpSchema, loginSchemaEmail } from "../validation/auth/auth";

describe("signUpSchema", () => {
  const valid = { username: "alice_99", email: "alice@example.com", password: "Password1" };

  it("accepts a valid signup payload", () => {
    expect(signUpSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a username that is too short", () => {
    const result = signUpSchema.safeParse({ ...valid, username: "ab" });
    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.username).toBeDefined();
  });

  it("rejects a username that is too long", () => {
    const result = signUpSchema.safeParse({ ...valid, username: "a".repeat(26) });
    expect(result.success).toBe(false);
  });

  it("rejects a username with special characters", () => {
    const result = signUpSchema.safeParse({ ...valid, username: "alice!" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = signUpSchema.safeParse({ ...valid, email: "not-an-email" });
    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.email).toBeDefined();
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = signUpSchema.safeParse({ ...valid, password: "Pass1" });
    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.password).toBeDefined();
  });

  it("rejects a password without an uppercase letter", () => {
    const result = signUpSchema.safeParse({ ...valid, password: "password1" });
    expect(result.success).toBe(false);
  });

  it("rejects a password without a number", () => {
    const result = signUpSchema.safeParse({ ...valid, password: "PasswordNoNum" });
    expect(result.success).toBe(false);
  });

  it("trims whitespace from the username", () => {
    const result = signUpSchema.safeParse({ ...valid, username: "  alice  " });
    expect(result.success).toBe(true);
    expect(result.data?.username).toBe("alice");
  });
});

describe("loginSchemaEmail", () => {
  const valid = { email: "alice@example.com", password: "Password1" };

  it("accepts a valid login payload", () => {
    expect(loginSchemaEmail.safeParse(valid).success).toBe(true);
  });

  it("rejects a missing email", () => {
    const result = loginSchemaEmail.safeParse({ password: valid.password });
    expect(result.success).toBe(false);
  });

  it("rejects a missing password", () => {
    const result = loginSchemaEmail.safeParse({ email: valid.email });
    expect(result.success).toBe(false);
  });
});
