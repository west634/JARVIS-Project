import "server-only";
import { mkdir, writeFile, readFile, unlink } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

/**
 * Storage abstraction so the rest of the app never talks to the filesystem
 * (or, later, S3/Blob storage/etc.) directly — spec §50: "If an external
 * service is unavailable, create a clean abstraction/mock service so it can
 * be connected later." `LocalFileStorage` is the dev-friendly implementation
 * for now; swapping in an S3-backed implementation later means writing one
 * new class against this interface, not touching any caller.
 *
 * Files are NOT served as static/public assets. `storageKey` is only ever
 * resolved back to bytes through `/api/files/[fileId]`, which re-checks the
 * requester's permission on every request — see that route for why.
 */
export type StoredFile = {
  storageKey: string;
  sizeBytes: number;
};

export interface FileStorage {
  save(input: { subdir: string; fileName: string; data: Buffer }): Promise<StoredFile>;
  read(storageKey: string): Promise<Buffer>;
  delete(storageKey: string): Promise<void>;
}

const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25MB — generous for coursework, not unlimited

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120) || "file";
}

class LocalFileStorage implements FileStorage {
  constructor(private readonly rootDir: string) {}

  async save(input: { subdir: string; fileName: string; data: Buffer }): Promise<StoredFile> {
    if (input.data.byteLength > MAX_FILE_BYTES) {
      throw new Error(`File exceeds the ${MAX_FILE_BYTES / 1024 / 1024}MB upload limit.`);
    }
    const safeName = sanitizeFileName(input.fileName);
    const storageKey = path.posix.join(input.subdir, `${randomUUID()}-${safeName}`);
    const fullPath = this.resolve(storageKey);
    await mkdir(path.dirname(fullPath), { recursive: true });
    await writeFile(fullPath, input.data);
    return { storageKey, sizeBytes: input.data.byteLength };
  }

  async read(storageKey: string): Promise<Buffer> {
    return readFile(this.resolve(storageKey));
  }

  async delete(storageKey: string): Promise<void> {
    await unlink(this.resolve(storageKey)).catch(() => {
      /* already gone — deleting is idempotent from the caller's perspective */
    });
  }

  /** Resolves a storage key to an absolute path, refusing any path escape. */
  private resolve(storageKey: string): string {
    const full = path.resolve(this.rootDir, storageKey);
    if (!full.startsWith(path.resolve(this.rootDir) + path.sep)) {
      throw new Error("Invalid storage key.");
    }
    return full;
  }
}

export const fileStorage: FileStorage = new LocalFileStorage(
  process.env.UPLOADS_DIR ?? path.join(process.cwd(), "uploads"),
);

export { MAX_FILE_BYTES };
