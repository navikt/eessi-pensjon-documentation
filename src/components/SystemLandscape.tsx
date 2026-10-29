import { useId, useLayoutEffect, useMemo, useRef, useState, type ComponentType, type CSSProperties, type KeyboardEvent, type SVGProps } from "react";
import { Buildings3Icon, GlobeIcon, LightningIcon, LinkIcon, PersonIcon } from "@navikt/aksel-icons";
import { EDGES, EXTERNALS, TOPICS, TONE_BY_CATEGORY, findApplication, type Tone } from "../lib/applications";
import { usePrefersReducedMotion } from "../lib/motion";

/*
 * The whole system on one hand-placed map: EUX on the left, our synchronous
 * and Kafka-driven apps in the middle, Nav systems and other teams on the
 * right. Boxes are placed by hand for readability; the connections come from
 * lib/applications.ts, plus the few that live outside our apps (RINA, PDL,
 * the saksbehandler and the teams reading our public topics).
 */

type IconType = ComponentType<SVGProps<SVGSVGElement>>;
type Kind = "app" | "topic" | "system" | "actor";

type Box = {
  id: string;
  kind: Kind;
  kindLabel: string;
  label: string;
  sub?: string;
  summary: string;
  tone: Tone;
  Icon?: IconType;
  href?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Left-to-right order, used to stagger the entrance. */
  wave: number;
};

type Edge = { from: string; to: string; kind: "rest" | "event"; d?: string; both?: boolean };

const W = 1212;
const H = 730;

const COLS = {
  eux: { x: 40, w: 148, wave: 1 },
  c1: { x: 276, w: 150, wave: 2 },
  c2: { x: 464, w: 166, wave: 3 },
  c3: { x: 672, w: 140, wave: 4 },
  c4: { x: 840, w: 154, wave: 5 },
  nav: { x: 1048, w: 132, wave: 6 },
} as const;
type Col = keyof typeof COLS;

const ep = (id: string) => `eessi-pensjon-${id}`;

const APP_POS: [string, Col, number, number][] = [
  ["saksbehandling-ui", "c1", 229, 48],
  ["fagmodul", "c2", 196, 48],
  ["saksbehandling-api", "c2", 262, 48],
  ["prefill", "c3", 196, 48],
  ["journalforing", "c2", 360, 44],
  ["begrens-innsyn", "c2", 418, 44],
  ["pdl-produsent", "c2", 476, 44],
  ["statistikk", "c2", 534, 44],
  ["dodsmelding", "c2", 606, 44],
  ["krav-initialisering", "c4", 360, 44],
  ["oppgave", "c4", 418, 44],
];

const TOPIC_POS: [string, Col, number][] = [
  ["eessibasis.sedsendt-v1", "c1", 392],
  ["eessibasis.sedmottatt-v1", "c1", 446],
  ["pdl.leesah-v1", "c1", 613],
  ["eessipensjon.privat-krav-initialisering", "c3", 367],
  ["eessipensjon.privat-oppgave", "c3", 425],
  ["eessipensjon.privat-statistikk", "c3", 601],
  ["eessipensjon.public-statistikk", "c4", 520],
  ["eessipensjon.public-automatisering", "c4", 596],
];

/** Ordered so the lines from the apps cross as little as possible. */
const NAV_ORDER = ["Kodeverk", "KRR", "Etterlatte", "Pesys", "PDL", "Person-mottak", "SAF", "Joark", "Oppgave", "Norg2", "Nav Ansatt"];

