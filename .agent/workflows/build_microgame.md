---
description: Lag et rikt, direkte-interaktivt 3D-mikrospill som kjører inline i en artikkel eller læringssti. Bruk dette når spillet skal bo MIDT i innholdet (ikke fullskjerm), bygd på interaksjons-toolkitet i src/components/microgames/kit/.
---

# Skill: Build Micro-Game

Bruk denne skillet når du skal lage et **mikrospill** - et lett, selvstendig 3D-spill som kjører
**inline** i en artikkel eller et læringsstisteg. Et mikrospill er en kort, romlig "aha"-opplevelse
på 1-3 minutter der eleven **interagerer direkte med en 3D-verden**: klikker objekter, drar dem på
plass, justerer en spak - eller løper, sikter, forsvarer og flykter i sanntid. Målet er at eleven
blir SUGD INN i 3D-opplevelsen, ikke at de betrakter en modell.

---

## Mikrospill vs. den tunge 3D-motoren - velg riktig spor

| | Mikrospill (dette sporet) | Full 3D-motor (`src/games/engine/`) |
|---|---|---|
| **Bor** | Inline i artikkel/sti | Egen rute `/oving/spill/:id` |
| **Stack** | React + R3F (`@react-three/fiber` + `drei`) + toolkit | Rå Three.js + Rapier3D WASM |
| **Vekt** | Lett, lazy-lastet, Chromebook-vennlig | Tung (~1 MB WASM), fullskjerm, pointer-lock |
| **Lengde** | 1-3 min | 10-20 min |
| **Guide** | Denne fila | `.agent/workflows/BUILD_GAME_GUIDE.md` |

Skal spillet ligge midt i en artikkel? → mikrospill. Skal det være en egen verden å gå rundt i? →
full motor. **Embed aldri den tunge motoren i en artikkel.**

---

## Kjernefilosofi: rik, direkte interaksjon - ikke bare knapper

