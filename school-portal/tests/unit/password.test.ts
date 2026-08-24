import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

describe("password hashing", () => {
  it("round-trips correctly and rejects a wrong password", async () => {
    const hash = await hashPassword("correct-horse-battery-staple");
    expect(await verifyPassword("correct-horse-battery-staple", hash)).toBe(true);
    expect(await verifyPassword("wrong-password", hash)).toBe(false);
  });

  it("never stores the plaintext password in the hash", async () => {
    const plain = "demo1234";
    const hash = await hashPassword(plain);
    expect(hash).not.toContain(plain);
    expect(hash.startsWith("$2")).toBe(true); // bcrypt format marker
  });
});
