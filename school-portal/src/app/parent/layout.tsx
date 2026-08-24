import type { ReactNode } from "react";
import { requireRole } from "@/lib/auth/guards";
import { getUnreadNotificationCount } from "@/lib/services/notifications";
import { AppShell } from "@/components/nav/AppShell";

const NAV_ITEMS = [
  { label: "Home", href: "/parent" },
  { label: "Messages", href: "/parent/messages" },
];

export default async function ParentLayout({ children }: { children: ReactNode }) {
  const session = await requireRole("PARENT");
  const unreadCount = await getUnreadNotificationCount(session.schoolId, session.userId);
  return (
    <AppShell
      navItems={NAV_ITEMS}
      userName={session.name}
      roleLabel="Parent"
      isDemo={session.isDemo}
      notificationsHref="/parent/notifications"
      unreadCount={unreadCount}
    >
      {children}
    </AppShell>
  );
}
