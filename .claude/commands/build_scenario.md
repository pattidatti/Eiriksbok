---
description: Bygger et fullstendig Tidsreise-scenario-JSON fra en godkjent Blueprint. Implementerer alle noder, stats, items og registrerer i manifest.
---

# Workflow: Build Scenario

**Input:** `[scenario-id]` - ID-en til et godkjent scenario (blueprint skal eksistere).

**Forutsetning:** `/plan_scenario` er fullført og blueprinfilen finnes.

---

## 1. Les Kontekst

*   File: `docs/Design documents/[scenario-id]-scenario-blueprint.md` - PRIMÆRKILDEN. Følg denne nøye.
*   File: `docs/SCENARIO_DESIGN_GUIDE.md` - Teknisk spec for alle node-typer og felter.
*   File: `public/content/scenarios/nikolaj-ii.json` - Referanse for enkeltaktør-scenarier med klassiske minigame-typer (alle 13 base-typer).
*   File: `public/content/scenarios/kald-krig.json` - Gold standard for avanserte multi-akt-scenarier. Les de første 250 linjene for `perspectives`, `gameOverConditions`, `propaganda`, `domino`, hub-completion med `condition.all`, `visitedFlag`, og multiple victory endings.
*   File: `public/content/scenarios/roman-soldier.json` - Enklere referanse (battle + dice + crafting).
*   File: `public/content/manifest.json` - For å finne riktig `subjectId` og `topicId` til registrering.

---

## 2. Opprett Scenario-JSON

Opprett `public/content/scenarios/[scenario-id].json`.

### 2.1 Rotstruktur (Metadata)

```json
{
  "id": "[scenario-id]",
  "title": "...",
  "subtitle": "Undertittel (valgfritt - anbefalt for lengre scenarier)",
  "heroImage": "/images/chronos/[scenario-id]/hero.webp",
  "era": "...",
  "year": "...",
  "role": "...",
  "summary": "...",
  "startingNodeId": "intro",
  "randomEvents": [],
  "gameOverConditions": [],
  "perspectives": {},
  "config": { ... },
  "nodes": { ... }
}
```

*   `summary` skal være 1-2 setninger som gir eleven lyst til å starte.
*   `heroImage` - 16:9 WebP-bilde vist på scenario-kortet og intro-skjermen. Valgfritt men anbefalt.
*   `subtitle` - Valgfri undertittel, f.eks. epoke eller historisk kontekst. Vises under tittelen.
*   `randomEvents` fylles med node-ID-er for hendelser som kan trigges tilfeldig fra hub-noden (kan være tom liste).

#### `gameOverConditions` (valgfritt)

Automatisk game-over-trigger. Hvis en stat når eller overskrider terskelen, omdirigeres spilleren umiddelbart til den angitte noden - uavhengig av hvor i grafen spilleren er.

```json
"gameOverConditions": [
  { "statId": "atomspanning", "threshold": 100, "nodeId": "game_over_atomkrig" }
]
```

*   `nodeId` MÅ finnes i `nodes` og være en end-node med `"isEnd": true` og `"endType": "defeat"`.
*   Bruk for stats som representerer uopprettelig katastrofe (atomkrig, massedød, systemkollaps).
*   Kan definere flere betingelser (én per entry).
*   Ikke kombiner med manuell defeat-routing via valg-betingelser på samme stat - velg én tilnærming.

#### `perspectives` (valgfritt - anbefalt for 6+ navngitte figurer)

Speaker-register som gir alle navngitte talere i scenariet et visuelt identitetskort (faksjon, flagg, undertittel) i dialog-UI-et.

```json
"perspectives": {
  "Stalin": {
    "faction": "sovjet",
    "flag": "🇷🇺",
    "subtitle": "Generalsekretær, Sovjet"
  },
  "Kennedy": {
    "faction": "usa",
    "flag": "🇺🇸",
    "subtitle": "President, USA"
  },
  "Afghansk bonde Fatima": {
    "faction": "sivil",
    "flag": "🇦🇫",
    "subtitle": "Landsbybeboer, Panjshir-dalen"
  },
  "Forteller": {
    "faction": "forteller",
    "flag": "📖",
    "subtitle": "Historisk forteller"
  }
}
```

*   Nøkkelen MÅ matche nøyaktig `"speaker"`-verdien brukt i noder.
*   `"faction"` er en fri streng - bruk konsistente verdier på tvers av scenariet (f.eks. `"sovjet"`, `"usa"`, `"sivil"`, `"forteller"`).
*   `"flag"` er et emoji-flagg for karakterens nasjon/tilhørighet.
*   `"subtitle"` er en kort tittel vist under navnet (f.eks. `"Generalsekretær, Sovjet"`).
*   `"Forteller"` bør alltid inkluderes med `"faction": "forteller"` og `"flag": "📖"`.
*   Se `kald-krig.json` for fullstendig eksempel med 30+ speakers fra ulike fraksjoner og nasjoner.

### 2.2 Config-objekt

