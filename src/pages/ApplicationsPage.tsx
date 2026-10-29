import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { flushSync } from "react-dom";
import { Button, Chips, Heading, Search, Tag } from "@navikt/ds-react";
import { ArrowRightIcon, ExternalLinkIcon } from "@navikt/aksel-icons";
import { ConnectionMap } from "../components/ConnectionMap";
import { JumpNav, SectionHead, type JumpItem } from "../components/PageSections";
import {
  APPLICATIONS,
  CATEGORIES,
  EXTERNALS,
  EXTERNAL_COUNT,
  LIBRARY_COUNT,
  SERVICES,
  TONE_BY_CATEGORY,
  TOPICS,
  TOPIC_COUNT,
  findApplication,
  repoUrl,
  type Application,
  type Category,
} from "../lib/applications";

type Filter = { id: string; label: string; test: (app: Application) => boolean };

const FILTERS: Filter[] = [
  { id: "kafka", label: "Kafka", test: (a) => Boolean(a.consumes?.length || a.produces?.length) },
  { id: "eux", label: "EUX", test: (a) => Boolean(a.calls?.includes("EUX-RINA-API")) },
  { id: "pesys", label: "Pesys", test: (a) => Boolean(a.calls?.includes("Pesys")) },
  { id: "pdl", label: "PDL", test: (a) => Boolean(a.calls?.includes("PDL")) },
];

const SECTIONS: { id: Category; eyebrow: string; lead: string }[] = [
  {
    id: "kjerne",
    eyebrow: "Synkront",
    lead: "Tjenestene saksbehandleren møter direkte. Brukerflaten snakker med to API-er, og fagmodulen orkestrerer resten mot EUX og fagsystemene.",
  },
  {
    id: "hendelse",
    eyebrow: "Asynkront",
    lead: "Arbeidere som reagerer på hendelser fra Kafka: SED-er som sendes og mottas, og personhendelser fra PDL. De journalfører, oppretter oppgaver og krav og lager statistikk.",
  },
];

const JUMP: JumpItem[] = [
  { id: "kart", label: "Kart" },
  { id: "kjerne", label: "Kjernetjenester" },
  { id: "hendelse", label: "Hendelsesdrevne" },
  { id: "biblioteker", label: "Biblioteker og verktøy" },
];

const SERVICE_IDS = new Set(SERVICES.map((a) => a.id));
const LIBRARIES = APPLICATIONS.filter((a) => a.category === "bibliotek");
const TOOLS = APPLICATIONS.filter((a) => a.category === "verktoy");
const CORE_COUNT = SERVICES.filter((a) => a.category === "kjerne").length;

const calledBy = (id: string) => SERVICES.filter((a) => a.calls?.includes(id)).map((a) => a.id);
const librariesOf = (id: string) => LIBRARIES.filter((l) => l.usedBy?.includes(id)).map((l) => l.id);

function matches(app: Application, query: string) {
  if (!query) return true;
  const haystack = [app.id, app.name, app.tech, app.summary, ...(app.consumes ?? []), ...(app.produces ?? []), ...(app.calls ?? [])]
    .join(" ")
    .toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .every((word) => haystack.includes(word));
}

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" });
}

