export function Footer({ wakeWordEnabled }: { wakeWordEnabled: boolean }) {
  return (
    <footer className="flex flex-wrap items-center justify-center gap-x-8 gap-y-1 border-t border-panel-border px-5 py-2.5 text-[10px] tracking-[0.16em] text-ink-faint uppercase">
      <span>{wakeWordEnabled ? "Wake word armed" : "Wake word disabled"} · False accepts 0 in 24h</span>
      <span>ASR model 4.2 · On-device</span>
      <span>Speaker match Operator 01 · 0.99</span>
    </footer>
  );
}
