import { useMemo, useState, type KeyboardEvent } from "react";
import { EDGES, NODES, NODE_BY_ID, TOPICS, incoming, outgoing, type GraphNode } from "../lib/applications";

const NODE_W = 150;
const NODE_H = 30;
const GAP_X = 56;
const GAP_Y = 10;
const PAD = 16;

const KIND_LABEL: Record<GraphNode["kind"], string> = {
  app: "Tjeneste",
  topic: "Kafka-topic",
  external: "Eksternt system",
};

/** Systems and outgoing topics that only receive: they always go in the last column. */
const isSink = (n: GraphNode) => n.kind === "external" || (n.kind === "topic" && TOPICS[n.id].scope === "ut");

type Placed = GraphNode & { x: number; y: number; col: number };

/**
 * Columns by longest path from the sources, so every arrow points to the right.
 * Within a column, nodes are sorted by the average position of their predecessors
 * to keep crossings down.
 */
function layout() {
  const flow = EDGES.filter((e) => !isSink(NODE_BY_ID[e.to]));
  const rank = new Map(NODES.filter((n) => !isSink(n)).map((n) => [n.id, 0]));
  for (let i = 0; i < NODES.length; i++) {
    for (const e of flow) rank.set(e.to, Math.max(rank.get(e.to)!, rank.get(e.from)! + 1));
  }
  const last = Math.max(...rank.values()) + 1;
  for (const n of NODES) if (isSink(n)) rank.set(n.id, last);

  const columns: string[][] = Array.from({ length: last + 1 }, () => []);
  for (const n of NODES) columns[rank.get(n.id)!].push(n.id);

  const order = new Map<string, number>();
  columns[0].forEach((id, i) => order.set(id, i));
  for (let c = 1; c < columns.length; c++) {
    const score = (id: string) => {
      const prev = EDGES.filter((e) => e.to === id && order.has(e.from)).map((e) => order.get(e.from)! / columns[rank.get(e.from)!].length);
      return prev.length ? prev.reduce((a, b) => a + b, 0) / prev.length : 0.5;
    };
    columns[c].sort((a, b) => score(a) - score(b));
    columns[c].forEach((id, i) => order.set(id, i));
  }

  const tallest = Math.max(...columns.map((c) => c.length));
  const height = PAD * 2 + tallest * NODE_H + (tallest - 1) * GAP_Y;
  const width = PAD * 2 + columns.length * NODE_W + (columns.length - 1) * GAP_X;

  const placed: Record<string, Placed> = {};
  columns.forEach((ids, col) => {
    const total = ids.length * NODE_H + (ids.length - 1) * GAP_Y;
    const top = (height - total) / 2;
    ids.forEach((id, i) => {
      placed[id] = { ...NODE_BY_ID[id], col, x: PAD + col * (NODE_W + GAP_X), y: top + i * (NODE_H + GAP_Y) };
    });
  });
  return { placed, width, height, last };
}

const LAYOUT = layout();

function edgePath(from: Placed, to: Placed) {
  const x1 = from.x + NODE_W;
  const y1 = from.y + NODE_H / 2;
  const x2 = to.x - 4;
  const y2 = to.y + NODE_H / 2;
  const dx = Math.max(28, (x2 - x1) / 2);
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
}

/** Neighbours of a node (both directions), including itself. */
function related(id: string) {
  const ids = new Set([id]);
  for (const e of EDGES) {
    if (e.from === id) ids.add(e.to);
    if (e.to === id) ids.add(e.from);
  }
  return ids;
}

