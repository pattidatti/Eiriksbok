# Blueprint: Stjernehimmelen (`/himmel`)

> Et levende kunnskapskart. Hvert fagbegrep eleven har møtt er en stjerne.
> Emner danner stjernebilder. Stjernene tennes av læring - og slukner sakte
> når glemselskurven sier at kunnskapen er i ferd med å forsvinne.
> Eleven tenner dem igjen med korte recall-oppgaver.

---

## 1. Sjelen

Spaced repetition er den best dokumenterte læringseffekten som finnes, men
ingen 14-åring åpner en repetisjonskø frivillig. Stjernehimmelen forkler
repetisjon som noe eleven eier: sin egen nattehimmel. Når Vikingtiden begynner
å blafre, er det ikke en varsling fra en app - det er *din* himmel som holder
på å slukne. Loss aversion gjør jobben motivasjonen ikke gjør.

Pedagogisk kjerne:
- **Synliggjort glemsel**: eleven ser hva som er i ferd med å gli ut, før det er borte.
- **Mikro-recall**: å tenne en stjerne tar 20 sekunder. Terskelen er nesten null.
- **Oversikt**: himmelen viser hele fagfeltet - også det eleven ennå ikke har møtt
  (utente stjerner). Kunnskap får geografi.

## 2. Bygger på det som finnes (viktigst i hele dokumentet)

Eiriksbok har allerede en komplett repetisjonsmotor. Stjernehimmelen er et
**visualiserings- og motivasjonslag** oppå den - ikke et parallelt system.

| Behov | Finnes allerede | Fil |
|---|---|---|
| Stjerneuniverset | 385 fagbegreper med `subject`/`topic` | `public/data/concepts.json` via `useConcepts()` |
| Decay-motor | Leitner-bokser 1-5, intervaller 1/2/4/7/15 dager | `src/utils/reviewScheduler.ts` |
| Elevens tilstand | `ReviewItem { box, dueDate, reps, lapses, lastReviewedAt }` | `src/stores/useReviewStore.ts` (`review-store-v1`) |
| Tenningssignaler | Quiz-svar, flashcard-flips, læringssti-begreper fanges alt | `src/utils/reviewCapture.ts` |
| Deterministisk tilfeldighet | `djb2Hash`, `mulberry32`, `shuffleWith` | `src/utils/reviewScheduler.ts` |

Konsekvens: **ingen ny lagring, ingen ny capture-logikk i MVP.** Himmelen leser
`useReviewStore.items` + `useConcepts()`, og recall-svar går tilbake gjennom
`addItem`/`gradeItem` - nøyaktig samme vei som «Dagens økt». De to featurene
deler dermed hjerne: øver du i Dagens økt, lysner himmelen; tenner du stjerner
på himmelen, krymper morgendagens kø.

## 3. Datamodell

### 3.1 Stjerne

En stjerne = ett begrep (`ConceptItem` med `id`, `term`, `definition`,
`subjectId?`, `topicId?`). Kobles til review-item via id
`concept:<slugifyTerm(term)>`.

```ts
type StarStatus = 'unlit' | 'lit' | 'flickering' | 'fading';

interface Star {
    conceptId: string;
    reviewId: string;        // 'concept:<slug>'
    term: string;
    definition: string;
    subjectId: string;
    topicId: string;         // 'annet' når begrepet mangler topic
    x: number;               // verdenskoordinat 0..W
    y: number;               // verdenskoordinat 0..H
    size: number;            // 1..3, seeded - visuell variasjon
    status: StarStatus;
    brightness: number;      // 0..1
    dueInDays: number | null;
}
```

### 3.2 Lysstyrkemodell (Leitner → kontinuerlig glød)

Leitner er diskret (boks + forfallsdato); himmelen trenger en kontinuerlig
verdi. Modellen er en ren funksjon av `(item, today)`:

```
uten item (aldri øvd):        status 'unlit',      brightness 0.12
item, ikke forfalt:           status 'lit'
    styrke   = 0.45 + 0.11 * box          (boks 1 ≈ 0.56 … boks 5 = 1.0)
    brightness = styrke
forfalt (dueDate <= i dag):
    overdue  = dager forbi dueDate
    interval = BOX_INTERVALS[box]
    decay    = clamp(1 - overdue / (2 * interval), 0.25, 1)
    brightness = styrke * decay
    status   = overdue <= interval ? 'flickering' : 'fading'
```

