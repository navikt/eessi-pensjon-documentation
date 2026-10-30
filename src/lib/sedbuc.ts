import type { Tone } from "./applications";

/*
 * SED and BUC facts for the "SED og BUC" page. Verified against:
 *  - ep-eux: BucType.kt, SedType.kt
 *  - eessi-pensjon-fagmodul: eux/ValidBucAndSed.kt, api/PrefillController.kt, EuxPrefillService.kt
 *  - eessi-pensjon-prefill: sed/PrefillSEDService.kt
 *  - eessi-pensjon-saksbehandling-ui: public/locales/nb/buc.json (names), SEDHeader.tsx (editors)
 *  - eessi-pensjon-journalforing: GyldigeHendelser.kt, JournalforingService.kt, KravInitialiseringsService.kt
 *  - ep-routing: EnhetHandler.kt, Pbuc*.kt, Hbuc07.kt, Rbuc02.kt, DefaultEnhetHandler.kt, Enhet.kt
 *  - eessi-pensjon-{begrens-innsyn,pdl-produsent,statistikk,dodsmelding}
 */

export type BucInfo = {
  code: string;
  name: string;
  /** The SED that starts the BUC (fagmodul ValidBucAndSed). */
  starts: string[];
  gjenny?: boolean;
  avdod?: boolean;
  krav?: boolean;
  tone: Tone;
};

export const PENSION_BUCS: BucInfo[] = [
  { code: "P_BUC_01", name: "Krav om alderspensjon", starts: ["P2000"], krav: true, tone: "accent" },
  { code: "P_BUC_02", name: "Krav om etterlattepensjon", starts: ["P2100"], gjenny: true, avdod: true, tone: "accent" },
  { code: "P_BUC_03", name: "Krav om uføretrygd", starts: ["P2200"], krav: true, tone: "accent" },
  {
    code: "P_BUC_04",
    name: "Anmodning om perioder med omsorg for barn",
    starts: ["P1000"],
    gjenny: true,
    tone: "success",
  },
  {
    code: "P_BUC_05",
    name: "Ad hoc anmodning om pensjonsopplysninger",
    starts: ["P8000"],
    gjenny: true,
    avdod: true,
    tone: "success",
  },
  {
    code: "P_BUC_06",
    name: "Melding om pensjonsopplysninger",
    starts: ["P5000", "P6000", "P7000", "P10000"],
    gjenny: true,
    avdod: true,
    tone: "success",
  },
  {
    code: "P_BUC_07",
    name: "Anmodning om pensjonsbeløp til fastsettelse av tilleggsytelser",
    starts: ["P11000"],
    gjenny: true,
    tone: "meta-purple",
  },
  {
    code: "P_BUC_08",
    name: "Informasjon om pensjonsbeløp til innvilgelse av et pensjonstillegg",
    starts: ["P12000"],
    gjenny: true,
    tone: "meta-purple",
  },
  { code: "P_BUC_09", name: "Endring i personlige forhold", starts: ["P14000"], gjenny: true, tone: "warning" },
  { code: "P_BUC_10", name: "Overgangssaker", starts: ["P15000"], gjenny: true, avdod: true, tone: "warning" },
];

/** BUCs outside sector P that journalforing processes (GyldigeHendelser.kt). */
export const OTHER_BUCS: { code: string; name: string }[] = [
  { code: "H_BUC_07", name: "Melding om dødsfall" },
  { code: "R_BUC_02", name: "Motregning av overskytende utbetaling i etterbetalinger" },
  { code: "M_BUC_02", name: "Krav om ytelser ved tidligpensjonering" },
];

export type SedTag = "prefill" | "editor" | "krav" | "statistikk";

export const SED_TAGS: { tag: SedTag; label: string; text: string }[] = [
  { tag: "prefill", label: "Egen preutfylling", text: "Egen klasse i prefill henter data fra PDL og Pesys" },
  { tag: "editor", label: "Redigeres i UI", text: "Eget skjema i saksbehandling-ui" },
  { tag: "krav", label: "Krav i Pesys", text: "Mottatt SED kan opprette krav automatisk" },
  { tag: "statistikk", label: "Statistikk", text: "Den eneste SED-en statistikk bryr seg om" },
];

export type SedInfo = { code: string; name: string; tags?: SedTag[] };

export type SedGroup = { title: string; tone: Tone; seds: SedInfo[] };

