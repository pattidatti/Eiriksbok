# Bryggen-motoren (arbeidstittel)

En liten, egen Three.js-motor for det store Bryggen-spillet. Den importerer ingenting fra
`src/games/engine/`, og de gamle spillene røres ikke.

- Blueprint og motor-audit: `docs/Design documents/bryggen-1429-blueprint.md`
- Gråboks: `/test/bryggen-graboks` (egen rute, ikke i galleriet). `?skygger=0` måler uten skygger.
- Første gård: `/test/bryggen-gard` (modulsettet, strømming, kai, Nikolaikirkeallmenningen og 14 nabogårder).
  Gå rett opp gårdsrommet og inn den åpne døra bakerst: schøtstua med ildstedet. Forhuset til venstre
  for kaia (vest) har bu-døra åpen: bua med tørrfisk, bismer og pult, trappa opp til lagerloftet og
  døra ut på svalgangen. Nikolaikirkeallmenningen (+x for gården) har torg med boder og brønn,
  rådhuset med svalgang man kan gå opp på, og kirketrappa øverst opp til Øvregaten. Gata går bak alle
  gårdene, 2 m opp, med norske hus og ølstua på nordsida (gå østover fra trappa), Nikolaikirken under
  reparasjon rett over trappa og Mariakirken lenger øst: inn porten i kirkegårdsmuren, langs gangstien
  og inn sørportalen. Kaia fortsetter forbi den siste gården til porten på Holmen, med borggården foran
  Håkonshallen innenfor.
  På torget står selgere i bodene, og kjøpere, en tjenestejente med bøtte, en fisker og en svenn går
  mellom bodene, brønnen og kaia. Snakk med kornselgeren og borgeren (de har samtaler).
  Døgnet går: 10 minutter dag og 8 minutter natt, med sol og måne som flytter seg og byger som kommer
  og går (`motor/dogn.ts`). `?lys=kveld|morgen|dag|graatt|natt` velger hvor døgnet starter (standard:
  kveld etter regnet), og `?dogn=0` stopper klokka og været.
  `?kvalitet=lav` slår av normal- og AO-kart, miljølys, skygger og etterbehandlingen. Knappen «Grafikk» øverst til
  høyre (eller G) bytter mens spillet går, og valget huskes i nettleseren (`bryggen-kvalitet`).
  Detaljkartene lastes først når full kvalitet brukes første gang.
- Figur og animasjoner: `public/games/bryggen/models/` (Quaternius UAL, CC0, se KILDE.md). I Bryggen
  får figurene klær (`motor/figur.ts`, draktene i `bygg/folk.ts`); gråboksen beholder mannequinen.
  Folk står, sitter og jobber i bua og schøtstua.
- Lyd: `public/games/bryggen/audio/` (CC0 og offentlig eie, se KILDE.md). Lyden starter ved første
  klikk eller Enter. «Lyd»-knappen øverst til høyre (eller M) slår av og på, og glidebryteren ved siden
  av er volumet. Valget huskes i nettleseren (`bryggen-lyd`).

## Oppbygning

