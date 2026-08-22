import { useCallback, useState } from "react";

function readStorage<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage unavailable (private mode, quota) — degrade silently
  }
}

/** Persists a settings-shaped object, shallow-merged onto `initial` so new fields get defaults. */
export function usePersistentSettings<T extends object>(key: string, initial: T) {
  const [state, setState] = useState<T>(() => {
    const stored = readStorage<Partial<T>>(key);
    return stored ? { ...initial, ...stored } : initial;
  });

  const update = useCallback(
    (value: T | ((prev: T) => T)) => {
      setState((prev) => {
        const next = typeof value === "function" ? (value as (p: T) => T)(prev) : value;
        writeStorage(key, next);
        return next;
      });
    },
    [key]
  );

  return [state, update] as const;
}

/** Persists a list value verbatim (no merge) — for arrays like conversation history or notes. */
export function usePersistentList<T>(key: string, initial: T[]) {
  const [state, setState] = useState<T[]>(() => readStorage<T[]>(key) ?? initial);

  const update = useCallback(
    (value: T[] | ((prev: T[]) => T[])) => {
      setState((prev) => {
        const next = typeof value === "function" ? (value as (p: T[]) => T[])(prev) : value;
        writeStorage(key, next);
        return next;
      });
    },
    [key]
  );

  return [state, update] as const;
}
