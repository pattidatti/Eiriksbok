# CLAUDE.md — Gravity Eiriksbok

This file provides guidance for AI assistants working on this codebase.

---

## Project Overview

**Gravity Eiriksbok** is a Norwegian digital textbook (lærebok) for middle/high school students, deployed at https://bok.haaland.de/. It covers *Historie* (History), *Norsk* (Norwegian Language), *KRLE* (Religion & Ethics), *Samfunnskunnskap* (Social Studies), and *Musikk* (Music) through immersive, interactive lessons.

The core philosophy: content is *architected* before it is *built*. A Blueprint defines a topic's soul, narrative arc, and visual identity before any JSON or code is written.

---

## Språklige krav til innhold

Alt innhold i Eiriksbok skal være forståelig for en gjennomsnittlig 14-åring.

- Bruk enkle, direkte setninger. Velg det korteste ordet som gir riktig mening.
- Unngå faglige og akademiske uttrykk når et hverdagslig ord dekker det samme.
- Hvis et fremmedord eller fagbegrep må brukes, forklar det når det introduseres.
- Skriv aktivt ("Harald samlet Norge") fremfor passivt ("Norge ble samlet av Harald").
- Bruk alltid korrekte norske tegn: **å, ø, æ** - aldri aa, oe, ae som erstatning.
- Test deg selv: Ville en 14-åring forstått dette uten hjelp? Hvis ikke - skriv om.

### Skriv for 14-åringen, ikke for kollegaen din

Den vanligste svakheten i tekstene våre er ikke faktafeil, men voksen essayist-stemme: korte,
tettpakkede setninger som høres skarpe ut for en voksen, men som ikke gir eleven noe bilde.
Fire feiltyper går igjen:

1. **Fortettet metafor uten dekning.** «Men døden eier tradisjonen.» «En plikt bytter eier.»
   «Sikhismen bruker samme grep rundt noe annet.» Eleven må gjette hva som faktisk skjer.
   Skriv hva som skjer i klartekst først. Bildet kan komme etterpå, men bare hvis det gjør
   noe klarere.
2. **Fremmedord der hverdagsordet holder.** motsats, resitere, nøktern, obligatorisk,
   ensartet, forpliktet, tilskrives, opphav, praksis, forestilling. Velg det korteste ordet
   som gir riktig mening.
3. **Fagbegrep uten forklaring i samme setning.** Skriver du samskara, minjan, qibla,
   kremasjon, sakrament eller besegling, må forklaringen stå der og da - ikke i en ordliste
   eleven ikke åpner.
4. **Abstrakt substantiv der en handling hører hjemme.** «Det religiøse innslaget er kort»
   → «selve seremonien er kort». «Riten ble regnet som nødvendig for de tre øverste
   varna-gruppene» → «bare gutter fra de tre øverste lagene i samfunnet fikk lov».

Testen: les setningen høyt og spør *hva ser en 14-åring for seg her?* Får du ikke et bilde,
skriv om. En setning som er upresis men forstått, slår en setning som er elegant men ubrukelig.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 |
| Build tool | Vite 5 |
| Language | TypeScript 5.9 |
| Styling | Tailwind CSS v4 (utility-first, no dark mode by default) |
| Animations | Framer Motion 12 |
| State | Zustand 5 |
| Routing | React Router v6 (browser router, lazy-loaded pages) |
| Data fetching | TanStack React Query 5 |
| Backend/Realtime | Firebase 12 (Firestore, Realtime DB — for Quiz Battle & feedback) |
| CMS | Ingen. Innhold redigeres direkte som JSON under `public/content/` og `public/data/` |
| 3D (artikler) | React Three Fiber + Drei |
| 3D (mini-spill) | Raw Three.js (imperativ, ingen R3F) |
| Fysikk (mini-spill) | Rapier3D (`@dimforge/rapier3d-compat`, WASM, lazy-lastet) |
| Charts | Chart.js + react-chartjs-2 |
| Maps | d3-geo + topojson-client |
| Drag-and-drop | @dnd-kit |
| Audio | Tone.js |
| Search | Fuse.js |
| PWA | vite-plugin-pwa (autoUpdate, selfDestroying SW) |

---

## Repository Structure

