import { useId, useState, type ComponentType, type CSSProperties, type ReactNode, type SVGProps } from "react";
import { BodyShort, Heading, Tag } from "@navikt/ds-react";
import {
  ArchiveIcon,
  ArrowRightIcon,
  ArrowsCirclepathIcon,
  BriefcaseIcon,
  BucketIcon,
  Buildings3Icon,
  CheckmarkIcon,
  CloudIcon,
  CompassIcon,
  DatabaseIcon,
  ExclamationmarkTriangleIcon,
  ExternalLinkIcon,
  FunnelIcon,
  GlobeIcon,
  HeartIcon,
  InboxIcon,
  LayersIcon,
  LightningIcon,
  LinkIcon,
  PersonIcon,
  ShieldLockIcon,
} from "@navikt/aksel-icons";
import { JumpNav, SectionHead, type JumpItem } from "../components/PageSections";
import { ArchitectureMap } from "../components/ArchitectureMap";
import {
  APPLICATIONS,
  EXTERNAL_COUNT,
  SERVICES,
  TOPICS,
  TOPIC_COUNT,
  findApplication,
  type Tone,
} from "../lib/applications";
import { useReveal } from "../lib/motion";

/*
 * The architecture of EESSI Pensjon, mostly as diagrams. App, topic and
 * library data comes from lib/applications.ts; the flows below are taken
 * from the code (listeners, services) and the nais manifests in each repo.
 */

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

const JUMP: JumpItem[] = [
  { id: "kart", label: "Kart" },
  { id: "lagene", label: "Lagene" },
  { id: "synkront", label: "Synkront" },
  { id: "asynkront", label: "Asynkront" },
  { id: "journalforing", label: "Journalføring" },
  { id: "kafka", label: "Kafka" },
  { id: "plattform", label: "Plattform" },
  { id: "beslutninger", label: "Beslutninger" },
];

const CORE = SERVICES.filter((a) => a.category === "kjerne");
const WORKERS = SERVICES.filter((a) => a.category === "hendelse");
const KOTLIN_SERVICES = SERVICES.filter((a) => a.tech.startsWith("Kotlin"));
const LIBRARIES = APPLICATIONS.filter((a) => a.category === "bibliotek");

const appHref = (id: string) => `/applikasjoner#${id}`;
const appName = (id: string) => findApplication(id)?.name ?? id;
const topicLabel = (id: string) => TOPICS[id]?.label ?? id;
const vars = (v: Record<string, string | number>) => v as CSSProperties;

export function ArchitecturePage() {
  const ref = useReveal<HTMLElement>();

  return (
    <article ref={ref} className="ep-page ep-page--wide ep-archx">
      <Hero />

      <JumpNav items={JUMP} />

      <Section
        id="kart"
        tone="accent"
        eyebrow="Arkitekturkart"
        title="Hele systemet på ett kart"
        lead="Saksbehandleren jobber i den øverste rekken, og SED-ene kommer tilbake fra RINA i den nederste. Hold over en boks for å se hva den henger sammen med."
      >
        <ArchitectureMap />
      </Section>

      <Section
        id="lagene"
        tone="accent"
        eyebrow="Lagene"
        title="Fire lag, to retninger"
        lead="EESSI Pensjon ligger mellom EUX-plattformen og Nav sine fagsystemer. Vi snakker aldri direkte med utlandet; alt går via EUX."
      >
        <LayerDiagram />
      </Section>

      <Section
        id="synkront"
        tone="accent"
        eyebrow="Synkront"
        title="Når saksbehandleren klikker"
        lead="Saksbehandleren åpner EESSI Pensjon fra Pesys eller Gjenny. Fagmodulen er navet: den henter BUC-er fra EUX og ber prefill fylle ut nye SED-er."
      >
        <SequenceDiagram />
        <ul className="ep-archx-notes">
          <Note Icon={ShieldLockIcon} title="Token per mål">
            UI-serveren bak Wonderwall veksler brukerens token (OBO) for <code>/fagmodul</code> og <code>/frontend</code>.
          </Note>
          <Note Icon={LinkIcon} title="Fagmodulen samler alt">
            BUC, SED, prefill, vedlegg fra SAF, Pesys, Gjenny, person og landkoder.
          </Note>
          <Note Icon={DatabaseIcon} title="Saksbehandling-API">
            Brukerinfo og tilstand som lagres i en GCP-bøtte. Ingen Kafka.
          </Note>
        </ul>
      </Section>

      <Section
        id="asynkront"
        tone="success"
        eyebrow="Asynkront"
        title="Når en SED sendes eller mottas"
        lead="EUX publiserer en hendelse for hver SED. Flere apper leser den samme hendelsen, hver for seg og uten å vente på hverandre."
      >
        <EventRails />
      </Section>

      <Section
        id="journalforing"
        tone="success"
        eyebrow="Dypdykk"
        title="Journalføringsløypa"
        lead="Den viktigste lytteren. Hver SED går gjennom de samme stegene, én melding om gangen."
      >
        <JournalPipeline />
      </Section>

      <Section
        id="kafka"
        tone="meta-purple"
        eyebrow="Kafka"
        title={`${TOPIC_COUNT} topics binder det sammen`}
        lead="Tre kommer utenfra, tre bruker vi mellom våre egne apper, og to publiserer vi for andre team."
      >
        <TopicBoard />
      </Section>

      <Section
        id="plattform"
        tone="warning"
        eyebrow="Plattform og tilgang"
        title="Hvem får lov, og hvor kjører det"
        lead="Tilgang avgjøres av systemet som eier dataene. Derfor sender vi brukerens kontekst videre der vi kan (ADR 0002)."
      >
        <TokenChain />
        <RuntimeTiles />
        <LibraryMatrix />
      </Section>

      <Section
        id="beslutninger"
        tone="neutral"
        eyebrow="Beslutninger"
        title="Arkitekturbeslutninger"
        lead="ADR-ene i meta-repoet forklarer hvorfor ting er som de er. Flere er fortsatt utkast."
      >
        <AdrGrid />
        <Heading level="3" size="small" className="ep-archx-subhead">
          Verdt å vite
        </Heading>
        <Pitfalls />
      </Section>

      <p className="ep-page__footnote">
        Bygget på koden (Kafka-lyttere og tjenester) og <code>nais/prod-gcp.yml</code> i hvert repo. Apper, topics og
        biblioteker deles med <a href="/applikasjoner">Applikasjoner</a>.
      </p>
    </article>
  );
}

