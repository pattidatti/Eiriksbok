# Eiriksbok Content System Documentation

This document outlines the architecture and workflows for managing content in Eiriksbok. It serves as the "single source of truth" for how different content systems (Timeline, Flashcards, Library, etc.) interact.

## 1. System Overview

Eiriksbok uses a hybrid content system:
*   **Manifest (`manifest.json`)**: Defines the hierarchy (Subjects -> Topics -> Lessons) and basic metadata.
*   **Content Files (`*.json`)**: Store the actual article content, rich text, and specific feature data (timeline events).
*   **Static Data (`src/data/*.ts`)**: Stores structured data for specific features like the Text Library and Glossary (Flashcards).
*   **Automation Scripts (`scripts/*.js`)**: Process raw content into derived datasets (e.g., `global-timeline.json`).

## 2. File Structure

```
/public
  /content
    manifest.json           # The "Skeleton" of the app
    /historie               # Subject folder
      /vikingtiden          # Topic folder
        artikkel.json       # Lesson content
        rikssamlingen.json  # Another lesson
    /global-timeline.json   # GENERATED file (do not edit manually)
/src
  /data
    glossary.ts             # Flashcards / Fagbegreper
    textLibraryData.ts      # Norsk Bibliotek metadata
/scripts
    generate-timeline.js    # Script to build the timeline
```

## 3. Core Workflow: Adding a New Lesson

To add a new lesson (article):

1.  **Update Manifest**: Add a new entry to `public/content/manifest.json` under the correct Topic.
    ```json
    {
      "id": "my-new-lesson",
      "title": "My Lesson",
      "description": "Short description.",
      "image": "url-to-image",
      "tags": ["tag1", "tag2"],
      "createdDate": "2023-10-27T12:00:00Z"
    }
    ```
2.  **Create Content File**: Create `public/content/[subject]/[topic]/my-new-lesson.json`.
    ```json
    {
      "id": "my-new-lesson",
      "title": "My Lesson",
      "content": [ 
        { "type": "text", "content": "Intro text..." },
        { "type": "header", "text": "Section Title" }, // Use header, NOT nested sections
        { "type": "text", "content": "More text..." }
      ] 
    }
    ```
    **Important:** The `content` array must be **flat**. Do not use nested `section` blocks. Use `header` blocks to separate sections.

## 4. Feature Systems

### 4.1. Global Timeline
The timeline aggregates events from all history articles.

*   **Single Source Architecture**:
    *   **Public Content**: All timeline events are now stored in `public/content/global-timeline.json`.
    *   **Maintenance**: This file should be treated as the single source of truth.
*   **Unified Access**: The `useGlobalTimeline` hook fetches events from this file.
*   **How to Add**:
    1.  **Direct Edit**: Add new events directly to `public/content/global-timeline.json`.
    2.  **Migration**: If refactoring old content, move `timeline` arrays from individual article JSONs to the global file.
*   **Event Structure**:
    ```json
    {
      "id": "event-id",
      "title": "Tittel",
      "description": "Beskrivelse",
      "startDate": 1940,
      "endDate": 1945,
      "displayDate": "1940-1945",
      "type": "event",
      "subjectId": "historie",
      "topicId": "andre-verdenskrig",
      "link": "/historie/andre-verdenskrig/artikkel",
      "tags": ["krig", "norge"]
    }
    ```
*   **Note**: All local `timeline` arrays in article JSON files should be empty `[]` to enforce usage of the global timeline.

### 4.2. Flashcards (Fagbegreper)
Flashcards are global concepts used for practice.

*   **Source**: `public/content/concepts/*.json` (redigeres direkte som JSON).
*   **How to Add**: 
    1.  Add a new concept by creating a JSON file in `public/content/concepts/`.
    2.  Or run the migration script if you have terms in legacy formats.
