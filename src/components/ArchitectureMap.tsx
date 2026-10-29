import { useId, useLayoutEffect, useMemo, useRef, useState, type ComponentType, type CSSProperties, type KeyboardEvent, type SVGProps } from "react";
import { ToggleGroup } from "@navikt/ds-react";
import { GlobeIcon, PersonIcon } from "@navikt/aksel-icons";
import { EDGES, EXTERNALS, TOPICS, findApplication, type Tone as AppTone } from "../lib/applications";

/*
 * A classic box-and-arrow architecture map, modelled on the Arkitekturkart in
 * the eux-architecture portal. Apps sit as chips inside tinted zones, and only
 * one arrow is drawn per pair of zones that talk to each other. Hovering a chip
 * lights up the arrows its own connections run through.
 */

type Tone = AppTone | "info";
type IconType = ComponentType<SVGProps<SVGSVGElement>>;
type EdgeKind = "rest" | "event";
type View = "alle" | EdgeKind;
type ZoneId = "bruker" | "frontend" | "kjerne" | "hendelse" | "kafka" | "nav" | "andre" | "eux" | "rina" | "utland";
type Rect = { x: number; y: number; w: number; h: number };

type MapNode = {
  id: string;
  zone: ZoneId;
  kind: "app" | "topic" | "system" | "actor";
  kindLabel: string;
  /** Full name, shown in the side panel. */
  name: string;
  /** Short name, shown on the map. */
  short: string;
  summary: string;
  Icon?: IconType;
  href?: string;
};

type MapEdge = { from: string; to: string; kind: EdgeKind; both?: boolean };

const W = 1180;
const H = 880;
const HEADER = 48;
const CHIP_H = 30;

const ep = (id: string) => `eessi-pensjon-${id}`;
const UI = ep("saksbehandling-ui");

/* ------------------------------------------------------------------ */
/* Zones and boxes                                                     */
/* ------------------------------------------------------------------ */

type ZoneDef = {
  id: ZoneId;
  title: string;
  sub: string;
  tone: Tone;
  rect: Rect;
  members: string[];
  cols?: number;
  flow?: boolean;
};

const ZONES: ZoneDef[] = [
  {
    id: "kjerne",
    title: "Synkrone tjenester",
    sub: "Kotlin · Spring Boot · REST",
    tone: "accent",
    rect: { x: 404, y: 72, w: 360, h: 220 },
    members: [ep("fagmodul"), ep("saksbehandling-api"), ep("prefill")],
  },
  {
    id: "eux",
    title: "EUX-plattformen",
    sub: "Team EUX",
    tone: "info",
    rect: { x: 804, y: 72, w: 196, h: 744 },
    members: [],
  },
  {
    id: "nav",
    title: "Nav-systemer",
    sub: "Der dataene bor",
    tone: "neutral",
    rect: { x: 24, y: 352, w: 556, h: 124 },
    flow: true,
    members: ["Kodeverk", "KRR", "Etterlatte", "Pesys", "SAF", "Person-mottak", "PDL", "Joark", "Oppgave", "Norg2", "Nav Ansatt"],
  },
  {
    id: "andre",
    title: "Andre team",
    sub: "Leser public-topics",
    tone: "neutral",
    rect: { x: 620, y: 352, w: 144, h: 124 },
    flow: true,
    members: ["DVH", "dv-team-pensjon"],
  },
  {
    id: "hendelse",
    title: "Hendelsesdrevne tjenester",
    sub: "Kotlin · Spring Boot · Kafka-lyttere",
    tone: "success",
    rect: { x: 24, y: 536, w: 340, h: 280 },
    cols: 2,
    members: [
      ep("journalforing"),
      ep("oppgave"),
      ep("pdl-produsent"),
      ep("krav-initialisering"),
      ep("begrens-innsyn"),
      ep("statistikk"),
      ep("dodsmelding"),
    ],
  },
  {
    id: "kafka",
    title: "Kafka",
    sub: "Topics, uten prefiks",
    tone: "meta-purple",
    rect: { x: 404, y: 536, w: 360, h: 280 },
    cols: 2,
    members: [
      "eessibasis.sedsendt-v1",
      "eessipensjon.privat-oppgave",
      "eessibasis.sedmottatt-v1",
      "eessipensjon.privat-krav-initialisering",
      "pdl.leesah-v1",
      "eessipensjon.privat-statistikk",
      "eessipensjon.public-statistikk",
      "eessipensjon.public-automatisering",
    ],
  },
];

