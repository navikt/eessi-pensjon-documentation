import { useSyncExternalStore } from "react";

export type ThemePreference = "light" | "dark" | "system";

/** Must match the boot script in index.html. */
const STORAGE_KEY = "ep-docs-theme";
const DARK_QUERY = "(prefers-color-scheme: dark)";

const listeners = new Set<() => void>();

function readPreference(): ThemePreference {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" ? value : "system";
  } catch {
    return "system";
  }
}

function resolve(preference: ThemePreference): "light" | "dark" {
  if (preference !== "system") return preference;
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

function applyToDocument() {
  const theme = resolve(readPreference());
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.classList.toggle("light", theme === "light");
}

function emit() {
  applyToDocument();
  for (const listener of listeners) listener();
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  const media = window.matchMedia(DARK_QUERY);
  media.addEventListener("change", emit);
  window.addEventListener("storage", emit);
  return () => {
    listeners.delete(callback);
    media.removeEventListener("change", emit);
    window.removeEventListener("storage", emit);
  };
}

export function setThemePreference(preference: ThemePreference) {
  try {
    window.localStorage.setItem(STORAGE_KEY, preference);
  } catch {
    /* storage unavailable — the choice lasts until reload */
  }
  emit();
}

export function useThemePreference(): ThemePreference {
  return useSyncExternalStore(subscribe, readPreference);
}

export function useResolvedTheme(): "light" | "dark" {
  return useSyncExternalStore(subscribe, () => resolve(readPreference()));
}
