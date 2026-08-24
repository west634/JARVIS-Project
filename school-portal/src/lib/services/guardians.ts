import type { PrismaClient } from "@/generated/prisma/client";

/**
 * Resolves which students' User IDs a parent is an active guardian for.
 * Centralized here so every permission check that needs
 * `guardianStudentIds` (lib/permissions.ts) computes it the same way,
 * always from a tenant-scoped transaction — never trusted from the client.
 */
export async function getGuardianStudentUserIds(
  tx: Pick<PrismaClient, "parentProfile">,
  parentUserId: string,
): Promise<string[]> {
  const parentProfile = await tx.parentProfile.findUnique({
    where: { userId: parentUserId },
    include: { guardianLinks: { include: { studentProfile: true } } },
  });
  if (!parentProfile) return [];
  return parentProfile.guardianLinks.map((link) => link.studentProfile.userId);
}
