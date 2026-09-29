---
description: Lag et skamgøy, pent og lærerikt mikrospill (3D foretrukket, 2D når det gir det beste spillet) som bor inline i en artikkel. Konseptturnering, designbrief og kunstbrief først, så gråboks, så bygg på arkadeskallet, så portene. Brukes av nattsporet eiriksbok-daily-microgame og manuelt.
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

### Generatoren: rekkefølgen er kvaliteten

Kvaliteten avgjøres før første linje kode. Nattspillene som sto fast på Gøy 3, var svake allerede
som idé - ingen polering reddet dem. Derfor fem faser, og du går aldri videre før fasen er bestått:

1. **Konseptturnering** (steg 2a) - fem vidt forskjellige konsepter, en fersk dommer velger. Ingen
   konsept holder = fem nye konsepter til samme artikkel, med dommerens innvendinger som krav.
2. **Designbrief** (steg 2b) - vinneren skrevet ut i ti punkter.
3. **Kunstbrief** (steg 2c) - looken hentes fra emnets egen bildekultur.
4. **Gråboks** (steg 3a) - kjerneløkka med primitive former. Simuleringen må være grønn før du
   lager kunst, og en gråboks-diagnose gir de første grepene for Gøy.
5. **Bygg og porter** (steg 3b-5) - kunst, juice, tekst, så portene.

Fase 1-3 lagres i `docs/microgames/briefer/<id>.md` med seksjonene `## Konseptturnering`,
`## Designbrief` og `## Kunstbrief`. Selvspillet krever fila. Den er også hukommelsen: neste natt
leser de siste briefene for ikke å gjenta seg.

**Delt og unikt.** Det eleven ikke ser, deles: arkadeskallet, tekstlagene, lagring, lyd,
kvalitetsnivåer og selvspill. Det eleven ser, lages alltid nytt: verden, kamera, perspektiv, look,
HUD og sjangerløkke. Det finnes med vilje ingen sjangermaler og ikke noe stilbibliotek - eieren vil
ikke at spillene skal ligne hverandre (2026-09-28).

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

## Steg 2a - Konseptturnering (før alt annet)

Skriv FEM konsepter til artikkelen. De skal være vidt forskjellige, ikke fem varianter av samme idé.
Mellom hvert par skal minst to av disse være ulike: sjanger, perspektiv (ovenfra, fra siden,
isometrisk, førsteperson, bordplate, kart), kjerneverb og hvem eleven er (en person, en gruppe, en
institusjon, eller en ting - et brev, en mynt, et skip, et rykte).

Hvert konsept er fem linjer:
- **Tittel og krok** (én setning i du-form)
- **Kjerneverbet**, og hvorfor det er deilig i seg selv
- **Fagregelen** som «hvis du ... så ...»
- **Første fem sekunder** - hva eleven ser og gjør uten å lese
- **Hvorfor en 14-åring vil spille runde to**

Slik finner du gode konsepter:
- Let etter det i artikkelen som **beveger seg, vokser, sprer seg, går i stykker eller konkurrerer**.
  Der er det et spill. Et vedtak, en ideologi eller en tale er ikke et spill i seg selv, men følgene
  kan være det: hvem som får vite det, hvor fort det sprer seg, hva det koster.
- **Bytt ståsted.** Spill budbringeren, varen, sykdommen, ryktet, været. Det uventede perspektivet
  gir ofte det gøyeste og mest unike spillet.
- **Stjel verbet, ikke temaet,** fra spill elevene kjenner: Flappy Bird, Tetris, Snake, Plants vs.
  Zombies, Mario Kart, Overcooked, Fruit Ninja, Crossy Road, Mini Metro, Papers, Please, Reigns.
- **Les de siste fem briefene** i `docs/microgames/briefer/` og gjør noe annet.

**Dommeren.** Gi de fem konseptene til en fersk underagent som ikke har sett tankene dine. Den gir
hvert konsept 1-5 på «Gøy på papiret» (ville en 14-åring spilt dette i friminuttet?) og «Fagregelen
avgjør» (vinner den som har forstått mekanismen?), velger én vinner og sier hva som skal til for at
den blir en 5 på Gøy («løftet»). Prompten står i nattrutinen.

**Stoppregel:** Får ingen konsepter minst 4 på begge, er artikkelen ikke et godt spill. Bytt
artikkel - ikke lag et middels spill. Skriv alle fem konseptene, dommerens poeng og løftet i
briefen under `## Konseptturnering`.

## Steg 2b - Designbriefen

Designbriefen står i `docs/microgames/briefer/<id>.md` under `## Designbrief`, for vinnerkonseptet
med dommerens løft innarbeidet. Den tvinger fram de valgene som skiller et spill fra en quiz med
3D-pynt. Svar på alt:

1. **Fantasien.** Hvem er eleven i spillet, og hva vil de? («Du er leder for et jegerfølge. Du vil
   holde folket mett mens landet forsvinner.»)
2. **Kjerneverbet.** Det ene grepet eleven gjør hundre ganger per runde. Det skal føles godt i seg
   selv (male, kaste, styre, bygge, sikte, dirigere). «Klikke på riktig svar» er ikke et verb.
