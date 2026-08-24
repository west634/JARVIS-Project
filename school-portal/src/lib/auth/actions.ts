"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { authDb } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession } from "@/lib/auth/session";
import { isRateLimited, recordAttempt, clearAttempts } from "@/lib/auth/rateLimit";
import { roleHomePath } from "@/lib/auth/guards";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export type LoginState = {
  error: string | null;
};

export async function loginAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "Enter a valid email and password." };
  }
  const { email, password } = parsed.data;

  const ip = (await headers()).get("x-forwarded-for") ?? "local";
  const rateLimitKey = `${ip}:${email}`;
  if (isRateLimited(rateLimitKey)) {
    return { error: "Too many attempts. Please wait a few minutes and try again." };
  }

  // Least-privilege lookup: this connection can only SELECT from User, and
  // bypasses RLS because we don't yet know the tenant — see SECURITY.md.
  const user = await authDb.user.findUnique({ where: { email } });

  const genericError = "Invalid email or password.";
  if (!user) {
    recordAttempt(rateLimitKey);
    return { error: genericError };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    recordAttempt(rateLimitKey);
    return { error: genericError };
  }

  clearAttempts(rateLimitKey);
  await createSession({
    userId: user.id,
    schoolId: user.schoolId,
    role: user.role,
    email: user.email,
    name: user.name,
    isDemo: user.isDemo,
  });

  redirect(`/${roleHomePath(user.role)}`);
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}