```json
"config": {
  "stats": [
    { "id": "stat_id", "label": "Visningsnavn", "icon": "shield|heart|crown|users|zap|book-open", "value": 50, "max": 100, "category": "core|relation|special" }
  ],
  "items": [
    { "id": "item_id", "name": "Navn", "description": "Beskrivelse.", "icon": "sword|star|gem|scroll|mail|feather|book-open|zap" },
    {
      "id": "brev_id", "name": "Brev fra X", "description": "Kort ingress.", "icon": "scroll|book|mail",
      "content": {
        "itemType": "letter",
        "from": "Avsender, Sted",
        "to": "Mottaker, Enhet",
        "date": "DD. måned ÅÅÅÅ",
        "body": ["Kjære X,", "Avsnitt 2.", "Hilsen Y"]
      }
    }
  ],
  "recipes": [
    { "id": "recipe_id", "result": "item_id", "ingredients": ["item_a", "item_b"] }
  ],
  "theme": {
    "primaryColor": "#hex",
    "font": "serif|sans-serif"
  }
}
```

*   **Stats-kategorier:**
    *   `"core"` - Kjernestats som representerer spillerens grunnleggende kapasiteter (makt, ressurser, militær styrke). Vises fremtredende i HUD.
    *   `"relation"` - Stats som representerer relasjoner til enkeltpersoner eller grupper. Brukes av `npcDialogue`-systemet for automatisk tonevalg.
    *   `"special"` - Unike stats med narrativ spesialrolle (f.eks. en persons helse, en spesiell ressurs).
    *   Utelatt - Også gyldig. `kald-krig.json` utelater `category` på alle stats. Stats uten kategori fungerer som `"core"`.
*   `recipes` kan være en tom liste `[]` dersom ingen crafting er planlagt.
*   **Gjenstander med `content`** vises med en klikkbar modal i ryggsekken:
    *   `itemType: "letter"` - brevvisning med sepia-stil, Fra/Til/Dato og brødtekst som `<p>`-elementer.
    *   `itemType: "object"` - standard gjenstandsvisning (brukes sjelden; gjenstander *uten* `content` bruker samme visning automatisk).
    *   Brev skal ha `"icon": "scroll"`, `"icon": "book"`, eller `"icon": "mail"`.
    *   `body`-arrayen: ett element per avsnitt. Første element er gjerne tiltalen ("Kjære X,"), siste er underskriften.

### 2.3 Noder

Bygg ut ALLE noder definert i blueprinten. Hvert node-objekt:

```json
"node_id": {
  "id": "node_id",
  "text": "Narrativ tekst (2-4 setninger, levende og historisk forankret).",
  "speaker": "Forteller|[Karakternavn]",
  "backgroundImage": "/images/chronos/[filnavn].webp",
  "uiType": "map",
  "mapConfig": {
    "image": "/images/chronos/[kart-filnavn].webp",
    "points": [
      {
        "id": "point_id",
        "x": 35,
        "y": 30,
        "label": "Punkt-label vist i UI",
        "icon": "flag|plane|truck|shield|scroll|marker|tent|swords|water|castle|home|eye|book|map",
        "nextNodeId": "destinasjon_node",
        "visitedFlag": "hub_punkt_ferdig"
      }
    ]
  },
  "discoveryEvent": {
    "title": "Historisk faktum",
    "fact": "1-2 setninger med ekte historisk data.",
    "articleLink": "/fag/emne/artikkel",
    "reflectionQuestion": "Hva tenker du om...?"
  },
  "npcDialogue": {
    "statId": "rel_[navn]",
    "cold": "Han snur seg bort.",
    "neutral": "'Hva vil du?'",
    "warm": "'[Navn]! Kom og sett deg.'"
  },
  "journalPrompt": "Hva mener du om...",
  "choices": [ ... ]
}
```

**Felt-regler:**
*   `uiType: "map"` - Bruk KUN for hub-noder. Utelat feltet for alle andre noder.
*   `mapConfig` - KUN relevant når `uiType: "map"` er satt:
    *   `image` - Bakgrunnsbilde for kartet. Kan være et annet bilde enn `backgroundImage`.
    *   `points[].x` og `points[].y` - Prosentkoordinater (0-100) for hvor punktet vises på kartbildet.
    *   `points[].visitedFlag` - Flagg som settes automatisk når spilleren returnerer fra destinasjonen. Bruk dette til å spore hub-fullføring.
    *   `points[].icon` - Ikon vist på kartpunktet. Bruk passende kontekstuelt ikon.
    *   Hub-nodens `choices` bør enten være tom `[]` (kartet håndterer navigasjon) eller inneholde ett låst "gå videre"-valg gatet av `condition.all` som sjekker alle `visitedFlag`-verdier.
