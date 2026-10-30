import type { CSSProperties, ComponentType, SVGProps } from "react";
import {
  ArrowRightIcon,
  ClipboardCheckmarkIcon,
  ClipboardIcon,
  CogIcon,
  GlobeIcon,
  InboxDownIcon,
  MonitorIcon,
  RobotSmileIcon,
  TasklistIcon,
} from "@navikt/aksel-icons";
import { CommandLine } from "./MetaRepo";
import type { Tone } from "../lib/applications";

/*
 * The compliance (etterlevelse) tooling in the meta repo. Verified against
 * .github/agents/eessi-pensjon-etterlevelse.agent.md, .github/skills/etterlev*,
 * etterlevelse/server.js, etterlevelse/script/ and
 * templates/.github/workflows/etterlevelse-rapport.yml in navikt/eessi-pensjon.
 */

const vars = (v: Record<string, string | number>) => v as CSSProperties;

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

const FLOW: { Icon: Icon; tone: Tone; title: string; tool: string; files: string[] }[] = [
  { Icon: GlobeIcon, tone: "neutral", title: "Portalen", tool: "Kopier kravet", files: ["Støtte til etterlevelse"] },
  { Icon: InboxDownIcon, tone: "accent", title: "Lag input", tool: "/etterlevelse-input", files: ["agent-input/K255.1.txt"] },
  {
    Icon: RobotSmileIcon,
    tone: "meta-purple",
    title: "Skriv tekstene",
    tool: "/etterlev K255.1",
    files: ["agent-output/K255.1-…txt", "status.md", "apne-sporsmal.md"],
  },
  { Icon: ClipboardCheckmarkIcon, tone: "success", title: "Kvalitetssikre", tool: "QA-visning", files: ["qa-status.json"] },
  { Icon: ClipboardIcon, tone: "neutral", title: "Portalen", tool: "Lim inn", files: ["Hvordan oppfylles kriteriet?"] },
];

const STATUSES: { label: string; level: "success" | "info" | "warning" | "danger" }[] = [
  { label: "Ja", level: "success" },
  { label: "Ja (delvis)", level: "info" },
  { label: "Nei (delvis)", level: "warning" },
  { label: "Nei", level: "danger" },
];

/** Portal → input → texts → QA → portal. */
export function ComplianceFlow() {
  return (
    <figure className="ep-ett-flow" data-reveal>
      <ol className="ep-ett-flow__track">
        {FLOW.map((s, i) => (
          <li key={i} className="ep-ett-flow__node" data-tone={s.tone} style={vars({ "--i": i })}>
            <span className="ep-ett-flow__icon">
              <s.Icon aria-hidden />
            </span>
            <span className="ep-ett-flow__title">{s.title}</span>
            <code className="ep-ett-flow__tool">{s.tool}</code>
            <ul className="ep-ett-flow__files">
              {s.files.map((f) => (
                <li key={f} className="ep-mono">
                  {f}
                </li>
              ))}
            </ul>
            {i < FLOW.length - 1 && <ArrowRightIcon aria-hidden className="ep-ett-flow__arrow" />}
          </li>
        ))}
      </ol>
      <figcaption className="ep-ett-flow__caption">
        <span>
          Samlet vurdering per krav i <code>status.md</code>:
        </span>
        <ul className="ep-ett-statuses">
          {STATUSES.map((s) => (
            <li key={s.label} data-level={s.level}>
              {s.label}
            </li>
          ))}
        </ul>
        <span>Antagelser som må bekreftes, havner i <code>apne-sporsmal.md</code>.</span>
      </figcaption>
    </figure>
  );
}

type Tool = {
  kind: string;
  name: string;
  Icon: Icon;
  tone: Tone;
  model?: string;
  text: string;
  commands: string[];
  produces: string[];
  facts?: string[];
};

