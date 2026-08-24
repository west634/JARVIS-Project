import "server-only";

/**
 * Minimal in-memory sliding-window limiter for login attempts, keyed by
 * email+IP. Good enough to blunt naive credential-stuffing in a single
 * server process; a real deployment behind multiple instances should move
 * this to a shared store (e.g. Redis) — noted in SECURITY.md as a Phase 7
 * hardening item, not pretended to be solved here.
 */

const WINDOW_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 8;

const attempts = new Map<string, number[]>();

export function isRateLimited(key: string): boolean {
  const now = Date.now();
  const timestamps = (attempts.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  attempts.set(key, timestamps);
  return timestamps.length >= MAX_ATTEMPTS;
}

export function recordAttempt(key: string): void {
  const now = Date.now();
  const timestamps = (attempts.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  timestamps.push(now);
  attempts.set(key, timestamps);
}

export function clearAttempts(key: string): void {
  attempts.delete(key);
}
