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
  `?kvalitet=lav` slår av normal- og AO-kart, miljølys, skygger og etterbehandlingen. G (eller
  Innstillinger i pausemenyen) bytter mens spillet går, og valget huskes i nettleseren
  (`bryggen-innstillinger`). Detaljkartene lastes først når full kvalitet brukes første gang.
- Filmscener: `?film=<id>` (`ankomst`, `prolog-ut`, `kap1-inn`, `vakta`, `kap1-ut`, `kap2-inn`, `kap2-jekta`, `kap2-ut`) spiller en film rett
  etter start, og i dev gjør `window.__bryggenFilm('<id>')` det samme midt i spillet. Filmen merkes som sett
  i lagringen (`bryggen-oppdrag`) også da. Et nytt spill (ingen lagring) begynner med `ankomst`.
- Figur og animasjoner: `public/games/bryggen/models/` (Quaternius UAL, CC0, se KILDE.md). I Bryggen
  får figurene klær (`motor/figur.ts`, draktene i `bygg/folk.ts`); gråboksen beholder mannequinen.
  Folk står, sitter og jobber i bua og schøtstua.
- Lyd: `public/games/bryggen/audio/` (CC0 og offentlig eie, se KILDE.md). Lyden starter ved første
  klikk eller Enter. M slår av og på. Hovedvolum og volum per buss (ute, inne, hendelser) står under
  Innstillinger i pausemenyen, og huskes i `bryggen-innstillinger`.
- Menyene (`ui/`): startskjerm (Enter = bare tastatur) med tittelen over første skudd av prologen. Spillet
  står bak startskjermen, og prologen begynner først når eleven trykker Start (`GrayboxGame.begynn`).
  Spillet fyller nettleservinduet; ekte fullskjerm er et valg i HUD-en og menyen. Pausemenyen på Esc med Fortsett,
  Innstillinger, Kontroller, Oppdrag og dagbok, og Avslutt. Alt styres med piltaster, Enter og Esc.
  Spillet står mens menyen er oppe (`GrayboxGame.pause`). I fullskjerm låses Esc (Chrome), så Esc
  åpner menyen i stedet for å gå ut av fullskjermen.

## UI-stilen (ui/stil.ts, ui/stil.css)

HUD, menyer og paneler har et eget uttrykk for hansabyen Bergen 1429: pergament og lin, blekkfarget
tekst, tjærebrunt og seglrødt. Overskrifter i Grenze Gotisch (gotisk, men lett å lese), brødtekst i
Alegreya Sans. Fontene er selvhostet (`@fontsource/grenze-gotisch`, `@fontsource/alegreya-sans`) og
lastes først når spillet lastes. Fortsatt lyst (blueprint §2): blekk på pergament er over 7:1.

- Nye paneler bruker eksportene i `ui/stil.ts`: `KORT`, `PANEL`, `ETIKETT`, `KNAPP`, `KNAPP_2`, `KNAPP_FARE`
  (det som ikke kan angres: «Begynn på nytt», «Avslutt»; `<Knapp farge="farlig">` i menydeler), og
  tilleggene `DISPLAY`, `TEKST`, `SVAK`, `HJELP`, `ROD`/`GRONN`/`VARM`, `RILLE` + `FYLL.*` (stolper),
  `BRIKKE` (tallbrikke 1-3), `TAST` (tast i lister), `UTHEV`, `STREK`, `LIN`, `FARGE` (hex til SVG).
- `ui/stil.css` ligger i Tailwind-laget `components`, så en Tailwind-klasse på samme element vinner.
- Tastaturfokus: seglrød ring med lys kant (`bry-fokus`, også `FOKUS` i `ui/fokus.ts`).
- «Oppdrag fullført» (`ui/Melding.tsx`): arket ruller ut, tittelen skrives med blekk som tørker, og et
  voksegl med en kogge (`ui/Segl.tsx`) stemples ned så arket rister og voksdråper spruter. Lyden er
  papir, et dumpt slag (`Lyd.stempel`) og klokkene (`LydKobling.oppdrag`). Med redusert bevegelse
  tones arket bare inn med seglet på plass.
