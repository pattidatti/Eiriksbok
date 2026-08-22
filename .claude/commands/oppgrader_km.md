---
description: Løft én km-* kompetansemål-artikkel i samfunnsfag opp til plan_article-referansestandard (ny signaturkomponent + 3D-mikrospill + språkvask + verifisering). Tar valgfritt artikkel-id som argument.
---

# Oppgrader km-artikkel til referansestandard

Samfunnsfag har 17 artikler prefikset `km-` (én per kompetansemål) under
`public/content/samfunnskunnskap/{eksamen,demografi,ideer-og-verdenssyn,mennesket-kultur-samfunn,styringsformer}/`.
De ble masseprodusert og holder **ikke** plan_article-kvalitet: de mangler unik signaturkomponent og
3D-mikrospill, har ofte norsk-tegn-feil, og noen har prop-drift-bugs. Vi løfter dem **én om gangen**.

**Referansestandard (allerede ferdig): `km-1-metode`.** Bruk den som mal for ambisjonsnivået.

---

## Steg 0 — Velg artikkel og les deg opp

1. **Velg artikkel.** Argument: `$ARGUMENTS`.
   - Hvis et km-id er gitt (f.eks. `km-8-terror-folkemord`), bruk det.
   - Hvis tomt: kjør `find public/content/samfunnskunnskap -name "km-*.json"`, sjekk hvilke som
     allerede er oppgradert (har en egen signaturkomponent + et `MicroGame`-kall i JSON-en), og
     **spør brukeren** med AskUserQuestion hvilken av de gjenstående vi tar.

2. **Les de autoritative kildene før du planlegger** (ikke hopp over):
   - Selve artikkel-JSON-en du skal oppgradere (kartlegg dagens innhold, prosa, komponenter).
   - `.agent/workflows/plan_article.md` (kvalitetsbaren — signaturkomponent + 3D-mikrospill er obligatorisk).
   - `.agent/workflows/build_interactive.md` (signaturkomponent-design).
   - `.agent/workflows/build_microgame.md` (mikrospill på kit-et i `src/components/microgames/kit/`).
   - **Referanse-implementasjonen:** `public/content/samfunnskunnskap/eksamen/km-1-metode.json`,
     `src/components/content/interactive/StatistikkVri.tsx`, og
     `src/components/microgames/Konklusjonsbroen3D.tsx`.
   - Sjekk minnet `project_km_artikler_oppgradering` for status og oppskrift.

---

## Steg 1 — Plan (presenter og vent på GO)

Lag en kort plan og **vent på at brukeren sier GO** før du bygger (som i plan_article):

- **Pedagogisk kjerne:** Hva er den ÉNE innsikten artikkelen skal sitte igjen med? Behold god
  eksisterende prosa; ikke skriv om for skrivingens skyld.
- **Signaturkomponent (ny, unik):** Beskriv en 2D-komponent som lærer bort kjernen interaktivt.
  Bygg alltid ny — aldri gjenbruk en eksisterende som signatur.
- **3D-mikrospill (i tillegg):** Beskriv et kort romlig "aha" bygd på kit-et. Velg en iscenesettelse
  som matcher emnet (ikke standard grønn-åker-diorama for abstrakte tema). Hopp bare over 3D hvis
  emnet virkelig ikke er romlig — og begrunn det da.
- **Språk/feil:** Noter tegnfeil og evt. prop-drift du fant.
- **Plassering:** Hvor i artikkelen de to nye motorene havner. Quiz forblir **siste** blokk.

Bruk AskUserQuestion ved reelle valg (hvor mye av eksisterende komponenter beholdes, osv.).

---

## Steg 2 — Bygg

1. **Signaturkomponent** → `src/components/content/interactive/<Navn>.tsx`, named export, registrer i
   `src/components/ComponentRegistry.tsx`. Embed i JSON: `{ "type": "component", "name": "<Navn>", "props": { ... } }`.
2. **3D-mikrospill** → `src/components/microgames/<Navn>.tsx` på kit-et (`MicroGameScaffold` + minst én
   direkte 3D-interaksjon), registrer i `src/components/microgames/registry.ts` med kebab-case `id`.
   Embed i JSON: `{ "type": "component", "name": "MicroGame", "props": { "gameId": "<id>" } }`.
3. **Språkvask:** rett alle norske tegn (å, ø, æ — aldri aa/oe/ae), fjern em-dash/tankestrek (bruk
   bindestrek). Hvis en gjenbrukt komponent krasjer på prop-drift, legg inn et bakoverkompatibelt
   alias-sikkerhetsnett i komponenten (slik `ScenarioRoleplay` allerede har fått).
4. **Bilder:** behold/legg `"heroImage": "/images/placeholder.webp"`, 3 inline placeholders med
   beskrivende norsk `alt`, og `"image": "/images/placeholder.webp"` i manifest-oppføringen. Ikke
   generer bilder selv — det skjer senere i Antigravity. La placeholderne stå: appen skjuler
   automatisk et bilde som ikke finnes, og viser det av seg selv når fila er generert.

### Ufravikelige designkrav
- **Lyst tema** alltid (glassmorphism), `rounded-xl`, Lucide-ikoner. Aldri mørk default-bakgrunn.
- **Juicy:** Framer Motion / spring-fysikk og umiddelbar respons — pedagogikk, ikke pynt.
- **Chromebook-først (1366×768):** store klikkflater, ingen intern scrolling, ingen full-HD-antakelser.
- **Norsk for en 14-åring:** korte, direkte setninger.

---

## Steg 3 — Verifiser (obligatorisk, ikke hopp over)

1. `npx tsc -b` og `npx eslint <de endrede/nye filene>` — begge **rene**. (Den eksisterende `any`-feilen
   på `componentRegistry`-linja i `ComponentRegistry.tsx` er repoets baseline — ikke din; ikke prøv å
   "fikse" den.)
2. Start dev (`npm run dev`), åpne artikkelen på **1366×768** med Playwright, og:
   - bekreft **0 konsollfeil**,
   - spill gjennom signaturkomponenten (alle tilstander),
   - spill gjennom mikrospillet (både seier- og fall/feil-sti),
   - screenshot til `.screenshots/` og slett dem etterpå.
3. **Rydd churn:** `scan:content` regenererer `content-index.json` og `manifest.json` (date-churn).
   Reverter disse hvis endringen kun er auto-generert støy. Rør aldri untrackede filer som ikke er dine.

---

## Steg 4 — Avslutt

- Oppdater minnet `project_km_artikler_oppgradering` (hvilken er nå ferdig, hva gjenstår).
- Oppsummer endrede filer. **Ikke commit** med mindre brukeren ber om det — og da kun det denne
  sesjonen har gjort (ikke sweep inn andres ustagede arbeid).
- Minn om at bildene fortsatt er placeholders og genereres i Antigravity.

Jobb med **én** artikkel per kjøring. Perfeksjoner den før du foreslår neste.
