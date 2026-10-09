import { useCallback, useSyncExternalStore } from "react";
import type { Quality } from "./tryon";

// Render-quality preference, kept in localStorage. Quick is the default: in testing it
// matched the detailed render closely at well under half the wait.
const KEY = "billy:quality";
const listeners = new Set<() => void>();
let fallback: Quality | null = null;

function read(): Quality {
  try {
    const stored = localStorage.getItem(KEY);
    if (stored === "low" || stored === "medium") return stored;
  } catch {}
  return fallback ?? "low";
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useQualityPreference() {
  const quality = useSyncExternalStore(subscribe, read, () => "low" as Quality);
  const setQuality = useCallback((next: Quality) => {
    fallback = next;
    try {
      localStorage.setItem(KEY, next);
    } catch {}
    listeners.forEach((l) => l());
  }, []);
  return [quality, setQuality] as const;
}
