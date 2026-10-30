import type { ComponentType, SVGProps } from "react";
import {
  ArchiveIcon,
  BarChartIcon,
  BellIcon,
  BookIcon,
  ArrowRightLeftIcon,
  BriefcaseIcon,
  CaretDownCircleIcon,
  CogIcon,
  CompassIcon,
  DatabaseIcon,
  EarthIcon,
  EyeSlashIcon,
  FlagCrossIcon,
  GlobeIcon,
  MagnifyingGlassIcon,
  MonitorIcon,
  PackageIcon,
  PencilWritingIcon,
  PersonIcon,
  PersonPencilIcon,
  TableIcon,
  TasklistIcon,
  TerminalIcon,
} from "@navikt/aksel-icons";

/*
 * The applications, libraries and tools in EESSI Pensjon. Topics, producers and
 * consumers are verified against the @KafkaListener/KafkaTemplate code and the
 * nais/prod-gcp.yml files in each repo; library consumers come from build.gradle
 * (backend) and package.json / peerDependencies (frontend).
 * architecture.md in the meta repo describes the same, keep the two in sync.
 */

export type Category = "kjerne" | "hendelse" | "bibliotek" | "verktoy";

export type Application = {
  /** Repository name; also the anchor id on the page. */
  id: string;
  /** Short display name. */
  name: string;
  category: Category;
  tech: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  summary: string;
  /** Kafka topics the app listens to. */
  consumes?: string[];
  /** Kafka topics the app publishes to. */
  produces?: string[];
  /** Other EP apps (by id) and external systems it calls. */
  calls?: string[];
  /** For libraries: the EP apps (by id) that depend on it. */
  usedBy?: string[];
  /** For libraries: where it runs. Defaults to "backend". */
  stack?: "backend" | "frontend";
  /** For frontend libraries: the npm package name, when it differs from the repo. */
  npm?: string;
  /** Overrides the default github.com/navikt/<id> link. */
  repoUrl?: string;
};

export const CATEGORIES: { id: Category; label: string; description: string }[] = [
  {
    id: "kjerne",
    label: "Kjernetjenester",
    description: "Synkrone tjenester som saksbehandlerløsningen bruker direkte.",
  },
  {
    id: "hendelse",
    label: "Hendelsesdrevne tjenester",
    description: "Kafka-lyttere som reagerer når SED-er sendes eller mottas, eller når noe skjer i PDL.",
  },
  {
    id: "bibliotek",
    label: "Biblioteker",
    description: "Delte biblioteker som ikke deployes selv, men brukes av tjenestene over.",
  },
  {
    id: "verktoy",
    label: "Verktøy",
    description: "Interne verktøy for teamet.",
  },
];

const SED_SENDT = "eessibasis.sedsendt-v1";
const SED_MOTTATT = "eessibasis.sedmottatt-v1";
const LEESAH = "pdl.leesah-v1";
const OPPGAVE = "eessipensjon.privat-oppgave";
const KRAV = "eessipensjon.privat-krav-initialisering";
const PRIVAT_STATISTIKK = "eessipensjon.privat-statistikk";
const PUBLIC_STATISTIKK = "eessipensjon.public-statistikk";
const AUTOMATISERING = "eessipensjon.public-automatisering";