type HeroDef = { id: string; tone: Tone; title: string; sub: string; rect: Rect; Icon?: IconType };

const HEROES: HeroDef[] = [
  { id: "saksbehandler", tone: "neutral", title: "Saksbehandler", sub: "fra Pesys / Gjenny", rect: { x: 24, y: 138, w: 116, h: 88 }, Icon: PersonIcon },
  { id: UI, tone: "accent", title: "Saksbehandling-UI", sub: "React · Express", rect: { x: 176, y: 138, w: 188, h: 88 }, Icon: findApplication(UI)?.Icon },
  { id: "utlandet", tone: "neutral", title: "Utlandet", sub: "EU/EØS · Sveits", rect: { x: 1040, y: 72, w: 116, h: 96 }, Icon: GlobeIcon },
  { id: "rina", tone: "info", title: "RINA", sub: "EU-system", rect: { x: 1040, y: 208, w: 116, h: 608 } },
];

/** Chips placed by hand inside the tall EUX zone, level with the arrows into them. */
const EUX_CHIPS: Record<string, Rect> = {
  "EUX-RINA-API": { x: 816, y: 235, w: 172, h: CHIP_H },
  "eux-hendelser": { x: 816, y: 661, w: 172, h: CHIP_H },
};

const textWidth = (s: string, size = 12) => s.length * size * 0.56;

function layoutZone(z: ZoneDef): Record<string, Rect> {
  const out: Record<string, Rect> = {};
  const { x, y, w, h } = z.rect;
  const pad = 12;
  if (z.flow) {
    let px = x + pad;
    let py = y + HEADER;
    for (const id of z.members) {
      const cw = Math.round(textWidth(NODE[id].short) + 24);
      if (px + cw > x + w - pad) {
        px = x + pad;
        py += 28 + 8;
      }
      out[id] = { x: px, y: py, w: cw, h: 28 };
      px += cw + 8;
    }
    return out;
  }
  const cols = z.cols ?? 1;
  const rows = Math.ceil(z.members.length / cols);
  const colGap = 10;
  const chipW = (w - pad * 2 - colGap * (cols - 1)) / cols;
  const avail = h - HEADER - 14;
  const gap = rows > 1 ? Math.min(16, (avail - rows * CHIP_H) / (rows - 1)) : 0;
  const top = y + HEADER + (avail - (rows * CHIP_H + (rows - 1) * gap)) / 2;
  z.members.forEach((id, i) => {
    out[id] = {
      x: x + pad + (i % cols) * (chipW + colGap),
      y: top + Math.floor(i / cols) * (CHIP_H + gap),
      w: chipW,
      h: CHIP_H,
    };
  });
  return out;
}

/* ------------------------------------------------------------------ */
/* Nodes and edges                                                     */
/* ------------------------------------------------------------------ */

