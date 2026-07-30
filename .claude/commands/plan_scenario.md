---
description: Design-fase for et nytt Tidsreise-scenario. Lager Blueprint og definerer narrativ, stats og nodeflyt.
---

# Workflow: Plan Scenario

**Input:** Konsept, tema, historisk periode eller faglig kontekst (f.eks. "vikingtid", "første verdenskrig").

---

## 1. Les Referanser

*   File: `docs/SCENARIO_DESIGN_GUIDE.md` - Full teknisk og pedagogisk spec.
*   File: `docs/templates/scenario-blueprint-template.md` - Blueprintmalen.
*   File: `public/content/scenarios/nikolaj-ii.json` - Les kun metadata + 2-3 minigame-noder. Referanse for avansert minigame-bruk.
*   File: `public/content/scenarios/roman-soldier.json` - Enklere referanse (battle + dice).

---

## 2. Definer Kjernen (ULTRATHINK)

Bruk det oppgitte konseptet til å brainstorme:

*   **Rolle:** Hvem er eleven i dette universet? (Konkret og historisk forankret - f.eks. "Vikinghandelsmann på Silkeveien")
*   **Spenningsbue:** Hva er det overordnede dilemmaet eleven må navigere? (Ikke "overlev" - finn en historisk-faglig kjerne)
*   **De 3-5 Stats:** Hva kan eleven miste eller vinne? Velg stats som har reell faglig forankring.
    *   Eks. Vikingtid: `ære`, `gull`, `skip_tilstand`, `rel_kaptein`
    *   Eks. Kald krig: `tillit`, `propaganda`, `øst_vest_spenning`
*   **Hub-noden:** Hva er "hjemmebasen"? (En leir, et marked, en by - brukes som navigasjonspunkt mellom hendelser)
*   **2-3 sentrale Hendelser/Valg:** Hva er de viktigste historisk meningsfulle valgene eleven tar?
*   **Minigame per nøkkelhendelse:** Hvilken mekanikk passer best?
    *   Diplomatisk kaos → `telegram`
    *   Ressursmangel → `rationing` eller `allocation`
    *   Krisehåndtering → `crowd`
    *   Propaganda/sensur → `censor`
    *   Tillit og forræderi → `intrigue`
    *   Retorikk → `speech`
    *   Strid → `battle`
*   **Narrative flags:** Hva er de 2-4 viktigste hendelsene eleven kan ta med seg gjennom historien? (Eks. `hjalp_fienden`, `nektet_ordre`, `ofret_seg`). Flags er ikke tall - de er hendelser som påvirker epilog og låser/åpner valg.
*   **Automatisk game-over:** Er det en stat som representerer katastrofe (atomkrig, pest, revolusjon)? Definer `gameOverConditions` for den. Gi game-over-noden en `epilogue` med `historicalEcho` som forklarer hva som gikk galt.
*   **Persongalleri (perspectives):** Har scenariet 6 eller flere navngitte historiske figurer fra ulike nasjoner? Planlegg `perspectives`-ordboken: faction, emoji-flagg og tittel for hver. Se `kald-krig.json` for et eksempel med 30+ speakers.

---

## 3. Opprett Blueprint

Opprett filen `docs/Design documents/[scenario-id]-scenario-blueprint.md` basert på malen i `docs/templates/scenario-blueprint-template.md`.

Fyll ut med spesifikt og konkret innhold - ikke generiske plassholdere. Blueprinten skal inneholde:

### Metadata
*   `id`, `title`, `role`, `era/year`, alle stats med startverdi og ikon
*   Koblet til manifest: hvilken `subjectId` og `topicId` hører dette under?

### Narrativ Bue
*   Introduksjonsscene (hva ser eleven, hva er umiddelbar kontekst)
*   Hovedkonflikt (pedagogisk forankret i læreplanen)
*   2-3 mulige avslutninger (seier, kompromiss, nederlag) med konkrete stat-terskler

### Nodeflyt (Minst 8 noder)

| Node ID | Type | Beskrivelse | Valg/Utganger | Faglig kobling | Flags/Discovery/Ethics |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `intro` | Narrativ | Ankomstscene | -> `hub_[navn]` | Historisk kontekst | `discoveryEvent` |
| `hub_[navn]` | Hub/Kart | Hjemmebasen | 3-4 lokasjoner | Oversikt/navigasjon | - |
| `[hendelse_1]` | Narrativ | ... | Valg A (`setFlags`), Valg B | ... | `ethicsLens`, `setFlags` |
| `[minigame_1]` | Battle/Dice/Signal/Telegram/Triage/Crowd/... | ... | Win -> ..., Loss -> ... eller onComplete -> ... | ... | - |
| `ending_select` | Valg (ikke end-node) | Ruter til riktig slutt basert på stats/flagg | condition.all / statId | - | - |
| `victory` | Ending | Seierscene | - | Refleksjon | `epilogue` med flag-entries |
| `defeat` | Ending | Tap-scene | - | Refleksjon | `epilogue` med flag-entries |

> Scenariet kan ha 2-3 seier-slutt-noder som representerer ulike historiske holdninger, pluss én tap-slutt. Bruk `ending_select` som en ren routing-node uten `isEnd`. Se `kald-krig.json` for eksempel med tre victory endings.

### Gjenstander & Crafting (valgfritt)
*   List opp 2-4 items som er narrativt meningsfulle
*   Én crafting-oppskrift hvis relevant
*   **Brev-items:** Dersom et item er et brev (brev fra hjem, ordre, historisk dokument), merk det i blueprinten med avsender, mottaker, dato og 4-6 avsnitt med brevtekst. Ikon skal være `"scroll"`, `"book"`, eller `"mail"` (alle fungerer for brev). Disse rendres som stiliserte håndskrevne brev i ryggsekken via `content.itemType: "letter"` (se `build_scenario.md` for JSON-struktur).

### Asset-prompts
*   Hero Image-prompt (16:9, cinematisk, WebP)
*   3-5 node-bildeprompts med eksakt stil fra `docs/image-style-guide.md`

---

## 4. Intervju (Interaktivt)

Etter at utkast er skrevet, still brukeren disse spørsmålene dersom blueprinten mangler svar:

1.  "Hvilken faglig kompetanse skal eleven sitte igjen med? (Læreplanen)"
2.  "Hvilke typer minispill passer historien? (Telegram, Rasjonering, Tale, Folkemengde-press, Triasje, Intriger, Sensur, Gassmaske, Signal, Kamp, Terning, Domsavsigelse, Propaganda, Domino-proxy-strategi)"
    - **Propaganda** - Eleven er redaktør/propagandist og velger hvilken versjon av sannheten som publiseres. Passer for scenarier i autoritære regimer eller medieetikk-kontekst.
    - **Domino** - Eleven fordeler begrensede ressurser mellom geografiske regioner med ulik risiko og potensiell gevinst. Passer for proxy-konflikter og geopolitisk strategi.
3.  "Er det en spesifikk historisk hendelse eller person som bør være sentralt?"
4.  "Ønsket visuell stil - realistisk foto, illustrasjon, maleri?"

---

## 5. Godkjenning

*   Bruker leser `docs/Design documents/[scenario-id]-scenario-blueprint.md`
*   Exit-betingelse: Bruker sier "Bygg det" eller "Godkjent" -> Trigger `/build_scenario`