- Navneskilt og snakkebobler (`graboks/hoder.ts`) i samme stil. Laget med hodene er egen
  stablingskontekst, så navn og bobler aldri legger seg over HUD-en eller menyene.

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
| `motor/portal.ts` | Portal-culling for innredningen: delt i biter på 1,5 m (`BatchedMesh` per materiale, fortsatt ett tegnekall), og hver bit tegnes bare når den kan synes gjennom en åpen dør, glugg eller ljoren. Står kameraet inne i huset eller i døråpningen, tegnes alt |
| `motor/figurlod.ts` | Nivåene til figurene: fin geometri med skygge nær, grov uten skygge bak 13 m (`FigurLod`), og frustum-culling med litt større kule for figurer som flytter seg (`cullFigur`) |
| `motor/streaming.ts` | Celler som lastes innen 120 m og kastes bak 180 m, nær- og middels-nivå, delt/samlet, innredning og tåkegrense |
| `motor/vann.ts` | Vågen: bølger regnet ut i pikselen, falsk speiling av bryggefronten, regnringer. Ingen teksturer, ingen ekstra tegning. Tegnes ikke innenfor skrogene (`settSkrog`) |
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
| `motor/seilduk.ts` | Seilduken (`MatKey` 'seil'): ett delt materiale for alle seil, tekstur tegnet på lerret én gang (duker, sømmer, lapper, bonnet, kanttau, skitt), kypert-vev som relieff på full kvalitet, vind og lys gjennom duken i shaderen |
| `motor/kogge-modell.ts` | Koggen: flatbunnet, høye sider, rette stavner, kasteller forut og akter, mastekurv, ror på akterstevnen |
| `motor/jekt-modell.ts` | Jekta: lavt, åpent skrog med bunter av tørrfisk midtskips, vengen akter, ett råseil |
| `bygg/seilheis.ts` | Seilet som heises og fires: duken rulles ut nedover fra råa og samles opp igjen før den beslås. Trafikken bruker den når skipene ankrer og seiler ut; jekta ved kaia (`torke` i skip.ts) henger seilet til tørk et par minutter av hvert femte når det er opphold |
| `bygg/skip.ts` | Skipene i Vågen: kogge og jekt fortøyd ved kaia, en jekt for anker. Gynger med bølgene, kollider mot færingen, og melder omrisset i vannlinja (`skrog`) |
| `bygg/trafikk.ts` | Trafikken i Vågen: koggen og jekta som seiler inn, ankrer (seilet beslås), snur og seiler ut i tåka; færinger med roere som ror faste ruter (ferja, lekteren, fiskeren) og viker for hverandre og for gutten; færinger fortøyd ved bryggene i Vågsbunnen |
| `bygg/vaagsbunnen.ts` | Vågsbunnen: Auta allmenning med trappa opp til Øvregaten, Skostredet med skomakerboder og verksteder, bryggetrapper, bommen over gata, folkene, og kulissen ved bunnen av Vågen med Korskirken (`endeCelle`) |
| `bygg/verksted.ts` | Verkstedboden: laftehus med dør og en luke som er slått opp over disken, skilt i en arm, og innredning per fag (skomaker, baker, gullsmed, buntmaker, barberer, smed) |
| `bygg/kirker-vaagsbunnen.ts` | Ruinen av Mikaelskirken (brant 1413) og Korskirken som landemerke |
| `bygg/nordnes.ts` | Nordnes over Vågen: åsen, Munkeliv kloster i lia og naust ved sjøen, i flat farge i ett tegnekall (`fjernLand`) |
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
| `motor/liv.ts` | Livet i figurene: hodet ser seg rundt og ser på gutten når han kommer nær, vekta flyttes, pusten, og holdningen per drakt (`HOLDNING`: krokete gammelkone, fyllik som henger med hodet). `FIN_GANG` går med `Walk_Formal_Loop`. Hver figur får egen takt og fase i hvilen og gangen (`Animator`), så ingen går eller puster i takt |
| `bygg/bakke.ts` | Bakken med form: toppen av gjørmeboksene er et rutenett med søkk, små hauger, hjulspor (`Fure`, `sporFurer`) og rusk (små steiner og flis). Søkkene ligger der pyttene kommer (`pyttStoy` er samme støy som i vaat.ts). `bakkeBoks` erstatter `k.box('gjorme', …)` |
| `motor/relieff.ts` | Relieff (parallax occlusion mapping) i gjørma og plankene i gårdsrommet: teksturoppslaget flyttes langs synslinja etter et høydekart (`_disp`), så stein og blader stikker opp og fugene har bunn. Bare på full kvalitet og nærmere enn 14 m |
| `bygg/uro.ts` | Ting som rører seg: `Uro` med `pendel` (skilt i vinden), `gynge` (vugge), `luke` (åpen om dagen, slår i vinden), `heis` (bunt opp under vinsjen), og `klesvask` (seilduk som vinden i shaderen blåser). `vind()` følger været (`koblVind`). Delene skjules bak 40 m |
| `motor/gestikk.ts` | Gester mens folk snakker: prateklippet (`Idle_Talking_Loop`) og vift, vink, kom hit, pek, nikk, rist, skuldre, bukk og rop dreid i figurens rom (`Animator.figurDrei`). `gestFra(tekst)` velger gest fra det som blir sagt |
| `bygg/personer.ts` | Navn og tittel over hodet for folk med `id` på plassen eller ruta |
| `bygg/oppdrag-data.ts` | Oppdragene: giver, mål (hendelser), mottaker, samtalene (tilbud, underveis, levering) og «Dette vet vi» |
| `graboks/oppdrag.ts` | Oppdragsmotoren: status, teller hendelser, merker («!», «?», grå «?»), steder med E, lagret i `bryggen-oppdrag` |
| `graboks/hoder.ts` | HTML over hodene: navneskilt, oppdragsmerke og snakkeboble som skrives fram. Skjult bak vegger (stråle fra kameraet) |
| `graboks/tyv.ts` | Tyven i natt (kapittel 1): venter ved loftsdøra, løper en fast rute over svalgangene og ned i smuget når gutten kommer nær, gjemmer seg om gutten mister ham, slåss i smuget. Etterpå: samtalen (ta ham med selv eller rope på vakta) |
| `graboks/system.ts`, `graboks/systemer.ts` | Krokene i løkka (`Spillsystem`) og listen over systemene som er hektet på: filmene, tyven og opplæringen |
| `graboks/sekvens.ts` | Sekvensverktøyet for filmscener (blueprint §6, §9.6): en tidslinje av kameraskudd (kutt, glid, sakte kjøring), figurer (klipp, gå langs et løp, vis/skjul, bære), replikker i bobler, tekst nederst og `gjor`-steg. Spilles i løkka, ingen video. Gutten står stille; Mellomrom, E eller Esc hopper over: da kjøres alle `gjor` som gjenstår og `slutt`, så sluttilstanden blir lik. Sett film lagres som flagget `film:<id>` |
| `bygg/filmer.ts` | Filmene som data: `ankomst` (prologen, koggen fra Lübeck legger til, bak startskjermen i et nytt spill), `prolog-ut` (etter «fisk»), `kap1-inn` (natt, vakt i gården), `vakta` (gutten ropte på vakta) og `kap1-ut` (morgenen etter, to utgaver etter valget). `koblFilmer` sier når de kommer. Kapittel 2 står i `bygg/filmer-kap2.ts` |
| `graboks/FilmVisning.tsx` | Filmen over spillet: svarte striper, teksten nederst, «hopp over», svart overgang |
| `graboks/opplaering.ts` | Opplæringen etter prologen: ett hint om gangen (gå, se deg rundt, snakk med E, ro), husket som `laert:<id>` |
| `bygg/sideoppdrag.ts` | Sideoppdragene fra blueprint §7.2 (rottejakt, skomakerverkstedet, jekta, messen, terningene): data og samtaler, lagt til `OPPDRAG`. `SIDE` holder det systemene husker (fisken, hvordan terningspillet endte) |
| `graboks/sidefolk.ts` | Bård ved jekta (egen celle, `CellStreamer.leggTil`) og hjelperne `finnPerson`, `naer`, `maalNaadd` |
| `graboks/rottejakt.ts`, `ui/Rottejakt.tsx` | Feller med agn på lagerloftet, katta, fisken som blir gnagd på |
| `graboks/syrytme.ts`, `ui/Syrytme.tsx` | Sy sålen hos mester Hans: hull glir mot nåla i takt med hammeren, A for øvre rad, D for nedre. Dømmes etter når tasten ble trykket (`InputFrame.trykt`), ikke når steget kom |
| `graboks/messe.ts`, `ui/Messe.tsx` | Lyset fra sidealteret til høyalteret (saktere gange, flammen slukner av løp og hopp), og svarene på latin (1-3) med bjella når presten løfter brødet. Stedene står i `mariakirken-inne.ts` |
| `graboks/terning.ts`, `ui/Terning.tsx` | Tre runder terning med Einar i ølstua, med jukseterningen fra Vågsbunnen (2) og sjansen for å bli tatt |
| `bygg/byen-oppdrag.ts` | Kongens menn på Holmen: «Budet til Bergenhus» (tre mål: spør vakta, hør dagens ord, si det i porten) og «Brann i lagerhuset», samtalene med høvedsmannen (om kongen) og gjaldkeren, og «Dette vet vi» om tyveribolken i bylova |
| `bygg/holmenvei.ts` | Kongens vaktbu på veien til Holmen: vaktsonen med staur og tau, vedstabler, kassestabler, kjerra og tønnene å gjemme seg bak, kongens skattefisk. `HOLMEN.xe` (kaienden) og `holmenVerden(u, y, z)` regner fra veiens rom |
| `graboks/holmenvakt.ts`, `ui/Snik.tsx` | Vaktene Ulf (runde) og Kolbein (speider ved vaktbua), og vakta i porten: synsfelt tegnet på bakken (stråler som stoppes av det som står i veien), synsmåler over hodet, vaktskiftet der ordet sies, porten som stenger uten ordet, tyveri av skattefisken |
| `graboks/ettersokt.ts`, `ui/Ettersokt.tsx` | Ettersøkt (blueprint §8.2): mistenkt, etterlyst, jaget. Synker når ingen ser gutten. Utveier: bot til en vakt (E), eller tatt og ført til gjaldkeren (svart overgang, dommen, tyveribolken) |
| `graboks/brann.ts`, `ui/Brann.tsx` | Brannen i lagerhuset: rop «Brann!», folk løper til en bøttekjede fra kaia, kast bøtta i takt (mellomrom), slå ut gnister på nabohusene (Q, E) |
| `ui/Aktiviteter.tsx` | Velger HUD-komponenten for aktivitetene i sideoppdragene (`HudState.system`), tegnet fra `ui/Hud.tsx` |
| `graboks/flytere.ts`, `graboks/dev.ts` | Skadetallene i kampen, og utviklerverktøyene (flyttet ut av `game.ts`) |
| `graboks/` | Prøvescenen og løkka (faste 1/60-steg, interpolert tegning). Løkka kjører begge verdenene |
| `ui/Hud.tsx` | HUD-en mens det spilles: liv, oppdragslista, meldinger, samtalen, E-tekstene, ytelsesboksen og systempanelene, i fire kolonner som stabler |
| `graboks/meldingko.ts` | Oppdragsmeldingene i kø: én om gangen, venter på samtaler, bobler og filmer |
| `graboks/maalmerke.ts` | Ringen og lyssøyla der gutten skal gjøre noe (bunten, oppdragssteder, systemenes `maal()`) |
| `ui/systemPaneler.tsx`, `ui/SystemHint.tsx` | Krokpunkt for HUD-paneler til systemene: `hud.system[navn]` tegnes av panelet som er registrert her (filmen over alt, hint fra tyven og opplæringen nederst) |
| `ui/Startskjerm.tsx` | Startskjermen: hva scenen er, start med mus eller bare tastatur |
| `ui/Pausemeny.tsx` | Pausemenyen (Esc): Fortsett, Innstillinger, Kontroller, Oppdrag og dagbok, Avslutt. Tastatur først |
| `ui/InnstillingerPanel.tsx`, `ui/innstillinger.ts` | Innstillingene (grafikk, skygger, lys og dis, lyd per buss, kamerafart, snu opp og ned, ytelse), lagret i `bryggen-innstillinger`. Leser og flytter over de gamle `bryggen-kvalitet` og `bryggen-lyd` |
| `ui/Dagbok.tsx`, `ui/vetlager.ts` | Dagboka: oppdragene med «om» og «hvor», og «Dette vet vi»-tekstene eleven har lest (`bryggen-vet`). «Begynn på nytt» bak en bekreftelse |
| `ui/stil.ts`, `ui/stil.css`, `ui/Melding.tsx`, `ui/Segl.tsx` | Den felles stilen (pergament, blekk, segl), oppdragsmeldingene med seremonien for «Oppdrag fullført», og voksseglet |
| `graboks/rpg.ts`, `bygg/rpg-data.ts` | Rollespillet (blueprint §8.3-8.6): rykte hos fem fraksjoner, pungen, ferdigheter som blir bedre av bruk, rangstigen. Leser `belonning` og `gjor`-kommandoene, låser svar med `Valg.krav`, lagret i `bryggen-rpg` (se «Rollespillet» under) |
| `ui/RpgHud.tsx`, `ui/Meg.tsx` | Pungen og rangen i livskortet, kortene til venstre under livskortet når noe endrer seg (midt på dekket de gutten i samtaler), og «Meg» i pausemenyen |
| `ui/menydeler.tsx`, `ui/fokus.ts`, `ui/fullskjerm.ts` | Bryter, glidebryter, knapp og overskrift; piltastnavigasjon og fokusring; fullskjerm med Esc-lås |

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
- Innredningen går gjennom `bakPortaler` (portal.ts), og folkene inne får `bak` på plassen: de
  tegnes bare når kameraet kan se dem gjennom en åpning. Åpningene registreres med
  `MeshKit.aapning` der hullet lages (`vegg` i inne.ts for dører og glugger, `ljore` i moduler.ts).
  Et nytt hull inn i et hus med innredning må registreres, ellers mangler innredningen bak det.
  Ting i innredningen må stå innenfor veggene: det som står utenfor, blir borte sett utenfra.
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
- Ildlyset er ett `PointLight` for hele byen (tre på full kvalitet, se under), alltid i scenen, flyttet til nærmeste ildsted (innen
  24 m) av `world.update`. Ikke legg lys i cellene: et lys som kommer og går (også når nær-nivået
  skjules) tvinger Three til å bygge alle shaderne på nytt. Det rekker 17 m og faller av med 1,2, så
  det når gavlveggene i schøtstua (17,6 m lang). Inne går eksponeringen opp med `inne` (opptil 60 %,
  `game.ts`): øyet venner seg til mørket, som `skyggeLoft` ute. Sotet (`SOT` i inne.ts) er lysere
  nederst, der folk står. Talglys og andre flammer som skal synes i mørket, går i et eget
  selvlysende materiale (`kontor-lys.ts`, `flamme` i mariakirken-inne.ts), ikke som lys.
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
- Sittende plasseres med `pos` midt på benkesetet (y = toppen av setet): i `Sitting_Idle_Loop` står
  hoftene 0,33 m bak og 0,545 m over riggens føtter (1,83 m høy rigg). `lagFolk` setter riggen så
  hofteleddet havner 9 cm over setet (`SITT_SETE`), og da når føttene golvet på benker rundt 0,45 m.
  Mål med `__bryggenFolk()` (`hofte` og `fot` er høyden på hofteleddet og den laveste ankelen).
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
  (`GROV` i `figur.ts`, ca. 2,5k trekanter mot 6,7k) og kaster ikke skygge (`FigurLod`, også for
  roerne i færingene). Logikken til dem som
  går, kjører alltid.