| Mappe/fil | Hva |
|---|---|
| `motor/physics.ts` | Rapier, kollisjonsgrupper (verden, figurer, båter, tynne ting kameraet ignorerer) |
| `motor/input.ts` | Tastatur, mus, styrepute. Alt kan spilles med bare tastatur |
| `motor/character.ts` | KinematicCharacterController med akselerasjon, sving med vekt, hopp, klatring |
| `motor/animator.ts` | AnimationMixer: fartsblandet, fotlåst bevegelse + helkroppslag med toning |
| `motor/camera.ts` | Fjærarm med kulekast: går aldri gjennom vegger |
| `motor/boat.ts` | Færing med åretak |
| `motor/combat.ts` | Arkade-slagsmål og fiende-AI |
| `motor/gore.ts` | Blod som blir liggende |
| `motor/figur.ts` | Kler på UAL-riggen: hjørnefarge per bein, klær blåst ut fra beinet, musklene jevnet ut, skjørt, kappe og tut på hetta, pung, kroppsfasong. Én geometri og ett materiale per drakt |
| `motor/hode.ts` | Nytt hode i stedet for mannequinens egg: skalle, kjeve, hår/skjegg/hette, ører, hals, og ansiktet (øyne, bryn, nese, munn) |
| `motor/meshkit.ts` | Geometri-settet: bøtter per materiale, UV i meter, fargefaktor per hjørne, kollider-beskrivelser |
| `motor/materials.ts` | PBR-materialene (farge, normal, ARM) og miljølys fra en enkel himmel |
| `motor/streaming.ts` | Celler som lastes innen 120 m og kastes bak 180 m, nær- og middels-nivå, delt/samlet, innredning og tåkegrense |
| `motor/vann.ts` | Vågen: bølger regnet ut i pikselen, falsk speiling av bryggefronten, regnringer. Ingen teksturer, ingen ekstra tegning |
| `motor/maaker.ts` | Måker: én InstancedMesh, vingeslag i vertex-shaderen. Sirkler, daler, står på kaia eller vannet, letter i flokk når gutten kommer |
| `motor/regn.ts` | Regn: streker i en boks rundt kameraet, flyttet i vertex-shaderen. Ett tegnekall, av inne |
| `motor/dogn.ts` | Døgnet og været: klokka (10 min dag, 8 min natt), hvor sola og månen står, bygene (`Vaer`: skydekke, regn og vannet som renner av takene) og startpunktene for `?lys=` |
| `motor/stemning.ts` | Lysstemningene som nøkkelbilder etter solhøyden (natt, skumring, solnedgang, kveld, dag, og grå utgaver av dem). `Lyssetting` blander dem hvert bilde, eier sola (om natta månen) og halvkulelyset, tåka og de delte fargene, demper lyset inne og flytter skyggen med gutten |
| `motor/himmel.ts` | Himmelkuppelen: fargeovergang, skyer som driver, sola bak skyene, månen og stjernene om natta, og fjellene rundt Bergen (`FJELL`) som en profil langs horisonten. Tegnes etter alt som ikke er gjennomsiktig, med dybden bakerst |
| `motor/vaat.ts` | Våte flater: mørkere og blankere tre, flekker, pytter i gjørma og på steinen, tørt inne i rommene. Hektes på materialene i `Materials` |
| `motor/drypp.ts` | Drypp fra takskjeggene (`CellContent.drypp`, lagt inn av `tak` og `svalgang`) nær kameraet når det er vått. Ett tegnekall, falt i vertex-shaderen |
| `motor/luft.ts` | Røyk fra ljorene (ett tegnekall for hele byen) og støv i rommet kameraet står i: glimt og disflak som bare lyser i sollyset, så strålen gjennom døra synes |
| `motor/post.ts` | Etterbehandling på full kvalitet: SSAO (halv oppløsning), glød (kvart og åttendels), lysstråler fra sola, solglød i tåka, dis over Vågen, FXAA, fargetone, vignett, filmkorn |
| `motor/faering-modell.ts` | Færingen som modell: klinkbygd skrog med bordganger, stavner, ripe, tiljer og tofter |
| `motor/skrog.ts` | Skroget og riggen skipene deles om: klinkbygd skrog av tverrsnitt, stavner, dekk, mast, rå med beslått seil, vant, ror og konveks kollider |
| `motor/kogge-modell.ts` | Koggen: flatbunnet, høye sider, rette stavner, kasteller forut og akter, mastekurv, ror på akterstevnen |
| `motor/jekt-modell.ts` | Jekta: lavt, åpent skrog med bunter av tørrfisk midtskips, vengen akter, ett råseil |
| `bygg/skip.ts` | Skipene i Vågen: kogge og jekt fortøyd ved kaia, en jekt for anker. Gynger med bølgene, kollider mot færingen |
| `motor/rotter.ts` | Rotter: rusler langs vegger, snuser, piler i rykk, fryser når gutten står stille, flykter inn i hull og under ting. Soner, skjulesteder og et API til «Rottejakt på lagerloftet» (`skrem`, `fang`, `framme`, `onHendelse`) |
| `motor/rotte-modell.ts` | Svartrotta som modell (ca. 720 trekanter) og vertex-shaderen som animerer den: trav, sprang med strekk i kroppen, snusing, reise seg, halen. Pels som støy i pikselen |
| `motor/katter.ts` | Katter: én til tre i rottesonene (rom først, én ute). Rusler, sitter, vasker seg, sover sammenkrøllet, lusker lavt mot en rotte som er framme og kaster seg (`Rotter.fang` ved treff, `Rotter.skrem` ved bom), viker unna gutten når han løper mot den |
| `motor/katt-modell.ts` | Katten som modell (ca. 1450 trekanter) og vertex-shaderen: bein med ett ledd lagt ut med IK, gange, galopp, luske, sitte, vaske seg, sove i ring (ryggraden bøyd), kast, halen langs en kurve. Tabbystriper og pels i pikselen. Egen dybde-shader, så skyggen følger stillingen |
| `motor/lyd.ts` | Lydbildet med Web Audio: ute-buss med lavpass som lukker seg inne, inne-buss med romklang, løkker, korte lyder fra sprites, romlig lyd der lytteren følger kameraet |
| `motor/lydkobling.ts` | Hva som høres hvor: regn og vind etter været, bølger på kaikanten, ildstedet, måker og rotter der de er, fottrinn etter underlaget, åretak og vann mot skroget |
| `motor/ild.ts` | Åpen ild: flammetunger, glør og røyk (tre tegnekall per bål), og `flakk(t)` som lyset følger |
| `bygg/moduler.ts` | Modulsettet: laft med laftehoder, gavl, bordkledd fasade, torvtak, bordtak, vinsj, dører, glugger og utkraget overetasje |
| `bygg/inne.ts` | Hus man kan gå inn i: hule etasjer med hull for åpne dører og glugger, golv, bjelkelag med trappehull og rekkverk, trapp, terskelkiler, innergavler og åser |
| `bygg/bu.ts` | Bua og lagerloftet: tørrfisk i stabler og bunter, kornsekker, tranfat, bismer, skrivepult med gjeldsbok og kiste |
| `bygg/folk.ts` | Draktene (junge, husbonde, svenn, skutedreng, stuedreng, fisker og de norske byfolkene på torget) og folkene i en celle: animator, kollider, løkke på stedet, animasjon etter avstand, og de som går |
| `bygg/vandrer.ts` | Folk som går faste ruter: svinger, bremser, tar opp og legger fra seg bunter, stopper og sier fra når gutten står i veien |
| `bygg/samtaler.ts` | Hva folkene sier: samtalen med husbonden (de tre reglene, valg 1-3, «Dette vet vi»), korte replikker, og hva de sier når gutten står i veien |
| `graboks/baering.ts` | Bære bunter tørrfisk fra stabelen på kaia til bismeren i bua (E), og veiingen der |
| `graboks/bismer.ts`, `graboks/BismerVisning.tsx` | Veie på bismer: flytt hanken til stanga ligger vannrett og les av merket (nordisk bismer, SNL) |
| `graboks/folkstyring.ts` | Hvem gutten kan snakke med (E), samtalen som pågår og replikkene som vises som undertekst |
| `bygg/schotstue.ts` | Schøtstua innvendig: ildsted av stein, gryte i kjetting, langbenker, bord på bukker, ved |
| `bygg/gard.ts` | Den første gården: husplan, svalganger, trapper, kai på bolverk (med sidevegg der kaia hopper) |
| `bygg/allmenning.ts` | Nikolaikirkeallmenningen: gjørme, plankegang, kort kai, rådhuset (steinkjeller, laftet stue, svalgang og trapp), steintrappa opp til Øvregaten og støttemuren med den åpne grinda |
| `bygg/torgfolk.ts` | Folkene på torget: selgerne i bodene og rutene til dem som går (kjøpere, tjenestejenta ved brønnen, fiskeren og svennen på plankegangen), med et kart over hvor tingene står |
| `bygg/torg.ts` | Torglivet: salgsboder med tørrfisk, korn, kurver og tønner, brønn med vinde, slede med tønne og spor i gjørma (pyttene ligger i `vaat.ts`) |
| `bygg/nikolaikirken.ts` | Nikolaikirken på nordsida av Øvregaten, rett over kirketrappa: romansk steinkirke med vesttårn, under reparasjon etter brannen 1413 (nytt tak i vest, sperrer og stillas i øst), kirkegård med lav mur mot gata og stengt grind |
| `bygg/nabogard.ts` | Nabogårdene: trukket fra et frø (enkelt/dobbel, bredde, antall hus, høyde, torv/bordtak, svalganger, tone), aldri lik gården ved siden av |
| `bygg/mariakirken.ts` | Mariakirken utenpå: tvillingtårn, pulttak og saltak, strebepilarer, og kirkegården med mur, port, gangsti og gravkors (alt kolliderer) |
| `bygg/mariakirken-inne.ts` | Mariakirken som hule murer (sideskip med vinduer og sørportalen, arkaden, korbuen, koret) og rommet inne: steingolv, gravheller, trinn opp i koret, høyalter og sidealter med lys, krusifiks, bjelker. Presten og klokkeren |
| `bygg/buer.ts` | `murMedHull`: en mur med ekte hull tvers gjennom (dører, buer, vinduer), rund eller spiss bue, med kollidere |
| `bygg/stein.ts` | Det steinbyggene deler: kleberstein-tonene, `paFlate`, `apning` (vindu eller portal, med eller uten mørk fylling), gesimser |
| `bygg/ovregaten.ts` | Øvregaten bak gårdene: støttemur med brystning, plankeveit, norske hus med smug og gjerder, ølstua med ildsted, folk som går og står. Celler langs x |
| `bygg/bergenhus.ts` | Veien fra kaienden til porten på Holmen (kai, plankevei, rampe, lagerhus) og borggården innenfor (bakke, ringmur og port som kollidere, trehusene, skriverboden, vaktene og skriveren) |
| `bygg/holmen.ts` | Holmen som kulisse forbi veien (+x): kastellet ved sjøen, ringmuren med porttårn (ekte gjennomgang nær), Håkonshallen med trappegavler, Kristkirken, Apostelkirken, trehus i kongsgården og bispegården. Statisk `THREE.LOD`; kolliderne står i `bergenhus.ts` |
| `bygg/stranden.ts` | Stranden på den andre siden av Vågen: glisne laftehus, naust, tømmer og et skip på stokker, trukket fra et frø. Én celle bak grensa, ingen kollidere |
| `bygg/bryggen.ts` | Scenen: Vågen, cellene langs bryggefronten, grenser |
| `motor/gestikk.ts` | Gester mens folk snakker: prateklippet (`Idle_Talking_Loop`) og vift, vink, kom hit, pek, nikk, rist, skuldre, bukk og rop dreid i figurens rom (`Animator.figurDrei`). `gestFra(tekst)` velger gest fra det som blir sagt |
| `bygg/personer.ts` | Navn og tittel over hodet for folk med `id` på plassen eller ruta |
| `bygg/oppdrag-data.ts` | Oppdragene: giver, mål (hendelser), mottaker, samtalene (tilbud, underveis, levering) og «Dette vet vi» |
| `graboks/oppdrag.ts` | Oppdragsmotoren: status, teller hendelser, merker («!», «?», grå «?»), steder med E, lagret i `bryggen-oppdrag` |
| `graboks/hoder.ts` | HTML over hodene: navneskilt, oppdragsmerke og snakkeboble som skrives fram. Skjult bak vegger (stråle fra kameraet) |
| `graboks/tyv.ts` | Tyven i gården: ute bare mens oppdraget hans er aktivt, roper over hodet, teller `slaa:tyven` |
| `graboks/flytere.ts`, `graboks/dev.ts` | Skadetallene i kampen, og utviklerverktøyene (flyttet ut av `game.ts`) |
| `graboks/` | Prøvescenen og løkka (faste 1/60-steg, interpolert tegning). Løkka kjører begge verdenene |