function buildBoxes(): Box[] {
  const boxes: Box[] = [
    {
      id: "utlandet",
      kind: "actor",
      kindLabel: "Utlandet",
      label: "Utlandet",
      sub: "EU/EØS og Sveits",
      summary: "Trygdemyndighetene i de andre landene. De utveksler SED-er med Nav gjennom sitt eget tilgangspunkt til EESSI.",
      tone: "neutral",
      Icon: GlobeIcon,
      x: 16,
      y: 24,
      w: 196,
      h: 52,
      wave: 0,
    },
    {
      id: "saksbehandler",
      kind: "actor",
      kindLabel: "Bruker",
      label: "Saksbehandler",
      sub: "Fra Pesys eller Gjenny",
      summary: "Åpner EESSI Pensjon fra en sak i Pesys eller Gjenny, og logger inn med Entra ID gjennom Wonderwall.",
      tone: "neutral",
      Icon: PersonIcon,
      x: 271,
      y: 24,
      w: 160,
      h: 52,
      wave: 1,
    },
    {
      id: "rina",
      kind: "system",
      kindLabel: "EUX-plattformen",
      label: "RINA",
      sub: "BUC-er og SED-er",
      summary: "Saksbehandlingsløsningen for EESSI. Her ligger alle BUC-er og SED-er som Nav utveksler med andre land.",
      tone: "neutral",
      Icon: Buildings3Icon,
      ...at("eux", 196, 48),
    },
    {
      id: "EUX-RINA-API",
      kind: "system",
      kindLabel: "EUX-plattformen",
      label: "eux-rina-api",
      sub: "REST",
      summary: EXTERNALS["EUX-RINA-API"],
      tone: "neutral",
      Icon: LinkIcon,
      ...at("eux", 290, 48),
    },
    {
      id: "eux-hendelser",
      kind: "system",
      kindLabel: "EUX-plattformen",
      label: "RINA-hendelser",
      sub: "Til Kafka",
      summary: "EUX publiserer en Kafka-hendelse hver gang en SED sendes eller mottas (eux-legacy-rina-events).",
      tone: "neutral",
      Icon: LightningIcon,
      ...at("eux", 410, 48),
    },
  ];

  for (const [id, col, y, h] of APP_POS) {
    const app = findApplication(ep(id));
    if (!app) continue;
    boxes.push({
      id: app.id,
      kind: "app",
      kindLabel: app.category === "kjerne" ? "Synkron tjeneste" : "Kafka-lytter",
      label: app.name,
      summary: app.summary,
      tone: TONE_BY_CATEGORY[app.category],
      Icon: app.Icon,
      href: `/applikasjoner#${app.id}`,
      ...at(col, y, h),
    });
  }

  for (const [id, col, y] of TOPIC_POS) {
    const topic = TOPICS[id];
    if (!topic) continue;
    boxes.push({
      id,
      kind: "topic",
      kindLabel: "Kafka-topic",
      label: topic.label,
      summary: topic.summary,
      tone: "meta-purple",
      ...at(col, y, 30),
    });
  }

  NAV_ORDER.forEach((id, i) => {
    boxes.push({
      id,
      kind: "system",
      kindLabel: "Nav-system",
      label: id === "Oppgave" ? "Nav Oppgave" : id,
      summary: EXTERNALS[id] ?? "",
      tone: "neutral",
      ...at("nav", 166 + i * 36, 28),
    });
  });

  boxes.push(
    {
      id: "DVH",
      kind: "system",
      kindLabel: "Annet team",
      label: "DVH",
      summary: "Datavarehuset. Leser ferdig statistikk om SED-er fra public-statistikk.",
      tone: "neutral",
      ...at("nav", 618, 24),
    },
    {
      id: "dv-team-pensjon",
      kind: "system",
      kindLabel: "Annet team",
      label: "dv-team-pensjon",
      summary: "Leser data om automatiseringsgrad fra public-automatisering.",
      tone: "neutral",
      ...at("nav", 648, 24),
    },
  );

  return boxes;
}

function at(col: Col, y: number, h: number) {
  const c = COLS[col];
  return { x: c.x, y, w: c.w, h, wave: c.wave };
}

const BOXES = buildBoxes();
const BOX: Record<string, Box> = Object.fromEntries(BOXES.map((b) => [b.id, b]));

const UI = ep("saksbehandling-ui");
const SED_MOTTATT = "eessibasis.sedmottatt-v1";
const OPPGAVE_TOPIC = "eessipensjon.privat-oppgave";

