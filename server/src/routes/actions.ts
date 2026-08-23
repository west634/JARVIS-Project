import { Router } from "express";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export const actionsRouter = Router();

function resolvePath(input: string): string {
  const trimmed = input.trim();
  const expanded = trimmed.startsWith("~") ? path.join(os.homedir(), trimmed.slice(1)) : trimmed;
  return path.resolve(expanded);
}

function openerForPlatform(): { command: string; args: (target: string) => string[] } {
  switch (process.platform) {
    case "darwin":
      return { command: "open", args: (target) => [target] };
    case "win32":
      return { command: "cmd", args: (target) => ["/c", "start", "", target] };
    default:
      return { command: "xdg-open", args: (target) => [target] };
  }
}

/**
 * Executes a file-open that the operator has already explicitly confirmed in
 * the UI. The tool-calling loop only ever proposes this (see tools/files.ts)
 * — nothing opens without this separate, human-confirmed request landing
 * here first.
 */
actionsRouter.post("/actions/open-file", async (req, res) => {
  const body = req.body as { path?: string };
  const rawPath = typeof body?.path === "string" ? body.path : "";
  if (!rawPath.trim()) {
    res.status(400).json({ error: "No file path provided." });
    return;
  }

  const target = resolvePath(rawPath);

  try {
    await fs.access(target);
  } catch {
    res.status(404).json({ error: `"${target}" doesn't exist or isn't accessible.` });
    return;
  }

  const opener = openerForPlatform();
  execFile(opener.command, opener.args(target), (err) => {
    if (err) {
      res.status(500).json({ error: "Could not open that file." });
      return;
    }
    res.json({ status: "opened", path: target });
  });
});
