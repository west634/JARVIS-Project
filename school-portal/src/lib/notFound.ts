import "server-only";
import { notFound } from "next/navigation";

/**
 * Every service function that uses findUniqueOrThrow/findFirstOrThrow to
 * double as both "fetch" and "authorize" (e.g. "this section, but only if
 * this student is enrolled in it") throws Prisma's P2025 for both a
 * genuinely missing row AND a row that exists but fails the ownership
 * check. Either way the right response is a clean 404, never a raw
 * stack trace — wrap those service calls with this.
 */
export async function withNotFoundOn404<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (isPrismaNotFoundError(err)) notFound();
    throw err;
  }
}

function isPrismaNotFoundError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: unknown }).code === "P2025"
  );
}