## Regler

- Simuleringen går i faste steg. Alt som flytter seg har `prevPos`/`pos` og tegnes interpolert.
- Kameraet leser input per bilde, simuleringen per steg.
- Tynne ting (stolper, rekkverk, tønner) legges i `prop`-gruppen så kameraet ikke kollapser.
- Trapper kolliderer som en kile (`Physics.addHull`) som står på bakken, med skråflaten gjennom
  midten av trinnene. En skrå plate med enden ned i bakken stopper figuren ved første trinn.
- Bein slås opp med navnet fra riggen via `findBone` (GLTFLoader fjerner punktum: `DEF-foot.L`
  heter `DEF-footL` i Three).
- Slagene veksler arm: høyre først, så venstre, og en ny rekke starter med høyre. Venstre kross er
  `Punch_Cross` speilet ved lasting (`mirror` i `animator.ts`). UAL har ikke et eget venstre krosslag,
  og jabben har for lite skulder i seg.
- Bygninger lages i kode av modulene og slås sammen til én geometri per materiale (`MeshKit`).
  Ikke legg til nye materialer for variasjon: bruk fargefaktoren (`tint`). Hvert materiale i en
  `MeshKit` er ett tegnekall, og ett til i skyggen.
- UV-ene er i meter. Hvor mange meter én tekstur dekker står i `materials.ts`. Laftestokkene er
  `LOG_H` = 0,24 m, og laftehodene følger samme mål.
