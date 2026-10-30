import type { CSSProperties, ComponentType, SVGProps } from "react";
import {
  ArchiveIcon,
  ArrowDownIcon,
  ArrowRightIcon,
  BarChartIcon,
  Buildings3Icon,
  CandleIcon,
  ChildEyesIcon,
  FileTextIcon,
  FilesIcon,
  FolderIcon,
  GlobeIcon,
  MagnifyingGlassIcon,
  MonitorIcon,
  PaperplaneIcon,
  PersonCheckmarkIcon,
  PersonGroupIcon,
  ShieldLockIcon,
  SparklesIcon,
  TagIcon,
  HouseIcon,
  TasklistIcon,
} from "@navikt/aksel-icons";
import type { Tone } from "../lib/applications";
import {
  ENHETER,
  OTHER_BUCS,
  PENSION_BUCS,
  ROUTING,
  SED_GROUPS,
  SED_TAGS,
  type RoutingCell,
} from "../lib/sedbuc";

const vars = (v: Record<string, string | number>) => v as CSSProperties;

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

/* Hero art: a BUC folder with SED sheets in it. */
export function BucFolderArt() {
  const sheets = ["P2000", "P5000", "P6000"];
  return (
    <div className="ep-arch-hero__art ep-sed-art" aria-hidden>
      <div className="ep-sed-art__folder">
        <span className="ep-sed-art__tab ep-mono">P_BUC_01</span>
        {sheets.map((s, i) => (
          <span key={s} className="ep-sed-art__sheet" style={vars({ "--i": i })}>
            <span className="ep-sed-art__code ep-mono">{s}</span>
            <span className="ep-sed-art__lines">
              <span />
              <span />
              <span />
            </span>
          </span>
        ))}
        <span className="ep-sed-art__front" />
      </div>
    </div>
  );
}

const CONCEPTS: { Icon: Icon; term: string; full: string; text: string }[] = [
  {
    Icon: FolderIcon,
    term: "BUC",
    full: "Business Use Case",
    text: "Saksmappen i RINA. Typen bestemmer hvilke SED-er som kan sendes, og i hvilken rekkefølge.",
  },
  {
    Icon: FileTextIcon,
    term: "SED",
    full: "Structured Electronic Document",
    text: "Et strukturert skjema som går mellom institusjonene i en BUC.",
  },
  {
    Icon: GlobeIcon,
    term: "RINA",
    full: "Reference Implementation of a National Application",
    text: "Saksbehandlingssystemet for EESSI. Vi når det via eux-rina-api, og hendelser kommer på Kafka.",
  },
  {
    Icon: TagIcon,
    term: "Sektor",
    full: "P = pensjon",
    text: "Vi eier sektor P. I tillegg behandler vi H_BUC_07, R_BUC_02 og M_BUC_02.",
  },
];

const TALK: { dir: "out" | "in"; code: string; name: string }[] = [
  { dir: "out", code: "P8000", name: "Anmodning om tilleggsinformasjon" },
  { dir: "out", code: "X009", name: "Påminnelse" },
  { dir: "in", code: "X010", name: "Svar på påminnelse" },
  { dir: "in", code: "P9000", name: "Svar på anmodning" },
];