3. **Fagkjernen.** Hvilken mekanisme fra artikkelen er spillets REGEL? Skriv den som «hvis du ... så
   ...». (Stavkirken: «står stolpene i jorda, råtner de uansett hvor mye du maler».) Hvis regelen
   kunne byttes ut med en annen uten at spillet endret seg, er den pynt.
4. **Presset og valgene.** Hva eskalerer? (Havet stiger, været blir verre, fiendene blir flere, tiden
   går.) Hvilket nytt valg får eleven minst hvert 10. sekund? Selvspillet måler begge (`press`, `valg`).
5. **Tap.** Minst to måter å tape på, og hver dødsårsak gir et konkret tips som også er fagstoff.
6. **Seier.** Seieren følger plottet i artikkelen. Når eleven har gjort det historien sier var
   mulig, SKAL de vinne - uansett hvor mange poeng de har (Havet kommer: kommer du øst for
   Doggerbanken, vinner du, også vassende).
7. **En runde til.** Rekord, ranger med titler, funn/samleobjekter som bygger seg opp over runder,
   poengmultiplikator for dyktig spill.
8. **Sjanger** (fra katalogen under), **perspektiv** og **2D/3D** med begrunnelse.
9. **Look.** Én setning - detaljene står i kunstbriefen (steg 2c).
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

**Variasjonsregel:** Sjanger, perspektiv og kunstretning skal være ulik de tre siste nattspillene
(`sjanger` og `kunst` i `registry.ts`, og de siste briefene i `docs/microgames/briefer/`). Bruker du
en sjanger som allerede finnes i biblioteket, skal vrien være ny.

## Steg 2c - Kunstbriefen: looken kommer fra epoken

Spill blir ikke unike av en ny palett. De blir unike når looken kommer fra et sted, og det beste
stedet er emnets egen bildekultur. Hver epoke og hvert sted har sitt eget visuelle språk. Da blir
spillene forskjellige av seg selv, og looken lærer også bort noe.

| Emne | Hent looken fra (eksempler) |
|---|---|
| Oldtiden | Greske vasemalerier (svart figur på oker), egyptiske veggmalerier i profil, romerske mosaikker |
| Vikingtid | Urnes-ornamentikk, treskjæringen på Osebergskipet, Bayeux-teppets broderte lin |
| Middelalder | Kalkmalerier i kirker, illuminerte håndskrifter med bladgull, kart med sjøormer |
| Renessanse | Leonardos skisser i blekk og sepia, perspektivtegning, kobberstikk |
| Industrialisering | Tekniske tegninger, sot og messing, tidlige fotografier i sepia |
| Mellomkrigstid | Ekspresjonistiske plakater, Bauhaus, avistrykk med raster |
| Andre verdenskrig | Operasjonskart, propagandaplakater, radarskjermer, sensurerte brev |
| Kald krig | Sovjetisk konstruktivisme, sivilforsvarsplakater, grønn CRT-skjerm |
| KRLE | Religionens egen kunst: ikoner, mandalaer, kalligrafi, glassmalerier |
| Samfunn i dag | Infografikk, t-banekart, mobilskjermer, gatekunst |

Tabellen er eksempler, ikke en meny. Finn den mest særegne kilden for akkurat ditt emne.

Kunstbriefen (`## Kunstbrief` i briefen) svarer på:
1. **Kilden.** Hvilken bildekultur, og de 2-3 kjennetegnene som gjør den gjenkjennelig.
2. **Palett.** 4-6 hex-farger hentet fra kilden, med rolle (bakgrunn, spiller, fare, gevinst, tekst).
3. **Form og overflate.** Flate farger eller tekstur? Konturer? Hvordan ser en figur ut?
4. **Lys.** Tid på døgnet, retning og stemning - eller flatt lys, hvis kilden er flat.
5. **Perspektiv og kamera.** Ulikt de tre siste spillene.
6. **Typografi og HUD.** Hva i kilden kan HUD-en være (et stempel, en marg, en kartlegende)?
7. **Slik lages det på en Chromebook.** Konkrete teknikker, se under.
8. **Ikke slik.** Hva det IKKE skal ligne (de tre siste spillene, grønn plen-diorama).

Skriv kilden kort i registry-feltet `kunst` («Greske vasemalerier: svart figur på oker, rød kant»).

**Teknikker som gir særpreg uten å koste på `lav`:**
- Cel-skygge (`MeshToonMaterial` med `toonGradient` fra kitet) eller helt flate farger i stedet for
  realistisk PBR.
- Konturer med omvendt skall: en litt større kopi med `side: BackSide` i mørk farge. Ett ekstra draw
  call per sammenslått figur.
- Prosedyrale teksturer tegnet i canvas ved oppstart (papirfiber, lerret, raster, tresnitt-streker,
  sprekker), lagt på som `map` og gjenbrukt.
- Vertex-farger i stedet for mange materialer.
- Tåke og farget bakgrunn i stedet for mye geometri i horisonten.
- En enkel fullskjerm-shader (papirkorn, raster, vignett) er billig. Bloom er det ikke og skal aldri
  bære looken - den er av på `lav`.

Looken må se ferdig ut på `?kvalitet=lav`. Høyere nivåer legger til, de redder ikke.
Likhetsvakten (port 2b) sammenligner plakaten med alle andre spill og stopper spill som er for like.

---

