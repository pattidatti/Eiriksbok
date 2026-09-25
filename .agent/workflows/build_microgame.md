---
description: Lag et skamgøy, pent og lærerikt mikrospill (3D foretrukket, 2D når det gir det beste spillet) som bor inline i en artikkel. Designbrief først, så bygg på arkadeskallet, så selvspill-portene. Brukes av nattsporet eiriksbok-daily-microgame og manuelt.
---

# Skill: Build Micro-Game

Et mikrospill er et **ekte, lite dataspill** som bor midt i en artikkel. Eleven skal ville spille
én runde til, ha lyst til å vise det til sidemannen, og forstå fagstoffet bedre etterpå. Tre krav,
like viktige:

1. **Skamgøy.** Etter 30 sekunder skal det kjennes som et spill, ikke som en oppgave.
2. **Ser bra ut.** Et eget visuelt uttrykk som tåler å stå ved siden av et indiespill.
3. **Lærerikt.** Spillets regler ER fagstoffet. Den som vinner, har forstått mekanismen.

**Målestokken er MÅKA** (et arkadespill om en måke på Bryggen, laget på en tre-setnings prompt).
Den er en KVALITETSmålestokk, ikke en formmal: det betyr ikke sidescroller, måke eller humor. Det
betyr: spillbart på fem sekunder, ett grep som føles deilig, eskalerende press, rekord og ranger
som lokker til en runde til, og en verden med personlighet.

**Referansespillene** (les dem før du bygger):

| Spill | Fil | Hva det viser |
|---|---|---|
| Havet kommer (Doggerland) | `HavetKommer.tsx` | 2D-canvas: arkadeskall, eskalering, død med tips, funn som samles på tvers av runder, seier som følger plottet |
| Regnet i Lærdal (stavkirker) | `Stavkirken3D.tsx` + `stavkirken/` | 3D: kjerneverb i selve 3D-verdenen (male tjære på flatene), tidsforløp (årstider, døgn, bygda vokser), bloom og egen belysning, valg i startmenyen som ER fagstoffet (sviller vs. stolper) |

Begge har selvspill-roboter (`usePlaytest`) - se dem når du skriver dine egne.

**3D eller 2D?** 3D foretrekkes. 2D er tillatt når det gir det gøyeste, mest interaktive eller mest
passende spillet (en sidescroller om havstigning er bedre i 2D). Skriv begrunnelsen i briefen.

**Mikrospill eller full motor?** Dette sporet er lett (React + R3F eller canvas, lazy-lastet,
Chromebook-trygt, 2-4 minutter per runde). Den tunge motoren i `src/games/engine/` (Rapier, pointer
lock, 10-20 min) har egen guide (`BUILD_GAME_GUIDE.md`) og embeddes aldri i en artikkel.

---

## Steg 1 - Tone: tåler emnet et spill?

Avgjør tonen FØR du tenker mekanikk. Skriv den i registry-oppføringen (`tone`).

| Tone | Når | Hva det betyr |
|---|---|---|
| `lett` | Hverdagsliv, håndverk, teknikk, natur, handel, oppdagelser, de fleste tidlige perioder | Humor, overdrivelse og slapstick er lov (MÅKA-stemning) |
| `alvorlig` | Krig, sykdom, undertrykkelse, katastrofer der mennesker døde, men der det å spille en rolle gir innsikt (en konvoi, en evakuering, et oppgjør) | Ingen vitser, ingen morsomme dødsmeldinger, ingen poengregn over lik. Spenning og ansvar i stedet. Tap formuleres saklig og historisk |
| **ingen spill** | Folkemord og massedrap rettet mot en gruppe (Holocaust, Rwanda, Srebrenica), terror mot sivile (22. juli), overgrep mot barn, slaveri som «ressursspill» | Lag IKKE et spill. Stopp og rapporter «tema uegnet for spill». Et arkadespill om dette er respektløst uansett hvor pent det er |

Tvil? Velg strengere. `alvorlig` er aldri feil for et tema som tåler `lett`; det motsatte kan være
en skandale.

---

## Steg 2 - Designbriefen (skriv den FØR du koder)

Briefen er et kort dokument (lim den inn i PR-body-en). Den tvinger fram de valgene som skiller et
spill fra en quiz med 3D-pynt. Svar på alt:

1. **Fantasien.** Hvem er eleven i spillet, og hva vil de? («Du er leder for et jegerfølge. Du vil
   holde folket mett mens landet forsvinner.»)
2. **Kjerneverbet.** Det ene grepet eleven gjør hundre ganger per runde. Det skal føles godt i seg
   selv (male, kaste, styre, bygge, sikte, dirigere). «Klikke på riktig svar» er ikke et verb.
3. **Fagkjernen.** Hvilken mekanisme fra artikkelen er spillets REGEL? Skriv den som «hvis du ... så
   ...». (Stavkirken: «står stolpene i jorda, råtner de uansett hvor mye du maler».) Hvis regelen
   kunne byttes ut med en annen uten at spillet endret seg, er den pynt.
4. **Presset.** Hva eskalerer? (Havet stiger, været blir verre, fiendene blir flere, tiden går.)
5. **Tap.** Minst to måter å tape på, og hver dødsårsak gir et konkret tips som også er fagstoff.
6. **Seier.** Seieren følger plottet i artikkelen. Når eleven har gjort det historien sier var
   mulig, SKAL de vinne - uansett hvor mange poeng de har (Havet kommer: kommer du øst for
   Doggerbanken, vinner du, også vassende).
7. **En runde til.** Rekord, ranger med titler, funn/samleobjekter som bygger seg opp over runder,
   poengmultiplikator for dyktig spill.
8. **Sjanger** (fra katalogen under) og **2D/3D** med begrunnelse.
9. **Look.** Palett (4-6 farger), stemning, lys, font og hvordan HUD-en ser ut. Skal IKKE ligne
   de to siste spillene i biblioteket.
10. **Første fem sekunder.** Hva ser eleven, og hva gjør de uten å lese noe?

### Sjangerkatalogen

Ingen sjanger er forbudt. Velg den som gjør FAGKJERNEN til en regel. Blandinger er ofte best.