*   **Scanning Tool**:
    *   Command: `npm run scan:concepts`
    *   Purpose: Scans all articles for bold text (potential candidates) and mentions of existing concepts.
    *   Output: Lists suggestions for new concepts to add to the DB.
*   **Integration**: These terms are aggregated into `public/data/concepts.json` at build time or when running the dev server.

### 4.3. Checklist: Adding a New Lesson
When creating a new article, follow this checklist to ensure complete integration:

1.  [ ] **Create Content**: Write the JSON file in `public/content/...`.
2.  [ ] **Update Manifest**: Add entry to `manifest.json`.
3.  [ ] **Scan for Concepts**: Run `npm run scan:concepts`.
    *   Review the "Potential New Concepts" list. Are there terms here that should be in the global database? If so, add them as JSON in `public/content/concepts/`.
    *   Review the "Mentions" list. Does your article mention existing concepts? If `useConcepts` is working correctly, these should be picked up automatically, but you can also tag them manually if needed.
4.  [ ] **Check Timeline**: If history article, ensure relevant events are added to `global-timeline.json`.
5.  [ ] **Verify**: Start dev server and check that the article loads, concepts appear in sidebar/glossary, and timeline events show up.

### 4.4. Text Library (Norsk)
The library contains short stories, poems, and excerpts.

*   **Source**: `src/data/textLibraryData.ts`.
*   **How to Add**: Add a new `TextEntry` object.
    ```typescript
    {
        id: "karens-jul",
        title: "Karens Jul",
        author: "Amalie Skram",
        content: "...", // Full text
        type: "novelle",
        year: 1885,
        tags: ["fattigdom", "realisme"]
    }
    ```

### 4.5. Religion Comparison (KRLE)
Allows side-by-side comparison of religions.

*   **Source**: `public/data/religion/[religion].json` (Dimensions) AND Article JSONs.
*   **How to Add a New Religion**:
    1.  Create `public/data/religion/[id].json` (e.g. `buddhisme.json`).
    2.  Structure:
        ```json
        {
          "name": "Buddhisme",
          "color": "#f59e0b",
          "dimensions": {
            "ritual": { "type": "root", "children": [...] },
            // ... all 7 dimensions
          }
        }
        ```
    3.  Add entry to `manifest.json`.

*   **How to Link an Article**:
    In your article JSON (usually `public/content/krle/religioner/[religion]/[topic]/artikkel.json`), add:
    ```json
    {
      "religion": "kristendom", // ID only (e.g "kristendom"), NOT "content/religion/..."
      "dimension": "ritual", // Which dimension this covers
      "comparison_tags": ["dåp", "bønn"] // Specific topics for detailed comparison
    }
    ```

## 4.6. Artikkel-Layouts

Alle artikkelsider deler samme grunnoppsett for innholdsvisning, men skilles hovedsakelig av **sidebaren** og dens funksjonalitet.

### 1. Standard Leksjon (Standard Sidebar)
*   **Trigger:** Ingen spesiell konfigurasjon (standard).
*   **Sidebar:** `LessonSidebar.tsx`.
*   **Innhold:** Viser begreper, sitater og relevante lenker.
    *   **KRLE-variant:** Hvis `comparison_tags` er definert (f.eks. "bønn"), viser sidebaren lenker til "Sammenlign Religioner"-verktøyet for disse temaene.

### 2. Rich Layout (Interactive Sidebar)
En mer avansert layout for dybdeartikler i historie og samfunnsfag.
*   **Trigger:** `"layout": "rich"` i leksjonens JSON-fil.
*   **Sidebar:** Integrert tidslinje, kart, og dynamisk innholdsfortegnelse (TOC).
*   **Funksjon:** Lar brukeren hoppe i tid og sted mens de leser.

