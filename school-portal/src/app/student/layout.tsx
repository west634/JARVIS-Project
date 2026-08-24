import type { ReactNode } from "react";
import { requireRole } from "@/lib/auth/guards";
import { AppShell } from "@/components/nav/AppShell";

const NAV_ITEMS = [{ label: "Home", href: "/student" }];

export default async function StudentLayout({ children }: { children: ReactNode }) {
  const session = await requireRole("STUDENT");
  return (
    <AppShell
      navItems={NAV_ITEMS}
      userName={session.name}
      roleLabel="Student"
      isDemo={session.isDemo}
    >
      {children}
    </AppShell>
  );
}
