import Link from "next/link";
import { requireRole } from "@/lib/auth/guards";
import { getAssignmentDetailForStudent } from "@/lib/services/assignmentDetail";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatusBadge, PriorityDot } from "@/components/ui/Badge";
import { formatDueDate } from "@/lib/format";
import { SubmissionForm } from "./SubmissionForm";

export default async function StudentAssignmentPage({
  params,
}: PageProps<"/student/assignments/[assignmentId]">) {
  const { assignmentId } = await params;
  const session = await requireRole("STUDENT");
  const assignment = await getAssignmentDetailForStudent(session.schoolId, session.userId, assignmentId);

  const canEdit = !assignment.grade;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href={`/student/classes/${assignment.courseSectionId}`}
          className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
        >
          ← {assignment.courseName}
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{assignment.title}</h1>
          <PriorityDot priority={assignment.priority} />
          <StatusBadge status={assignment.status} />
        </div>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {assignment.teacherName} · Due {formatDueDate(assignment.dueDate)} · {assignment.points} points
          {assignment.estimatedMinutes ? ` · ~${assignment.estimatedMinutes} min` : ""}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader title="Description" />
            <p className="whitespace-pre-wrap text-sm">{assignment.description || "No description provided."}</p>
            {assignment.instructions && (
              <>
                <h3 className="mt-4 mb-1 text-sm font-semibold">Instructions</h3>
                <p className="whitespace-pre-wrap text-sm">{assignment.instructions}</p>
              </>
            )}
            {assignment.attachments.length > 0 && (
              <>
                <h3 className="mt-4 mb-1 text-sm font-semibold">Attachments</h3>
                <ul className="flex flex-col gap-1">
                  {assignment.attachments.map((a) => (
                    <li key={a.id}>
                      <a href={a.url} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 hover:underline dark:text-indigo-400">
                        {a.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Card>

          {assignment.rubric && (
            <Card>
              <CardHeader title="Rubric" subtitle={assignment.rubric.title} />
              <ul className="divide-y divide-black/6 dark:divide-white/8">
                {assignment.rubric.criteria.map((c) => (
                  <li key={c.id} className="flex items-center justify-between py-2">
                    <span className="text-sm">{c.description}</span>
                    <span className="text-sm font-medium">{c.points} pts</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card>
            <CardHeader title={canEdit ? "Submit your work" : "Your submission"} />
            {canEdit ? (
              <SubmissionForm
                assignmentId={assignment.id}
                submissionType={assignment.submissionType}
                dueLabel={formatDueDate(assignment.dueDate)}
                assignmentTitle={assignment.title}
                initialText={assignment.submission?.textContent ?? ""}
                initialLink={assignment.submission?.linkUrl ?? ""}
              />
            ) : (
              <div className="flex flex-col gap-2 text-sm">
                {assignment.submission?.textContent && (
                  <p className="whitespace-pre-wrap rounded-lg bg-black/5 p-3 dark:bg-white/10">
                    {assignment.submission.textContent}
                  </p>
                )}
                {assignment.submission?.linkUrl && (
                  <a href={assignment.submission.linkUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline dark:text-indigo-400">
                    {assignment.submission.linkUrl}
                  </a>
                )}
                {assignment.submission?.files.map((f) => (
                  <a key={f.id} href={`/api/files/${f.id}`} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline dark:text-indigo-400">
                    {f.fileName}
                  </a>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          {assignment.grade && (
            <Card>
              <CardHeader title="Grade" />
              <p className="text-3xl font-semibold">
                {assignment.grade.score}/{assignment.points}
              </p>
              {assignment.grade.feedback && (
                <p className="mt-3 rounded-lg bg-black/5 p-3 text-sm dark:bg-white/10">{assignment.grade.feedback}</p>
              )}
            </Card>
          )}
          <Card>
            <CardHeader title="Details" />
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-zinc-500 dark:text-zinc-400">Assigned</dt>
                <dd>{formatDueDate(assignment.assignedDate)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500 dark:text-zinc-400">Due</dt>
                <dd>{formatDueDate(assignment.dueDate)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500 dark:text-zinc-400">Points</dt>
                <dd>{assignment.points}</dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}