```
/
├── public/
│   ├── content/               # All article JSON files (the "database")
│   │   ├── manifest.json      # App skeleton: Subjects → Topics → Lessons
│   │   ├── global-timeline.json  # Single source of truth for all timeline events
│   │   ├── historie/          # History subject folder
│   │   ├── norsk/             # Norwegian subject folder
│   │   ├── krle/              # KRLE subject folder
│   │   ├── samfunnskunnskap/  # Social Studies subject folder
│   │   ├── musikk/            # Music subject folder
│   │   ├── interactive/       # Detective cases and other interactive content data
│   │   ├── scenarios/         # Time-travel scenario JSON files
│   │   ├── kompetansemal/     # Curriculum competence-goal mappings
│   │   ├── people/            # Person gallery data
│   │   ├── concepts/          # Flashcard concept JSON (redigeres direkte)
│   │   └── config/            # Misc content configuration
│   ├── data/
│   │   ├── concepts.json      # Auto-generated flashcard concept database
│   │   ├── glossary.json      # Auto-generated glossary
│   │   ├── religion/          # Per-religion JSON data (7-dimension model)
│   │   └── philosophy/        # Per-philosopher JSON data
│   └── images/                # Static images organized by topic
├── src/
│   ├── App.tsx                # Root component: router setup, context providers
│   ├── routes.ts              # Centralized lazy-load route factories
│   ├── pages/                 # Top-level page components
│   ├── components/
│   │   ├── ComponentRegistry.tsx  # Maps component names to React components (used by JSON content)
│   │   ├── content/interactive/   # 60+ interactive learning components
│   │   ├── games/             # Mini-game components
│   │   ├── ui/                # Generic UI primitives
│   │   └── ...                # Layout, navigation, modals
│   ├── features/
│   │   ├── music/             # Music subject feature module
│   │   ├── infrastruktur/     # Infrastruktur-Atlas (samfunnskunnskap)
│   │   └── rpg/               # Minnevokteren - 2D-rollespill (Phaser, prosedyral grafikk). Se features/rpg/README.md
│   ├── games/
│   │   ├── engine/            # Mini-spillmotor (Three.js + Rapier3D). Underkataloger: systems/, builders/, declarative/, dsl/, prefabs/, shaders/, settings/, utils/. API + fallgruver: BUILD_GAME_GUIDE.md
│   │   ├── demo-world/        # Lysalvendalen — referanse-showcase for alle motor-features
│   │   ├── watt-lab/          # James Watt-spill (ett-rom)
│   │   ├── lindisfarne-793/   # Vikingraid (fler-fase utendørs)
│   │   ├── caesar-ides/       # Idene mars — Roma-scenario
│   │   ├── skjoldborg/        # Slaget ved Stamford Bridge — skjoldborg-scenario
│   │   ├── ford-factory/      # Ford-fabrikken — samlebånd og industrialisering
│   │   ├── oljeplattform/     # Norsk oljeeventyr — plattform-scenario
│   │   ├── blueprint-quest/   # Designsystem-demo for engine
│   │   ├── chrono-glider/     # R3F-basert (eldre arkitektur)
│   │   ├── concept-snake/     # Konseptslange (eldre)
│   │   ├── word-sorter/       # Ordsortering (eldre)
│   │   └── GameRegistry.ts    # Eldre spill-registry (ikke brukt av engine-systemet)
│   ├── hooks/                 # Custom React hooks
│   ├── context/               # React context providers (GlossaryContext, LayoutContext)
│   ├── stores/                # Zustand stores
│   ├── data/                  # TypeScript data files (glossary.ts, textLibraryData.ts, etc.)
│   ├── types/                 # Shared TypeScript types
│   └── utils/                 # Utility functions
├── scripts/                   # Node.js build/maintenance scripts
├── docs/                      # Documentation and design blueprints
│   ├── Design documents/      # Topic blueprints ([topic]-blueprint.md)
│   └── THE_ARCHITECTS_HANDBOOK.md
├── .agent/workflows/          # AI agent workflow definitions
│   ├── LEARNING_PATH_GUIDE.md # Guide for creating learning paths
│   ├── BUILD_GAME_GUIDE.md    # Guide for 3D-mini-spillmotoren
│   ├── plan_topic.md / build_topic.md
│   ├── plan_article.md / plan_krle_article.md
│   ├── plan_scenario.md / build_scenario.md
│   ├── plan_learning_path.md / build_learning_path.md
│   ├── plan_minigame.md / build_interactive.md
│   └── ...                    # Flere arkitekt-/byggemodul-workflows
└── Ideer/                     # Planning/ideas documents (Norwegian)
```

---

## Development Commands

```bash
npm install            # Install dependencies
npm run dev            # Start dev server at localhost:5173 (auto-runs scan:content first)
npm run build          # Production build (gen-version + scan:content + optimize-images + tsc -b + vite build + copy-404.js)
npm run lint           # ESLint check
npm run preview        # Preview production build
npm run scan:content   # Regenerate content-index.json + sync manifest dates
npm run scan:concepts  # Scan articles for potential new flashcard concepts
npm run optimize-images # Optimaliser WebP under public/ (kjøres automatisk i build; --tving for å presse på nytt)
npm run gen-version    # Write public/version.json (epoch timestamp; brukt av PWA-update-prompt)
```