/** One BUC, many SEDs going back and forth. */
export function BucConversation() {
  return (
    <div className="ep-sed-concept">
      <figure className="ep-sed-talk" data-reveal>
        <div className="ep-sed-talk__head">
          <span className="ep-sed-talk__party">
            <Buildings3Icon aria-hidden />
            <span>
              NAV <small>Norge</small>
            </span>
          </span>
          <span className="ep-sed-talk__buc">
            <FolderIcon aria-hidden />
            <span className="ep-mono">P_BUC_05</span>
          </span>
          <span className="ep-sed-talk__party" data-side="right">
            <span>
              Institusjon <small>Sverige</small>
            </span>
            <GlobeIcon aria-hidden />
          </span>
        </div>
        <ol className="ep-sed-talk__msgs">
          {TALK.map((m, i) => (
            <li key={m.code} className="ep-sed-talk__msg" data-dir={m.dir} style={vars({ "--i": i })}>
              <span className="ep-sed-talk__wire" />
              <span className="ep-sed-talk__sed">
                <code>{m.code}</code>
                <span>{m.name}</span>
              </span>
            </li>
          ))}
        </ol>
        <figcaption className="ep-sed-talk__caption">
          Eksempel: NAV ber om opplysninger og purrer, Sverige svarer. Hele utvekslingen ligger i én BUC.
        </figcaption>
      </figure>

      <dl className="ep-sed-terms">
        {CONCEPTS.map((c, i) => (
          <div key={c.term} className="ep-sed-term" data-reveal style={vars({ "--stagger": i })}>
            <dt>
              <span className="ep-sed-term__icon">
                <c.Icon aria-hidden />
              </span>
              <span className="ep-sed-term__term">{c.term}</span>
              <span className="ep-sed-term__full">{c.full}</span>
            </dt>
            <dd>{c.text}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** The ten pension BUCs a caseworker can create. */
export function BucCatalog() {
  return (
    <div className="ep-sed-bucs-wrap">
      <ul className="ep-sed-bucs">
        {PENSION_BUCS.map((b, i) => (
          <li key={b.code} className="ep-sed-buc" data-tone={b.tone} data-reveal style={vars({ "--stagger": i % 5 })}>
            <span className="ep-sed-buc__n" aria-hidden>
              {b.code.slice(-2)}
            </span>
            <p className="ep-sed-buc__code ep-mono">{b.code}</p>
            <p className="ep-sed-buc__name">{b.name}</p>
            <p className="ep-sed-buc__starts">
              <span>Starter med</span>
              {b.starts.map((s) => (
                <code key={s}>{s}</code>
              ))}
            </p>
            {(b.krav || b.avdod || b.gjenny) && (
              <ul className="ep-sed-buc__flags">
                {b.krav && <li data-flag="krav">Krav i Pesys</li>}
                {b.avdod && <li data-flag="avdod">Avdød</li>}
                {b.gjenny && <li data-flag="gjenny">Gjenny</li>}
              </ul>
            )}
          </li>
        ))}
      </ul>
      <div className="ep-sed-bucs__other" data-reveal>
        <span className="ep-sed-bucs__other-label">Utenfor sektor P, men journalført av oss</span>
        <ul>
          {OTHER_BUCS.map((b) => (
            <li key={b.code}>
              <code>{b.code}</code> {b.name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** SED types grouped by purpose, with what EP does for each. */
export function SedCatalog() {
  return (
    <div className="ep-sed-cat">
      <ul className="ep-sed-legend" data-reveal>
        {SED_TAGS.map((t) => (
          <li key={t.tag} data-tag={t.tag}>
            <span className="ep-sed-dot" data-tag={t.tag} />
            <strong>{t.label}</strong>
            <span>{t.text}</span>
          </li>
        ))}
      </ul>
      <div className="ep-sed-groups">
        {SED_GROUPS.map((g, gi) => (
          <section
            key={g.title}
            className="ep-sed-group"
            data-tone={g.tone}
            data-reveal
            style={vars({ "--stagger": gi % 3 })}
            aria-label={g.title}
          >
            <h3 className="ep-sed-group__title">{g.title}</h3>
            <ul className="ep-sed-group__list">
              {g.seds.map((s) => (
                <li key={s.code} className="ep-sed-row">
                  <code className="ep-sed-row__code">{s.code}</code>
                  <span className="ep-sed-row__name">{s.name}</span>
                  <span className="ep-sed-row__tags">
                    {s.tags?.map((t) => (
                      <span
                        key={t}
                        className="ep-sed-dot"
                        data-tag={t}
                        title={SED_TAGS.find((x) => x.tag === t)?.label}
                      />
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

const OUT: { Icon: Icon; tone: Tone; app: string; title: string; detail: string }[] = [
  { Icon: MonitorIcon, tone: "neutral", app: "saksbehandling-ui", title: "Velg BUC og SED", detail: "Fra Pesys eller Gjenny" },
  { Icon: FolderIcon, tone: "accent", app: "fagmodul", title: "Opprett BUC", detail: "POST /prefill/buc/{type}" },
  { Icon: PersonGroupIcon, tone: "accent", app: "fagmodul", title: "Legg til mottakere", detail: "POST /prefill/sed/add" },
  { Icon: SparklesIcon, tone: "meta-purple", app: "prefill", title: "Preutfyll", detail: "PDL + Pesys → SED" },
  { Icon: FileTextIcon, tone: "success", app: "eux-rina-api", title: "Lagre utkast", detail: "SED-en i RINA" },
  { Icon: PaperplaneIcon, tone: "success", app: "saksbehandling-ui", title: "Rediger og send", detail: "…/sed/{id}/send" },
];

const OUT_RULES = [
  "RINA bestemmer hvilke SED-er som kan opprettes",
  "Mottakere legges til med X005 når BUC-en har en",
  "P_BUC_02 krever avdødes fnr (ikke i Gjenny)",
  "P7000 bygges fra P6000-ene saksbehandler velger",
];

/** From caseworker to RINA. */
export function OutgoingFlow() {
  return (
    <figure className="ep-ett-flow ep-sed-out" data-reveal>
      <ol className="ep-ett-flow__track ep-sed-out__track">
        {OUT.map((s, i) => (
          <li key={i} className="ep-ett-flow__node" data-tone={s.tone} style={vars({ "--i": i })}>
            <span className="ep-ett-flow__icon">
              <s.Icon aria-hidden />
            </span>
            <span className="ep-sed-out__app ep-mono">{s.app}</span>
            <span className="ep-ett-flow__title">{s.title}</span>
            <code className="ep-ett-flow__tool">{s.detail}</code>
            {i < OUT.length - 1 && <ArrowRightIcon aria-hidden className="ep-ett-flow__arrow" />}
          </li>
        ))}
      </ol>
      <figcaption className="ep-ett-flow__caption ep-sed-out__caption">
        <ul className="ep-sed-out__sources">
          <li>
            <strong>PDL</strong> person og familie
          </li>
          <li>
            <strong>Pesys</strong> sak, vedtak og krav
          </li>
          <li>
            <strong>Etterlatte</strong> vedtak i Gjenny
          </li>
          <li>
            <strong>Kafka</strong> «BUC opprettet» og «SED opprettet» til statistikk
          </li>
        </ul>
        <ul className="ep-sed-out__rules">
          {OUT_RULES.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </figcaption>
    </figure>
  );
}

const CONSUMERS: {
  Icon: Icon;
  tone: Tone;
  app: string;
  hears: ("sendt" | "mottatt")[];
  filter: string;
  result: string;
  next?: string[];
}[] = [
  {
    Icon: ArchiveIcon,
    tone: "accent",
    app: "journalforing",
    hears: ["sendt", "mottatt"],
    filter: "Sektor P + H_BUC_07, R_BUC_02, M_BUC_02",
    result: "Journalpost i Dokarkiv",
    next: ["oppgave", "krav-initialisering"],
  },
  {
    Icon: ShieldLockIcon,
    tone: "warning",
    app: "begrens-innsyn",
    hears: ["sendt", "mottatt"],
    filter: "Sektor P, R, H + M_BUC_02/03. Ikke X-SED-er",
    result: "Markerer BUC-en som sensitiv i RINA",
  },
  {
    Icon: PersonCheckmarkIcon,
    tone: "success",
    app: "pdl-produsent",
    hears: ["mottatt"],
    filter: "Sektor P + H_BUC_07. Ikke X-SED-er",
    result: "Utenlandsk ID og adresse i PDL",
    next: ["oppgave ved avvik"],
  },
  {
    Icon: BarChartIcon,
    tone: "meta-purple",
    app: "statistikk",
    hears: ["sendt", "mottatt"],
    filter: "Bare P6000",
    result: "Vedtaksstatistikk på Kafka",
  },
];

/** Sent and received SEDs fan out to four consumers. */
export function IncomingFanout() {
  return (
    <figure className="ep-sed-fan" data-reveal>
      <div className="ep-sed-fan__source">
        <span className="ep-sed-fan__box">
          <GlobeIcon aria-hidden /> RINA
        </span>
        <ArrowRightIcon aria-hidden className="ep-sed-fan__to" />
        <span className="ep-sed-fan__box ep-mono">eux-legacy-rina-events</span>
        <ArrowRightIcon aria-hidden className="ep-sed-fan__to" />
        <span className="ep-sed-fan__topics">
          <code data-kind="sendt">sedSendt-v1</code>
          <code data-kind="mottatt">sedMottatt-v1</code>
        </span>
      </div>
      <ul className="ep-sed-fan__consumers">
        {CONSUMERS.map((c, i) => (
          <li key={c.app} className="ep-sed-fan__consumer" data-tone={c.tone} style={vars({ "--i": i })}>
            <div className="ep-sed-fan__head">
              <span className="ep-ett-flow__icon">
                <c.Icon aria-hidden />
              </span>
              <span className="ep-mono ep-sed-fan__app">{c.app}</span>
            </div>
            <p className="ep-sed-fan__hears">
              {c.hears.map((h) => (
                <span key={h} data-kind={h}>
                  {h}
                </span>
              ))}
            </p>
            <p className="ep-sed-fan__filter">{c.filter}</p>
            <p className="ep-sed-fan__result">
              <ArrowDownIcon aria-hidden />
              {c.result}
            </p>
            {c.next && (
              <p className="ep-sed-fan__next">
                {c.next.map((n) => (
                  <code key={n}>{n}</code>
                ))}
              </p>
            )}
          </li>
        ))}
      </ul>
    </figure>
  );
}

const STEPS: { Icon: Icon; title: string; via: string; text: string }[] = [
  { Icon: FilesIcon, title: "Hent", via: "EUX", text: "BUC, SED-er og PDF. Bilder blir PDF." },
  { Icon: MagnifyingGlassIcon, title: "Identifiser", via: "PDL", text: "Personen ut fra fnr og relasjoner i SED-ene." },
  { Icon: FolderIcon, title: "Finn sak", via: "Pesys / Gjenny", text: "Pesys-sak via fagmodul, eller Gjenny-sak." },
  { Icon: TagIcon, title: "Tema", via: "", text: "Pensjon, uføretrygd eller Gjenny-tema." },
  { Icon: PersonGroupIcon, title: "Enhet", via: "ep-routing", text: "Per BUC, bosted, alder og sakstype." },
  { Icon: ArchiveIcon, title: "Journalfør", via: "Dokarkiv", text: "Ferdigstilles automatisk når alt er på plass." },
  { Icon: TasklistIcon, title: "Følg opp", via: "Kafka", text: "Oppgave til saksbehandler, eller krav i Pesys." },
];

const TEMA: { bucs: string; tema: string }[] = [
  { bucs: "P_BUC_01 · P_BUC_02", tema: "Pensjon" },
  { bucs: "P_BUC_03", tema: "Uføretrygd" },
  { bucs: "Gjenny-sak", tema: "Barnepensjon / omstilling" },
  { bucs: "Andre", tema: "Etter sakstype og alder" },
];

/** What journalforing does with each event. */
export function JournalSteps() {
  return (
    <div className="ep-sed-jfr">
      <ol className="ep-sed-steps" data-reveal>
        {STEPS.map((s, i) => (
          <li key={s.title} className="ep-sed-step" style={vars({ "--i": i })}>
            <span className="ep-sed-step__icon">
              <s.Icon aria-hidden />
            </span>
            <span className="ep-sed-step__title">{s.title}</span>
            {s.via && <span className="ep-sed-step__via ep-mono">{s.via}</span>}
            <span className="ep-sed-step__text">{s.text}</span>
          </li>
        ))}
      </ol>

      <div className="ep-sed-jfr__side">
        <div className="ep-sed-panel" data-tone="accent" data-reveal>
          <p className="ep-sed-panel__title">Automatisk krav</p>
          <ul className="ep-sed-krav">
            <li>
              <code>P2000</code>
              <ArrowRightIcon aria-hidden />
              <span>Krav om alderspensjon</span>
            </li>
            <li>
              <code>P2200</code>
              <ArrowRightIcon aria-hidden />
              <span>Krav om uføretrygd</span>
            </li>
          </ul>
          <ul className="ep-sed-panel__notes">
            <li>Bare mottatte SED-er med ferdigstilt journalpost</li>
            <li>Over 74 år: oppgave om å opprette kravet manuelt</li>
            <li>P2000 må ha statsborgerskap og sivilstand med fra-dato</li>
          </ul>
        </div>
        <div className="ep-sed-panel" data-tone="neutral" data-reveal style={vars({ "--stagger": 1 })}>
          <p className="ep-sed-panel__title">Tema</p>
          <dl className="ep-sed-tema">
            {TEMA.map((t) => (
              <div key={t.bucs}>
                <dt className="ep-mono">{t.bucs}</dt>
                <dd>{t.tema}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}

function Cell({ cell }: { cell: RoutingCell }) {
  return (
    <ul className="ep-sed-cell">
      {cell.map((c) => (
        <li key={`${c.when}-${c.nr}`}>
          <abbr className="ep-sed-enhet ep-mono" data-nr={c.nr} title={ENHETER[c.nr]?.name}>
            {c.nr}
          </abbr>
          {c.when && <span>{c.when}</span>}
        </li>
      ))}
    </ul>
  );
}

/** ep-routing: which NAV unit gets the journalpost and oppgave. */
export function RoutingMatrix() {
  const legend = ["4862", "0001", "4476", "4475", "4803", "4819"];
  return (
    <div className="ep-sed-routing">
      <div className="ep-sed-table-wrap" data-reveal>
        <table className="ep-sed-table">
          <thead>
            <tr>
              <th scope="col">BUC</th>
              <th scope="col">
                <HouseIcon aria-hidden /> Bosatt i Norge
              </th>
              <th scope="col">
                <GlobeIcon aria-hidden /> Bosatt i utlandet
              </th>
            </tr>
          </thead>
          <tbody>
            {ROUTING.map((r, i) => (
              <tr key={r.bucs} style={vars({ "--i": i })}>
                <th scope="row">
                  <span className="ep-mono">{r.bucs}</span>
                  {r.note && <small>{r.note}</small>}
                </th>
                <td>
                  <Cell cell={r.norge} />
                </td>
                <td>
                  <Cell cell={r.utland} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <aside className="ep-sed-routing__side">
        <div className="ep-sed-override" data-reveal>
          <span className="ep-sed-enhet ep-mono" data-nr="2103">
            2103
          </span>
          <p>
            <strong>Adressebeskyttelse</strong> går til Vikafossen. Gjelder alle BUC-er unntatt P_BUC_05.
          </p>
        </div>
        <div className="ep-sed-override" data-reveal style={vars({ "--stagger": 1 })}>
          <span className="ep-sed-enhet ep-mono" data-nr="4303">
            4303
          </span>
          <p>
            <strong>ID og fordeling</strong> får det som ikke kan rutes: ukjent person, manglende aktør-ID eller sakstype.
          </p>
        </div>
        <ul className="ep-sed-enheter" data-reveal style={vars({ "--stagger": 2 })}>
          {legend.map((nr) => (
            <li key={nr}>
              <span className="ep-sed-enhet ep-mono" data-nr={nr}>
                {nr}
              </span>
              {ENHETER[nr].name}
            </li>
          ))}
        </ul>
        <p className="ep-sed-routing__note">
          journalforing kan overstyre med Norg2 for P_BUC_01, P_BUC_10 og løpende alderssaker i P_BUC_02. For sendte
          SED-er blir journalførende enhet saksbehandlerens egen.
        </p>
      </aside>
    </div>
  );
}

const SPECIAL: { Icon: Icon; tone: Tone; title: string; tag: string; text: string }[] = [
  {
    Icon: CandleIcon,
    tone: "neutral",
    title: "Dødsmelding",
    tag: "H_BUC_07 · H070",
    text: "dodsmelding lytter på dødsfall i PDL og preutfyller H070 til Sverige, Finland og Polen. Sending er ikke slått på i prod ennå.",
  },
  {
    Icon: ChildEyesIcon,
    tone: "meta-purple",
    title: "Gjenny",
    tag: "P_BUC_02 · P2100",
    text: "Mottatt P2100 for en person under 67 lagres som Gjenny-sak. Gjenny kan selv opprette P_BUC_02 og P_BUC_04–10.",
  },
  {
    Icon: ShieldLockIcon,
    tone: "warning",
    title: "Sensitive saker",
    tag: "Kode 6/7",
    text: "begrens-innsyn sjekker alle fnr i SED-ene mot PDL. Treff gjør BUC-en sensitiv i RINA. Oppgaver for personer med adressebeskyttelse går til 2103.",
  },
  {
    Icon: FilesIcon,
    tone: "success",
    title: "Vedtakssammendrag",
    tag: "P_BUC_06 · P7000",
    text: "P7000 bygges fra P6000-ene saksbehandler velger. Med CDM 4.3 eller eldre tillater UI bare én P5000, P6000, P7000 og P10000 per P_BUC_06.",
  },
];

export function SpecialCases() {
  return (
    <ul className="ep-sed-special">
      {SPECIAL.map((s, i) => (
        <li key={s.title} className="ep-sed-special__card" data-tone={s.tone} data-reveal style={vars({ "--stagger": i })}>
          <span className="ep-ett-tool__icon">
            <s.Icon aria-hidden />
          </span>
          <p className="ep-sed-special__title">{s.title}</p>
          <code className="ep-sed-special__tag">{s.tag}</code>
          <p className="ep-sed-special__text">{s.text}</p>
        </li>
      ))}
    </ul>
  );
}