## Steg 3a - Gråboksen: er løkka gøy med klosser?

Bygg først bare spillreglene og kjerneløkka med primitive former (bokser, kuler, flate farger) -
ingen kunst, ingen juice. Målet er å finne ut om spillet er gøy før du bruker tid på å gjøre det
pent. Det første nattspillet som ble avvist, brukte tre runder på utseende; problemet var løkka.

1. Spillreglene i en ren `.ts`-modul (`<navn>/game.ts`): tilstand, `update(g, dt, input)`, og
   tellerne `valg` og `press` (steg 4).
2. En enkel visning (canvas, eller R3F med bokser) og input.
3. Robotene i en ren `<navn>/bots.ts`: vinner, `middels`, taper som ignorerer fagkjernen, og
   `tilfeldig`. Tilfeldighet i robotene kommer fra en `rng`-parameter, ikke `Math.random`.
4. `<navn>/sim.ts` - simuleringskontrakten (`SimSpec` i `sim.ts`): `create(seed)`, `step(w, dt)`,
   `snapshot(w)` og robotene med samme navn og `forventer` som i `usePlaytest`. Adapteren er tynn:
   lag spillet, ta ett steg, les av tilstanden. Referanse: `stranda/sim.ts` (seed i spillet) og
   `plottebordet/sim.ts` (seier og tap via `io.win()`/`io.lose()`).
5. Balanser med simuleringsporten - 200 seedede runder per robot på sekunder, uten nettleser:
   ```bash
   npx tsx scripts/sim-microgame.mts --ids <id>
   ```
   Den kjører samme tidssteg (`PLAYTEST_DT`) og robottakt (`BOT_EVERY`) som nettleseren, og måler
   andeler og medianer, ikke myntkast. Kjør den så ofte du vil - det er gratis.

**Balansen avgjøres i simuleringen, ikke i nettleseren.** Til 29.09 spilte nettleser-selvspillet
8-10 hele runder i swiftshader (35 minutter i CI, 15-20 minutter per runde i sky-miljøet) og
avgjorde ferdighetstrappen med én eller to runder - omtrent hver tiende grønne balanse ble meldt
rød. Nå er nettleseren en røyktest (steg 5), og den sammenligner vinnerrunden sin med simuleringen.

Er simuleringen ikke grønn: endre spillreglene ut fra «Vanligste tap». Først etter tre ulike
forsøk på kjerneløkka som alle er røde, byttes det til nest beste konsept.

### Gråboks-diagnosen: grep for Gøy før kunst

Når simuleringen er grønn, og FØR kunsten lages: ta tre skjermbilder av gråboksen midt i en runde
og la en fersk underagent gi Gøy (1-5) og de tre endringene i kjerneløkka som ville løftet den mest,
ut fra bildene, simuleringsrapporten (`.screenshots/playtest/_sim.md`) og kjerneløkka beskrevet i
tre setninger. Gjør endringene. Under 4: én diagnose til etter endringene. Så lages kunsten uansett.

Diagnosen er en oppskrift, ikke en port. 29.09 brukte den som port: tre konsepter fikk Gøy 3 i
gråboksen, alle ble forkastet, og natten leverte ingenting - selv om vurdereren sa at Seinen snur
ble «et klart 4-tall» med to konkrete grep. Kjerneløkka skal være riktig før kunsten (Thranittene
27.09 pyntet på en løkke som aldri ble endret), men juice, lyd og kunst er en stor del av Gøy, og en
gråboks kan ikke vise dem.

## Steg 3b - Bygg på arkadeskallet

Alle nye spill bygges på arkadeskallet i `src/components/microgames/arcade/`. Skallet gir
spill-følelsen gratis, og HVERT spill kler det i sitt eget tema.

| Del | Fil | Hva den gir |
|---|---|---|
| `ArcadeStage` | `arcade/ArcadeShell.tsx` | Spillvinduet (høyde `clamp(420px, 70vh, 640px)`, fullskjerm-klar via `data-mg-stage`), tema-variabler, `below` for lesetekst under vinduet |
| `ArcadeScreen`, `ArcadeLogo`, `ArcadeTag`, `ArcadeBigButton`, `ArcadeSmallButton`, `ArcadeStats` | samme | Startskjerm, pause og slutt-skjerm med stor CTA |
| `useArcadeLoop` | `arcade/useArcade.tsx` | 2D-canvasløkke med callback-refs, pause utenfor skjermen, feilsikker frame |
| `useArcadeText(GAME_ID)` | samme | All tekst i spillet: banner, lapper festet til ting, lærings-øyeblikk i sakte film, «Dette skjedde» og poengtekst. Se «Tekst i spillet» under |
| `ArcadeLessons` | `arcade/ArcadeLayers.tsx` | «Dette skjedde» på slutt-skjermen |
| `ArcadeTheme` | `arcade/tokens.ts` | Farger, font, vekt, radius, strek, skygge, tilt, HUD-stil, bannerposisjon |
| `createArcadeSynth`, `buzz` | `arcade/synth.ts` | Web Audio-lyd uten Tone/three, felles lydav |
| `useArcadeSave`, `rankFor`, `nextRank` | `arcade/save.ts` | Rekord, antall runder, funn, ranger |
| `usePlaytest`, `playtestSpeed` | `playtest.ts` | Selvspill-kontrakten (steg 4) |
| `SimSpec`, `simRound`, `silent` | `sim.ts` | Simuleringskontrakten (steg 3a) |

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
- **Egen HUD, ikke bare egne farger.** Å bytte farger på Stavkirkens HUD (poeng oppe til venstre,
  tilstandsbar i midten, år og pause oppe til høyre) er ikke et eget uttrykk - vurdereren trakk for
  nettopp det på det første nattspillet. Bygg HUD-en ut fra fantasien: en lønnslipp, et kompass, et
  instrumentpanel, en krittavle, et kart i hjørnet. Plassering, form og typografi skal skille seg fra
  referansespillene.