export function ConnectionMap({
  pinned,
  onPin,
  onOpenCard,
}: {
  pinned: string | null;
  onPin: (id: string | null) => void;
  onOpenCard: (id: string) => void;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const active = hover ?? pinned;
  const near = useMemo(() => (active ? related(active) : null), [active]);
  const { placed, width, height, last } = LAYOUT;
  const shown = active ? placed[active] : null;

  function onKey(event: KeyboardEvent, id: string) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onPin(pinned === id ? null : id);
    } else if (event.key === "Escape") {
      onPin(null);
    }
  }

  return (
    <div className="ep-map" data-active={active ? true : undefined}>
      <ul className="ep-map__legend" aria-label="Forklaring">
        <li>
          <span className="ep-map__key ep-map__key--rest" aria-hidden /> REST-kall
        </li>
        <li>
          <span className="ep-map__key ep-map__key--event" aria-hidden /> Kafka-hendelse
        </li>
        <li>
          <span className="ep-map__swatch" data-tone="accent" aria-hidden /> Kjernetjeneste
        </li>
        <li>
          <span className="ep-map__swatch" data-tone="success" aria-hidden /> Hendelsesdrevet
        </li>
        <li>
          <span className="ep-map__swatch ep-map__swatch--pill" data-tone="meta-purple" aria-hidden /> Kafka-topic
        </li>
        <li>
          <span className="ep-map__swatch ep-map__swatch--dashed" data-tone="neutral" aria-hidden /> Eksternt system
        </li>
      </ul>

      <div className="ep-map__scroll">
        <svg
          className="ep-map__svg"
          viewBox={`0 0 ${width} ${height}`}
          role="group"
          aria-label="Kart over hvordan tjenestene, Kafka-topicene og de eksterne systemene henger sammen"
          onMouseLeave={() => setHover(null)}
        >
          <defs>
            <marker id="ep-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M 0 0 L 8 4 L 0 8 z" className="ep-map__arrow" />
            </marker>
          </defs>

          <g className="ep-map__lanes" aria-hidden>
            <text x={PAD} y={11} className="ep-map__lane">
              Inngang
            </text>
            <text x={placed[Object.keys(placed).find((id) => placed[id].col === last)!].x} y={11} className="ep-map__lane">
              Eksterne systemer og mottakere
            </text>
          </g>

          <g aria-hidden>
            {EDGES.map((e) => {
              const from = placed[e.from];
              const to = placed[e.to];
              const on = active ? e.from === active || e.to === active : false;
              const toSink = to.col === last;
              return (
                <path
                  key={`${e.from}->${e.to}`}
                  d={edgePath(from, to)}
                  className={`ep-map__edge ep-map__edge--${e.kind}${toSink ? " is-sink" : ""}${on ? " is-on" : ""}`}
                  data-tone={on ? (active === e.from ? from.tone : to.tone) : undefined}
                  markerEnd={e.kind === "rest" ? "url(#ep-arrow)" : undefined}
                />
              );
            })}
          </g>

          {Object.values(placed).map((n) => {
            const dim = near && !near.has(n.id);
            return (
              <g
                key={n.id}
                transform={`translate(${n.x} ${n.y})`}
                className={`ep-map__node ep-map__node--${n.kind}${dim ? " is-dim" : ""}${active === n.id ? " is-active" : ""}`}
                data-tone={n.tone}
                tabIndex={0}
                role="button"
                aria-pressed={pinned === n.id}
                aria-label={`${n.label}, ${KIND_LABEL[n.kind].toLowerCase()}`}
                onMouseEnter={() => setHover(n.id)}
                onFocus={() => setHover(n.id)}
                onBlur={() => setHover(null)}
                onClick={() => onPin(pinned === n.id ? null : n.id)}
                onKeyDown={(event) => onKey(event, n.id)}
              >
                <title>{n.summary}</title>
                <rect width={NODE_W} height={NODE_H} rx={n.kind === "topic" ? NODE_H / 2 : 8} />
                <text x={NODE_W / 2} y={NODE_H / 2} dominantBaseline="central" textAnchor="middle">
                  {n.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="ep-map__panel" aria-live="polite">
        {shown ? (
          <>
            <div className="ep-map__panel-head" data-tone={shown.tone}>
              <span className="ep-map__panel-kind">{KIND_LABEL[shown.kind]}</span>
              <strong className="ep-mono">{shown.kind === "topic" ? shown.id : shown.label}</strong>
              {pinned && (
                <button type="button" className="ep-map__clear" onClick={() => onPin(null)}>
                  Nullstill
                </button>
              )}
            </div>
            <p className="ep-map__panel-text">{shown.summary}</p>
            <p className="ep-map__panel-meta ep-mono">
              {incoming(shown.id).length} inn · {outgoing(shown.id).length} ut
            </p>
            {shown.kind === "app" && (
              <button type="button" className="ep-map__open" onClick={() => onOpenCard(shown.id)}>
                Åpne kortet for {shown.label} →
              </button>
            )}
          </>
        ) : (
          <p className="ep-map__panel-text ep-map__panel-hint">
            Hold musepekeren over en boks for å se hva den henger sammen med. Klikk for å låse markeringen.
          </p>
        )}
      </div>
    </div>
  );
}
