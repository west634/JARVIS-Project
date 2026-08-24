import type { ReactNode } from "react";
import { SidebarNav, type NavItem } from "@/components/nav/SidebarNav";
import { LogoutButton } from "@/components/nav/LogoutButton";

export function AppShell({
  navItems,
  userName,
  roleLabel,
  isDemo,
  children,
}: {
  navItems: NavItem[];
  userName: string;
  roleLabel: string;
  isDemo: boolean;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col md:flex-row">
      <aside className="flex shrink-0 flex-col gap-6 border-b border-black/8 px-4 py-5 md:w-56 md:border-r md:border-b-0 md:px-3 dark:border-white/10">
        <div className="px-2">
          <p className="text-lg font-semibold tracking-tight">School Portal</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{roleLabel}</p>
        </div>
        <SidebarNav items={navItems} />
        <div className="mt-auto hidden flex-col gap-2 px-2 md:flex">
          <p className="truncate text-sm font-medium">{userName}</p>
          <LogoutButton />
        </div>
      </aside>
      <div className="flex-1">
        {isDemo && (
          <div className="border-b border-amber-200 bg-amber-50 px-6 py-2 text-center text-xs font-medium text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
            Demo account — sample data for development purposes only.
          </div>
        )}
        <div className="flex items-center justify-between border-b border-black/8 px-6 py-3 md:hidden dark:border-white/10">
          <p className="text-sm font-medium">{userName}</p>
          <LogoutButton />
        </div>
        <main className="px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
