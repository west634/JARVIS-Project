import "server-only";
import type { PrismaClient } from "@/generated/prisma/client";
import type { NotificationCategory } from "@/generated/prisma/enums";

type Tx = Pick<PrismaClient, "notificationPreference" | "notification">;

export type NotifyInput = {
  schoolId: string;
  category: NotificationCategory;
  title: string;
  body: string;
  linkUrl?: string;
};

/**
 * Writes one Notification row for `userId`, honoring their IN_APP
 * preference for this category (defaulting to enabled — a school should
 * never silently swallow a grade or assignment notice just because a
 * preference row was never created). Must be called with the `tx` of an
 * already-open tenant transaction; never opens its own.
 */
export async function notifyUser(tx: Tx, userId: string, input: NotifyInput): Promise<void> {
  const pref = await tx.notificationPreference.findUnique({
    where: { userId_category_channel: { userId, category: input.category, channel: "IN_APP" } },
  });
  if (pref && !pref.enabled) return;

  await tx.notification.create({
    data: {
      schoolId: input.schoolId,
      userId,
      category: input.category,
      title: input.title,
      body: input.body,
      linkUrl: input.linkUrl,
    },
  });
}

/** Sequential by design — see ARCHITECTURE.md on why tenant transactions never run concurrent queries. */
export async function notifyUsers(tx: Tx, userIds: readonly string[], input: NotifyInput): Promise<void> {
  for (const userId of userIds) {
    await notifyUser(tx, userId, input);
  }
}
