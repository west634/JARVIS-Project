import "server-only";
import { withTenant } from "@/lib/db";
import type { NotificationChannel } from "@/generated/prisma/enums";
import { NOTIFICATION_CATEGORIES, type NotificationItem, type PreferenceState } from "@/lib/notificationTypes";

export async function getNotifications(schoolId: string, userId: string, limit = 50): Promise<NotificationItem[]> {
  return withTenant(schoolId, (tx) =>
    tx.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
  );
}

export async function getUnreadNotificationCount(schoolId: string, userId: string): Promise<number> {
  return withTenant(schoolId, (tx) => tx.notification.count({ where: { userId, isRead: false } }));
}

/** IN_APP preference per category for the current user — true unless explicitly disabled. */
export async function getNotificationPreferences(schoolId: string, userId: string): Promise<PreferenceState> {
  const rows = await withTenant(schoolId, (tx) =>
    tx.notificationPreference.findMany({ where: { userId, channel: "IN_APP" } }),
  );
  const overrides = new Map(rows.map((r) => [r.category, r.enabled]));
  const state = {} as PreferenceState;
  for (const category of NOTIFICATION_CATEGORIES) {
    state[category] = overrides.get(category) ?? true;
  }
  return state;
}

export { NOTIFICATION_CATEGORIES };
export type { NotificationChannel, NotificationItem, PreferenceState };