- Overkroppsklipp oppå gangen (bære noe): `Animator.overlay('Baere_Over')`. Mixeren normaliserer
  vektene per bein, så `overlay` regner om vekten til andelen overkroppen skal ha.
- Cellenes `tick` får `CellCtx` (kamera, gutt og `si` for replikker). `snakkbare` i en celle er folk
  gutten kan snakke med; `samtale` på en `Plass` peker til en samtale i `samtaler.ts`.
- Programvare-GL i Playwright kan gi bilder over 0,25 s, og løkka kaster dem (fanebytte-vernet). Da
  står spillet nesten stille i testen. Test bevegelse med `?kvalitet=lav&post=0` og et lite vindu.
- Det gutten har gjort som folk husker, står i `SPOR` (`samtaler.ts`): bunter båret, juks, om fiskeren
  har merket det. `startNode` velger hvor en samtale starter ut fra det. Ikke lagret ennå.
- Bakken (gjørma) lages med `bakkeBoks`/`bakke` (bakke.ts), ikke `k.box('gjorme', …)`. Formen holder seg
  mellom -9 og +4,5 cm fra toppen av boksen, og flater ut 0,7 m fra kantene, så den møter vegger, kai og
  nabocellene. Kolliderne er fortsatt flate: føttene synker litt ned i haugene. Store flater får ruter på
  0,7 m (`bakkeBoks`), ellers 0,5 m. Gjørma kaster ikke skygge, men rusket (stein, raatre) gjør det.
