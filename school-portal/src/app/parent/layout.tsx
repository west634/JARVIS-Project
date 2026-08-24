import type { ReactNode } from "react";
import { requireRole } from "@/lib/auth/guards";
import { AppShell } from "@/components/nav/AppShell";

const NAV_ITEMS = [{ label: "Home", href: "/parent" }];

export default async function ParentLayout({ children }: { children: ReactNode }) {
  const session = await requireRole("PARENT");
  return (
    <AppShell
      navItems={NAV_ITEMS}
      userName={session.name}
      roleLabel="Parent"
      isDemo={session.isDemo}
    >
      {children}
    </AppShell>
  );
}
