import type { CSSProperties, ReactNode } from "react";
import { Heading } from "@navikt/ds-react";
import { ArrowRightIcon } from "@navikt/aksel-icons";
import { ComplianceFlow, ComplianceTools } from "../components/ComplianceTools";
import { JumpNav, SectionHead, type JumpItem } from "../components/PageSections";
import {
  GRADLE_BUILD_COUNT,
  GettingStarted,
  MakeCommands,
  MetaMap,
  NPM_PACKAGE_COUNT,
  REPO_COUNT,
  UpgradeFlows,
} from "../components/MetaRepo";
import type { Tone } from "../lib/applications";
import { useReveal } from "../lib/motion";

const vars = (v: Record<string, string | number>) => v as CSSProperties;

const JUMP: JumpItem[] = [
  { id: "meta-repoet", label: "Meta-repoet" },
  { id: "kom-i-gang", label: "Kom i gang" },
  { id: "kommandoer", label: "make-kommandoer" },
  { id: "oppgradere", label: "Oppgradere bibliotekene" },
  { id: "etterlevelse", label: "Etterlevelse" },
];

export function DevelopmentPage() {
  const ref = useReveal<HTMLElement>();

  return (
    <article ref={ref} className="ep-page ep-page--wide ep-dev">
      <Hero />

      <JumpNav items={JUMP} />

      <Section
        id="meta-repoet"
        tone="accent"
        eyebrow="Meta-repoet"
        title="Ett repo som kjenner alle de andre"
        lead="navikt/eessi-pensjon holder ingen applikasjonskode selv. Det lister repoene, kloner dem med meta og gir felles kommandoer for å jobbe med alle samtidig."
      >
        <MetaMap />
      </Section>

      <Section
        id="kom-i-gang"
        tone="success"
        eyebrow="Kom i gang"
        title="Fra tom maskin til alt i IntelliJ"
        lead="Fire steg. Etterpå bruker du git som vanlig i hvert repo."
      >
        <GettingStarted />
      </Section>

      <Section
        id="kommandoer"
        tone="meta-purple"
        eyebrow="make-kommandoer"
        title="Én kommando, alle repoene"
        lead={
          <>
            Kjøres fra roten av meta-repoet. De fleste går via <code>meta exec</code> og hopper over meta-repoet selv.{" "}
            <code>make help</code> lister alle.
          </>
        }
      >
        <MakeCommands />
      </Section>

      <Section
        id="oppgradere"
        tone="warning"
        eyebrow="Oppgradere bibliotekene"
        title="I riktig rekkefølge"
        lead="Bibliotekene avhenger av hverandre, så de oppgraderes steg for steg. Backend via make, frontend via et skript som publiserer til npm."
      >
        <UpgradeFlows />
      </Section>

      <Section
        id="etterlevelse"
        tone="accent"
        eyebrow="Etterlevelse"
        title="Fra krav til ferdig tekst"
        lead={
          <>
            Vi dokumenterer etterlevelseskravene i{" "}
            <a href="https://etterlevelse.ansatt.nav.no/">Støtte til etterlevelse</a>. En agent i Copilot CLI skriver
            utkastene, og teamet kvalitetssikrer dem før de limes inn. Alt ligger i <code>etterlevelse/</code> og{" "}
            <code>.github/</code> i meta-repoet.
          </>
        }
      >
        <div className="ep-ett">
          <ComplianceFlow />
          <ComplianceTools />
        </div>
      </Section>

      <p className="ep-page__footnote">
        Bygget på <code>.meta</code>, <code>Makefile</code>, <code>settings.gradle</code>, <code>script/</code>,{" "}
        <code>etterlevelse/</code> og <code>.github/</code> i meta-repoet. Mer i <code>docs/dev/</code>.
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

const TERMINAL = [
  "meta git clone …/eessi-pensjon.git",
  "make pull",
  "make build",
  "make prepush-review",
];

function Hero() {
  const stats = [
    { n: REPO_COUNT, label: "repoer i .meta", sub: "egen historikk, CI og deploy" },
    { n: GRADLE_BUILD_COUNT, label: "Gradle-prosjekter", sub: "includeBuild i settings.gradle" },
    { n: NPM_PACKAGE_COUNT, label: "npm-pakker", sub: "@navikt/…" },
  ];
  const flows: { href: string; tone: Tone; title: string; text: string }[] = [
    { href: "#kom-i-gang", tone: "success", title: "Kom i gang", text: "Klon alt og åpne det i IntelliJ." },
    { href: "#kommandoer", tone: "meta-purple", title: "make-kommandoer", text: "Pull, bygg og oppgrader overalt." },
    { href: "#oppgradere", tone: "warning", title: "Oppgradere", text: "ep-bibliotekene og npm-pakkene." },
    { href: "#etterlevelse", tone: "accent", title: "Etterlevelse", text: "Agenten, skillene og QA-visningen." },
  ];

  return (
    <header className="ep-arch-hero">
      <div className="ep-arch-hero__text ep-enter">
        <p className="ep-eyebrow">Utvikling</p>
        <Heading level="1" size="xlarge" className="ep-arch-hero__title">
          Slik jobber vi med koden
        </Heading>
        <p className="ep-arch-hero__lead">
          Hver app og hvert bibliotek har sitt eget repo. Meta-repoet samler dem, så du kan klone, bygge og oppgradere
          alt med én kommando.
        </p>
      </div>

      <div className="ep-arch-hero__art ep-dev-term-wrap" aria-hidden>
        <div className="ep-dev-term">
          <div className="ep-dev-term__bar">
            <span />
            <span />
            <span />
            <span className="ep-dev-term__title ep-mono">eessi-pensjon</span>
          </div>
          <div className="ep-dev-term__body ep-mono">
            {TERMINAL.map((line, i) => (
              <p key={line} className="ep-dev-term__line" style={vars({ "--i": i })}>
                <span className="ep-dev-term__prompt">$</span>
                {line}
              </p>
            ))}
            <p className="ep-dev-term__line" style={vars({ "--i": TERMINAL.length })}>
              <span className="ep-dev-term__prompt">$</span>
              <span className="ep-dev-term__cursor" />
            </p>
          </div>
        </div>
      </div>

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
