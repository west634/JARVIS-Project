import type { ReactNode } from "react";
import { requireRole } from "@/lib/auth/guards";
import { getUnreadNotificationCount } from "@/lib/services/notifications";
import { AppShell } from "@/components/nav/AppShell";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin" },
  { label: "Messages", href: "/admin/messages" },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await requireRole("ADMIN");
  const unreadCount = await getUnreadNotificationCount(session.schoolId, session.userId);
  return (
    <AppShell
      navItems={NAV_ITEMS}
      userName={session.name}
      roleLabel="Administrator"
      isDemo={session.isDemo}
      notificationsHref="/admin/notifications"
      unreadCount={unreadCount}
    >
      {children}
    </AppShell>
  );
}
