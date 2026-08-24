import type { ReactNode } from "react";
import { requireRole } from "@/lib/auth/guards";
import { getUnreadNotificationCount } from "@/lib/services/notifications";
import { AppShell } from "@/components/nav/AppShell";

const NAV_ITEMS = [
  { label: "Home", href: "/student" },
  { label: "Classes", href: "/student/classes" },
  { label: "Assignments", href: "/student/assignments" },
  { label: "Grades", href: "/student/grades" },
  { label: "Calendar", href: "/student/calendar" },
  { label: "Schedule", href: "/student/schedule" },
  { label: "Messages", href: "/student/messages" },
];

export default async function StudentLayout({ children }: { children: ReactNode }) {
  const session = await requireRole("STUDENT");
  const unreadCount = await getUnreadNotificationCount(session.schoolId, session.userId);
  return (
    <AppShell
      navItems={NAV_ITEMS}
      userName={session.name}
      roleLabel="Student"
      isDemo={session.isDemo}
      notificationsHref="/student/notifications"
      unreadCount={unreadCount}
    >
      {children}
    </AppShell>
  );
}
