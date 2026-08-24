"use client";

import { useActionState, useState } from "react";
import { createThreadAction, type MessageActionState } from "@/lib/actions/messagingActions";
import type { Contact } from "@/lib/services/contacts";

const initialState: MessageActionState = { error: null };

export function ComposeForm({ contacts }: { contacts: Contact[] }) {
  const [state, action, pending] = useActionState(createThreadAction, initialState);
  const [search, setSearch] = useState("");

  const filtered = contacts.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) || (c.context ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <form action={action} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="recipient-search" className="text-sm font-medium">
          To
        </label>
        <input
          id="recipient-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search contacts…"
          className="rounded-xl border border-black/10 px-3.5 py-2 text-sm outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-white/5"
        />
        <div className="max-h-56 overflow-y-auto rounded-xl border border-black/8 dark:border-white/10">
          {filtered.length === 0 ? (
            <p className="p-3 text-sm text-zinc-500 dark:text-zinc-400">No contacts match.</p>
          ) : (
            filtered.map((c) => (
              <label key={c.userId} className="flex items-center gap-3 border-b border-black/6 px-3 py-2 text-sm last:border-0 dark:border-white/8">
                <input type="checkbox" name="recipientUserIds" value={c.userId} className="h-4 w-4 accent-indigo-600" />
                <span>
                  <span className="font-medium">{c.name}</span>{" "}
                  <span className="text-zinc-500 dark:text-zinc-400">
                    · {c.role.charAt(0) + c.role.slice(1).toLowerCase()}
                    {c.context ? ` · ${c.context}` : ""}
                  </span>
                </span>
              </label>
            ))
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="subject" className="text-sm font-medium">
          Subject
        </label>
        <input
          id="subject"
          name="subject"
          required
          className="rounded-xl border border-black/10 px-3.5 py-2 text-sm outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-white/5"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="body" className="text-sm font-medium">
          Message
        </label>
        <textarea
          id="body"
          name="body"
          rows={6}
          required
          className="rounded-xl border border-black/10 p-3.5 text-sm outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-white/5"
        />
      </div>

      {state.error && (
        <p role="alert" className="text-sm font-medium text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
      >
        {pending ? "Sending…" : "Send"}
      </button>
    </form>
  );
}