| Sjanger | Kjerneverb | Passer når emnet handler om ... | Eksempelidé |
|---|---|---|---|
| Plattform / sidescroller | løpe, hoppe, samle | en reise, en flukt, et landskap som endrer seg | Doggerland (Havet kommer) |
| Vedlikehold mot klokka | reparere, male, fylle på | noe som slites og må holdes i live | Stavkirker (Regnet i Lærdal) |
| Sanntidsstrategi (RTS) | velge enheter, sende dem, bygge | ressurser, logistikk, militær taktikk, byvekst | Hanseatene: send kogger og hold lagrene fulle |
| Tower defense | plassere forsvar, oppgradere | forsvar, festningsverk, epidemier | Konstantinopel: bygg murene lag på lag |
| Kjøring / styring | styre, gasse, bremse | transport, handel, oppdagelsesreiser | Jernbanen over fjellet i snøstorm |
| Seiling / navigasjon | krysse mot vinden, lese strømmer | havferder, vikinger, handel | Vesterled: kryss Nordsjøen med knarr |
| Skytespill / sikting | sikte, time, dosere ammunisjon | slag, jakt, forsvar (tonen avgjør) | Skjoldborg: stopp pilregnet |
| Stealth / flukt | gjemme seg, time bevegelse | flukt, motstand, smugling | Over Berlinmuren i lyskasterne |
| Puslespill / fysikk | legge, stable, balansere | ingeniørkunst, arkitektur, kjemi | Gotisk hvelv: få trykket ned i pilarene |
| Tycoon / økonomi | kjøpe, selge, investere | handel, industri, bank | Ford-fabrikken: samlebåndets tempo |
| Rytme / timing | trykke i takt | musikk, arbeidssanger, maskiner | Roerne i langskipet |
| Overlevelse / roguelite | prioritere knappe ressurser | nød, ekspedisjoner, kriser | Polarekspedisjonen |
| Gudespill / simulering | forme verden, se konsekvenser | klima, befolkning, religion, økosystem | Nilen flommer: grav kanaler før tørken |
| Detektiv / utforsk | finne, koble spor | kildekritikk, arkeologi | Grav fram et vikinggravfelt lag for lag |

**Variasjonsregel:** Sjangeren skal være ulik de tre siste nattspillene (`sjanger` i
`registry.ts`, se `git log -p --since=5.days -- src/components/microgames/registry.ts`), og looken
skal være ulik alle tre. Bruker du en sjanger som allerede finnes i biblioteket, skal vrien være ny.

---

## Steg 3 - Bygg på arkadeskallet

Alle nye spill bygges på arkadeskallet i `src/components/microgames/arcade/`. Skallet gir
spill-følelsen gratis, og HVERT spill kler det i sitt eget tema.

| Del | Fil | Hva den gir |
|---|---|---|
| `ArcadeStage` | `arcade/ArcadeShell.tsx` | Spillvinduet (høyde `clamp(420px, 70vh, 640px)`, fullskjerm-klar via `data-mg-stage`), tema-variabler, `below` for lesetekst under vinduet |
| `ArcadeScreen`, `ArcadeLogo`, `ArcadeTag`, `ArcadeBigButton`, `ArcadeSmallButton`, `ArcadeStats` | samme | Startskjerm, pause og slutt-skjerm med stor CTA |
| `useArcadeLoop` | `arcade/useArcade.tsx` | 2D-canvasløkke med callback-refs, pause utenfor skjermen, feilsikker frame |
| `useArcadeAnnouncer({ feed: true })` | samme | Meldingskø med lesetid. Med `feed` står lesetekst UNDER spillet, og bare korte titler blinker i bildet |
| `ArcadeTheme` | `arcade/tokens.ts` | Farger, font, vekt, radius, strek, skygge, tilt, HUD-stil, bannerposisjon |
| `createArcadeSynth`, `buzz` | `arcade/synth.ts` | Web Audio-lyd uten Tone/three, felles lydav |
| `useArcadeSave`, `rankFor`, `nextRank` | `arcade/save.ts` | Rekord, antall runder, funn, ranger |
| `usePlaytest`, `playtestSpeed` | `playtest.ts` | Selvspill-kontrakten (steg 4) |

**3D-spill** legger `MicroCanvas` (fra `./kit`) inne i `ArcadeStage` og bygger DOM-HUD-en oppå med
skallets komponenter:

- `MicroCanvas builtInLights={false}` og eget lysoppsett (sol, hemisfære, `Environment` med
  `Lightformer` - lokalt, aldri CDN-ressurser som drei `Cloud`).
- `KitEffects` (`./kit/KitEffects`, importeres direkte, ikke fra `./kit`) gir bloom og vignett som
  skrur seg av på svake maskiner. Bloom krever at det som skal gløde har `emissive`/`toneMapped={false}`.
- Kjerneverbet skjer I 3D-verdenen (pek, dra, mal på objektene), ikke i knapper under.
- Store spill deles i moduler i en egen mappe (`stavkirken/model.ts`, `game.ts`, `church.tsx`,
  `world.tsx`). Spillreglene bor i rene `.ts`-moduler uten React.

**2D-spill** tegner på canvas med `useArcadeLoop` (se `HavetKommer.tsx`). Ikke importer fra `./kit`
i et 2D-spill - det drar med seg three og Tone.

### Absolutte regler for spillvinduet

- **Eget tema.** Definer `const THEME: ArcadeTheme` i spillfila og send det til `ArcadeStage`. Aldri
  `DEFAULT_THEME`. «Alle spill med samme look blir lame» (eier, 2026-09-24).
- **Tekst dekker aldri spillet.** Bruk `useArcadeAnnouncer({ feed: true })` og `below={feed}`.
  Toasts over flammene gjorde at eleven ikke fikk slukket brannen. Selvspill-porten måler dette.
- **Lesetid.** Meldinger står etter `readingSeconds` og køes - aldri faste 1,5 sekunder.
- **Fullskjerm** kommer fra `MicroGameFrame` (knappen og `[data-mg-stage]`). Pakk alltid spillet i
  `<MicroGameFrame title=... bleed>`.
- **Mål i HUD-en.** Eleven ser hele tiden hva som er seier (år igjen, avstand, en målbar).
- **Pause** på Esc/P og når vinduet scroller ut av syne.

---

## Steg 4 - Selvspill-kontrakten (`usePlaytest`)

Hvert nytt spill registrerer et test-API, så en robot kan spille det headless. Det er slik nattsporet
beviser at spillet kan vinnes, kan tapes og belønner ferdighet - uten et menneske.

```tsx
import { usePlaytest, playtestSpeed, type PlaytestBot } from './playtest';

const SPEED = playtestSpeed(); // ?mgfart=4 i selvspill, alltid 1 for elevene
// i løkka: for (let k = 0; k < SPEED; k++) update(g, dt, io);   (useArcadeLoop gjør dette selv)

usePlaytest(GAME_ID, () => ({
    maksSekunder: RUN_SECONDS + 20,
    snapshot: () => ({
        fase: mode === 'menu' ? 'meny' : mode === 'over' ? (won ? 'vunnet' : 'tapt') : 'spiller',
        poeng, framdrift: /* 0-1 mot målet */, tid: /* spilte sekunder */,
    }),
    start: (variant) => begin(variant),        // hopp rett inn i en runde fra hvilken som helst fase
    bots: {
        seende:      { forventer: 'vinner', beskrivelse: '...', tick: () => { /* ett grep */ } },
        'ignorerer-x': { forventer: 'taper',  beskrivelse: '...', tick: () => { ... } },
    },
}));
```

Regler for robotene:

- **Samme grep som eleven.** Roboten flytter, kaster, maler og henter gjennom de samme funksjonene
  som input-håndteringen bruker - bare uten piksel-sikting. En robot som setter poeng direkte,
  beviser ingenting.
