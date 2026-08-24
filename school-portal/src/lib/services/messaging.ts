import "server-only";
import { withTenant } from "@/lib/db";
import { withNotFoundOn404 } from "@/lib/notFound";

export type ThreadSummary = {
  id: string;
  subject: string;
  participants: string[]; // other participants' names
  lastMessage: { body: string; senderName: string; sentAt: Date } | null;
  isUnread: boolean;
};

export async function listThreads(schoolId: string, userId: string): Promise<ThreadSummary[]> {
  return withTenant(schoolId, async (tx) => {
    const memberships = await tx.messageThreadParticipant.findMany({
      where: { userId },
      include: {
        thread: {
          include: {
            participants: { include: { user: true } },
            messages: { orderBy: { sentAt: "desc" }, take: 1, include: { sender: true } },
          },
        },
      },
    });

    const summaries = memberships.map((m): ThreadSummary => {
      const last = m.thread.messages[0] ?? null;
      const isUnread = Boolean(last && last.senderId !== userId && (!m.lastReadAt || last.sentAt > m.lastReadAt));
      return {
        id: m.thread.id,
        subject: m.thread.subject,
        participants: m.thread.participants.filter((p) => p.userId !== userId).map((p) => p.user.name),
        lastMessage: last ? { body: last.body, senderName: last.sender.name, sentAt: last.sentAt } : null,
        isUnread,
      };
    });

    return summaries.sort((a, b) => {
      const at = a.lastMessage?.sentAt.getTime() ?? 0;
      const bt = b.lastMessage?.sentAt.getTime() ?? 0;
      return bt - at;
    });
  });
}

export type ThreadDetail = {
  id: string;
  subject: string;
  participants: { userId: string; name: string }[];
  messages: { id: string; body: string; senderId: string; senderName: string; sentAt: Date }[];
};

/** Also marks the thread read for this user (viewing IS reading, for messaging). */
export async function getThreadDetail(schoolId: string, userId: string, threadId: string): Promise<ThreadDetail> {
  return withNotFoundOn404(() =>
    withTenant(schoolId, async (tx) => {
      const membership = await tx.messageThreadParticipant.findFirstOrThrow({
        where: { threadId, userId },
      });

      const thread = await tx.messageThread.findUniqueOrThrow({
        where: { id: threadId },
        include: {
          participants: { include: { user: true } },
          messages: { orderBy: { sentAt: "asc" }, include: { sender: true } },
        },
      });

      await tx.messageThreadParticipant.update({
        where: { id: membership.id },
        data: { lastReadAt: new Date() },
      });

      return {
        id: thread.id,
        subject: thread.subject,
        participants: thread.participants.map((p) => ({ userId: p.userId, name: p.user.name })),
        messages: thread.messages.map((m) => ({
          id: m.id,
          body: m.body,
          senderId: m.senderId,
          senderName: m.sender.name,
          sentAt: m.sentAt,
        })),
      };
    }),
  );
}
