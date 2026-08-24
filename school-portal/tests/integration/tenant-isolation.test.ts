import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db, withTenant } from "@/lib/db";

/**
 * Proves the database-layer half of ARCHITECTURE.md §3: row-level security
 * enforces tenant isolation even if application code forgets to filter by
 * schoolId. This talks to a real local Postgres (the same one `npm run dev`
 * uses) and cleans up everything it creates.
 */

const RUN_ID = Math.random().toString(36).slice(2, 8);

let schoolAId: string;
let schoolBId: string;

beforeAll(async () => {
  const schoolA = await db.school.create({
    data: { name: `RLS Test School A ${RUN_ID}`, slug: `rls-test-a-${RUN_ID}` },
  });
  const schoolB = await db.school.create({
    data: { name: `RLS Test School B ${RUN_ID}`, slug: `rls-test-b-${RUN_ID}` },
  });
  schoolAId = schoolA.id;
  schoolBId = schoolB.id;

  await withTenant(schoolAId, (tx) =>
    tx.user.create({
      data: {
        schoolId: schoolAId,
        email: `a-user-${RUN_ID}@example.com`,
        name: "School A User",
        passwordHash: "unused",
        role: "ADMIN",
      },
    }),
  );
  await withTenant(schoolBId, (tx) =>
    tx.user.create({
      data: {
        schoolId: schoolBId,
        email: `b-user-${RUN_ID}@example.com`,
        name: "School B User",
        passwordHash: "unused",
        role: "ADMIN",
      },
    }),
  );
});

afterAll(async () => {
  await withTenant(schoolAId, (tx) => tx.school.delete({ where: { id: schoolAId } }));
  await withTenant(schoolBId, (tx) => tx.school.delete({ where: { id: schoolBId } }));
  await db.$disconnect();
});

describe("row-level security tenant isolation", () => {
  it("only returns rows for the tenant set in the transaction", async () => {
    const usersSeenFromA = await withTenant(schoolAId, (tx) => tx.user.findMany());
    expect(usersSeenFromA.every((u) => u.schoolId === schoolAId)).toBe(true);
    expect(usersSeenFromA.some((u) => u.schoolId === schoolBId)).toBe(false);

    const usersSeenFromB = await withTenant(schoolBId, (tx) => tx.user.findMany());
    expect(usersSeenFromB.every((u) => u.schoolId === schoolBId)).toBe(true);
  });

  it("fails closed with no tenant context set: zero rows, not all rows", async () => {
    // Directly querying `db` without going through withTenant leaves
    // app.current_school_id unset, so every tenant-scoped policy evaluates
    // to false — this must never silently return cross-tenant data.
    const users = await db.user.findMany({
      where: { email: { in: [`a-user-${RUN_ID}@example.com`, `b-user-${RUN_ID}@example.com`] } },
    });
    expect(users).toHaveLength(0);
  });

  it("rejects an attempt to insert a row tagged with a different tenant", async () => {
    await expect(
      withTenant(schoolAId, (tx) =>
        tx.user.create({
          data: {
            schoolId: schoolBId, // mismatched on purpose
            email: `cross-tenant-${RUN_ID}@example.com`,
            name: "Should Never Be Created",
            passwordHash: "unused",
            role: "ADMIN",
          },
        }),
      ),
    ).rejects.toThrow();
  });
});