export const APPLICATIONS: Application[] = [
  // Core services
  {
    id: "eessi-pensjon-saksbehandling-ui",
    name: "Saksbehandling-UI",
    category: "kjerne",
    tech: "React / TypeScript / Vite",
    Icon: MonitorIcon,
    summary:
      "Skjermbildet der saksbehandlere oppretter og følger opp BUC-er og SED-er. En Express-server sender /frontend videre til saksbehandling-api og /fagmodul til fagmodulen.",
    calls: ["eessi-pensjon-saksbehandling-api", "eessi-pensjon-fagmodul"],
  },
  {
    id: "eessi-pensjon-fagmodul",
    name: "Fagmodul",
    category: "kjerne",
    tech: "Kotlin / Spring Boot",
    Icon: CogIcon,
    summary:
      "Hovedmodulen. Orkestrerer SED-operasjoner mot EUX og henter data fra Pesys, PDL, SAF og kodeverket. Ber prefill om forhåndsutfylte SED-er og publiserer statistikk på Kafka.",
    produces: [PRIVAT_STATISTIKK, AUTOMATISERING],
    calls: ["EUX-RINA-API", "eessi-pensjon-prefill", "Pesys", "PDL", "SAF", "Kodeverk"],
  },
  {
    id: "eessi-pensjon-prefill",
    name: "Prefill",
    category: "kjerne",
    tech: "Kotlin / Spring Boot",
    Icon: PencilWritingIcon,
    summary:
      "Fyller ut SED-er på forhånd med data fra pensjonsløsningen (Pesys), PDL, KRR og Etterlatte. Kalles av fagmodulen.",
    produces: [AUTOMATISERING],
    calls: ["Pesys", "PDL", "KRR", "Kodeverk", "Etterlatte"],
  },
  {
    id: "eessi-pensjon-saksbehandling-api",
    name: "Saksbehandling-API",
    category: "kjerne",
    tech: "Kotlin / Spring Boot",
    Icon: DatabaseIcon,
    summary:
      "API for data som bare frontend trenger: informasjon om innlogget bruker og tilstand som lagres i en GCP-bøtte.",
    calls: ["eessi-pensjon-fagmodul"],
  },

  // Event-driven workers
  {
    id: "eessi-pensjon-journalforing",
    name: "Journalføring",
    category: "hendelse",
    tech: "Kotlin / Spring Boot",
    Icon: ArchiveIcon,
    summary:
      "Journalfører pensjons-SED-er som sendes og mottas i Joark. Ber om oppgaver og nye krav via interne Kafka-topics.",
    consumes: [SED_SENDT, SED_MOTTATT],
    produces: [OPPGAVE, KRAV, AUTOMATISERING],
    calls: [
      "EUX-RINA-API",
      "eessi-pensjon-fagmodul",
      "Joark",
      "PDL",
      "SAF",
      "Norg2",
      "Nav Ansatt",
      "Pesys",
      "Etterlatte",
    ],
  },
  {
    id: "eessi-pensjon-oppgave",
    name: "Oppgave",
    category: "hendelse",
    tech: "Kotlin / Spring Boot",
    Icon: TasklistIcon,
    summary: "Oppretter og oppdaterer oppgaver i Nav sitt oppgavesystem for pensjonssaksbehandlere.",
    consumes: [OPPGAVE],
    calls: ["Oppgave", "SAF"],
  },
  {
    id: "eessi-pensjon-krav-initialisering",
    name: "Kravinitialisering",
    category: "hendelse",
    tech: "Kotlin / Spring Boot",
    Icon: BriefcaseIcon,
    summary: "Starter pensjonskrav i Pesys basert på innkomne EESSI-dokumenter.",
    consumes: [KRAV],
    calls: ["Pesys"],
  },
  {
    id: "eessi-pensjon-pdl-produsent",
    name: "PDL-produsent",
    category: "hendelse",
    tech: "Kotlin / Spring Boot",
    Icon: PersonPencilIcon,
    summary:
      "Oppdaterer persondata i PDL fra innkomne SED-er med tre lyttere: adresse, utenlandsk ident og ident for gjenlevende. Oppretter oppgave når noe må følges opp manuelt.",
    consumes: [SED_MOTTATT],
    produces: [OPPGAVE],
    calls: ["EUX-RINA-API", "PDL", "Person-mottak", "SAF", "Norg2"],
  },
  {
    id: "eessi-pensjon-begrens-innsyn",
    name: "Begrens innsyn",
    category: "hendelse",
    tech: "Kotlin / Spring Boot",
    Icon: EyeSlashIcon,
    summary:
      "Finner personer med adressebeskyttelse (kode 6/7) i SED-er og markerer BUC-en som sensitiv via eux-rina-api.",
    consumes: [SED_SENDT, SED_MOTTATT],
    calls: ["EUX-RINA-API", "PDL"],
  },
  {
    id: "eessi-pensjon-statistikk",
    name: "Statistikk",
    category: "hendelse",
    tech: "Kotlin / Spring Boot",
    Icon: BarChartIcon,
    summary: "Samler og publiserer statistikk om SED-behandlingen til rapportering (DVH).",
    consumes: [SED_SENDT, SED_MOTTATT, PRIVAT_STATISTIKK],
    produces: [PUBLIC_STATISTIKK],
    calls: ["EUX-RINA-API", "PDL"],
  },
  {
    id: "eessi-pensjon-dodsmelding",
    name: "Dødsmelding",
    category: "hendelse",
    tech: "Kotlin / Spring Boot",
    Icon: BellIcon,
    summary:
      "Lytter på dødsfall i PDL. Står personen i leveattest-registeret eller har en P6000 i Joark, lages en dødsmelding (H070) til Sverige, Finland eller Polen. Selve utsendingen er ikke skrudd på ennå.",
    consumes: [LEESAH],
    calls: ["EUX-RINA-API", "Pesys", "PDL", "SAF"],
  },

  // Libraries
  {
    id: "ep-eux",
    name: "ep-eux",
    category: "bibliotek",
    tech: "Kotlin-bibliotek",
    Icon: GlobeIcon,
    summary: "Klient mot eux-rina-api, slik at hver app slipper å skrive egen HTTP-kode for BUC-er og SED-er.",
    usedBy: [
      "eessi-pensjon-fagmodul",
      "eessi-pensjon-prefill",
      "eessi-pensjon-saksbehandling-api",
      "eessi-pensjon-journalforing",
      "eessi-pensjon-oppgave",
      "eessi-pensjon-krav-initialisering",
      "eessi-pensjon-pdl-produsent",
      "eessi-pensjon-begrens-innsyn",
      "eessi-pensjon-statistikk",
      "eessi-pensjon-dodsmelding",
    ],
  },
  {
    id: "ep-personoppslag",
    name: "ep-personoppslag",
    category: "bibliotek",
    tech: "Kotlin-bibliotek",
    Icon: PersonIcon,
    summary: "Felles oppslag mot PDL, slik at alle apper henter persondata på samme måte.",
    usedBy: [
      "eessi-pensjon-fagmodul",
      "eessi-pensjon-prefill",
      "eessi-pensjon-journalforing",
      "eessi-pensjon-pdl-produsent",
      "eessi-pensjon-begrens-innsyn",
      "eessi-pensjon-dodsmelding",
    ],
  },
  {
    id: "ep-routing",
    name: "ep-routing",
    category: "bibliotek",
    tech: "Kotlin-bibliotek",
    Icon: CompassIcon,
    summary:
      "Ruter oppgaver til riktig Nav-enhet ut fra BUC-type, hvor personen bor og informasjon om saken i Pesys.",
    usedBy: [
      "eessi-pensjon-journalforing",
      "eessi-pensjon-oppgave",
      "eessi-pensjon-pdl-produsent",
      "eessi-pensjon-dodsmelding",
    ],
  },
  {
    id: "ep-kodeverk",
    name: "ep-kodeverk",
    category: "bibliotek",
    tech: "Kotlin-bibliotek",
    Icon: BookIcon,
    summary: "Slår opp EESSI-koder, som landkoder, i Nav sitt kodeverk.",
    usedBy: ["eessi-pensjon-fagmodul", "eessi-pensjon-prefill", "eessi-pensjon-pdl-produsent"],
  },
  {
    id: "ep-logging",
    name: "ep-logging",
    category: "bibliotek",
    tech: "Kotlin-bibliotek",
    Icon: TerminalIcon,
    summary: "Felles logging: sporing av forespørsler med MDC og auditlogg via syslog.",
    usedBy: [
      "eessi-pensjon-fagmodul",
      "eessi-pensjon-prefill",
      "eessi-pensjon-saksbehandling-api",
      "eessi-pensjon-journalforing",
      "eessi-pensjon-oppgave",
      "eessi-pensjon-krav-initialisering",
      "eessi-pensjon-pdl-produsent",
      "eessi-pensjon-begrens-innsyn",
      "eessi-pensjon-statistikk",
      "eessi-pensjon-dodsmelding",
    ],
  },
  {
    id: "ep-metrics",
    name: "ep-metrics",
    category: "bibliotek",
    tech: "Kotlin-bibliotek",
    Icon: BarChartIcon,
    summary:
      "Prometheus-metrikker, blant annet et filter som teller forespørsler. Kan skrus av med METRICS_REQUESTFILTER_ENABLE.",
    usedBy: [
      "eessi-pensjon-fagmodul",
      "eessi-pensjon-prefill",
      "eessi-pensjon-saksbehandling-api",
      "eessi-pensjon-journalforing",
      "eessi-pensjon-oppgave",
      "eessi-pensjon-krav-initialisering",
      "eessi-pensjon-pdl-produsent",
      "eessi-pensjon-begrens-innsyn",
      "eessi-pensjon-statistikk",
      "eessi-pensjon-dodsmelding",
    ],
  },

  // Frontend libraries (npm, consumed by saksbehandling-ui)
  {
    id: "fetch-api",
    name: "fetch-api",
    category: "bibliotek",
    stack: "frontend",
    npm: "@navikt/fetch",
    tech: "TypeScript-bibliotek",
    Icon: ArrowRightLeftIcon,
    summary:
      "Fetch-kall som Redux-actions (request, success, failure), med feil som JSON og mockede svar med forsinkelse og feilrate i utvikling.",
    usedBy: ["eessi-pensjon-saksbehandling-ui"],
  },
  {
    id: "tabell",
    name: "tabell",
    category: "bibliotek",
    stack: "frontend",
    npm: "@navikt/tabell",
    tech: "React-komponent",
    Icon: TableIcon,
    summary: "Tabell med sortering, søk, paginering og animasjoner.",
    usedBy: ["eessi-pensjon-saksbehandling-ui"],
  },
  {
    id: "landvelger",
    name: "landvelger",
    category: "bibliotek",
    stack: "frontend",
    npm: "@navikt/landvelger",
    tech: "React-komponent",
    Icon: CaretDownCircleIcon,
    summary: "Nedtrekksliste for å velge land eller valuta, med flagg fra flagg-ikoner.",
    usedBy: ["eessi-pensjon-saksbehandling-ui"],
  },
  {
    id: "flagg-ikoner",
    name: "flagg-ikoner",
    category: "bibliotek",
    stack: "frontend",
    npm: "@navikt/flagg-ikoner",
    tech: "React-komponent",
    Icon: FlagCrossIcon,
    summary: "Flagg for hvert land, rektangulære eller runde.",
    usedBy: ["eessi-pensjon-saksbehandling-ui", "landvelger"],
  },
  {
    id: "land-verktoy",
    name: "land-verktoy",
    category: "bibliotek",
    stack: "frontend",
    npm: "@navikt/land-verktoy",
    tech: "TypeScript-bibliotek",
    Icon: EarthIcon,
    summary: "Landkoder, landnavn og valutaer på flere språk.",
    usedBy: ["eessi-pensjon-saksbehandling-ui", "landvelger", "flagg-ikoner"],
  },

  // Tools
  {
    id: "eessi-pensjon-documentation",
    name: "Dokumentasjonsportalen",
    category: "verktoy",
    tech: "React / TypeScript / Vite",
    Icon: BookIcon,
    summary:
      "Denne portalen. En Node-server bak Wonderwall sender /api videre til dokumentasjons-API-et med et OBO-token. Kun dev-gcp.",
    calls: ["eessi-pensjon-documentation-api"],
  },
  {
    id: "eessi-pensjon-documentation-api",
    name: "Dokumentasjons-API",
    category: "verktoy",
    tech: "Kotlin / Spring Boot",
    Icon: PackageIcon,
    summary: "Backend for dokumentasjonsportalen, beskyttet med Entra ID. Kun dev-gcp.",
  },
  {
    id: "ep-meta-analyse",
    name: "ep-meta-analyse",
    category: "verktoy",
    tech: "Analyseverktøy",
    Icon: MagnifyingGlassIcon,
    summary: "Analyserer kode og revisjonshistorikk på tvers av repoene og lager rapporter som PDF.",
  },
];