- **Minst én `vinner` og én `taper`.** Taperen skal ignorere FAGKJERNEN (Stavkirken: stolper i jorda;
  fersk furu; aldri hente tjære. Havet kommer: bare gå østover uten å spise). Da beviser porten at
  fagstoffet avgjør utfallet.
- **Passiv spiller testes alltid** (ingen input). Den skal tape.
- `snapshot` og `tick` leser refs, ikke state (de kalles utenfor React).
- Alt er `import.meta.env.DEV`-gatet i `usePlaytest`; elevene får aldri robotene.

---

## Steg 5 - Portene (kjør lokalt til alt er grønt)

Det er tre porter. De to første er maskinelle og kjører også i CI. Den tredje er en uavhengig
vurdering som nattsporet gjør før PR-en åpnes.

### Port 1 - Selvspill (`scripts/playtest-microgame.mjs`)

```bash
node scripts/playtest-microgame.mjs --ids <id>          # starter egen Vite
node scripts/playtest-microgame.mjs --ids <id> --url http://localhost:5173
```

| Sjekk | Grønt når |
|---|---|
| Spillbart | hver `vinner`-robot vinner minst 1 av 2 runder |
| Utfordring | passiv spiller og alle `taper`-roboter vinner aldri |
| Ferdighet | beste vinnerrunde har flere poeng enn alle taperrunder |
| Raskt i gang | synlig knapp i spillvinduet på startskjermen, og `start()` gir fase «spiller» på under 6 s |
| Liv | bildet endrer seg merkbart mellom 2 og 12 s uten input |
| Lesbart | tekst dekker ikke midten av spillet i mer enn 4 s i strekk (normalisert for spilltempo) |
| Stabilt | ingen konsollfeil, ingen unntak i robotene |
| Merket | `sjanger` og `tone` i registry, `usePlaytest` i fila, eget `theme` |

Rapport i `.screenshots/playtest/_playtest.md`, bilder per spill (meny, passiv 2/7/12 s, slutt-skjerm
per robot, filmstripe av vinnerroboten).

### Port 2 - Scene-audit (`scripts/audit-microgames.mjs --ids <id> --strict --frames 4`)

Konsollfeil, båt-vakthund, begravd geometri, modell utenfor utsnittet. Se vedlegg E for hvordan du
leser en rød port.

### Port 3 - Uavhengig vurdering (ikke deg selv)

Den som bygde spillet, er den dårligste til å vurdere det. Gi vurderingen til en **fersk
underagent** (Agent-verktøyet, ny kontekst) som IKKE får se briefen, koden eller begrunnelsene dine.
Den får bare:

- artikkelens tittel og tre setninger om hva den handler om,
- skjermbildene fra port 1 og 2 (meny, filmstripe, slutt-skjermer, audit-rammene),
- selvspill-rapporten,
- referansebildene i `docs/microgames/referanse/` (Havet kommer og Regnet i Lærdal),
- rubrikken under, og beskjed om å være streng og konkret.

Den svarer med poeng per akse og de tre viktigste forbedringene.

| Akse (1-5) | 1 | 3 | 5 |
|---|---|---|---|
| **Gøy** | Jeg ville lukket det etter 20 s | Greit å prøve én gang | «Én runde til» - eskalering, deilig verb, rekord å slå |
| **Utseende** | Primitive klosser på en grønn plen | Pent, men generisk | Eget uttrykk; lys, atmosfære og bevegelse som i et indiespill |
| **Lærerikt** | Fakta i tekstbokser, temaet er kulisse | Temaet preger spillet | Reglene ER fagstoffet - den som vinner, har forstått mekanismen |
| **Lesbart** | Vet ikke hva jeg skal gjøre | Skjønner det etter litt | Forstått på 5 s, mål i HUD, tap gir tips, tekst dekker aldri spillet |
| **Unikt** | Samme sjanger og look som et spill i biblioteket | Kjent form med egen vri | Sjanger + look som ikke finnes i biblioteket |

Referansespillene er kalibreringen: begge ligger rundt 4 på Gøy, Utseende og Lesbart og 5 på
Lærerikt. MÅKA er en 5 på Gøy og Utseende.

**Terskel:** ingen akse under 3, Gøy og Lærerikt minst 4, sum minst 19 av 25. Under terskel:
gjør de tre forbedringene og få en NY vurdering (ny underagent). Etter tre runder under terskel
leveres ikke spillet - en artikkel uten spill er bedre enn en med et svakt spill.

---

## Steg 6 - Registrer og embed (atomisk)

1. `src/components/microgames/<Navn>.tsx` (+ eventuell modulmappe). Default-eksport som tar
   `MicroGameProps`. Kall `onComplete({ score: 0-1, completed: true })` når runden er vunnet eller
   eleven har kommet langt nok til å ha sett poenget.
2. `registry.ts`: `const <Navn> = lazy(() => import('./<Navn>'));` og en oppføring med kebab-case
   `id`, `title`, `description`, `estimatedSeconds`, **`sjanger`**, **`tone`**, `loader` og `Component`.
3. Embed i artikkelen: `{ "type": "component", "name": "MicroGame", "props": { "gameId": "<id>" } }`
   på et naturlig sted i teksten (etter avsnittet som forklarer fagkjernen), aldri etter Quiz.
4. **Commit spillfilene, registry og artikkel-JSON i SAMME commit.** Embed aldri i artikkel-JSON før
   spillet er committet: bildejobben (07:30) committer `public/content/` og har dratt med seg en
   halvferdig embed til main før - artikkelen viste «Mikro-spillet ble ikke funnet» i produksjon.
5. Rør ikke genererte filer (`content-index.json`, `manifest.json`-datoer, `global-timeline.json`,
   `stats.html`). Et mikrospill-diff skal bare inneholde spillet, registry og én artikkel-blokk -
   da kan det ikke kollidere med andre nattjobber.

---

## Sjekkliste før PR

- [ ] Tone valgt; ikke et tema fra «ingen spill»-lista
- [ ] Designbrief skrevet (alle ti punktene) og limt inn i PR-body
- [ ] Sjanger og look ulik de tre siste nattspillene
- [ ] Arkadeskall med eget `THEME`, feed-tekst under spillet, mål i HUD, pause, lyd med lydav
- [ ] Kjerneverbet skjer i spillverdenen (3D: på objektene)
- [ ] Minst to tapsårsaker med tips; seier følger plottet
- [ ] Rekord/ranger/funn som gir «én runde til»
- [ ] `usePlaytest` med minst én vinner- og én taper-robot som ignorerer fagkjernen
- [ ] Port 1 (selvspill) grønn, port 2 (audit `--strict`) grønn
- [ ] Port 3: uavhengig vurdering over terskel - poeng og observasjoner i PR-body
- [ ] Norsk for en 14-åring, riktige tegn (æ, ø, å), ingen tankestrek
- [ ] `npx tsc -p tsconfig.app.json --noEmit` og `npx eslint <filene dine>` rent
- [ ] Spill, registry og embed i én commit; ingen genererte filer i diffen