- Hus bygges i eget rom: x på tvers, z innover fra gavlen mot sjøen, y opp. Verden: x langs sjøen
  (mot Holmen = +x), z innover fra bolverket, Vågen på -z. Three er høyrehendt, så +x ligger til
  venstre når man ser inn mot Bryggen fra Vågen.
- Kollidere i en celle beskrives som `ColliderSpec` og lages av strømmingen. Ikke kall
  `phys.addBox` direkte fra byggekoden, ellers blir de liggende når cella kastes.
- Svalganger og trapper har håndlist med prop-kollider. En 1 m bred trapp uten håndlist mister
  gutten sidelengs når kameraet følger etter.
- Gårdene (også den første) er én `MeshKit` per halvdel (forhusene med kaia, og resten innover),
  ikke én per hus. Da kan Three hoppe over halvdelen som er utenfor bildet eller skyggekameraet, uten
  at tegnekallene løper løpsk. Laftehodene til nabogårdene har 5 kanter (`hodeSeg`); de var to
  tredeler av trekantene. Én `MeshKit` per hus kostet den første gården 68 tegnekall fra Vågen.
- Lenger unna enn `SAMLET_R` (30 m fra gutten) tegnes halvdelene samlet (`CellContent.samlet`,
  laget med `slaSammen`): der ser man begge uansett. Den samlede kaster ikke skygge, for kula rundt
  hele cella traff nesten alltid skyggekameraet og doblet skyggetrekantene. Ny cellegeometri som er
  delt, skal ha et samlet nivå.
- Innredning (bua, schøtstua) bygges i en egen `MeshKit` per hus og går i `CellContent.inne`: den
  kaster ikke skygge (veggene skygger allerede for sola inne) og skjules bak `INNE_R` (30 m), der den
  bare er et mørkt hull bak en dør. Bua alene er ca. 75k trekanter.
- Bak `TAAKE_R` (110 m) tegnes ikke cella i det hele tatt: tåka er over 99 % tett der. Landemerker
  bruker `tynnTake`, og strømmingen kjenner dem på det og lar dem stå.
- Del modeller i én geometri per materiale (`mergeGeometries`) når delene ikke beveger seg hver for
  seg. Færingen var 13 tegnekall, nå 4 (skroget, innsida og én per åre).
- Mål tegnekall med fotokameraet og kjør strømmingen selv fra skriptet
  (`streamer.update(fotoPos, guttPos)`): programvare-GL bruker ofte over 250 ms per bilde, og da står
  spillets klokke stille (`dt = 0`), så cellene får aldri vite at kameraet flyttet seg.
- Kaifronten hopper mellom gårdene (`FRONT_JOG`). Cella som stikker lengst ut bygger sideveggen i
  bolverket (`kaiJog`), og stokkene går litt inn bak naboens front så hjørnet blir tett.
- Utviklerverktøy (bare i dev): `window.__bryggenFoto = { pos: [x, y, z], look: [x, y, z] }` låser
  kameraet til skjermbilder og måling fra Vågen; `window.__bryggenPos` viser hvor gutten står, og
  `window.__bryggenFolk()` hvor folkene i de lastede cellene står (drakt, posisjon, retning).
- Utkraging (`krag` i `HouseSpec`): hver etasje over den første står så mye lenger ut mot sjøen.
  `floorZ(s, i)` er framgavlen til etasje `i` og `frontZ(s)` den øverste; taket, gavltrekanten og
  vinsjen starter der. Bare forhusene krager, så husene bak i rekka ikke kolliderer med dem.
- Glugger og annen pynt som trekkes, bruker et eget frø (`rng` i `moduler.ts`). Da flytter ikke
  resten av gården seg når noe nytt legges til i trekningen.