function Section({
  id,
  tone,
  eyebrow,
  title,
  lead,
  children,
}: {
  id: string;
  tone: Tone;
  eyebrow: string;
  title: string;
  lead: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="ep-arch-section" data-tone={tone} aria-labelledby={`${id}-tittel`}>
      <div data-reveal>
        <SectionHead eyebrow={eyebrow} title={title} titleId={`${id}-tittel`} lead={lead} />
      </div>
      {children}
    </section>
  );
}

/* ── Hero ──────────────────────────────────────────────────────────────── */

function Hero() {
  const inn = Object.values(TOPICS).filter((t) => t.scope === "inn").length;
  const stats = [
    { n: SERVICES.length, label: "tjenester", sub: `${CORE.length} synkrone · ${WORKERS.length} lyttere` },
    { n: TOPIC_COUNT, label: "Kafka-topics", sub: `${inn} inn · ${TOPIC_COUNT - inn} egne` },
    { n: EXTERNAL_COUNT, label: "systemer vi bruker", sub: "EUX, Pesys, PDL, Joark …" },
    { n: ADRS.length, label: "beslutninger", sub: `${ADRS.filter((a) => a.status === "vedtatt").length} vedtatt` },
  ];
  const flows = [
    { href: "#synkront", tone: "accent", title: "Følg et klikk", text: "Fra skjermbildet via fagmodulen til EUX." },
    { href: "#journalforing", tone: "success", title: "Følg en SED", text: "Fra hendelse til journalpost, oppgave og krav." },
    { href: "#kafka", tone: "meta-purple", title: "Se topicene", text: "Hvem skriver og hvem leser." },
  ];

  return (
    <header className="ep-arch-hero">
      <div className="ep-arch-hero__text ep-enter">
        <p className="ep-eyebrow">Arkitektur</p>
        <Heading level="1" size="xlarge" className="ep-arch-hero__title">
          Slik henger EESSI Pensjon sammen
        </Heading>
        <p className="ep-arch-hero__lead">
          To spor: et synkront spor for saksbehandleren, og et hendelsesdrevet spor som reagerer på hver SED. Begge går via
          EUX og ender i Nav sine fagsystemer.
        </p>
      </div>

      <HeroArt />

      <dl className="ep-arch-stats">
        {stats.map((s, i) => (
          <div key={s.label} className="ep-arch-stat ep-enter" style={vars({ "--stagger": i + 1 })}>
            <dt className="ep-arch-stat__label">{s.label}</dt>
            <dd className="ep-arch-stat__n">{s.n}</dd>
            <dd className="ep-arch-stat__sub ep-mono">{s.sub}</dd>
          </div>
        ))}
      </dl>

      <ul className="ep-arch-flows">
        {flows.map((f, i) => (
          <li key={f.href} className="ep-enter" style={vars({ "--stagger": i + 4 })}>
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

const LAYERS: {
  id: string;
  title: string;
  short: string;
  sub: string;
  tone: Tone;
  Icon: IconType;
}[] = [
  { id: "utland", title: "Utlandet", short: "Utlandet", sub: "EU/EØS-land og Sveits", tone: "neutral", Icon: GlobeIcon },
  { id: "eux", title: "EUX-plattformen", short: "EUX", sub: "Nav sin inngang til EESSI", tone: "meta-purple", Icon: Buildings3Icon },
  { id: "ep", title: "EESSI Pensjon", short: "EESSI Pensjon", sub: "Våre apper på NAIS i GCP", tone: "accent", Icon: LayersIcon },
  { id: "nav", title: "Nav-fagsystemer", short: "Nav", sub: "Der dataene bor", tone: "success", Icon: DatabaseIcon },
];

/** The four layers as stacked bands with a packet travelling through them. */
function HeroArt() {
  return (
    <div className="ep-arch-hero__art ep-archx-art" aria-hidden>
      <span className="ep-archx-art__rail">
        <span className="ep-archx-art__packet" />
      </span>
      {LAYERS.map((l, i) => (
        <div key={l.id} className="ep-archx-art__band" data-tone={l.tone} style={vars({ "--i": i })}>
          <span className="ep-archx-art__icon">
            <l.Icon />
          </span>
          {l.short}
        </div>
      ))}
    </div>
  );
}

/* ── Layers ────────────────────────────────────────────────────────────── */

const NAV_SYSTEMS = ["Pesys", "Gjenny", "PDL", "Joark", "SAF", "Oppgave", "Norg2", "KRR", "Kodeverk", "DVH"];

function LayerDiagram() {
  const [utland, eux, ep, nav] = LAYERS;
  return (
    <div className="ep-archx-layers">
      <LayerColumn layer={utland} stagger={0}>
        <ul className="ep-archx-list">
          <li>Trygdemyndigheter i hvert land</li>
          <li>Eget tilgangspunkt til EESSI</li>
          <li>Utveksler SED-er i BUC-er</li>
        </ul>
      </LayerColumn>

      <Connector label="SED-er" stagger={1} />

      <LayerColumn layer={eux} stagger={2}>
        <ul className="ep-archx-list">
          <li>RINA, Nav sin saksbehandlingsløsning for EESSI</li>
          <li>
            <code>eux-rina-api</code> for kall
          </li>
          <li>Kafka-hendelser når SED-er sendes og mottas</li>
        </ul>
      </LayerColumn>

      <Connector label="REST og Kafka" stagger={3} />

      <LayerColumn layer={ep} stagger={4} wide>
        <div className="ep-archx-tracks">
          <div className="ep-archx-track" data-tone="accent">
            <p className="ep-archx-track__title">Synkront</p>
            <ul className="ep-archx-apps">
              {CORE.map((a) => (
                <li key={a.id}>
                  <a href={appHref(a.id)}>
                    <a.Icon aria-hidden />
                    {a.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="ep-archx-track" data-tone="success">
            <p className="ep-archx-track__title">Lyttere på Kafka</p>
            <ul className="ep-archx-apps">
              {WORKERS.map((a) => (
                <li key={a.id}>
                  <a href={appHref(a.id)}>
                    <a.Icon aria-hidden />
                    {a.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </LayerColumn>

      <Connector label="REST" stagger={5} />

      <LayerColumn layer={nav} stagger={6}>
        <ul className="ep-archx-pills">
          {NAV_SYSTEMS.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </LayerColumn>
    </div>
  );
}

function LayerColumn({
  layer,
  stagger,
  wide,
  children,
}: {
  layer: (typeof LAYERS)[number];
  stagger: number;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={`ep-archx-layer${wide ? " ep-archx-layer--wide" : ""}`}
      data-tone={layer.tone}
      data-reveal
      style={vars({ "--stagger": stagger })}
    >
      <div className="ep-archx-layer__head">
        <span className="ep-archx-layer__icon">
          <layer.Icon aria-hidden />
        </span>
        <div>
          <p className="ep-archx-layer__title">{layer.title}</p>
          <p className="ep-archx-layer__sub">{layer.sub}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function Connector({ label, stagger }: { label: string; stagger: number }) {
  return (
    <div className="ep-archx-connector" data-reveal style={vars({ "--stagger": stagger })}>
      <span className="ep-archx-connector__line" aria-hidden>
        <span className="ep-archx-connector__dot" />
        <span className="ep-archx-connector__dot ep-archx-connector__dot--back" />
      </span>
      <span className="ep-archx-connector__label">{label}</span>
    </div>
  );
}

/* ── Sequence diagram ──────────────────────────────────────────────────── */

const LIFELINES: { label: string; tone: Tone }[] = [
  { label: "Saksbehandler", tone: "neutral" },
  { label: "Saksbehandling-UI", tone: "accent" },
  { label: "Fagmodul", tone: "accent" },
  { label: "Prefill", tone: "accent" },
  { label: "Nav-fagsystemer", tone: "success" },
  { label: "EUX / RINA", tone: "meta-purple" },
];

const MESSAGES: { from: number; to: number; label: string; reply?: boolean }[] = [
  { from: 0, to: 1, label: "Åpner saken fra Pesys eller Gjenny" },
  { from: 1, to: 2, label: "/fagmodul med OBO-token" },
  { from: 2, to: 5, label: "Henter BUC-er for saken" },
  { from: 2, to: 1, label: "BUC-er og SED-er", reply: true },
  { from: 2, to: 3, label: "Ny SED: fyll ut" },
  { from: 3, to: 4, label: "Pesys, PDL, KRR, kodeverk" },
  { from: 3, to: 2, label: "Utfylt SED", reply: true },
  { from: 2, to: 5, label: "Oppretter og sender SED" },
];

function SequenceDiagram() {
  const arrowId = useId();
  const replyId = useId();
  const colX = (i: number) => 80 + i * 160;
  const rowY = (i: number) => 104 + i * 46;
  const height = rowY(MESSAGES.length - 1) + 36;

  return (
    <figure className="ep-archx-figure ep-archx-seq" data-reveal>
      <div className="ep-archx-seq__scroll">
        <svg viewBox={`0 0 960 ${height}`} className="ep-archx-seq__svg" aria-hidden>
          <defs>
            <marker id={arrowId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
              <path d="M0 0 10 5 0 10z" className="ep-archx-seq__head" />
            </marker>
            <marker id={replyId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
              <path d="M0 0 10 5 0 10z" className="ep-archx-seq__head ep-archx-seq__head--reply" />
            </marker>
          </defs>

          {LIFELINES.map((l, i) => (
            <g key={l.label} data-tone={l.tone} className="ep-archx-seq__life">
              <line x1={colX(i)} x2={colX(i)} y1={60} y2={height - 8} className="ep-archx-seq__stem" />
              <rect x={colX(i) - 70} y={14} width={140} height={40} rx={12} className="ep-archx-seq__box" />
              <text x={colX(i)} y={39} textAnchor="middle" className="ep-archx-seq__name">
                {l.label}
              </text>
            </g>
          ))}

          {MESSAGES.map((m, i) => {
            const dir = m.to > m.from ? 1 : -1;
            const x1 = colX(m.from) + dir * 14;
            const x2 = colX(m.to) - dir * 4;
            const y = rowY(i);
            return (
              <g key={i} className="ep-archx-seq__msg" style={vars({ "--i": i })}>
                <rect
                  x={Math.min(x1, x2) - 16}
                  y={y - 26}
                  width={Math.abs(x2 - x1) + 32}
                  height={36}
                  className="ep-archx-seq__hit"
                />
                <line
                  x1={x1}
                  x2={x2}
                  y1={y}
                  y2={y}
                  pathLength={1}
                  markerEnd={`url(#${m.reply ? replyId : arrowId})`}
                  className={m.reply ? "ep-archx-seq__line ep-archx-seq__line--reply" : "ep-archx-seq__line"}
                />
                <text x={(x1 + x2) / 2} y={y - 9} textAnchor="middle" className="ep-archx-seq__label">
                  {m.label}
                </text>
                <circle cx={colX(m.from)} cy={y} r={10} className="ep-archx-seq__step" />
                <text x={colX(m.from)} y={y + 4} textAnchor="middle" className="ep-archx-seq__n">
                  {i + 1}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <ol className="ep-visually-hidden">
        {MESSAGES.map((m, i) => (
          <li key={i}>
            {LIFELINES[m.from].label} til {LIFELINES[m.to].label}: {m.label}
          </li>
        ))}
      </ol>
      <figcaption className="ep-archx-caption">Eksempel: åpne en sak og sende en ny SED.</figcaption>
    </figure>
  );
}

function Note({ Icon, title, children }: { Icon: IconType; title: string; children: ReactNode }) {
  return (
    <li className="ep-archx-note" data-reveal>
      <span className="ep-archx-note__icon">
        <Icon aria-hidden />
      </span>
      <div>
        <BodyShort weight="semibold">{title}</BodyShort>
        <BodyShort size="small" className="ep-archx-muted">
          {children}
        </BodyShort>
      </div>
    </li>
  );
}

/* ── Event rails ───────────────────────────────────────────────────────── */

type Outcome = { text: string; topic?: boolean; muted?: boolean };

const RAILS: { tier: string; rows: { app: string; note?: string; outcomes: Outcome[] }[] }[] = [
  {
    tier: "Hendelser utenfra",
    rows: [
      {
        app: "eessi-pensjon-journalforing",
        outcomes: [
          { text: "Journalpost i Joark" },
          { text: "eessipensjon.privat-oppgave", topic: true },
          { text: "eessipensjon.privat-krav-initialisering", topic: true },
        ],
      },
      { app: "eessi-pensjon-begrens-innsyn", outcomes: [{ text: "BUC markert som sensitiv i RINA" }] },
      {
        app: "eessi-pensjon-pdl-produsent",
        note: "3 lyttere",
        outcomes: [{ text: "Adresse og utenlandsk ident i PDL" }, { text: "eessipensjon.privat-oppgave", topic: true }],
      },
      {
        app: "eessi-pensjon-statistikk",
        outcomes: [{ text: "eessipensjon.public-statistikk", topic: true }, { text: "DVH" }],
      },
      {
        app: "eessi-pensjon-dodsmelding",
        outcomes: [{ text: "H070 klargjøres" }, { text: "sendes ikke ennå", muted: true }],
      },
    ],
  },
  {
    tier: "Interne topics",
    rows: [
      { app: "eessi-pensjon-oppgave", outcomes: [{ text: "Oppgave til saksbehandler" }] },
      { app: "eessi-pensjon-krav-initialisering", outcomes: [{ text: "Krav i Pesys (P2000, P2200)" }] },
    ],
  },
];

function EventRails() {
  let row = 0;
  return (
    <div className="ep-archx-rails">
      <div className="ep-archx-rails__legend" aria-hidden>
        <span>Leser</span>
        <span>App</span>
        <span>Resultat</span>
      </div>
      {RAILS.map((tier) => (
        <div key={tier.tier} className="ep-archx-rails__tier">
          <p className="ep-archx-rails__tier-title">{tier.tier}</p>
          <ul className="ep-archx-rails__rows">
            {tier.rows.map((r) => {
              const app = findApplication(r.app);
              const i = row++;
              return (
                <li key={r.app} className="ep-archx-rail" data-reveal style={vars({ "--stagger": i % 4, "--i": i })}>
                  <div className="ep-archx-rail__in">
                    {(app?.consumes ?? []).map((t) => (
                      <span key={t} className="ep-archx-topic" title={t}>
                        {topicLabel(t)}
                      </span>
                    ))}
                  </div>
                  <span className="ep-archx-rail__wire" aria-hidden>
                    <span className="ep-archx-rail__pulse" />
                  </span>
                  <a href={appHref(r.app)} className="ep-archx-rail__app">
                    {app && <app.Icon aria-hidden />}
                    <span>
                      {appName(r.app)}
                      {r.note && <small>{r.note}</small>}
                    </span>
                  </a>
                  <span className="ep-archx-rail__wire" aria-hidden>
                    <span className="ep-archx-rail__pulse ep-archx-rail__pulse--late" />
                  </span>
                  <div className="ep-archx-rail__out">
                    {r.outcomes.map((o) => (
                      <span
                        key={o.text}
                        className={o.topic ? "ep-archx-topic" : o.muted ? "ep-archx-outcome ep-archx-outcome--muted" : "ep-archx-outcome"}
                        title={o.topic ? o.text : undefined}
                      >
                        {o.topic ? topicLabel(o.text) : o.text}
                      </span>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

/* ── Journalføring pipeline ────────────────────────────────────────────── */

const STEPS: { Icon: IconType; title: string; text: string }[] = [
  { Icon: InboxIcon, title: "Les", text: "sedsendt og sedmottatt, én melding om gangen" },
  { Icon: FunnelIcon, title: "Filtrer", text: "Sektor P, pluss H_BUC_07, R_BUC_02 og M_BUC_02" },
  { Icon: PersonIcon, title: "Identifiser", text: "Finn personen i PDL, med adressebeskyttelse" },
  { Icon: BriefcaseIcon, title: "Finn sak", text: "Gjenny-sak fra SED-en, ellers Pesys via fagmodulen" },
  { Icon: CompassIcon, title: "Rut", text: "Tema og enhet med ep-routing og Norg2" },
  { Icon: ArchiveIcon, title: "Journalfør", text: "Journalpost i Joark, ferdigstilt hvis mulig" },
];

function JournalPipeline() {
  return (
    <div className="ep-archx-pipe" data-reveal>
      <ol className="ep-archx-pipe__steps">
        {STEPS.map((s, i) => (
          <li key={s.title} className="ep-archx-pipe__step" style={vars({ "--i": i })}>
            <span className="ep-archx-pipe__icon">
              <s.Icon aria-hidden />
            </span>
            <span className="ep-archx-pipe__n">{i + 1}</span>
            <p className="ep-archx-pipe__title">{s.title}</p>
            <p className="ep-archx-pipe__text">{s.text}</p>
          </li>
        ))}
      </ol>

      <div className="ep-archx-pipe__fork" aria-hidden>
        <span />
      </div>

      <div className="ep-archx-pipe__branches">
        <div className="ep-archx-branch" data-tone="success">
          <p className="ep-archx-branch__title">
            <CheckmarkIcon aria-hidden /> Mottatt og ferdigstilt
          </p>
          <ul>
            <li>
              Oppgave om å <b>behandle SED</b>
            </li>
            <li>
              P2000 og P2200: <b>krav</b> til Pesys via Kafka
            </li>
            <li>75 år eller eldre: kravet må opprettes manuelt</li>
          </ul>
        </div>
        <div className="ep-archx-branch" data-tone="warning">
          <p className="ep-archx-branch__title">
            <ExclamationmarkTriangleIcon aria-hidden /> Ikke ferdigstilt
          </p>
          <ul>
            <li>
              <b>Journalføringsoppgave</b> til enheten fra ruting
            </li>
            <li>Utgående SED uten person: journalposten avbrytes</li>
          </ul>
        </div>
        <div className="ep-archx-branch" data-tone="meta-purple">
          <p className="ep-archx-branch__title">
            <LightningIcon aria-hidden /> Alltid
          </p>
          <ul>
            <li>
              Hendelse til <code>public-automatisering</code>, så vi kan måle hvor mye som går automatisk
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ── Kafka topics ──────────────────────────────────────────────────────── */

const SCOPES: { id: "inn" | "intern" | "ut"; title: string; sub: string }[] = [
  { id: "inn", title: "Inn", sub: "Fra EUX og PDL" },
  { id: "intern", title: "Interne", sub: "Mellom våre apper" },
  { id: "ut", title: "Ut", sub: "Til andre team" },
];

function TopicBoard() {
  return (
    <div className="ep-archx-topics">
      {SCOPES.map((scope, col) => (
        <div key={scope.id} className="ep-archx-topics__col">
          <p className="ep-archx-topics__head">
            <span>{scope.title}</span> {scope.sub}
          </p>
          <ul>
            {Object.entries(TOPICS)
              .filter(([, t]) => t.scope === scope.id)
              .map(([id, t], i) => {
                const from = [...(t.source ? [t.source] : []), ...SERVICES.filter((a) => a.produces?.includes(id)).map((a) => a.name)];
                const to = [...SERVICES.filter((a) => a.consumes?.includes(id)).map((a) => a.name), ...(t.sink ? [t.sink] : [])];
                return (
                  <li key={id} className="ep-archx-tcard" data-reveal style={vars({ "--stagger": col + i })}>
                    <p className="ep-archx-tcard__label">
                      <span className="ep-archx-tcard__dot" aria-hidden />
                      {t.label}
                    </p>
                    <p className="ep-archx-tcard__id ep-mono">{id}</p>
                    <p className="ep-archx-tcard__text">{t.summary}</p>
                    <div className="ep-archx-tcard__flow">
                      <Parties label="Skrives av" names={from} />
                      <ArrowRightIcon aria-hidden className="ep-archx-tcard__arrow" />
                      <Parties label="Leses av" names={to} />
                    </div>
                  </li>
                );
              })}
          </ul>
        </div>
      ))}
    </div>
  );
}

function Parties({ label, names }: { label: string; names: string[] }) {
  return (
    <div className="ep-archx-parties">
      <span className="ep-visually-hidden">{label}: </span>
      {names.map((n) => (
        <span key={n} className="ep-archx-party">
          {n}
        </span>
      ))}
    </div>
  );
}

/* ── Platform ──────────────────────────────────────────────────────────── */

const CHAINS: { title: string; tone: Tone; nodes: string[]; hops: string[] }[] = [
  {
    title: "Saksbehandler",
    tone: "accent",
    nodes: ["Nettleser", "Wonderwall", "UI-server", "Fagmodul", "EUX, PDL, SAF, prefill"],
    hops: ["Entra ID", "sesjon", "OBO", "OBO"],
  },
  {
    title: "Uten bruker",
    tone: "success",
    nodes: ["Kafka", "Lytter-app", "Joark, Oppgave, PDL, EUX"],
    hops: ["Aiven", "client credentials"],
  },
];

function TokenChain() {
  return (
    <div className="ep-archx-chains">
      {CHAINS.map((c, ci) => (
        <div key={c.title} className="ep-archx-chain" data-tone={c.tone} data-reveal style={vars({ "--stagger": ci })}>
          <p className="ep-archx-chain__title">{c.title}</p>
          <ol className="ep-archx-chain__nodes">
            {c.nodes.map((n, i) => (
              <li key={n} className="ep-archx-chain__item">
                <span className="ep-archx-chain__node">{n}</span>
                {i < c.hops.length && (
                  <span className="ep-archx-chain__hop">
                    <span className="ep-archx-chain__token">{c.hops[i]}</span>
                    <span className="ep-archx-chain__wire" aria-hidden>
                      <span style={vars({ "--i": i })} />
                    </span>
                  </span>
                )}
              </li>
            ))}
          </ol>
        </div>
      ))}
      <p className="ep-archx-caption">
        Fagmodulen bruker systemtoken (client credentials) mot Pesys og noen EUX-endepunkter, der det ikke finnes en
        brukerkontekst å sende videre.
      </p>
    </div>
  );
}

const RUNTIME: { Icon: IconType; title: string; text: string }[] = [
  { Icon: CloudIcon, title: "NAIS på GCP", text: "prod-gcp og dev-gcp (q1 og q2), namespace eessipensjon" },
  { Icon: LightningIcon, title: "Kafka på Aiven", text: "Hendelser fra EUX og PDL, og interne topics mellom appene" },
  { Icon: BucketIcon, title: "GCP-bøtter", text: "Enkel lagring i sju av appene (ADR 0003)" },
  { Icon: ShieldLockIcon, title: "Entra ID", text: "API-ene krever token, og brukerkonteksten følger med" },
  { Icon: HeartIcon, title: "Helse og metrikker", text: "/actuator/health og /actuator/prometheus i Kotlin-appene" },
  { Icon: ArrowsCirclepathIcon, title: "Skalering", text: "UI 1–4, fagmodul og prefill 2–4, lytterne 1 replika" },
];

function RuntimeTiles() {
  return (
    <ul className="ep-archx-tiles">
      {RUNTIME.map((r, i) => (
        <li key={r.title} className="ep-archx-tile" data-reveal style={vars({ "--stagger": i % 3 })}>
          <span className="ep-archx-tile__icon">
            <r.Icon aria-hidden />
          </span>
          <p className="ep-archx-tile__title">{r.title}</p>
          <p className="ep-archx-tile__text">{r.text}</p>
        </li>
      ))}
    </ul>
  );
}

function LibraryMatrix() {
  const [col, setCol] = useState<string | null>(null);
  return (
    <figure className="ep-archx-figure ep-archx-matrix" data-reveal>
      <Heading level="3" size="small" className="ep-archx-subhead">
        Delte biblioteker
      </Heading>
      <div className="ep-archx-matrix__scroll" onMouseLeave={() => setCol(null)}>
        <table>
          <thead>
            <tr>
              <th scope="col">
                <span className="ep-visually-hidden">Bibliotek</span>
              </th>
              {KOTLIN_SERVICES.map((a) => (
                <th key={a.id} scope="col" data-active={col === a.id || undefined} onMouseEnter={() => setCol(a.id)}>
                  <span>{a.name}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {LIBRARIES.map((lib, r) => (
              <tr key={lib.id}>
                <th scope="row">
                  <a href={appHref(lib.id)} className="ep-mono">
                    {lib.name}
                  </a>
                </th>
                {KOTLIN_SERVICES.map((a, c) => {
                  const used = lib.usedBy?.includes(a.id) ?? false;
                  return (
                    <td key={a.id} data-active={col === a.id || undefined} onMouseEnter={() => setCol(a.id)}>
                      <span
                        className={used ? "ep-archx-matrix__dot is-used" : "ep-archx-matrix__dot"}
                        style={vars({ "--d": r + c })}
                        aria-hidden
                      />
                      <span className="ep-visually-hidden">{used ? "Ja" : "Nei"}</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <figcaption className="ep-archx-caption">
        Versjonene varierer mellom appene. Sjekk <code>build.gradle</code> før du antar at en rettelse er ute overalt.
      </figcaption>
    </figure>
  );
}

/* ── Decisions ─────────────────────────────────────────────────────────── */

type AdrStatus = "vedtatt" | "pågår" | "forslag" | "utkast";

const STATUS: Record<AdrStatus, { label: string; color: "success" | "info" | "warning" | "neutral" }> = {
  vedtatt: { label: "Vedtatt", color: "success" },
  pågår: { label: "Pågår", color: "info" },
  forslag: { label: "Forslag", color: "warning" },
  utkast: { label: "Utkast", color: "neutral" },
};

const ADRS: { n: string; file: string; title: string; status: AdrStatus; text: string }[] = [
  { n: "0001", file: "0001-Splitte-API.md", title: "Splitte API i SBS og FSS", status: "vedtatt", text: "To kodebaser, siden lite kode faktisk var delt." },
  { n: "0002", file: "0002-Tilgangsstyring.md", title: "Delegert tilgangskontroll", status: "vedtatt", text: "Brukerkonteksten sendes videre, og eieren av dataene avgjør." },
  { n: "0003", file: "0003-KeyValueStore.md", title: "Enkel lagring", status: "pågår", text: "Objektlagring framfor database. I dag GCP-bøtter." },
  { n: "0004", file: "0004-Utviklingshastighet.md", title: "Økt utviklingshastighet", status: "forslag", text: "Prioriterte tiltak for raskere og tryggere leveranser." },
  { n: "0005", file: "0005-Deling_av_kode.md", title: "Deling av kode", status: "utkast", text: "Hvordan dele integrasjonskode mellom repoene." },
  { n: "0006", file: "0006-PDL-produsent-i-flere-apper.md", title: "Én PDL-produsent", status: "vedtatt", text: "Én app med flere lyttere på samme topic." },
  { n: "0007", file: "0007-Korte-ned-tid-rinasaker-kall.md", title: "Raskere BUC-liste", status: "utkast", text: "Henting av rinasaker fra EUX tar 15–30 sekunder." },
  { n: "0008", file: "0008-Rammeverk-for-EP-lytter-apper.md", title: "Rammeverk for lytterne", status: "utkast", text: "Felles komponent som fjerner boilerplate i Kafka-appene." },
  { n: "0009", file: "0009-inkonsistent-api.md", title: "Konsistente feilmeldinger", status: "utkast", text: "Ett feilformat fra backend til frontend." },
  { n: "0010", file: "0010-Oppgaveruting.md", title: "Oppgaveruting", status: "utkast", text: "Rutingen var duplisert. Den ligger nå i ep-routing." },
  { n: "0011", file: "0011-Dodsmelding-som-egen-app.md", title: "Dødsmelding som egen app", status: "vedtatt", text: "H070 har motsatt dataflyt av pdl-produsent." },
];

function AdrGrid() {
  return (
    <ul className="ep-archx-adrs">
      {ADRS.map((a, i) => (
        <li key={a.n} data-reveal style={vars({ "--stagger": i % 4 })}>
          <a
            href={`https://github.com/navikt/eessi-pensjon/blob/master/docs/adr/${a.file}`}
            target="_blank"
            rel="noreferrer"
            className="ep-archx-adr"
            data-status={a.status}
          >
            <span className="ep-archx-adr__top">
              <span className="ep-archx-adr__n ep-mono">ADR {a.n}</span>
              <Tag size="xsmall" variant="moderate" data-color={STATUS[a.status].color}>
                {STATUS[a.status].label}
              </Tag>
            </span>
            <span className="ep-archx-adr__title">
              {a.title}
              <ExternalLinkIcon aria-hidden className="ep-archx-adr__ext" />
            </span>
            <span className="ep-archx-adr__text">{a.text}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

const PITFALLS: { title: string; text: string }[] = [
  {
    title: "Ingen rekkefølge",
    text: "Fire apper leser de samme SED-hendelsene i hver sin consumer group. Ingen av dem vet om de andre.",
  },
  {
    title: "Kjedede topics",
    text: "Oppgaver og krav går via interne topics. Henger en lytter etter, merkes det først lenger ned i kjeden.",
  },
  {
    title: "Alt går via EUX",
    text: "Er EUX nede eller tregt, merker både skjermbildet og lytterne det.",
  },
  {
    title: "Feil stopper lytteren",
    text: "Journalføringen leser én melding om gangen og stopper ved feil. Kjente dårlige meldinger hoppes over med offset i koden.",
  },
];

function Pitfalls() {
  return (
    <ul className="ep-archx-pitfalls">
      {PITFALLS.map((p, i) => (
        <li key={p.title} className="ep-archx-pitfall" data-reveal style={vars({ "--stagger": i })}>
          <ExclamationmarkTriangleIcon aria-hidden className="ep-archx-pitfall__icon" />
          <div>
            <p className="ep-archx-pitfall__title">{p.title}</p>
            <p className="ep-archx-pitfall__text">{p.text}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