---

# Vedlegg

Teknisk oppslagsverk. Les det du trenger - hovedteksten over er det som avgjør kvaliteten.

## Vedlegg 0 - Lærdommer fra referansespillene

- **`useRef(newGame(...))` evaluerer argumentet ved HVER render.** Med delte rutenett nullstilte det
  kirka hver gang React rendret, og været virket aldri. Bruk `useState(() => newGame(...))`.
- **Mutér aldri spilltilstand fra en prop inne i komponent-closures** (`react-hooks/immutability`).
  Legg mutasjonen i en modulfunksjon (`runFrame(g, ...)`) og kall den fra `useFrame`.
- **Komponentfiler eksporterer bare komponenter** (`react-refresh/only-export-components`). Konstanter
  og hjelpere som deles, bor i `.ts`-filer.
- **Les aldri refs under render** (`react-hooks/refs`). Lat-initialiser med `useState(() => ...)`.
- **Lukk og åpne rammen** monterer canvas på nytt mens komponenten lever. Løkker må bruke
  callback-refs (slik `useArcadeLoop` gjør), ellers blir spillet tomt ved andre åpning.
- **Terreng som skal krysses, må stige monotont** med få bevisste rygger. Støy lager søkk som
  flommer foran spilleren og gjør «vann foran deg = fare» uleselig.
- **Varsle før det er for sent** (holmen før sadelen går under). Et varsel som kommer når det er
  umulig å redde seg, er bare en straff.
- **`@react-three/postprocessing` er låst til 3.0.4** - 3.0.5+ krever three 0.182. `EffectComposer`
  tåler ikke betingede barn; skru av effekter med styrke 0.
- **drei `Cloud` henter teksturer fra CDN** - bruk den ikke. `Environment` med `Lightformer` er lokal.
- **Headless-GPU (swiftshader) gir 5-10 bilder/s.** Uten `playtestSpeed()` tar én runde en halvtime.

## Vedlegg A - Kit-toolkitet for 3D (`src/components/microgames/kit/`)

> Eldre spill bruker `MicroGameScaffold` + `SceneBanner` med kontroller under vinduet. Nye spill
> bruker arkadeskallet (steg 3) og henter bare 3D-delene herfra: `MicroCanvas`, `Interactive`,
> `Draggable`, `Mover`, `PovCamera`, scene-parts, materialer, partikler og juice. Overlay-reglene
> for `SceneBanner`/`DataReadout` gjelder bare scaffold-spill.

Importer alt fra `./kit`. Dette er den autoritative verktøykassa - bygg nye spill på den.

#### Oppsett & layout
- **`MicroGameScaffold`** - standardoppsettet: lys ramme + 3D-vindu i FULL bredde + kontroller UNDER
  vinduet (aldri oppå scenen). Gir den polerte layouten gratis.
  ```tsx
  <MicroGameScaffold
      title="Bygg vikingskipet" subtitle="..." estimatedSeconds={160} onRetry={reset}
      scene={<MyScene stage={stage} />}
      canvas={{ idle: stage === 0, camera: { position: [9,7,11], fov: 40 }, background: '#bfe0f2' }}
      overlays={<><SceneBanner message={banner} wide /><SceneBadge corner="br">{era}</SceneBadge></>}
  >
      <ChoiceRow items={...} onSelect={...} />   {/* kontroller under vinduet */}
  </MicroGameScaffold>
  ```
- **`MicroCanvas`** - standardisert R3F-Canvas (lys, skygger, fog, OrbitControls-preset). Håndhever
  delt visuell look (ingen LUT). Bruk via scaffold, eller direkte hvis du trenger egen layout.

#### Direkte 3D-interaksjon (kjernen i "rik interaksjon")
- **`Interactive`** - gjør ethvert 3D-objekt klikkbart med innebygd juice (pekefinger, scale-spring,
  valgfri forstørret klikkflate `hitArea` for trygg trackpad-treffing). Render-prop gir deg
  tilstanden så du kan farge mesh-ene:
  ```tsx
  <Interactive onSelect={pick} state={chosen ? 'correct' : 'idle'} hitArea={[1.5,1.5,1.5]}>
      {(s) => <mesh><boxGeometry/><meshStandardMaterial color={s==='hover'?'#fbbf24':'#888'} /></mesh>}
  </Interactive>
  ```
- **`Hotspot`** - flytende, kamera-vendt klikkmarkør i 3D-rom. Stor tap-target + pulse + valgfri
  etikett. Bruk for "klikk her"-punkter uten at eleven må treffe en liten mesh presist.
  ```tsx
  <Hotspot position={[0,1.3,0]} onSelect={addPlank} label="Klink bordgangen" />
  ```
- **`Draggable`** - dra et objekt langs bakkeplanet (generøs trackpad-toleranse, valgfri
  `snap`/`bounds`, skrur av kamerarotasjon under draget). Gi draggable-objekter en **romslig usynlig
  gripeflate** (et `meshBasicMaterial transparent opacity={0}`-barn) så de er lette å ta tak i.
  ```tsx
  <Draggable position={[-5,0,4]} bounds={{minX:-7,maxX:4}} snap={1} onDrop={(p)=>place(p)}>
      <mesh><boxGeometry args={[1.4,1.2,8]} /><meshBasicMaterial transparent opacity={0} /></mesh>
      <KeelLog />
  </Draggable>
  ```

#### Variasjons-primitiver (bryt klikk-hotspot-ruten)
Tre kit-primitiver gir hele klasser av ikke-klikk-mekanikk. Bruk dem framfor enda en hotspot-rad.
- **`Rotatable`** - vri et objekt til en vinkel ved å dra (1-DOF kontinuerlig): hjul, spak, ratt,
  solur, klokke, "still inn". `target` + `tolerance` gir et "på plass"-treff (`onAlign`); `snap` for hakk.
  ```tsx
  <Rotatable axis="y" target={Math.PI / 2} onAlign={() => setFlag(true)}><Dial /></Rotatable>
  ```
- **`Connector`** - forbind A->B ved å klikke to noder: handelsrute, kabel, akvedukt, slektsledd.
  `correct`-par validerer (grønn/rød) og `onComplete` fyrer når alle riktige er laget.
  ```tsx
  <Connector nodes={[{id:'oslo',position:[-4,0.4,2]},{id:'bergen',position:[3,0.4,-1]}]}
      correct={[['oslo','bergen']]} onComplete={win} />
  ```
- **`AimLauncher`** - sikt-og-skyt med ballistisk bue: dra håndtaket bakover/opp for å lade, se den
  predikerte banen, slipp for å skyte. Katapult, bue, kanon, diskos. Treff sjekkes mot `targets`.
  ```tsx
  <AimLauncher position={[0,0.6,6]} targets={[{id:'mur',position:[0,1.2,-10],radius:1.4}]}
      onHit={score} onMiss={shake}><CatapultMesh /></AimLauncher>
  ```

