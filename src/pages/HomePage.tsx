import { BodyLong, BodyShort, Detail, Heading, LinkCard, Tag } from "@navikt/ds-react";
import {
  ArchiveIcon,
  BarChartIcon,
  BellIcon,
  BriefcaseIcon,
  EyeSlashIcon,
  LightningIcon,
  MonitorIcon,
  PencilWritingIcon,
  PersonPencilIcon,
  TasklistIcon,
} from "@navikt/aksel-icons";
import { INTERNAL_PAGES } from "../lib/navigation";
import { LIBRARY_COUNT, SERVICE_COUNT } from "../lib/applications";
import { ApiStatus } from "../components/ApiStatus";
import { RequireLogin } from "../components/RequireLogin";
import type { UserState } from "../lib/user";

const CAPABILITIES = [
  {
    Icon: ArchiveIcon,
    title: "Journalføring",
    text: "Arkiverer pensjons-SED-er som sendes og mottas i Nav sitt dokumentarkiv (Joark).",
  },
  {
    Icon: PencilWritingIcon,
    title: "Preutfylling",
    text: "Fyller ut SED-er på forhånd med data fra pensjonsløsningen (Pesys), PDL og KRR.",
  },
  {
    Icon: TasklistIcon,
    title: "Oppgaver",
    text: "Oppretter oppgaver til saksbehandlere når innkommende SED-er må følges opp.",
  },
  {
    Icon: BriefcaseIcon,
    title: "Kravinitialisering",
    text: "Starter pensjonskrav i Pesys basert på innkomne EESSI-dokumenter.",
  },
  {
    Icon: PersonPencilIcon,
    title: "Persondata",
    text: "Oppdaterer PDL med adresser og utenlandske identer fra mottatte SED-er.",
  },
  {
    Icon: EyeSlashIcon,
    title: "Begrens innsyn",
    text: "Oppdager personer med adressebeskyttelse og skjermer BUC-en i RINA.",
  },
  {
    Icon: BellIcon,
    title: "Dødsmelding",
    text: "Sender dødsmelding (H070) automatisk til aktuelle land, blant annet Sverige og Finland.",
  },
  {
    Icon: BarChartIcon,
    title: "Statistikk",
    text: "Samler nøkkeltall om SED-behandlingen til rapportering.",
  },
  {
    Icon: MonitorIcon,
    title: "Saksbehandlerløsning",
    text: "Skjermbildet der saksbehandlere oppretter og følger opp BUC-er og SED-er.",
  },
];

const FACTS = [
  { value: String(SERVICE_COUNT), label: "applikasjoner" },
  { value: String(LIBRARY_COUNT), label: "delte biblioteker" },
  { value: "2", label: "fagsystemer: Pesys og Gjenny" },
];

const TERMS = [
  { term: "EESSI", text: "Electronic Exchange of Social Security Information — EUs system for trygdeinformasjon." },
  { term: "SED", text: "Structured Electronic Document — et strukturert skjema som sendes mellom land." },
  { term: "BUC", text: "Business Use Case — saken som samler SED-ene i én utveksling." },
  { term: "RINA", text: "Saksbehandlingssystemet hvert land bruker for å sende og motta SED-er." },
];

