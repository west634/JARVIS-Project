import "server-only";
import { withTenant } from "@/lib/db";
import type { Role } from "@/generated/prisma/enums";
import type { SessionPayload } from "@/lib/auth/session";

export type Contact = {
  userId: string;
  name: string;
  role: Role;
  context: string | null;
};

/**
 * Who the current user is allowed to start a new conversation with —
 * mirrors lib/permissions.ts#canMessage (school-safe messaging, spec §21:
 * no student-student contact list, everyone else is scoped to real
 * relationships — a teacher's actual students and their guardians, a
 * parent's child's actual teachers — not the entire school directory).
 */
export async function getContactableUsers(schoolId: string, session: SessionPayload): Promise<Contact[]> {
  return withTenant(schoolId, async (tx) => {
    const contacts = new Map<string, Contact>();
    const addAdmins = async () => {
      const admins = await tx.adminProfile.findMany({ include: { user: true } });
      for (const a of admins) {
        if (a.userId === session.userId) continue;
        contacts.set(a.userId, { userId: a.userId, name: a.user.name, role: "ADMIN", context: null });
      }
    };

    if (session.role === "ADMIN") {
      const users = await tx.user.findMany({ orderBy: { name: "asc" } });
      for (const u of users) {
        if (u.id === session.userId) continue;
        contacts.set(u.id, { userId: u.id, name: u.name, role: u.role, context: null });
      }
      return Array.from(contacts.values());
    }

    if (session.role === "STUDENT") {
      const profile = await tx.studentProfile.findUniqueOrThrow({
        where: { userId: session.userId },
        include: {
          enrollments: {
            include: { courseSection: { include: { course: true, teacher: { include: { user: true } } } } },
          },
        },
      });
      for (const e of profile.enrollments) {
        const t = e.courseSection.teacher;
        contacts.set(t.userId, { userId: t.userId, name: t.user.name, role: "TEACHER", context: e.courseSection.course.name });
      }
      await addAdmins();
      return Array.from(contacts.values());
    }

    if (session.role === "TEACHER") {
      const profile = await tx.teacherProfile.findUniqueOrThrow({
        where: { userId: session.userId },
        include: {
          sectionsTaught: {
            include: {
              course: true,
              enrollments: {
                include: {
                  studentProfile: {
                    include: { user: true, guardianLinks: { include: { parentProfile: { include: { user: true } } } } },
                  },
                },
              },
            },
          },
        },
      });
      for (const s of profile.sectionsTaught) {
        for (const e of s.enrollments) {
          const student = e.studentProfile;
          contacts.set(student.userId, { userId: student.userId, name: student.user.name, role: "STUDENT", context: s.course.name });
          for (const link of student.guardianLinks) {
            const parent = link.parentProfile;
            contacts.set(parent.userId, {
              userId: parent.userId,
              name: parent.user.name,
              role: "PARENT",
              context: `${student.user.name}'s guardian`,
            });
          }
        }
      }
      await addAdmins();
      return Array.from(contacts.values());
    }

    if (session.role === "PARENT") {
      const profile = await tx.parentProfile.findUniqueOrThrow({
        where: { userId: session.userId },
        include: {
          guardianLinks: {
            include: {
              studentProfile: {
                include: {
                  enrollments: {
                    include: { courseSection: { include: { course: true, teacher: { include: { user: true } } } } },
                  },
                },
              },
            },
          },
        },
      });
      for (const link of profile.guardianLinks) {
        for (const e of link.studentProfile.enrollments) {
          const t = e.courseSection.teacher;
          contacts.set(t.userId, { userId: t.userId, name: t.user.name, role: "TEACHER", context: e.courseSection.course.name });
        }
      }
      await addAdmins();
      return Array.from(contacts.values());
    }

    return [];
  });
}