const EXTRA_EDGES: Edge[] = [
  { from: "utlandet", to: "rina", kind: "rest", both: true, d: "M 164 78 V 194" },
  { from: "rina", to: "EUX-RINA-API", kind: "rest", both: true, d: "M 114 246 V 288" },
  { from: "rina", to: "eux-hendelser", kind: "event", d: "M 40 220 H 35 Q 28 220 28 227 V 427 Q 28 434 35 434 H 38" },
  { from: "saksbehandler", to: UI, kind: "rest", d: "M 351 78 V 227" },
  // Person events from PDL, routed along the bottom so they don't cross the apps
  { from: "PDL", to: "pdl.leesah-v1", kind: "event", d: "M 1048 324 H 1029 Q 1021 324 1021 332 V 694 Q 1021 702 1013 702 H 359 Q 351 702 351 694 V 645" },
  ...Object.entries(TOPICS).flatMap(([id, t]) => [
    ...(t.source === "EUX" ? [{ from: "eux-hendelser", to: id, kind: "event" as const }] : []),
    ...(t.sink ? [{ from: id, to: t.sink, kind: "event" as const }] : []),
  ]),
];

const ALL_EDGES: Edge[] = [...EDGES, ...EXTRA_EDGES].filter((e) => BOX[e.from] && BOX[e.to]);

const isOutside = (b: Box) => b.kind === "system" || b.kind === "actor";

function edgePath(e: Edge): string {
  if (e.d) return e.d;
  const a = BOX[e.from];
  const b = BOX[e.to];
  const ay = a.y + a.h / 2;
  const by = b.y + b.h / 2;
  if (b.x >= a.x + a.w) {
    const x1 = a.x + a.w;
    const x2 = b.x - 2;
    const dx = Math.max(24, (x2 - x1) / 2);
    return `M ${x1} ${ay} C ${x1 + dx} ${ay}, ${x2 - dx} ${by}, ${x2} ${by}`;
  }
  if (b.x + b.w <= a.x) {
    const x1 = a.x;
    const x2 = b.x + b.w + 2;
    const dx = Math.max(24, (x1 - x2) / 2);
    return `M ${x1} ${ay} C ${x1 - dx} ${ay}, ${x2 + dx} ${by}, ${x2} ${by}`;
  }
  // Same column: a loop on the right-hand side, landing just below the centre
  const x = a.x + a.w;
  const bulge = 18 + Math.abs(by - ay) * 0.06;
  return `M ${x} ${ay} C ${x + bulge} ${ay}, ${x + bulge} ${by + 12}, ${x + 2} ${by + 12}`;
}

const edgeKey = (e: Edge) => `${e.from}->${e.to}`;

/** Two example journeys animated as packets: a click, and an incoming SED. */
const JOURNEYS: { tone: Tone; start: number; step: number; hops: [string, string][] }[] = [
  {
    tone: "accent",
    start: 0.4,
    step: 1,
    hops: [
      ["saksbehandler", UI],
      [UI, ep("fagmodul")],
      [ep("fagmodul"), "EUX-RINA-API"],
      ["EUX-RINA-API", "rina"],
    ],
  },
  {
    tone: "success",
    start: 6,
    step: 0.9,
    hops: [
      ["rina", "eux-hendelser"],
      ["eux-hendelser", SED_MOTTATT],
      [SED_MOTTATT, ep("journalforing")],
      [ep("journalforing"), OPPGAVE_TOPIC],
      [OPPGAVE_TOPIC, ep("oppgave")],
      [ep("oppgave"), "Oppgave"],
    ],
  },
];
const CYCLE = 14;

function neighbours(id: string) {
  const inn: string[] = [];
  const out: string[] = [];
  for (const e of ALL_EDGES) {
    if (e.to === id) (e.both ? out : inn).push(e.from);
    if (e.from === id) out.push(e.to);
  }
  return { inn, out };
}

const displayName = (id: string) => BOX[id].label;