- Pyttene (`vaat.ts`) bruker `pyStoy` med en hash uten sinus, regnet i 32-bits flyt likt i JS
  (`pyttStoy`, bakke.ts). Endres den ene, må den andre følge med, ellers står vannet på haugene.
- Relieffet (`relieff.ts`) settes på materialene i `RELIEFF` (dybde i meter) når detaljkartene lastes, med
  `RELIEFF`-define. Vætan eier `relHoyde` (0,5 uten relieff), og relieffet skriver den.
- SSAO regner normalen fra naboene på den siden som ligger nærmest i dybden, og har en vinkel-bias
  (0,18): med dFdx/dFdy på halv oppløsning ble golv og bakke stripete.
- Dører og gluggeluker som rører seg på et hus: `husLuker(uro, spec, m, yaw, fotter, luker)` (heim.ts).
  Alle med samme form i en `Uro` er én InstancedMesh (`Uro.lukeMal`): ett tegnekall for alle dørene, ett
  per gluggestørrelse, med husets farge per instans. Luka over disken i verkstedene er en klaff
  (`lukeKlaff`, akse 'x') i to formbredder (`lukeForm`), strukket til bredden sin. Brukt på Stranden, i
  Øvregaten (dørene og lukene mot gata), i Vågsbunnen (luka over disken slås ned om natta) og i
  nabogårdene (de lukkede dørene, og gluggene som sto åpne).
- `figurDrei` og `setBoneOffset` legges oppå det mixeren skrev, og `Animator` setter beina tilbake før neste
  `mixer.update`. Mixeren skriver nemlig et bein bare når verdien fra klippene endrer seg
  (`PropertyMixer.apply`): et bein med fast stilling fikk dreiningen lagt oppå én gang til hvert bilde, og
  overkroppen snurret rundt. Ikke dreie bein utenom `Animator` uten å gjøre det samme.
- HUD-en (`ui/Hud.tsx`) står i fire kolonner (oppe til venstre, oppe i midten, oppe til høyre, nede i midten)
  som stabler det som vises. Paneler (systempaneler og aktiviteter) får bredde, men aldri `absolute` eller
  faste avstander fra kanten. Plassene i `systemPaneler.tsx`: `venstre`, `hoyre`, `midt`, `bunn`, `hel`.
- Oppdragsmeldingene går i kø (`graboks/meldingko.ts`): én om gangen, og de venter (høyst 8 s) mens en
  samtale pågår eller en boble står øverst i midten (`Hoder.bobleMidt`), og så lenge en film går.
  Lyden spilles når meldingen vises.
- Merkene på bakken (`graboks/maalmerke.ts`): en gyllen ring like stor som området der «E: …» virker, og en
  lyssøyle som synes på avstand. Vises for stedet bunten skal legges, stedene de aktive oppdragene trenger
  (`Oppdrag.stederSomTrengs`), og det systemene melder med `maal()` (system.ts). Et nytt system med et fast
  E-sted skal ha `maal()` med samme punkt og radius som `prompt`.
- Ildlyset: ett `PointLight` på lav kvalitet (24 m), tre på full (48 m), alltid i scenen. Hvert lys
  holder på ildstedet sitt, toner ned før det flytter seg og toner inn etter avstanden (`oppdaterIldlys` i
  bryggen.ts). Innredningen (og ilden inne) tegnes ut til `INNE_R_FULL` (55 m) på full kvalitet.
- `game.ts` er nær 800 linjer. Nye systemer får egen fil i `graboks/` og hektes på med få linjer.
- Nikolaikirken og kirkegården står bak grensa for det spilleren kan gå på, og bruker `tynnTake` fordi
  tårnet er et landemerke. Bare muren mot gata kolliderer; grinda er stengt. Rådhuset går i
  allmenningens egne bøtter, så hele cella er ca. 15 tegnekall.
- `__bryggenKatter` (bare i dev): `still(i, tilstand, pos?, yaw?)` setter katt `i` i en tilstand og holder den der (til skjermbilder). Kattene bruker de samme sonene som rottene og leser `rotter.framme`; de tar ikke `onHendelse` (lyden eier den).
- Skipene (`bygg/skip.ts`) står ikke i en celle: de er få og synes over hele Vågen. Hvert skip er én
  `MeshKit` (ett tegnekall per materiale: `raatre` for treverk, `seil` for seilduken, `mork` for tauverk) og én
  konveks kollider som står stille. De gynger etter `vannHoyde` i `vann.ts`, som må følge bølgene i
  GLSL-en der. Seilet har eget materiale (`seil`, se under). Fibrene i treteksturene går
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
- Gester, kampkroppen og livet (`motor/liv.ts`) legges på med `Animator.foer(fn)` (flere per figur): rett før mixeren, så de
  aldri legges på to ganger når figuren bare oppdateres 15 ganger i sekundet. Skulderbeina (`DEF-shoulder`)
  flytter hele armen mye: bruk overarmen.
- Riggen har nå også `Idle_Talking_Loop`, `Sitting_Talking_Loop`, `Sword_Attack`, `PickUp_Table`,
  `Spell_Simple_Shoot`/`_Enter`, `Crouch_Fwd_Loop`, `Walk_Formal_Loop` og `Idle_Torch_Loop` (31 klipp).
  Bygg `mannequin.glb` på nytt med `@gltf-transform` (resample, dedup, prune) fra
  `AnimationLibrary_Godot_Standard.gltf`, ellers forsvinner klipp.
- Kampen: rekka er jab, kross, svingslag (starten av `Sword_Attack`, sluppet før det dype utfallet). Tungt
  slag og avslutning er også svingslaget. Fienden velger kross, to jab eller et svingslag som går gjennom
  garden (varsles i oransje: rull unna). Lyd fra `kamp.ogg` via `CombatSink.lyd`; gutten får lysere stemme.
- Sideoppdragene i dev: `?sted=loft|hans|detmar|bard|ottar|kirke|alter|olstua` starter gutten ved stedet
  (`DEV_STEDER` i `dev.ts`), `?oppdrag=sko,messe` tar oppdragene uten krav (også om de er levert), og
  `?hendelse=messe:lys` sender hendelser. Eksempel: `/test/bryggen-gard?sted=alter&oppdrag=messe&hendelse=messe:lys`
  går rett til svarene i messen.
