import type { ComponentType, SVGProps } from "react";
import {
  BookIcon,
  BranchingIcon,
  CodeIcon,
  ComponentIcon,
  FileTextIcon,
  GlobeIcon,
  HeartIcon,
  HouseIcon,
  TerminalIcon,
} from "@navikt/aksel-icons";

export type NavItem = {
  href: string;
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement> & { title?: string }>;
  /** Short description, used on placeholder pages and in cards. */
  description?: string;
  /** The page is planned but not written yet. */
  comingSoon?: boolean;
  external?: boolean;
  /** Only for logged-in employees. Keep in sync with PROTECTED_PATHS in server/server.mjs. */
  requiresLogin?: boolean;
};

export type NavSection = {
  heading?: string;
  items: NavItem[];
};

/** The single list of pages. The sidebar and the router both read it. */
export const NAV_SECTIONS: NavSection[] = [
  {
    items: [{ href: "/", label: "Oversikt", Icon: HouseIcon }],
  },
  {
    heading: "Dokumentasjon",
    items: [
      {
        href: "/arkitektur",
        label: "Arkitektur",
        Icon: BranchingIcon,
        description: "Hvordan applikasjonene i EESSI Pensjon henger sammen, synkront og via Kafka.",
      },
      {
        href: "/applikasjoner",
        label: "Applikasjoner",
        Icon: ComponentIcon,
        description: "Hver tjeneste og hvert bibliotek: ansvar, avhengigheter og hvor koden ligger.",
      },
      {
        href: "/utvikling",
        label: "Utvikling",
        Icon: TerminalIcon,
        description: "Meta-repoet, make-kommandoene, oppgradering av bibliotekene og etterlevelsesverktøyene.",
      },
      {
        href: "/sed-og-buc",
        label: "SED og BUC",
        Icon: FileTextIcon,
        description: "Pensjons-SED-ene og BUC-ene vi støtter, og hvordan de behandles.",
        comingSoon: true,
      },
      {
        href: "/ordliste",
        label: "Ordliste",
        Icon: BookIcon,
        description: "Begreper fra EESSI, RINA og pensjonsdomenet forklart kort.",
        comingSoon: true,
      },
    ],
  },
  {
    heading: "Verktøy",
    items: [
      {
        href: "/status",
        label: "Systemstatus",
        Icon: HeartIcon,
        description: "Sjekker at portalen når sitt eget API med innlogget bruker.",
        requiresLogin: true,
      },
    ],
  },
  {
    heading: "Lenker",
    items: [
      {
        href: "https://github.com/navikt/eessi-pensjon",
        label: "GitHub",
        Icon: CodeIcon,
        external: true,
      },
      {
        href: "https://eux-docs.intern.dev.nav.no",
        label: "EUX-portalen",
        Icon: GlobeIcon,
        external: true,
      },
    ],
  },
];

export const INTERNAL_PAGES: NavItem[] = NAV_SECTIONS.flatMap((s) => s.items).filter((i) => !i.external);

export function findPage(pathname: string): NavItem | undefined {
  const normalized = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return INTERNAL_PAGES.find((p) => p.href === normalized);
}

export function isActive(pathname: string, item: NavItem): boolean {
  if (item.external) return false;
  if (item.href === "/") return pathname === "/";
  return pathname === item.href || pathname.startsWith(item.href + "/");
}