*   `journalPrompt` - Bruk ved viktige veiskiller (før stor konflikt, etter minigame). Tving refleksjon.
*   `backgroundImage` - Alltid `/images/chronos/[beskrivende-filnavn].webp`. Filen trenger ikke eksistere ennå.
*   `speaker` - Bruk "Forteller" for narratorscener. Bruk karakternavn for dialog. Hvis `perspectives` er definert, MÅ `speaker`-verdien matche en nøkkel i `perspectives`.
*   `discoveryEvent` - Bruk ved historisk viktige noder (første gang eleven møter en realitet: gassangrep, krigsrett, hungersnød). Kun én per node. Vises automatisk første gang eleven besøker noden. Bruk på minst 1-2 noder i scenariet.
*   `npcDialogue` - Bruk på noder der en NPC snakker og det finnes en `rel_[navn]`-stat. Velg `statId` lik den aktuelle relasjonens stat-ID. Relasjonsverdien styrer hvilken tone som vises automatisk.

### 2.4 Valg (choices)

```json
{
  "id": "c_[node_id]_[nummer]",
  "text": "Handlingsrettet valgtext (verb + konsekvens-hint)",
  "nextNodeId": "neste_node",
  "effects": { "stat_id": 10, "annen_stat": -5 },
  "setFlags": ["flagg_id"],
  "clearFlags": ["flagg_som_fjernes"],
  "condition": {
    "hasFlag": "krev_dette_flagget",
    "lacksFlag": "blokker_hvis_dette_flagget"
  },
  "isHistoricalChoice": true,
  "historicalConsequence": "Hva som faktisk skjedde historisk, i 2-4 setninger.",
  "ethicsLens": {
    "deontological": "Kant: ...",
    "consequentialist": "Utilitarisme: ...",
    "virtue": "Aristoteles: ..."
  },
  "updateInventory": { "add": "item_id" },
  "checkInventory": { "hasItem": "item_id" },
  "updateEnvironment": { "time": "day|night", "weather": "rain|clear" }
}
```

*   Hvert valg skal ha **minst ett `effects`-objekt** (stats endres alltid).
*   Bruk `checkInventory` for valg som krever en gjenstand - disse låses automatisk i UI.
*   Skriv valgtext slik at eleven forstår den historiske implikasjonen.
*   `setFlags` - bruk på valg som representerer en *hendelse* eleven husker (hjalp fienden, nektet ordre, tok gjenstand). Snake_case. Flag-IDer må være konsistente på tvers av hele scenariet.
*   `condition.hasFlag` / `condition.lacksFlag` - brukes i stedet for (eller i tillegg til) stat-betingelser for å låse/åpne valg basert på hendelser.

#### Avansert: `condition`-objektet

`condition` støtter tre former:

**1. Enkel flagg-betingelse (standard):**
```json
"condition": {
  "hasFlag": "flagg_id",
  "lacksFlag": "annet_flagg"
}
```

**2. Stat-basert betingelse:**
```json
"condition": {
  "statId": "historisk_innsikt",
  "operator": ">=",
  "value": 80
}
```
Gyldige operatorer: `"<"`, `"<="`, `">"`, `">="`, `"=="`.

**3. AND-logikk med `condition.all`:**
```json
"condition": {
  "all": [
    { "hasFlag": "iran_done" },
    { "hasFlag": "suez_done" },
    { "hasFlag": "sputnik_done" },
    { "hasFlag": "berlin_mur_done" }
  ]
}
```

`all`-entries kan blande flagg- og stat-betingelser. Primærbruk: hub-node fremgang-gating - et "gå videre til neste kapittel"-valg som kun vises når alle kartpunkter (via `visitedFlag`) er besøkt. `condition.all` og `condition.statId` er gjensidig utelukkende - velg én form.

#### `isHistoricalChoice` og `historicalConsequence`

*   `isHistoricalChoice: true` - Merker dette valget som det historisk korrekte blant søskenvalg. Trackes i `choiceHistory` og vises i `EndComparisonScreen`.
*   `historicalConsequence` - Tekst som forklarer hva som faktisk skjedde historisk (2-4 setninger). Vises i `EndComparisonScreen` etter at scenariet er ferdig.
*   Bruk nøyaktig én `isHistoricalChoice: true` per beslutningsnode der det finnes et objektivt historisk utfall.
*   Begge felt er valgfrie og uavhengige - du kan ha ett uten det andre.
*   Krever `showEndComparison: true` på end-noden for at sammenligningen skal vises.

#### `ethicsLens`

```json
"ethicsLens": {
  "deontological": "Kant: ...",
  "consequentialist": "Utilitarisme: ...",
  "virtue": "Aristoteles: ..."
}
```

*   Bruk på valg med moralsk vekt. Aktiveres kun dersom eleven har slått på etikk-modus i HUD.
*   **Alle tre felt er uavhengig valgfrie.** Et valg kan ha kun én eller to perspektiver i stedet for alle tre. Bruk delvise felt når kun visse rammeverk genuint gjelder det moralske spørsmålet. Se `kald-krig.json` for eksempler med enkeltfelt.

### 2.5 Minispill-noder

Alle minigame-noder har `"choices": []` (tom liste) - routing skjer via minigame-config. Minigame-feltet er alltid innkapslet i et `"minigame": { "type": "...", "config": { ... } }` wrapper-objekt.

#### Valgguide: Pedagogisk funksjon per type