#### Sanntidslaget - action, press og konsekvens

Destillert fra `IngenmanslandMG` og `FluktenOverMuren3D`. Dette er primitivene som gir et
mikrospill PULS. De er like Chromebook-trygge som resten av kitet (analog input = hold + dra,
ingen tastatur nødvendig, ingen fysikkmotor).

**I scenen (3D):**
- **`PovCamera`** - førstepersonskamera med pust (i ro) og løpe-bob (i bevegelse). Statisk post
  via `position`, eller bevegelig via `positionRef` (spillet muterer refen i `useFrame` - ingen
  re-render). Krever `canvas={{ controls: false }}`.
  ```tsx
  const camPos = useRef<[number, number, number]>([0, 1.6, 16]);
  <PovCamera positionRef={camPos} lookAhead={[0, -0.28, -7]} moving={isRunning} />
  ```
- **`AimPlane`** - usynlig flate som fanger "hold inne + sikt" over hele scenen: `onHoldChange`
  (avtrekker/løp), `onAim` (pekerposisjon i %, klar for `useCrosshair`), `hideCursor`, og
  `followCamera` når kameraet selv flytter seg. Globale pointerup/blur-lyttere slipper alltid holdet.
- **`Mover`** - enhet som beveger seg fra A til B i sanntid: gang-bob, `onArrive` (konsekvens!),
  `onMove` (ref-trygg posisjon per frame for nærhets-/aggro-logikk), `hitArea` + `onHover`
  (siktemål), og død-animasjon (`state="dying"`, `deathStyle="fall|sink|pop"`, `onDeathDone`).
  Putt en kit-`Person`/`Boat`/`Cart` som barn. Ping-pong-patrulje: bytt `from`/`to` i `onArrive`.
- **`Explosion`** - prosedyreanimert nedslag (glød + sjokkring + røyk + partikler), paletter
  `fire|dust|spark`. Mount ved nedslag, unmount etter ~2,6 s.

**Tilstand (DOM-siden, ref-trygge mot useFrame):**
- **`useGameClock({ seconds, running, onExpire })`** - nedtelling: "nå muren før daggry",
  "hold stillingen i 90 sekunder". Vis med `TimerPill`.
- **`useMeter({ drainPerSecond, overloadAt, recoverTo, onOverload })`** - ressurs under press:
  løpsvarme, alarmnivå, utholdenhet, panikk. `add()` er trygg fra `useFrame` OG klikk.
  `onOverload` fyrer ÉN gang når måleren bikker - koble fail-staten dit. Vis med `MeterBar`,
  kjenn den med `DangerVignette`. Doserings-valget ("tør jeg fortsette?") er spillets hjerte.
- **`useRandomPulse({ running, minDelayMs, maxDelayMs, onPulse })`** - uforutsigbare hendelser
  (artilleri, lyn, patruljer). Miljøet skal være fiendtlig uavhengig av elevens handlinger.
- **`useWaveFlow({ totalWaves, onWave, onFinished })`** - bølgeprogresjon uten dobbel-fyring:
  spillet kaller `notifyCleared()` når bølgen er tom.

**Overlays (2D):**
- **`useCrosshair()` + `Crosshair`** - eget sikte (`mil` eller `dot`), ref-basert (0 re-render).
- **`ScreenFlash`** - munningsglimt/skade/lysglimt; fyres når `trigger`-telleren øker.
- **`DangerVignette level={0..1}`** - rød puls fra kantene; koble til `useMeter.value` så eleven
  FØLER faren uten å lese tall.