- **Blafring** (`flickering`): stjernen pulserer synlig - «redd meg»-signalet.
- **Døende** (`fading`): svak, kald glød. Fortsatt klikkbar, aldri helt borte -
  himmelen skal mane til handling, ikke straffe.
- Modellen bor i `src/utils/skyModel.ts` som ren logikk (ingen React, ingen
  store-imports) - samme stil som `reviewScheduler.ts`, testbar og
  gjenbrukbar for en fremtidig klassehimmel.

### 3.3 Himmelens geografi (deterministisk layout)

Samme himmel hver gang - posisjoner er seeded, aldri tilfeldige per render.

1. **Fag → region**: fagene plasseres som faste regioner i et virtuelt
   verdensrom (2000×1125). Regionsentre legges på en gullvinkel-spiral rundt
   midten, radius ∝ √(antall stjerner). Historie (84 % av begrepene) blir
   naturlig den dominerende delen av himmelen.
2. **Emne → stjernebilde**: emnene i et fag legges på en indre gullvinkel-
   spiral rundt regionsenteret. Begreper uten `topic` samles i stjernebildet
   «annet» per fag; begreper uten `subject` holdes utenfor MVP (dokumentert
   under §7).
3. **Begrep → stjerne**: posisjon i en disk rundt stjernebilde-senteret,
   jitter seeded med `mulberry32(djb2Hash(conceptId))`.
4. **Konstellasjonslinjer**: stjernene i et emne bindes med en
   nærmeste-nabo-kjede (grådig, deterministisk). Linjene er synlige bare når
   minst én stjerne i emnet er tent - stjernebilder «trer frem» etter hvert
   som eleven lærer.

## 4. Interaksjon

### 4.1 Tenn en stjerne (kjernesløyfen, ~20 sekunder)

1. Klikk på en stjerne → recall-kort (modal, lys glassmorphism):
   - **Tent/blafrende/døende stjerne**: «Hva betyr *{term}*?» → eleven tenker →
     «Vis svar» → definisjonen → selvgradering «Det kunne jeg / Måtte kikke».
     Svaret går rett i `gradeItem(reviewId, correct, today)` - riktig svar
     løfter boksen (mer lys, lengre intervall), feil svar resetter til boks 1.
   - **Utent stjerne**: definisjonen vises som «ny stjerne oppdaget» →
     «Legg til på himmelen min» → `addItem(...)` → stjernen tennes i boks 1.
2. Tenningsanimasjon: stjernen blusser opp (skala + glød), konstellasjonslinjene
   til naboene lysner. Riktig svar skal *føles* som å tenne noe.

### 4.2 Navigasjon

- Hele himmelen vises i utgangspunktet (fit-to-viewport, 1366×768 baseline).
- Dra for å panorere, scrollhjul/pinch for zoom (begrenset zoomområde).
- Hover (desktop): tooltip med term + status («Blafrer - 3 dager på overtid»).
- HUD nederst: fagfilter-chips + telleren «X stjerner blafrer» som
  snarvei - klikk hopper til neste blafrende stjerne.

### 4.3 Kobling til Dagens økt

HUD-en viser «Dagens økt»-knapp når `dueCount > 0` - himmelen er
*diagnosen*, Dagens økt er *kuren* for de som vil ta alt i én økt.

## 5. Visuell stil

- **Himmelflaten er mørk** (dyp blå-fiolett gradient) - et bevisst og
  innholdsbegrunnet unntak fra lyst-tema-regelen: en stjernehimmel *er* natt,
  og glød-mot-mørke er selve den pedagogiske metaforen. Alt UI-chrome
  (HUD, recall-modal, tooltips) beholder lys glassmorphism-stil, slik at
  siden fortsatt hører hjemme i Eiriksbok.
- Canvas 2D for stjernene (400+ stjerner med twinkle på Chromebook = én
  rAF-løkke, ingen DOM-noder per stjerne). Framer Motion kun for HUD/modal.
