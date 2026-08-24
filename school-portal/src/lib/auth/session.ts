import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { Role } from "@/generated/prisma/enums";

const COOKIE_NAME = "school_portal_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 days

export type SessionPayload = {
  userId: string;
  schoolId: string;
  role: Role;
  email: string;
  name: string;
  isDemo: boolean;
};

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("SESSION_SECRET must be set to a strong random value.");
  }
  return new TextEncoder().encode(secret);
}

export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecret());

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

/**
 * Reads and verifies the session cookie for the current request. Returns
 * null if there is no session or it fails verification/expiry — callers
 * must treat null as "not authenticated," never assume a session exists.
 */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    const { userId, schoolId, role, email, name, isDemo } = payload as Record<string, unknown>;
    if (
      typeof userId !== "string" ||
      typeof schoolId !== "string" ||
      typeof role !== "string" ||
      typeof email !== "string" ||
      typeof name !== "string" ||
      typeof isDemo !== "boolean"
    ) {
      return null;
    }
    return { userId, schoolId, role: role as Role, email, name, isDemo };
  } catch {
    return null;
  }
}