export function HomePage({ user }: { user: UserState }) {
  const upcoming = INTERNAL_PAGES.filter((p) => p.comingSoon);

  return (
    <article className="ep-page">
      <header className="ep-hero">
        <div className="ep-hero__glow" aria-hidden />
        <Tag size="small" variant="moderate" data-color="accent" className="ep-hero__eyebrow">
          Team EESSI Pensjon
        </Tag>
        <Heading level="1" size="xlarge" className="ep-hero__title">
          Pensjon på tvers av landegrenser
        </Heading>
        <BodyLong size="large" className="ep-hero__lead">
          EESSI Pensjon er Nav sine løsninger for å utveksle pensjonsinformasjon elektronisk med andre
          europeiske land. Her samler vi dokumentasjonen om hvordan løsningen er bygget, hvordan
          den henger sammen og hvordan den driftes.
        </BodyLong>
        <dl className="ep-hero__facts">
          {FACTS.map((f) => (
            <div key={f.label} className="ep-hero__fact">
              <dt className="ep-hero__fact-value">{f.value}</dt>
              <dd className="ep-hero__fact-label">{f.label}</dd>
            </div>
          ))}
        </dl>
      </header>

      <section className="ep-section" aria-labelledby="hva-er-eessi">
        <div className="ep-split">
          <div>
            <Heading level="2" size="large" id="hva-er-eessi" spacing>
              Hva er EESSI?
            </Heading>
            <BodyLong spacing>
              Når en person har bodd eller jobbet i flere land, må trygdemyndighetene i landene samarbeide om
              pensjonen. EESSI er EUs felles system for denne utvekslingen. I stedet for papirblanketter sender
              landene strukturerte elektroniske dokumenter (SED-er) til hverandre, samlet i saker (BUC-er), via
              hvert lands RINA-installasjon.
            </BodyLong>
            <BodyLong>
              Den generelle infrastrukturen for SED-utveksling i Nav — integrasjonen mot RINA, saksoversikt og
              hendelser — eies av EUX-plattformen. EESSI Pensjon bygger på EUX og legger til det som er spesielt
              for pensjon.
            </BodyLong>
          </div>
          <dl className="ep-terms">
            {TERMS.map((t) => (
              <div key={t.term} className="ep-terms__row">
                <dt className="ep-terms__term">{t.term}</dt>
                <dd className="ep-terms__text">{t.text}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="ep-section" aria-labelledby="hva-gjor-ep">
        <Heading level="2" size="large" id="hva-gjor-ep" spacing>
          Hva gjør EESSI Pensjon?
        </Heading>
        <BodyLong className="ep-section__intro">
          Løsningen består av synkrone tjenester som saksbehandlere bruker direkte, og hendelsesdrevne
          tjenester som reagerer på SED-er som sendes og mottas via Kafka.
        </BodyLong>
        <ul className="ep-capabilities">
          {CAPABILITIES.map(({ Icon, title, text }) => (
            <li key={title} className="ep-capability">
              <span className="ep-capability__icon" aria-hidden>
                <Icon />
              </span>
              <BodyShort weight="semibold">{title}</BodyShort>
              <BodyShort size="small" className="ep-capability__text">
                {text}
              </BodyShort>
            </li>
          ))}
        </ul>
      </section>

      <section className="ep-section" aria-labelledby="to-moduser">
        <Heading level="2" size="large" id="to-moduser" spacing>
          To måter å jobbe på
        </Heading>
        <div className="ep-modes">
          <div className="ep-mode">
            <span className="ep-mode__badge" aria-hidden>
              <MonitorIcon />
            </span>
            <Heading level="3" size="small" spacing>
              Synkront — når saksbehandleren ber om det
            </Heading>
            <BodyLong size="small">
              Saksbehandlerløsningen kaller fagmodulen og saksbehandling-API-et. Fagmodulen orkestrerer
              SED-operasjoner mot EUX og henter preutfylte data fra prefill-tjenesten.
            </BodyLong>
          </div>
          <div className="ep-mode">
            <span className="ep-mode__badge" aria-hidden>
              <LightningIcon />
            </span>
            <Heading level="3" size="small" spacing>
              Asynkront — når en SED sendes eller mottas
            </Heading>
            <BodyLong size="small">
              Hendelser om sendte og mottatte SED-er går på Kafka. Egne tjenester journalfører, oppretter
              oppgaver, starter krav, oppdaterer PDL, begrenser innsyn og lager statistikk.
            </BodyLong>
          </div>
        </div>
      </section>

      <section className="ep-section" aria-labelledby="kommer">
        <div className="ep-section__head">
          <Heading level="2" size="large" id="kommer">
            Dette kommer
          </Heading>
          <Detail textColor="subtle">Portalen fylles på i de neste iterasjonene</Detail>
        </div>
        <div className="ep-cards">
          {upcoming.map((page) => (
            <LinkCard key={page.href} size="small">
              <LinkCard.Icon>
                <page.Icon fontSize="1.75rem" aria-hidden />
              </LinkCard.Icon>
              <LinkCard.Title as="h3">
                <LinkCard.Anchor href={page.href}>{page.label}</LinkCard.Anchor>
              </LinkCard.Title>
              <LinkCard.Description>{page.description}</LinkCard.Description>
            </LinkCard>
          ))}
        </div>
      </section>

      <section className="ep-section" aria-labelledby="tilkobling">
        <Heading level="2" size="small" id="tilkobling" spacing>
          Tilkobling
        </Heading>
        <RequireLogin user={user}>
          <ApiStatus />
        </RequireLogin>
      </section>
    </article>
  );
}
