import type { AssignmentStatus, Priority } from "@/lib/services/assignments";

const STATUS_STYLES: Record<AssignmentStatus, string> = {
  UPCOMING: "bg-zinc-100 text-zinc-700 dark:bg-white/10 dark:text-zinc-300",
  IN_PROGRESS: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  SUBMITTED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  LATE: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  MISSING: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  GRADED: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300",
  RETURNED: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
};

const STATUS_LABELS: Record<AssignmentStatus, string> = {
  UPCOMING: "Upcoming",
  IN_PROGRESS: "In progress",
  SUBMITTED: "Submitted",
  LATE: "Late",
  MISSING: "Missing",
  GRADED: "Graded",
  RETURNED: "Returned",
};

export function StatusBadge({ status }: { status: AssignmentStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

const PRIORITY_STYLES: Record<NonNullable<Priority>, string> = {
  HIGH: "bg-red-500",
  MEDIUM: "bg-amber-500",
  LOW: "bg-zinc-300 dark:bg-zinc-600",
};

export function PriorityDot({ priority }: { priority: Priority }) {
  if (!priority) return null;
  return (
    <span
      aria-label={`${priority.toLowerCase()} priority`}
      className={`inline-block h-2 w-2 shrink-0 rounded-full ${PRIORITY_STYLES[priority]}`}
    />
  );
}