- **`TimerPill`** / **`MeterBar`** - tid og ressurs, synlig og lesbart.
- **`LoseScreen`** - speilbildet av `WinScreen`: saklig, lærerik fail-state med "Prøv igjen".
  **Et sanntidsspill uten tap-tilstand er ikke ferdig.** Formuler tapet historisk ("Vaktene hadde
  ordre om å..."), aldri hånlig.

**Sanntids-mønsteret** (se `FluktenOverMuren3D` for helheten):
1. All per-frame-logikk bor i én scene-komponent med refs (`posRef`, `movingRef`); DOM-staten er
   grov (`idle | playing | caught | won`).
2. Remount scenen per forsøk med `key={attempt}` - da nullstiller refs og enheter seg selv.
3. Deteksjon/nærhet regnes i scene-`useFrame` og rapporteres via ref-trygge callbacks
   (`meter.add`, `onReach`); aldri setState per frame.
4. Fiender/farer skal ikke være allvitende: la dem reagere på det de faktisk "ser" (spilleren i
   en lyskjegle, nær en vakt) - det gjør spillet lesbart og rettferdig.
5. Balans-krav: en som ignorerer mekanikken skal TAPE, en som bruker den skal VINNE. Verifiser
   begge med selvspill (se sjekklista).

#### Input-widgets under vinduet
- **`ChoiceRow`** - vannrett rad med valgkort (done/active/locked). **`StepTracker`** - "Steg X av N".
- **`SceneSlider`** - kontinuerlig spak som styrer scene-tilstand i sanntid (vannstand, år, bredde).
  Helt annen interaksjon enn diskrete knapper - bruk den for "morf og se".
- **`ToolPalette`** - velg verktøy, klikk så i 3D for å bruke det (plassere, rive).

#### Output-overlegg (oppå scenen, `overlays`-slot)
- **`SceneBanner`** (transient toppmelding), **`SceneBadge`** (hjørne-etikett), **`DragHint`**
  (idle-hint), **`SceneFact`** (faktakort under), **`WinScreen`** (trofé + reset/gå-videre).

> **HÅNDHEVET PLASSERINGSREGEL - ingen overlapp i topphjørnene.** Følg dette oppsettet, ellers
> kolliderer banner og teller (særlig på Chromebook/smale skjermer):
> - **Toppen er reservert for `SceneBanner` alene.** Sett ALLTID `wide` på den
>   (`<SceneBanner message={banner} wide />`) - da bruker den hele toppbredden og lange meldinger
>   ligger på én linje. Uten `wide` blir den smal (det er kun en sikkerhetsfallback for spill som
>   ennå har en widget i et topphjørne).
> - **Aldri `corner="tr"` eller `corner="tl"`.** `DataReadout` har default `tr` - så når du bruker
>   den MÅ du sette `corner="bl"` eksplisitt.
> - **`DataReadout` (teller/live data) → `corner="bl"` (bunn-venstre).**
> - **`SceneBadge` (epoke/etikett) → `corner="br"` (bunn-høyre).**
> - **`DragHint`:** default `bl`. Hvis spillet også har en `DataReadout` (som er i `bl`), sett
>   `corner="bc"` (bunn-senter) så hint og teller ikke overlapper.
>
> Kort: topp = `wide` banner, bunn-venstre = teller, bunn-høyre = etikett, bunn-senter = drahint
> (kun når teller finnes). `GudenesVerden3D.tsx` og `GobekliTepe3D.tsx` er referanse.

#### Hjelpere
- **`damp(cur, target, dt, speed)`** / **`dampV3`** - myk demping mot mål i `useFrame`. Fundamentet
  for animasjon uten fysikk.
- **`useStage(total)`** - liten fler-stegs tilstandsmaskin (`stage`, `advance`, `reset`, `atEnd`).

---

## Vedlegg B - Orientering, vann og plassering (korrekt geometri)

De vanligste feilene i auto-genererte spill er ikke bugs - de er **geometri som vender eller ligger
feil**: master/seil som peker feil vei, båter på land (eller land i sjøen), ting som flyter eller
synker. Disse ryker rett til elevene fordi natt-PR-ene auto-merges. Følg reglene under, så unngår du
dem av konstruksjon.

**Hard regel: bygg aldri skrog eller vannflate for hånd.** Bruk kit-delene:
- **`Boat`** (`kit`) for alle båter. Konvensjon: **baugen peker +Z**, firkantseilet spenner på tvers
  (X) og vender forover (mot seilretningen). Snu båten med `heading={vinkel}` (radianer om Y, "hvor
  peker baugen") eller `rotation` - da vender seilet automatisk riktig. Hånd-bygg aldri mast + seil
  som løse `planeGeometry` med gjettet rotasjon; det er nettopp der "seilet henger på tvers av sin
  egen rå" oppstår.
- **`Seascape`** (`kit`) for sjø-scener i stedet for en løs `WaterPlane` + hånd-tunede båt-Y-verdier.
  `Seascape` eier ÉN vannlinje (`waterY`) og vann-utstrekningen; plasser båter mot `waterY`. I DEV
  varsler `Boat` i konsollen hvis den havner utenfor vannet (på land) eller langt fra vannlinja.
- **`Shoreline`** (`kit`) for scener med BÅDE land og hav (havn, kyst, elvebredd): den eier
  kystlinja (`splitX`) og legger land og vann på hver sin side - de kan aldri overlappe. Legg aldri
  en hånd-plassert `WaterPlane` delvis over land; det var slik Hansakoggen fikk hus i sjøen.
- **`FlatRing`** (`kit`) for alle ringer som skal LIGGE (markører, gulvskiller, arenaringer). Rå
  `torusGeometry` står i XY-planet som standard og blir en stående bøyle uten eksplisitt rotasjon.

```tsx
// Riktig: sjø-scene med Seascape, båt seiler mot havna (+X).
import { Seascape, Boat, faceAlong } from './kit';

<Seascape position={[0, 0, 0]} size={[30, 24]} waterY={0.05} color={t.water}>
    <Boat position={[-8, 0.05, 0]} heading={faceAlong([1, 0])} sail="#efe7d4" />
</Seascape>
```

- **Orienterings-hjelpere** (`kit/placement`): `faceAlong([dx, dz])`, `headingToRotation(from, to)`,
  `rotationAlong([dx, dz])`. Regner ut Y-rotasjonen som snur en +Z-vendt del (`Boat`, `Person`,
  `Animal`) mot en retning eller et mål - bruk dem i stedet for hånd-skrevet `Math.atan2`.
- **Master loddrett, rå ⟂ kjøl.** En mast er en vertikal `cylinderGeometry` (akse Y, ingen
  rotasjon). Råa/bommen er horisontal, på tvers av kjølen. Seilet spenner råa og vender langs
  kjølretningen - ikke motsatt.
- **Land kun på land, sjø kun i sjøen.** Hold `Tree`/`Building`/`Person` innenfor `GroundPlane` og
  båter innenfor `Seascape.bounds`. Ikke la vann og land bytte plass i forhold til emnet.
- **Ingenting flyter eller synker.** Alt som skal stå på bakken har bunnen ved bakkenivå; alt som
  flyter ligger ved `waterY`. Sjekk i preview at det ikke er luft under eller topp under vann.

#### Feilklassene fra storrevisjonen 2026-07-24 (36 av 41 spill hadde minst én)

Sjekk hver av disse eksplisitt i din egen kode FØR du rendrer:

1. **Svevende/begravde objekter.** Alt fluktes mot faktisk underlag: bunn = underlagets topp.
   NB: `GroundPlane` ligger på y=-0.02; flukt mot 0-planet. Objekter oppå øyer/plattformer skal
   stå på PLATÅHØYDEN, ikke y=0.
2. **Three.js-defaults:** `cylinderGeometry` står langs Y, `torusGeometry` står i XY-planet,
   `planeGeometry` står vertikalt. Alt som skal LIGGE (ringer, skrog, akslinger, gulvflater) må
   roteres eksplisitt.
3. **Vann-utstrekning:** regn ut WaterPlane/Seascape sine x/z-intervaller og sammenlign med hver
   bygning/rekvisitt. Vann skal aldri dekke land-props, og båter skal ha litt dypgang - aldri stå
   oppå kai eller sveve over vannflata.
4. **`scale.y = 0` skjuler IKKE en boks** - den tegnes som et flatt kort. Bruk `visible={false}` +
   sett `visible` i takt med skalaen.
5. **Kamera:** hele modellen i utsnittet, og det FØRSTE oppgave-elementet synlig, uklippet og ikke
   gjemt bak annen geometri fra startkameraet. Med `controls: false` sikter kameraet nå mot
   `target` - men verifiser innramming visuelt.
6. **Soft-lock:** `SceneQuiz` er engangs. Kall `onComplete` uansett svar (f.eks. score 1 ved
   riktig, 0.7 ved feil) - aldri kun ved riktig.
7. **Tettstilte klikkemål:** gi kun det AKTIVE målet stor `hitArea` (kit-`Interactive` slipper nå
   raycasts gjennom disabled noder, men store permanente hitAreas skygger fortsatt visuelt).
8. **`WinScreen` skal i scaffoldens `children`** (kontrollfeltet under vinduet) - aldri i
   `overlays`, der klippes den usynlig bort.
9. **Norsk:** å/ø/æ overalt (aldri aa/oe/ae), aldri tankestrek - bruk bindestrek. Gjelder også
   registry-beskrivelsen.

> **Bakgrunnsdekor og innrammings-sjekken.** Scene-revisjonen måler «modellen»: den unionerer
> bounding-boksene til alle synlige mesh, men holder bakke-/vannplan (bredere enn 26 enheter) og
> parkerte pool-objekter utenfor. Dekor som ligger spredt utover scenen - himmelkuppel, skybanker,
> fugler - faller mellom disse to unntakene og blåser opp modellboksen, slik at et riktig innrammet
> spill får treff på «feil innramming». Merk derfor slik dekor med `userData={{ sceneAuditIgnore: true }}`
> på meshen eller på gruppa den ligger i. Bruk flagget KUN på dekor: setter du det på spillinnhold,
> slår du av porten for nettopp det du vil at den skal vokte.

---

## Vedlegg C - Flere kit-lag: look, juice, lyd, kamera

Toolkitet har fem lag til som løfter et mikrospill fra «funker» til «wow». Bruk det
som tjener læringsmålet - ikke alt på en gang.

#### Signaturlook (visuelt imponerende)
- **`THEMES`** - era-paletter: `viking`, `roman`, `industrial`, `egypt`, `greek`, `medieval`,
  `enlightenment`, `modern`, `cosmic`, `arctic`, `asian`, `mesoamerican`. Mat `sky`/`fog` til
  `MicroCanvas` og bruk fargene i scene-parts, så hvert emne får distinkt identitet. Velg det som
  matcher emnet (kosmisk er bevisst LYS, ikke mørk).
- **Lys-stemning** (`MicroCanvas` `light`-prop): `day` (standard), `overcast`, `golden`, `noon`,
  `twilight`, `arctic`. Distinkt atmosfære uten LUT - en industriscene blir `overcast`, en
  solnedgang `golden`/`twilight`. Eksplisitte `sunIntensity` osv. vinner fortsatt over stemningen.
- **`ToonMaterial`** - flat, tegneserieaktig storybook-look: `<mesh><boxGeometry/><ToonMaterial color="#a8412f" /></mesh>`.
- **`GlowMaterial`** - drop-in emissivt materiale (`toneMapped={false}`) for ild/lamper/varsellys/magi:
  `<mesh><sphereGeometry/><GlowMaterial color="#ffb000" /></mesh>`. **`GlowHalo`** - mykt additivt
  glød-skall rundt et objekt (halo uten PointLight): `<group><Lampe /><GlowHalo color="#ffcc66" size={1.4} /></group>`.
- **`WaterMaterial`** - vann med ekte animerte vertex-bølger (ikke bare emissiv puls). Krever et
  segmentert plan: `<mesh rotation={[-Math.PI/2,0,0]}><planeGeometry args={[16,30,40,40]} /><WaterMaterial /></mesh>`.
- **`KitOutline`** - tegneserie-kant; legg som siste barn i et `<mesh>` for å fremheve valgte objekter.
- **Kontaktskygge + vignette** er på automatisk via `MicroCanvas`/`MicroGameScaffold` (slå av med `canvas={{ contactShadows: false }}`).
- **Egen himmel-gradient.** `MicroCanvas` tar bare én bakgrunnsfarge. For en filmatisk himmel: legg en
  stor `sphereGeometry` (radius ~60) med `side={THREE.BackSide}`, `fog={false}` og en `CanvasTexture`
  med en vertikal gradient (kjølig topp -> varm horisont). Holder seg lys og respekterer lys-stil-regelen.
- **Atmosfære-glød.** Bruk ferdige `GlowHalo` (additivt skall) eller `GlowMaterial` (emissivt) i
  stedet for å hand-rulle. Vil du animere haloen, gi den en `damp`-et farge/opasitet via en egen
  `meshBasicMaterial` (`side={THREE.BackSide}`, `blending={THREE.AdditiveBlending}`, `depthWrite={false}`)
  for å vise liv/forfall/forvandling.
- **Dybde uten mørke.** Drivende skybanker (store, flate, halvgjennomsiktige kuler) og svake lys-
  partikler («motes») gir rom og atmosfære mens scenen forblir lys. **Dramaet skal komme fra at *emnet*
  forandrer seg** (verden brenner, byen vokser), ikke fra en mørk UI - mørkt tema krever eksplisitt ønske.
- **Liv i ro.** `useIdleMotion` (svev) pluss en langsom egenrotasjon på hovedobjektet gjør at verdenen
  lever selv før eleven gjør noe.

#### Game-feel / juice (gøy + vanedannende)
- **Lyd er default-on.** `Interactive`/`Hotspot` spiller en `'select'`-tone ved klikk, og `Draggable`
  spiller `'pick'` ved grep + `'drop'` ved slipp - helt gratis, ingen wiring. Overstyr med
  `sound`-propen (`sound={null}`/`sound="correct"` på Interactive/Hotspot, `sound={false}` på
  Draggable). For egne event-lyder midt i logikken: `microSfx.play('correct' | 'incorrect' |
  'advance' | 'complete' | 'sceneChange' | ...)` (delt app-global lyd-singleton; samme kjede og mute
  som `useStepSounds`).
- **`useShake()`** - trauma-basert rist; fest `ref` til en `<group>` rundt scenen, kall `shake(0.7)` ved treff.
- **`usePop()`** - spring-pop på skala; `pop()` ved suksess/plassering.
- **`Burst`** - instanserte suksess-partikler; avfyres når `trigger`-tallet endres: `<Burst position={[0,2,0]} trigger={winCount} />`.
- **`useScore()` + `ScoreHUD`** - combo/streak/stjerner. `hit()`/`miss()` -> synlig progresjon og belønning.
- **Magnetisk snap** på `Draggable`: `snapPoints={[[x,z],...]}` + `onSnap` gir tilfredsstillende plassering.
- **`ease`** - easing-funksjoner (outCubic, outBack, outElastic...) for håndlagde tweens.

#### Lyd & kamera (immersjon)
- **`useAmbience(preset)`** - ambient lydbed (`waves`/`wind`/`forge`/`crowd`/`forest`). Kall `start()` fra en
  brukerhandling (nettlesere blokkerer autostart). Hold volumet lavt - lyd skal bekrefte, ikke dominere.
- **`CameraRig`** - cinematisk kamera. Innflyvnings-mønster (unngår å sloss med OrbitControls): start kameraet
  langt unna (`canvas.camera.position`), hold `canvas.controls={false}` til `<CameraRig active={!introDone} onArrive={() => setIntroDone(true)} />` er framme, slå så på controls. (VikingShip3D gjør dette.)
- **`useIdleMotion()`** - rolig vugging/svai så verdenen lever selv når eleven ikke gjør noe.

#### Pedagogisk kraft (lærerik)
- **`DataReadout`** - live tall som endrer seg mens eleven drar/justerer; gjør årsak-virkning synlig.
- **`SceneQuiz`** - ett-spørsmåls aha-sjekk som kan kobles til scoring (`onResult`).
- **`CompareToggle`** - veksle mellom to tilstander (for/etter, A/B) og se forskjellen direkte.
- **`useHintEscalation({ active, resetKey })`** - eskalerer hint hvis eleven står fast; bruk nivået til å fremheve neste hotspot. `resetKey` (f.eks. `stage`) nullstiller ved framgang.

#### Rikdom & unikhet
- **`InstancedField`** - spre hundrevis av kopier (skog, folkemengde, åker, steinur) billig: `<InstancedField count={120} geometry={<coneGeometry .../>} material={<meshStandardMaterial .../>} />`.
- **`Particles`** - kontinuerlig atmosfære/vær (instansert, billig). Presets: `rain`, `snow`, `dust`,
  `embers`, `leaves`, `motes`. `<Particles preset="snow" />` over scenen, eller lokalt med
  `center`/`area`/`height` (f.eks. `embers` over et bål). Velg det som matcher emnet - atmosfære, ikke mekanikk.
- **`Impact`** - kort treff-burst ved plassering/treff: `splash` (vann), `dustPuff` (bakke), `sparks`
  (metall). Fyres når `trigger` endres: `<Impact preset="dustPuff" trigger={dropCount} position={[x,0,z]} />`.
  Snarvei: `Draggable` har `dropFx="dustPuff"` som avfyrer den automatisk på slippstedet (opt-in,
  for riktig preset velges per kontekst).
- **Flere scene-parts:** `Rock`, `Fire` (flakkende, lyser opp), `Banner` (vaiende), `Gear` (roterende tannhjul, `spin`).
- **Uttrykksfulle figurer:** `Person` (armer/bein + `pose` `idle|walk|raise|sit` + `hat`
  `cap|helmet|crown|hood`) i stedet for den gamle blokk-`Figure` - så folk ser forskjellige ut på
  tvers av epoker. `Animal` (`horse|ox|sheep`).
- **Miljøbyggesteiner:** `Wall` (m/tinder), `Tower`, `Column`, `Arch`, `Bridge`, `Cart`, `Boat`
  (m/`sail`), `Tent`, `Torch` (emissiv + punktlys), `MarketStall`, `Hill`. Velg deler som matcher
  emnet - en romersk gate er `Column` + `Arch`, en vikinghavn er `Boat` + `MarketStall`.
- **Bryt "alle hus like":** `Building` og `Tree` tar nå et valgfritt `seed` som varierer
  høyde/bredde litt. Gi hver instans i en rad/skog ulik `seed` så scenen ikke ser stemplet ut.

#### Robusthet & forfatterstøtte
- **Preview-rute:** test et mikrospill isolert på `/mikrospill` (galleri) og `/mikrospill/<id>` - uten å embedde i en artikkel. Bruk dette når du bygger.
- **Perf-guard:** `MicroCanvas` senker oppløsningen automatisk på svake Chromebooks, og hever den igjen.
- **`prefers-reduced-motion`** respekteres (ingen auto-rotasjon). Kontrollene under vinduet er tastatur-tilgjengelige; gi alltid en knapp/slider-vei i tillegg til rene 3D-klikk der det er mulig.

#### Mekanikk-arketyper - bryt ut av «klikk tre ting»
Velg en form som matcher emnet, ikke alltid den samme. (Se også opplevelses-arketypene øverst -
de fire sanntidsformene der er likestilte med disse, og skal velges MINST like ofte.)
- **Forsvar posisjonen** (IngenmanslandMG): fiender kommer i bølger, eleven sikter/holder/doserer. (`PovCamera` + `AimPlane` + `Mover` + `useWaveFlow`)
- **Kryss under press** (FluktenOverMuren3D): kom deg gjennom et fiendtlig rom, frys/løp-rytme, alarm og tid. (`PovCamera` + `useMeter` + `useGameClock`)
- **Overlev/hold ut:** miljøet eskalerer (`useRandomPulse`), eleven prioriterer ressurser til tiden er ute.
- **Reager i tide:** vent, les mønsteret, handle i riktig øyeblikk - straff for både for tidlig og for sent.
- **Bygg/monter** (VikingShip): dra deler på plass, klikk for å føye til, se det reise seg. (`Draggable` + `Hotspot`)
- **Rute/naviger:** legg en vei/forbindelse fra A til B (handelsrute, kabel, akvedukt). (`Connector`)
- **Vri/still-inn:** drei et ratt/spak/solur til riktig vinkel. (`Rotatable`)
- **Balanser/finn likevekt:** en slider/spak søker et optimalt punkt (pris, vannstand, dose). (`SceneSlider`)
- **Sorter-i-3D:** dra objekter i riktige soner/bøtter (kategorier, tidsperioder). (`Draggable` + `snapPoints`)
- **Årsakskjede:** utløs en sekvens (dominoer, kjedereaksjon) og se konsekvensen.
- **Grav-fram/avdekk:** fjern lag for å avsløre noe under (arkeologi, geologi).
- **Dyrk/simuler over tid:** la en prosess utvikle seg (befolkning, økosystem, by).
- **Sikt/bane:** juster vinkel/kraft og se en kastebane (katapult, kanon, bue). (`AimLauncher`)
- **Modell-sammenlikning (morf-og-se):** representer en abstrakt idé romlig og veksle mellom to
  modeller (`CompareToggle`), så samme system spilles ut ulikt under hver. Eks: samme verden under
  sirkulær vs. lineær tid (`TidensFormer3D`).

---

## Vedlegg D - Fallgruver i React + R3F

- **Les aldri `ref.current` under render for å utlede props til mesh-er.** Tidsmarkør, fase og
  lignende som endrer seg i `useFrame` lever i refs - leser du dem i render-kroppen, re-rendrer ikke
  scenen, og ESLint stopper deg (`react-hooks/refs`). Speil i stedet verdien til `useState` fra
  `useFrame`, men kun når den faktisk endrer seg (sammenlikn mot forrige), så du ikke setter state hver
  frame.
- **Ikke muter en `let` inni `useMemo`.** En typisk pseudo-random-generator (`let s; s = ...`) brytes av
  `react-hooks/immutability`. Legg RNG-en som en ren funksjon på modulnivå (se `InstancedField`) og
  kall den i `useMemo`.
- **Animér tilstand med `damp`, driv av én kilde.** Hold sannheten i ett tall (fase / `t` / slider) og
  la hvert delobjekt `damp`e mot mål utledet av den - ikke spre tilstanden utover mange refs.

---

## Vedlegg E - CI-portene og auto-merge

Rører PR-en `src/components/microgames/**`, kjører `.github/workflows/microgame-audit.yml`:

1. **Scene-audit** (`audit-microgames.mjs --strict`) for berørte spill + røyk-utvalg.
2. **Selvspill** (`playtest-microgame.mjs`) for berørte spill som har `sjanger` i registry (nye
   standard-spill). Et spill som er NYTT i PR-en, MÅ ha `sjanger`, `tone` og `usePlaytest` - ellers
   er porten rød.

Begge poster funnene sine som én PR-kommentar. Auto-merge (`auto-merge-bot-prs.yml`) venter til
sjekken er grønn og merger da selv.

| Melding | Betyr | Hva du gjør |
|---|---|---|
| «fant funn i spillet» (exit 1) | Ekte funn: taper-robot vant, vinner-robot tapte, tekst over spillet, konsollfeil, begravd geometri | Fiks spillet og push til branchen |
| «kunne ikke kjøre» (exit 2) | Harness/infrastruktur: kald Vite, død dev-server, timeout i `page.goto` | Ikke rør spillet. Kjør sjekken på nytt |

**Bakgrunn (PR #246, 25.07.2026):** første PR som trigget scene-auditen ble flagget to ganger av
harnessen på en kald runner, ikke av spillet. Derfor varmer harnessene opp Vite, legger det endrede
spillet sist, retryer infrastruktur-funn og klassifiserer i stedet for å påstå.
