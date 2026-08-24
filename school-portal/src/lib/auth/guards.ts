import "server-only";
import { redirect } from "next/navigation";
import { getSession, type SessionPayload } from "@/lib/auth/session";
import type { Role } from "@/generated/prisma/enums";

/**
 * Fetches the verified session or redirects to /login. Use at the top of
 * every protected Server Component/layout and every Server Action.
 */
export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

/**
 * Same as requireSession, but also enforces role membership. Never trust a
 * role passed from the client — this always re-derives it from the signed
 * session cookie.
 */
export async function requireRole(...roles: Role[]): Promise<SessionPayload> {
  const session = await requireSession();
  if (!roles.includes(session.role)) {
    redirect(`/${roleHomePath(session.role)}`);
  }
  return session;
}

export function roleHomePath(role: Role): string {
  switch (role) {
    case "STUDENT":
      return "student";
    case "TEACHER":
      return "teacher";
    case "PARENT":
      return "parent";
    case "ADMIN":
      return "admin";
  }
}
