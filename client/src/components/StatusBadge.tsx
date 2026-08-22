export function StatusBadge({
  label,
  tone = "teal",
  dot = false,
}: {
  label: string;
  tone?: "teal" | "green" | "amber" | "red";
  dot?: boolean;
}) {
  const toneClasses: Record<string, string> = {
    teal: "border-teal-dim/60 text-teal",
    green: "border-green/40 text-green",
    amber: "border-amber/40 text-amber",
    red: "border-red/40 text-red",
  };
  const dotClasses: Record<string, string> = {
    teal: "bg-teal",
    green: "bg-green",
    amber: "bg-amber",
    red: "bg-red",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm border px-2.5 py-1 text-[11px] font-semibold tracking-[0.14em] uppercase ${toneClasses[tone]}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dotClasses[tone]} animate-pulse`} />}
      {label}
    </span>
  );
}
