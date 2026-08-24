"use client";

import { useActionState, useRef, useState, useEffect } from "react";
import {
  submitAssignmentAction,
  saveDraftAction,
  type SubmissionActionState,
} from "@/lib/actions/submissionActions";
import type { SubmissionType } from "@/generated/prisma/enums";

const initialSubmissionState: SubmissionActionState = { error: null, success: false };

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function SubmissionForm({
  assignmentId,
  submissionType,
  dueLabel,
  assignmentTitle,
  initialText,
  initialLink,
}: {
  assignmentId: string;
  submissionType: SubmissionType;
  dueLabel: string;
  assignmentTitle: string;
  initialText: string;
  initialLink: string;
}) {
  const [submitState, submitAction, submitPending] = useActionState(submitAssignmentAction, initialSubmissionState);
  const [draftState, draftAction, draftPending] = useActionState(saveDraftAction, initialSubmissionState);

  const [text, setText] = useState(initialText);
  const [link, setLink] = useState(initialLink);
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (fileInputRef.current) {
      const dt = new DataTransfer();
      files.forEach((f) => dt.items.add(f));
      fileInputRef.current.files = dt.files;
    }
  }, [files]);

  function addFiles(list: FileList | null) {
    if (!list) return;
    setFiles((prev) => [...prev, ...Array.from(list)]);
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  const showLink = submissionType === "LINK" || submissionType === "MULTIPLE";
  const showText = submissionType === "TEXT" || submissionType === "MULTIPLE";
  const showFiles = submissionType === "FILE" || submissionType === "MULTIPLE";

  const hasContent = text.trim().length > 0 || link.trim().length > 0 || files.length > 0;

  if (submitState.success) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center dark:border-emerald-500/20 dark:bg-emerald-500/10">
        <p className="text-lg font-semibold text-emerald-800 dark:text-emerald-300">Submitted</p>
        <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-400">
          Your work for &ldquo;{assignmentTitle}&rdquo; was submitted successfully. Refresh this page any time to
          confirm — it will show as Submitted.
        </p>
      </div>
    );
  }

  return (
    <form action={submitAction} className="flex flex-col gap-5">
      <input type="hidden" name="assignmentId" value={assignmentId} />

      {showText && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="textContent" className="text-sm font-medium">
            Write your response
          </label>
          <textarea
            id="textContent"
            name="textContent"
            rows={8}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="rounded-xl border border-black/10 bg-white p-3.5 text-sm outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-white/5"
            placeholder="Type your answer here…"
          />
        </div>
      )}

      {showLink && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="linkUrl" className="text-sm font-medium">
            Paste a link
          </label>
          <input
            id="linkUrl"
            name="linkUrl"
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://docs.google.com/…"
            className="rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-white/5"
          />
        </div>
      )}

      {showFiles && (
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Files</span>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              addFiles(e.dataTransfer.files);
            }}
            onClick={() => document.getElementById("file-picker")?.click()}
            className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center text-sm transition ${
              dragActive
                ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10"
                : "border-black/15 text-zinc-500 dark:border-white/15 dark:text-zinc-400"
            }`}
          >
            Drag and drop files here, or click to choose
            <input
              id="file-picker"
              type="file"
              multiple
              className="hidden"
              onChange={(e) => addFiles(e.target.files)}
            />
          </div>
          <input ref={fileInputRef} type="file" name="files" multiple className="hidden" />

          {files.length > 0 && (
            <ul className="mt-1 flex flex-col gap-1.5">
              {files.map((f, i) => (
                <li key={`${f.name}-${i}`} className="flex items-center justify-between rounded-lg bg-black/5 px-3 py-1.5 text-sm dark:bg-white/10">
                  <span className="truncate">
                    {f.name} <span className="text-zinc-500">({formatBytes(f.size)})</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="text-zinc-500 hover:text-red-600 dark:hover:text-red-400"
                    aria-label={`Remove ${f.name}`}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {hasContent && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-500/20 dark:bg-indigo-500/10">
          <p className="mb-2 text-xs font-semibold tracking-wide text-indigo-700 uppercase dark:text-indigo-300">
            Ready to submit?
          </p>
          <p className="text-sm font-medium">{assignmentTitle}</p>
          {files.length > 0 && (
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
              {files.length} file{files.length === 1 ? "" : "s"}: {files.map((f) => f.name).join(", ")}
            </p>
          )}
          {link && <p className="mt-1 truncate text-sm text-zinc-600 dark:text-zinc-300">Link: {link}</p>}
          {text && <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">Written response included.</p>}
          <p className="mt-2 text-sm font-medium text-indigo-700 dark:text-indigo-300">Due {dueLabel}</p>
        </div>
      )}

      {(submitState.error || draftState.error) && (
        <p role="alert" className="text-sm font-medium text-red-600 dark:text-red-400">
          {submitState.error ?? draftState.error}
        </p>
      )}
      {draftState.success && !submitState.success && (
        <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Draft saved.</p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitPending || !hasContent}
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
        >
          {submitPending ? "Submitting…" : "Submit Assignment"}
        </button>
        <button
          type="submit"
          formAction={draftAction}
          disabled={draftPending || !hasContent}
          className="rounded-xl border border-black/10 px-5 py-2.5 text-sm font-semibold transition hover:bg-black/5 disabled:opacity-50 dark:border-white/10 dark:hover:bg-white/10"
        >
          {draftPending ? "Saving…" : "Save draft"}
        </button>
      </div>
    </form>
  );
}