export function SystemLandscape() {
  const reduced = usePrefersReducedMotion();
  const prefix = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const [hover, setHover] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const active = hover ?? pinned;

  const pathId = (e: Edge) => `${prefix}-${edgeKey(e).replace(/[^a-zA-Z0-9_-]/g, "_")}`;
  const arrow = `${prefix}-arrow`;
  const arrowOn = `${prefix}-arrow-on`;
  const arrowEvent = `${prefix}-arrow-event`;

  const near = useMemo(() => {
    if (!active) return null;
    const ids = new Set([active]);
    for (const e of ALL_EDGES) {
      if (e.from === active) ids.add(e.to);
      if (e.to === active) ids.add(e.from);
    }
    return ids;
  }, [active]);

  // Draw the highlighted lines last so they sit on top
  const edges = useMemo(() => {
    const on = (e: Edge) => (active ? e.from === active || e.to === active : false);
    return [...ALL_EDGES].sort((a, b) => Number(on(a)) - Number(on(b)));
  }, [active]);

  function toggle(id: string) {
    setPinned((p) => (p === id ? null : id));
  }

  function onKey(event: KeyboardEvent, id: string) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggle(id);
    } else if (event.key === "Escape") {
      setPinned(null);
    }
  }

  const shown = active ? BOX[active] : null;
  const links = shown ? neighbours(shown.id) : null;

  return (
    <figure className="ep-archx-figure ep-map ep-land" data-reveal data-active={active ? true : undefined}>
      <ul className="ep-map__legend" aria-label="Forklaring">
        <li>
          <span className="ep-map__key ep-map__key--rest" aria-hidden /> REST-kall
        </li>
        <li>
          <span className="ep-map__key ep-map__key--event" aria-hidden /> Kafka
        </li>
        <li>
          <span className="ep-map__swatch" data-tone="accent" aria-hidden /> Synkront
        </li>
        <li>
          <span className="ep-map__swatch" data-tone="success" aria-hidden /> Lyttere
        </li>
        <li>
          <span className="ep-map__swatch ep-map__swatch--pill" data-tone="meta-purple" aria-hidden /> Kafka-topic
        </li>
        <li>
          <span className="ep-map__swatch ep-map__swatch--dashed" data-tone="neutral" aria-hidden /> Utenfor EESSI Pensjon
        </li>
      </ul>

      <div className="ep-map__scroll">
        <svg
          className="ep-land__svg"
          viewBox={`0 0 ${W} ${H}`}
          role="group"
          aria-label="Kart over hele EESSI Pensjon: EUX, våre apper, Kafka-topics og Nav-systemene vi bruker"
          onMouseLeave={() => setHover(null)}
        >
          <defs>
            <marker id={arrow} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0 10 5 0 10z" className="ep-land__head" />
            </marker>
            <marker id={arrowOn} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0 10 5 0 10z" className="ep-land__head ep-land__head--on" />
            </marker>
            <marker id={arrowEvent} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0 10 5 0 10z" className="ep-land__head ep-land__head--event" />
            </marker>
          </defs>

          <Zones />

          <g className="ep-land__edges" aria-hidden>
            {edges.map((e) => {
              const on = active ? e.from === active || e.to === active : false;
              // Calls from our apps out to other systems are many; keep them in the background until hovered
              const faint = e.kind === "rest" && BOX[e.from].kind === "app" && isOutside(BOX[e.to]);
              const marker = `url(#${on ? arrowOn : e.kind === "event" ? arrowEvent : arrow})`;
              return (
                <path
                  key={edgeKey(e)}
                  id={pathId(e)}
                  d={edgePath(e)}
                  className={`ep-land__edge ep-land__edge--${e.kind}${faint ? " is-faint" : ""}${on ? " is-on" : ""}`}
                  data-tone={on ? BOX[active!].tone : undefined}
                  markerEnd={marker}
                  markerStart={e.both ? marker : undefined}
                />
              );
            })}
          </g>

          {!reduced && (
            <g className="ep-land__packets" aria-hidden>
              {JOURNEYS.flatMap((j) =>
                j.hops.map(([from, to], i) => {
                  const forward = ALL_EDGES.find((e) => e.from === from && e.to === to);
                  const edge = forward ?? ALL_EDGES.find((e) => e.from === to && e.to === from);
                  if (!edge) return null;
                  const t0 = (j.start + i * j.step) / CYCLE;
                  const t1 = (j.start + (i + 1) * j.step - 0.08) / CYCLE;
                  const timing = { dur: `${CYCLE}s`, begin: "1.2s", repeatCount: "indefinite" };
                  return (
                    <circle key={`${from}-${to}`} r={4.5} className="ep-land__packet" data-tone={j.tone} opacity={0}>
                      <animateMotion
                        {...timing}
                        calcMode="linear"
                        keyPoints={forward ? "0;0;1;1" : "1;1;0;0"}
                        keyTimes={`0;${t0.toFixed(4)};${t1.toFixed(4)};1`}
                      >
                        <mpath href={`#${pathId(edge)}`} />
                      </animateMotion>
                      <animate
                        {...timing}
                        attributeName="opacity"
                        values="0;0;1;1;0;0"
                        keyTimes={`0;${t0.toFixed(4)};${(t0 + 0.004).toFixed(4)};${(t1 - 0.004).toFixed(4)};${t1.toFixed(4)};1`}
                      />
                    </circle>
                  );
                }),
              )}
            </g>
          )}

          {BOXES.map((b) => (
            <g
              key={b.id}
              transform={`translate(${b.x} ${b.y})`}
              className={`ep-land__node ep-land__node--${b.kind}${near?.has(b.id) ? " is-near" : ""}${active === b.id ? " is-active" : ""}`}
              data-tone={b.tone}
              tabIndex={0}
              role="button"
              aria-pressed={pinned === b.id}
              aria-label={`${b.label}, ${b.kindLabel.toLowerCase()}`}
              onMouseEnter={() => setHover(b.id)}
              onFocus={() => setHover(b.id)}
              onBlur={() => setHover(null)}
              onClick={() => toggle(b.id)}
              onKeyDown={(event) => onKey(event, b.id)}
            >
              <g className="ep-land__pop" style={{ "--wave": b.wave } as CSSProperties}>
                <NodeShape box={b} />
              </g>
            </g>
          ))}
        </svg>
      </div>

      <div className="ep-map__panel" aria-live="polite">
        {shown && links ? (
          <>
            <div className="ep-map__panel-head" data-tone={shown.tone}>
              <span className="ep-map__panel-kind">{shown.kindLabel}</span>
              <strong className={shown.kind === "topic" ? "ep-mono" : undefined}>
                {shown.kind === "topic" ? shown.id : shown.label}
              </strong>
              {pinned && (
                <button type="button" className="ep-map__clear" onClick={() => setPinned(null)}>
                  Nullstill
                </button>
              )}
            </div>
            <p className="ep-map__panel-text">{shown.summary}</p>
            <dl className="ep-land__links">
              {links.inn.length > 0 && (
                <div>
                  <dt>Fra</dt>
                  <dd>{links.inn.map(displayName).join(", ")}</dd>
                </div>
              )}
              {links.out.length > 0 && (
                <div>
                  <dt>Til</dt>
                  <dd>{links.out.map(displayName).join(", ")}</dd>
                </div>
              )}
            </dl>
            {shown.href && (
              <a className="ep-map__open" href={shown.href}>
                Les mer om {shown.label} →
              </a>
            )}
          </>
        ) : (
          <p className="ep-map__panel-text ep-map__panel-hint">
            Hold musepekeren over en boks for å se hva den henger sammen med. Klikk for å låse markeringen.
          </p>
        )}
      </div>
    </figure>
  );
}

