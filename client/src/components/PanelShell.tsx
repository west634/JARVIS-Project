import type { ReactNode } from "react";

export function PanelShell({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`hud-corner rounded-sm border border-panel-border bg-panel/60 backdrop-blur-sm px-4 py-3 ${className}`}>
      <h3 className="text-[11px] font-semibold tracking-[0.18em] text-ink-dim uppercase mb-2.5">{title}</h3>
      {children}
    </section>
  );
}

export function StatRow({
  label,
  value,
  valueClassName = "",
}: {
  label: string;
  value: ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-0.5">
      <span className="text-[11px] tracking-wide text-ink-faint uppercase">{label}</span>
      <span className={`font-mono text-sm text-ink ${valueClassName}`}>{value}</span>
    </div>
  );
}