| Type | Pedagogisk funksjon | Routing |
|---|---|---|
| `telegram` | Prioritering under press / informasjonsoverbelastning | `onComplete` |
| `allocation` | Ressursfordelingsbeslutninger | `onComplete` |
| `speech` | Retorikk og innramming med kombo-utfall | `onComplete` |
| `intrigue` | Tillit og svik, sosial analyse | `onComplete` |
| `crowd` | Sanntids krisehåndtering (eneste med ekte tidspress) | `winNodeId`/`lossNodeId` |
| `triage` | Medisinsk/etisk prioritering under knapphet | `onComplete` |
| `signal` | Enkelt observasjons-/tolkningsutfordring | `winNodeId`/`lossNodeId` |
| `gasmask` | Tidsbegrenset overlev med inventarkrav | Per-option `nextNodeId` |
| `rationing` | Moralsk ressursallokering med kumulativ effekt | `onComplete` |
| `censor` | Kildekritikk / sensur-etikk | `onComplete` |
| `battle` | Historisk forankret strid (stein-saks-papir) | `winNodeId`/`lossNodeId` |
| `dice` | Tilfeldighet og skjebne som historisk faktor | `winNodeId`/`lossNodeId` |
| `justice` | Etisk domsavsigelse | `onComplete` |
| `propaganda` | Presseetikk og redaksjonell makt (eleven er propagandisten) | `onComplete` |
| `domino` | Geopolitisk proxy-strategi med ressursavveining og risiko | `winNodeId`/`lossNodeId` |

---

**battle:**
```json
"node_id": {
  "id": "node_id",
  "text": "Introduksjonstekst for kampen.",
  "speaker": "...",
  "backgroundImage": "/images/chronos/...",
  "choices": [],
  "minigame": {
    "type": "battle",
    "config": {
      "enemyName": "Fiendenavn",
      "playerHealth": 15,
      "enemyHealth": 15,
      "winNodeId": "seier_node",
      "lossNodeId": "tap_node",
      "moves": [
        { "id": "angrep", "label": "Angrep", "type": "attack", "damage": 4, "counters": ["maneuver"] },
        { "id": "forsvar", "label": "Forsvar", "type": "defend", "damage": 2, "counters": ["attack"] },
        { "id": "manøver", "label": "Manøver", "type": "maneuver", "damage": 3, "counters": ["defend"] }
      ]
    }
  }
}
```
> `type` må være `attack|defend|maneuver`. `counters` inneholder *typer* som flytten slår, ikke ID-er. `damage` er antall HP som trekkes ved treff.

---

**dice:**
```json
"node_id": {
  "id": "node_id",
  "text": "Terningkast-scene.",
  "speaker": "...",
  "backgroundImage": "/images/chronos/...",
  "choices": [],
  "minigame": {
    "type": "dice",
    "config": {
      "targetScore": 4,
      "winNodeId": "seier_node",
      "lossNodeId": "tap_node"
    }
  }
}
```

---

**justice:**
```json
"node_id": {
  "id": "node_id",
  "text": "Domsscene.",
  "speaker": "...",
  "backgroundImage": "/images/chronos/...",
  "choices": [],
  "minigame": {
    "type": "justice",
    "config": {
      "onComplete": { "nextNodeId": "neste_node" },
      "cases": [
        {
          "id": "case_id",
          "description": "Tvistebeskrivelse.",
          "mercy": { "nextNodeId": "...", "effects": { "stat": 10 } },
          "harsh": { "nextNodeId": "...", "effects": { "stat": -10 } }
        }
      ]
    }
  }
}
```

---

**telegram:**
```json
"node_id": {
  "id": "node_id",
  "text": "Introduksjonstekst.",
  "speaker": "...",
  "backgroundImage": "/images/chronos/...",
  "choices": [],
  "minigame": {
    "type": "telegram",
    "config": {
      "onComplete": { "nextNodeId": "neste_node" },
      "telegrams": [
        { "id": "tg1", "from": "Avsender", "preview": "Meldingstekst...", "correctBucket": "urgent" },
        { "id": "tg2", "from": "Avsender 2", "preview": "Tekst...", "correctBucket": "wait" }
      ]
    }
  }
}
```
> `correctBucket`: `"urgent"` eller `"wait"`. Bruk 4-6 telegrammer. Score beregnes internt.

---

**allocation:**
```json
"node_id": {
  "id": "node_id",
  "text": "Introduksjonstekst.",
  "speaker": "...",
  "backgroundImage": "/images/chronos/...",
  "choices": [],
  "minigame": {
    "type": "allocation",
    "config": {
      "onComplete": { "nextNodeId": "neste_node" },
      "totalPoints": 100,
      "categories": [
        { "id": "militær", "label": "Militær front", "description": "Utstyr og forsyninger til hæren" },
        { "id": "mat", "label": "Mat til folket", "description": "Korn til bybefolkningen" }
      ]
    }
  }
}
```
> Alltid 3-4 kategorier. Ingen effekter fra minigamen selv - bruk en oppfølgende narrativnode for konsekvenser.