function Zones() {
  return (
    <g className="ep-land__zones" aria-hidden>
      <g className="ep-land__pop" style={{ "--wave": 0 } as CSSProperties}>
        <rect x={16} y={112} width={196} height={568} rx={22} className="ep-land__zone ep-land__zone--outside" />
        <text x={32} y={138} className="ep-land__zone-title">
          EUX-plattformen
        </text>
        <text x={32} y={154} className="ep-land__zone-sub">
          Inngang til EESSI
        </text>
      </g>

      <g className="ep-land__pop" style={{ "--wave": 1 } as CSSProperties}>
        <rect x={236} y={112} width={774} height={568} rx={22} className="ep-land__zone ep-land__zone--ep" />
        <text x={994} y={138} textAnchor="end" className="ep-land__zone-title">
          EESSI Pensjon
        </text>
        <text x={994} y={154} textAnchor="end" className="ep-land__zone-sub">
          Våre apper · NAIS i GCP
        </text>

        <rect x={246} y={172} width={754} height={150} rx={16} className="ep-land__band" data-tone="accent" />
        <text transform="translate(265 247) rotate(-90)" textAnchor="middle" className="ep-land__band-label" data-tone="accent">
          SYNKRONT
        </text>

        <rect x={246} y={338} width={754} height={326} rx={16} className="ep-land__band" data-tone="success" />
        <text transform="translate(265 501) rotate(-90)" textAnchor="middle" className="ep-land__band-label" data-tone="success">
          ASYNKRONT · KAFKA
        </text>
      </g>

      <g className="ep-land__pop" style={{ "--wave": 2 } as CSSProperties}>
        <rect x={1032} y={112} width={164} height={460} rx={22} className="ep-land__zone ep-land__zone--outside" />
        <text x={1048} y={138} className="ep-land__zone-title">
          Nav-systemer
        </text>
        <text x={1048} y={154} className="ep-land__zone-sub">
          Der dataene bor
        </text>

        <rect x={1032} y={588} width={164} height={92} rx={18} className="ep-land__zone ep-land__zone--outside" />
        <text x={1048} y={608} className="ep-land__zone-sub ep-land__zone-sub--strong">
          Andre team
        </text>
      </g>

      <text x={686} y={720} textAnchor="middle" className="ep-land__route-label">
        Personhendelser fra PDL (leesah)
      </text>
    </g>
  );
}

