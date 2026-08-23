import { execFile } from "node:child_process";

/** Cross-platform "open this in the default app/browser" — same primitive macOS Finder double-click uses. */
export function openTarget(target: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const { command, args } = openerForPlatform(target);
    execFile(command, args, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function openerForPlatform(target: string): { command: string; args: string[] } {
  switch (process.platform) {
    case "darwin":
      return { command: "open", args: [target] };
    case "win32":
      return { command: "cmd", args: ["/c", "start", "", target] };
    default:
      return { command: "xdg-open", args: [target] };
  }
}