---

**speech:**
```json
"node_id": {
  "id": "node_id",
  "text": "Introduksjonstekst.",
  "speaker": "...",
  "backgroundImage": "/images/chronos/...",
  "choices": [],
  "minigame": {
    "type": "speech",
    "config": {
      "onComplete": { "nextNodeId": "konsekvens_node" },
      "columns": [
        { "label": "Tone", "options": [{ "id": "streng", "text": "Streng" }, { "id": "mild", "text": "Mild" }] },
        { "label": "Fokus", "options": [{ "id": "krig", "text": "Krigen" }, { "id": "folk", "text": "Folket" }] }
      ],
      "outcomes": [
        { "combo": "streng_krig", "feedback": "Duma-representantene forlater i stillhet.", "effects": { "autoritet": 5, "folkets_stotte": -20 } },
        { "combo": "mild_folk", "feedback": "Forsiktig optimisme i salen.", "effects": { "autoritet": -5, "folkets_stotte": 20 }, "setsFlag": "valgfritt_flagg" }
      ]
    }
  }
}
```
> `combo`-nøkkel: option-ID-er i kolonneordenen, adskilt med `_`. Siste `outcomes`-innslag brukes som fallback. `setsFlag` er valgfritt på outcomes - bruk det når en talekombo skal huskes i epilogen.

---

**intrigue:**
```json
"node_id": {
  "id": "node_id",
  "text": "Introduksjonstekst.",
  "speaker": "...",
  "backgroundImage": "/images/chronos/...",
  "choices": [],
  "minigame": {
    "type": "intrigue",
    "config": {
      "onComplete": { "nextNodeId": "neste_node" },
      "tokens": 3,
      "characters": [
        { "id": "char1", "name": "Navn", "role": "Rolle", "description": "Hvem er dette?", "isTraitor": false, "feedback": "Historisk utfall." },
        { "id": "char2", "name": "Navn 2", "role": "Rolle 2", "description": "...", "isTraitor": true, "feedback": "Forræder." }
      ]
    }
  }
}
```
> Score beregnes internt. Bruk 5-7 karakterer, 2-3 forrædere.

---

**crowd:**
```json
"node_id": {
  "id": "node_id",
  "text": "Introduksjonstekst.",
  "speaker": "...",
  "backgroundImage": "/images/chronos/...",
  "choices": [],
  "minigame": {
    "type": "crowd",
    "config": {
      "winNodeId": "ro_gjenopprettet",
      "lossNodeId": "revolusjon_bryter_ut",
      "timeLimit": 25,
      "fillRate": 4,
      "responses": [
        { "id": "korn", "label": "Tilby korn", "description": "Nødhjelp", "pressureChange": -18, "cooldown": 6 },
        { "id": "militær", "label": "Send tropper", "description": "Risikerer eskalering", "pressureChange": 12, "cooldown": 3 }
      ]
    }
  }
}
```
> Starttrykk er hardkodet til 15. `fillRate` = trykk per sekund (3-6). `pressureChange` < 0 = reduksjon.

---

**triage:**
```json
"node_id": {
  "id": "node_id",
  "text": "Introduksjonstekst.",
  "speaker": "...",
  "backgroundImage": "/images/chronos/...",
  "choices": [],
  "minigame": {
    "type": "triage",
    "config": {
      "onComplete": { "nextNodeId": "neste_node" },
      "treatCapacity": 3,
      "patients": [
        { "id": "p1", "name": "Soldat Hansen", "wound": "Skuddsår i brystet, bevissthetssvikt", "correctBucket": "treat_now" },
        { "id": "p2", "name": "Menig Berg", "wound": "Brudd i armen", "correctBucket": "can_wait" },
        { "id": "p3", "name": "Kapteinen", "wound": "Hodeskade, ingen puls", "correctBucket": "expectant" }
      ]
    }
  }
}
```
> **NB:** Komponenten beregner effekter på `moral` og `overlevelse` internt basert på score-prosent. Egendefinerte effekter kan ikke injiseres fra JSON.

---

**signal:**
```json
"node_id": {
  "id": "node_id",
  "text": "Introduksjonstekst.",
  "speaker": "...",
  "backgroundImage": "/images/chronos/...",
  "choices": [],
  "minigame": {
    "type": "signal",
    "config": {
      "winNodeId": "riktig_rapport",
      "lossNodeId": "feil_rapport",
      "situation": "Beskriv scenen som skal tolkes...",
      "options": [
        { "id": "opt1", "label": "Tolkning A", "isCorrect": true },
        { "id": "opt2", "label": "Tolkning B", "isCorrect": false }
      ],
      "correctFeedback": "Rapporten var nøyaktig.",
      "incorrectFeedback": "Feil analyse - konsekvensene merkes."
    }
  }
}
```
> Nøyaktig én `isCorrect: true`.

---