function NodeShape({ box: b }: { box: Box }) {
  if (b.kind === "topic") {
    return (
      <>
        <title>{b.id}</title>
        <rect width={b.w} height={b.h} rx={b.h / 2} className="ep-land__box" />
        <text x={b.w / 2} y={b.h / 2} dominantBaseline="central" textAnchor="middle" className="ep-land__topic">
          {b.label}
        </text>
      </>
    );
  }

  if (!b.Icon) {
    return (
      <>
        <title>{b.summary}</title>
        <rect width={b.w} height={b.h} rx={8} className="ep-land__box" />
        <text x={b.w / 2} y={b.h / 2} dominantBaseline="central" textAnchor="middle" className="ep-land__chip">
          {b.label}
        </text>
      </>
    );
  }

  const cy = b.h / 2;
  return (
    <>
      <title>{b.summary}</title>
      <rect width={b.w} height={b.h} rx={12} className="ep-land__box" />
      <circle cx={19} cy={cy} r={12} className="ep-land__icon-bg" />
      <b.Icon x={11} y={cy - 8} width={16} height={16} className="ep-land__icon" aria-hidden />
      {b.sub ? (
        <>
          <FitText x={38} y={cy - 7} max={b.w - 46} className="ep-land__label">
            {b.label}
          </FitText>
          <FitText x={38} y={cy + 9} max={b.w - 46} className="ep-land__sub">
            {b.sub}
          </FitText>
        </>
      ) : (
        <FitText x={38} y={cy} max={b.w - 46} className="ep-land__label">
          {b.label}
        </FitText>
      )}
    </>
  );
}

/** SVG text that squeezes itself to `max` px if the rendered font runs wider. */
function FitText({ x, y, max, className, children }: { x: number; y: number; max: number; className: string; children: string }) {
  const ref = useRef<SVGTextElement>(null);
  const [fit, setFit] = useState<number | undefined>();
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      el.removeAttribute("textLength");
      setFit(el.getComputedTextLength() > max ? max : undefined);
    };
    measure();
    document.fonts?.ready.then(measure);
  }, [max, children]);
  return (
    <text
      ref={ref}
      x={x}
      y={y}
      dominantBaseline="central"
      className={className}
      textLength={fit}
      lengthAdjust={fit ? "spacingAndGlyphs" : undefined}
    >
      {children}
    </text>
  );
}