Et mikrospill er en **levende 3D-verden eleven manipulerer**, ikke et bilde med tre knapper ved
siden av. De tidligste mikrospillene var alle samme tynne form ("trykk tre knapper etter
hverandre"). Det er ÉN gyldig byggekloss, men ikke målet. Sikt høyere:

- **La eleven ta i verdenen.** Klikk objekter direkte, dra ting på plass, juster en spak og se
  konsekvensen i sanntid. Toolkitet (`src/components/microgames/kit/`) gjør dette trivielt og
  Chromebook-trygt - bruk det.
- **Bygg en verden, ikke en modell.** Lag-på-lag prosedyrale mesher: terreng, hus, figurer,
  kjøretøy, vann, røyk. Lavpoly og billig - men en scene, ikke ett objekt. `kit/scene-parts`
  har ferdige deler (`Building`, `Figure`, `Tree`, `WaterPlane`, `Smoke`, `GroundPlane`).
- **La eleven endre tilstanden, og animer konsekvensen.** Den sterkeste mekanikken: et grep → en
  synlig forvandling → en aha. Driv scenen av enkel tilstand (`useStage` eller en slider-verdi) og
  la hvert delobjekt dempe (`damp`) mykt mot mål utledet av tilstanden.
- **Sikt mot lyspæra i selve interaksjonen.** Mekanikken ER pedagogikken. I flaggskipet
  `VikingShip3D` bygger eleven skipet selv - klinker bordganger, reiser masten, og morfer skroget
  mellom langskip og knarr - og kjenner dermed på kroppen hvorfor klinkbygging + kjøl gjorde det
  samme håndverket til både krigsskip og handelsskip.
- **Lag et SPILL, ikke en utstilling.** Et diorama eleven klikker riktige ting i er en quiz med
  3D-pynt. Et spill har minst ett av disse: sanntid (verden beveger seg uansett hva eleven gjør),
  press (tid, fare, ressurs som må doseres), og KONSEKVENS av å feile (en ekte fail-state med
  "prøv igjen", ikke bare manglende poeng). De to referansespillene `IngenmanslandMG` (forsvar
  stillingen mot bølger av soldater) og `FluktenOverMuren3D` (kryss dødsstripa i førsteperson,
  frys når lyskasterne jakter) har alle tre - og det er derfor de suger eleven inn.

### Velg opplevelses-arketype FØR mekanikk

Bestem først hva slags OPPLEVELSE emnet fortjener, deretter hvilke primitiver som bygger den.
Minst annenhver artikkel bør få en sanntids-form - ikke fordi action alltid er riktig, men fordi
rolig manipulasjon er default-fella generatoren faller i:

| Opplevelse | Eleven er... | Kjerne-primitiver | Eksempel |
|---|---|---|---|
| **Forsvar posisjonen** | inne i scenen, under angrep | `PovCamera` + `AimPlane` + `Mover` + `useWaveFlow` | `IngenmanslandMG` |
| **Kryss/flukt under press** | på vei gjennom fiendtlig terreng | `PovCamera` + `useMeter` + `useGameClock` + `LoseScreen` | `FluktenOverMuren3D` |
| **Overlev/hold ut** | presset av et miljø som eskalerer | `useGameClock` + `useMeter` + `useRandomPulse` | (åpen) |
| **Reager i tide** | vaktpost/operatør som må time riktig | `useGameClock` + `Mover` + `ScreenFlash` | (åpen) |
| **Bygg/monter** | håndverker | `Draggable` + `Hotspot` + `Rotatable` | `VikingShip3D` |
| **Styr/naviger** | fører av noe (skip, vogn, maskin) | `Rotatable`/`SceneSlider` + `Mover` + `DataReadout` | (åpen) |
| **Utforsk/avdekk** | oppdager | `Hotspot` + `Interactive` + `CameraRig` | `TrojaUtgravning3D` |
| **Morf-og-se** | tenker som sammenligner modeller | `CompareToggle` + `SceneSlider` | `TidensFormer3D` |

Regel: **klikk-på-N-riktige-ting i et stillestående diorama er IKKE en gyldig arketype lenger.**
Hvis utkastet ditt koker ned til det, velg en arketype fra tabellen og bygg om.

### Knapper og 3D-klikk utelukker ikke hverandre

Direkte 3D-interaksjon er nå førsteklasses og **oppmuntres**. Men kombiner gjerne: en
`SceneSlider`/`ChoiceRow` under vinduet sammen med klikkbare objekter og drag i scenen. Bruk det som
passer læringsmålet. Den gamle regelen "unngå 3D-klikk, bruk bare knapper" gjelder ikke lenger -
toolkitet løser trackpad-problemet (se under).

### Velg en iscenesettelse som matcher emnet - ikke standard-dioramaet

Toolkitets default-deler (`GroundPlane` + `Building`/`Tree`/`Figure`) gjør det lett å lage en bygd
på en grønn åker. Det er riktig for et konkret sted (en vikinghavn, en fabrikk), men for abstrakte
eller kosmiske emner (tid, tro, ideer, verdensrommet) ser «noen greier ute på en åker» billig og
malplassert ut. **Bestem iscenesettelsen før du fyller den med deler:** hva er den naturlige scenen
for dette emnet? En klode som svever i kosmos? Et objekt i et tomt rom? En lysstråle i mørket? Velg
staging som bærer emnet, så blir resten immersivt nesten gratis. Se `TidensFormer3D` - eskatologi som
en levende klode i et lysende kosmos, ikke en haug på en plen.

### Velg kameraperspektiv bevisst

Kameraet avgjør om eleven er TILSKUER eller DELTAKER. Tre gyldige valg - velg med hensikt:

1. **Førsteperson (`PovCamera`, controls av):** eleven ER i scenen. Bruk når emnet handler om å
   oppleve noe på kroppen: sitte bak maskingeværet, krysse dødsstripa, stå i folkemengden. Dette er
   det sterkeste innlevelses-verktøyet i kassa - og var lenge nesten ubrukt. En CSS-silhuett i
   bunnkanten (et gevær, hender, en åre) forsterker kroppsfølelsen (se `IngenmanslandMG`).
2. **Cinematisk/styrt (`CameraRig`, controls av):** innflyvning, fokus-pull, klatre-over-finale.
   Bruk til åpning og payoff.
3. **Orbit-diorama (default):** riktig når eleven skal manipulere og betrakte et objekt/landskap.
   Men vit at dette er tilskuer-modus - ikke velg det av vane.

**Scene-stemning følger emnet, ikke UI-et.** Rammen (scaffold) er alltid lys - men selve 3D-scenen
kan være natt, tåke eller uvær når emnet krever det (flukt om natten, skyttergraver, storm). Både
`IngenmanslandMG` og `FluktenOverMuren3D` har mørke scener i lys ramme - det er riktig. Det
"Lys stil alltid"-regelen forbyr, er mørk UI/ramme og grunnløs grimdark, ikke natt i historien.

---

## Interaksjons-toolkitet (`src/components/microgames/kit/`)

Importer alt fra `./kit`. Dette er den autoritative verktøykassa - bygg nye spill på den.

### Oppsett & layout
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

### Direkte 3D-interaksjon (kjernen i "rik interaksjon")
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

### Variasjons-primitiver (bryt klikk-hotspot-ruten)
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

### Sanntidslaget - action, press og konsekvens

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

### Input-widgets under vinduet
- **`ChoiceRow`** - vannrett rad med valgkort (done/active/locked). **`StepTracker`** - "Steg X av N".
- **`SceneSlider`** - kontinuerlig spak som styrer scene-tilstand i sanntid (vannstand, år, bredde).
  Helt annen interaksjon enn diskrete knapper - bruk den for "morf og se".
- **`ToolPalette`** - velg verktøy, klikk så i 3D for å bruke det (plassere, rive).

### Output-overlegg (oppå scenen, `overlays`-slot)
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

### Hjelpere
- **`damp(cur, target, dt, speed)`** / **`dampV3`** - myk demping mot mål i `useFrame`. Fundamentet
  for animasjon uten fysikk.
- **`useStage(total)`** - liten fler-stegs tilstandsmaskin (`stage`, `advance`, `reset`, `atEnd`).

---

## Orientering, vann og plassering (korrekt geometri)

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

### Feilklassene fra storrevisjonen 2026-07-24 (36 av 41 spill hadde minst én)

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

### Obligatorisk selv-verifisering: FIKS-TIL-GRØNN-LØKKE (før PR åpnes)

Målet er ikke å "bestå en sjekk" - det er at spillet er RIKTIG første gang det når en elev.
Verifiseringen er derfor en løkke, ikke et punkt:

1. Kjør `node scripts/audit-microgames.mjs --ids <din-id> --strict`. Den rendrer spillet på
   `/mikrospill/<id>` (og ekspanderer rammen), tar skjermbilder til `.screenshots/microgames/<id>/`,
   fanger konsollvarsler OG kjører den mekaniske scene-revisjonen (innramming, begravd geometri).
2. SE på skjermbildene med egne øyne mot feilklassene over - fra flere frames, ikke ett.
3. Spill gjennom til målskjermen (klikk/dra i Playwright eller manuelt) - inkludert minst ett
   FEIL svar/slipp der spillet har det.
4. **Fant du noe (exit 1, vakthund-varsel, eller noe som ser galt ut på bildene): fiks det og gå
   til punkt 1 igjen. Gjenta til alt er grønt OG ser riktig ut.** Åpne aldri PR med kjente funn -
   CI-porten `.github/workflows/microgame-audit.yml` kjører samme audit og er kun et sikkerhetsnett
   som aldri skal trenge å slå ut.

---

## Avanserte lag - gjør spillet unikt, immersivt og vanedannende

Toolkitet har fem lag til som løfter et mikrospill fra «funker» til «wow». Bruk det
som tjener læringsmålet - ikke alt på en gang.

### Signaturlook (visuelt imponerende)
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

### Game-feel / juice (gøy + vanedannende)
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

### Lyd & kamera (immersjon)
- **`useAmbience(preset)`** - ambient lydbed (`waves`/`wind`/`forge`/`crowd`/`forest`). Kall `start()` fra en
  brukerhandling (nettlesere blokkerer autostart). Hold volumet lavt - lyd skal bekrefte, ikke dominere.
- **`CameraRig`** - cinematisk kamera. Innflyvnings-mønster (unngår å sloss med OrbitControls): start kameraet
  langt unna (`canvas.camera.position`), hold `canvas.controls={false}` til `<CameraRig active={!introDone} onArrive={() => setIntroDone(true)} />` er framme, slå så på controls. (VikingShip3D gjør dette.)
- **`useIdleMotion()`** - rolig vugging/svai så verdenen lever selv når eleven ikke gjør noe.

### Pedagogisk kraft (lærerik)
- **`DataReadout`** - live tall som endrer seg mens eleven drar/justerer; gjør årsak-virkning synlig.
- **`SceneQuiz`** - ett-spørsmåls aha-sjekk som kan kobles til scoring (`onResult`).
- **`CompareToggle`** - veksle mellom to tilstander (for/etter, A/B) og se forskjellen direkte.
- **`useHintEscalation({ active, resetKey })`** - eskalerer hint hvis eleven står fast; bruk nivået til å fremheve neste hotspot. `resetKey` (f.eks. `stage`) nullstiller ved framgang.

### Rikdom & unikhet
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

### Robusthet & forfatterstøtte
- **Preview-rute:** test et mikrospill isolert på `/mikrospill` (galleri) og `/mikrospill/<id>` - uten å embedde i en artikkel. Bruk dette når du bygger.
- **Perf-guard:** `MicroCanvas` senker oppløsningen automatisk på svake Chromebooks, og hever den igjen.
- **`prefers-reduced-motion`** respekteres (ingen auto-rotasjon). Kontrollene under vinduet er tastatur-tilgjengelige; gi alltid en knapp/slider-vei i tillegg til rene 3D-klikk der det er mulig.

### Mekanikk-arketyper - bryt ut av «klikk tre ting»
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

## Fallgruver (React + R3F i kit-spill)

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

## Design Law (arves fra interaktive komponenter)

- **Lys stil alltid.** `MicroGameScaffold`/`MicroGameFrame` gir amber/lys ramme. Ingen mørk base.
- **Én pedagogisk kjerne.** Definer lyspære-øyeblikket før du koder. Én ting eleven skal forstå.
- **Fem-sekunders-regelen.** Eleven vet hva de skal gjøre innen 5 sek. Ingen velkomstmodal. Bruk
  `DragHint` og en `SceneBanner` til å lose dem i gang.
- **Juicy feedback.** Umiddelbar respons på hvert grep (`Interactive`/`Hotspot` gir det gratis),
  myke `damp`-overganger, spring-finale (`WinScreen`), reset alltid tilgjengelig (`onRetry`).
- **Rik, men lesbar interaksjon.** Sikt mot flere måter å ta i verdenen på (klikk + dra + spak +
  fler-stegs), men hold hver enkelt åpenbar. Mekanikken skal være læringsmålet, ikke pynt.
- **Norsk for en 14-åring.** Korte setninger. Riktige tegn (å, ø, æ). Ingen em-dash/tankestrek.
- **Unik mekanikk.** Ikke kopier et eksisterende spills mekanikk; bygg en ny, tilpasset læringsmålet.
- **Primærinteraksjonen skjer i 3D-vinduet.** DOM-knapper/slidere under vinduet er STØTTE, aldri
  hovedspillet. Hvis 3D-scenen bare illustrerer valg som tas i knapper, er det ikke et mikrospill.
- **Noe må stå på spill.** Sanntidsformer krever ekte fail-state (`LoseScreen` + prøv igjen).
  Rolige manipulasjonsformer krever som minimum synlig konsekvens av feil valg (noe velter,
  kollapser, går tapt) - ikke bare fravær av suksess.
- **Kamera med hensikt.** Velg tilskuer (orbit) eller deltaker (`PovCamera`) bevisst - se
  kamera-seksjonen. Førsteperson skal ikke lenger være unntaket.
- **Chromebook-først (~1366×768).** Toolkitet løser trackpad-utfordringen: `Hotspot` gir store mål,
  `Interactive`/`Draggable` har generøse klikk-/gripeflater og hover-cursor. Du kan derfor trygt
  bruke direkte 3D-interaksjon - men gi alltid store nok mål, og vurder en knapp/slider under vinduet
  som alternativ vei der det passer.

---

## Slik bygger du ett

1. **Opprett spillet:** `src/components/microgames/<Navn>.tsx`.
   - Default-eksporter en komponent som tar `MicroGameProps` (`{ onComplete, onRetry?, ... }` fra
     `./types`).
   - Bygg scenen på toolkitet: `MicroGameScaffold` + `scene`-tre med `Interactive`/`Hotspot`/
     `Draggable` og `kit/scene-parts`, kontroller under vinduet.
   - Kall `onComplete({ score, completed: true, artifact? })` når spillet er vunnet.
   - Lyd via `useStepSounds()` (`play('correct' | 'advance' | 'complete' | 'drop' | 'pick' | ...)`).

2. **Registrer i registeret** (EKSAKT - dette er det som hindrer "fant ikke spillet"-feil):
   I `src/components/microgames/registry.ts`:
   - Legg til `const <Navn> = lazy(() => import('./<Navn>'));` øverst.
   - Legg en entry i `MICRO_GAMES` med en **kebab-case `id`** (f.eks. `'vikingskip-3d'`), `title`,
     `description`, `estimatedSeconds`, `loader: () => import('./<Navn>')`, og
     `Component: <Navn> as never`. `id`-en er det `gameId` du bruker i innholdet.

3. **Bruk i innhold** - to veier, samme registry, samme `id`:
   - **I en artikkel** (via `ComponentRegistry` → `MicroGameBlock`):
     ```json
     { "type": "component", "name": "MicroGame", "props": { "gameId": "<id>" } }
     ```
   - **I et læringssti-steg** (via `MicroGameStep`):
     ```json
     { "type": "microgame", "microGameId": "<id>", "microGameProps": { } }
     ```

Ingen endring i `ComponentRegistry.tsx` trengs per spill - broen `MicroGame` slår opp `gameId` i
registeret. Du registrerer kun i `registry.ts`.

---

## Sug-rubrikken - selvevaluering FØR PR

Gi spillet 0-2 poeng per akse. **Under 7 av 10 totalt: bygg om før du åpner PR.** En artikkel uten
mikrospill er bedre enn en med et 5-poengs-spill.

| Akse | 0 | 1 | 2 |
|---|---|---|---|
| **Innlevelse** | Statisk diorama, tilskuer | Levende scene, atmosfære, lyd | Eleven er I scenen (`PovCamera`/styrt kamera) eller scenen reagerer kroppslig på eleven |
| **Puls** | Verden venter på klikk | Noe beveger seg uavhengig av eleven | Sanntid + press (tid/fare/ressurs) som tvinger valg |
| **Konsekvens** | Kan ikke feile | Feil gir synlig negativ respons | Ekte fail-state med gjenstart, og suksess føles fortjent |
| **Ferdighet** | Ren gjenkjenning (velg riktig) | Presisjon/timing i enkeltgrep | Rytme/dosering/sikte som kan MESTRES og forbedres |
| **Unikhet** | Ligner et eksisterende spill i biblioteket | Egen vri på kjent form | Egen mekanikk skreddersydd til emnet |

## Sjekkliste før du er ferdig

- [ ] Opplevelses-arketype valgt bevisst (tabellen øverst) - ikke defaultet til klikk-diorama
- [ ] Sug-rubrikken kjørt ærlig: minst 7 av 10
- [ ] Iscenesettelsen matcher emnet (ikke standard grønn-åker-diorama uten grunn)
- [ ] Bygd på `kit/` (`MicroGameScaffold` + minst én direkte 3D-interaksjon: `Interactive`/`Hotspot`/`Draggable`/`AimPlane`/`Mover`)
- [ ] Lys ramme, 3D-vindu i full bredde, kontroller under vinduet (ikke oppå scenen)
- [ ] Lyspære-øyeblikket er tydelig og oppnådd; mekanikken ER pedagogikken
- [ ] Rik interaksjon - ikke bare en knapperad. Eleven tar i verdenen.
- [ ] Sanntidsspill: fail-state finnes (`LoseScreen`), og balansen er SELVSPILT med Playwright:
      en bot som ignorerer mekanikken taper, en som bruker den vinner. Legg et midlertidig
      selvspill-skript i `.screenshots/` (se `FluktenOverMuren3D`-mønsteret: DEV-gated
      `window.__<id>Debug` med samme info som eleven ser, bot leser den og spiller). Slett etterpå.
- [ ] Chromebook-trygt: store nok klikk-/gripeflater (`hitArea`, romslig usynlig gripeboks på draggables)
- [ ] **Geometri korrekt orientert:** master loddrett, seil vender mot seilretningen, rå ⟂ kjøl. Båter via kit-`Boat` (ikke hånd-bygd skrog)
- [ ] **Land/sjø riktig:** båter på vann (`Seascape`), land-props på land; ingenting flyter eller synker
- [ ] **Visuelt revidert:** `node scripts/audit-microgames.mjs --ids <id>` kjørt, skjermbildene sett over, DEV-vakthund uten båt-varsler
- [ ] Juicy: umiddelbar respons, myke `damp`-overganger, spring-finale (`WinScreen`), reset (`onRetry`)
- [ ] `onComplete` kalles ved seier
- [ ] Lazy-registrert i `MICRO_GAMES` med kebab-case `id` = `gameId` i innholdet
- [ ] Norsk for 14-åring, riktige tegn, ingen em-dash
- [ ] Testet inline i en ekte artikkel på ~1366×768 (hele flyten gjennomspilt)
- [ ] `npx tsc -b` + `npm run lint` rent

---

## CI-porten - slik leser du en rød Mikrospill-audit

Rører PR-en `src/components/microgames/**`, kjører `.github/workflows/microgame-audit.yml`.
Den rendrer de berørte spillene (endret spill + et røyk-utvalg hvis `kit/` eller `registry.ts`
er rørt) og **poster en kommentar på PR-en som siterer funnene sine**. Les kommentaren - ikke gjett.

Porten skiller to ting, og forskjellen bestemmer hva du skal gjøre:

| Melding | Betyr | Hva du gjør |
|---|---|---|
| «fant funn i spillet» (exit 1) | Ekte funn: konsollfeil, båt-vakthund, begravd geometri, modell utenfor utsnittet | Fiks spillet og push til branchen. Auto-merge går når sjekken er grønn. |
| «kunne ikke kjøre» (exit 2) | Harness-/infrastruktur-feil: kald Vite-transform, avbrutt bootstrap-fetch, død dev-server | **Ikke rør spillet.** Kjør sjekken på nytt. Går den igjen, er det harnessen som må fikses. |

Begge holder porten rød, for et urevidert spill skal ikke nå elevene. Men de har ulik årsak.

**Bakgrunn (PR #246, 25.07.2026):** første PR som noensinne trigget porten ble flagget to ganger
på rad, og begge gangene var det harnessen på en kald runner - ikke spillet. Først røk
`page.goto` på 30s-timeouten fordi Vite måtte transformere hele modultreet ved første sidelast;
så ble avbrutte manifest-/registry-fetch bokført som «Failed to fetch» på spillet. Lærdommene er
bygget inn nå: harnessen varmer opp dev-serveren og venter på `networkidle`, det endrede spillet
legges **sist** i lista (så det ikke betaler oppstartsregningen), infrastruktur-funn retryes én
gang, og porten klassifiserer i stedet for å påstå. Kjører du auditen lokalt: en varm
`node_modules/.vite` skjuler nettopp denne feilklassen, så verifiser kaldt hvis du endrer harnessen.

Porten sjekker BARE det maskinelle. Den vurderer ikke om spillet er godt - det er ditt ansvar
før PR-en åpnes, se neste seksjon.

---

## Visuell egenrevisjon - obligatorisk før PR

Den mekaniske porten fanger krasj, begravd geometri og båt-på-land. Den kan ikke se om scenen er
stygg, om iscenesettelsen bommer på emnet, eller om spillet er kjedelig. **Det må du gjøre, og du
skal gjøre det med egne øyne - ikke anta.**

Rekkefølgen som faktisk avdekker noe:

1. `node scripts/audit-microgames.mjs --ids <din-id> --frames 4`
2. **Åpne alle fire rammene og se på dem.** Ikke bare den første. Nesten alle spill auto-roterer,
   så én ramme kan tilfeldigvis skjule at modellen står halvveis utenfor utsnittet.
3. Spill gjennom spillet med Playwright: fra start til `WinScreen`, og for sanntidsspill også til
   `LoseScreen`. Ta skjermbilde i hver fase, og se på dem.
4. Score mot sug-rubrikken over, ærlig. Under 7 av 10: bygg om.
5. **Skriv scorene i PR-body-en** sammen med hva du faktisk observerte i rammene.

Punkt 5 er poenget. En PR som bare sier «verifisert med Playwright» er ikke etterprøvbar - PR #246
sa nettopp det, og det var sant, men ingen kunne se hva som var sett. Skriv hva du så.

Dette gjøres av rutinen/agenten som bygger spillet, ikke i CI. Grunnen er kostnad: en AI-vurdering
i GitHub Actions ville krevd API-kreditt per natt, mens agenten som bygger spillet allerede har
skjermbildene og kan se på dem uten ekstra kostnad. Trenger du å gå gjennom MANGE spill på én gang
(der ingen kan se på 145 x 4 bilder), finnes `scripts/review-microgame-shots.mjs` som et manuelt
verktøy - bevisst ikke koblet til CI.

---

**Referanse-standard:**
- `src/components/microgames/FluktenOverMuren3D.tsx` - **sanntids-referansen**. Førstepersons
  flukt over dødsstripa: `PovCamera` (positionRef + løpe-bob), `AimPlane` (hold = løp, peker =
  styring, followCamera), jaktende lyskastere som bare ser BEVEGELSE (lesbar, rettferdig fare),
  `Mover`-patruljevakt med `onMove`-nærhet, `useMeter`-alarm med `onOverload`-fail,
  `useGameClock`-daggry, `DangerVignette`/`TimerPill`/`MeterBar`/`LoseScreen`, kamera-finale over
  muren, og selvspill-verifisert balanse (blind bot tas på ~5 s, seende bot vinner). Bruk denne
  som mal for alle sanntids-/action-former.
- `src/components/microgames/IngenmanslandMG.tsx` - **forsvar posisjonen-referansen**: førsteperson
  bak maskingeværet, bølger av `Mover`-lignende soldater, rate-basert skyting, løpsvarme-dosering,
  artilleri via tilfeldige pulser, gradert `useShake` + munningsglimt. (Bygget før action-kitet -
  nye spill bruker kit-primitivene i stedet for å hånd-rulle.)
- `src/components/microgames/VikingShip3D.tsx` - **flaggskipet**. Viser hele bredden av toolkitet:
  `Draggable` (dra kjølen på plass), `Hotspot` (klink bordgangene, reis masten), `SceneSlider` (morf
  langskip ↔ knarr), fler-stegs forvandling, `CameraRig` (cinematisk innflyvning), `useAmbience`
  (bølgelyd), `Burst` (feiringspartikler ved sjøsetting), pluss kontaktskygge/vignette automatisk.
  Bruk denne som mal for et rikt, direkte-interaktivt byggespill med alle de avanserte lagene.
- `src/components/microgames/Hamskiftet3D.tsx` - **stage-drevet scenespill**: en levende bygd som
  forvandles gjennom tre reformer (knapp-input via `ChoiceRow`-mønsteret, 3D som skuespill). God mal
  når kjernen er "valg → forvandling".
- `src/components/microgames/TidensFormer3D.tsx` - **abstrakt idé, immersiv iscenesettelse**:
  eskatologiens sirkulær-vs-lineær-tid som en levende klode i et lysende kosmos. Mal for å representere
  et abstrakt konsept romlig (`CompareToggle` + tidsdrevet forvandling), med egen himmel-gradient,
  atmosfære-glød og «drama fra emnet, ikke fra mørk UI».
- `TheodosianWalls3D.tsx` / `Colosseum3D.tsx` - enklere "inspiser objektet"-form, fortsatt gyldig for
  små romlige aha-er (eldre kode, ikke bygd på `kit/` enda).
