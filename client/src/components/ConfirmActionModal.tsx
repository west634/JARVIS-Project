import type { PendingAction } from "../types/assistant";

export function ConfirmActionModal({
  action,
  onConfirm,
  onCancel,
}: {
  action: PendingAction | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!action) return null;

  const isFile = action.type === "open_file";
  const target = String(action.payload[isFile ? "path" : "url"] ?? "");

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-void/80 backdrop-blur-sm px-4">
      <div className="hud-corner w-full max-w-sm rounded-sm border border-teal-dim/60 bg-panel px-5 py-5 animate-rise-in">
        <p className="text-[11px] tracking-[0.2em] text-amber uppercase mb-2">Confirmation required</p>
        <p className="text-sm text-ink leading-relaxed">
          SENTINEL wants to open{" "}
          <span className="text-teal break-all">{target}</span>
          {isFile ? " in its default application." : " in a new tab."}
        </p>
        <div className="flex gap-2.5 mt-5">
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-sm border border-teal-dim text-teal py-2 text-[12px] font-semibold tracking-widest uppercase hover:bg-teal/10 cursor-pointer"
          >
            Confirm
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-sm border border-panel-border text-ink-dim py-2 text-[12px] font-semibold tracking-widest uppercase hover:border-red/50 hover:text-red cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