- Et system som holder gutten (`steg` gir true) skjuler «E: …» mens aktiviteten pågår, og `rask()` gir
  HUD-en ca. 30 oppdateringer i sekundet. Aktivitetene animerer selv mellom oppdateringene (`ui/useNaa.ts`),
  og panelene står over navneskiltene (`z-[1100]`). Hold dem 640 px brede eller smalere: kontrollpanelet nede
  til venstre tar 336 px på 1366 x 768.
- Oppdrag: et mål er en hendelse (`veid`, `sted:<id>`, `snakk:<person>`, `slaa:tyven`). `snakk:<person>` sendes ikke av seg
  selv når samtalen slutter: noden som teller, må ha `gjor: 'hendelse:snakk:<person>'`. Steder meldes av
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
- Alt som flyter, melder omrisset sitt i vannlinja (`SkrogFot`) til `vann.settSkrog`, ellers står vannet
  opp i båten (vannet er et plan, og skrogene stikker under det). Skipene og trafikken samler omrissene
  selv (`skip.skrog`, `trafikk.skrog`); færingen gutten ror, meldes av `world.faering`. `vannlinje(sp, y)`
  i `skrog.ts` regner ut omrisset for kogger og jekter. Høyst `MAKS_SKROG` (24) om gangen.
- Trafikken har ingen veifinning: rutene legges i åpent vann, unna skipene som ligger fast. Færingene
  viker for alt (også gutten), skipene bare for gutten, og den som blir holdt igjen lenge, svinger unna.
  Skip svinger fortere jo fortere de går, men snur sakte også stillestående (varpet eller slept i havn).
  Ute i tåka (`hopp`) hopper de tilbake til start. Kolliderne flyttes med (`Physics.addMovingHull`).
- Vågsbunnen trekker skomakerbodene (`sjoRad`) først fra cellas frø, så `brygger()` regner ut de samme
  bryggetrappene uten å bygge cella (trafikken fortøyer båtene ved siden av dem). Legg ikke ny trekning
  foran den.
- Verkstedene er rom med `yaw: 0`: det holder rottene ute (rommene med folk hele dagen), uten å dreie dem.
- Det glødende i bakerovnen og essene går i en egen `MeshKit` (`glod`) som cella tegner med et eget
  selvlysende materiale og kaster i `dispose`. Bare smia har flammer (`Ild`); ildlyset står ved den
  nærmeste ovnen eller essa.
- Land langt unna over Vågen (Nordnes) bruker `materials.fjernLand()`: flat farge uten væte (pyttene
  ble hvite flekker på takene) og tåke med 0,3 av tettheten, så åsen står som en blek silhuett.
- Vågsbunnen og Auta allmenning ligger vest for `xwGard` (der gårdene slutter); `xw` i `bryggen.ts` er
  den vestre enden av byen etter det. Støttemuren under Øvregaten har en åpning for Auta-trappa
  (`GateOppsett.trapper`).

## Seilduken (seil, 03.10.2026)

- Seilene på koggen og jektene (fortøyd, i trafikken og i filmene) bruker `MatKey` 'seil' fra
  `motor/seilduk.ts`, ikke lenger lys `raatre`. `Materials.load` lager materialet, `applyQuality`
  slår veven (bumpMap) av og på, og alt annet er likt på lav og full kvalitet.
- UV-ene er normalisert over seilet: `seilSatt` har u 0..1 på tvers og v 0..1 fra underkanten til råa;
  `raa` (beslått) har u 0..1 langs råa og v 1..2 rundt rullen. Vinden i shaderen bruker v: v >= 1 står
  stille. Nye seil må følge det, ellers blafrer de feil.
- Det beslåtte seilet er én rull duk (`flate`) som henger i buker mellom surringene, med folder rundt
  og en dråpeform nederst. Surringene står litt skjevt (`SKJEV`).
- Vinden er en forskyvning forut (+z i skipets rom) i vertex-shaderen, med fase fra skipets posisjon,
  så skipene ikke blafrer i takt. Normalen vippes med krusningen. Skyggen følger ikke vinden (liten feil).
- Baksida av seilet får litt av sollyset gjennom duken (`GJENNOM`), uten skygge.
- Test: `/test/bryggen-gard?sted=bard&dogn=0&lys=dag&regn=0` (jekta ved kaia og koggen),
  `__bryggenFoto` mot `jekt-kai:seil`, `kogge:seil` og `jekt-seil:seil:seil` (trafikken, satt seil).
  Legg til `&kvalitet=lav` og `&lys=kveld`.

## Rollespillet (rykte, pung, ferdigheter, rang)

- Kontrakten står i `bygg/oppdrag-data.ts` (`Belonning`, `Krav`, `Fraksjon`, `Ferdighet`). Et oppdrag med
  `belonning: { witten, rykte, ferdighet }` gir det når det leveres. I `gjor` virker `rykte:K:+3`,
  `witten:+2`, `witten:-gevinst` (gir tilbake det som ble vunnet i terningspillet) og `ferdighet:prute`.
  Rykte i `gjor` hører hjemme på noder som vises én gang, ikke i en løkke tilbake til et valg.
  `ferdighet:` fra samtaler telles høyst én gang i minuttet per ferdighet (samtaler kan tas om igjen).
- Et svar med `krav: { rykte: { N: 15 } }` (eller `rang`, `witten`, `ferdighet`) står låst med hengelås og
  grunnen under, til gutten oppfyller det. Sett låste svar sist, så tallene på de åpne ikke flytter seg.
  Samtaler kan ha fire svar (tast 1-4).
- Lønna for et oppdrag øker med rangen (+1 witten per trinn), prutingen (+20 % per nivå) og ryktet hos
  den som betaler: fraksjonen som får mest rykte av oppdraget (`Rollespill.betaler`), fra -2 (hatet) til
  +2 (æret) witten, minst 1. Kortet forklarer hva lønna består av.
- `RYKTE.les(f)` og `rykteNaa(f)` (rpg-data.ts) gir ryktet til data og systemer som ikke skal importere
  rollespillet. `rykteTrinn` gir -2..2 med samme grenser som ordene (hatet ... æret).
- Ryktet i samtalene (`bygg/rykte-samtaler.ts`): `SAMTALE_FRAKSJON` (samtaler.ts) sier hvem folk hører
  til, og `startNode` velger `kald` (mistrodd eller verre) eller `varm` (likt eller bedre) når noden finnes.
  Låste svar åpner ny kunnskap eller en rett: husbonden (K 30), Ottar (F 15), kornselgeren (N 15),
  høvedsmannen (B 20, gir `bergenhus-fri`) og presten i Jonskirken (Ki 15). En samtale fra et oppdrag
  (`samtaleFor`) har sin egen start og bryr seg ikke om ryktet. Test: `?sted=torg` står foran kornselgeren.
- Sølve pruter etter ryktet hos fiskerne: grensen en halv kilo lavere og én mer i tålmodighet per trinn
  over ukjent, motsatt under (`kontor-prute.ts`).
