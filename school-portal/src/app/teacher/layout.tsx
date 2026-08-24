import type { ReactNode } from "react";
import { requireRole } from "@/lib/auth/guards";
import { getUnreadNotificationCount } from "@/lib/services/notifications";
import { AppShell } from "@/components/nav/AppShell";

const NAV_ITEMS = [
  { label: "Home", href: "/teacher" },
  { label: "Classes", href: "/teacher/classes" },
  { label: "Calendar", href: "/teacher/calendar" },
  { label: "Schedule", href: "/teacher/schedule" },
  { label: "Messages", href: "/teacher/messages" },
];

export default async function TeacherLayout({ children }: { children: ReactNode }) {
  const session = await requireRole("TEACHER");
  const unreadCount = await getUnreadNotificationCount(session.schoolId, session.userId);
  return (
    <AppShell
      navItems={NAV_ITEMS}
      userName={session.name}
      roleLabel="Teacher"
      isDemo={session.isDemo}
      notificationsHref="/teacher/notifications"
      unreadCount={unreadCount}
    >
      {children}
    </AppShell>
  );
}
