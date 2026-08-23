import { Router } from "express";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { openTarget } from "../utils/opener.js";

export const actionsRouter = Router();

function resolvePath(input: string): string {
  const trimmed = input.trim();
  const expanded = trimmed.startsWith("~") ? path.join(os.homedir(), trimmed.slice(1)) : trimmed;
  return path.resolve(expanded);
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

  try {
    await openTarget(target);
    res.json({ status: "opened", path: target });
  } catch {
    res.status(500).json({ error: "Could not open that file." });
  }
});