**gasmask:**
```json
"node_id": {
  "id": "node_id",
  "text": "Introduksjonstekst.",
  "speaker": "...",
  "backgroundImage": "/images/chronos/...",
  "choices": [],
  "minigame": {
    "type": "gasmask",
    "config": {
      "situation": "Situasjonsbeskrivelse...",
      "timeLimit": 8,
      "options": [
        { "id": "opt1", "text": "Ta på gassmasken", "requiresItem": "gassmask_item_id", "nextNodeId": "overlevde", "effects": { "stat": 10 } },
        { "id": "opt2", "text": "Hjelp kameraten", "nextNodeId": "hjalp_kameraten" }
      ],
      "noMaskMessage": "Du rekker etter masken - den er ikke der.",
      "noMaskNextNodeId": "gass_skade",
      "noMaskEffects": { "stat": -20 },
      "timeoutNextNodeId": "gass_timeout",
      "timeoutEffects": { "stat": -15 }
    }
  }
}
```
> Mest granulær routing. Hvert option har eget `nextNodeId`. `requiresItem` sjekker inventar - mangler varen, brukes `noMaskNextNodeId`.

---

**rationing:**
```json
"node_id": {
  "id": "node_id",
  "text": "Introduksjonstekst.",
  "speaker": "...",
  "backgroundImage": "/images/chronos/...",
  "choices": [],
  "minigame": {
    "type": "rationing",
    "config": {
      "onComplete": { "nextNodeId": "neste_node" },
      "rations": 3,
      "soldiers": [
        { "id": "s1", "name": "Navn", "role": "Rolle", "context": "Kontekst om soldaten", "effects": { "ifGiven": { "moral": 5 }, "ifSkipped": { "moral": -5 } } }
      ]
    }
  }
}
```
> `rations` = maks antall soldater som kan motta. Alle effekter summeres og påføres stats.

---

**censor:**
```json
"node_id": {
  "id": "node_id",
  "text": "Introduksjonstekst.",
  "speaker": "...",
  "backgroundImage": "/images/chronos/...",
  "choices": [],
  "minigame": {
    "type": "censor",
    "config": {
      "onComplete": { "nextNodeId": "neste_node" },
      "paragraphs": [
        {
          "id": "p1",
          "tokens": [
            { "type": "text", "content": "Kjære mor, " },
            { "type": "phrase", "id": "ph1", "text": "fronten er et helvete", "shouldCensor": true, "reason": "Senker moral hjemme." },
            { "type": "text", "content": " men vi holder ut." }
          ]
        }
      ]
    }
  }
}
```
> **NB:** Komponenten har hardkodet brevhode - visuelt kontekst-spesifikt. Vurder om det passer scenariet.

---

**propaganda:**
```json
"node_id": {
  "id": "node_id",
  "text": "Introduksjonstekst.",
  "speaker": "...",
  "backgroundImage": "/images/chronos/...",
  "choices": [],
  "minigame": {
    "type": "propaganda",
    "config": {
      "onComplete": { "nextNodeId": "neste_node" },
      "outlet": "Pravda",
      "outletType": "soviet",
      "date": "26. april - 15. mai 1986",
      "items": [
        {
          "id": "item_id",
          "headline": "Overskriften slik den vil fremstå i avisen.",
          "realFacts": "1-2 setninger med hva som faktisk skjedde.",
          "options": [
            {
              "id": "opt_id",
              "label": "Kortlabel",
              "description": "Hva denne redaksjonelle beslutningen innebærer i praksis.",
              "credibilityChange": -20,
              "setsFlag": "valgfritt_flagg_id",
              "effects": { "stat_id": 10 }
            }
          ]
        }
      ]
    }
  }
}
```

*   `outletType` er en fri streng (`"soviet"`, `"western"`, osv.) som kontrollerer visuell styling av avisen.
*   `credibilityChange` er en numerisk delta på en intern troverdighets-score (positiv = økt, negativ = tapt troverdighet).
*   `setsFlag` på en option er valgfritt - bruk det når en spesifikk redaksjonell beslutning skal huskes i epilogen.
*   `effects` på en option er valgfritt - bruk det for å justere stats basert på den redaksjonelle beslutningen.
*   `realFacts` vises til eleven etter hver beslutning som pedagogisk tilbakemelding.
*   Bruk 3-5 items per propaganda-minigame. Hver item bør representere et reelt redaksjonelt dilemma fra den historiske konteksten.
*   **Forskjell fra `censor`:** I `censor` redigerer eleven andres brev for å skjule sannhet. I `propaganda` er eleven sjefsredaktøren som velger hvordan staten presenterer sin egen virkelighet (aktiv propagandist-rolle).

---

**domino:**
```json
"node_id": {
  "id": "node_id",
  "text": "Introduksjonstekst.",
  "speaker": "...",
  "backgroundImage": "/images/chronos/...",
  "choices": [],
  "minigame": {
    "type": "domino",
    "config": {
      "winNodeId": "seier_node",
      "lossNodeId": "tap_node",
      "budget": 6,
      "winThreshold": 55,
      "countries": [
        {
          "id": "region_id",
          "name": "Regionsnavn",
          "region": "Midtøsten",
          "pressureLevel": 60,
          "tileColor": "#dc2626",
          "actions": [
            {
              "id": "action_id",
              "label": "CIA-kuppstøtte",
              "cost": 2,
              "successBonus": 20,
              "backfireChance": 10,
              "description": "Skjult støtte til opposisjonen."
            }
          ]
        }
      ]
    }
  }
}
```

