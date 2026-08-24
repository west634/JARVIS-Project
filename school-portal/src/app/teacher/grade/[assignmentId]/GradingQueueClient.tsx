"use client";

import { useEffect, useState, useCallback, useTransition } from "react";
import Link from "next/link";
import { gradeSubmissionAction, undoGradeAction } from "@/lib/actions/gradingActions";
import type { GradingQueue } from "@/lib/services/gradebook";

export function GradingQueueClient({ queue, sectionId }: { queue: GradingQueue; sectionId: string }) {
  const [index, setIndex] = useState(0);
  const [scores, setScores] = useState<Record<string, string>>(() =>
    Object.fromEntries(queue.items.map((i) => [i.submissionId, i.currentScore?.toString() ?? ""])),
  );
  const [feedbacks, setFeedbacks] = useState<Record<string, string>>(() =>
    Object.fromEntries(queue.items.map((i) => [i.submissionId, i.currentFeedback])),
  );
  const [savedIds, setSavedIds] = useState<Set<string>>(
    () => new Set(queue.items.filter((i) => i.currentScore !== null).map((i) => i.submissionId)),
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const item = queue.items[index];

  const save = useCallback(
    async (submissionId: string) => {
      const raw = scores[submissionId];
      if (raw === "" || raw === undefined) return true;
      const score = Number(raw);
      if (Number.isNaN(score)) {
        setError("Enter a valid number for the score.");
        return false;
      }
      const result = await gradeSubmissionAction({ submissionId, score, feedback: feedbacks[submissionId] ?? "" });
      if (result.error) {
        setError(result.error);
        return false;
      }
      setSavedIds((prev) => new Set(prev).add(submissionId));
      setError(null);
      return true;
    },
    [scores, feedbacks],
  );

  const goTo = useCallback(
    (nextIndex: number) => {
      // Always save the current item first — even on the last submission
      // in the queue, where there's no valid nextIndex to move to.
      startTransition(async () => {
        if (item) await save(item.submissionId);
        if (nextIndex >= 0 && nextIndex < queue.items.length) {
          setIndex(nextIndex);
        }
      });
    },
    [item, save, startTransition, queue.items.length],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "TEXTAREA") return; // don't hijack typing in the comment box
      if (e.key === "ArrowRight" || e.key === "n") goTo(index + 1);
      if (e.key === "ArrowLeft" || e.key === "p") goTo(index - 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, goTo]);

  if (!item) {
    return <p className="text-sm text-zinc-500 dark:text-zinc-400">No submissions to grade yet.</p>;
  }

  const rubricTotal = queue.rubric?.criteria.reduce((sum, c) => sum + c.points, 0) ?? null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {index + 1} of {queue.items.length}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => goTo(index - 1)}
            disabled={index === 0 || isPending}
            className="rounded-lg border border-black/10 px-3 py-1.5 text-sm font-medium disabled:opacity-40 dark:border-white/10"
          >
            ← Previous
          </button>
          <button
            onClick={() => goTo(index + 1)}
            disabled={index === queue.items.length - 1 || isPending}
            className="rounded-lg border border-black/10 px-3 py-1.5 text-sm font-medium disabled:opacity-40 dark:border-white/10"
          >
            Next →
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-black/8 bg-white p-6 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{item.studentName}</h2>
          {item.isLate && (
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
              Late
            </span>
          )}
        </div>

        <div className="mb-5 flex flex-col gap-2 text-sm">
          {item.textContent && <p className="whitespace-pre-wrap rounded-lg bg-black/5 p-3 dark:bg-white/10">{item.textContent}</p>}
          {item.linkUrl && (
            <a href={item.linkUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline dark:text-indigo-400">
              {item.linkUrl}
            </a>
          )}
          {item.files.map((f) => (
            <a key={f.id} href={`/api/files/${f.id}`} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline dark:text-indigo-400">
              {f.fileName}
            </a>
          ))}
          {!item.textContent && !item.linkUrl && item.files.length === 0 && (
            <p className="text-zinc-500 dark:text-zinc-400">No submission content on file.</p>
          )}
        </div>

        {queue.rubric && queue.rubric.criteria.length > 0 && (
          <div className="mb-5 rounded-xl border border-black/8 p-3 dark:border-white/10">
            <p className="mb-2 text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">Rubric</p>
            <ul className="flex flex-col gap-1 text-sm">
              {queue.rubric.criteria.map((c) => (
                <li key={c.id} className="flex justify-between">
                  <span>{c.description}</span>
                  <span className="font-medium">{c.points} pts</span>
                </li>
              ))}
            </ul>
            {rubricTotal !== null && (
              <button
                type="button"
                onClick={() => setScores((prev) => ({ ...prev, [item.submissionId]: String(rubricTotal) }))}
                className="mt-2 text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
              >
                Use rubric total ({rubricTotal} pts)
              </button>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Score (of {queue.points})</label>
            <input
              type="number"
              min={0}
              max={queue.points}
              value={scores[item.submissionId] ?? ""}
              onChange={(e) => setScores((prev) => ({ ...prev, [item.submissionId]: e.target.value }))}
              className="w-28 rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-white/5"
            />
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <label className="text-sm font-medium">Comment</label>
            <textarea
              rows={2}
              value={feedbacks[item.submissionId] ?? ""}
              onChange={(e) => setFeedbacks((prev) => ({ ...prev, [item.submissionId]: e.target.value }))}
              className="rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-white/5"
            />
          </div>
        </div>

        {error && (
          <p role="alert" className="mt-3 text-sm font-medium text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        <div className="mt-5 flex items-center gap-3">
          <button
            onClick={() => goTo(index + 1)}
            disabled={isPending}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
          >
            {isPending ? "Saving…" : "Save & Next"}
          </button>
          {savedIds.has(item.submissionId) && (
            <button
              onClick={() =>
                startTransition(async () => {
                  const result = await undoGradeAction(item.submissionId);
                  if (result.error) setError(result.error);
                  else {
                    setScores((prev) => ({ ...prev, [item.submissionId]: "" }));
                    setSavedIds((prev) => {
                      const next = new Set(prev);
                      next.delete(item.submissionId);
                      return next;
                    });
                  }
                })
              }
              className="text-sm font-medium text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400"
            >
              Undo grade
            </button>
          )}
          <span className="text-xs text-zinc-400">Shortcuts: ← previous · → save &amp; next</span>
        </div>
      </div>

      <Link href={`/teacher/classes/${sectionId}?tab=gradebook`} className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">
        ← Back to gradebook
      </Link>
    </div>
  );
}
