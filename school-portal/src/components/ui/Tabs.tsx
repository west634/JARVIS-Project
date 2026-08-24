import Link from "next/link";

export function Tabs({
  basePath,
  active,
  tabs,
}: {
  basePath: string;
  active: string;
  tabs: { key: string; label: string }[];
}) {
  return (
    <div className="flex gap-1 border-b border-black/8 dark:border-white/10">
      {tabs.map((t) => {
        const isActive = t.key === active;
        const href = t.key === tabs[0].key ? basePath : `${basePath}?tab=${t.key}`;
        return (
          <Link
            key={t.key}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={`-mb-px border-b-2 px-3.5 py-2.5 text-sm font-medium transition ${
              isActive
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
