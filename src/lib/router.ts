import { useSyncExternalStore } from "react";

/*
 * A tiny client-side router: the current path lives in the History API and
 * internal <a href="/..."> clicks are turned into pushState navigations by
 * installLinkInterception(). Enough for a documentation portal without
 * pulling in a routing library.
 */

const NAVIGATE_EVENT = "ep-docs:navigate";

function subscribe(callback: () => void) {
  window.addEventListener("popstate", callback);
  window.addEventListener(NAVIGATE_EVENT, callback);
  return () => {
    window.removeEventListener("popstate", callback);
    window.removeEventListener(NAVIGATE_EVENT, callback);
  };
}

const getPathname = () => window.location.pathname;

export function usePathname(): string {
  return useSyncExternalStore(subscribe, getPathname);
}

export function navigate(href: string) {
  const url = new URL(href, window.location.origin);
  if (url.pathname + url.search + url.hash === window.location.pathname + window.location.search + window.location.hash) {
    return;
  }
  window.history.pushState(null, "", url);
  window.dispatchEvent(new Event(NAVIGATE_EVENT));
  if (!url.hash) window.scrollTo({ top: 0 });
}

/** Paths that must reach the server (Wonderwall or the Node server) as full page loads. */
const SERVER_PATHS = ["/oauth2/", "/api/", "/internal/"];

export function installLinkInterception() {
  function onClick(event: MouseEvent) {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const anchor = (event.target as Element | null)?.closest?.("a");
    if (!anchor || anchor.target || anchor.hasAttribute("download")) return;
    const url = new URL(anchor.href, window.location.href);
    if (url.origin !== window.location.origin) return;
    if (SERVER_PATHS.some((p) => url.pathname.startsWith(p))) return;
    // Same-page anchors (e.g. the skip link) keep the browser's native jump and focus.
    if (url.hash && url.pathname === window.location.pathname && url.search === window.location.search) return;
    event.preventDefault();
    navigate(url.pathname + url.search + url.hash);
  }
  document.addEventListener("click", onClick);
  return () => document.removeEventListener("click", onClick);
}