function buildNodes(): Record<string, MapNode> {
  const nodes: MapNode[] = [
    {
      id: "saksbehandler",
      zone: "bruker",
      kind: "actor",
      kindLabel: "Bruker",
      name: "Saksbehandler",
      short: "Saksbehandler",
      summary: "Åpner EESSI Pensjon fra en sak i Pesys eller Gjenny, og logger inn med Entra ID gjennom Wonderwall.",
    },
    {
      id: "utlandet",
      zone: "utland",
      kind: "actor",
      kindLabel: "Utlandet",
      name: "Utlandet",
      short: "Utlandet",
      summary: "Trygdemyndighetene i de andre landene. De utveksler SED-er med Nav gjennom sitt eget tilgangspunkt til EESSI.",
    },
    {
      id: "rina",
      zone: "rina",
      kind: "system",
      kindLabel: "EU-system",
      name: "RINA",
      short: "RINA",
      summary: "Saksbehandlingsløsningen for EESSI. Her ligger alle BUC-er og SED-er som Nav utveksler med andre land.",
    },
    {
      id: "EUX-RINA-API",
      zone: "eux",
      kind: "system",
      kindLabel: "EUX-plattformen",
      name: "eux-rina-api",
      short: "eux-rina-api",
      summary: EXTERNALS["EUX-RINA-API"],
    },
    {
      id: "eux-hendelser",
      zone: "eux",
      kind: "system",
      kindLabel: "EUX-plattformen",
      name: "RINA-hendelser",
      short: "RINA-hendelser",
      summary: "EUX publiserer en Kafka-hendelse hver gang en SED sendes eller mottas (eux-legacy-rina-events).",
    },
    {
      id: "DVH",
      zone: "andre",
      kind: "system",
      kindLabel: "Annet team",
      name: "DVH",
      short: "DVH",
      summary: "Datavarehuset. Leser ferdig statistikk om SED-er fra public-statistikk.",
    },
    {
      id: "dv-team-pensjon",
      zone: "andre",
      kind: "system",
      kindLabel: "Annet team",
      name: "dv-team-pensjon",
      short: "dv-team-pensjon",
      summary: "Leser data om automatiseringsgrad fra public-automatisering.",
    },
  ];

  for (const zone of ["kjerne", "hendelse"] as const) {
    const ids = zone === "kjerne" ? [UI, ...ZONES[0].members] : ZONES.find((z) => z.id === zone)!.members;
    for (const id of ids) {
      const app = findApplication(id);
      if (!app) continue;
      nodes.push({
        id,
        zone: id === UI ? "frontend" : zone,
        kind: "app",
        kindLabel: zone === "kjerne" ? "Synkron tjeneste" : "Kafka-lytter",
        name: app.name,
        short: app.name,
        summary: app.summary,
        Icon: app.Icon,
        href: `/applikasjoner#${app.id}`,
      });
    }
  }

  for (const [id, topic] of Object.entries(TOPICS)) {
    nodes.push({ id, zone: "kafka", kind: "topic", kindLabel: "Kafka-topic", name: id, short: topic.label, summary: topic.summary });
  }

  for (const [id, summary] of Object.entries(EXTERNALS)) {
    if (id === "EUX-RINA-API") continue;
    const name = id === "Oppgave" ? "Nav Oppgave" : id;
    nodes.push({ id, zone: "nav", kind: "system", kindLabel: "Nav-system", name, short: name, summary });
  }

  return Object.fromEntries(nodes.map((n) => [n.id, n]));
}

const NODE = buildNodes();

const RECT: Record<string, Rect> = Object.assign(
  {},
  Object.fromEntries(HEROES.map((h) => [h.id, h.rect])),
  EUX_CHIPS,
  ...ZONES.map(layoutZone),
);

const ALL_EDGES: MapEdge[] = [
  ...EDGES,
  { from: "saksbehandler", to: UI, kind: "rest" as const },
  { from: "utlandet", to: "rina", kind: "rest" as const, both: true },
  { from: "EUX-RINA-API", to: "rina", kind: "rest" as const, both: true },
  { from: "rina", to: "eux-hendelser", kind: "event" as const },
  { from: "PDL", to: "pdl.leesah-v1", kind: "event" as const },
  ...Object.entries(TOPICS).flatMap(([id, t]) => [
    ...(t.source === "EUX" ? [{ from: "eux-hendelser", to: id, kind: "event" as const }] : []),
    ...(t.sink ? [{ from: id, to: t.sink, kind: "event" as const }] : []),
  ]),
].filter((e) => NODE[e.from] && NODE[e.to]);

/* ------------------------------------------------------------------ */
/* Trunks: the arrows drawn between zones                              */
/* ------------------------------------------------------------------ */

type Trunk = {
  id: string;
  kind: EdgeKind;
  d: string;
  double?: boolean;
  label?: { text: string; x: number; y: number; anchor?: "start" | "middle" };
};

