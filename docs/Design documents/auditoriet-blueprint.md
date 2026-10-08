# Auditoriet - blueprint

Et 3D-rom eleven går inn i. Der foreleses det hele døgnet om temaene i boka. En foreleser
snakker, gestikulerer og viser lysbilder på et stort lerret. Alt bygges av artiklene vi
allerede har, og det skal ikke koste noe å drive.

Status 2026-10-08 (kveld): fase 1-3 er bygget, med nettleserstemmen som midlertidig stemme.

- **Universitetet** (`/oving/auditoriet`): en gang med én dør per fag, levende dørskilt og
  programtavle. Salene (`/oving/auditoriet/<fag>`) sender hele døgnet etter klokka
  (`kringkasting.ts`, `useDirekte.ts`), med friminutt og spørsmål etter forelesningen.
- **Automanus (lag 1)** for alle artikler lages av `scripts/generate-forelesninger.mts` i
  `scan:content` til `public/data/forelesninger/` (gitignored, bygges i CI). Skrevne manus
  (lag 2) i `public/content/forelesninger/` overstyrer når `sourceHash` stemmer.
- **Lesesalen** (`/oving/auditoriet/lesesal?forelesning=<sti>`): én forelesning fra start,
  med pause og hopp, til projektoren.
- **Studiebeviset** (`studiebevis.ts`): stempel per forelesning eleven har hørt minst 40 % av
  (XP første gang), grader fra fersk student til professor, innrammet på veggen i gangen.
  Notatblokk (N lagrer setningen som sies), program og salsbytte (P), teksting vanlig/stor/av
  (T), lyd (M) og hurtigtaster (H). Lyd og teksting huskes.
- **Rommene**: PÅ LUFTA-lamper, klokker som går riktig, vinduer med himmel etter klokka,
  søyler, bjelker og hengelamper, salens farge på navneskilt, stripe og løper. Publikum
  reiser seg og prater i friminuttet.
- Gjenstår: stemmen (§3), lag 2-manus i den daglige rutinen, ekte elever i salen.
---

## 1. De to kravene, og hva de betyr

1. **Ingen manuell innlegging.** Hver artikkel blir automatisk til et forelesningsmanus,
   lysbilder og lyd. Når artikkelen endres, lages forelesningen på nytt.
2. **Ingen løpende kostnader.** Ingen betalt TTS per elev, ingen AI-kall fra nettleseren,
   ingen server. Alt dyrt skjer én gang, på byggetid, med verktøy vi allerede har.

Konsekvensen: forelesningene er *ferdig produserte sendinger*, ikke noe som genereres
mens eleven ser på. Det er også det som gjør 24/7 billig: å spille av en fil er gratis.

---

## 2. Motorvalg: hva vi har, hva vi stjeler, hva vi bygger

| Det vi har | Passer? | Hva vi tar med |
|---|---|---|
| `src/games/engine/` (Three.js + Rapier, 3600 linjer `GameEngine`) | Nei som motor. For tung: Rapier-WASM, quest/dialog/inventar vi ikke trenger, lang lastetid på Chromebook. | **Ideen bak `CrowdSystem`** (instansierte mennesker, idle i vertex-shader, én draw call) for publikum i salen. **`CharacterBuilder`** sitt canvas-ansikt med `EMOTION_PARAMS` som utgangspunkt for foreleserens ansikt. `FurnitureKit` (stoler, bord) som modell for benkerader. |
| Mikrospill-kitet `src/components/microgames/kit/` (R3F) | **Ja, som fundament.** Lett, allerede Chromebook-tunet. | `PovCamera`/`Mover` (gå inn i salen), `quality.ts` (tre kvalitetsnivåer + `guessTier`), `pixelBudget`, `crispText` (skarp tekst på lerretet), `useAmbience` (romklang/sorl). |
| RPG-hallen `src/features/rpg/net/hubRom.ts` | Ja, senere. | Presence-mønsteret (RTDB, `onDisconnect`, maks 16 per rom) hvis vi vil se andre elever i salen. |
| `src/utils/presentationUtils.ts` (`mapContentToPresentation`) | **Ja.** | Gjør allerede artikkel-JSON om til lysbilder. Lerretet i salen blir en ny visning av samme data. |
| `useTextToSpeech` | Ja, som reserve. | Stemmevalget for norsk (Google/Natural, aldri eSpeak) når en forelesning mangler ferdig lyd. |
| `generate-tidsreise-audio.js` / `generate-bibliotek-audio.ts` | Mønsteret, ikke leverandøren. | Idempotent generering per fil. ElevenLabs koster per nye artikkel, så den bryter krav 2. |

