import { requireRole } from "@/lib/auth/guards";
import { getNotificationPreferences } from "@/lib/services/notifications";
import { NotificationPreferencesForm } from "@/components/notifications/NotificationPreferencesForm";

export default async function AdminNotificationPreferencesPage() {
  const session = await requireRole("ADMIN");
  const initial = await getNotificationPreferences(session.schoolId, session.userId);

  return (
    <div className="flex max-w-lg flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Notification preferences</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Choose what you hear about.</p>
      </div>
      <NotificationPreferencesForm initial={initial} />
    </div>
  );
}