export const SED_GROUPS: SedGroup[] = [
  {
    title: "Krav",
    tone: "accent",
    seds: [
      { code: "P2000", name: "Krav om alderspensjon", tags: ["prefill", "editor", "krav"] },
      { code: "P2100", name: "Krav om etterlattepensjon", tags: ["prefill"] },
      { code: "P2200", name: "Krav om uføretrygd", tags: ["prefill", "krav"] },
    ],
  },
  {
    title: "Perioder og historikk",
    tone: "success",
    seds: [
      { code: "P1000", name: "Anmodning om perioder med omsorg for barn" },
      { code: "P1100", name: "Svar på anmodning om perioder med omsorg for barn" },
      { code: "P4000", name: "Opplysninger om trygdehistorikk", tags: ["prefill"] },
      { code: "P5000", name: "Trygde- og botidsperioder", tags: ["prefill", "editor"] },
    ],
  },
  {
    title: "Spørsmål og svar",
    tone: "success",
    seds: [
      { code: "P3000_XX", name: "Landspesifikk informasjon, én per land" },
      { code: "P8000", name: "Anmodning om tilleggsinformasjon", tags: ["prefill", "editor"] },
      { code: "P9000", name: "Svar på anmodning om tilleggsinformasjon" },
      { code: "P10000", name: "Oversendelse av ytterligere informasjon", tags: ["prefill"] },
    ],
  },
  {
    title: "Vedtak",
    tone: "meta-purple",
    seds: [
      { code: "P6000", name: "Vedtak om pensjon", tags: ["prefill", "statistikk"] },
      { code: "P7000", name: "Melding om vedtakssammendrag", tags: ["prefill"] },
    ],
  },
  {
    title: "Beløp og endringer",
    tone: "warning",
    seds: [
      { code: "P11000", name: "Anmodning om pensjonsbeløp" },
      { code: "P12000", name: "Informasjon om pensjonsbeløp", tags: ["editor"] },
      { code: "P13000", name: "Informasjon om pensjonstillegg" },
      { code: "P14000", name: "Endring i personlige forhold" },
      { code: "P15000", name: "Overføring av pensjonssaker til EESSI", tags: ["prefill"] },
    ],
  },
  {
    title: "Administrative (X)",
    tone: "neutral",
    seds: [
      { code: "X005", name: "Legg til ny deltaker", tags: ["prefill"] },
      { code: "X008", name: "Ugyldiggjør SED" },
      { code: "X009", name: "Påminnelse", tags: ["editor"] },
      { code: "X010", name: "Svar på påminnelse", tags: ["prefill"] },
      { code: "X011", name: "Avvis SED" },
    ],
  },
  {
    title: "Helse og refusjon (H, R)",
    tone: "neutral",
    seds: [
      { code: "H020", name: "Krav om refusjon", tags: ["prefill"] },
      { code: "H021", name: "Svar på krav om refusjon", tags: ["prefill"] },
      { code: "H070", name: "Melding om dødsfall" },
      { code: "R004", name: "Melding om utbetaling" },
      { code: "R005", name: "Anmodning om trekk i etterbetalinger" },
    ],
  },
];

/** P-SEDs in ep-eux SedType, with P3000_xx counted once. */
export const P_SED_COUNT = 18;
/** SED types with their own branch in PrefillSEDService.prefill(). */
export const PREFILL_COUNT = 14;
/** SED types with an editor in saksbehandling-ui (SEDHeader.tsx). */
export const EDITOR_COUNT = 5;

export type EnhetInfo = { nr: string; name: string };

export const ENHETER: Record<string, EnhetInfo> = {
  "4862": { nr: "4862", name: "NFP utland Ålesund" },
  "0001": { nr: "0001", name: "Pensjon utland" },
  "4476": { nr: "4476", name: "Uføre utlandstilsnitt" },
  "4475": { nr: "4475", name: "Uføre utland" },
  "4803": { nr: "4803", name: "Familie- og pensjonsytelser Oslo" },
  "4819": { nr: "4819", name: "Økonomi pensjon" },
  "4303": { nr: "4303", name: "ID og fordeling" },
  "2103": { nr: "2103", name: "Vikafossen (adressebeskyttelse)" },
};

export type RoutingCell = { when?: string; nr: string }[];

export type RoutingRow = { bucs: string; norge: RoutingCell; utland: RoutingCell; note?: string };

export const ROUTING: RoutingRow[] = [
  { bucs: "P_BUC_01 · P_BUC_04", norge: [{ nr: "4862" }], utland: [{ nr: "0001" }] },
  {
    bucs: "P_BUC_02",
    norge: [
      { when: "uføre", nr: "4476" },
      { when: "alder, gjenlevende, barn", nr: "4862" },
    ],
    utland: [
      { when: "uføre", nr: "4475" },
      { when: "alder, gjenlevende, barn", nr: "0001" },
    ],
  },
  { bucs: "P_BUC_03", norge: [{ nr: "4476" }], utland: [{ nr: "4475" }] },
  {
    bucs: "P_BUC_05–09",
    norge: [
      { when: "18–61 år", nr: "4476" },
      { when: "ellers", nr: "4862" },
    ],
    utland: [
      { when: "18–61 år", nr: "4475" },
      { when: "ellers", nr: "0001" },
    ],
    note: "Gjenlevende går til pensjon. P_BUC_05 ser også på relasjoner.",
  },
  {
    bucs: "P_BUC_10",
    norge: [
      { when: "uføre", nr: "4476" },
      { when: "mottatt alder, gjenlevende", nr: "4862" },
    ],
    utland: [
      { when: "uføre", nr: "4475" },
      { when: "ellers", nr: "0001" },
    ],
  },
  {
    bucs: "H_BUC_07",
    norge: [
      { when: "18–59 år", nr: "4476" },
      { when: "ellers", nr: "4803" },
    ],
    utland: [
      { when: "18–59 år", nr: "4475" },
      { when: "ellers", nr: "0001" },
    ],
  },
  {
    bucs: "R_BUC_02",
    norge: [{ when: "R004", nr: "4819" }],
    utland: [{ when: "R004", nr: "4819" }],
    note: "Andre mottatte R-SED-er: alder 0001, uføre 4475.",
  },
];