- Ferdighetene øves av det gutten gjør: bunter båret (bære), riktig avlest bismer (regne og veie), hvert
  tredje slag som treffer (slåss), hver 40. meter i færingen (ro), og samtaler om priser (prute). Nivåene
  (0-5) står i `NIVAA`. Effektene settes på delene som bruker dem: `Baering.fart`, `slark` og `roligere`,
  `PlayerCombat.skadeFaktor`, `Faering.kraft`.
- Rangstigen: ny junge, stuejunge, skutedreng, lærling, svenn, husbonde. Kravene står i `RANGER`
  (antall oppdrag, rykte hos Kontoret, ferdigheter). Rangen faller aldri.
- Lagringen er `bryggen-rpg` (versjon 1); `bryggen-oppdrag` røres ikke. Finnes bare den gamle lagringen,
  regnes rykte, pung og rang ut fra oppdragene som er levert og valgene i flaggene, og et kort sier fra.
  `SIDE` (fisken på loftet, terningspillet) og `SPOR` (juks på vekta) lagres også her. «Begynn på nytt»
  nullstiller rollespillet (`Oppdrag.utvidelser`).
- I dev: `window.__bryggenRpg` er rollespillet (`endreRykte('N', 15)`, `endreWitten(5)`, `ov('ro', 3)`).

## Kongens menn på Holmen (byen)

- Høvedsmannen står foran vestgavlen på hallen og svarer på hvor kongen er (Erik av Pommern, krigen
  med hansabyene). Han har ikke navn: hvem som var høvedsmann i 1426, er ikke funnet [K]. Gjaldkeren
  Sjur [S] står ved skriverboden og gir «Brann i lagerhuset». Draktene `hovedsmann` og `gjaldker` står i `folk.ts`.
- «Budet til Bergenhus»: vakta i porten slipper ingen tysker inn uten dagens ord. Ordet sies når Ulf kommer
  til vaktbua og Kolbein svarer. Gutten må stå innenfor den blå ringen uten å bli sett (bak vaktbua, langs
  ringmuren bak ryggen til vakta i porten, eller bak kassene). Porten skyver ham tilbake uten ordet.
- Synet: rekkevidde 10 m og 38° til hver side (13 m og 52° når de er etterlyst eller jager), stråler fra
  hoftehøyde stoppes av alt med kollider (også prop). Kolliderne til det man gjemmer seg bak er vanlige
  verdenskollidere og minst 1,55 m høye: strålen fra øyet til brystet går over noe lavere.
- Synsfeltene vises når gutten er nær vaktbua, gule når de gjelder (i vaktsonen, ettersøkt, rett etter
  tyveri) og bleke ellers. Måleren fylles fortere jo nærmere og fortere gutten er.
- Ettersøkt er eget system (`ETTERSOKT` i ettersokt.ts): andre systemer kaller `sett(p)`, `ser(p)` og
  `meld(niva, grunn)`. Vaktene som tar imot bot står i `VAKTPERSONER`. Boten og dommen går gjennom
  belønningskontrakten (`witten:-n`, `rykte:B:-n`). Samtalen hos gjaldkeren bruker `ettersokt:fri`.
- Ryktet hos kongens menn: synsmåleren fylles fra 0,55 (æret) til 1,6 (hatet) så fort (`SYN_RYKTE`), vaktene
  hilser eller truer når gutten går forbi (`HILSEN`), og en mistrodd gutt i vaktsonen blir etterlyst i
  stedet for vist bort. Med `bergenhus-fri` (høvedsmannen, B 20) gjelder ikke vaktsonen ham før han stjeler.
- Boten hos en vakt er `botNaa(niva)`: `BOT` minus rykte-trinnet hos B (likt på mistenkt: 0, han slipper
  med en advarsel). Har gutten ikke nok witten, sier E-teksten det, og E betyr å gi seg (gjaldkeren). Hos
  gjaldkeren er «betal» et låst svar (`krav: { witten }`), og andre gang er boten dobbel (`gjaldker-bot`).
- Nivået lagres i `bryggen-ettersokt` (jaget lagres som etterlyst) og glemmes ved «Begynn på nytt».
- `HOLMEN.brann`: mens det brenner, står Ulf og Kolbein i bøttekjeden (brann.ts) og ser ingenting.
- Dev: `?sted=holmenveien|porten|muren|lytte|borggard|lagerhus` og `?oppdrag=bergenhus` eller `?oppdrag=brann`.
  Eksempel: `/test/bryggen-gard?sted=lytte&oppdrag=bergenhus&hendelse=snakk:vakta` står bak vaktbua, klar til å lytte.
  `__bryggenVakter()` (bare i dev) viser vaktene: posisjon, modus, synsmåler.

## Stranden, Vågsbunnen og dagsplanene (verden2)

- Test: `/test/bryggen-gard?sted=stranden` (Jonsbryggen, med færingen ved siden av), `?sted=gunnvor`
  (oppdraget «Pinnene i gjørma»), `?sted=jonskirken`, `?sted=skostredet`. Legg til `&lys=dag|kveld|natt` og
  `&dogn=0` for å se en fast del av dagen; `__bryggenLys.still(560)` (kveld) eller `still(820)` (natt) bytter
  midt i spillet, og folkene går til de nye stedene. `?oppdrag=runer` tar oppdraget.

