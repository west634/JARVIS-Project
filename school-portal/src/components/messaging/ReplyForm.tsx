"use client";

import { useActionState, useRef } from "react";
import { replyToThreadAction, type MessageActionState } from "@/lib/actions/messagingActions";

const initialState: MessageActionState = { error: null };

export function ReplyForm({ threadId }: { threadId: string }) {
  const [state, action, pending] = useActionState(replyToThreadAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={(formData) => {
        action(formData);
        formRef.current?.reset();
      }}
      className="flex flex-col gap-2"
    >
      <input type="hidden" name="threadId" value={threadId} />
      <textarea
        name="body"
        rows={3}
        required
        placeholder="Write a reply…"
        className="rounded-xl border border-black/10 p-3 text-sm outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-white/5"
      />
      {state.error && (
        <p role="alert" className="text-sm font-medium text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
      >
        {pending ? "Sending…" : "Reply"}
      </button>
    </form>
  );
}