- Hus med `inne` bygges hule av `laftKroppInne`, `inne.etasjer` fra bunnen (standard: alle, og da
  går rommet opp under taket). Etasjene over bygges lukket av `laftKropp(…, from)`. Utkraging virker
  også i hule etasjer. Åpne dører og glugger blir ekte hull; døra står slått inn mot veggen, og i de
  hule etasjene står gavldørene (bu-døra, loftsdørene) åpne. Ljoren (`inne.ljore`) deler taket i tre
  biter langs huset (`takBiter`), og midtbiten starter et stykke ned fra mønet. Med ljore er
  innsiden sotet og cella får schøtstua; uten blir det bu (`bu.ts`).
- `k.at(x, y, z, rot, fn, c)`: send med `ColliderKit` når `fn` lager kollidere, ellers havner de i
  rommet utenfor. (Uten den sto schøtstuas veggkollidere feil, og man gikk gjennom langveggene.)
- Golvet inne ligger 0,2 m over bakken, og autostep tar ikke den kanten. Hver åpen dør på bakkeplan
  får en usynlig kile over terskelen (`terskel`). Ting utenfor en åpen dør må stå minst en halv
  meter unna, ellers sklir gutten forbi døråpningen.
- Ildlyset er ett `PointLight` for hele byen, alltid i scenen, flyttet til nærmeste ildsted (innen
  24 m) av `world.update`. Ikke legg lys i cellene: et lys som kommer og går (også når nær-nivået
  skjules) tvinger Three til å bygge alle shaderne på nytt.
- Cellene kan ha `tick` (flammer), `ild` (ildsteder), `rom` (bokser man kan gå inn i) og `dispose`.
  Står kameraet inne i et `rom`, dempes sola, halvkulelyset og miljølyset mykt, så ilden tar over.
  Kameraet avgjør, ikke gutten: ellers blir rommet mørkt mens kameraet ennå står ute. `rom.demp` sier
  hvor mye (1 i schøtstua, 0,55 i bua der det ikke brenner ild og lyset kommer inn døra).
- Landemerker som skal synes over hele byen (Mariakirken, steinbyggene på Holmen) bruker `materials.tynnTake(key)`: kopier av
  materialene med halvparten så tett tåke, som følger kvalitetsbyttet. Med vanlig tåke er alt borte
  bak 100 m. Ikke bruk det på vanlige hus: da forsvinner dybden.
- Med `__bryggenFoto` satt strømmes byen rundt fotokameraet, ikke gutten, og lysdempingen inne,
  støvet og regnet følger også fotokameraet. Skyggen følger fortsatt gutten.
- `__bryggenMaaker` og `__bryggenVerden` (bare i dev): testskript kan flytte måker og skru regnet
  (`__bryggenLys.vaer.laas`, 0-1). `__bryggenPost.paa` slår passene i etterbehandlingen av og på
  (`ao`, `glod`, `straaler`, og `visAo` viser bare SSAO-bufferen), `__bryggenRoyk.paa` og
  `__bryggenStov.paa` røyken og støvet, `__bryggenLys` er sola og skyggen. `?regn=0` i adressen gir tørt vær, `?post=0` slår av etterbehandlingen.
- Lyset kommer fra stemningen (`stemning.ts`), ikke fra tall spredt rundt i koden. Form på lav
  polycount kommer av forskjellen mellom sol og fyll: kvelden har sol 3,4 mot fyll 1,05, grått vær
  1,5 mot 1,25. Stemningen er nøkkelbilder etter solhøyden (`KLAR` og `GRAA`), blandet hvert bilde
  og mot de grå når det trekker over. Gråboksen bruker alltid den grå og har ingen klokke.
- Fargene og retningene i `Lyssetting` (`c.*`, `solRetning`, `solen`, `maanen`) er delte objekter som
  endres på stedet. Legg dem rett i uniformene (himmelen, vannet, røyken gjør det), ikke kopier dem.
  `UniformsUtils.merge` kloner verdiene: legg objektet inn igjen etterpå (røyken sto stille i tid av
  dette før døgnet kom).
- `solRetning` er lyset som kaster skygge: sola om dagen, månen om natta. Byttet skjer mens begge er
  under horisonten (`lysFade` 0), så skyggen hopper ikke. Skyggekartet er 2048 når lyset står lavt og
  1024 ellers, byttet med slark.
- Miljølyset (`Himmellys` i `materials.ts`) lages på nytt hvert andre sekund, med samme PMREM-generator
  og samme størrelse, så ingen shadere bygges på nytt.
- Spillets rom er dreid mot kompasset: +x (mot Holmen) er nordvest (330°), -z (over Vågen) sørvest.
  Fjellene og sol- og månebanen er regnet om med den dreiningen. Derfor står sola bak gårdene om
  morgenen og lyser på bryggefronten fra midt på dagen til kvelden, og Ulriken står over enden av Vågen.
- Himmelen tegnes etter alt som ikke er gjennomsiktig, med `gl_Position.xyww` (dybde 1,0) og uten å skrive dybde.
  Tegnet først kostet den 1,7 ms i gårdsrommet: skyene ble regnet ut under hele bildet.
- Etterbehandlingen kjenner himmelen på dybden (1,0). Gløden rundt sola legges på i etterbehandlingen
  likt over himmel og tåke, ellers skiller de lag. Uten etterbehandling gløder himmelen litt selv.
- Vætan (`vaat.ts`) ligger i shaderen til materialene i `Materials`. Ting med egne materialer
  (figurer, færingen) blir ikke våte. Inne i de nærmeste seks rommene er det tørt.
