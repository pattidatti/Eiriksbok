---
description: Combined workflow for planning and implementing new articles/topics.
---

# Unified Article Workflow

This workflow covers the entire lifecycle of an article, from the initial pedagogical design to technical implementation and verification.

---

## Phase 1: Planning & Design
Focus on the "Soul" of the content before writing any code.

### 0. The Blueprint Check (CRITICAL)
- **Action:** Read `docs/Design documents/[subject]-design.md`.
- **Constraint:** You MUST extract the "Pedagogical Blueprint" for this specific article.
- **Fail Condition:** If no blueprint exists, STOP. Ask user to run `/plan_subject` phase 1 first.

### 1. Pedagogical Vision
- **Tone:** Wondering, pedagogical, and narrative-driven. 
- **Tone:** Derived from Blueprint.
- **Method:** Implement the "Mental Model" defined in the Blueprint.
- **Complexity:** Explain complex concepts (e.g., "Feudalisme") in an accessible way.
- **Cross-linking:** Identify other articles eleven naturlig vil ha nytte av, og lenk til dem **inne i brødteksten** der temaet nevnes. Tverrfaglig/interndisiplinær kobling er innlenker i prosaen, IKKE en samle-komponent på bunnen av artikkelen.

### 2. Content Structure
- **Length:** 1200 - 3000+ words (Dybdeartikler: 4000+).
- **Introduction:** Engaging hook and overview.
- **Core Sections:** Use `header` blocks (NOT nested sections).
- **Summary:** Concise wrap-up or "Deep Dive" conclusion.

### 3. Signaturkomponent (obligatorisk)

Hver artikkel skal ha **én signaturkomponent** — en interaktiv komponent som understreker, forsterker eller lærer bort artikkelens viktigste poeng (kjernen du definerte i 1. Pedagogical Vision). Signaturkomponenten er hovedlæringsmotoren i artikkelen, ikke et tilbehør.

**Designkrav (ikke-forhandlbart):**
- Brukervennlig: en 14-åring forstår hva hen skal gjøre innen 5 sekunder.
- Oversiktlig: én pedagogisk kjerne, ingen overlessing.
- Gøy: umiddelbar visuell respons. Framer Motion for state-endringer, juicy suksessanimasjon ved fullføring.
- Lærerik: eleven sitter igjen med en konkret innsikt etter interaksjonen.
- Visuelt: lys base, rounded-xl, Lucide-ikoner. Ingen mørk default-bakgrunn.
- Ingen intern scrolling. Fungerer på 1366×768 (Chromebook-baseline).

**Standard: lag ny komponent.** Les hele `.agent/workflows/build_interactive.md` og følg den slavisk. Skriv komponenten til `src/components/content/interactive/[Navn].tsx`, registrer i `src/components/ComponentRegistry.tsx`, og bruk i artikkel-JSON som `{ "type": "component", "name": "[Navn]", "props": { ... } }`.

**Unntak — gjenbruk:** Hvis en eksisterende custom-komponent treffer kjernepoenget like perfekt som en ny ville gjort, kan den gjenbrukes. I tvil — lag ny.

**Standard-komponenter (Quiz, FactBox, bilder, osv.) brukes i tillegg**, ikke i stedet for signaturkomponenten.

### 4. 3D-Mikrospill (i tillegg til signaturkomponenten)

**Hovedregel:** artikkelen får OGSÅ et skreddersydd 3D-mikrospill - en kort, romlig "aha"-opplevelse der eleven interagerer direkte med en 3D-verden (klikker objekter, drar dem på plass, justerer en spak, ser verdenen forvandle seg). Det kommer **i tillegg til** signaturkomponenten, ikke i stedet for: signaturkomponenten er artikkelens 2D-hovedmotor, mikrospillet er den romlige opplevelsen.

**Når hoppe over:** bare når emnet virkelig ikke egner seg for 3D (f.eks. ren grammatikk, rettskriving eller andre ikke-romlige tema). Dokumenter da kort i planen hvorfor mikrospill droppes. I tvil - lag det.

**Slik bygges det:** på interaksjons-toolkitet i `src/components/microgames/kit/`. Les hele `.agent/workflows/build_microgame.md` og følg den. Skriv spillet til `src/components/microgames/<Navn>.tsx`, registrer i `src/components/microgames/registry.ts` med en kebab-case `id`, og embed i artikkel-JSON:
```json
{ "type": "component", "name": "MicroGame", "props": { "gameId": "<id>" } }
```
Referanse-standard: `VikingShip3D.tsx` (dra-bygg med klikk + drag + slider + fler-stegs).

**Designkrav:** rik direkte interaksjon (ikke bare en knapperad), lys ramme, 3D-vindu i full bredde med kontroller under, Chromebook-trygge klikkflater, `onComplete` ved seier. Mekanikken skal være læringsmålet.

