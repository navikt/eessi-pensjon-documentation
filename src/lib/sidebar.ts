import { useSyncExternalStore } from "react";

/*
 * Collapsed/expanded state for the desktop sidebar. The source of truth is the
 * `data-sidebar` attribute on <html>: the boot script in index.html sets it from
 * localStorage before first paint, so the CSS renders the right width with no
 * flash. Keep the storage key and query in sync with index.html and styles.css.
 */
export const SIDEBAR_STORAGE_KEY = "ep-docs-sidebar";
const COLLAPSED = "collapsed";

/** Where the sidebar is a fixed column; below it, it's a fold-out menu. */
export const SIDEBAR_DESKTOP_QUERY = "(min-width: 900px)";

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function apply(collapsed: boolean) {
  const el = document.documentElement;
  if (collapsed) el.setAttribute("data-sidebar", COLLAPSED);
  else el.removeAttribute("data-sidebar");
}

function onStorage(event: StorageEvent) {
  if (event.key !== SIDEBAR_STORAGE_KEY) return;
  apply(event.newValue === COLLAPSED);
  emit();
}

function subscribeCollapsed(callback: () => void) {
  listeners.add(callback);
  if (listeners.size === 1) window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(callback);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

export const isCollapsed = () => document.documentElement.getAttribute("data-sidebar") === COLLAPSED;

export function setCollapsed(collapsed: boolean) {
  apply(collapsed);
  try {
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, collapsed ? COLLAPSED : "expanded");
  } catch {
    /* storage unavailable: the choice lasts until reload */
  }
  emit();
}

export const toggleCollapsed = () => setCollapsed(!isCollapsed());

export function useCollapsed(): boolean {
  return useSyncExternalStore(subscribeCollapsed, isCollapsed);
}

function subscribeDesktop(callback: () => void) {
  const media = window.matchMedia(SIDEBAR_DESKTOP_QUERY);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

export const isDesktop = () => window.matchMedia(SIDEBAR_DESKTOP_QUERY).matches;

export function useDesktop(): boolean {
  return useSyncExternalStore(subscribeDesktop, isDesktop);
}