*   `budget` = totalt antall ressurspoeng spilleren kan fordele på tvers av alle regioner.
*   `winThreshold` = total score (0-100) som kreves for seier. Routing: `winNodeId` dersom total score >= `winThreshold`, ellers `lossNodeId`.
*   `pressureLevel` = nåværende fiendtlig press i regionen (0-100). Høyere = vanskeligere, men høyere potensiell gevinst.
*   `tileColor` = hex-farge for regionens tile i UI. Bruk rød for høy risiko, blå for lav.
*   `successBonus` = score-poeng lagt til totalen dersom handlingen lykkes.
*   `backfireChance` = prosent-sjanse for at handlingen slår negativt tilbake.
*   `cost` = antall budsjettpoeng denne handlingen koster.
*   Bruk 3-5 regioner. Gi spilleren nok budget til å hjelpe 2-3 regioner godt, men ikke alle - tvungen avveining er hele poenget.
*   Pedagogisk egnet for: proxy-konflikter, geopolitisk strategi, neokolonialisme, utilsiktede konsekvenser av skjulte operasjoner.

---

## 3. Avslutningsnoder

Inkluder minst to avslutningsnoder. For komplekse scenarier anbefales **multiple victory endings** - 2-3 ulike positive utfall som representerer forskjellige historiske holdninger eller grader av suksess, pluss 1-2 defeat-endings.

### Enkelt mønster (minimum)
*   **`victory`** - Positiv avslutning.
*   **`defeat`** - Negativ avslutning.

### Avansert mønster (anbefalt for multi-akt-scenarier)
*   **`ending_fredsskaperen`** - Best mulig utfall (krev høy innsikt + lav menneskelig kostnad).
*   **`ending_pragmatikeren`** - Middels utfall (fallback for de fleste spilløkter).
*   **`ending_pyrrhusseiros`** - Seier til høy pris (høy menneskelig kostnad).
*   **`game_over_[årsak]`** - Katastrofal defeat (trigget av `gameOverConditions`).

For å rute mellom multiple endings, opprett en **`ending_select`-node** (IKKE en end-node) med stat/flag-betingede valg:

```json
"ending_select": {
  "id": "ending_select",
  "text": "Konsekvensene av dine valg har formet historien...",
  "speaker": "Forteller",
  "choices": [
    {
      "id": "c_best",
      "text": "Den beste utgangen",
      "nextNodeId": "ending_fredsskaperen",
      "condition": {
        "all": [
          { "statId": "atomspanning", "operator": "<", "value": 50 },
          { "statId": "historisk_innsikt", "operator": ">=", "value": 80 },
          { "statId": "menneskekost", "operator": "<", "value": 40 }
        ]
      }
    },
    {
      "id": "c_worst",
      "text": "Pyrrhusseier",
      "nextNodeId": "ending_pyrrhusseiros",
      "condition": { "statId": "menneskekost", "operator": ">", "value": 70 }
    },
    {
      "id": "c_default",
      "text": "Pragmatisk utfall",
      "nextNodeId": "ending_pragmatikeren"
    }
  ]
}
```

> Siste valg i `ending_select` har **ingen condition** - det er fallback. Rekkefølgen er viktig: motoren evaluerer ovenfra og ned, og første match brukes.

### End-node-skjema

```json
"slutt_victory": {
  "id": "slutt_victory",
  "text": "...",
  "isEnd": true,
  "endType": "victory",
  "showEndComparison": true,
  "choices": [],
  "epilogue": {
    "entries": [
      { "hasFlag": "flagg_id", "text": "Personalisert linje basert på hva som skjedde." },
      { "lacksFlag": "flagg_id", "text": "Alternativ linje." }
    ],
    "historicalEcho": "Hva skjedde faktisk i denne perioden historisk sett.",
    "reflectionQuestion": "Ett åpent spørsmål til klassen.",
    "classroomQuestions": [
      "Åpent spørsmål 1 rettet mot klassen.",
      "Åpent spørsmål 2 med historiefaglig kjerne."
    ]
  }
}
```

**Regler:**
*   Minst én `entries`-oppføring per viktig flagg i scenariet.
*   `historicalEcho` kobler fiksjon til fakta - det som faktisk skjedde historisk.
*   `reflectionQuestion` er rettet mot klassen, ikke spilleren - brukes som samtalestart.
*   `classroomQuestions` (valgfritt) - array med åpne diskusjonsspørsmål for læreren. **NB:** Feltet er i JSON men rendres ikke av UI-et automatisk - det er pedagogisk dokumentasjon for læreren/plan.
*   `showEndComparison: true` (valgfritt) - Viser en `EndComparisonScreen` etter epilogen som sammenligner spillerens valg med historiske fakta. Krever at valg i scenariet har `isHistoricalChoice: true` og `historicalConsequence`. Bruk på alle victory-endings i scenarier der sammenligning med historisk virkelighet er pedagogisk verdifullt.

