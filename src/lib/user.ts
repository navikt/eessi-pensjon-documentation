import { useEffect, useState } from "react";

export type CurrentUser = {
  name: string;
  email: string | null;
  navIdent: string | null;
  /** Placeholder user from the local Node server. */
  local?: boolean;
};

export type UserState =
  | { status: "loading" }
  | { status: "anonymous" }
  | { status: "authenticated"; user: CurrentUser };

/** The employee logged in through Wonderwall, as reported by GET /api/me. */
export function useCurrentUser(): UserState {
  const [state, setState] = useState<UserState>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/me", { cache: "no-store", signal: controller.signal })
      .then((res) => (res.ok ? res.json() : { user: null }))
      .then((body: { user: CurrentUser | null }) =>
        setState(body.user ? { status: "authenticated", user: body.user } : { status: "anonymous" }),
      )
      .catch((err: unknown) => {
        if ((err as Error).name !== "AbortError") setState({ status: "anonymous" });
      });
    return () => controller.abort();
  }, []);

  return state;
}

/** Entra ID names at Nav are "Etternavn, Fornavn" — show them naturally. */
export function displayName(name: string): string {
  const [last, first] = name.split(",").map((s) => s.trim());
  return first ? `${first} ${last}` : name;
}

export function initials(name: string): string {
  const parts = displayName(name).split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}