export const repoUrl = (app: Application) => app.repoUrl ?? `https://github.com/navikt/${app.id}`;
export const isService = (app: Application) => app.category === "kjerne" || app.category === "hendelse";

const BY_ID = new Map(APPLICATIONS.map((a) => [a.id, a]));

export const findApplication = (id: string) => BY_ID.get(id);

/** Deployed EP services (core + event-driven). */
export const SERVICES = APPLICATIONS.filter(isService);
export const SERVICE_COUNT = SERVICES.length;
export const LIBRARIES = APPLICATIONS.filter((a) => a.category === "bibliotek");
export const BACKEND_LIBRARIES = LIBRARIES.filter((a) => a.stack !== "frontend");
export const FRONTEND_LIBRARIES = LIBRARIES.filter((a) => a.stack === "frontend");
export const LIBRARY_COUNT = LIBRARIES.length;

/* ---------- Graph: how the services, topics and external systems connect ---------- */

export type Tone = "accent" | "success" | "meta-purple" | "warning" | "neutral";

export const TONE_BY_CATEGORY: Record<Category, Tone> = {
  kjerne: "accent",
  hendelse: "success",
  bibliotek: "warning",
  verktoy: "neutral",
};

type TopicInfo = {
  label: string;
  summary: string;
  scope: "inn" | "intern" | "ut";
  /** Producer outside EP, for topics we only read. */
  source?: string;
  /** Reader outside EP, for topics we publish for others. */
  sink?: string;
};

