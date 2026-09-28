# Læringssti v3 - «Stien»

Læringsstiene erstatter både v1 (vertikal liste med oppgaver og lenker ut til artikler) og v2
(stepper med faner, fjernet september 2026). Romerriket-stien
(`public/content/historie/romerriket/romerriket-sti.json`) er referansestandarden.
De andre stiene er fortsatt v1 til de blir migrert, én og én.

## Prinsippene

1. **Utseendet fra v1.** Én vertikal sti der alle stegene er synlige, delt inn i faser.
2. **Samme rytme i hvert steg, ett trinn om gangen.** Et åpent steg har et stort bildebanner
   og en trinnlinje: **Les → Spill → Svar → Skriv**. Bare ett trinn vises av gangen, så eleven
   alltid vet hvor blikket skal hvile.
   1. **Les** - en kort fortelling (150-250 ord, skrevet for 14-åringer) i én rolig lesespalte.
   2. **Spill** - ett spill eller én interaksjon.
   3. **Svar** - 3-4 flervalgsspørsmål, med fortellingen synlig ved siden av (desktop).
   4. **Skriv** - stjernene, «Neste steg» og oppgavene til skriveboka, åpent og synlig.
3. **Svarene står i stien.** Alt spørsmålene spør om, skal stå i fortellingen. Artikkelen er
   bare «Vil du vite mer?». Skriver du et spørsmål, skal du kunne peke på setningen som svarer.
4. **Selvforklarende.** Neste steg lyser og har den eneste fylte knappen. Myk lås: alle
   steg kan åpnes, men stien anbefaler rekkefølgen.
5. **Tre stjerner per steg:** spilt, svart, alt riktig på første forsøk.

## Skjema

Eleven ser «steg». I koden og JSON-en heter de fortsatt `stations` / `StationV3`, og delene inni
et steg (Les, Spill, Svar, Skriv) kalles trinn.

Artikkelfila har `"layout": "learning-path-v3"` og `learningPathV3Data`. Typene står i
`src/types.ts` (`LearningPathV3Data`, `PathPhaseV3`, `StationV3`, `StationActivityV3`).

```json
{
    "id": "romerriket-sti",
    "title": "Læringssti: Romerriket",
    "layout": "learning-path-v3",
    "category": "Læringssti",
    "learningPathV3Data": {
        "id": "romerriket-sti",
        "version": 3,
        "title": "...",
        "description": "...",
        "heroImage": "/images/...",
        "estimatedMinutes": 150,
        "targetSubjectId": "historie",
        "targetTopicId": "romerriket",
        "phases": [
            {
                "id": "republikken",
                "title": "Fra landsby til verdensmakt",
                "subtitle": "753 - 44 fvt.",
                "stations": [
                    {
                        "id": "legionaeren",
                        "title": "Legionæren",
                        "teaser": "Én linje som frister på det lukkede kortet.",
                        "emoji": "🛡️",
                        "image": "/images/romerriket/hero-legion.webp",
                        "story": ["Avsnitt 1 ...", "Avsnitt 2 ..."],
                        "activity": { "type": "microgame", "gameId": "testudo-3d" },
                        "check": [
                            {
                                "question": "...",
                                "options": ["...", "...", "...", "..."],
                                "correct": 2,
                                "explanation": "Vises når eleven har svart riktig."
                            }
                        ],
                        "tasks": [
                            { "id": "legionaeren-f1", "type": "finn", "text": "Hvor mange år vervet en legionær seg for?" },
                            { "id": "legionaeren-t1", "type": "tenk", "text": "...", "km": ["saf-10-7"], "kjennetegn": "Årsak-virkning" }
                        ],
                        "readMore": [{ "title": "Den romerske legionen", "url": "/historie/romerriket/den-romerske-legionen" }]
                    }
                ],
                "deepDive": {
                    "intro": "...",
                    "articles": [{ "title": "...", "url": "/historie/..." }],
                    "tasks": [{ "id": "d1-f1", "type": "finn", "text": "Les «...». Hva ...?" }]
                }
            }
        ],
        "project": { "intro": "...", "choices": [{ "id": "p1", "type": "drøft", "text": "...", "km": ["saf-10-6"] }] },
        "finale": { "title": "...", "text": "..." },
        "presentation": { "slides": [] }
    }
}
```

### Aktivitetstyper

| `type` | Felter | Når |
|---|---|---|
| `microgame` | `gameId`, `props?` | Mikrospill fra `src/components/microgames/registry.ts`. Åpnes i fullskjerm med spillplakat. |
| `fullgame` | `gameId`, `title`, `subtitle?`, `image?`, `pitch` | Stort 3D-spill fra `GAME_REGISTRY` (`src/pages/GamePage.tsx`). Åpnes på egen side med «Tilbake til læringsstien», og stien åpner rett steg igjen (`?stasjon=`). |
| `sort` | `prompt`, `buckets` (2-3), `items[{text, bucket, explanation?}]` | Ett kort om gangen, eleven trykker riktig kolonne. |
| `order` | `prompt`, `items[{text, label?}]` i riktig rekkefølge | Eleven trykker brikkene i rekkefølge; `label` (årstall) vises når brikken er plassert. |
| `component` | `name`, `props?`, `label?` | Hvilken som helst komponent fra `ComponentRegistry`, med en «Jeg er ferdig»-knapp. |

## Oppgaver til skriveboka: tre lag

Oppgavene er bygd rundt kompetansemålene i samfunnsfag etter 10. trinn
(`public/content/kompetansemal/historie-10-trinn.json`) og kjennetegnene på måloppnåelse
(årsak-virkning, kildebruk, perspektiver, handlingsalternativer, sammenhenger).
Alle oppgaver er `LearningPathTask` med `type`, og gjerne `km` og `kjennetegn`.

1. **Steget** (`station.tasks`), uten artikkel: to `finn`-oppgaver der svaret står ordrett
   i fortellingen (ett ord eller et tall, så også de svakeste elevene kommer i gang), og én
   `tenk`-oppgave som kan besvares ut fra fortellingen.
2. **Dypdykk etter hver del** (`phase.deepDive`), med artikler: 2-4 artikler og 3-4 oppgaver.
   Den første er en enkel `finn`-oppgave i én bestemt artikkel, resten er `drøft`-oppgaver merket
   med kompetansemål og kjennetegn. Her får artiklene en rolle: eleven leser fordi oppgaven krever det.
   Dypdykket gir ikke stjerner og stenger ikke stien, men telles i toppkortet.
3. **Fordypning til slutt** (`project.choices`): eleven velger én av tre prosjektoppgaver,
   hver knyttet til et kompetansemål.

Når en sti bygges eller migreres, skal den også legges inn under `stier` for målene den dekker
i kompetansemål-fila.

## Skrivereglene gjelder fullt ut

Se «Språklige krav» i `CLAUDE.md`. Forklar fagord i samme setning, skriv aktivt, ingen
tankestrek, ingen fet skrift. Varier plasseringen av riktig svar (`correct`).

## Kode

- `src/components/content/learning-path-v3/` - `LearningPathV3` (sti og fremdrift),
  `StationCard`, `StationActivity`, `SortActivity`, `OrderActivity`, `CheckQuiz`,
  `stationProgress.ts` (stjerner og tilstand).
- Fremdrift lagres i `useLearningPathProfile` (localStorage). `saveResponse` lagrer delvis
  fremdrift (spillet er spilt), mens `completeStep` markerer steget som klarert og gir XP.
- `scripts/update-learning-paths.cjs` merker v3-stier med `version: 3` i hub-registeret.
