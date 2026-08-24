import { requireRole } from "@/lib/auth/guards";
import { getNotifications } from "@/lib/services/notifications";
import { NotificationList } from "@/components/notifications/NotificationList";

export default async function StudentNotificationsPage() {
  const session = await requireRole("STUDENT");
  const notifications = await getNotifications(session.schoolId, session.userId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
      </div>
      <NotificationList notifications={notifications} preferencesHref="/student/notifications/preferences" />
    </div>
  );
}
