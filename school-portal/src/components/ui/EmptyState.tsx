export function EmptyState({ message }: { message: string }) {
  return (
    <p className="rounded-xl border border-dashed border-black/10 px-4 py-6 text-center text-sm text-zinc-500 dark:border-white/10 dark:text-zinc-400">
      {message}
    </p>
  );
}
