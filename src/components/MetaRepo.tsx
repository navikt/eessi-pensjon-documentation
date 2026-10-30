import type { CSSProperties, ComponentType, SVGProps } from "react";
import { CopyButton } from "@navikt/ds-react";
import { BranchingIcon, ChevronRightIcon, FilesIcon, PackageIcon, WrenchIcon } from "@navikt/aksel-icons";
import { APPLICATIONS, CATEGORIES, FRONTEND_LIBRARIES, TONE_BY_CATEGORY, repoUrl, type Tone } from "../lib/applications";

/*
 * How the eessi-pensjon meta repo works. Verified against .meta, Makefile,
 * settings.gradle, .gitignore and script/ in navikt/eessi-pensjon.
 */

const vars = (v: Record<string, string | number>) => v as CSSProperties;

const KEY_FILES = [
  {
    name: ".meta",
    use: "meta git clone · meta exec",
    text: "Listen over repoene. meta kloner dem og kjører kommandoer i hvert av dem.",
  },
  {
    name: "Makefile",
    use: "make <kommando>",
    text: "Snarveier som kjører skriptene i script/ i alle repoene.",
  },
  {
    name: "settings.gradle",
    use: "includeBuild",
    text: "Tar med Gradle-prosjektene, så alt kan åpnes som ett prosjekt i IntelliJ.",
  },
  {
    name: ".gitignore",
    use: "ep-*/ · eessi-pensjon-*/ …",
    text: "Holder repoene utenfor meta-repoets egen historikk.",
  },
];

const FOLDERS = [
  { name: "script/", text: "skriptene make kaller" },
  { name: "templates/", text: "felles filer til repoene" },
  { name: "template-data/", text: "verdier per repo" },
  { name: "docs/adr/", text: "arkitekturbeslutninger" },
  { name: "architecture.md", text: "kilden til denne portalen" },
];

type Step = { title: string; text: string; command?: string };

const GETTING_STARTED: Step[] = [
  {
    title: "Installer meta",
    text: "Krever Node, for eksempel fra brew install node.",
    command: "npm install meta -g --no-save",
  },
  {
    title: "Klon alt",
    text: "Kloner meta-repoet og deretter hvert repo i .meta.",
    command: "meta git clone git@github.com:navikt/eessi-pensjon.git",
  },
  {
    title: "Slå på git-hooks",
    text: "Setter core.hooksPath i repoene som har en .githooks-mappe.",
    command: "make setup-githooks",
  },
  {
    title: "Åpne i IntelliJ",
    text: "Åpne build.gradle i roten som prosjekt, så får du alle Gradle-prosjektene i ett vindu.",
  },
];

type Command = { cmd: string; text: string };

const COMMAND_GROUPS: {
  title: string;
  tone: Tone;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  commands: Command[];
}[] = [
  {
    title: "Git i alle repoene",
    tone: "accent",
    Icon: BranchingIcon,
    commands: [
      { cmd: "make pull", text: "git pull --rebase --autostash, parallelt." },
      { cmd: "make mainline", text: "Bytter til main eller master." },
      { cmd: "make meta-update", text: "Kloner repoer som står i .meta, men mangler lokalt." },
      { cmd: "make check-if-up-to-date", text: "Sjekker at alt er på mainline, committet, pushet og pullet." },
      { cmd: "make list-local-commits", text: "Viser commits som ikke er pushet." },
      { cmd: "make prepush-review", text: "Viser upushede commits repo for repo og spør om de skal pushes." },
    ],
  },
  {
    title: "Bygg",
    tone: "success",
    Icon: WrenchIcon,
    commands: [
      { cmd: "make build", text: "./gradlew build i hvert Gradle-prosjekt, med Java-versjonen fra .java-version." },
      { cmd: "make gw clean build", text: "Valgfri Gradle-oppgave i alle prosjektene, parallelt. Hopper over saksbehandling-ui." },
    ],
  },
  {
    title: "Avhengigheter",
    tone: "warning",
    Icon: PackageIcon,
    commands: [
      {
        cmd: "make upgrade-safe-dependencies",
        text: "Oppgraderer testavhengighetene i script/safe_dependency_upgrades.txt. Bygger og committer, pusher ikke.",
      },
      { cmd: "DEPENDENCY=group:name make upgrade-dependency", text: "Oppgraderer én avhengighet overalt. Bygger og committer." },
      { cmd: "make upgradable-dependencies-report", text: "Lister utdaterte avhengigheter på tvers av prosjektene." },
      { cmd: "GRADLEW_VERSION=x.y.z make upgrade-gradle", text: "Ny Gradle-wrapper i alle prosjektene. Bygger og committer." },
    ],
  },
  {
    title: "Felles filer",
    tone: "meta-purple",
    Icon: FilesIcon,
    commands: [
      {
        cmd: "make generate-files",
        text: "Lager Dockerfile, workflows, .gitignore og delt Kotlin-kode fra templates/ med verdier fra template-data/<repo>.yml. Filer merket # JINJA2_IGNORE hoppes over.",
      },
      { cmd: "make help", text: "Lister alle kommandoene." },
    ],
  },
];