const TRUNKS: Trunk[] = [
  { id: "sb-ui", kind: "rest", d: "M 140 182 H 176" },
  { id: "ui-kjerne", kind: "rest", d: "M 364 182 H 404", label: { text: "REST", x: 384, y: 172 } },
  { id: "kjerne-eux", kind: "rest", d: "M 764 250 H 816", label: { text: "REST", x: 784, y: 240 } },
  { id: "eux-rina", kind: "rest", d: "M 988 250 H 1040", double: true, label: { text: "CPI", x: 1014, y: 240 } },
  { id: "utl-rina", kind: "rest", d: "M 1098 168 V 208", double: true, label: { text: "SED-er", x: 1106, y: 188, anchor: "start" } },
  { id: "kjerne-nav", kind: "rest", d: "M 470 292 V 352", label: { text: "REST", x: 478, y: 322, anchor: "start" } },
  { id: "kjerne-kafka", kind: "event", d: "M 764 272 H 784 V 576 H 764" },
  { id: "hend-nav", kind: "rest", d: "M 194 536 V 476", label: { text: "REST", x: 202, y: 506, anchor: "start" } },
  { id: "nav-kafka", kind: "event", d: "M 526 476 V 536", label: { text: "leesah", x: 534, y: 506, anchor: "start" } },
  { id: "kafka-andre", kind: "event", d: "M 692 536 V 476", label: { text: "public-*", x: 700, y: 506, anchor: "start" } },
  { id: "kafka-hend", kind: "event", d: "M 404 676 H 364", double: true },
  { id: "hend-kafka", kind: "event", d: "M 816 676 H 764" },
  { id: "rina-hend", kind: "event", d: "M 1040 676 H 988" },
  {
    id: "hend-eux",
    kind: "rest",
    d: "M 194 816 V 848 H 902 V 816",
    label: { text: "REST: henter SED-er og oppdaterer saker via eux-rina-api", x: 548, y: 840 },
  },
];

const ZONE_TRUNK: Record<string, string> = {
  "bruker>frontend": "sb-ui",
  "frontend>kjerne": "ui-kjerne",
  "kjerne>eux": "kjerne-eux",
  "eux>rina": "eux-rina",
  "utland>rina": "utl-rina",
  "kjerne>nav": "kjerne-nav",
  "kjerne>kafka": "kjerne-kafka",
  "hendelse>nav": "hend-nav",
  "nav>kafka": "nav-kafka",
  "kafka>andre": "kafka-andre",
  "kafka>hendelse": "kafka-hend",
  "hendelse>kafka": "kafka-hend",
  "eux>kafka": "hend-kafka",
  "rina>eux": "rina-hend",
  "hendelse>eux": "hend-eux",
};

const trunkOf = (e: MapEdge) => ZONE_TRUNK[`${NODE[e.from].zone}>${NODE[e.to].zone}`] ?? null;

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

const VIEWS: { value: View; label: string }[] = [
  { value: "alle", label: "Alt" },
  { value: "rest", label: "REST-kall" },
  { value: "event", label: "Kafka" },
];