| Fil | Hva |
|---|---|
| `bygg/strandliv.ts` | Den gåbare biten av Stranden (x -42 til 22): bolverk og Jonsbryggen (båten legger til, `finnLanding`), gata, Strandtorget med boder og brønn, familiene i laftehusene, naust, garnhjell, grisebinge, Jonskirken med kirkegård og det halvtomme klosterhuset. Grensa over Vågen har en åpning her (`STRAND_X`, bryggen.ts), og kulissen i `stranden.ts` hopper over biten |
| `bygg/dagsplan.ts` | Dagsplaner (§8.7): morgen, dag, kveld, natt fra `lys.klokke`. Hver figur har en rute, «hjemme» eller `{ inn: dør }` per del; ved skifte går hen langs gata (`Vei`) til det nye stedet. Folk som står stille (`FasePlass.naar`) kommer og går bare når kameraet er unna eller ser en annen vei |
| `bygg/vaagsbunnen-liv.ts` | Barn i Auta allmenning, svenner som arbeider ute (kar, hudramme, skinn), fyllikken Arnfinn og kona Tora (kveld), dyresonene og runepinnene i kvarteret |
| `bygg/veioppdrag.ts` | «Skoene til Åsa» (N, krav «Skomakerverkstedet»): mester Hans sender gutten til fots med et par sko til Åsa på Stranden. Målet er stedet `vaagkaia` (E midt på kaia i bunnen av Vågen, strandgaten.ts), så båten ikke holder; veien går forbi bommen (N 15). Dev: `?sted=vaagkaia&oppdrag=sko-aasa`, `?sted=aasa&oppdrag=sko-aasa&hendelse=sted:vaagkaia` |
| `bygg/heim.ts` | Innenfor dørene på Stranden: stua til husmannen (ildsted og ljore, seng, vugge som gynger, håndkvern, kiste, og Åsa ved oppstadveven med kljåsteinene, samtale `aasa`) og naustet (færingen på stokker, årer, mast og seil over bjelkene, garn, tjærebrenne, bøyer; rotter og katter kommer av seg selv, rommet har ingen ild). Pluss `dorblad` og `gluggLuke`: delene som går opp og igjen. Dev: `?sted=stua|naustet` |
| `bygg/bolig.ts` | Stua bak verkstedene i Vågsbunnen (det første huset i bakgården, `bakgard` i vaagsbunnen.ts): ildsted med ljore, gryte, benk, bord, seng, kiste med sko på hylla, skinn til tørk og vannkar. Mora rører i gryta, bestemora sitter på benken og gutten spiser. Innredningen og ilden tegnes bare gjennom åpningene (portal.ts). Dev: `?sted=bolig` |
| `bygg/veiliv.ts` | Livet langs veien rundt bunnen av Vågen: åtte som går hele veien fram og tilbake (sko, kurv, bøtte, kjerre med tønner via `baer: 'kjerre'` og `Push_Loop`), og folk som arbeider der (renser fisk, sitter på benken, vasker klær, bøter garn, tjærer en færing opp ned på bukker), barn, hunder, klesvask bak gjerdet og fisk på hjell. Startpunktene spres langs veien med `rot` |
| `bygg/runepinner.ts`, `bygg/runeoppdrag.ts` | Seks ekte innskrifter fra Bryggen med kilde, og oppdraget «Pinnene i gjørma» (N) med `belonning`. Også navn, replikker og samtaler for de nye folkene (Gunnvor, presten i Jonskirken, Tora, Arnfinn, barna) |
| `graboks/strandliv.ts`, `ui/Runekort.tsx` | Systemet: klokka til dagsplanene, dyrene, pinnene (glimt, plukke opp, kortet med runene som risses fram). Pinnen huskes som flagget `rune:<id>` i lagringen |
| `motor/firbeint.ts`, `motor/dyr.ts` | Griser og hunder laget i kode, én InstancedMesh per art (nær med skygge, fjern uten), animert i vertex-shaderen. Cellene melder sonene sine (`meldDyreSoner`). `Dyrene.onLyd` og `Katter.onMjau` gir lydene (`LydKobling.dyr`, sprite `dyr.ogg`: gris, bjeff, knurr, mjau; kildene i KILDE.md) |

Regler:
- Folk med dagsplan bygges med `lagDagsfolk` (samme form som `lagFolk`). Figurer som er hjemme, står
  parkert under bakken (`Vandrer.byttRute(null)`): de tegnes ikke, animeres ikke og får ikke kollider.
- Rutene i en dagsplan må ligge der det er fritt, og `Vei` i cella må gi en vei ut til gata som ikke går
  gjennom hus (bak bodene på Strandtorget går den rundt vestenden).
- Folk med `id` i Vågsbunnen (de oppdragene trenger) er der hele døgnet; de andre i verkstedene går hjem om natta.
- Dører og gluggeluker som rører seg: `doors[].uro` og `Glugg.uro` (moduler.ts) gir bare åpningen i huset, og
  cella lager bladet som en `Uro.luke` med hengselet fra `langveggRamme`/`gluggRamme`. Dørene går opp når gutten
  eller en som går er nær (strandliv.ts), lukene står åpne morgen, dag og kveld. Hold trekningene (`r()`) i samme
  rekkefølge når husplanen endres, ellers flytter husene seg.
- Stranden og Vågsbunnen henger sammen til fots når bommen over Skostredet er løftet (`bygg/strandgaten.ts`,
  `graboks/bommen.ts`): Detmar løfter den når byfolket kjenner gutten (svar låst med N 15, flagget
  `bommen-aapen`, lagret). Veien går vestover i gata bak bommen, sørover på kaia langs bunnen av Vågen og
  østover på Strandgaten til den gåbare biten. Kulissene der har ingen kollidere: `strandgatenCelle` gir
  bakken, husfrontene som usynlige vegger og gjerdene; mot Vågen står veggen i vannet rett utenfor kaia
  (bryggen.ts). Husene på Stranden vest for den gåbare biten står `VEI` (6,5 m) lenger inne (stranden.ts),
  og gjerdet på vestsida av den gåbare biten er åpent ut mot sjøen. Stokken og kollideren i bommen eies av
  `bommen.ts`, ikke av cella. `world.xw` er vestenden av byen (-182,1).
  Dev: `?sted=bommen|bakbommen|vaagkaia|strandgaten`.
- I Playwright går simuleringen mye saktere enn klokka (programvare-GL): vent på HUD-teksten, ikke på faste tider.

## Kontoret: «Kontorets lov» (oppdragskjede og fire jobber)

Kontoret som makt på Bryggen, i den første gården: oldermannen Tidemann Ruge og sekretæren Magister
Arnold står ved østveggen i schøtstua, Sølve fra Vesterålen på kaia, og en bødker og en skutedreng
arbeider i gården (hammerslag fra kaia, replikker når gutten går forbi). Seks oppdrag går av seg selv
etter hverandre (hvert tas når det forrige leveres), krav: «Fisken bærer seg ikke selv».

| Fil | Hva |
|---|---|
| `bygg/kontor-data.ts` | Kjeden (6 oppdrag med belønning), folkene (lagt til `PERSONER`, `NAVN`, `REPLIKKER` herfra), Sølves konto i gjeldsboka, og hva Sølve sier etter det gutten har gjort |
| `graboks/kontoret.ts` | Hektes på `systemer.ts` med én linje: cella med folkene, hammeren, og de fem systemene under |
| `graboks/kontor-steder.ts` | Hvor ting står (schøtstua, fiskestablene i bua, pulten, Sølve, vinsjen) |
| `graboks/kontor-morgensprache.ts`, `ui/KontorMorgensprache.tsx` | Morgensprache med fast kamera: reglene og straffene leses opp, og gutten lover. Andre gang dommen: ros, fem harde slag (telles av seg selv, rødt gjenskinn, ingen vitser), eller dom over Sølve |
| `graboks/kontor-sortering.ts`, `ui/KontorSortering.tsx` | Sortere 14 tørrfisk i fin/middels/vrak (1-3 eller J/K/L) mot klokka. Mellomrom kjenner etter fuktig fisk inni |
| `graboks/kontor-prute.ts`, `ui/KontorPrute.tsx` | Prute kilo rug for kilo fisk med Sølve (A/D, mellomrom byr). Grensen hans leses av tegnene. Tom tålmodighet: han må ta husbondens seks, for ingen andre kjøper |
| `graboks/kontor-gjeldsbok.ts`, `ui/KontorGjeldsbok.tsx` | Føre Sølves konto: skriv summen så langt med talltastene, Enter skriver med blekk, feil gir flekk. X hopper over saltlinja hvis gutten lovte Sølve det |
| `graboks/kontor-vinsj.ts`, `ui/KontorVinsj.tsx` | Vinsjen i gavlen: A og D etter tur sveiver, samme tast to ganger glipper, S holder igjen i tauet, W slipper litt tau, E drar bunten inn ved loftsdøra når den henger stille. Vindkast og smell. Bunten og tauet synes i 3D på gavlen, og kameraet ser opp langs den |
| `ui/Kontor.tsx` | Panelene, hektet på `Aktiviteter.tsx` med én linje |