### 5. Layout & Components
- **Rich Layout (`"layout": "rich"`):** 
    - Required for historical topics with timelines.
    - Includes interactive sidebar with TOC and map links.
- **Component Selection:**
    - **Core Text Tools:**
        - `WritingFix`: [NEW] Essential for language/writing topics (show "Bad" vs "Good" examples).
        - `Comparison`: [NEW] Compare two texts, images, or concepts side-by-side.
        - `QuoteBlock`: For primary sources/citates. Eksakt prop-skjema (bruk `text`/`author`, IKKE `quote`/`source`): `{ "type": "component", "name": "QuoteBlock", "props": { "text": "<sitatet>", "author": "<kilde/opphav>" } }`
        - `FactBox`: For technical details/summaries.
        - `GlossaryTooltip`: For inline definitions (automatic, but can be manual).
        - `TextHighlighter` / `SentenceBuilder` / `GrammarRuleCard`: For deep language analysis.
        - **Tverrfaglig kobling = innlenker, ikke komponent.** Når artikkelen henger sammen med andre temaer, lenk til dem naturlig i brødteksten med `[tekst](/absolutt/sti)` der temaet nevnes (2-4 stykker per artikkel). IKKE lag en samle-komponent på bunnen. (`InterdisciplinaryBridge` finnes fortsatt for spesialtilfeller, men skal ikke brukes som standard.)
    - **Media & Visuals:**
        - `Gallery`: [NEW] For image collections (use consistent aspect ratios).
        - `TimelineComponent`: Use inside articles with `compact: true`.
        - `AllianceChain`: For causal chains (e.g. historical alliances).
        - `RelationshipMap`: For network visualizations.
        - `LineChart` / `PlotGraph`: For statistical data.
    - **History Simulations (Modern/WWI):**
        - `CensorTask`: [NEW] Interactive censorship simulation.
        - `PropagandaDecoder`: [NEW] Analyze propaganda techniques.
        - `TsarsDilemma`: [NEW] Decision-making game for the Russian Revolution.
        - `PowderKeg` / `DreadnoughtDuel`: [NEW] WWI prelude simulations.
        - `TrenchCrossSection` / `GasAttackSim` / `TankInterior` / `AttritionWarfare`.
    - **History Simulations (Roman/Antiquity):**
        - `RomanPantheonExplorer`: Interactive god explorer.
        - `TetrarchyVisualizer` / `PriceEdictExplorer` / `RomanDefenseModel`.
        - `DetectiveEngine`: Historical mystery solving.
    - **Politics & Society:**
        - `GovernmentExplorer`: Compare political systems.
        - `TotalitarianSandbox` / `BanalityRoutine`: Explore authoritarianism.
        - `FilterBubbleSim` / `ConformityExperiment` / `OstracismGame`: Social psychology.
        - `AuthorityShifter` / `SocialContractDecider` / `TrolleyProblem`.
    - **Economics & Demography:**
        - `InflationCalculator` / `TimePreferenceModel`.
        - `TradeLoopComponent` / `SpecializationSlider`: Trade mechanics.
        - `DTMSimulator` / `UrbanizationTimeline` / `PopulationPyramidBuilder`.
    - **Music & Creativity:**
        - `VirtualPiano`: Playable instrument.
        - `SongwriterStudio` / `BeatBuilder`: Creative music tools.
    - **Assessment:**
        - `Oppgaver` (obligatorisk, plassert nest sist — rett før Quiz): felles oppgavesett i bunnen av hver artikkel. Bloom-trapp med tre valgfrie kategorier — `forstaa` (finn fakta i teksten), `reflekter` (forklar/analyser/vurder), `gaaVidere` (diskusjon, skriveoppgave eller koble til nåtid = det ekstra utover teksten). Skriv gode oppgaver forankret i artikkelens innhold; "Gå videre" skal løfte eleven ut over gjengivelse. Komponenten har en innebygd "kopier oppgaver"-knapp. Se JSON-skjema i Phase 2.
        - `Quiz`: 3-5 questions, ALLER siste blokk (seriens faste sjekkpunkt).
    - **General Rule:** Make a model that underscores what the article is about. Make it interactive, beautiful, fun, and insightful.
    - **Lager du ny komponent?** Følg `/build_interactive`-skillet for designprinsipper og teknisk implementasjon.




---

## Phase 2: Technical Implementation
Focus on the "Bones" of the JSON structure.
**Standard:** Use the `article-implementation` skill for all technical decisions.

### 1. Manifest Entry
- Add the lesson to `public/content/manifest.json`.
- The `id` must match the filename and the `id` inside the JSON.