- **Tekst står der blikket er** - se neste seksjon. Ingen toast, ingen tekstlinje under spillet.
- **Fullskjerm** kommer fra `MicroGameFrame` (knappen og `[data-mg-stage]`). Pakk alltid spillet i
  `<MicroGameFrame title=... bleed>`.
- **Mål i HUD-en.** Eleven ser hele tiden hva som er seier (år igjen, avstand, en målbar).
- **Pause** på Esc/P og når vinduet scroller ut av syne.
- **Designet for fullskjerm, 1366×768.** Fra artikkelen åpnes spillet alltid i fullskjerm (se
  «Fullskjerm-først»). Lag HUD, brikker og tekst for den flaten - ikke for en smal spalte.

### Fullskjerm-først

Fra artikkelen åpnes spillet alltid i fullskjerm (eier, 2026-09-26): «Spill»-kortet i artikkelen ber
om fullskjerm i samme klikk, og der nettleseren ikke tillater det (iPhone), fyller spillet hele
vinduet. Lukker eleven fullskjermen, blir spillet stående i artikkelen. Det gir 2-3 ganger så stor
flate som spalten (1366×768 på en Chromebook mot rundt 720×540).

- Design HUD, brikker og tekst for fullskjerm 1366×768 - det er slik eleven møter spillet.
- **Startkortet er spillets plakat.** I artikkelen er spillet et kort med et ekte skjermbilde
  (`cover`), tittel og én setning i du-form (`hook`) som sier hvem eleven er og hva som står på
  spill («Du er kontrolløren. Radaren ser dem komme - rekker du det?»). Et navn som «Plottebordet»
  sier ingenting før man har spilt - bildet og kroken er det som får eleven til å trykke.
  Selvspillet lager coverbildet: `node scripts/playtest-microgame.mjs --ids <id> --cover`
  (bilde fra vinnerrunden etter 20 s, uten HUD og tekst; `--cover-at N` for et annet sekund).
  Commit `public/images/microgames/<id>.webp` sammen med spillet.
- **Innflygingen:** når eleven trykker «Spill», vokser plakaten fra kortet til hele skjermen med
  tittel og krok, og toner over i spillets meny når spillet er klart (`MicroGameIntro`). Det
  skjer av seg selv - men det betyr at menyen i spillet ikke trenger å selge spillet på nytt.
  Hold menyen kort: tittel, valg som er fagstoff, stor startknapp.
- Spillet må fortsatt virke i spalten (læringsstier viser det der), men det er reserven.
- Selvspill-porten spiller i fullskjerm, så bildene vurdereren ser er det eleven ser.

### Tekst i spillet - der blikket er

Eleven ser på spillet, ikke under det. Tekst under spillvinduet blir ikke lest (eier, 2026-09-26),
og en toast over midten dekker det eleven skal treffe. Fagstoffet i de første nattspillene sto
nettopp der - i en linje ingen leste. Derfor har skallet bare fire måter å si noe på, alle i
`useArcadeText`:

| Verktøy | Når | Regel |
|---|---|---|
| `banner(tittel)` | En ny fase, dato eller hendelse | 2-4 ord («15. AUGUST», «STORM FRA VEST»). Aldri en setning |
| `point(nøkkel, tekst, anker)` | Noe eleven må se eller gjøre akkurat nå | Maks 7 ord, festet med pil til tingen det gjelder. `until:` fjerner den når eleven har gjort det |
| `beatOnce(nøkkel, tittel, setning, { at, until })` | Fagkjernen: det øyeblikket eleven MÅ forstå for å spille riktig | Spillet går i sakte film, kortet står ved hendelsen til eleven gjør handlingen eller trykker «Skjønner». Bare første gang, maks tre per runde. Én setning, maks ~20 ord |
| `lesson(nøkkel, tekst)` | Alt som er fagstoff å sitte igjen med | Samles gjennom runden, de tre viktigste vises på slutt-skjermen under «Dette skjedde». Samme nøkkel igjen = viktigere |

- **Vis før du forteller.** Det beste er at verden viser regelen: sedlene som krymper, plottet som
  dukker opp over havet. Tekst er for det verden ikke kan vise.
- **Lærings-øyeblikket er undervisningen.** Første gang fagkjernen spiller inn, fryser spillet
  nesten, og ett kort forklarer hva som skjer og hva eleven skal gjøre. Det er da eleven lærer.
- **«Dette skjedde» er refleksjonen.** Knytt læringspunktene til det eleven faktisk gjorde (et raid
  snudd over havet, en flyplass tatt på bakken), ikke til en generell fasit.
