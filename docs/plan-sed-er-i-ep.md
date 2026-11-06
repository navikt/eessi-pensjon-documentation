# Plan: Låst side «SED-er i EP» – søk på SED-type og åpne personens BUC-er i EESSI Pensjon

> Status: forslag. Ingen kode er skrevet ennå.

## Mål

En innlogget (låst) side i dokumentasjonsportalen, inspirert av «SED-er i nEESSI» i eux-portalen (`navikt/eux-architecture` → `portal/app/nav-rinasak/sed-er`). Utviklere og testere skal kunne:

- søke etter SED-er av en bestemt type (f.eks. P2000) i Q1/Q2
- se BUC, RINA-sak, retning/status, land og tidspunkt
- klikke en lenke som åpner **EESSI Pensjon med riktig person og personens BUC-er**
- åpne EP i **vedtakskontekst** eller **kravkontekst** når SED-en hører til et vedtak eller krav (`vedtakId` og `kravId` lagres)

`eessi-pensjon-documentation-api` skal ha endepunktet som gir siden dataene.

## Bakgrunn – hvordan eux gjør det

- `eux-portal-core` poller `eux-nav-rinasak` hvert 5. sekund (200 nyeste per miljø), holder maks 1000 rader i minnet, beriker med `eux-rina-document-events-v1`, korrelerer «sendt» mot `sedsendt-v1` og pusher til siden med SSE.
- EP har ingen tilsvarende `nav-rinasak`. Vi må derfor selv lagre et lite indeksobjekt per SED – i en GCP-bøtte (NAIS sin S3-kompatible lagring).

## Hva EP trenger for å åpne riktig person (verifisert i koden)

- **Pesys:** `https://pensjon-utland-{q1|q2}.intern.dev.nav.no/?aktoerId=…&sakId=…` (valgfritt `sakType`, `kravId`, `vedtakId`).
  - `RequireAuth.tsx` leser query-parametre til `state.app.params` (alias `fnr→aktoerId`, `saksNr/saksId→sakId`, `rinaid→rinaId`).
  - `applications/BUC/index.tsx` viser BUC-lista bare når både `aktoerId` og `sakId` finnes. Ellers vises `BUCEmpty`, som ber om det som mangler.
  - BUC-ene hentes via fagmodul `GET /rinasaker/{aktoerId}/saknr/{saknr}`.
- **Vedtakskontekst:** `…/?aktoerId=…&sakId=…&vedtakId=…`
  - `reducers/app.ts` setter `pesysContext = VEDTAKSKONTEKST` når `vedtakId` finnes (og `KRAVKONTEKST` for `kravId`).
  - `BUCIndexPage.tsx` henter da i tillegg `GET /rinasaker/{aktoerId}/saknr/{saknr}/vedtak/{vedtakid}`. Fagmodul finner avdøde fra Pesys-vedtaket (eller lagret P_BUC_02-info) og tar med BUC-ene knyttet til avdøde.
  - `vedtakId` brukes også av `PersonPanel`, `SEDStart` (vedtak-felt for P6000/P7000) og `P5000EditControls` (uføretidspunkt fra vedtaket).
- **Kravkontekst:** `…/?aktoerId=…&sakId=…&kravId=…` gir `KRAVKONTEKST`. Er både `kravId` og `vedtakId` satt, vinner `VEDTAKSKONTEKST` (`reducers/app.ts:71-77`).
- **Gjenny:** `https://pensjon-utland-{q1|q2}.intern.dev.nav.no/gjenny?aktoerId=…&sakId=…&sakType=…`
  - `BUCIndexGjenny.tsx` går rett til `BUCIndexPageGjenny` når alle tre finnes. Fnr trengs ikke.
- Per SED trenger vi altså **miljø + aktørId + sakId (+ vedtakId, kravId, sakType, Gjenny ja/nei)**.

## Hvor dataene finnes i dag

| Kilde | Har | Mangler |
|---|---|---|
| `sedsendt-v1` / `sedmottatt-v1` (`SedHendelse`) | rinaSakId, sedId, sedType, bucType, avsender/mottaker, `navBruker` (ofte tom) | aktørId, sakId, vedtakId, kravId |
| **journalforing** – `JournalforingService.journalfor()` | `SedHendelse` + `IdentifisertPDLPerson` (aktørId, adressebeskyttelse) + `SaksInfoSamlet` (sakId fra SED/Pesys, sakType) + Gjenny-info, for både sendt og mottatt | **vedtakId, kravId** (finnes ikke noe sted i journalforing) |
| **fagmodul** – `POST /sed/add` og `POST /sed/replysed/{parentid}` (`ApiRequest`) | aktoerId, sakId, **vedtakId**, **kravId**, sakType, buc, sed, euxCaseId, gjenny. SED-ID fra `opprettSedOgHentDocumentItem` | gjelder bare SED-er opprettet i EP; vet ikke om SED-en blir sendt |

→ **Begge trengs i første versjon:**