### 3. Norsk Fagartikkel (Literature Sidebar)
Tilpasning av Rich Layout for norskfaget.
*   **Trigger:** `subject: "norsk"` OG `"layout": "rich"`.
*   **Sidebar:** Fokus på sjangerinformasjon ("Om sjangeren").
*   **Annet:** Har en fremhevet knapp for "Relaterte lenker" (f.eks. til biblioteksteksten) under hovedbildet.

### 4. Tekstbibliotek (Reader Sidebar)
Layout for primærkilder.
*   **Trigger:** Rute `/norsk/bibliotek/:textId`.
*   **Sidebar:** Ingen sidebar (fokusmodus), men verktøylinje for oversettelse og tekststørrelse.

### 5. Interaktive Modeller
Spesialsider med egne kontroller og paneler. (F.eks. `demografi-okonomi/intro`).

## 4.7. Retningslinjer for Komponenter i Artikler
For å sikre god lesbarhet og flyt i teksttunge artikler, skal følgende regler følges:
*   **TimelineComponent**: Når denne brukes inne i en artikkel (`layout: rich`), skal den **alltid** ha `compact: true` i sine props. Dette forhindrer at tidslinjen tar for mye visuell plass og bryter opp lesingen for mye.
*   **Header-nivåer**: Bruk `header` blocks for å dele opp innholdet. Dette genererer automatisk innholdsfortegnelse i sidebaren.
*   **Formatering**: Bruk **aldri** fet skrift (`**tekst**`) for å utheve ord eller setninger i brødteksten. Dette gir et uryddig uttrykk. Viktige begreper skal håndteres av det automatiske begrepssystemet (concepts), som gir dem en egen stil og funksjonalitet uten behov for manuell utheving.
*   **Lister**: Bruk **aldri** markdown-lister (linjer som starter med `-` eller `*`) innad i en `text`-blokk. Tekstmotoren støtter ikke dette, og det vil se ødelagt ut. Bruk heller en egen blokk med `type: "list"` og legg punktene i en `items`-array.
*   **Mikrospill inline**: Lette spill kan embeddes rett i en artikkel med `{ "type": "component", "name": "MicroGame", "props": { "gameId": "<id>" } }`. Spillene bor i `src/components/microgames/` og registreres i `registry.ts`. Dette er et eget, lett spor (R3F/2D, lazy-lastet) adskilt fra den tunge 3D-motoren i `src/games/engine/` — embed aldri fullmotoren i en artikkel. Bygg nye spill med `.agent/workflows/build_microgame.md`.

## 4.8. Troubleshooting / Feilsøking

*   **"Unable to find record"**: `religion`-feltet må være en ID (f.eks. `"kristendom"`), ikke filsti.
*   **"String cannot represent value"**: Sjekk for nestede `section`-blokker. Strukturen skal være flat.
*   **Ingen artikler i sammenligning**: Sjekk at `comparison_tags` er identiske (case-sensitive).

## 5. Automation & Maintenance

### Scripts
*   **`npm run scan:content`**: **KRITISK**. Genererer `content-index.json`. Kjøres automatisk ved `npm run dev`.
*   **`node scripts/generate-timeline.js`**: Brukes for å validere og bygge `global-timeline.json` hvis du har gjort manuelle endringer i tidslinjedata.

## 6. Blueprints (Design-First)
Før du faktisk skriver JSON, bør du ha en **Blueprint**.
- Lokasjon: `docs/Design documents/[topic]-blueprint.md`.
- Hensikt: Definere det narrative arket, visuelle prompts og læringsmål før bygging.
- Verktøy: Bruk gjerne workflowen `/plan_topic` for å generere dette.

## 7. Best Practices
For detaljerte tekniske og pedagogiske standarder, bruk skillen `article-implementation`.

1.  **Tags**: Bruk konsistente tags på tvers av artikler og tidslinje.
2.  **Datoer**: Bruk ISO-format (`YYYY-MM-DD`) for hendelser.
3.  **Bilder**: Se `docs/image-style-guide.md` for hvordan du genererer bilder som passer inn i den visuelle estetikken.