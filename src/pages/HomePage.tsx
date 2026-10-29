import type { CSSProperties, PointerEvent } from "react";
import { BodyLong, BodyShort, Button, Detail, Heading, LinkCard } from "@navikt/ds-react";
import {
  ArchiveIcon,
  ArrowRightIcon,
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
import { ExchangeIllustration } from "../components/ExchangeIllustration";
import { useCountUp, useReveal } from "../lib/motion";
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
  { value: SERVICE_COUNT, label: "applikasjoner" },
  { value: LIBRARY_COUNT, label: "delte biblioteker" },
  { value: 2, label: "fagsystemer: Pesys og Gjenny" },
];

const TERMS = [
  { term: "EESSI", text: "Electronic Exchange of Social Security Information — EUs system for trygdeinformasjon." },
  { term: "SED", text: "Structured Electronic Document — et strukturert skjema som sendes mellom land." },
  { term: "BUC", text: "Business Use Case — saken som samler SED-ene i én utveksling." },
  { term: "RINA", text: "Saksbehandlingssystemet hvert land bruker for å sende og motta SED-er." },
];

const MODES = [
  {
    Icon: MonitorIcon,
    title: "Synkront — når saksbehandleren ber om det",
    text: "Saksbehandlerløsningen kaller fagmodulen og saksbehandling-API-et. Fagmodulen orkestrerer SED-operasjoner mot EUX og henter preutfylte data fra prefill-tjenesten.",
    variant: "sync",
    stops: ["Saksbehandler", "Fagmodul", "EUX"],
  },
  {
    Icon: LightningIcon,
    title: "Asynkront — når en SED sendes eller mottas",
    text: "Hendelser om sendte og mottatte SED-er går på Kafka. Egne tjenester journalfører, oppretter oppgaver, starter krav, oppdaterer PDL, begrenser innsyn og lager statistikk.",
    variant: "async",
    stops: ["RINA", "Kafka", "EP-tjenester"],
  },
];

const stagger = (i: number) => ({ "--stagger": i }) as CSSProperties;

function Fact({ value, label }: { value: number; label: string }) {
  const shown = useCountUp(value);
  return (
    <div className="ep-hero__fact">
      <dt className="ep-hero__fact-value">
        <span aria-hidden>{shown}</span>
        <span className="ep-visually-hidden">{value}</span>
      </dt>
      <dd className="ep-hero__fact-label">{label}</dd>
    </div>
  );
}

function trackSpotlight(event: PointerEvent<HTMLElement>) {
  const card = (event.target as Element).closest<HTMLElement>(".ep-capability");
  if (!card) return;
  const rect = card.getBoundingClientRect();
  card.style.setProperty("--mx", `${event.clientX - rect.left}px`);
  card.style.setProperty("--my", `${event.clientY - rect.top}px`);
}

function SectionTitle({ id, eyebrow, children }: { id: string; eyebrow: string; children: string }) {
  return (
    <div data-reveal>
      <p className="ep-eyebrow ep-home__eyebrow">{eyebrow}</p>
      <Heading level="2" size="large" id={id} spacing>
        {children}
      </Heading>
    </div>
  );
}