> After `git pull`, always run `npm install` if `package.json` changed.

---

## URL Structure / Routing

The app uses a manifest-driven routing system:

```
/                               Landing page
/sok                            Search
/:subjectId                     Subject page (e.g. /historie)
/:subjectId/:topicId            Topic page (e.g. /historie/vikingtiden)
/:subjectId/:topicId/:lessonId  Lesson page (e.g. /historie/vikingtiden/rikssamlingen)
/:subjectId/:topicId/:subTopicId/:lessonId  Nested lesson

/norsk/bibliotek                Text library
/norsk/bibliotek/:textId        Text reader
/norsk/virkemidler/desk         Virkemiddel-verksted (skrivebord-layout)
/norsk/ordklasser/sortering     Ordklassesortering (drag-and-drop)
/tidslinje                      Global timeline
/atlas                          Verdensatlas (fullskjerms kart-tidslinje)
/laeringsstier                  Learning paths hub
/min-laering                    «Min læring» - elevdashboard (XP, streak, badges, fag-mestring, synk-kode)
/persongalleri                  Person gallery
/persongalleri/:slug            Person gallery - enkeltperson
/colonization                   Kolonisering-kart (verdenshistorie)
/infrastruktur-atlas            Infrastruktur-Atlas (samfunnskunnskap)
/himmel                         Stjernehimmelen
/samfunnskunnskap/okonomi/verden  Økonomi i verden (kartvisning)

/mikrospill                     Mikrospill-galleri (lette inline-spill)
/mikrospill/:gameId             Enkelt mikrospill (brukes også av MicroGame-komponenten)

/musikk/komposisjon             Komposisjonsverktøy (notesett)
/musikk/oving/rytme             Rytmetrening (Rhythm Tapper)
/musikk/oving/gehortrening      Gehørtrening
/musikk/gitarstudio             Gitarstudio

/oving                          Practice hub
/oving/dagens-okt               Dagens økt (daglig repetisjon)
/oving/loype                    Kunnskapsløypa
/oving/flashcards               Flashcards (alias /flashcards)
/oving/quiz                     Quiz (alias /quiz)
/oving/chrono                   Chrono card game
/oving/chrono-glider            Chrono Glider (R3F)
/oving/konsept-snake            Konseptslange (norsk-spill)
/oving/retorikk                 Retorikk-spill
/oving/hengemann                Hengemann (ordgjetting)
/oving/kjedereaksjonen          Kjedereaksjonen (2D-sidescroller om årsak og virkning)
/oving/virkemidler              Virkemiddel-verkstedet
/oving/detektiv                 Detektiv-hub
/oving/detektiv/:caseId         Detective case
/oving/etikk                    Ethics experiment
/oving/tidsreise                Tidsreise-hub
/oving/tidsreise/:scenarioId    Time travel scenario
/oving/spill                    Mini-spill galleri (historiske 3D-spill)
/oving/spill/:gameId            Enkelt mini-spill (f.eks. /oving/spill/watt-lab)
/oving/rpg                      Minnevokteren — 2D-rollespill i sanntid (Phaser)
/oving/kompetansemal            Kompetansemål-oversikt

/quiz-battle                    Multiplayer quiz lobby
/quiz-battle/host/:pin          Host-skjerm (admin-guarded)
/quiz-battle/play/:pin          Spiller-klient
/quiz-battle/admin-999          Quiz-admin (admin-guarded)

/krle/sammenlign                Religion comparison
/krle/sammenlign/tema/:tag      Topic comparison på tvers av religioner
/krle/religion/:religionId      Religion-detaljside (7-dimensjons-modell)
/krle/religionsrommet           Religionsrommet - hub med linser, temaer og innholdskart
/krle/filosofi/odyssey          Philosophy odyssey
/krle/filosofi/sammenlign       Philosophy comparison

/historie/vikingtiden/detektiv  Vikingtid-detektivsak (snarvei)

/admin                          Admin dashboard (guarded)
/admin/stats                    Bruksstatistikk
/admin/inventory                Innholdsinventar
/admin/links                    Lenkesjekk
/admin/scanner                  Innholdsskanner

/:subjectId/:topicId/present/:lessonId             Presentasjonsmodus for leksjon
/:subjectId/:topicId/present/:lessonId/projector   Presentasjon — projektor-view
```

---

## Content Architecture (JSON-Driven)

### manifest.json

The skeleton of the entire app. **Always update this when adding new content.**

