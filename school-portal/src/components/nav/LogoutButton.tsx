import { logoutAction } from "@/lib/auth/actions";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 transition hover:bg-black/5 dark:text-zinc-300 dark:hover:bg-white/10"
      >
        Sign out
      </button>
    </form>
  );
}