export const TOPICS: Record<string, TopicInfo> = {
  [SED_SENDT]: {
    label: "sedsendt-v1",
    summary: "SED-er Nav har sendt. Produseres av EUX-plattformen (eux-legacy-rina-events).",
    scope: "inn",
    source: "EUX",
  },
  [SED_MOTTATT]: {
    label: "sedmottatt-v1",
    summary: "SED-er Nav har mottatt fra andre land. Produseres av EUX-plattformen (eux-legacy-rina-events).",
    scope: "inn",
    source: "EUX",
  },
  [LEESAH]: {
    label: "leesah-v1",
    summary: "Personhendelser fra PDL, blant annet dødsfall og adresseendringer.",
    scope: "inn",
    source: "PDL",
  },
  [OPPGAVE]: { label: "oppgave", summary: "Internt topic med bestillinger av oppgaver til saksbehandlere.", scope: "intern" },
  [KRAV]: { label: "krav-initialisering", summary: "Internt topic med krav som skal opprettes i Pesys.", scope: "intern" },
  [PRIVAT_STATISTIKK]: {
    label: "privat-statistikk",
    summary: "Internt topic med rådata til statistikk fra fagmodulen.",
    scope: "intern",
  },
  [PUBLIC_STATISTIKK]: {
    label: "public-statistikk",
    summary: "Ferdig statistikk til datavarehuset (DVH).",
    scope: "ut",
    sink: "DVH",
  },
  [AUTOMATISERING]: {
    label: "public-automatisering",
    summary: "Data om automatiseringsgrad fra fagmodulen, prefill og journalføringen, lest av dv-team-pensjon.",
    scope: "ut",
    sink: "dv-team-pensjon",
  },
};

