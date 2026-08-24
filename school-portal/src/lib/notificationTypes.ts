/**
 * Client-safe notification types/constants — deliberately has no
 * "server-only" import and no dependency on lib/db.ts, so Client
 * Components (the preferences form, the notification list) can import it
 * without pulling `pg`/Prisma into the browser bundle. Server code in
 * lib/services/notifications.ts re-exports from here.
 */
import type { NotificationCategory } from "@/generated/prisma/enums";

export const NOTIFICATION_CATEGORIES: NotificationCategory[] = [
  "ASSIGNMENT",
  "GRADE",
  "MESSAGE",
  "SCHEDULE",
  "ANNOUNCEMENT",
  "ATHLETICS",
  "EMERGENCY",
];

export type PreferenceState = Record<NotificationCategory, boolean>;

export type NotificationItem = {
  id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  linkUrl: string | null;
  isRead: boolean;
  createdAt: Date;
};