- Støvet (`luft.ts`) får sol og skygge av Lambert. Uten skygger (lav kvalitet) ville det lyst i hele
  rommet, så det vises bare når sola kaster skygge. Disflakene er store og legges oppå alt bak dem:
  630 av dem kostet 14 ms i bua. Hold antallet lavt, og la dem forsvinne tett på kameraet.
- Fjellene er ikke geometri: himmelen regner ut en profil fra toppene i `FJELL` (posisjon fra ekte kart, høyde, bredde),
  sett fra kameraet. Retning, høyde og bredde per topp regnes på CPU-en i `Himmel.update`, og over den
  høyeste toppen hopper shaderen over alt. Med acos, atan og fem oktaver støy per piksel kostet de 2-3 ms
  fra Vågen; nå 0,1-0,5. De må være tunge av dis, ellers står de skarpere enn husene 100 m unna. Disen
  tetner saktere bak 1,5 km, ellers forsvinner Ulriken (4 km).
- Står kameraet i skyggen ute, løftes fyllyset og miljølyset (`Stemning.skyggeLoft`, `BryggenWorld.skygge`:
  fem stråler mot sola fire ganger i sekundet). Det er øyet som venner seg til mørket, og lyset de
  solbelyste veggene kaster ned i de smale gårdsrommene, som halvkulelyset ikke kan vise.
- Det drypper bare mens det regner og et par minutter etterpå (`Vaer.takvann`), ikke fordi bakken er våt.
- Takskjegg registreres med `MeshKit.takskjegg(a, b)` og går til cella som `drypp`. Nye hus av `hus()` får
  det gratis; andre tak man vil ha drypp fra, må melde skjegget selv. Dryppet faller til første kollider
  under (strålen tar med prop), og steder med under 0,3 m fall droppes (hovedtaket over svalgangstaket).
- Pyttene ligger i shaderen (`vaat.ts`), ikke som geometri. Store, blanke pytter så ut som snø på torget:
  de er små, mørke og ganske ru (0,34).
- Røyken kommer fra `CellContent.royk` (hullet i taket over ildstedet). De fire nærmeste ryker.
- Etterbehandlingen tegner scenen til en buffer som later som den er en XR-buffer
  (`isXRRenderTarget`). Ellers tonemapper ikke Three, og tåka blandes inn før tonekurven: alt i
  tåka blir lysere og blåere enn bildet eieren godkjente. Bufferen holder ferdige sRGB-piksler.
- Rendereren teller tegnekall for hele bildet (`info.autoReset = false`, nullstilt i løkka), fordi
  etterbehandlingen tegner to ganger.
- Vannet speiler ikke scenen. Speilingen sjekker strålen mot en tenkt vegg langs bryggefronten
  (høyde trukket per gård). Flytter fronten seg, må `frontZ` i `lagVann` følge med.
- Været eies av `lys.vaer` (dogn.ts). `world.regn` (0-1) leses derfra hvert bilde og styrer både
  regnstrekene og ringene i vannet. Testskript låser været med `__bryggenLys.vaer.laas(0.6)` (`null`
  slipper det), og stiller klokka med `__bryggenLys.still(sek)` (sekunder fra soloppgang; 600 er
  solnedgang, 840 midt på natta).
- Ting som ikke skal ha treårer (tørrfisk) lages av `raatre` innenfor `k.withUv(0.04, …)`: UV-ene
  krympes, så flaten får nesten én farge fra teksturen. Formen må da komme fra geometrien og
  `shade` per hjørne. Aldri 0: normalkartet trenger UV-er som endrer seg.
- Hold minst 1,5 m fritt der en trapp kommer opp. Gutten trenger plass til å gå av og snu.
- Figurer kles av `kleFigur(rig, drakt)`. Samme `navn` deler geometri, så variasjon er en ny drakt,
  ikke et nytt materiale. Fargen ligger i hjørnene, materialet heter `M_Main` (hvit), så `setTint`
  i kampen fortsatt virker. Geometrien slås sammen på et rutenett på 2 cm (`forenkle`): mannequinen
  har ca. 14k trekanter, mest leddkuler og fingre som ikke synes under klærne.
- Mannequinen er en bodybuilder i T-stilling. Klær som bare blåses ut fra huden, får brystmuskler
  og svære armer. Derfor: armene trekkes mot en jevn radius rundt beinet, overkroppen mot en
  ellipse per høyde, og kappa på hetta er et eget skall (`kappe`) som kroppen under trekkes inn
  under (`underKappa`). Mål aldri bredder med armene med: i hvilestillingen står de rett ut.
- Hodet er byttet ut (`hode.ts`): mannequinhodet har hjørner 6 cm fra hverandre og spiss hake.
  Små ting (øyne, nese) legges til etter `forenkle`, ellers smelter de sammen på 2 cm-rutenettet.
- Folk i en celle lages av `lagFolk(plasser, mats)` i cellas `build` og eies av cella: kolliderne går
  i `colliders` (prop, så kameraet ikke hopper), `tick` driver animasjonen og `dispose` tar figurene
  ut av `near` før cella kaster geometrien, siden figurgeometrien deles. Folkene står stille og har
  `frustumCulled` på; spilleren og fienden har det av.
- Sittende plasseres med `pos` midt på benkesetet: i `Sitting_Idle_Loop` står hoftene 0,33 m bak og
  0,54 m over riggens føtter (1,83 m høy rigg), og det passer benker på 0,45 m.