export function HomePage({ user }: { user: UserState }) {
  const upcoming = INTERNAL_PAGES.filter((p) => p.comingSoon);
  const revealRef = useReveal<HTMLElement>();

  return (
    <article className="ep-page ep-home" ref={revealRef}>
      <header className="ep-hero">
        <div className="ep-hero__bg" aria-hidden>
          <span className="ep-hero__blob ep-hero__blob--a" />
          <span className="ep-hero__blob ep-hero__blob--b" />
        </div>

        <div className="ep-hero__text">
          <p className="ep-hero__eyebrow ep-enter" style={stagger(0)}>
            <span className="ep-hero__live" aria-hidden />
            Team EESSI Pensjon
          </p>
          <Heading level="1" size="xlarge" className="ep-hero__title ep-enter" style={stagger(1)}>
            Pensjon på tvers av <span className="ep-gradient-text">landegrenser</span>
          </Heading>
          <BodyLong size="large" className="ep-hero__lead ep-enter" style={stagger(2)}>
            EESSI Pensjon er Nav sine løsninger for å utveksle pensjonsinformasjon elektronisk med andre
            europeiske land. Her samler vi dokumentasjonen om hvordan løsningen er bygget, hvordan den henger
            sammen og hvordan den driftes.
          </BodyLong>
          <div className="ep-hero__actions ep-enter" style={stagger(3)}>
            <Button
              as="a"
              href="/applikasjoner"
              icon={<ArrowRightIcon aria-hidden />}
              iconPosition="right"
              className="ep-hero__cta"
            >
              Utforsk applikasjonene
            </Button>
            <Button as="a" href="#hva-er-eessi" variant="secondary">
              Hva er EESSI?
            </Button>
          </div>
          <dl className="ep-hero__facts ep-enter" style={stagger(4)}>
            {FACTS.map((f) => (
              <Fact key={f.label} {...f} />
            ))}
          </dl>
        </div>

        <div className="ep-hero__art ep-enter" style={stagger(2)}>
          <ExchangeIllustration />
        </div>
      </header>

      <section className="ep-section" aria-labelledby="hva-er-eessi">
        <div className="ep-split">
          <div data-reveal>
            <p className="ep-eyebrow ep-home__eyebrow">Bakgrunn</p>
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
          <dl className="ep-terms" data-reveal style={stagger(1)}>
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
        <SectionTitle id="hva-gjor-ep" eyebrow="Funksjonalitet">
          Hva gjør EESSI Pensjon?
        </SectionTitle>
        <BodyLong className="ep-section__intro" data-reveal>
          Løsningen består av synkrone tjenester som saksbehandlere bruker direkte, og hendelsesdrevne
          tjenester som reagerer på SED-er som sendes og mottas via Kafka.
        </BodyLong>
        <ul className="ep-capabilities" onPointerMove={trackSpotlight}>
          {CAPABILITIES.map(({ Icon, title, text }, i) => (
            <li key={title} className="ep-capability" data-reveal style={stagger(i % 3)}>
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
        <SectionTitle id="to-moduser" eyebrow="Arkitektur">
          To måter å jobbe på
        </SectionTitle>
        <div className="ep-modes">
          {MODES.map(({ Icon, title, text, variant, stops }, i) => (
            <div key={variant} className="ep-mode" data-variant={variant} data-reveal style={stagger(i)}>
              <span className="ep-mode__badge" aria-hidden>
                <Icon />
              </span>
              <Heading level="3" size="small" spacing>
                {title}
              </Heading>
              <BodyLong size="small">{text}</BodyLong>
              <div className="ep-mode__track" aria-hidden>
                {stops.map((stop, s) => (
                  <span key={stop} className="ep-mode__segment">
                    {s > 0 && (
                      <span className="ep-mode__wire">
                        <i />
                        <i />
                      </span>
                    )}
                    <span className="ep-mode__stop">{stop}</span>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="ep-section" aria-labelledby="kommer">
        <div className="ep-section__head" data-reveal>
          <div>
            <p className="ep-eyebrow ep-home__eyebrow">Veikart</p>
            <Heading level="2" size="large" id="kommer">
              Dette kommer
            </Heading>
          </div>
          <Detail textColor="subtle">Portalen fylles på i de neste iterasjonene</Detail>
        </div>
        <div className="ep-cards">
          {upcoming.map((page, i) => (
            <div key={page.href} className="ep-cards__item" data-reveal style={stagger(i)}>
              <LinkCard size="small">
                <LinkCard.Icon>
                  <page.Icon fontSize="1.75rem" aria-hidden />
                </LinkCard.Icon>
                <LinkCard.Title as="h3">
                  <LinkCard.Anchor href={page.href}>{page.label}</LinkCard.Anchor>
                </LinkCard.Title>
                <LinkCard.Description>{page.description}</LinkCard.Description>
              </LinkCard>
            </div>
          ))}
        </div>
      </section>

      <section className="ep-section" aria-labelledby="tilkobling" data-reveal>
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