### 2. JSON Structure Rules
- **Flat Content:** The `content` array MUST be flat.
- **Components:** Select appropriate interactive blocks from the `article-implementation` catalog.
- **No Markdown Bolding:** Never use `**text**` for emphasis. Use the concept system.
- **Cross-linking:** Vev 2-4 naturlige innlenker inn i brødteksten med `[Link Text](/subject/topic/article-id)` der andre temaer nevnes. Dette er måten tverrfaglig kobling gjøres på — ikke en egen komponent.
- **Lists:** Use `{ "type": "list", "items": [...] }`. NEVER use markdown `-` lists.
- **Avslutning (obligatorisk rekkefølge):** Artikkelen avsluttes med en `Oppgaver`-blokk nest sist, og deretter `Quiz` som **ALLER siste blokk** (Quiz forblir seriens faste avslutning). `Oppgaver` er et felles oppgavesett (Bloom-trapp) som skal ligge like over Quiz på hver artikkel. Skjema:
  ```json
  {
    "type": "component",
    "name": "Oppgaver",
    "props": {
      "forstaa":   ["Finn-fakta-oppgave 1", "Finn-fakta-oppgave 2"],
      "reflekter": ["Analyser/vurder-oppgave 1", "Analyser/vurder-oppgave 2"],
      "gaaVidere": ["Diskusjon/skriv/koble-til-nåtid 1", "..."]
    }
  }
  ```
  Alle tre kategoriene er valgfrie (tomme utelates), men sikt på 3-4 i `forstaa`, 3-4 i `reflekter` og 2-3 i `gaaVidere`. Oppgavetekst kan inneholde innlenker (`[tekst](/sti)`). Kategoriene rendres med farge, ikon og fortløpende nummerering av komponenten — skriv bare selve oppgaveteksten.
- **Bilder (obligatorisk):** Artikkelen MÅ ha `"heroImage": "/images/placeholder.webp"` på toppnivå, og 3 inline bildebokser fordelt i content-arrayen. Eksakte plasseringer: (1) rett etter åpningsteksten, (2) ved et dramatisk vendepunkt midt i artikkelen, (3) etter siste hoveddel (før Quiz). `alt`-teksten (5-10 ord, norsk) beskriver konkret hva bildet skal vise — den brukes av bildegenererings-workflowen. Eksempel:
  ```json
  { "type": "image", "src": "/images/placeholder.webp", "alt": "Norske vikingskip i havn, 900-tallet", "caption": "Langskip brukt på raids" }
  ```

### 3. Global Data Sync
- **Timeline:** Sett `year` (eller `date`) på artikkel-JSON-objektet for at artikkelen skal havne i `/tidslinje`. Sub-events for samme artikkel legges i artikkelens egen `timeline[]`-array. `global-timeline.json` regenereres automatisk av `npm run scan:content` — **ikke rediger fila direkte**. Hand-kuraterte events uten tilhørende leksjon legges i `public/content/global-timeline.manual.json`.
- **Glossary & People:** 
    - Add new technical terms to `public/content/concepts/`.
    - Add historical figures to `public/content/people/` (MUST include `lifespan` and `link`).
- **Quiz:** Add 3-5 multiple-choice questions to the article JSON (under a `quiz` field).

---

## Phase 3: Visuals & Verification
Final polish and technical checks.

### 1. Bilder — verifiser plassholdere
Sjekk at artikkelen har alle bildeplassholdere (krav beskrevet i Phase 2, JSON Structure Rules):
- [ ] `"heroImage": "/images/placeholder.webp"` på toppnivå
- [ ] `"image": "/images/placeholder.webp"` i manifest-oppføringen
- [ ] 3 inline bildebokser med beskrivende `alt`-tekst (5-10 ord, norsk) i content-arrayen

Bilder genereres etterpå i Antigravity med workflowen `generate_article_images.md`.

### 2. Verification Checklist
**Audit:** Run an audit using the `article-implementation` skill.
- [ ] JSON is syntax-valid.
- [ ] No bold text in body text.
- [ ] Table of Contents works.
- [ ] Internal links (cross-linking) are correct and functional.
- [ ] Concepts are clickable and show in sidebar.
- [ ] Timeline events appear correctly.
- [ ] Images load without errors.
- [ ] Artikkelen har `Oppgaver` (Forstå/Reflekter/Gå videre) nest sist, og `Quiz` som aller siste blokk.
- **Data Synchronization:**
    - [ ] Run `node scripts/scan-concepts.js` to update the global glossary and people records.

---

## Usage
Simply state: **"Plan en ny artikkel om [tema] ved å bruke /plan_article"**. 
I will then present the plan for Phase 1. When you say **"GO"**, I proceed to Phase 2 and 3.