- Folk skal stå minst en drøy meter fra døråpninger og trappefoten, og helst langs veggen uten dør.
- Rottene bor i soner (`RotteSone`): rommene uten ild fra `streamer.rom()` (bua, lagerloftet), en smal
  stripe langs kaikanten foran hver gård og stripene inntil veggen under svalgangene. Ute er stripene
  smale med vilje: rotter midt i gårdsrommet på høylys dag skal ikke skje. Skjulestedene finnes med
  stråler når sona dukker opp (golv, ingenting oppå, en vegg eller ting innen 25 cm).
- Rottene styrer uten navmesh: noen få retninger rundt den de vil, en stråle fram og en ned (golvet må
  være der, og ikke mer enn et lite trinn). Kanten av sona er en usynlig vegg. Gjemte rotter tegnes
  ikke (`mesh.count` er bare de som synes).
- Lyden laster ingenting før første klikk eller tastetrykk (nettleseren krever det), og alle lydfilene
  er Opus i Ogg. Korte lyder ligger i sprites med oppslag i `lyd.json`; nye lyder legges inn der og i
  KILDE.md, med lisensen sjekket per fil.
- Fottrinnene kommer fra animasjonen: når et fotbein (`DEF-footL`/`DEF-footR`) har sunket minst 5 cm
  og stopper nær bakken, er det et steg. Underlaget avgjøres av `world.underlag(p)`.
- Lyder i rommet (rotter, fottrinn) går på inne-bussen; alt som hører hjemme ute går på ute-bussen og
  blir dempet gjennom veggene når kameraet er inne.
- `__bryggenRotter` (bare i dev): testskript kan lese og stille rottene, og kalle `update` med egen dt.
- Folk som går (`Rute` i `vandrer.ts`) har ingen veifinning: punktene legges der det er fritt, midt i
  gårdsrommet og et stykke inn fra kaikanten, og ting står inntil veggene. Ruta i den første gården og i
  nabogårdene står i `gard.ts` og `nabogard.ts`. De har ingen egen kollider: verdenen låner ut fem
  kapsler (`Physics.addMover`, prop-gruppen) til dem som er nærmest gutten. Vandrerne kolliderer ikke
  med hverandre, så gi hver sin fil langs z (se `torgfolk.ts`). `gjor` på et stopp spiller
  `Interact` uten å bære noe; `baer: 'botte'` på ruta gir en vannbøtte i stedet for en bunt; `samtale`
  på ruta gir en som går en hel samtale.
- Står gutten der en vandrer skal stoppe, blir vandreren stående og si fra. Testskript som snakker med
  noen ved en bod, må flytte gutten bort før de venter på at noen andre kommer dit.
- Animasjonen til folk oppdateres hvert bilde innen 16 m, 15 ganger i sekundet ut til 45 m, og de
  tegnes ikke lenger unna (`Takt` i `folk.ts`). Bak 13 m bytter figuren til det grove nivået
  (`GROV` i `figur.ts`, ca. 2,5k trekanter mot 6,7k) og kaster ikke skygge. Logikken til dem som
  går, kjører alltid.
- Overkroppsklipp oppå gangen (bære noe): `Animator.overlay('Baere_Over')`. Mixeren normaliserer
  vektene per bein, så `overlay` regner om vekten til andelen overkroppen skal ha.
- Cellenes `tick` får `CellCtx` (kamera, gutt og `si` for replikker). `snakkbare` i en celle er folk
  gutten kan snakke med; `samtale` på en `Plass` peker til en samtale i `samtaler.ts`.
- Programvare-GL i Playwright kan gi bilder over 0,25 s, og løkka kaster dem (fanebytte-vernet). Da
  står spillet nesten stille i testen. Test bevegelse med `?kvalitet=lav&post=0` og et lite vindu.
- Det gutten har gjort som folk husker, står i `SPOR` (`samtaler.ts`): bunter båret, juks, om fiskeren
  har merket det. `startNode` velger hvor en samtale starter ut fra det. Ikke lagret ennå.
- `game.ts` er nær 800 linjer. Nye systemer får egen fil i `graboks/` og hektes på med få linjer.
- Nikolaikirken og kirkegården står bak grensa for det spilleren kan gå på, og bruker `tynnTake` fordi
  tårnet er et landemerke. Bare muren mot gata kolliderer; grinda er stengt. Rådhuset går i
  allmenningens egne bøtter, så hele cella er ca. 15 tegnekall.
- `__bryggenKatter` (bare i dev): `still(i, tilstand, pos?, yaw?)` setter katt `i` i en tilstand og holder den der (til skjermbilder). Kattene bruker de samme sonene som rottene og leser `rotter.framme`; de tar ikke `onHendelse` (lyden eier den).
- Skipene (`bygg/skip.ts`) står ikke i en celle: de er få og synes over hele Vågen. Hvert skip er én
  `MeshKit` (ett tegnekall per materiale: `raatre` for treverk og seil, `mork` for tauverk) og én
  konveks kollider som står stille. De gynger etter `vannHoyde` i `vann.ts`, som må følge bølgene i
  GLSL-en der. Seilet er lyst `raatre` innenfor `withUv` (som tørrfisken). Fibrene i treteksturene går
  langs v, så bordene i skroget har v langs skipet.
- Ingen fil over 800 linjer.
- `MeshKit.quad` og `tri` leser bare `tint.hue`, ikke `tint.top`/`bottom` (det gjør bare `box`). Mørke
  åpninger laget med `quad`/`tri` må få skyggen som argument (`vShade`, `shade`), ellers blir de like
  lyse som veggen rundt.
