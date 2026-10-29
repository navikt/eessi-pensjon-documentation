# eessi-pensjon-documentation

Dokumentasjonsportal for EESSI Pensjon. Frontend til
[eessi-pensjon-documentation-api](https://github.com/navikt/eessi-pensjon-documentation-api).

| Miljø | URL |
|---|---|
| dev-gcp | https://eessi-pensjon-documentation.intern.dev.nav.no |
| dev-gcp | https://eessi-pensjon-documentation.ansatt.dev.nav.no |

## Stack

- React 19, TypeScript 5, Vite 8
- [Aksel](https://aksel.nav.no) 8 (`@navikt/ds-react`, `@navikt/ds-css`, `@navikt/aksel-icons`)
- Ingen router- eller state-bibliotek: en liten router i `src/lib/router.ts` bruker History API-et
- `server/server.mjs`: Node-server uten avhengigheter som serverer bygget og fungerer som BFF

## Slik henger det sammen

```
Nettleser ──▶ Wonderwall (sidecar) ──▶ server.mjs ──▶ eessi-pensjon-documentation-api
              innlogging Entra ID      • validerer token (Texas introspection)
                                       • /api/me  → innlogget bruker
                                       • /api/*   → OBO-token (Texas) og proxy til API-et
                                       • alt annet → index.html / statiske filer
```

Dokumentasjonen er åpen for alle, så Wonderwall kjører uten `autoLogin`. Sider som krever innlogging
(foreløpig bare «Systemstatus») har `requiresLogin` i `src/lib/navigation.ts` og står i `PROTECTED_PATHS` i
`server/server.mjs`. De får et hengelås-ikon i menyen, og serveren sender brukeren til innlogging når siden
lastes direkte. `/api/*` krever alltid innlogging.

## Utvikling lokalt

```bash
npm install
npm run dev          # http://localhost:5173
```

`npm run dev` kjører samme request-handler som `server/server.mjs` inne i Vite for `/api/*`
(lokal modus: falsk bruker, ingen tokenveksling), og proxier videre til API-et på
`http://localhost:8080` (overstyr med `DOCUMENTATION_API_URL`). Start API-et med `local`-profilen for at
«Systemstatus» skal bli grønn (se README i eessi-pensjon-documentation-api).

Uten `NAIS_TOKEN_EXCHANGE_ENDPOINT` og `NAIS_TOKEN_INTROSPECTION_ENDPOINT` kjører serveren i lokal modus.

| Kommando | |
|---|---|
| `npm run typecheck` | TypeScript-sjekk |
| `npm test` | Tester for `server/server.mjs` (`node:test`) |
| `npm run build` | Produksjonsbygg til `dist/` |
| `npm run preview` | Bygg og kjør serveren mot `dist/` |

## Nye sider

Alle sider står i `src/lib/navigation.ts`. Menyen og routeren leser samme liste. Sider med
`comingSoon: true` vises som plassholdere. Legg ny sidekomponent i `src/pages/` og koble den inn i
`CurrentPage` i `src/App.tsx`.

## Bygg og deploy

`.github/workflows/build-deploy.yaml` kjører typecheck, tester og bygg på alle PR-er. Push til `main`
bygger image og deployer til dev-gcp med `.nais/nais.yaml` + `.nais/dev.yaml`.
