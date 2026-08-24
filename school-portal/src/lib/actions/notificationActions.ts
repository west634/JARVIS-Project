"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/guards";
import { withTenant } from "@/lib/db";
import { NOTIFICATION_CATEGORIES } from "@/lib/services/notifications";
import type { NotificationCategory } from "@/generated/prisma/enums";

export async function markNotificationReadAction(notificationId: string): Promise<void> {
  const session = await requireSession();
  await withTenant(session.schoolId, async (tx) => {
    // updateMany (not update) so this silently no-ops instead of throwing
    // if the notification belongs to someone else — never leak existence.
    await tx.notification.updateMany({
      where: { id: notificationId, userId: session.userId },
      data: { isRead: true },
    });
  });
  revalidatePath("/", "layout");
}

export async function markAllNotificationsReadAction(): Promise<void> {
  const session = await requireSession();
  await withTenant(session.schoolId, async (tx) => {
    await tx.notification.updateMany({
      where: { userId: session.userId, isRead: false },
      data: { isRead: true },
    });
  });
  revalidatePath("/", "layout");
}

export type PreferencesActionState = { error: string | null; success: boolean };

export async function updateNotificationPreferencesAction(
  _prevState: PreferencesActionState,
  formData: FormData,
): Promise<PreferencesActionState> {
  const session = await requireSession();

  try {
    await withTenant(session.schoolId, async (tx) => {
      for (const category of NOTIFICATION_CATEGORIES) {
        const enabled = formData.get(`category_${category}`) === "on";
        await tx.notificationPreference.upsert({
          where: { userId_category_channel: { userId: session.userId, category, channel: "IN_APP" } },
          update: { enabled },
          create: { userId: session.userId, category: category as NotificationCategory, channel: "IN_APP", enabled },
        });
      }
    });
  } catch {
    return { error: "Couldn't save your preferences. Try again.", success: false };
  }

  revalidatePath("/", "layout");
  return { error: null, success: true };
}