---

## 4. Valider JSON

Sjekk at:

- [ ] Alle `nextNodeId`-referanser peker på eksisterende node-ID-er.
- [ ] Alle `checkInventory.hasItem`-verdier er definert i `config.items`.
- [ ] Brev-items (`itemType: "letter"`) har utfylte `from`, `to`, `date` og minst 3 `body`-elementer.
- [ ] Alle `effects`-nøkler matcher en `id` i `config.stats`.
- [ ] `startingNodeId` finnes i `nodes`.
- [ ] Ingen node mangler `choices`-array (selv om den er tom).
- [ ] `setFlags`-IDer er konsistente - samme streng brukt på tvers av `setFlags`, `hasFlag`, `lacksFlag` og `epilogue.entries`.
- [ ] Alle end-noder har `epilogue` med minst én `historicalEcho`.
- [ ] Noder med `npcDialogue` peker på en `statId` som finnes i `config.stats`.
- [ ] `discoveryEvent` er brukt på minst 1-2 noder i scenariet.
- [ ] Minigame med `onComplete`: `onComplete.nextNodeId` finnes i `nodes`.
- [ ] Minigame med `winNodeId`/`lossNodeId` (battle, dice, crowd, signal, domino): begge finnes i `nodes`.
- [ ] `gasmask`: alle `option[].nextNodeId`, `noMaskNextNodeId` og `timeoutNextNodeId` finnes i `nodes`.
- [ ] Alle minigame-noder har `"choices": []` (tom liste).
- [ ] Alle minigame-noder bruker `"minigame": { "type": "...", "config": { ... } }` wrapper-struktur.
- [ ] `gameOverConditions` (hvis definert): alle `nodeId`-verdier finnes i `nodes` og er end-noder med `"endType": "defeat"`.
- [ ] `perspectives` (hvis definert): nøklene matcher nøyaktig alle unike `speaker`-verdier brukt i scenariet.
- [ ] `condition.all`-betingelser i hub-fremgang er synkronisert med `visitedFlag`-verdier i kartet.
- [ ] Alle `isHistoricalChoice: true` valg har tilhørende `historicalConsequence`-tekst.
- [ ] End-noder med `showEndComparison: true` har minst 3 valg med `isHistoricalChoice: true` i scenariet.
- [ ] `battle`-moves: alle `move.counters`-verdier refererer til `type`-verdier som finnes i samme moves-array.
- [ ] `propaganda`-noder: minst én option per item har `credibilityChange` > 0 (ellers er det ingen meningsfull avgjørelse).
- [ ] `domino`-noder: sum av alle `action.cost` er større enn `budget` (ellers kan spilleren gjøre alt).
- [ ] `speech`-noder: alle `setsFlag`-verdier i `outcomes` brukes i minst ett `hasFlag`-sted i scenariet.

---

## 5. Registrer i Manifest

Åpne `public/content/manifest.json` og legg til scenariet under riktig topic sin `tools`-array:

```json
{
  "id": "[scenario-id]",
  "title": "[Tittel]",
  "description": "[summary-teksten fra JSON]",
  "link": "/oving/tidsreise/[scenario-id]",
  "icon": "clock"
}
```

**Viktig:** Legg til under `tools`, IKKE `lessons`.

---

## 5b. Oppdater TimeTravelPage.tsx

Åpne `src/pages/TimeTravelPage.tsx` og legg til scenariet i `scenarios`-arrayen:

```typescript
{
    id: '[scenario-id]',
    title: '[Kortversjon av tittel]',
    era: '[År/periode]',
    difficulty: 'Lett|Middels|Vanskelig',
    description: '[1 setning fra summary]',
    icon: Shield,   // Shield|Crown|Sword - velg passende
    color: 'bg-[farge]-[nyanse]',   // Historisk passende farge
    disabled: false
}
```

**Viktig:** Legg også til scenario-tittelen i lookup-objektet i graveyard-seksjonen (ca. linje 117):

```tsx
{ 'roman-soldier': 'Romersk Legionær', 'medieval-baron': 'Baron av Rhinen', '[scenario-id]': '[Tittel]' }[log.scenarioId] ?? log.scenarioId
```

---

## 6. Generer Asset-liste

List opp alle `backgroundImage`-verdier fra JSON-en og gi brukeren klare AI-bildeprompts for hver:

```
Fil: /images/chronos/[filnavn].webp
Prompt: A highly realistic 4K cinematic photograph of [scene], [historical period]. [Lighting]. [Camera angle]. 16:9 ratio, WebP.
```

Bruk stil-reglene fra `docs/image-style-guide.md`.

---

## 7. Ferdig

*   Informer bruker: "Scenario `[scenario-id]` er bygget og registrert."
*   Kjør: `npm run scan:content` (oppdaterer content-index)
*   Gi bruker URL: `/oving/tidsreise/[scenario-id]`
