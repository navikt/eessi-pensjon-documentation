import type { CSSProperties, ReactNode } from "react";
import { Heading } from "@navikt/ds-react";
import { ArrowRightIcon } from "@navikt/aksel-icons";
import { JumpNav, SectionHead, type JumpItem } from "../components/PageSections";
import {
  BucCatalog,
  BucConversation,
  BucFolderArt,
  IncomingFanout,
  JournalSteps,
  OutgoingFlow,
  RoutingMatrix,
  SedCatalog,
  SpecialCases,
} from "../components/SedBuc";
import type { Tone } from "../lib/applications";
import { useReveal } from "../lib/motion";
import { EDITOR_COUNT, P_SED_COUNT, PENSION_BUCS, PREFILL_COUNT } from "../lib/sedbuc";

const vars = (v: Record<string, string | number>) => v as CSSProperties;

const JUMP: JumpItem[] = [
  { id: "begreper", label: "Begreper" },
  { id: "bucer", label: "BUC-er" },
  { id: "seder", label: "SED-er" },
  { id: "utgaende", label: "Utgående" },
  { id: "innkommende", label: "Innkommende" },
  { id: "journalforing", label: "Journalføring" },
  { id: "ruting", label: "Ruting" },
  { id: "spesialtilfeller", label: "Spesialtilfeller" },
];

export function SedBucPage() {
  const ref = useReveal<HTMLElement>();

  return (
    <article ref={ref} className="ep-page ep-page--wide ep-sed">
      <Hero />

      <JumpNav items={JUMP} />

      <Section
        id="begreper"
        tone="accent"
        eyebrow="Begreper"
        title="Én BUC, mange SED-er"
        lead="En BUC er saken. SED-ene er dokumentene som sendes fram og tilbake i den, mellom NAV og institusjoner i andre land."
      >
        <BucConversation />
      </Section>

      <Section
        id="bucer"
        tone="meta-purple"
        eyebrow="BUC-er"
        title="Ti pensjons-BUC-er"
        lead={
          <>
            Saksbehandler kan opprette disse fra saksbehandling-ui. Listen og første SED ligger i fagmodul (
            <code>ValidBucAndSed</code>), ikke i EUX.
          </>
        }
      >
        <BucCatalog />
      </Section>

      <Section
        id="seder"
        tone="success"
        eyebrow="SED-er"
        title="SED-typene vi jobber med"
        lead={
          <>
            Typene er definert i <code>SedType</code> i ep-eux. Navnene er de saksbehandler ser i UI.
          </>
        }
      >
        <SedCatalog />
      </Section>

      <Section
        id="utgaende"
        tone="accent"
        eyebrow="Utgående"
        title="Fra saksbehandler til RINA"
        lead="BUC-en opprettes først. Så preutfylles SED-en og lagres som utkast, før saksbehandler sender."
      >
        <OutgoingFlow />
      </Section>

      <Section
        id="innkommende"
        tone="warning"
        eyebrow="Innkommende"
        title="Hver hendelse, fire mottakere"
        lead="RINA melder fra om alle sendte og mottatte SED-er på Kafka. Fire tjenester lytter, hver med sitt filter."
      >
        <IncomingFanout />
      </Section>

      <Section
        id="journalforing"
        tone="accent"
        eyebrow="Journalføring"
        title="Fra hendelse til journalpost"
        lead="journalforing gjør mest. Hver SED blir en journalpost, og ender med en oppgave eller et krav."
      >
        <JournalSteps />
      </Section>

      <Section
        id="ruting"
        tone="success"
        eyebrow="Ruting"
        title="Hvilken enhet får saken?"
        lead={
          <>
            Reglene ligger i ep-routing, én per BUC. De ser på bosted, alder og sakstype. Hold musen over et nummer for
            navnet.
          </>
        }
      >
        <RoutingMatrix />
      </Section>

      <Section
        id="spesialtilfeller"
        tone="neutral"
        eyebrow="Spesialtilfeller"
        title="Verdt å vite"
        lead="Regler som ikke følger hovedflyten."
      >
        <SpecialCases />
      </Section>

      <p className="ep-page__footnote">
        Bygget på ep-eux, ep-routing, fagmodul, prefill, journalforing, begrens-innsyn, pdl-produsent, statistikk,
        dodsmelding og saksbehandling-ui.
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

function Hero() {
  const stats = [
    { n: PENSION_BUCS.length, label: "pensjons-BUC-er", sub: "kan opprettes fra UI" },
    { n: P_SED_COUNT, label: "P-SED-typer", sub: "SedType i ep-eux" },
    { n: PREFILL_COUNT, label: "med egen preutfylling", sub: "PrefillSEDService" },
    { n: EDITOR_COUNT, label: "skjemaer i UI", sub: "P2000 · P5000 · P8000 · P12000 · X009" },
  ];
  const flows: { href: string; tone: Tone; title: string; text: string }[] = [
    { href: "#bucer", tone: "meta-purple", title: "BUC-ene", text: "Hva vi kan opprette." },
    { href: "#utgaende", tone: "accent", title: "Utgående", text: "Opprett, preutfyll og send." },
    { href: "#innkommende", tone: "warning", title: "Innkommende", text: "Journalføring, PDL og innsyn." },
    { href: "#ruting", tone: "success", title: "Ruting", text: "Hvilken enhet som får saken." },
  ];

  return (
    <header className="ep-arch-hero">
      <div className="ep-arch-hero__text ep-enter">
        <p className="ep-eyebrow">SED og BUC</p>
        <Heading level="1" size="xlarge" className="ep-arch-hero__title">
          Dokumentene vi utveksler med Europa
        </Heading>
        <p className="ep-arch-hero__lead">
          Pensjonssaker over landegrensene går som SED-er i BUC-er. Her ser du hvilke vi støtter, og hva som skjer med
          dem på vei ut og inn.
        </p>
      </div>

      <BucFolderArt />

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
          <li key={f.href} className="ep-enter" style={vars({ "--stagger": i + 5 })}>
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
