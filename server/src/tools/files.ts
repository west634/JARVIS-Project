import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { ToolExecutionResult } from "./types.js";

const MAX_READ_CHARS = 20_000;

/** Expands a leading `~` to the operator's home directory. */
function resolvePath(input: string): string {
  const trimmed = input.trim();
  const expanded = trimmed.startsWith("~") ? path.join(os.homedir(), trimmed.slice(1)) : trimmed;
  return path.resolve(expanded || os.homedir());
}

export async function listDirectory(args: Record<string, unknown>): Promise<ToolExecutionResult> {
  const target = resolvePath(String(args.path ?? "~"));

  let entries;
  try {
    entries = await fs.readdir(target, { withFileTypes: true });
  } catch (err) {
    return { contentForModel: `Error: could not list "${target}" (${describeFsError(err)}).` };
  }

  if (entries.length === 0) {
    return { contentForModel: `"${target}" is empty.` };
  }

  const lines = entries
    .slice(0, 200)
    .map((e) => `${e.isDirectory() ? "[dir]  " : "[file] "}${e.name}`)
    .join("\n");
  const truncated = entries.length > 200 ? `\n…and ${entries.length - 200} more entries.` : "";

  return { contentForModel: `Contents of ${target}:\n${lines}${truncated}` };
}

export async function readFile(args: Record<string, unknown>): Promise<ToolExecutionResult> {
  const target = resolvePath(String(args.path ?? ""));
  if (!target) {
    return { contentForModel: "Error: no file path was provided." };
  }

  let buffer: Buffer;
  try {
    buffer = await fs.readFile(target);
  } catch (err) {
    return { contentForModel: `Error: could not read "${target}" (${describeFsError(err)}).` };
  }

  if (buffer.subarray(0, 8000).includes(0)) {
    return { contentForModel: `Error: "${target}" looks like a binary file and can't be read as text.` };
  }

  const text = buffer.toString("utf-8");
  const truncated = text.length > MAX_READ_CHARS;
  const content = truncated ? text.slice(0, MAX_READ_CHARS) : text;

  return {
    contentForModel: `Contents of ${target}${truncated ? ` (truncated to ${MAX_READ_CHARS} characters)` : ""}:\n${content}`,
  };
}

export async function openFile(args: Record<string, unknown>): Promise<ToolExecutionResult> {
  const target = resolvePath(String(args.path ?? ""));
  if (!target) {
    return { contentForModel: "Error: no file path was provided." };
  }

  try {
    await fs.access(target);
  } catch (err) {
    return { contentForModel: `Error: "${target}" doesn't exist or isn't accessible (${describeFsError(err)}).` };
  }

  return {
    contentForModel: `Prepared a request to open "${target}" in its default application. This requires the operator's explicit confirmation before it happens — ask them to confirm.`,
    pendingAction: {
      type: "open_file",
      requiresConfirmation: true,
      payload: { path: target },
    },
  };
}

function describeFsError(err: unknown): string {
  if (err && typeof err === "object" && "code" in err) {
    const code = (err as { code?: string }).code;
    if (code === "ENOENT") return "no such file or directory";
    if (code === "EACCES" || code === "EPERM") return "permission denied";
    if (code === "ENOTDIR") return "not a directory";
    if (code === "EISDIR") return "is a directory, not a file";
  }
  return err instanceof Error ? err.message : "unknown error";
}
