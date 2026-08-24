"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession, roleHomePath } from "@/lib/auth/guards";
import { withTenant } from "@/lib/db";
import { canMessage } from "@/lib/permissions";
import { notifyUser } from "@/lib/notify";

export type MessageActionState = { error: string | null };

const createSchema = z.object({
  recipientUserIds: z.array(z.string().min(1)).min(1, "Choose at least one recipient."),
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(10000),
});

export async function createThreadAction(
  _prevState: MessageActionState,
  formData: FormData,
): Promise<MessageActionState> {
  const session = await requireSession();
  const parsed = createSchema.safeParse({
    recipientUserIds: formData.getAll("recipientUserIds").map(String),
    subject: formData.get("subject"),
    body: formData.get("body"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form for errors." };
  }
  const { recipientUserIds, subject, body } = parsed.data;

  let threadId = "";
  try {
    threadId = await withTenant(session.schoolId, async (tx) => {
      const recipients = await tx.user.findMany({ where: { id: { in: recipientUserIds }, schoolId: session.schoolId } });
      if (recipients.length !== recipientUserIds.length) {
        throw new Error("One of the selected recipients could not be found.");
      }
      for (const r of recipients) {
        if (!canMessage(session, { role: r.role, schoolId: session.schoolId })) {
          throw new Error(`You can't message ${r.name}.`);
        }
      }

      const thread = await tx.messageThread.create({
        data: { schoolId: session.schoolId, subject, createdById: session.userId },
      });
      await tx.messageThreadParticipant.create({
        data: { threadId: thread.id, userId: session.userId, lastReadAt: new Date() },
      });
      for (const r of recipients) {
        await tx.messageThreadParticipant.create({ data: { threadId: thread.id, userId: r.id } });
      }
      await tx.message.create({ data: { threadId: thread.id, senderId: session.userId, body } });

      for (const r of recipients) {
        await notifyUser(tx, r.id, {
          schoolId: session.schoolId,
          category: "MESSAGE",
          title: `New message: ${subject}`,
          body: `${session.name}: ${body.slice(0, 120)}`,
          linkUrl: `/${roleHomePath(r.role)}/messages/${thread.id}`,
        });
      }

      return thread.id;
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Couldn't send that message." };
  }

  revalidatePath("/", "layout");
  redirect(`/${roleHomePath(session.role)}/messages/${threadId}`);
}

const replySchema = z.object({
  threadId: z.string().min(1),
  body: z.string().min(1).max(10000),
});

export async function replyToThreadAction(
  _prevState: MessageActionState,
  formData: FormData,
): Promise<MessageActionState> {
  const session = await requireSession();
  const parsed = replySchema.safeParse({ threadId: formData.get("threadId"), body: formData.get("body") });
  if (!parsed.success) return { error: "Message can't be empty." };
  const { threadId, body } = parsed.data;

  try {
    await withTenant(session.schoolId, async (tx) => {
      const membership = await tx.messageThreadParticipant.findFirst({ where: { threadId, userId: session.userId } });
      if (!membership) throw new Error("You're not part of this conversation.");

      await tx.message.create({ data: { threadId, senderId: session.userId, body } });
      await tx.messageThreadParticipant.update({ where: { id: membership.id }, data: { lastReadAt: new Date() } });

      const others = await tx.messageThreadParticipant.findMany({
        where: { threadId, userId: { not: session.userId } },
        include: { user: true },
      });
      const thread = await tx.messageThread.findUniqueOrThrow({ where: { id: threadId } });

      for (const o of others) {
        await notifyUser(tx, o.userId, {
          schoolId: session.schoolId,
          category: "MESSAGE",
          title: `New message: ${thread.subject}`,
          body: `${session.name}: ${body.slice(0, 120)}`,
          linkUrl: `/${roleHomePath(o.user.role)}/messages/${threadId}`,
        });
      }
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Couldn't send that reply." };
  }

  revalidatePath("/", "layout");
  return { error: null };
}