- **Ankere:** `point`/`beatOnce` tar en funksjon som gir et punkt i spillvinduet (piksler). I 3D:
  projiser verdenspunktet med kameraet (se `toScreen` i `Plottebordet3D.tsx`). I 2D: samme
  regnestykke som tegningen (se `toScreen` i `HavetKommer.tsx`).
- **Sakte film:** gang spillets dt med `text.timeScale()`, ellers står ikke spillet stille mens
  kortet står.
- Selvspill-porten sjekker ordgrensene, antall lærings-øyeblikk og at slutt-skjermen har «Dette
  skjedde».

### Skarp tekst i 3D

Skilt, prislapper og etiketter i 3D-scenen tegnes med `crispCanvas(w, h)` fra kitet: den lagrer 2-3
ganger så mange piksler som de logiske målene og slår på mipmaps. En vanlig 256×72-canvas blir
uskarp på skjermer med høy pikseltetthet (eier om Løp med lønna: «vanskelig å lese»). Tekst eleven
MÅ lese, hører uansett hjemme i en lapp (`point`), ikke i en tekstur.

### Chromebook først - skaler opp, aldri ned

Nesten alle elevene har en billig Chromebook (Celeron/Intel UHD, 4 GB, 1366×768). Spillet skal
være godt der - og se enda bedre ut på en bedre maskin (eier, 2026-09-26: «alt skal alltid kunne
kjøres på en crappy Chromebook, men vi vil ha den beste grafikken vi kan»).

- **Kvalitetsnivå** (`kit/quality.ts`): `MicroCanvas` gjetter `lav`, `middels` eller `hoy` fra
  maskinvaren og justerer etter målt bildeflyt. Kitet skalerer selv: pikselbudsjett, skyggekart
  (512/1024/2048), kontaktskygge (av/én gang/levende), bloom (av på lav) og partikler.
- **Egne effekter:** les `useQuality()` i spillet og skaler pynt med `detail` og
  `particleScale` (flere trær, folk, røyk på `hoy` - aldri mer enn spillet tåler på `lav`).
  Spillmekanikken skal være lik på alle nivåer.
- **Budsjett på lav (Chromebook):** maks ~350 draw calls og ~700k trekanter per bilde, og
  spillogikken skal være lett (JS per bilde under 22 ms med prosessoren strupet 4x).
  Gjentatte ting (trær, gjerder, kors, folk) er instanser (drei `<Instances>`/`<Instance>`, se
  dalen i `stavkirken/world.tsx`), og en figur av mange småbiter slås sammen til én geometri med
  `mergeParts` fra kitet (se flyene i `plottebordet/world.tsx`). Hundre løse mesher er hundre
  draw calls.
- **Kitet gjør mye selv:** skyggekartet tegnes bare hvert 3. bilde på lav og hvert 2. på middels,
  og fjell eller annen fjern kulisse skal ikke kaste skygge.
- **Test det:** `?kvalitet=lav` i adressen tvinger nivået. Selvspillet kjører en egen
  Chromebook-runde (CPU strupet 4x) og stopper spill som sprenger budsjettet.

### Ytelse - hakk er en spillfeil

- **Aldri `setState` i spillkomponenten for hver melding eller poengtekst.** Da tegner React hele
  3D-treet på nytt, og spillet hakker midt i kampen. `useArcadeText` har egne lag som ikke rører
  spillet - bruk `text.float(...)` for poeng som spretter opp.
- **Bytt aldri `material.map` til `null`** (eller slå av/på andre shader-egenskaper) under spillet.
  Da kompilerer three.js shaderen på nytt - et synlig hakk hver gang. Bytt mellom teksturer og
  bruk `visible`.