export const EXTERNALS: Record<string, string> = {
  "EUX-RINA-API": "EUX sitt API mot RINA: BUC-er, SED-er og vedlegg.",
  Pesys: "Pensjonsløsningen (PEN): saker, krav og vedtak.",
  PDL: "Persondataløsningen, med data fra Folkeregisteret.",
  "Person-mottak": "Tar imot endringer som skal skrives til PDL.",
  Joark: "Dokumentarkivet (Dokarkiv): oppretter og oppdaterer journalposter.",
  SAF: "Søk i journalposter og dokumenter.",
  Oppgave: "Nav sitt oppgavesystem.",
  Norg2: "Nav-enheter og hvem som behandler hva.",
  KRR: "Kontakt- og reservasjonsregisteret.",
  Kodeverk: "Nav sitt kodeverk, blant annet land- og postnummer.",
  "Nav Ansatt": "Informasjon om saksbehandlere.",
  Etterlatte: "Etterlatteløsningen (Gjenny).",
};

export type NodeKind = "app" | "topic" | "external";

export type GraphNode = {
  id: string;
  label: string;
  kind: NodeKind;
  tone: Tone;
  summary: string;
};

export type GraphEdge = { from: string; to: string; kind: "rest" | "event" };

export const NODES: GraphNode[] = [
  ...SERVICES.map((a) => ({
    id: a.id,
    label: a.name,
    kind: "app" as const,
    tone: TONE_BY_CATEGORY[a.category],
    summary: a.summary,
  })),
  ...Object.entries(TOPICS).map(([id, t]) => ({
    id,
    label: t.label,
    kind: "topic" as const,
    tone: "meta-purple" as const,
    summary: t.summary,
  })),
  ...Object.entries(EXTERNALS).map(([id, summary]) => ({
    id,
    label: id === "Oppgave" ? "Nav Oppgave" : id,
    kind: "external" as const,
    tone: "neutral" as const,
    summary,
  })),
];

export const NODE_BY_ID: Record<string, GraphNode> = Object.fromEntries(NODES.map((n) => [n.id, n]));

export const EDGES: GraphEdge[] = SERVICES.flatMap((a) => [
  ...(a.consumes ?? []).map((t) => ({ from: t, to: a.id, kind: "event" as const })),
  ...(a.produces ?? []).map((t) => ({ from: a.id, to: t, kind: "event" as const })),
  ...(a.calls ?? []).map((c) => ({ from: a.id, to: c, kind: "rest" as const })),
]);

export const incoming = (id: string) => EDGES.filter((e) => e.to === id);
export const outgoing = (id: string) => EDGES.filter((e) => e.from === id);

export const TOPIC_COUNT = Object.keys(TOPICS).length;
export const EXTERNAL_COUNT = Object.keys(EXTERNALS).length;