Valget som slår tilbake: Sølve ber gutten hoppe over saltet i boka (oppdrag 4). Selve valget gjøres i
boka (X eller skriv). Har han hoppet over, finner sekretæren feilen når han teller lageret etter vinsjen
(oppdrag 5), og gutten velger igjen: si sannheten (dom: fem harde slag) eller skylde på Sølve (Sølve
kastes ut fra kaia og forsvinner). Prisen fra prutingen styrer hvor mye rug Sølve må ta på kreditt.
Flaggene står øverst i `kontor-data.ts`. Belønningen bruker `belonning` og `gjor`-kommandoene
`rykte:K:+n`, `witten:+n` (kontrakten i `oppdrag-data.ts`).

To jobber ved siden av kjeden (`bygg/kontor-jobber.ts`), krav: «Fisken bærer seg ikke selv». Når de er
levert, kan de tas igjen for lønn én gang per døgn (døgnet telles når `lys.klokke` går rundt).

| Fil | Hva |
|---|---|
| `graboks/kontor-koggen.ts`, `ui/KontorKoggen.tsx` | «Last koggen» hos skipperen Hermen på kaia ved allmenningen: pakkepuslespill i lasterommet (8 x 4, smale ender, masta), tranfat (4), bunter (1) og store pakker (2, R snur). Krenging og trim regnes som vekt ganger avstand fra midten, og koggen krenger i 3D (`Skipene.krenging`, `world.skip`). Floen gir 150 s |
| `graboks/kontor-veiing.ts`, `ui/KontorVeiing.tsx` | «Bårds fisk på bismeren» ved jekta: fem bunter på bismeren (`BismerSpill`), så tre svar i våger (3 bismerpund i en våg, `PUND_PER_VAAG`; feilene er å svare i pund eller dele på to). Bårds eget tall er litt høyere: fisken tørker på veien |

Dev: `?sted=koggen&oppdrag=kontor-koggen` og `?sted=bard&oppdrag=kontor-veiing`.

Dev: `?sted=schotstua|bua|pult|solve|vinsj`, og `?oppdrag=kontor-morgensprache` (eller `kontor-sortere`,
`kontor-prute`, `kontor-gjeldsbok`, `kontor-vinsj`, `kontor-dom`). Eksempel:
`/test/bryggen-gard?sted=vinsj&oppdrag=kontor-vinsj` går rett til vinsjen. Gjeldsboka trenger at
Sølve er snakket med først (`?hendelse=snakk:solve`).

## Kapittel 2: «Uten motstand» (våren 1428)

Blueprint §4.1 og §6.1. Kjøpmennene fra Lübeck og de andre vendiske byene forlot Bergen våren 1427 og kom
tilbake i 1433 [V Ersland 2020]. Gutten og stuedrengen Hennig er satt igjen for å passe gården [S], og i 1428
plyndrer vitaliebrødrene byen uten motstand [V SNL]. Krav: «Tyven i natt» levert. Lambert har «!».

| Fil | Hva |
|---|---|
| `bygg/kap2-data.ts` | De tre oppdragene (`kap2` Uten motstand, `kap2-kjoper` Han som kjøper, `kap2-korn` Kornet), samtalene (Lambert, Torstein, Hennig, Volmer, Åsa, Bård etter plyndringen), de fire «Dette vet vi»-tekstene og `KAP2_STEDER` (skipene, jekta, Volmer, sekkene, naustet, brygga) |
| `bygg/filmer-kap2.ts` | `kap2-inn` (1427 til 1428, «Et år går»), `kap2-jekta` (plyndrerne tar fisken til Bård) og `kap2-ut` (mai 1428, krangelen ved porten, kornet etter valget). Koblet i `koblFilmer` på flaggene `kap2-start`, `kap2-jekta` og leveringen av `kap2-korn` |
| `bygg/epoke.ts` | `EPOKE.kap2` og `utenTyske(folk)`: gårdene, nabogårdene, torget, Kontoret og Hermen bygges uten folkene fra Kontoret mens det er 1428 (Hennig og Volmer blir) |
| `graboks/kap2.ts` | Systemet: året (fra `kap2-epoke` til `kap2-ferdig`, bygger cellene på nytt med `CellStreamer.lastPaNytt`), plyndrernes to kogger for anker med kollider, cellene med Bård, plyndrerne og Volmer, E ved jekta, sekkene på Stranden og plyndreren som går i land |

Regler:
- Året skifter bare mens kameraet ser bort: i skuddet over Vågen i `kap2-inn` (`kap2-epoke`) og i det siste
  skuddet over sjøen i `kap2-ut` (`kap2-ferdig`). Etterpå er byen fri lek uten årstall igjen: Kontoret er
  tilbake, og alle oppdragene fra 1426 kan tas.
- Kampen er den samme som i kapittel 1. Kampfiguren eies av tyven; `Tyv.laan` lar et annet system låne den
  (da gjør tyven ingenting, og `aktiv` og R spør låneren). `byttDrakt(anim, 'plyndrer')` (folk.ts) bytter
  bare geometrien på figuren som står i scenen, og den får tyvedrakten tilbake etterpå.
- Sekkene bæres med `Baering.baerTing(objekt)`: samme fart og regler som en bunt, og `slipp()` (om bord i
  færingen) legger den fra seg. Systemet som ga tingen, eier den.
- `rang:<n>` i `gjor` gir minst den rangen (tidshoppet til 14 år, stuejunge).
- Tolket gutten for Volmer, kjenner vakta ham igjen første gang han kommer på veien til Holmen etter kapitlet:
  mistenkt (`ETTERSOKT.meld`), med grunnen tyveri. Flagget `kap2-meldt` gjør at det skjer én gang.
- Folk i nabogårdene som pratet med en tysker, står og prater alene i 1428 (utenTyske tar bare bort den ene).

Dev: `?film=kap2-inn`, `?sted=jekta|volmer|sekkene`, `?oppdrag=kap2` (eller `kap2-kjoper`, `kap2-korn`;
et tatt kapittel-oppdrag setter året til 1428). Eksempel:
`/test/bryggen-gard?sted=sekkene&oppdrag=kap2-korn&hendelse=snakk:aasa` står ved sekkene, men valget hos Åsa
må tas i samtalen (flaggene `kap2-naust`, `kap2-loft`, `kap2-nei`).