```json
{
  "subjects": [
    {
      "id": "historie",
      "title": "Historie",
      "topics": [
        {
          "id": "vikingtiden",
          "title": "Vikingtiden",
          "tools": [
            {
              "id": "vikingtiden-sti",
              "title": "Læringssti: Vikingtiden",
              "description": "...",
              "link": "/historie/vikingtiden/vikingtiden-sti",
              "icon": "map"
            }
          ],
          "lessons": [
            {
              "id": "rikssamlingen",
              "title": "Rikssamlingen",
              "description": "...",
              "image": "/images/...",
              "tags": ["norge", "kongemakt"],
              "createdDate": "2024-01-01T00:00:00Z"
            }
          ]
        }
      ]
    }
  ]
}
```

- Learning paths go under `tools`, **not** `lessons`
- Tags must be consistent across articles and the global timeline

### Article JSON Files

Location: `public/content/[subjectId]/[topicId]/[lessonId].json`

```json
{
  "id": "rikssamlingen",
  "title": "Rikssamlingen",
  "layout": "rich",
  "year": "872",
  "category": "Norge",
  "readTime": "8 min lesning",
  "heroImage": "/images/vikingtiden/rikssamlingen-hero.webp",
  "details": ["Nøkkelpunkt 1", "Nøkkelpunkt 2"],
  "externalUrl": "https://snl.no/rikssamlingen",
  "content": [
    { "type": "text", "content": "Første avsnitt..." },
    { "type": "header", "text": "Seksjonstittel" },
    { "type": "text", "content": "Tekst under seksjon..." },
    { "type": "list", "items": ["Punkt 1", "Punkt 2"] },
    { "type": "component", "name": "ScenarioRoleplay", "props": { ... } }
  ],
  "timeline": []
}
```

**Critical rules for article content:**
- `content` array must be **flat** — no nested `section` blocks. Use `header` blocks for sections.
- **Never use bold text** (`**word**`) inside `text` blocks. The concepts system handles term highlighting.
- **Never use markdown lists** (`- item`) inside `text` blocks. Use `{ "type": "list", "items": [...] }`.
- `"layout": "rich"` activates the immersive sidebar with timeline, maps, and TOC.
- Sidebaren viser «Sist oppdatert» i klartekst. Datoen hentes automatisk fra `lastUpdated`
  i `manifest.json` (satt av `scripts/sync-manifest-dates.js` ut fra git-historikken).
  Tidssensitive artikler bør i tillegg ha `"factChecked": "2026-07-24"` på toppnivå — da
  vises også en «Faktasjekket»-linje. Git-datoen sier når fila sist ble rørt;
  `factChecked` sier når et menneske sist kontrollerte at innholdet stemmer.
- `timeline` array should always be `[]` — all events go in `global-timeline.json`.
- `TimelineComponent` inside articles must always have `compact: true` in props.

### Article Layouts

| Layout | Trigger | Sidebar |
|---|---|---|
| Standard | Default | `LessonSidebar` (concepts, quotes, links) |
| Rich | `"layout": "rich"` | Interactive: timeline, maps, TOC |
| Norsk Rich | `"layout": "rich"` + `subject: "norsk"` | Genre info + related links |
| Text Reader | Route `/norsk/bibliotek/:textId` | None (focus mode) |
| Learning Path | `"layout": "learning-path"` | Path steps navigator |

### Global Timeline

File: `public/content/global-timeline.json`

```json
{
  "id": "event-id",
  "title": "Tittel",
  "description": "Beskrivelse",
  "startDate": 872,
  "endDate": 872,
  "displayDate": "872",
  "type": "event",
  "subjectId": "historie",
  "topicId": "vikingtiden",
  "link": "/historie/vikingtiden/rikssamlingen",
  "tags": ["norge", "kongemakt"]
}
```

Edit this file directly. Never store events in individual article JSON files.

---

## Verdensatlas (`/atlas`)

Et fullskjerms verdenskart der eleven scrubber/spiller av en tidslinje og ser **hvor**
historien skjer. Bygger på de samme `global-timeline.json`-eventene som `/tidslinje`, men
plasserer dem geografisk. Hovedmål: elev-utforskning (Chromebook 1366×768 baseline).

**Slik fungerer det:**

1. **Sted-ordbok** — `scripts/data/place-coordinates.json` mapper geografiske tags
   (`norge`, `roma`, `romerriket`, `athen` …) til `{ lat, lng, label, kind, countryId }`.
   `kind` ∈ `by | land | imperium | region`. `countryId` = ISO 3166-1 numerisk (= world-atlas
   `geo.id`) og brukes for land-klikk. Fila genereres av `scripts/generate-place-coordinates.js`
   (kjøres i `scan:content`) fra en innebygd, kuratert gazetteer. Tags den ikke kjenner havner
   i `_unmapped` for manuell vask. Sett `"source": "manual"` på en place for å beskytte den mot
   regenerering. **Aliases** (f.eks. `midtosten`→`midtøsten`, `USA`→`usa`) normaliserer tag-rot.