**Utenfra stjeler vi ideer, ikke biblioteker:**

- [TalkingHead](https://github.com/met4citizen/TalkingHead) (met4citizen, MIT): tekst →
  visemer med tidsstempler, «beat gestures» på trykksterke ord, humør (mood), blunking og
  blikk. Selve biblioteket er bygget for Ready Player Me-avatarer, og Ready Player Me
  [ble stengt 31. januar 2026](https://genies.com/blog/ready-player-me-discontinued-alternatives).
  Vi kopierer arkitekturen (lipsync-modul per språk, gestbibliotek, «speak audio with word
  timings»), ikke koden.
- Radio/TV-modellen for 24/7: en programplan som regnes ut fra klokka, ikke en server som
  sender.

**Konklusjon: bygg bespoke på R3F + mikrospill-kitet**, i `src/features/auditoriet/`.
Rommet er lite og enkelt; det vanskelige er stemme, foreleser og innhold, og der hjelper
ingen av de eksisterende motorene uansett.

**Foreleseren** blir en stilisert toon-figur bygget av primitiver med et lite skjelett
(hode, nakke, overkropp, skuldre, albuer, hender) og et canvas-ansikt. Grunner: matcher
husstilen, ingen avhengighet til en avatartjeneste, og en tegnet figur slipper «uncanny
valley» når leppesynken ikke er perfekt. En CC0-modell (MakeHuman/MPFB med visemer) kan
prøves senere hvis toon-figuren ikke holder.

---

## 3. Stemmen: nettleserens innebygde stemme

**Testet 2026-10-08 (`/oving/auditoriet/stemmetest`): eierens dom var «crap stemme».
Tempo 1,10 passet bra.** Den innebygde stemmen holder ikke som hovedstemme. Den blir
reserven, og hovedsporet går tilbake til ferdig generert lyd (se nederst i dette
avsnittet). Tempo 1,10 er utgangspunktet for alle stemmer.

Opprinnelig plan: vi starter med Web Speech (`speechSynthesis`). Ingen lydfiler,
ingen lagring, ingen generering. Antall artikler kan vokse så fort det vil.

**Hva det koster oss:**

- **Stemmen varierer per maskin.** Det er maskinens egen norske stemme som leser.
  `pickBestNorwegianVoice` i `useTextToSpeech` velger allerede den beste (Natural/Google,
  aldri eSpeak). Finnes ingen norsk stemme, går salen i **tekstmodus**: foreleseren
  gestikulerer, tekstingen ruller i lesetempo, og en lapp sier at lyd ikke er tilgjengelig.
- **Vi vet ikke på forhånd hvor lang en setning blir.** Derfor synkes det per segment,
  ikke per sekund (se 5).
- **Leppesynken blir enklere.** Vi får ikke tak i selve lyden. Munnen drives av
  `onboundary` (ordgrenser) når stemmen sender dem, ellers av visemer gjettet fra teksten
  i anslått taletempo. På en tegnet toon-figur er det godt nok.
- **Lyd krever et klikk.** Nettleseren tillater ikke tale før eleven har gjort noe.
  Å sette seg (E / klikk) er det klikket.
- Hvert segment er en egen ytring på 1-3 setninger. Da slipper vi Chromes kjente
  stopp etter ~15 sekunder.

**Første ting å sjekke (fase 0):** hvilke norske stemmer som faktisk finnes på en
skole-Chromebook, og hvordan de låter i 60 sekunder forelesning. Det avgjør om
tekstmodus er unntaket eller regelen.

**Senere, hvis stemmen ikke holder:** ferdig generert lyd (Piper eller
[NB AI-labs norske stemmer](https://huggingface.co/NbAiLab/nb-tts-norwegian-voices),
lagret i [Cloudflare R2](https://agentdeals.dev/vendor/cloudflare-r2)) kan kobles på
uten å endre manusformatet. Det er en oppgradering, ikke en ombygging.

---

## 4. Innholdsrørledningen (krav 1)

```
artikkel.json ──► automanus (byggetid, ingen AI) ──┐
             └──► forelesningsmanus.json (Claude) ─┴─► salen spiller det beste som finnes
```

### 4.1 To lag: automanus alltid, håndskrevet manus når det finnes

Ja, et godt manus må skrives for hver nye artikkel. Men salen skal aldri vente på det.

**Lag 1 - automanus (ingen AI, alltid oppdatert).** Et skript i `scan:content` lager et
enkelt manus av hver artikkel: tekstblokkene deles i segmenter, hver `header` gir et
tittel-lysbilde, bilder og sitater gir bilde-lysbilder, gester velges etter enkle regler
(nytt lysbilde → `peke-lerret`, spørsmål → `aapne-hender`, tall → `telle-fingre`). Det er
en opplesning med lysbilder, ikke en god forelesning, men den finnes for alle 674
leksjoner fra første dag og for hver ny artikkel samme natt som den publiseres.

**Lag 2 - forelesningsmanus (Claude).** Artikkelen skrives om til muntlig fortelling:
kortere setninger, gjentakelser, «tenk deg at du står på stranda i 793», spørsmål til
salen. Samme språkregler som artiklene. Finnes det, overstyrer det automanuset.

Hvor lag 2 skrives:

- **Nye artikler:** som et ekstra steg i den daglige innholdsrutinen. Den har artikkelen
  ferdig i hodet allerede, så manuset er noen minutter ekstra i samme kjøring, ikke en ny
  rutine.
- **De 674 eksisterende:** en etterfyllingsrutine fag for fag, som oppgave-utrullingen.
  Ingen hast, siden automanuset dekker i mellomtiden.
- **Endrede artikler:** `sourceHash` i manuset. Endres artikkelen, faller den tilbake til
  automanus til lag 2 er skrevet på nytt. Utdaterte manus vises aldri.

Begge deler går på Claude-abonnementet vi allerede har.

### 4.2 Skjema (utkast)

`public/content/forelesninger/<fag>/<emne>/<leksjon>.json`

```json
{
  "id": "rikssamlingen",
  "kilde": "/historie/vikingtiden/rikssamlingen",
  "sourceHash": "sha1-av-artikkelens-content",
  "foreleser": "historikeren",
  "segmenter": [
    {
      "si": "Tenk deg Norge rundt år 870. Det finnes ikke ett land, men mange små riker.",
      "lysbilde": { "type": "bilde", "src": "/images/vikingtiden/rikssamlingen-hero.webp" },
      "gest": "aapne-hender",
      "humor": "nysgjerrig"
    },
    {
      "si": "En av høvdingene het Harald.",
      "lysbilde": { "type": "tittel", "tekst": "Harald Hårfagre" },
      "gest": "peke-lerret"
    }
  ],
  "sporsmal": "hentes fra artikkelens Quiz-komponent"
}
```

- Lysbilder bygges **kun av det artikkelen allerede har**: hero- og inline-bilder,
  sitater, `details`, faktabokser, tidslinje-events, kart. Ingen nye bilder trengs.
  Bilder som ikke finnes ennå hoppes over via `isPendingImage`.
- `gest` og `humor` er fra en fast liste (se 6.2). Validatoren avviser alt annet.
- Varighet per segment anslås fra antall ord (ca. 150 ord i minuttet ved tempo 1).

### 4.3 Vakter

- `scripts/validate-forelesninger.mjs`: skjema, gester i ordlista, lysbildekilder finnes,
  språkregler (å/ø/æ, ingen tankestrek, setningslengde), varighet 5-12 min.
- `scripts/generate-automanus.mjs` (i `scan:content`): lag 1 for alle artikler, pluss en
  indeks som sier hvilke som har lag 2 og om det er utdatert.
- Workflow `.agent/workflows/build_forelesning.md` med eksakt skjema, slik at cronen ikke
  gjetter prop-navn (jf. tidligere prop-drift).

---

## 5. 24/7 uten server: kringkastingsplanen

Hver sal har en spilleliste. Posisjonen regnes ut fra klokka:

```
plass = (Date.now() - EPOKE) mod totalVarighet(spilleliste)
```

- Planen bruker **anslått** varighet per segment. Klokka sier hvilket segment som går nå;
  nettleseren starter det. Er maskinens stemme raskere enn anslaget, venter foreleseren
  et øyeblikk (drikker vann, blar i notatene) før neste segment. Er den tregere, kuttes
  pausen. Slik holder alle i salen seg innenfor samme segment, selv om stemmene er ulike.
- Alle i samme sal er på samme sted i forelesningen. Det føles *direkte*, helt uten server.
- Spillelisten stokkes med et frø per uke, så rekkefølgen varierer.
- Én sal per fag (Historiesalen, Norsksalen, KRLE-salen, Samfunnssalen, Musikksalen),
  eller én stor gang med dører. Over hver dør: «Nå: Rikssamlingen (12 min igjen) - Neste:
  Svartedauden».
- Kommer du midt i, kommer du midt i. To veier ut:
  - **Lesesalen**: start samme forelesning fra begynnelsen, alene.
  - **Lærerlenke**: `/auditoriet?forelesning=rikssamlingen` for projektoren i klasserommet.

---

## 6. Rommet og foreleseren

### 6.1 Salen

- Lyst, varmt auditorium (aldri mørkt tema): trebenker i stigende rader, stort lerret,
  kateter, vinduer med dagslys. Stilisert toon, samme familie som mikrospillene.
- Eleven går inn i førsteperson (WASD, mus for å se), velger en plass og trykker E for å
  sette seg. Kameraet låses mot lerret og foreleser; grensesnittet toner ut.
- Publikum: instanserte elever med idle-bevegelse (CrowdSystem-ideen). Noen rekker opp
  hånda, noen skriver, en gjesper.
- **Teksting er alltid på** og står der blikket er, under lerretet. Klasserom er bråkete,
  og mange Chromebooks har ikke hodetelefoner.
- Knapp «Se lysbildet» legger lysbildet over hele skjermen i 2D, skarpt for projektor.
- Ytelsesbudsjett: 1366×768 Chromebook, `guessTier` styrer skygger og antall publikum.

### 6.2 Foreleseren

- **Leppesynk**: visemer fra norsk tekst (regelbasert, norsk skrift er ganske lydrett) +
  ordtider fra lydsteget + lydstyrkekurven for hvor mye munnen åpnes.
- **Gester** (ca. 12): `peke-lerret`, `aapne-hender`, `telle-fingre`, `hand-pa-bryst`,
  `lene-frem`, `ga-til-lerret`, `ga-tilbake`, `riste-hode`, `nikke`, `armer-i-kors`,
  `vise-storrelse`, `vinke-salen`. Prosedyrale nøkkelrammer, blandes inn og ut fra idle.
- **Automatikk mellom cuene** (TalkingHead-ideen): små «beat gestures» på trykksterke ord,
  blunking, blikk som vandrer over salen og av og til treffer deg.
- **Humør** styrer canvas-ansiktet (gjenbruk av `EMOTION_PARAMS`-ideen).
- Én foreleser per fag, med hver sin stemme der modellen har flere.

### 6.3 Etter forelesningen

- Tre spørsmål fra artikkelens Quiz vises på lerretet. Riktig svar gir XP via
  `recordActivity()`.
- Lenke «Les artikkelen» ved utgangen.
- Bevisst utelatt: AI-spørsmål til foreleseren (koster per elev, bryter krav 2).

---

## 7. Faser

Prinsipp: perfeksjoner én forelesning før vi skalerer.

| Fase | Innhold | Ferdig når |
|---|---|---|
| **0. Stemmesjekken** | En enkel testside som lister norske stemmer og leser 60 sekunder forelesning. Åpnes på en skole-Chromebook. | Vi vet hvilken stemme elevene får, og om den holder. |
| **1. Referanseforelesningen** | Rikssamlingen, ende til ende: håndskrevet manus, gråboks-sal, foreleser med enkel leppesynk og 4 gester, lerret, teksting. Kun på bestilling, ingen plan. | Du har sittet i salen på en Chromebook og vil se mer. |
| **2. Rørledningen** | Automanus for alle artikler + manus-workflow + validator + `sourceHash`. Manus-steg i den daglige innholdsrutinen. | Hver ny artikkel får forelesning samme natt uten håndarbeid. |
| **3. Kringkasting** | Saler per fag, klokkebasert plan, dørskilt, lesesal, lærerlenke. | Du går inn og en forelesning er alltid i gang. |
| **4. Liv i salen** | Publikum, alle 12 gester, sluttspørsmål + XP, eventuelt ekte elever via presence. | Salen føles befolket. |
| **5. Etterfylling** | Rutine som skriver lag 2-manus for eksisterende artikler fag for fag. | Alle 674 leksjoner har ekte forelesningsmanus. |

---

## 8. Risiko

| Risiko | Tiltak |
|---|---|
| Stemmen er ikke god nok, eller mangler | Fase 0 før alt annet. Tekstmodus som reserve. Ferdig generert lyd kan kobles på senere uten nytt manusformat. |
| Stemmene går i ulikt tempo | Synk per segment med pauser som buffer (se 5). |
| Chromebook klarer ikke 3D + tale | Talen er maskinens egen. Kvalitetsnivåer, maks 1 skyggekaster, instansert publikum. |
| Cron skriver dårlige manus | Fast skjema i workflow, validator, eieren godkjenner referansen før utrulling. |
| Manusene henger etter de daglige artiklene | Automanus dekker alltid; lag 2 er en forbedring, ikke et krav. |
| Kjedelig å se på i 8 min | Lysbilde-skift minst hvert 30. sekund, foreleseren går mellom kateter og lerret, spørsmål til salen. |

---

## 9. Åpne spørsmål til eieren

1. Én stor sal med dører, eller én sal per fag?
2. Skal ekte elever kunne se hverandre i salen (fase 4), eller holder publikum av statister?
