import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

function daysFromNow(days: number, hour = 23, minute = 59): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d;
}

async function main() {
  const passwordHash = await bcrypt.hash("demo1234", 12);

  console.log("Seeding School Portal demo data…");

  const school = await db.school.upsert({
    where: { slug: "bright-river-academy" },
    update: {},
    create: { name: "Bright River Academy", slug: "bright-river-academy", timezone: "America/New_York" },
  });

  // RLS requires app.current_school_id to be set for every mutation below.
  await db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.current_school_id', ${school.id}, true)`;

    const academicYear = await tx.academicYear.create({
      data: {
        schoolId: school.id,
        name: "2026–2027",
        startDate: daysFromNow(-40, 0, 0),
        endDate: daysFromNow(230, 0, 0),
        isCurrent: true,
      },
    });

    const term = await tx.term.create({
      data: {
        schoolId: school.id,
        academicYearId: academicYear.id,
        name: "Fall 2026",
        startDate: daysFromNow(-40, 0, 0),
        endDate: daysFromNow(90, 0, 0),
      },
    });

    // Sequential: every create here shares one transaction/connection.
    const scienceDept = await tx.department.create({ data: { schoolId: school.id, name: "Science" } });
    const mathDept = await tx.department.create({ data: { schoolId: school.id, name: "Mathematics" } });
    const englishDept = await tx.department.create({ data: { schoolId: school.id, name: "English" } });
    const historyDept = await tx.department.create({ data: { schoolId: school.id, name: "History" } });

    // ── Teachers ──────────────────────────────────────────────────────
    async function createTeacher(name: string, email: string, departmentId: string, isDemo = false) {
      const user = await tx.user.create({
        data: { schoolId: school.id, name, email, passwordHash, role: "TEACHER", isDemo },
      });
      const profile = await tx.teacherProfile.create({
        data: { schoolId: school.id, userId: user.id, departmentId, title: "Teacher" },
      });
      return { user, profile };
    }

    const smith = await createTeacher("Dr. Amara Smith", "teacher@example.com", scienceDept.id, true);
    const ortiz = await createTeacher("James Ortiz", "j.ortiz@brightriver.edu", mathDept.id);
    const farah = await createTeacher("Elena Farah", "e.farah@brightriver.edu", englishDept.id);
    const reyes = await createTeacher("Tomás Reyes", "t.reyes@brightriver.edu", historyDept.id);

    // ── Admin ────────────────────────────────────────────────────────
    const adminUser = await tx.user.create({
      data: {
        schoolId: school.id,
        name: "Priya Desai",
        email: "admin@example.com",
        passwordHash,
        role: "ADMIN",
        isDemo: true,
      },
    });
    await tx.adminProfile.create({
      data: { schoolId: school.id, userId: adminUser.id, title: "Head of School" },
    });

    // ── Students ─────────────────────────────────────────────────────
    const studentDefs = [
      { name: "Weston Cole", email: "student@example.com", isDemo: true, studentNumber: "S1001" },
      { name: "Maya Chen", email: "m.chen@brightriver.edu", isDemo: false, studentNumber: "S1002" },
      { name: "Liam Patel", email: "l.patel@brightriver.edu", isDemo: false, studentNumber: "S1003" },
      { name: "Sofia Nguyen", email: "s.nguyen@brightriver.edu", isDemo: false, studentNumber: "S1004" },
      { name: "Noah Williams", email: "n.williams@brightriver.edu", isDemo: false, studentNumber: "S1005" },
      { name: "Ava Johnson", email: "a.johnson@brightriver.edu", isDemo: false, studentNumber: "S1006" },
    ];

    type StudentRecord = {
      user: Awaited<ReturnType<typeof tx.user.create>>;
      profile: Awaited<ReturnType<typeof tx.studentProfile.create>>;
    };
    const students: StudentRecord[] = [];
    for (const s of studentDefs) {
      const user = await tx.user.create({
        data: { schoolId: school.id, name: s.name, email: s.email, passwordHash, role: "STUDENT", isDemo: s.isDemo },
      });
      const profile = await tx.studentProfile.create({
        data: {
          schoolId: school.id,
          userId: user.id,
          studentNumber: s.studentNumber,
          gradeLevel: 9,
          homeroom: "9A",
        },
      });
      students.push({ user, profile });
    }
    // Weston, Maya, and Noah are referenced by name below; Liam, Sofia, and
    // Ava are addressed by index inside the assignment helper functions.
    const [weston, maya, , , noah] = students;

    // ── Parent, linked to two children (Weston + Maya) ──────────────
    const parentUser = await tx.user.create({
      data: {
        schoolId: school.id,
        name: "Danielle Cole",
        email: "parent@example.com",
        passwordHash,
        role: "PARENT",
        isDemo: true,
      },
    });
    const parentProfile = await tx.parentProfile.create({
      data: { schoolId: school.id, userId: parentUser.id },
    });
    await tx.guardianLink.create({
      data: { parentProfileId: parentProfile.id, studentProfileId: weston.profile.id, relationship: "Mother", isPrimary: true },
    });
    await tx.guardianLink.create({
      data: { parentProfileId: parentProfile.id, studentProfileId: maya.profile.id, relationship: "Mother", isPrimary: true },
    });

    // ── Courses & sections ───────────────────────────────────────────
    async function createSection(
      courseName: string,
      code: string,
      departmentId: string,
      teacherProfileId: string,
      sectionName: string,
      room: string,
      startMinute: number,
    ) {
      const course = await tx.course.create({
        data: { schoolId: school.id, departmentId, name: courseName, code },
      });
      const section = await tx.courseSection.create({
        data: {
          schoolId: school.id,
          courseId: course.id,
          termId: term.id,
          teacherProfileId,
          sectionName,
          room,
        },
      });
      for (const dayOfWeek of [1, 2, 3, 4, 5]) {
        await tx.scheduleBlock.create({
          data: {
            schoolId: school.id,
            courseSectionId: section.id,
            dayOfWeek,
            startMinute,
            endMinute: startMinute + 50,
          },
        });
      }
      const homeworkCategory = await tx.assignmentCategory.create({
        data: { schoolId: school.id, courseSectionId: section.id, name: "Homework", weight: 30 },
      });
      const testsCategory = await tx.assignmentCategory.create({
        data: { schoolId: school.id, courseSectionId: section.id, name: "Tests", weight: 40 },
      });
      const projectsCategory = await tx.assignmentCategory.create({
        data: { schoolId: school.id, courseSectionId: section.id, name: "Projects", weight: 30 },
      });
      const categories = [homeworkCategory, testsCategory, projectsCategory];
      for (const student of students) {
        await tx.enrollment.create({
          data: { schoolId: school.id, studentProfileId: student.profile.id, courseSectionId: section.id },
        });
      }
      return { course, section, categories: { homework: categories[0], tests: categories[1], projects: categories[2] } };
    }

    const biology = await createSection("Biology 9", "SCI101", scienceDept.id, smith.profile.id, "Section A", "Lab 2", 9 * 60);
    const algebra = await createSection("Algebra I", "MATH101", mathDept.id, ortiz.profile.id, "Section A", "204", 10 * 60);
    const english = await createSection("English 9", "ENG101", englishDept.id, farah.profile.id, "Section A", "110", 8 * 60);
    const history = await createSection("World History", "HIST101", historyDept.id, reyes.profile.id, "Section A", "118", 11 * 60 + 45);

    // ── Assignments + submissions + grades ──────────────────────────
    // gradeFor: deterministic pseudo-variety per student index, 78-98%.
    const gradeFor = (index: number, base = 88) => Math.min(99, Math.max(70, base + ((index * 7) % 15) - 7));

    async function pastGraded(
      section: typeof biology,
      title: string,
      dueDaysAgo: number,
      points: number,
      categoryId: string,
      gradedBy: string,
    ) {
      const assignment = await tx.assignment.create({
        data: {
          schoolId: school.id,
          courseSectionId: section.section.id,
          categoryId,
          title,
          description: `${title} for ${section.course.name}.`,
          instructions: "Complete and submit before the due date.",
          points,
          submissionType: "FILE",
          dueDate: daysFromNow(-dueDaysAgo),
          assignedDate: daysFromNow(-dueDaysAgo - 7),
          estimatedMinutes: 45,
        },
      });
      for (let i = 0; i < students.length; i++) {
        const student = students[i];
        const submittedAt = daysFromNow(-dueDaysAgo - 1);
        const submission = await tx.submission.create({
          data: {
            schoolId: school.id,
            assignmentId: assignment.id,
            studentProfileId: student.profile.id,
            submittedAt,
          },
        });
        const score = Math.round((gradeFor(i) / 100) * points);
        await tx.grade.create({
          data: {
            schoolId: school.id,
            submissionId: submission.id,
            score,
            feedback: score / points >= 0.9 ? "Excellent work." : "Good effort — see comments in class.",
            gradedById: gradedBy,
          },
        });
      }
      return assignment;
    }

    async function dueSoon(
      section: typeof biology,
      title: string,
      dueInDays: number,
      points: number,
      categoryId: string,
      estimatedMinutes: number,
      submissionType: "FILE" | "TEXT" | "LINK" | "MULTIPLE" = "FILE",
    ) {
      return tx.assignment.create({
        data: {
          schoolId: school.id,
          courseSectionId: section.section.id,
          categoryId,
          title,
          description: `${title} for ${section.course.name}.`,
          instructions: "Complete and submit before the due date.",
          points,
          submissionType,
          dueDate: daysFromNow(dueInDays, dueInDays === 0 ? 23 : 23, 59),
          assignedDate: daysFromNow(-3),
          estimatedMinutes,
        },
      });
    }

    // Overdue-with-mixed-submission assignment: everyone submits except a
    // configurable "missing" list, so dashboards show real missing work.
    async function overdueMixed(
      section: typeof biology,
      title: string,
      dueDaysAgo: number,
      points: number,
      categoryId: string,
      gradedBy: string,
      missingStudentIndexes: number[],
    ) {
      const assignment = await tx.assignment.create({
        data: {
          schoolId: school.id,
          courseSectionId: section.section.id,
          categoryId,
          title,
          description: `${title} for ${section.course.name}.`,
          instructions: "Complete and submit before the due date.",
          points,
          submissionType: "FILE",
          dueDate: daysFromNow(-dueDaysAgo),
          assignedDate: daysFromNow(-dueDaysAgo - 5),
          estimatedMinutes: 60,
        },
      });
      for (let i = 0; i < students.length; i++) {
        if (missingStudentIndexes.includes(i)) continue; // left as MISSING
        const student = students[i];
        const submittedAt = daysFromNow(-dueDaysAgo - 1);
        const submission = await tx.submission.create({
          data: {
            schoolId: school.id,
            assignmentId: assignment.id,
            studentProfileId: student.profile.id,
            submittedAt,
          },
        });
        const score = Math.round((gradeFor(i) / 100) * points);
        await tx.grade.create({
          data: { schoolId: school.id, submissionId: submission.id, score, feedback: "Graded.", gradedById: gradedBy },
        });
      }
      return assignment;
    }

    // Overdue assignment where non-missing students submitted but the
    // teacher hasn't graded it yet — populates "waiting to be graded".
    async function overdueUngraded(
      section: typeof biology,
      title: string,
      dueDaysAgo: number,
      points: number,
      categoryId: string,
      missingStudentIndexes: number[],
    ) {
      const assignment = await tx.assignment.create({
        data: {
          schoolId: school.id,
          courseSectionId: section.section.id,
          categoryId,
          title,
          description: `${title} for ${section.course.name}.`,
          instructions: "Complete and submit before the due date.",
          points,
          submissionType: "FILE",
          dueDate: daysFromNow(-dueDaysAgo),
          assignedDate: daysFromNow(-dueDaysAgo - 5),
          estimatedMinutes: 45,
        },
      });
      for (let i = 0; i < students.length; i++) {
        if (missingStudentIndexes.includes(i)) continue; // left as MISSING
        await tx.submission.create({
          data: {
            schoolId: school.id,
            assignmentId: assignment.id,
            studentProfileId: students[i].profile.id,
            submittedAt: daysFromNow(-dueDaysAgo - 1),
          },
        });
      }
      return assignment;
    }

    // index map: 0 weston, 1 maya, 2 liam, 3 sofia, 4 noah, 5 ava
    await pastGraded(biology, "Cell Structure Quiz", 10, 50, biology.categories.tests.id, smith.user.id);
    const labReport = await dueSoon(biology, "Lab Report: Photosynthesis", 0, 100, biology.categories.homework.id, 90);
    const ecosystemProject = await overdueMixed(biology, "Ecosystem Project", 2, 100, biology.categories.projects.id, smith.user.id, [0, 2]);

    const labReportRubric = await tx.rubric.create({ data: { assignmentId: labReport.id, title: "Lab Report Rubric" } });
    await tx.rubricCriterion.create({ data: { rubricId: labReportRubric.id, description: "Hypothesis clearly stated", points: 15 } });
    await tx.rubricCriterion.create({ data: { rubricId: labReportRubric.id, description: "Procedure accurately described", points: 25 } });
    await tx.rubricCriterion.create({ data: { rubricId: labReportRubric.id, description: "Data recorded and graphed correctly", points: 35 } });
    await tx.rubricCriterion.create({ data: { rubricId: labReportRubric.id, description: "Conclusion supported by data", points: 25 } });

    const ecosystemRubric = await tx.rubric.create({ data: { assignmentId: ecosystemProject.id, title: "Ecosystem Project Rubric" } });
    await tx.rubricCriterion.create({ data: { rubricId: ecosystemRubric.id, description: "Food web accuracy", points: 40 } });
    await tx.rubricCriterion.create({ data: { rubricId: ecosystemRubric.id, description: "Written explanation", points: 30 } });
    await tx.rubricCriterion.create({ data: { rubricId: ecosystemRubric.id, description: "Presentation quality", points: 30 } });
    await overdueMixed(biology, "Microscope Lab Write-up", 6, 40, biology.categories.homework.id, smith.user.id, [2]);
    await overdueUngraded(biology, "Diagram Homework", 4, 20, biology.categories.homework.id, [2, 5]);
    await dueSoon(biology, "Genetics Homework", 1, 20, biology.categories.homework.id, 30, "TEXT");

    await pastGraded(algebra, "Chapter 3 Test", 5, 100, algebra.categories.tests.id, ortiz.user.id);
    await dueSoon(algebra, "Problem Set 7", 1, 20, algebra.categories.homework.id, 40, "MULTIPLE");
    await overdueMixed(algebra, "Problem Set 6", 3, 20, algebra.categories.homework.id, ortiz.user.id, [0, 2, 4]);

    await pastGraded(english, "Grammar Quiz", 6, 30, english.categories.tests.id, farah.user.id);
    await overdueMixed(english, "Essay: Personal Narrative", 2, 100, english.categories.projects.id, farah.user.id, [0, 2]);
    await dueSoon(english, "Vocabulary Homework", 2, 15, english.categories.homework.id, 20, "LINK");

    await overdueMixed(history, "Reading Response: Chapter 4", 1, 25, history.categories.homework.id, reyes.user.id, [0, 2]);
    await dueSoon(history, "Map Quiz", 4, 40, history.categories.tests.id, 30);

    // ── Attendance (last 15 school days, mostly present) ────────────
    for (let d = 1; d <= 15; d++) {
      const date = daysFromNow(-d, 0, 0);
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      for (let i = 0; i < students.length; i++) {
        // Liam (index 2) has a rougher attendance record; everyone else is
        // essentially present, matching the "excellent/good/needs attention"
        // banding in getParentDashboard.
        const status = i === 2 && d % 4 === 0 ? "ABSENT" : i === 2 && d % 3 === 0 ? "TARDY" : "PRESENT";
        await tx.attendance.create({
          data: {
            schoolId: school.id,
            studentProfileId: students[i].profile.id,
            date,
            status,
          },
        });
      }
    }

    // ── Announcements ────────────────────────────────────────────────
    const welcomeAnnouncement = await tx.announcement.create({
      data: {
        schoolId: school.id,
        authorId: adminUser.id,
        title: "Welcome back to Bright River Academy",
        body: "We're excited to kick off the Fall 2026 term. Please review your class schedules and reach out with any questions.",
        publishAt: daysFromNow(-3),
      },
    });
    await tx.announcementAudience.create({
      data: { announcementId: welcomeAnnouncement.id, audienceType: "SCHOOL" },
    });

    const pictureDayAnnouncement = await tx.announcement.create({
      data: {
        schoolId: school.id,
        authorId: adminUser.id,
        title: "Picture Day is next Thursday",
        body: "Bring your best smile — order forms went home with students today.",
        publishAt: daysFromNow(-1),
      },
    });
    await tx.announcementAudience.create({
      data: { announcementId: pictureDayAnnouncement.id, audienceType: "SCHOOL" },
    });

    // ── Calendar events ──────────────────────────────────────────────
    await tx.calendarEvent.create({
      data: {
        schoolId: school.id,
        title: "Biology Unit Test",
        category: "TEST",
        startAt: daysFromNow(6, 9, 0),
        endAt: daysFromNow(6, 9, 50),
        courseSectionId: biology.section.id,
      },
    });
    await tx.calendarEvent.create({
      data: {
        schoolId: school.id,
        title: "Fall Sports Kickoff",
        category: "ATHLETICS",
        startAt: daysFromNow(4, 16, 0),
        endAt: daysFromNow(4, 18, 0),
        location: "Main Field",
        allDay: false,
      },
    });
    await tx.calendarEvent.create({
      data: {
        schoolId: school.id,
        title: "Labor Day — No School",
        category: "HOLIDAY",
        startAt: daysFromNow(-25, 0, 0),
        endAt: daysFromNow(-25, 23, 59),
        allDay: true,
      },
    });

    // ── Activities / athletics ───────────────────────────────────────
    const soccer = await tx.activity.create({
      data: { schoolId: school.id, name: "Varsity Soccer", kind: "ATHLETIC", description: "Fall varsity soccer team." },
    });
    const soccerTeam = await tx.team.create({
      data: { schoolId: school.id, activityId: soccer.id, name: "Varsity Soccer", season: "Fall 2026", coachTeacherProfileId: ortiz.profile.id },
    });
    await tx.teamMembership.create({ data: { teamId: soccerTeam.id, studentProfileId: weston.profile.id, role: "Captain" } });
    await tx.teamMembership.create({ data: { teamId: soccerTeam.id, studentProfileId: noah.profile.id, role: "Member" } });

    // ── Resources ────────────────────────────────────────────────────
    await tx.resource.create({
      data: { schoolId: school.id, courseSectionId: biology.section.id, title: "Unit 1 Slides", url: "https://example.com/bio-unit1", kind: "link" },
    });
    await tx.resource.create({
      data: { schoolId: school.id, courseSectionId: biology.section.id, title: "Lab Safety Guide", url: "https://example.com/lab-safety", kind: "link" },
    });
    await tx.resource.create({
      data: { schoolId: school.id, courseSectionId: algebra.section.id, title: "Chapter 3 Study Guide", url: "https://example.com/algebra-ch3", kind: "link" },
    });
    await tx.resource.create({
      data: { schoolId: school.id, courseSectionId: english.section.id, title: "Narrative Essay Outline Template", url: "https://example.com/narrative-outline", kind: "link" },
    });

    // ── Class-level announcement (exercises COURSE_SECTION audience) ──
    const labReminder = await tx.announcement.create({
      data: {
        schoolId: school.id,
        authorId: smith.user.id,
        title: "Lab Report due today",
        body: "Reminder: the Photosynthesis lab report is due by 11:59 PM tonight. Office hours are open until 4pm if you have questions.",
        publishAt: daysFromNow(0),
      },
    });
    await tx.announcementAudience.create({
      data: { announcementId: labReminder.id, audienceType: "COURSE_SECTION", courseSectionId: biology.section.id },
    });

    console.log("Seed complete.");
    console.log("Demo logins (password: demo1234):");
    console.log("  student@example.com  (Weston Cole)");
    console.log("  teacher@example.com  (Dr. Amara Smith)");
    console.log("  parent@example.com   (Danielle Cole)");
    console.log("  admin@example.com    (Priya Desai)");
  });
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