2. **Geo-beriking av events** — `scripts/generate-timeline.js` stempler hvert event med
   `lat/lng`, `placeLabel`, `placeCountryId` og `geoConfidence`. Mest presise tag vinner
   (`by` > `land`/`imperium` > `region`). Events uten geo-tag faller tilbake til fag
   (`subjectFallback`, f.eks. `norsk`→Norge) og merkes `geoConfidence: 'guess'`. Events uten
   noe treff får ingen koordinat og vises ikke på kartet.

3. **Kartet** (`src/components/atlas/AtlasWorldMap.tsx`) — `d3-geo` (`geoNaturalEarth1`) med
   verdensgeometri lastet **lokalt** fra `public/data/world/countries-110m.json` (aldri CDN —
   unngår blank skjerm på ustabilt klasseromsnett). Land fargelegges som et **aktivitets-
   heatmap** (hvor mye innhold er aktivt i tidsvinduet). Hendelser vises som klyngede pins med
   **akkumuler + fade**: alt som har skjedd blir liggende, eldre dempes mens nåtid lyser. Fade
   måles i piksler langs `timelineLayout.ts` (`yearToX`), ikke i år.

4. **Land-klikk** → `AtlasEventPanel.tsx` lister alle events med matchende `placeCountryId`,
   deduplisert på lenke, med lenke til artikkelen. Pin-klikk gjør det samme for klyngens events.

**Filer:** `src/pages/AtlasPage.tsx` (orkestrering + avspillingsløkke), `src/components/atlas/`
(`AtlasWorldMap`, `AtlasTimeline`, `AtlasEventPanel`, `atlasFade.ts`, `useAtlasWorld.ts`).
Ruten er full-bredde via `FULL_WIDTH_PATHS` i `src/context/LayoutContext.tsx`.

**Utvide dekningen:** legg nye steder i gazetteeren i `generate-place-coordinates.js` (ikke
direkte i JSON-en med mindre `source: "manual"`), kjør `npm run scan:content`, og sjekk at
`_unmapped` krymper. MVP kuraterer Historie-tags grundig; andre fag berikes automatisk og
finpusses ved behov.

---

## Component System (ComponentRegistry)

Interactive components in articles are referenced by string name in JSON and resolved at runtime via `src/components/ComponentRegistry.tsx`.

**To add a new interactive component:**
1. Create the component in `src/components/content/interactive/`
2. Add a lazy import and entry to `componentRegistry` in `ComponentRegistry.tsx`
3. Reference in JSON: `{ "type": "component", "name": "MyComponent", "props": { ... } }`

### Available Interactive Components (selection)

| Name | Purpose |
|---|---|
| `ScenarioRoleplay` | Branching choice scenarios |
| `PackTheBag` | Resource management puzzles |
| `DebateSimulator` | Argumentation practice |
| `DragDropTimeline` | Event ordering |
| `BiasLens` | Perspective/source criticism |
| `MapCarousel` | Historical map lightbox |
| `Quiz` | Inline quizzes |
| `Oppgaver` | Felles oppgavesett nederst i artikkelen (Bloom-trapp: Forstå/Reflekter/Gå videre) med "kopier oppgaver"-knapp — plasseres rett før Quiz |
| `TimelineComponent` | Compact inline timeline |
| `FactBox` | Info callout box |
| `QuoteBlock` | Styled quote |
| `Kildeliste` | Kollapsbar APA-kildeliste (`props.sources`: array av ferdigformaterte APA-strenger, støtter `*kursiv*` og `[tekst](url)`) — plasseres som siste content-block, etter Quiz |
| `Gallery` | Image gallery |
| `GlossaryTooltip` | Concept tooltip |
| `HanseaticTradeMap` | Hansa-handelsrutekart med byer/varer |
| `CableBreakSim` | Simulering av kabelbrudd (infrastruktur-atlas) |
| `PropagandaDecoder` | Avkode propagandaplakater (etterkrigstid) |
| `NuclearSimulator` | Kjernevåpen-yield-simulator |
| `MicroGame` | Embed et lett mikrospill inline (`props.gameId`, se `.agent/workflows/build_microgame.md`) |

Full list in `src/components/ComponentRegistry.tsx`.

### Mikrospill i artikler

