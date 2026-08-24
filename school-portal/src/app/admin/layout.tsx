import type { ReactNode } from "react";
import { requireRole } from "@/lib/auth/guards";
import { AppShell } from "@/components/nav/AppShell";

const NAV_ITEMS = [{ label: "Dashboard", href: "/admin" }];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await requireRole("ADMIN");
  return (
    <AppShell
      navItems={NAV_ITEMS}
      userName={session.name}
      roleLabel="Administrator"
      isDemo={session.isDemo}
    >
      {children}
    </AppShell>
  );
}