export function ArchitectureMap() {
  const prefix = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const [view, setView] = useState<View>("alle");
  const [hover, setHover] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const active = hover ?? pinned;

  const edges = useMemo(() => (view === "alle" ? ALL_EDGES : ALL_EDGES.filter((e) => e.kind === view)), [view]);

  const inView = useMemo(() => {
    if (view === "alle") return null;
    const ids = new Set<string>();
    for (const e of edges) ids.add(e.from).add(e.to);
    return ids;
  }, [view, edges]);

  const { near, lit, inn, out } = useMemo(() => {
    const near = new Set<string>();
    const lit = new Set<string>();
    const inn: string[] = [];
    const out: string[] = [];
    if (active) {
      for (const e of edges) {
        if (e.from !== active && e.to !== active) continue;
        const other = e.from === active ? e.to : e.from;
        near.add(other);
        (e.from === active || e.both ? out : inn).push(other);
        const t = trunkOf(e);
        if (t) lit.add(t);
      }
    }
    return { near, lit, inn, out };
  }, [active, edges]);

  const nodeState = (id: string) => {
    if (active) return id === active ? "is-active" : near.has(id) ? "is-near" : "is-dim";
    return inView && !inView.has(id) ? "is-dim" : "";
  };

  const trunkState = (t: Trunk) => {
    if (view !== "alle" && t.kind !== view) return "is-off";
    if (active) return lit.has(t.id) ? "is-lit" : "is-dim";
    return "";
  };

  const toggle = (id: string) => setPinned((p) => (p === id ? null : id));

  const nodeProps = (id: string) => ({
    tabIndex: 0,
    role: "button",
    "aria-pressed": pinned === id,
    "aria-label": `${NODE[id].name}, ${NODE[id].kindLabel.toLowerCase()}`,
    onMouseEnter: () => setHover(id),
    onMouseLeave: () => setHover(null),
    onFocus: () => setHover(id),
    onBlur: () => setHover(null),
    onClick: () => toggle(id),
    onKeyDown: (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggle(id);
      } else if (event.key === "Escape") {
        setPinned(null);
      }
    },
  });

  const marker = (kind: EdgeKind) => `url(#${prefix}-${kind})`;
  const shown = active ? NODE[active] : null;
  const name = (id: string) => NODE[id].name;

  return (
    <figure className="ep-archx-figure ep-map ep-land" data-reveal data-active={active ? true : undefined}>
      <div className="ep-land__toolbar">
        <ToggleGroup size="small" value={view} onChange={(v) => setView(v as View)} aria-label="Vis forbindelser">
          {VIEWS.map((v) => (
            <ToggleGroup.Item key={v.value} value={v.value} label={v.label} />
          ))}
        </ToggleGroup>
        <ul className="ep-map__legend" aria-label="Forklaring">
          <li>
            <span className="ep-map__key ep-map__key--rest" aria-hidden /> Synkront kall (REST)
          </li>
          <li>
            <span className="ep-map__key ep-map__key--event" aria-hidden /> Hendelse (Kafka)
          </li>
        </ul>
      </div>

      <div className="ep-map__scroll">
        <svg
          className="ep-land__svg"
          viewBox={`0 0 ${W} ${H}`}
          role="group"
          aria-label="Arkitekturkart for EESSI Pensjon. Velg en boks for å se hva den henger sammen med."
        >
          <defs>
            {(["rest", "event"] as const).map((k) => (
              <marker
                key={k}
                id={`${prefix}-${k}`}
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M0 0 10 5 0 10z" className={`ep-land__head ep-land__head--${k}`} />
              </marker>
            ))}
          </defs>

          {ZONES.map((z, i) => (
            <g key={z.id} className="ep-land__zone" data-tone={z.tone} style={{ "--i": i } as CSSProperties} aria-hidden>
              <rect x={z.rect.x} y={z.rect.y} width={z.rect.w} height={z.rect.h} rx={14} className="ep-land__zone-box" />
              <text x={z.rect.x + 14} y={z.rect.y + 22} className="ep-land__zone-title">
                {z.title}
              </text>
              <text x={z.rect.x + 14} y={z.rect.y + 37} className="ep-land__zone-sub">
                {z.sub}
              </text>
            </g>
          ))}

          <text x={902} y={460} textAnchor="middle" className="ep-land__note" aria-hidden>
            <tspan x={902}>Alle RINA-operasjoner</tspan>
            <tspan x={902} dy={15}>
              går via EUX
            </tspan>
          </text>

          <g className="ep-land__trunks" aria-hidden>
            {TRUNKS.map((t) => (
              <g key={t.id} className={`ep-land__trunk ep-land__trunk--${t.kind} ${trunkState(t)}`}>
                <path
                  d={t.d}
                  className="ep-land__line"
                  markerEnd={marker(t.kind)}
                  markerStart={t.double ? marker(t.kind) : undefined}
                />
                <path d={t.d} className="ep-land__flow" />
                {t.label && (
                  <text x={t.label.x} y={t.label.y} textAnchor={t.label.anchor ?? "middle"} className="ep-land__trunk-label">
                    {t.label.text}
                  </text>
                )}
              </g>
            ))}
          </g>

          {HEROES.map((h) => (
            <g key={h.id} className={`ep-land__node ep-land__hero ${nodeState(h.id)}`} data-tone={h.tone} {...nodeProps(h.id)}>
              <Hero hero={h} />
            </g>
          ))}

          {Object.entries(RECT)
            .filter(([id]) => !HEROES.some((h) => h.id === id))
            .map(([id, r]) => {
              const n = NODE[id];
              const tone = ZONES.find((z) => z.id === n.zone)?.tone ?? "neutral";
              return (
                <g
                  key={id}
                  className={`ep-land__node ep-land__chip ep-land__chip--${n.kind} ${nodeState(id)}`}
                  data-tone={tone}
                  {...nodeProps(id)}
                >
                  <Chip node={n} rect={r} />
                </g>
              );
            })}
        </svg>
      </div>

      <div className="ep-map__panel" aria-live="polite">
        {shown ? (
          <>
            <div className="ep-map__panel-head">
              <span className="ep-map__panel-kind">{shown.kindLabel}</span>
              <strong className={shown.kind === "topic" ? "ep-mono" : undefined}>{shown.name}</strong>
              {pinned && (
                <button type="button" className="ep-map__clear" onClick={() => setPinned(null)}>
                  Nullstill
                </button>
              )}
            </div>
            <p className="ep-map__panel-text">{shown.summary}</p>
            <dl className="ep-land__links">
              {inn.length > 0 && (
                <div>
                  <dt>Fra</dt>
                  <dd>{inn.map(name).join(", ")}</dd>
                </div>
              )}
              {out.length > 0 && (
                <div>
                  <dt>Til</dt>
                  <dd>{out.map(name).join(", ")}</dd>
                </div>
              )}
            </dl>
            {shown.href && (
              <a className="ep-map__open" href={shown.href}>
                Les mer om {shown.name} →
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

function Hero({ hero: h }: { hero: HeroDef }) {
  const { x, y, w, h: height } = h.rect;
  const cx = x + w / 2;
  const isRina = h.id === "rina";
  const titleY = isRina ? y + 96 : y + 56;
  return (
    <>
      <rect className="ep-land__pulse" x={x} y={y} width={w} height={height} rx={16} />
      <rect className="ep-land__box" x={x} y={y} width={w} height={height} rx={16} />
      {isRina ? (
        <g transform={`translate(${cx} ${y + 46})`} aria-hidden>
          <g className="ep-land__stars">
            {Array.from({ length: 12 }, (_, i) => {
              const a = (i / 12) * Math.PI * 2;
              return <circle key={i} cx={Math.cos(a) * 18} cy={Math.sin(a) * 18} r={2.4} />;
            })}
          </g>
        </g>
      ) : (
        h.Icon && <h.Icon x={cx - 10} y={y + 14} width={20} height={20} className="ep-land__hero-icon" aria-hidden />
      )}
      <text x={cx} y={titleY} textAnchor="middle" className="ep-land__hero-title">
        {h.title}
      </text>
      <text x={cx} y={titleY + 17} textAnchor="middle" className="ep-land__hero-sub">
        {h.sub}
      </text>
    </>
  );
}

function Chip({ node: n, rect: r }: { node: MapNode; rect: Rect }) {
  const cy = r.y + r.h / 2;
  const hasIcon = n.kind === "app" || n.kind === "topic";
  const textX = r.x + (n.kind === "topic" ? 26 : hasIcon ? 30 : 12);
  return (
    <>
      <title>{n.summary}</title>
      <rect className="ep-land__pulse" x={r.x} y={r.y} width={r.w} height={r.h} rx={8} />
      <rect className="ep-land__box" x={r.x} y={r.y} width={r.w} height={r.h} rx={8} />
      {n.kind === "app" && n.Icon && (
        <n.Icon x={r.x + 9} y={cy - 8} width={16} height={16} className="ep-land__chip-icon" aria-hidden />
      )}
      {n.kind === "topic" && (
        <path
          d={`M${r.x + 9} ${cy - 4} h11 M${r.x + 9} ${cy} h8 M${r.x + 9} ${cy + 4} h10`}
          className="ep-land__topic-icon"
          aria-hidden
        />
      )}
      <FitText x={textX} y={cy} max={r.x + r.w - textX - 6} className={n.kind === "topic" ? "ep-land__topic" : "ep-land__label"}>
        {n.short}
      </FitText>
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