const EP_UPGRADE = [
  { lib: "ep-logging · ep-metrics", text: "inn i de andre ep-bibliotekene" },
  { lib: "Se over", text: "prepush-review, og push" },
  { lib: "Vent", text: "til bibliotekene er publisert" },
  { lib: "ep-logging · ep-metrics", text: "inn i appene" },
  { lib: "ep-eux", text: "inn i appene" },
  { lib: "ep-personoppslag", text: "inn i appene" },
  { lib: "ep-kodeverk", text: "inn i appene" },
  { lib: "ep-routing", text: "inn i appene" },
];

const BUMP_ORDER = ["tabell", "fetch-api", "land-verktoy", "flagg-ikoner", "landvelger"];
const BUMP_PIPELINE = ["git pull", "ny versjon", "npm test", "build", "commit og push", "npm publish"];

/** Repos in .meta, Gradle builds in settings.gradle (keep in sync) and npm packages. */
export const REPO_COUNT = APPLICATIONS.length;
export const GRADLE_BUILD_COUNT = 18;
export const NPM_PACKAGE_COUNT = FRONTEND_LIBRARIES.length;

export function GettingStarted() {
  return (
    <ol className="ep-meta-steps">
      {GETTING_STARTED.map((s, i) => (
        <li key={s.title} className="ep-meta-step" style={vars({ "--stagger": i })} data-reveal>
          <span className="ep-meta-step__n" aria-hidden>
            {i + 1}
          </span>
          <div className="ep-meta-step__body">
            <p className="ep-meta-step__title">{s.title}</p>
            <p className="ep-meta-step__text">{s.text}</p>
            {s.command && <CommandLine cmd={s.command} />}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function MakeCommands() {
  return (
    <div className="ep-meta-cmds">
      {COMMAND_GROUPS.map((g, i) => (
        <section
          key={g.title}
          className="ep-meta-cmds__group"
          data-tone={g.tone}
          aria-label={g.title}
          data-reveal
          style={vars({ "--stagger": i })}
        >
          <p className="ep-meta-cmds__title">
            <g.Icon aria-hidden />
            {g.title}
          </p>
          <ul>
            {g.commands.map((c) => (
              <li key={c.cmd} className="ep-meta-cmd">
                <CommandLine cmd={c.cmd} />
                <p className="ep-meta-cmd__text">{c.text}</p>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export function UpgradeFlows() {
  return (
    <div className="ep-meta-flows">
      <figure className="ep-meta-flow" data-tone="warning" data-reveal>
        <figcaption className="ep-meta-flow__head">
          <span className="ep-meta-flow__title">Backend-bibliotekene</span>
          <code>make upgrade-ep-libraries-part-1 … 8</code>
        </figcaption>
        <ol className="ep-meta-track">
          {EP_UPGRADE.map((s, i) => (
            <li key={i} className="ep-meta-track__step" style={vars({ "--i": i })}>
              <span className="ep-meta-track__n">{i + 1}</span>
              <span className="ep-meta-track__lib ep-mono">{s.lib}</span>
              <span className="ep-meta-track__text">{s.text}</span>
            </li>
          ))}
        </ol>
        <p className="ep-meta-flow__note">
          Rekkefølgen følger avhengighetene: ep-logging og ep-metrics brukes av de andre bibliotekene. Fra steg 4 puller
          hvert steg, oppgraderer, pusher og ber deg vente til appene er deployet før neste.
        </p>
      </figure>

      <figure className="ep-meta-flow" data-tone="accent" data-reveal style={vars({ "--stagger": 1 })}>
        <figcaption className="ep-meta-flow__head">
          <span className="ep-meta-flow__title">Frontend-bibliotekene</span>
          <code>script/bumpPackages.sh "melding" [major|minor|patch|wip] [wip]</code>
        </figcaption>
        <ol className="ep-meta-chain" aria-label="Rekkefølge">
          {BUMP_ORDER.map((id, i) => (
            <li key={id} style={vars({ "--i": i })}>
              <span className="ep-meta-chain__pkg ep-mono">{id}</span>
              {i < BUMP_ORDER.length - 1 && <ChevronRightIcon aria-hidden className="ep-meta-chain__arrow" />}
            </li>
          ))}
        </ol>
        <p className="ep-meta-flow__sub">For hver pakke:</p>
        <ol className="ep-meta-pipe">
          {BUMP_PIPELINE.map((p, i) => (
            <li key={p} style={vars({ "--i": i })}>
              {p}
            </li>
          ))}
        </ol>
        <p className="ep-meta-flow__note">
          Uten bump-type økes patch-versjonen. Med <code>wip</code> blir versjonen <code>-wipN</code> og publiseres med{" "}
          <code>--tag wip</code>. Land-pakkene får også avhengighetene til hverandre oppdatert.{" "}
          <code>script/bumpLandPackages.sh</code> gjør det samme for bare de tre land-pakkene. Krever <code>jq</code>.
        </p>
      </figure>
    </div>
  );
}

function CommandLine({ cmd }: { cmd: string }) {
  return (
    <div className="ep-meta-cmdline">
      <code>
        <span className="ep-meta-cmdline__prompt" aria-hidden>
          $
        </span>
        {cmd}
      </code>
      <CopyButton copyText={cmd} size="xsmall" title={`Kopier ${cmd}`} activeText="Kopiert" />
    </div>
  );
}

/** The meta repo on the left, the repos it lists on the right. */
export function MetaMap() {
  const groups = CATEGORIES.map((c) => ({
    ...c,
    label: c.id === "bibliotek" ? "Biblioteker" : c.label,
    repos: APPLICATIONS.filter((a) => a.category === c.id),
  }));
  const frontendIds = new Set(FRONTEND_LIBRARIES.map((a) => a.id));

  return (
    <figure className="ep-meta-map" data-reveal>
      <div className="ep-meta-map__root">
        <p className="ep-meta-map__repo ep-mono">navikt/eessi-pensjon</p>
        <p className="ep-meta-map__sub">Meta-repo, ingen applikasjonskode</p>
        <ul className="ep-meta-map__files">
          {KEY_FILES.map((f, i) => (
            <li key={f.name} style={vars({ "--i": i })}>
              <span className="ep-meta-map__file ep-mono">{f.name}</span>
              <span className="ep-meta-map__use ep-mono">{f.use}</span>
              <span className="ep-meta-map__text">{f.text}</span>
            </li>
          ))}
        </ul>
        <ul className="ep-meta-map__folders">
          {FOLDERS.map((f) => (
            <li key={f.name}>
              <span className="ep-mono">{f.name}</span> {f.text}
            </li>
          ))}
        </ul>
      </div>

      <div className="ep-meta-map__wire" aria-hidden>
        <span className="ep-meta-map__wire-label ep-mono">meta git clone</span>
        <span className="ep-meta-map__wire-line">
          <span className="ep-meta-map__wire-dot" />
          <span className="ep-meta-map__wire-dot" />
        </span>
        <span className="ep-meta-map__wire-label ep-mono">meta exec</span>
      </div>

      <div className="ep-meta-map__repos">
        <p className="ep-meta-map__count">
          <strong>{APPLICATIONS.length}</strong> repoer i <code>.meta</code>, hvert med egen historikk, CI og deploy
        </p>
        {groups.map((g) => (
          <div key={g.id} className="ep-meta-map__group" data-tone={TONE_BY_CATEGORY[g.id]}>
            <p className="ep-meta-map__group-label">{g.label}</p>
            <ul>
              {g.repos.map((a, i) => (
                <li key={a.id} style={vars({ "--i": i })}>
                  <a href={repoUrl(a)} target="_blank" rel="noreferrer" className="ep-meta-map__chip ep-mono">
                    {a.id.replace(/^eessi-pensjon-/, "")}
                    {frontendIds.has(a.id) && <span className="ep-meta-map__npm">npm</span>}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <figcaption className="ep-visually-hidden">
        Meta-repoet navikt/eessi-pensjon lister {APPLICATIONS.length} repoer i .meta og kjører kommandoer i dem med meta.
      </figcaption>
    </figure>
  );
}