- Ingen `new THREE.Vector3/Color` inne i `useFrame` - hold en på modulnivå.
- **Pikselbudsjett, ikke fast dpr.** `MicroCanvas` velger oppløsning ut fra vinduets størrelse
  (`kit/pixelBudget.ts`), så fullskjerm på en tett skjerm (XPS, Mac) ikke koster fem ganger så mye
  som spalten. Sett aldri `dpr` selv. Bruker spillet `KitEffects`, send `postprocessing` til
  `MicroCanvas` (slår av bortkastet kantutjevning). Bloom går i halv oppløsning.

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
        valg: /* beslutningspunkter så langt: +1 for hver ny trussel, tilbud, kurs å velge */,
        press: /* 0-1: hvor hardt spillet presser nå */,
        årsak: /* ved tap: hva som gikk galt, i klartekst («tanken avslørt dag 12») */,
    }),
    start: (variant) => begin(variant),        // hopp rett inn i en runde fra hvilken som helst fase
    bots: {
        seende:      { forventer: 'vinner', beskrivelse: '...', tick: () => { /* ett grep */ } },
        halvgod:     { forventer: 'middels', beskrivelse: '...', tick: () => { /* som seende, men treg */ } },
        'ignorerer-x': { forventer: 'taper',  beskrivelse: '...', tick: () => { ... } },
        tilfeldig:   { forventer: 'taper', tilfeldig: true, beskrivelse: 'tilfeldige lovlige grep', tick: () => { ... } },
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
- **Én `middels`** - en halvgod elev som følger fagregelen, men er treg eller unøyaktig (handler bare
  hvert tredje tick, eller velger nest beste). Den skal få flere poeng enn alle taperne og merkbart
  færre enn vinneren. Det beviser at det lønner seg å bli bedre - kjernen i «én runde til».
- **Én `tilfeldig: true`** - knappemoseren. Tilfeldige lovlige grep uten plan. Den skal tape. Vinner
  den, lønner det seg ikke å tenke.
- **`valg` og `press` i snapshot.** `valg` telles opp hver gang spillet gir eleven en ny beslutning
  (ny trussel, nytt tilbud, ny kurs). `press` er 0-1 og skal stige gjennom runden. Selvspillet krever
  minst 6 valg per spilt minutt, og at presset i siste tredjedel ligger minst 0,15 over første.
  Tall som er pyntet for å bestå porten (valg som ikke er valg), er juks - vurdereren ser det.
- **`årsak` ved tap.** Rapporten viser hvorfor hver runde ble tapt. Et rødt «vinneren tapte» uten
  årsak sender deg på gjetting; med årsak ser du feilen med en gang.
- **Robotene tikker i spilltid.** Selvspillet gir ett grep per 0,2 spillsekunder (`BOT_EVERY`), slik
  som simuleringen. Det krever `tid` i snapshot, og `--fart` er begrenset til 4.
- **Én kilde for robotene.** `usePlaytest` og `sim.ts` bruker samme `bots.ts` og samme robotnavn.
  Røyktesten melder det som funn hvis navn eller `forventer` er ulike.
- **Passiv spiller testes alltid** (ingen input). Den skal tape.
- `snapshot` og `tick` leser refs, ikke state (de kalles utenfor React).
- Alt er `import.meta.env.DEV`-gatet i `usePlaytest`; elevene får aldri robotene.

---

## Steg 5 - Portene (kjør lokalt til alt er grønt)

Det er tre porter. De to første er maskinelle og kjører også i CI. Den tredje er en uavhengig
vurdering som nattsporet gjør før PR-en åpnes.

### Port 0 - Simulering (`scripts/sim-microgame.mts`)

```bash
npx tsx scripts/sim-microgame.mts --ids <id>            # sekunder, ingen nettleser
```

| Sjekk | Grønt når (200 seedede runder per robot) |
|---|---|
| Spillbart | hver `vinner`-robot vinner minst 80 % |
| Utfordring | passiv og `tilfeldig` vinner høyst 5 %, andre `taper`-roboter høyst 10 % |
| Ferdighet | vinnerens median slår 90-persentilen til hver taper |
| Trapp | `middels` (median) over alle taperne og under 95 % av vinneren |
| Spillfølelse | median minst 6 valg per minutt, og presset stiger minst 0,15 fra første til siste tredjedel |
| Stabilt | ingen unntak, ingen runde som går forbi `maksSekunder` |

Rapport i `.screenshots/playtest/_sim.md`, med vanligste tapsårsak per robot. `sim.json` i
`.screenshots/playtest/<id>/` er fasiten røyktesten sammenligner seg med - kjør derfor port 0 før
port 1. Samme seed gir samme runde, så et rødt tall er ikke uflaks: det er spillet.

### Port 1 - Selvspill i nettleseren (`scripts/playtest-microgame.mjs`)

```bash
node scripts/playtest-microgame.mjs --ids <id>          # starter egen Vite
node scripts/playtest-microgame.mjs --ids <id> --url http://localhost:5173
```

En røyktest: en kort passiv runde (liv), én hel runde med vinnerroboten (filmstripen vurdereren
ser, og plakaten med `--cover`) og Chromebook-målingen. `--full` kjører den gamle porten med alle
roboter i nettleseren - bare til feilsøking når nettleser og simulering er uenige.
CI kjører med `--maks-tid 60` (vinnerrunden stopper etter 60 spillsekunder); lokalt og i nattsporet
går den hele runden, fordi filmstripen er det vurdereren ser.

| Sjekk | Grønt når |
|---|---|
| Samsvar | vinnerroboten taper ikke i nettleseren der simuleringen nesten aldri taper (under 1 % av rundene) |
| Roboter | samme robotnavn og `forventer` i `usePlaytest` som i `sim.ts` |
| Raskt i gang | synlig knapp i spillvinduet på startskjermen, og `start()` gir fase «spiller» på under 6 s |
| Liv | bildet endrer seg merkbart mellom 2 og 12 s uten input |
| Lesbart | tekst dekker ikke midten av spillet i mer enn 4 s i strekk (normalisert for spilltempo) |
| Tekst der blikket er | lapper maks 7 ord, banner maks 5 ord, maks 3 lærings-øyeblikk per runde, «Dette skjedde» på slutt-skjermen, ingen `below=` |
| Stabilt | ingen konsollfeil, ingen unntak i robotene |
| Merket | `sjanger`, `tone`, `hook` og `cover` (bildet finnes) i registry, `usePlaytest` i fila, eget `theme` |
| Brief | `kunst` i registry og `docs/microgames/briefer/<id>.md` med seksjonene Konseptturnering, Designbrief og Kunstbrief |

Rapport i `.screenshots/playtest/_playtest.md`, bilder per spill (meny, passiv 2/7/12 s, slutt-skjerm,
filmstripe av vinnerroboten). Spill bygget før generatoren (de fire første arkadespillene)
får tallene for brief og spillfølelse bare som notat.

### Port 2 - Scene-audit (`scripts/audit-microgames.mjs --ids <id> --strict --frames 4`)

Konsollfeil, båt-vakthund, begravd geometri, modell utenfor utsnittet. Se vedlegg E for hvordan du
leser en rød port.

### Port 2b - Likhetsvakt (`scripts/likhet-microgame.mjs --ids <id>`)

Sammenligner plakaten (`public/images/microgames/<id>.webp`) med plakaten til hvert annet spill:
fargehistogram (palett og stemning) og dHash (komposisjon og kameravinkel). Likhet 0,5 eller mer mot
et annet spill er rødt. Til sammenligning ligger de fire første arkadespillene 0,09-0,29 fra
hverandre, mens samme plakat med ny fargetone gir over 0,7. Rødt betyr: gå tilbake til
kunstbriefen og endre palett, kamera eller perspektiv - ikke flytt kameraet bare for å lure tallet.
Rapport i `.screenshots/likhet/_likhet.md`. Kjører også i CI.

### Port 3 - Uavhengig vurdering (ikke deg selv)

Den som bygde spillet, er den dårligste til å vurdere det. Gi vurderingen til en **fersk
underagent** (Agent-verktøyet, ny kontekst) som IKKE får se briefen, koden eller begrunnelsene dine.
Den får bare:

- artikkelens tittel og tre setninger om hva den handler om,
- skjermbildene fra port 1 og 2 (meny, filmstripe, slutt-skjermer, audit-rammene),
- simuleringsrapporten (robotene, ferdighetstrappen og spillfølelsen), selvspill-rapporten og
  likhetsrapporten,
- eierens tommel opp/ned på tidligere spill ved siden av poengene de fikk (nattrutinen henter dem),
- referansebildene i `docs/microgames/referanse/` (Havet kommer og Regnet i Lærdal),
- rubrikken under, og beskjed om å være streng og konkret.

Den svarer med poeng per akse og de tre viktigste forbedringene.

| Akse (1-5) | 1 | 3 | 5 |
|---|---|---|---|
| **Gøy** | Jeg ville lukket det etter 20 s | Greit å prøve én gang | «Én runde til» - eskalering, deilig verb, rekord å slå |
| **Utseende** | Primitive klosser på en grønn plen | Pent, men generisk | Eget uttrykk; lys, atmosfære og bevegelse som i et indiespill |
| **Lærerikt** | Fakta i tekstbokser, temaet er kulisse | Temaet preger spillet | Reglene ER fagstoffet - den som vinner, har forstått mekanismen |
| **Lesbart** | Vet ikke hva jeg skal gjøre | Skjønner det etter litt | Forstått på 5 s, mål i HUD, tekst står der blikket er, skarp tekst, «Dette skjedde» forklarer tapet |
| **Unikt** | Samme sjanger og look som et spill i biblioteket | Kjent form med egen vri | Sjanger + look som ikke finnes i biblioteket |

Referansespillene er kalibreringen, rekalibrert 2026-09-28: eieren syntes Regnet i Lærdal var
«interessant, men ikke sinnsykt gøy». Begge er derfor 3 på Gøy, 4 på Lesbart og 5 på Lærerikt, og 3
(Havet kommer) og 4 (Regnet i Lærdal) på Utseende. En 4 på Gøy betyr klart gøyere enn referansene.
MÅKA er en 5 på Gøy og Utseende.

**Terskel:** ingen akse under 3; Gøy, Lærerikt og Utseende minst 4; sum minst 20 av 25. Under
terskel: gjør forbedringene og få en NY vurdering (ny underagent) som også får forrige rundes
forbedringer og sier om de er løst. Et spill parkeres aldri; står en akse stille, endres
kjerneløkka for den aksen (under). Nattrutinen har et leveringsgulv for andre natt på samme spill
(se `daily_microgame_routine.md`, Jobb 4c).

**Når vurderingen står stille, er det spillet som må endres - ikke pynten.** Står en akse på
samme poeng to runder på rad, hjelper ikke flere farger, kameravinkler eller finere ringer. Gå
tilbake til designbriefen og endre kjerneløkka for den aksen:
- **Gøy under 4:** flere synlige valg per minutt, en trussel som vokser midtveis, et nytt
  element som dukker opp halvveis (ny motstander, nytt verktøy, nytt område), eller en
  risiko/belønning-avveiing eleven må ta hele tiden. «Ensformig klikking» betyr at eleven gjør
  det samme på samme måte - gi grepet et nytt formål eller en ny motstand.
- **Lesbart under 4:** færre ting samtidig, større mål, pil mot det som skjer utenfor bildet
  (lapper gjør det av seg selv), og hendelser som skjer ett sted om gangen.
- **Lærerikt under 4:** gjør fagregelen til en regel som faktisk avgjør utfallet, og la de
  historiske vendepunktene endre spillet (ikke bare vise et banner).
- **Unikt under 4:** bytt sjanger eller perspektiv - ikke farge.

Et svakt spill leveres aldri - men det gis heller ikke opp: er det fortsatt under terskel, lagres
det på en `claude/microgame-wip-*`-gren, og neste natt fortsetter rutinen der den slapp.

---

## Steg 6 - Registrer og embed (atomisk)

1. `src/components/microgames/<Navn>.tsx` (+ eventuell modulmappe). Default-eksport som tar
   `MicroGameProps`. Kall `onComplete({ score: 0-1, completed: true })` når runden er vunnet eller
   eleven har kommet langt nok til å ha sett poenget.
2. `registry.ts`: `const <Navn> = lazy(() => import('./<Navn>'));` og en oppføring med kebab-case
   `id`, `title`, `description`, `estimatedSeconds`, **`sjanger`**, **`tone`**, **`hook`**, **`cover`**
   (`'/images/microgames/<id>.webp'`), **`kunst`** (kilden fra kunstbriefen), `loader` og `Component`.
3. Embed i artikkelen: `{ "type": "component", "name": "MicroGame", "props": { "gameId": "<id>" } }`
   på et naturlig sted i teksten (etter avsnittet som forklarer fagkjernen), aldri etter Quiz.
4. **Commit spillfilene, registry, briefen og artikkel-JSON i SAMME commit.** Embed aldri i artikkel-JSON før
   spillet er committet: bildejobben (07:30) committer `public/content/` og har dratt med seg en
   halvferdig embed til main før - artikkelen viste «Mikro-spillet ble ikke funnet» i produksjon.
5. Rør ikke genererte filer (`content-index.json`, `manifest.json`-datoer, `global-timeline.json`,
   `stats.html`). Et mikrospill-diff skal bare inneholde spillet, registry, plakaten, briefen og én artikkel-blokk -
   da kan det ikke kollidere med andre nattjobber.

---

## Sjekkliste før PR

- [ ] Tone valgt; ikke et tema fra «ingen spill»-lista
- [ ] Konseptturnering: fem ulike konsepter, fersk dommer, vinneren har minst 4 på Gøy og Fag
- [ ] `docs/microgames/briefer/<id>.md` med Konseptturnering, Designbrief (ti punkter) og Kunstbrief (åtte punkter)
- [ ] Sjanger, perspektiv og kunstretning ulik de tre siste nattspillene; `kunst` i registry
- [ ] `<navn>/sim.ts`; gråboksen besto simuleringen, og grepene fra gråboks-diagnosen er gjort før kunsten ble laget
- [ ] Arkadeskall med eget `THEME`, mål i HUD, pause, lyd med lydav, designet for fullskjerm 1366×768
- [ ] Tekst via `useArcadeText`: fagkjernen som lærings-øyeblikk, korte lapper ved tingen, «Dette skjedde» på slutt-skjermen - aldri tekst under spillet
- [ ] Skilt og etiketter i 3D med `crispCanvas`; ingen `setState` per melding; ingen `map = null`
- [ ] `hook` (én setning i du-form) og `cover` (laget med `--cover`, committet) i registry
- [ ] `MicroCanvas postprocessing` hvis spillet bruker `KitEffects`; ingen egen `dpr`
- [ ] Kjerneverbet skjer i spillverdenen (3D: på objektene)
- [ ] Minst to tapsårsaker med tips; seier følger plottet
- [ ] Rekord/ranger/funn som gir «én runde til»
- [ ] `usePlaytest` med vinner, `middels`, taper som ignorerer fagkjernen og `tilfeldig`; `valg` og `press` i snapshot
- [ ] Looken ser ferdig ut på `?kvalitet=lav`
- [ ] Port 0 (simulering), port 1 (selvspill-røyktest), port 2 (audit `--strict`) og port 2b (likhetsvakt) grønne
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
- **Headless-GPU (swiftshader) gir 3-17 bilder/s.** Uten `playtestSpeed()` tar én runde en halvtime.
- **Hakk i Plottebordet (2026-09-26)** hadde to årsaker: hver «+340 SNUDD» var `setState` i
  spillkomponenten (hele 3D-treet tegnet på nytt), og raid-etikettene byttet `map` til `null`
  (shaderen kompilert på nytt). Begge er nå umulige i skallet / beskrevet under «Ytelse».

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
2. **Simulering** (`sim-microgame.mts`) og **selvspill-røyktest** (`playtest-microgame.mjs`) for
   berørte spill som har `sjanger` i registry (nye standard-spill). Et spill som er NYTT i PR-en,
   MÅ ha `sjanger`, `tone`, `usePlaytest` og `sim.ts` - ellers er porten rød.

Begge poster funnene sine som én PR-kommentar. Auto-merge (`auto-merge-bot-prs.yml`) venter til
sjekken er grønn og merger da selv.

| Melding | Betyr | Hva du gjør |
|---|---|---|
| «fant funn i spillet» (exit 1) | Ekte funn: balansen i simuleringen, nettleser uenig med simuleringen, tekst over spillet, konsollfeil, begravd geometri | Fiks spillet og push til branchen |
| «kunne ikke kjøre» (exit 2) | Harness/infrastruktur: kald Vite, død dev-server, timeout i `page.goto` | Ikke rør spillet. Kjør sjekken på nytt |

**Bakgrunn (PR #246, 25.07.2026):** første PR som trigget scene-auditen ble flagget to ganger av
harnessen på en kald runner, ikke av spillet. Derfor varmer harnessene opp Vite, legger det endrede
spillet sist, retryer infrastruktur-funn og klassifiserer i stedet for å påstå.