Lette, embeddbare spill bor i `src/components/microgames/` (egen `MicroGameFrame`, registrert i
`registry.ts`). Slipp et spill inn i en artikkel med
`{ "type": "component", "name": "MicroGame", "props": { "gameId": "<id>" } }`, eller i et
læringssti-steg via `microGameId`. Bygg nye med `.agent/workflows/build_microgame.md`. Dette er et
eget, lett spor adskilt fra den tunge 3D-motoren i `src/games/engine/` — embed aldri fullmotoren i
en artikkel.

---

## Learning Paths

Learning paths are JSON files stored alongside articles: `public/content/[subject]/[topic]/[topic]-sti.json`.

They use a **3-act narrative structure**:
- **Akt 1: Opptakten** (Setup)
- **Akt 2: Konfrontasjonen** (Conflict / deep content)
- **Akt 3: Resolusjonen** (Resolution / reflection)

Every path must begin with **Steg 0 (Prolog)** — a zero-prerequisite introduction.

Tasks within each step follow **Bloom's Taxonomy**:
1. Recall (Fakta — find it in the text)
2. Understanding (Forståelse — explain mechanisms)
3. Analysis/Ethics (Refleksjon — evaluate dilemmas)

If a step requires reading an article, the first task **must** be:
```
"Les artikkelen [Tittel](/absolute/path/to/article)"
```

See `.agent/workflows/LEARNING_PATH_GUIDE.md` for the full JSON schema.

---

## Content Authoring Workflow

### Adding a New Lesson

1. **Create content file**: `public/content/[subject]/[topic]/[lesson-id].json`
2. **Update manifest**: Add entry under the correct topic in `manifest.json`
3. **Scan concepts**: `npm run scan:concepts` — review suggestions, and add new terms as JSON in `public/content/concepts/`
4. **Add timeline events**: Append any new events to `global-timeline.json`
5. **Verify**: Start dev server, check article loads, concepts appear, timeline events show

### Adding a New Topic (Architect Workflow)

1. **Create Blueprint**: `docs/Design documents/[topic]-blueprint.md` — define narrative arc, beats, image prompts
2. **Plan**: Use `/plan_topic` workflow (see `.agent/workflows/plan_topic.md`)
3. **Build**: Use `/build_topic` workflow after Blueprint is approved
4. **Register**: Add topic to `manifest.json`

### Adding a New Concept (Flashcard Term)

- Add a JSON file directly: `public/content/concepts/[term].json`

---

## Mini-spill-system

Historiske 3D-mini-spill bor under `/oving/spill` og bruker et gjenbrukbart rammeverk i `src/games/engine/` (raw Three.js + Rapier3D, lazy-lastet). Hvert spill er et `GameConfig`-objekt med `setupScene`-callback. Motoren håndterer scene, input, fysikk, dialog, quester, inventar, monolog, vær, sky/time-of-day, kamera, audio, og save/load.

**Legge til et nytt spill:**
1. Opprett `src/games/[id]/[Id]Config.ts` + `[Id]Assets.ts`
2. Registrer i `HISTORICAL_GAMES` (`src/pages/MiniGamesPage.tsx`) og `GAME_REGISTRY` (`src/pages/GamePage.tsx`)

**For alt annet — skjema, API-er, fallgruver, best practices, eksempler — se `.agent/workflows/BUILD_GAME_GUIDE.md`.** Det er den autoritative guiden. Arbeid med mini-spill skal alltid begynne med å lese den.

---

## Code Conventions

### TypeScript

- Strict mode enabled (`tsconfig.app.json`)
- All components use **named exports**
- Props typed with inline interfaces (no `React.FC<>` wrapper)