export function ApplicationsPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<string | null>(null);
  const [open, setOpen] = useState<Set<string>>(() => new Set());
  const [flash, setFlash] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);

  const visible = useMemo(() => {
    const test = FILTERS.find((f) => f.id === filter)?.test ?? (() => true);
    return SERVICES.filter((a) => test(a) && matches(a, query.trim()));
  }, [filter, query]);

  const filtered = Boolean(query.trim() || filter);
  const allOpen = visible.length > 0 && visible.every((a) => open.has(a.id));

  /** Opens a card, clearing any filter that hides it, then scrolls to it and flashes it. */
  const jumpTo = useCallback((id: string, push = true) => {
    flushSync(() => {
      setQuery("");
      setFilter(null);
      setOpen((prev) => new Set(prev).add(id));
      setFlash(null);
    });
    setFlash(id);
    if (push && window.location.hash !== `#${id}`) window.history.pushState(null, "", `#${id}`);
    scrollToId(id);
  }, []);

  function showInMap(id: string) {
    setPinned(id);
    scrollToId("kart");
  }

  function toggle(id: string) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function reset() {
    setQuery("");
    setFilter(null);
  }

  useEffect(() => {
    function fromHash() {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (SERVICE_IDS.has(id)) jumpTo(id, false);
    }
    fromHash();
    window.addEventListener("hashchange", fromHash);
    window.addEventListener("popstate", fromHash);
    return () => {
      window.removeEventListener("hashchange", fromHash);
      window.removeEventListener("popstate", fromHash);
    };
  }, [jumpTo]);

  return (
    <article className="ep-page ep-page--wide">
      <Hero />

      <JumpNav items={JUMP} />

      <section id="kart" className="ep-arch-section" aria-labelledby="kart-tittel">
        <SectionHead
          eyebrow="Oversikt"
          title="Slik henger det sammen"
          titleId="kart-tittel"
          lead="Hendelser kommer inn til venstre og flyter mot høyre: via tjenestene og de interne topicene ut til fagsystemene og datavarehuset. Heltrukken linje med pil er et REST-kall, stiplet linje er en Kafka-hendelse."
        />
        <ConnectionMap pinned={pinned} onPin={setPinned} onOpenCard={(id) => jumpTo(id)} />
      </section>

      <div className="ep-apps-toolbar" role="search">
        <Search
          label="Søk i tjenestene"
          hideLabel
          variant="simple"
          size="small"
          placeholder="Søk etter navn, topic eller system"
          value={query}
          onChange={setQuery}
          className="ep-apps-toolbar__search"
        />
        <Chips size="small" aria-label="Vis bare tjenester som bruker">
          {FILTERS.map((f) => (
            <Chips.Toggle key={f.id} selected={filter === f.id} checkmark={false} onClick={() => setFilter(filter === f.id ? null : f.id)}>
              {f.label}
            </Chips.Toggle>
          ))}
        </Chips>
        <span className="ep-apps-toolbar__count ep-mono" aria-live="polite">
          {visible.length} av {SERVICES.length}
        </span>
        <div className="ep-apps-toolbar__actions">
          {filtered && (
            <Button size="xsmall" variant="tertiary" onClick={reset}>
              Nullstill
            </Button>
          )}
          <Button
            size="xsmall"
            variant="secondary"
            onClick={() => setOpen(allOpen ? new Set() : new Set(visible.map((a) => a.id)))}
          >
            {allOpen ? "Lukk alle" : "Åpne alle"}
          </Button>
        </div>
      </div>

      {visible.length === 0 && (
        <p className="ep-apps-empty">
          Ingen tjenester matcher søket.{" "}
          <button type="button" className="ep-linkbutton" onClick={reset}>
            Nullstill filteret
          </button>
        </p>
      )}

      {SECTIONS.map((s, index) => {
        const category = CATEGORIES.find((c) => c.id === s.id)!;
        const all = SERVICES.filter((a) => a.category === s.id);
        const apps = visible.filter((a) => a.category === s.id);
        if (apps.length === 0) return null;
        return (
          <section key={s.id} id={s.id} className="ep-arch-section" data-tone={TONE_BY_CATEGORY[s.id]} aria-labelledby={`${s.id}-tittel`}>
            <SectionHead
              eyebrow={`Lag ${index + 1} · ${s.eyebrow} · ${apps.length} av ${all.length}`}
              title={category.label}
              titleId={`${s.id}-tittel`}
              lead={s.lead}
            />
            <ul className="ep-apps-grid">
              {apps.map((app) => (
                <li key={app.id}>
                  <AppCard
                    app={app}
                    open={open.has(app.id)}
                    flash={flash === app.id}
                    onToggle={() => toggle(app.id)}
                    onJump={jumpTo}
                    onShowInMap={() => showInMap(app.id)}
                  />
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <section id="biblioteker" className="ep-arch-section" aria-labelledby="biblioteker-tittel">
        <SectionHead
          eyebrow={`Delt kode · ${LIBRARY_COUNT} biblioteker`}
          title="Biblioteker og verktøy"
          titleId="biblioteker-tittel"
          lead="Bibliotekene publiseres til GitHub Packages og hentes inn med Gradle. Verktøyene kjører ved siden av tjenestene."
        />
        <ul className="ep-apps-libs">
          {[...LIBRARIES, ...TOOLS].map((lib) => (
            <li key={lib.id}>
              <LibraryCard lib={lib} onJump={jumpTo} />
            </li>
          ))}
        </ul>
      </section>

      <p className="ep-page__footnote">
        Kilden er <code>architecture.md</code> i meta-repoet. Endrer du en applikasjon, oppdater begge steder.
      </p>
    </article>
  );
}

/* ── Hero ──────────────────────────────────────────────────────────────── */

function Hero() {
  const stats = [
    { n: SERVICES.length, label: "tjenester", sub: `${CORE_COUNT} synkrone · ${SERVICES.length - CORE_COUNT} hendelsesdrevne` },
    { n: TOPIC_COUNT, label: "Kafka-topics", sub: `${Object.values(TOPICS).filter((t) => t.scope === "inn").length} inn · ${Object.values(TOPICS).filter((t) => t.scope !== "inn").length} egne` },
    { n: EXTERNAL_COUNT, label: "eksterne systemer", sub: "EUX, Pesys, PDL, Joark …" },
    { n: LIBRARY_COUNT, label: "biblioteker", sub: "ep-eux, ep-personoppslag …" },
  ];
  const flows = [
    { href: "#kart", tone: "meta-purple", title: "Se kartet", text: "Hvem kaller hvem, og hvilke topics binder tjenestene sammen." },
    { href: "#hendelse", tone: "success", title: "Følg en SED", text: "Fra sedsendt og sedmottatt til journalpost, oppgave og krav." },
    { href: "#biblioteker", tone: "warning", title: "Delt kode", text: "Bibliotekene alle tjenestene bygger på." },
  ];

  return (
    <header className="ep-arch-hero">
      <div className="ep-arch-hero__text">
        <p className="ep-eyebrow">Applikasjoner</p>
        <Heading level="1" size="xlarge" className="ep-arch-hero__title">
          Tjenestene i EESSI Pensjon
        </Heading>
        <p className="ep-arch-hero__lead">
          Hva hver tjeneste har ansvar for, hvilke hendelser den lytter på og hvem den snakker med. Alt kjører på NAIS i
          GCP og er bygget med Kotlin og Spring Boot, bortsett fra brukerflaten.
        </p>
      </div>

      <HeroArt />

      <dl className="ep-arch-stats">
        {stats.map((s) => (
          <div key={s.label} className="ep-arch-stat">
            <dt className="ep-arch-stat__label">{s.label}</dt>
            <dd className="ep-arch-stat__n">{s.n}</dd>
            <dd className="ep-arch-stat__sub ep-mono">{s.sub}</dd>
          </div>
        ))}
      </dl>

      <ul className="ep-arch-flows">
        {flows.map((f) => (
          <li key={f.href}>
            <a href={f.href} className="ep-arch-flow" data-tone={f.tone}>
              <span className="ep-arch-flow__title">{f.title}</span>
              <span className="ep-arch-flow__text">{f.text}</span>
              <ArrowRightIcon aria-hidden className="ep-arch-flow__arrow" />
            </a>
          </li>
        ))}
      </ul>
    </header>
  );
}

/** Three isometric layers, one dot per application, echoing the eux portal. */
function HeroArt() {
  const planes = [
    { label: "Kjerne", tone: "accent", count: CORE_COUNT },
    { label: "Hendelser", tone: "success", count: SERVICES.length - CORE_COUNT },
    { label: "Biblioteker", tone: "warning", count: LIBRARY_COUNT },
  ];
  return (
    <div className="ep-arch-hero__art" aria-hidden>
      {planes.map((p, i) => (
        <div key={p.label} className="ep-plane" data-tone={p.tone} style={{ "--i": i } as CSSProperties}>
          <div className="ep-plane__face">
            {Array.from({ length: p.count }, (_, d) => (
              <span key={d} className="ep-plane__dot" style={{ "--d": d } as CSSProperties} />
            ))}
          </div>
          <span className="ep-plane__label">{p.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Cards ─────────────────────────────────────────────────────────────── */

function AppCard({
  app,
  open,
  flash,
  onToggle,
  onJump,
  onShowInMap,
}: {
  app: Application;
  open: boolean;
  flash: boolean;
  onToggle: () => void;
  onJump: (id: string) => void;
  onShowInMap: () => void;
}) {
  const relations = [
    { label: "Kalles av", values: calledBy(app.id) },
    { label: "Hendelser inn", values: app.consumes ?? [] },
    { label: "Kaller", values: app.calls ?? [] },
    { label: "Hendelser ut", values: app.produces ?? [] },
    { label: "Biblioteker", values: librariesOf(app.id) },
  ].filter((r) => r.values.length > 0);
  const inbound = calledBy(app.id).length + (app.consumes?.length ?? 0);
  const outbound = (app.calls?.length ?? 0) + (app.produces?.length ?? 0);
  const bodyId = `${app.id}-detaljer`;

  return (
    <article
      id={app.id}
      className={`ep-apps-card${open ? " is-open" : ""}${flash ? " is-flash" : ""}`}
      data-tone={TONE_BY_CATEGORY[app.category]}
      aria-labelledby={`${app.id}-tittel`}
    >
      <button type="button" className="ep-apps-card__toggle" aria-expanded={open} aria-controls={bodyId} onClick={onToggle}>
        <span className="ep-apps-card__top">
          <span className="ep-apps-card__icon" aria-hidden>
            <app.Icon />
          </span>
          <span className="ep-apps-card__name ep-mono" id={`${app.id}-tittel`}>
            {app.id.replace(/^eessi-pensjon-/, "")}
          </span>
          <Tag size="xsmall" variant="moderate" data-color="neutral" className="ep-apps-card__tag">
            {app.tech.split(" / ")[0]}
          </Tag>
        </span>
        <span className="ep-apps-card__summary">{app.summary}</span>
        <span className="ep-apps-card__meta ep-mono">
          {inbound} inn · {outbound} ut
          <span className="ep-apps-card__chevron" aria-hidden />
        </span>
      </button>

      <div className="ep-apps-card__body" id={bodyId} inert={!open}>
        <div className="ep-apps-card__inner">
          <dl className="ep-apps-rels">
            {relations.map((r) => (
              <div key={r.label}>
                <dt>{r.label}</dt>
                <dd>
                  {r.values.map((v) => (
                    <RelationChip key={v} value={v} onJump={onJump} />
                  ))}
                </dd>
              </div>
            ))}
          </dl>
          <p className="ep-apps-card__stack ep-mono">{app.tech}</p>
          <div className="ep-apps-card__links">
            <button type="button" className="ep-linkbutton" onClick={onShowInMap}>
              Vis i kartet
            </button>
            <a href={repoUrl(app)} target="_blank" rel="noreferrer">
              GitHub <ExternalLinkIcon title="åpnes i ny fane" />
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}

function RelationChip({ value, onJump }: { value: string; onJump: (id: string) => void }) {
  const app = findApplication(value);
  if (app && SERVICE_IDS.has(app.id)) {
    return (
      <button type="button" className="ep-apps-chip" data-tone={TONE_BY_CATEGORY[app.category]} onClick={() => onJump(app.id)}>
        {app.id.replace(/^eessi-pensjon-/, "")}
      </button>
    );
  }
  if (app) {
    return (
      <a className="ep-apps-chip" data-tone={TONE_BY_CATEGORY[app.category]} href={repoUrl(app)} target="_blank" rel="noreferrer">
        {app.id}
      </a>
    );
  }
  if (TOPICS[value]) {
    return (
      <span className="ep-apps-chip ep-apps-chip--topic" title={`${value}: ${TOPICS[value].summary}`}>
        {TOPICS[value].label}
      </span>
    );
  }
  return (
    <span className="ep-apps-chip ep-apps-chip--external" title={EXTERNALS[value]}>
      {value}
    </span>
  );
}

function LibraryCard({ lib, onJump }: { lib: Application; onJump: (id: string) => void }) {
  return (
    <article className="ep-apps-lib" data-tone={TONE_BY_CATEGORY[lib.category]}>
      <div className="ep-apps-lib__head">
        <a href={repoUrl(lib)} target="_blank" rel="noreferrer" className="ep-apps-lib__name ep-mono">
          {lib.id}
        </a>
        <span className="ep-apps-lib__tech">{lib.category === "verktoy" ? "Verktøy" : lib.tech}</span>
      </div>
      <p className="ep-apps-lib__text">{lib.summary}</p>
      {lib.usedBy && (
        <div className="ep-apps-lib__used">
          <span className="ep-apps-lib__label">Brukes av</span>
          {lib.usedBy.map((v) => (
            <RelationChip key={v} value={v} onJump={onJump} />
          ))}
        </div>
      )}
    </article>
  );
}