- **fagmodul** er eneste kilde til `vedtakId` og `kravId`. De finnes i `ApiRequest` når saksbehandleren har åpnet EP fra et vedtak eller krav i Pesys. fagmodul lagrer allerede `vedtakId → sedId/euxCaseId` i bøtte for P_BUC_02 (`GcpStorageService.lagrePBuc02Info`), så mønsteret er kjent.
- **journalforing** gir sendt/mottatt, og mottatte SED-er fra utlandet med identifisert person og sak.

Mønsteret finnes allerede: `GcpStorageService` brukes i journalforing, fagmodul, saksbehandling-api, pdl-produsent og oppgave. Bøtta `eessi-pensjon-gjenny-dev` eies av fagmodul og skrives av journalforing.

## Foreslått løsning

```
fagmodul-q1 / -q2          journalforing-q1 / -q2
(OPPRETTET + vedtak/krav)  (SENDT / MOTTATT)
          │  skriver ett JSON-objekt per SED-hendelse
          ▼
GCS-bøtte  eessi-pensjon-documentation-sed-dev
  {miljø}/{yyyy-MM-dd}/{rinaSakId}-{sedId}-{versjon}-{hendelse}.json
          │  leser (indeks i minnet)
          ▼
eessi-pensjon-documentation-api   GET /api/sed-er, GET /api/sed-er/typer
          │  BFF med on-behalf-of
          ▼
eessi-pensjon-documentation   låst side /sed-er
          │  lenke
          ▼
EESSI Pensjon (pensjon-utland-q1/q2) ?aktoerId=…&sakId=…[&vedtakId=… | &kravId=…]
```

### 1. Bøtte og kontrakt

- documentation-api eier bøtta i `.nais` (`gcp.buckets`), kun i dev-gcp. Lifecycle: slett etter 30 dager.
- Skrivetilgang for journalforing-q1/q2 og fagmodul-q1/q2, med samme mekanisme som `eessi-pensjon-gjenny-dev`. IAM må avklares.
- Ett objekt per hendelse. Dato-prefikset gjør det billig å liste de siste døgnene.
- Versjonert JSON-kontrakt:

```json
{
  "v": 1,
  "kilde": "fagmodul | journalforing",
  "miljo": "q2",
  "hendelse": "SENDT | MOTTATT | OPPRETTET",
  "tidspunkt": "2026-10-30T14:12:03Z",
  "rinaSakId": "1234567",
  "sedId": "…",
  "sedVersjon": "1",
  "sedType": "P2000",
  "bucType": "P_BUC_01",
  "avsenderLand": "NO",
  "mottakerLand": "SE",
  "aktoerId": "…",
  "sakId": "…",
  "vedtakId": "… | null",
  "kravId": "… | null",
  "sakType": "ALDER",
  "gjenny": false
}
```

- `vedtakId` og `kravId` er bare satt når kilden er fagmodul og SED-en ble laget i vedtaks- eller kravkontekst. journalforing skriver alltid `null`.
- **Dataminimering:** aktørId, ikke fnr. Ingen navn, adresser eller SED-innhold. Personer med adressebeskyttelse skrives ikke.

### 2. journalforing (produsent)

- Ny `SedIndeksService`, kalt etter journalføring av sendt og mottatt SED med dataene som allerede finnes i `journalfor()`.
- Styres av env-variabel (f.eks. `GCP_BUCKET_NAME_DOCUMENTATION`). Mangler den, gjør tjenesten ingenting. Settes aldri i prod-gcp.
- Feil ved skriving logges og svelges. Det skal aldri stoppe journalføringen.
- Tester: MockK for `Storage`; at adressebeskyttede hoppes over; at feil ikke bobler opp.

### 3. fagmodul (produsent – kilde til vedtakId og kravId)

- Etter vellykket `POST /sed/add` og `POST /sed/replysed/{parentid}`: skriv `OPPRETTET` med `aktoerId`, `sakId`, `vedtakId`, `kravId`, `sakType`, `gjenny`, `euxCaseId` og SED-ID-en fra `opprettSedOgHentDocumentItem` / `opprettSvarSedOgHentDocumentItem`.
- Gir vedtaks- og kravkontekst, og «opprettet, ikke sendt» som i nEESSI.
- Samme regler som i journalforing: styres av env-variabel, aldri i prod, feil svelges, ingen adressebeskyttede (hvordan fagmodul sjekker dette må avklares).
- Tester: at `vedtakId` og `kravId` kommer med, og at feil ved skriving ikke påvirker svaret til UI.

### 4. eessi-pensjon-documentation-api

- `Storage`-bean og leser. Ved oppstart lastes de siste 30 dagene. Deretter listes nye objekter hvert 30. sekund (dagens prefiks). Indeksen holdes i minnet med et tak (f.eks. 5000 rader).
- Hendelser slås sammen per `miljø + rinaSakId + sedId` til én rad med status (`OPPRETTET → SENDT`, eller `MOTTATT`). `vedtakId` og `kravId` fra fagmodul-hendelsen beholdes når journalforing-hendelsen kommer.
- **Arv på BUC-nivå (besluttet):** har én SED i en RINA-sak fått `vedtakId` eller `kravId`, får de andre radene i samme sak (f.eks. mottatte svar-SED-er) den også, merket `vedtakIdArvet` / `kravIdArvet: true`. Er det flere ulike verdier i samme sak, brukes den nyeste.
- Endepunkter:
  - `GET /api/sed-er?sedType=P2000&bucType=&miljo=q2&retning=&q=&limit=200` – liste, nyeste først
  - `GET /api/sed-er/typer` – antall per SED-type, til nedtrekk og fasetter
