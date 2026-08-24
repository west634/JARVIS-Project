import type { ReactNode } from "react";
import { requireRole } from "@/lib/auth/guards";
import { AppShell } from "@/components/nav/AppShell";

const NAV_ITEMS = [
  { label: "Home", href: "/teacher" },
  { label: "Classes", href: "/teacher/classes" },
];

export default async function TeacherLayout({ children }: { children: ReactNode }) {
  const session = await requireRole("TEACHER");
  return (
    <AppShell
      navItems={NAV_ITEMS}
      userName={session.name}
      roleLabel="Teacher"
      isDemo={session.isDemo}
    >
      {children}
    </AppShell>
  );
}
