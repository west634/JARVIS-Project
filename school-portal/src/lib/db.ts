import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

declare global {
  var __schoolPortalDb: PrismaClient | undefined;
  var __schoolPortalAuthDb: PrismaClient | undefined;
}

function makeClient(url: string) {
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
}

/**
 * The main app database client. Every table it can see (other than `School`)
 * has row-level security enabled, so a query only ever returns rows for the
 * tenant set via `withTenant`/`tx.setTenant` in the *current transaction*.
 * Never query this client directly outside a tenant transaction for a
 * tenant-scoped table — it will simply return zero rows (fail closed).
 */
export const db =
  globalThis.__schoolPortalDb ?? makeClient(requireEnv("DATABASE_URL"));

/**
 * A separate, least-privilege client used ONLY to look up a user by email
 * during login, before we know which school (tenant) they belong to. This
 * role can SELECT from `User` only, and bypasses RLS for that one purpose.
 * Do not use this client for anything else. See SECURITY.md.
 */
export const authDb =
  globalThis.__schoolPortalAuthDb ?? makeClient(requireEnv("DATABASE_URL_AUTH"));

if (process.env.NODE_ENV !== "production") {
  globalThis.__schoolPortalDb = db;
  globalThis.__schoolPortalAuthDb = authDb;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

/**
 * Runs `fn` inside a transaction scoped to `schoolId`: sets the
 * `app.current_school_id` session variable (via `set_config(..., true)`,
 * i.e. local to the transaction) before anything else runs, so every RLS
 * policy in the database enforces that tenant boundary for the duration of
 * the callback. This is the ONLY sanctioned way to read/write tenant data —
 * see ARCHITECTURE.md §3.
 */
export async function withTenant<T>(
  schoolId: string,
  fn: (tx: Omit<PrismaClient, "$transaction" | "$connect" | "$disconnect" | "$extends" | "$on">) => Promise<T>,
): Promise<T> {
  return db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.current_school_id', ${schoolId}, true)`;
    return fn(tx);
  });
}