- Hver rad får ferdig bygde lenker, slik at frontend ikke trenger å kjenne URL-reglene:
  - `epLenke` – brukerkontekst: `?aktoerId=…&sakId=…` (Gjenny: `/gjenny?aktoerId=…&sakId=…&sakType=…`)
  - `epKontekstLenke` + `kontekst: VEDTAK | KRAV` – `?aktoerId=…&sakId=…&vedtakId=…` når `vedtakId` finnes, ellers `…&kravId=…` når `kravId` finnes. Samme prioritet som EP. Ikke for Gjenny.
- Søk på `vedtakId` og `kravId` i fritekst, og filter `kontekst=VEDTAK|KRAV`.
- Tilgang: vurder å begrense til EP-teamets Entra-gruppe (i dag `allowAllUsers: true`), siden svaret inneholder aktørId, sakId, vedtakId og kravId.
- Tester: controller, sammenslåing av hendelser (inkl. at `vedtakId`/`kravId` overlever og arves), og lenkebygger (bruker-, vedtaks-, krav- og Gjenny-lenke, vedtak foran krav).

### 5. eessi-pensjon-documentation (siden)

- Nytt menypunkt «SED-er i EP» med `requiresLogin: true` (hengelås), og siden bak `RequireLogin`.
- Søk og filter: SED-type (Aksel `UNSAFE_Combobox`, typer fra `src/lib/sedbuc.ts`), miljø (Q1/Q2), retning, kontekst (vedtak/krav), fritekst (RINA-sak, sakId, vedtakId, kravId, aktørId).
- Tabell (Aksel `Table` med utvidbare rader): tid, miljø, SED, BUC, RINA-sak, retning/status, land, kontekst (Aksel `Tag` «Vedtak» eller «Krav», med «arvet» når den kommer fra en annen SED i saken).
- Detaljer med knappene «Åpne i EESSI Pensjon» og, når `epKontekstLenke` finnes, «Åpne i vedtakskontekst» / «Åpne i kravkontekst» (primær). Begge åpner ny fane.
- Polling hvert 15. sekund i stedet for SSE. BFF-proxyen i `server/server.mjs` har 30 s timeout. SSE kan komme senere.
- Samme sideoppsett som resten av portalen (hero med tall: i dag / sendt / mottatt).

## Utenfor scope

- Prod. Siden er kun for dev (Q1/Q2) og testdata.
- Visning av SED-innhold og PDF.

## Åpne spørsmål

1. **Bøtte eller Kafka?** journalforing kan i stedet publisere til et nytt internt topic som documentation-api konsumerer (ingen delt bøtte eller IAM). Bøtta gir historikk som overlever omstart.
2. Hvem skal ha tilgang – alle innloggede eller bare EP-gruppa?
3. Lagringstid (forslag: 30 dager).
4. Mottatte SED-er uten identifisert sak: lenke med bare aktørId (EP ber da om sakId), eller ingen lenke?
5. Etterlevelse: behandlingsgrunnlag og ROS for lagring av aktørId, sakId, vedtakId og kravId i dev.

## Besluttet

- `kravId` lagres sammen med `vedtakId` og gir lenke i kravkontekst.
- `vedtakId` og `kravId` arves på BUC-nivå (RINA-sak) for SED-er fagmodul ikke har sett, f.eks. mottatte svar.

## Oppgaver

- [ ] Avklare åpne spørsmål
- [ ] Bøtte og IAM (`eessi-pensjon-documentation-api/.nais`)
- [ ] fagmodul: skrive `OPPRETTET` med `vedtakId` og `kravId` (q1/q2), med tester
- [ ] journalforing: skrive `SENDT`/`MOTTATT` (q1/q2), med tester
- [ ] documentation-api: leser, indeks, sammenslåing og arv av `vedtakId`/`kravId`, `GET /api/sed-er`, `GET /api/sed-er/typer`, lenkebygger (bruker/vedtak/krav/Gjenny), tester
- [ ] documentation: låst side `/sed-er` med søk, tabell og EP-lenker (inkl. vedtaks- og kravkontekst)
- [ ] Oppdatere `architecture.md` og Applikasjoner-siden

Berører: `navikt/eessi-pensjon-fagmodul`, `navikt/eessi-pensjon-journalforing`, `navikt/eessi-pensjon-documentation-api`, `navikt/eessi-pensjon-documentation`.

## Opprette issue

Kjøres fra `eessi-pensjon-documentation`:

```bash
gh issue create -R navikt/eessi-pensjon-documentation --title "Låst side «SED-er i EP»" --body-file docs/plan-sed-er-i-ep.md
```