- Stor typografi i HUD og modal - siden skal fungere på projektor
  (klassevisning: «se, hele klassen mister Demografien»).
- `prefers-reduced-motion`: blafring erstattes av statisk dimmet glød.

## 6. Filplan (MVP)

```
Nye filer:
  src/types/sky.ts                       Star, Constellation, SkyRegion, SkyWorld
  src/utils/skyModel.ts                  Ren logikk: lysstyrke + layout (seeded)
  src/pages/SkyPage.tsx                  Orkestrering: data inn, canvas + HUD + modal
  src/components/sky/SkyCanvas.tsx       Canvas-render, rAF, pan/zoom, hit-testing
  src/components/sky/SkyHud.tsx          Fagfilter, blafre-teller, Dagens økt-lenke
  src/components/sky/StarRecallModal.tsx Recall-kort med selvgradering + tenning

Endrede filer:
  src/routes.ts                          SkyPage-factory
  src/App.tsx                            Rute /himmel
  src/context/LayoutContext.tsx          '/himmel' i FULL_WIDTH_PATHS
  src/pages/PracticePage.tsx             Inngangskort «Stjernehimmelen»

Avhengigheter:
  types/sky.ts → utils/skyModel.ts → SkyCanvas/SkyHud/StarRecallModal → SkyPage → App
```

Ingen nye npm-avhengigheter.

## 7. Avgrensning: hva MVP bevisst utelater

| Utelatt | Hvorfor | Plan |
|---|---|---|
| Begreper uten `subject` (~155 stk) | Ingen naturlig plass på himmelen | v2: «tåkebeltet» i utkanten, eller datavask som gir dem subject |
| Quiz- og tidslinje-items fra review-køen | Har ingen concept-stjerne å mappe til | v2: kometer/stjerneskudd for quiz-items, tidslinje-events som planeter |
| Tverrfaglige linjer (delte tags) | Tag-systemene er kun konvensjonsbasert overlappende i dag | v2 når tags er kuratert |
| Klassehimmel på projektor (aggregert) | Krever Firebase-aggregering | v2 - skyModel er ren logikk nettopp for dette |
| MCQ-recall med distraktorer | Selvgradering er enklere og matcher ExerciseFlashcard-mønsteret | v2: gjenbruk buildSession-maskineriet |

## 8. Suksesskriterier

- Eleven forstår metaforen uten forklaring: mørk stjerne = glemt, blafring = haster.
- Recall-sløyfen (klikk → svar → tenning) tar under 30 sekunder og føles deilig.
- Full himmel rendrer flytende på Chromebook 1366×768.
- Ingen ny localStorage-nøkkel: alt går gjennom `review-store-v1`.

## 9. v1.1 - juicy-passet (implementert)

- **Atmosfære**: 260 seedede støvstjerner i bakgrunnen + stjerneskudd hvert 9.-22. sekund (hopper over ved `prefers-reduced-motion`).
- **Kjede**: recall-kortet fikk en feedback-fase («Stjernen lyser klarere!» + neste intervall) med «Redd neste stjerne» / «Oppdag en ny stjerne» - ett klikk blir naturlig til en økt.
- **Feiring**: når siste stjerne i et stjernebilde (≥3 stjerner) tennes: gylne konstellasjonslinjer, ekspanderende ring, lysende tittel og konfetti.
- **Lyd**: gjenbruker den app-globale `useStepSounds`-singletonen (select/advance/correct/incorrect/complete) med mute-knapp i HUD-en (delt mute-nøkkel med læringsstiene).
- **Alltid en handling**: når ingenting blafrer viser HUD-en «Oppdag en ny stjerne» (eller «Tenn din første stjerne» for ferske elever); oppdageren foretrekker stjernebilder som allerede har liv i seg.
- **Emnelenke**: recall-kortet lenker til emnesiden («Utforsk {emne}») - kun når emnet er verifisert mot manifestet, aldri døde lenker.
- **Onboarding**: engangs intro-overlay som lærer metaforen (localStorage-flagget `himmel-intro-v1`).