- Trekanter (gavler) må ha hjørnene i rekkefølgen som gir normalen ut fra bygget: ved `z0` (−z ut)
  `(hw, …), (−hw, …), topp`, ved `z1` motsatt. Ellers kastes de bort når man ser dem utenfra.
- Holmen er statisk i scenen som en `THREE.LOD` (nær: stein og bordtak med tynn tåke, pluss trehusene i
  flat farge; langt unna, bak 100 m fra Holmen: alt i flat farge i ett tegnekall). Den skal synes fra
  hele Vågen, også der en celle ikke ville vært lastet. Den står `HOLMEN_D` (24 m) forbi kaienden; veien
  dit og borggården er celler (`bergenhus.ts`) med kolliderne for ringmuren, porten og hallen. Husene i
  `BORG_HUS` tegnes ikke av kulissen, men av modulsettet i borggårdscella. Stranden er en vanlig celle:
  den er borte i tåka fra kaia uansett.
- Alt folk sier, står i en boble over hodet (`Hoder.si`), ikke som undertekst. `CellCtx.si` tar føttene
  til den som snakker (`fra`), så boblen havner over riktig hode. Bare «Dette vet vi» står i panelet nederst.
- `Snakkbar` har `hode`, `gest` og `synlig`. Nye folk som skal snakkes med, lages av `lagFolk` og får dem gratis.
- Gester og kampkroppen legges på i `Animator.foerOppdatering` (én per figur): rett før mixeren, så de
  aldri legges på to ganger når figuren bare oppdateres 15 ganger i sekundet. Skulderbeina (`DEF-shoulder`)
  flytter hele armen mye: bruk overarmen.
- Riggen har nå også `Idle_Talking_Loop`, `Sitting_Talking_Loop`, `Sword_Attack`, `PickUp_Table`,
  `Spell_Simple_Shoot`/`_Enter`, `Crouch_Fwd_Loop`, `Walk_Formal_Loop` og `Idle_Torch_Loop` (31 klipp).
  Bygg `mannequin.glb` på nytt med `@gltf-transform` (resample, dedup, prune) fra
  `AnimationLibrary_Godot_Standard.gltf`, ellers forsvinner klipp.
- Kampen: rekka er jab, kross, svingslag (starten av `Sword_Attack`, sluppet før det dype utfallet). Tungt
  slag og avslutning er også svingslaget. Fienden velger kross, to jab eller et svingslag som går gjennom
  garden (varsles i oransje: rull unna). Lyd fra `kamp.ogg` via `CombatSink.lyd`; gutten får lysere stemme.
- Oppdrag: et mål er en hendelse (`veid`, `sted:<id>`, `snakk:<person>`, `slaa:tyven`). Steder meldes av
  cellene (`CellContent.steder`, f.eks. `bronn` og `gjeldsbok`). Et oppdrag uten mål er klart med en gang
  (et brev som bare skal leveres). `__bryggen.folk.oppdrag` i konsollen kan ta, telle og levere.
- Øvregaten ligger 2 m over gårdene (`GATE.y` = `NIKOLAI_Y`), og støttemuren foran (z 61,05-61,75) er
  grensa bakerst i gårdene. På land holder cellene grensene selv: brystningen på muren, gjerdene i
  smugene mellom husene (`GATE.gjerde`), kirkegårdsmurene, lagerhusene ved veien til Holmen og grensa
  rundt borggården. `bryggen.ts` har bare endene av byen, sikringer langt ute og grensene i Vågen.
- Gata deles i celler langs x (`gateCeller`), kuttet ved kirkegårdene. Gatecellene har `naerR: 45`
  (CellDef): fra gårdsrommene ligger gata bak husene, og det flate nivået holder i tåka der. Med vanlig
  NEAR_R kostet gata 38 tegnekall fra gårdsrommet. Lenger unna enn `SAMLET_R` kaster de ikke skygge
  (en kopi av gruppa uten skygge i `samlet`).
- En mur man skal gå eller se gjennom, bygges med `murMedHull` (buer.ts), ikke med en boks og en mørk
  `apning`. `apning(…, fyll = false)` gir bare steinkransen rundt det ekte hullet. Hull som står over
  hverandre (arkaden og lysgluggene over) må i hver sin `murMedHull`: hullene i én mur kan ikke
  overlappe langs muren.
- Et hult steinbygg med åpent tak trenger gavltrekantene også innenfra (`triMot` med normalen inn), og
  gesimsen som lister langs ytterveggene: `gesims` er en massiv plate og blir et himling inne.
- Rom som står skjevt (Mariakirken, 30°) har `yaw` på `Rom`. Test alltid punktet med `iRom(r, p)` før
  boksen. Skjeve rom får ikke rotter (sonene er akse-justerte).
- Lys som skal lyse selv (alterlysene) går i et eget `MeshBasicMaterial` som cella eier og kaster i
  `dispose`. Duker og voks går i `lodMaterial` (hvit med farge per hjørne). Ildlyset flyttes til
  alteret via cellas `ild`, som til ildstedene.
- Ølstua er et hus med `inne.ljore` som schøtstua (`schotstue()` lager ildstedet, benkene og plassene),
  med andre folk på plassene. Ilden der ligger i `inne`, så den skjules på avstand.
- Vakta står på bysida av porten, men eies av borggårdscella. Veien og borggården er alltid lastet samtidig.
