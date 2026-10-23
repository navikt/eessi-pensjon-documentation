import { useCallback, useEffect, useState } from "react";
import { BodyShort, Button, Detail, Loader } from "@navikt/ds-react";
import { ArrowsCirclepathIcon, CheckmarkCircleIcon, XMarkOctagonIcon } from "@navikt/aksel-icons";

type PingResponse = {
  status: string;
  application: string;
  timestamp: string;
  navIdent: string | null;
};

type PingState =
  | { status: "loading" }
  | { status: "ok"; body: PingResponse; ms: number }
  | { status: "error"; message: string };

async function ping(): Promise<PingState> {
  const started = performance.now();
  try {
    const res = await fetch("/api/ping", { cache: "no-store", headers: { accept: "application/json" } });
    const ms = Math.round(performance.now() - started);
    if (!res.ok) return { status: "error", message: `API-et svarte med HTTP ${res.status}` };
    return { status: "ok", body: (await res.json()) as PingResponse, ms };
  } catch {
    return { status: "error", message: "Fikk ikke kontakt med API-et" };
  }
}

/** Calls GET /api/ping through the frontend server (on-behalf-of) and shows the result. */
export function ApiStatus() {
  const [state, setState] = useState<PingState>({ status: "loading" });

  const refresh = useCallback(() => {
    setState({ status: "loading" });
    void ping().then(setState);
  }, []);

  useEffect(() => {
    let active = true;
    void ping().then((result) => active && setState(result));
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="ep-status" data-state={state.status} aria-live="polite">
      <span className="ep-status__icon" aria-hidden>
        {state.status === "loading" && <Loader size="small" />}
        {state.status === "ok" && <CheckmarkCircleIcon />}
        {state.status === "error" && <XMarkOctagonIcon />}
      </span>
      <div className="ep-status__text">
        <BodyShort weight="semibold">
          {state.status === "loading" && "Sjekker API-et …"}
          {state.status === "ok" && "eessi-pensjon-documentation-api svarer"}
          {state.status === "error" && "API-et er ikke tilgjengelig"}
        </BodyShort>
        <Detail textColor="subtle">
          {state.status === "loading" && "GET /api/ping"}
          {state.status === "ok" &&
            `${state.ms} ms · ${state.body.navIdent ? `token for ${state.body.navIdent}` : "uten bruker-token"}`}
          {state.status === "error" && state.message}
        </Detail>
      </div>
      <Button
        variant="tertiary"
        data-color="neutral"
        size="small"
        icon={<ArrowsCirclepathIcon aria-hidden />}
        onClick={refresh}
        disabled={state.status === "loading"}
      >
        Sjekk igjen
      </Button>
    </div>
  );
}
