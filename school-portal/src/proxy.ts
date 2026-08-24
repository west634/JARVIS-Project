import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Coarse-grained redirect only. This never makes the final authorization
// decision — every protected Server Component/layout and Server Action
// re-verifies the session and role independently (see lib/auth/guards.ts),
// because a Proxy matcher gap or refactor must never become a security hole
// on its own. See ARCHITECTURE.md §4 and the Next.js Proxy docs' own
// warning about exactly this failure mode.

const PUBLIC_PATHS = ["/login"];
const COOKIE_NAME = "school_portal_session";

async function hasValidSession(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return false;
  const secret = process.env.SESSION_SECRET;
  if (!secret) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return true;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const authed = await hasValidSession(request);

  if (!authed && !isPublic && pathname !== "/") {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (authed && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)"],
};