### Prettier (auto-enforced)

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 4,
  "trailingComma": "es5",
  "printWidth": 100
}
```

### Styling

- Tailwind CSS v4 utility classes only
- Design system: **Modern Glassmorphism** — light `bg-slate-50` base, glass card effects
- Custom theme tokens: `bg-main`, `bg-card`, `text-main`, `text-muted`, `neon-accent` (CSS variables)
- Game-specific colors in `game.*` namespace (e.g. `game-gold`, `game-stone`)
- Fonts: `Inter` (sans), `Outfit` (display)
- `darkMode: 'class'` — dark mode is class-toggled, not system-automatic
- **Chromebook-first**: De fleste brukere har Chromebook med lav skjermoppløsning (typisk 1366x768). Design for denne skjermstørrelsen som baseline - ikke full-HD. Unngå layout som kun ser bra ut på store skjermer.

### React Patterns

- All pages are **lazy-loaded** via `React.lazy()` + `Suspense`
- Route factories centralized in `src/routes.ts`
- Wrap admin pages with `<AdminGuard>`
- Use `<ErrorBoundary>` for fault isolation
- `usePresence()` runs at app root for Firebase presence tracking

---

## Image Guidelines

- Format: **WebP** (use `scripts/optimize-images.js` for conversion)
- Aspect ratio: **16:9** for all hero and inline images
- Resolution: max 2560px wide for maps, 1600px for standard images
- File size targets: maps < 500KB (target ~300KB), standard < 100KB, quality 75–80%
- Use `<Image priority={true} />` for above-the-fold images (sets `fetchpriority="high"`)
- Use `<MapCarousel>` for historical maps (built-in lightbox, no cropping)
- Store images under `public/images/[topic]/`

**AI image generation prompt template:**
```
A highly realistic 4K cinematic photograph of [scene], [time period].
[Lighting description]. [Composition/camera angle]. 16:9 ratio.
```

---

## Firebase / Backend

- Config in `src/lib/firebase.ts`
- Used for: Quiz Battle (Realtime DB), user feedback (`FeedbackWidget`), presence tracking,
  and the shared hall in Minnevokteren (`rpg-hub`)
- Database rules live in `database.rules.json` — the one file `firebase.json` deploys.
  Deploy them with `firebase deploy --only database` after editing.
- Feedback data is **not** publicly readable. To export:
  ```bash
  node scripts/fetch_feedback.cjs YOUR_DATABASE_SECRET
  ```

---

## Build & Performance

- Bundle splitting configured in `vite.config.ts`:
  - `vendor` chunk: react, react-dom, react-router-dom, framer-motion
  - `ui` chunk: lucide-react, @heroicons/react
  - `three` chunk: three.js + fiber/drei
- PWA: auto-update service worker, `selfDestroying: true` to prevent caching issues
- Bundle analysis: `npm run build` generates `stats.html` (rollup-plugin-visualizer)
- Content index regenerated automatically on `npm run dev` and `npm run build`

---

## Scripts Reference

| Script | Purpose |
|---|---|
| `scripts/generateContentIndex.js` | Builds `content-index.json` for fast search |
| `scripts/sync-manifest-dates.js` | Syncs `createdDate` in manifest |
| `scripts/generate-timeline.js` | Rebuilds `global-timeline.json` + geo-beriker events (lat/lng/placeCountryId) |
| `scripts/generate-place-coordinates.js` | Genererer `scripts/data/place-coordinates.json` (tag → koordinat-ordbok for `/atlas`) |
| `scripts/generate-quest-bank.mjs` | Bygger `public/data/rpg/quest-bank.json` fra Quiz-komponentene i artiklene (spørsmålsbanken til rollespillet) |
| `scripts/validate-kjeder.mjs` | Validerer årsakskjedene i `public/content/kjeder/` og genererer `kjede-oversikt.json` (Kjedereaksjonen) |
| `scripts/scan-concepts.js` | Scans articles for potential new concept terms |
| `scripts/optimize-images.js` | Optimaliserer WebP-bilder under `public/`. Kvitterer for hver fil i `scripts/image-ledger.json`, så et bilde komprimeres én gang - ikke én gang per build |
| `scripts/copy-404.js` | Copies `index.html` to `404.html` for SPA routing on static hosts |
| `scripts/fetch_feedback.cjs` | Exports Firebase feedback data |
| `scripts/update-learning-paths.cjs` | Updates learning path hub registry |
| `scripts/content-manager.cjs` | Content management utilities |

---

## Key Files

| File | Role |
|---|---|
| `public/content/manifest.json` | App skeleton — subjects, topics, lessons, tools |
| `public/content/global-timeline.json` | All historical timeline events (geo-beriket for `/atlas`) |
| `scripts/data/place-coordinates.json` | Tag → koordinat/land-ordbok for Verdensatlaset (bygge-input, sendes ikke til elevene) |
| `src/pages/AtlasPage.tsx` | Verdensatlas — fullskjerms kart-tidslinje (`/atlas`) |
| `public/data/concepts.json` | Auto-generated concept/flashcard database |
| `src/components/ComponentRegistry.tsx` | Maps component names to React components |
| `src/App.tsx` | Router setup, context providers |
| `src/routes.ts` | Lazy-load route factories |
| `src/lib/firebase.ts` | Firebase configuration |
| `src/games/engine/` | Mini-spillmotor (typer, GameEngine, systems/, builders/). Se `BUILD_GAME_GUIDE.md` for API-er. |
| `src/features/progress/` | Progresjonssystemet bak «Min læring» (`/min-laering`): `useProgressStore.recordActivity()` kalles fra alle fullføringspunkter og eier XP/nivå, streak, badges, dagens mål, fag-mestring og Firebase-synk via tre-ords-kode. Nye moduler som gir eleven fullføringer skal kalle `recordActivity()`. |
| `src/pages/MiniGamesPage.tsx` | Galleriside — legg til nye spill i HISTORICAL_GAMES her |
| `src/pages/GamePage.tsx` | Enkeltspill-side — legg til spill-ID i GAME_REGISTRY her |
| `docs/THE_ARCHITECTS_HANDBOOK.md` | Workflow philosophy |
| `docs/CONTENT_SYSTEM.md` | Comprehensive content system reference |
| `.agent/workflows/LEARNING_PATH_GUIDE.md` | Learning path JSON schema and guide |
| `.agent/workflows/BUILD_GAME_GUIDE.md` | Guide for å lage nye 3D-mini-spill |
| `docs/image-style-guide.md` | Image generation and optimization standards |

---

## Common Pitfalls

1. **Duplicate manifest IDs ("ghost data")**: Before adding a topic/lesson, search `manifest.json` for the `id` to ensure it does not already exist. Duplicates cause stale data.
2. **Norwegian character encoding**: Always save files as UTF-8. Broken characters (`Ã¦`, `Ã¸`, `Ã¥`) must be fixed immediately.
3. **Nested section blocks**: The content renderer does not support nested `section` blocks — use `header` blocks for section separation.
4. **Bold in article text**: Never use `**bold**` in article body text. Use the concepts system.
5. **Markdown lists in text blocks**: Use `{ "type": "list" }` blocks instead.
6. **Timeline-data i artikler**: Sett `year` (eller `date`) på toppnivå i artikkel-JSON-en for at artikkelen skal vises som event i `/tidslinje`. Sub-events for samme artikkel legges i artikkelens `timeline[]`-array (de blir automatisk plukket opp). `public/content/global-timeline.json` regenereres av `scripts/generate-timeline.js` (kjøres som del av `npm run scan:content`) — **ikke rediger fila direkte**. Hand-kuraterte events uten tilhørende leksjon legges i `public/content/global-timeline.manual.json`.
7. **Learning paths in `lessons`**: Learning paths (`-sti.json`) must be registered under `tools`, not `lessons` in the manifest.
8. **Relative links in tasks**: Always use absolute paths starting with `/` in learning path task links.
9. **Mini-spill (3D-motor)**: Egne fallgruver for `userData.solid`-kollisjon, sol/hemi-registrering, dollhouse-tak, prosedyrale plasseringer, hav-overlapp og fysikk-damping er dokumentert i `BUILD_GAME_GUIDE.md` §6.1 og §8. Les de seksjonene før du tester et nytt `preset: 'open'`-spill.

---

## Documentation Index

- `docs/THE_ARCHITECTS_HANDBOOK.md` — Philosophy and workflow manifesto
- `docs/CONTENT_SYSTEM.md` — Full content system reference (layouts, feature systems, troubleshooting)
- `docs/CONTENT_STYLE_GUIDE.md` — Writing style rules
- `docs/TECHNICAL_ARCHITECTURE.md` — Architecture overview
- `docs/DEVELOPER_SETUP.md` — Machine setup guide
- `docs/HVORDAN_DETTE_FUNGERER.md` — Plain-norwegian forklaring av hele systemet
- `docs/TERMINOLOGI_OG_STRUKTUR.md` — Terminologi og struktur-referanse
- `docs/NAVIGATION_PROPOSALS.md` — Forslag/historikk for navigasjon
- `docs/image-style-guide.md` — Image generation and WebP optimization
- `docs/DETEKTIV_GUIDE.md` — Detective case system
- `docs/SCENARIO_DESIGN_GUIDE.md` — Tidsreise-scenario design
- `docs/KRLE_PEDAGOGICAL_GUIDE.md` — KRLE content guidelines
- `docs/KRLE_OPPRUSTNING.md` — Statusoversikt og arbeidsliste for å løfte KRLE-artiklene til plan_article-standard
- `docs/motor-update.md` — Mini-spillmotor changelog/oppgraderingsnotat
- `docs/Design documents/` — Per-topic blueprints
- `docs/laereplaner/` — Læreplaner og kompetansemål per fag
- `.agent/workflows/LEARNING_PATH_GUIDE.md` — Learning path JSON schema and guide
- `.agent/workflows/BUILD_GAME_GUIDE.md` — Guide for å lage nye historiske 3D-mini-spill
- `.agent/workflows/plan_minigame.md` — Designfase for nytt mini-spill
- `.agent/workflows/build_interactive.md` — Bygge ny interaktiv komponent
- `Ideer/` — Ideas and planning documents (Norwegian)