const TOOLS: Tool[] = [
  {
    kind: "Agent",
    name: "eessi-pensjon-etterlevelse",
    Icon: RobotSmileIcon,
    tone: "meta-purple",
    model: "Claude Opus 4.8",
    text: "Kjenner domenet, skrivereglene og avgrensningen mot EUX og fagsystemene. Skriver for kraveiere og jurister, ikke for utviklere. Brukes av /etterlev og /etterlevelse-rapport.",
    commands: ["/agent eessi-pensjon-etterlevelse"],
    produces: [".github/agents/eessi-pensjon-etterlevelse.agent.md"],
  },
  {
    kind: "Skill",
    name: "/etterlevelse-input",
    Icon: InboxDownIcon,
    tone: "accent",
    model: "Claude Sonnet 4.6",
    text: "Gjør teksten fra portalen om til en input-fil. paste.sh legger utklippstavlen i raw.txt, så linjeskiftene blir med. Kjør /compact før neste krav.",
    commands: ["etterlevelse/script/paste.sh", "/etterlevelse-input"],
    produces: ["agent-input/K<nr>.<v>.txt", "doc/preutfylltesvar/ hvis svar finnes"],
  },
  {
    kind: "Skill",
    name: "/etterlev",
    Icon: TasklistIcon,
    tone: "meta-purple",
    model: "Claude Opus 4.8",
    text: "Skriver én paste-klar tekst per suksesskriterium. Uten krav-ID får du en liste å velge fra. Spør før den overskriver et krav som er dokumentert.",
    commands: ["/etterlev K255.1"],
    produces: ["agent-output/K<nr>-suksesskriteriumN-….txt", "status.md", "apne-sporsmal.md"],
  },
  {
    kind: "Lokal app",
    name: "QA-visning",
    Icon: MonitorIcon,
    tone: "success",
    text: "Viser krav og tekster side om side på localhost:3333. Henter siste fra GitHub ved oppstart.",
    commands: ["node etterlevelse/server.js"],
    produces: ["agent-output/", "qa-status.json", "apne-sporsmal.md"],
    facts: [
      "Krav gruppert per tema",
      "Rediger og kopier tekstene",
      "Marker QA ✓",
      "QA nullstilles når teksten endres",
      "Kommenter åpne spørsmål",
      "Pull og push av etterlevelse/",
      "Oppdateres hvert 5. sekund",
    ],
  },
  {
    kind: "Skill",
    name: "/etterlevelse-rapport",
    Icon: ClipboardCheckmarkIcon,
    tone: "warning",
    model: "Claude Opus 4.8",
    text: "Vurderer én komponent mot alle kravene, med kodereferanser. Et internt arbeidsdokument, ikke tekst til portalen. Fra meta-repoet velger du komponenten.",
    commands: ["/etterlevelse-rapport"],
    produces: ["etterlevelse/etterlevelse-rapport.md i komponent-repoet"],
  },
  {
    kind: "GitHub Action",
    name: "Etterlevelsesrapport",
    Icon: CogIcon,
    tone: "warning",
    text: "Kjøres manuelt i et komponent-repo. Henter kravene, agenten og skillen fra meta-repoet, kjører /etterlevelse-rapport med Copilot CLI og lager en PR. Krever secret COPILOT_CLI_TOKEN.",
    commands: ["make generate-files"],
    produces: ["templates/.github/workflows/etterlevelse-rapport.yml"],
  },
];

export function ComplianceTools() {
  return (
    <ul className="ep-ett-tools">
      {TOOLS.map((t, i) => (
        <li key={t.name} className="ep-ett-tool" data-tone={t.tone} data-reveal style={vars({ "--stagger": i % 3 })}>
          <div className="ep-ett-tool__head">
            <span className="ep-ett-tool__icon">
              <t.Icon aria-hidden />
            </span>
            <div>
              <p className="ep-ett-tool__kind">{t.kind}</p>
              <p className="ep-ett-tool__name ep-mono">{t.name}</p>
            </div>
            {t.model && <span className="ep-ett-tool__model">{t.model}</span>}
          </div>
          <p className="ep-ett-tool__text">{t.text}</p>
          {t.facts && (
            <ul className="ep-ett-tool__facts">
              {t.facts.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          )}
          <div className="ep-ett-tool__cmds">
            {t.commands.map((c) => (
              <CommandLine key={c} cmd={c} />
            ))}
          </div>
          <p className="ep-ett-tool__produces">
            <span>{t.kind === "Agent" ? "Fil" : t.kind === "GitHub Action" ? "Mal" : "Skriver til"}</span>
            {t.produces.map((p) => (
              <code key={p}>{p}</code>
            ))}
          </p>
        </li>
      ))}
    </ul>
  );
}
