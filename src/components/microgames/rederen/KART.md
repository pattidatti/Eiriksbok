# Rederens kart - kart over mappa

Ferdig bygd (fase 3b, etter diagnose 2, eierens runde: hvaler, arter, IWC-kvote). Brief: `docs/microgames/briefer/rederens-kart.md`.
Komponent: `../RederensKart.tsx` (skall, input, lyd, tekst via `useArcadeText`, lagring, meny/pause/slutt-skjerm, selvspill).

| Fil | Hva den gjør |
| --- | --- |
| `tuning.ts` | Alle tallene: tid, fangst, fødsel, `arter` (blå/finn/sei: olje, fødsel, tegnet lengde), `kvote` (IWC 1946: hval per år), tomtHav, båt, økonomi (vedlikehold, kokeri, havnAndel, gulvTil, `fast` = stasjonen), `marked` (oljeprisen fra 1929: grense, fall, bunn), `fredning` (Finnmark 1904, blåhval 1966), `startBåter`, `tilbud`, `maksTilbud`, vandring, poeng, press, ranger. |
| `levels.ts` | `KART` per kartark: havn, `sone` (havna som rektangel), `plasser` (faste båtplasser), `kokeriPlass`, land/is, stedsnavn, kompassrose, dybdekurver, `alder` (hvor gulnet). `BRETT` (år, hav, nytt ark, flokker med `art`; blåhval fredes i 1966). Sørishavet har sju store flokker (tre blå, to finn, to sei). `brettFor`, `iSone`. |
| `game.ts` | Tilstanden, `newGame` (båt 1 i havna, båt 2 alt ute på Vadsø-flokken = rød ring fra start), `send` (grepet; drar du en båt til salgs ut av havna, er den kjøpt), og `update`: vandring, fødsler, fangst, fat, tomt hav, årsskifte (`marked` = prisfall på tønna, `fyllTilbud`, regnskap `innIÅr`/`sist`, `fred` = låser flokker), `byttOm` (forbudet i Finnmark kommer 1,4 s før det nye arket), oljelageret (`lager`, `pris`), IWC-kvoten (`kvoteNådd`, hendelsene `kvoteStart`, `kvote`, `kvoteForHøy` fem år etter), tap og seier. Fat har `verdi` (artens olje). |
| `rules.ts` | Fagkjernen og hjelpere: `fangerFra` (aldri fra fredet flokk, aldri når årets kvote er tatt), `kvoteÅpen`, `kvoteFull`, `fødselsrate`, `årLengde`, `vedlikehold`, `fastKost`, `havnKost` (0 til salgs), `årsKost`, `egne`, `sløyfe`, `press`, `framdrift`, `markedÅpent`, `prisFor`, `fatPåVei`. |
| `bots.ts` / `sim.ts` | Robotene (`vett()`: lav/høy, hver, tønneVett, maksUte, hjemTom, `kjøpReserve`, `marked`: ser / lærer etter første prisfall / aldri; `grådig`, `tilfeldig`) og simuleringskontrakten. |
| `ark.ts` | Kartarket som offscreen-canvas (papir, fiber, flekker, bretter, kurslinjer, vannlinjer, land/is med skravering, rose, dybder, navn, gradert ramme) og hvalstempelet per art (`hvalStempel`, `tegnHvalStempel`: blåhval lang og lys med rund snute og flekker, finnhval slank med lys høyre kjeve, seihval kort og mørk; 3 varianter hver). Cache per ark og oppløsning. Palett `P`. |
| `fx.ts` | Effekter i ekte tid: bølger, røyk, hval som tas, unger som popper, døde flokker, båtenes kurs og sprett, tønne/år/grønt-stempel, arkbytte, `rykk` (hele bildet hopper), `lås` (ringen strammer seg når båten slippes på flokken), `fred` (FREDET/FORBUDT-stempelet slås). `fraHendelse` leser spillets hendelser. |
| `draw.ts` | Scenen: arkbytte, havnesona (lyser når du drar), ringer (blå bue = hval igjen, grønt/rødt bånd med piler = vokser/krymper, grå stiplet = fredet), flokken som én stor hval (`hvalLengde`: artens lengde ganger hvor full flokken er, kjølvann, stor sprut, ungen svømmer inn som en liten hval), rødt pausemerke over båter når kvoten er tatt, båter ovenfra, prislapp, fangstlinjer, fat, hint (fast pil + hånd), drag, sikte, oljedråper, lampelys. |
| `hud.ts` | Kartusjen (år, hav, år til 1968, tellestreker, GRØNT ÅR-stempel), regnskapet med tønna («Holder N år» stort, rødt «Tom om N år!» under 3, `fatRekke`: + fat inn i fjor over - røde fat ut ved nyttår, ett fat = 2 olje, ikon per båt: fylt = ute, omriss = havn, oljepris-staven fra 1929, kvote-strekene fra 1946 med «BÅTENE STANSER», `regnskapH` = høyden vokser), stripa nederst (tegnforklaring; fra 1904 artene i stedet for «tar hval» og fat-teksten; tidslinje), tap-bildet og `tapTekst` (årsaken i én setning, også på slutt-skjermen). |
| `TapKort.tsx` | Slutt-kortet ved tap: lite, på motsatt side av stempelet (`tapMål` i `hud.ts`), med årsaken i én setning, tallene på én linje og ett punkt fra «Dette skjedde». Seier bruker vanlig `ArcadeScreen`. |
| `skall.ts` | Tema, kvalitetsnivå (`velgNivå`) og tallene for frys, hit-stop og oljetall-spalten. |
| `texts.ts` | Mål (menyen er én linje), lapper (maks 7 ord; rød ring, marked, forbud, fredning, kvote, kvote for høy), lærings-øyeblikk (`ØYEBLIKK`: nyttår, pris, fredning), tips (`TIPS_PRIS` når prisfallet felte selskapet), «Dette skjedde», lærdom (også `kvote` og `arter`). |

## Kjerneløkka

1. Eleven drar en båt (`send`). Slippes den på en flokk, følger den flokken. Slippes den i havnesona, legger den seg på plassen sin (`hjemme`). Ligger båten i ro innenfor `fangst.radius`, tar den én hval per `fangst.intervall`, og et fat ruller hjem til havna eller kokeriet. Først i tønna teller fatet (`innIÅr`).
2. Hver hval får en unge med sjansen `fødsel.perHvalPerSek` per sekund. `f.netto` = fødsler minus fangst; ringen er grønn når den er >= 0. `kritisk` -> `reddet` når en nesten tom flokk vokser til halvparten igjen.
3. Ny teknikk = en båt til salgs i havna (`tilbud`). Eleven kjøper ved å dra den ut (`pris` fra tønna), eller lar være. Til salgs koster den ingenting.
4. Oljemarkedet (fra 1929): hvert fat som kommer hjem, legges på `lager`, som tømmes med `grense` fat per år. Over grensa faller `pris` (verdien av nye fat), og ved nyttår mister tønna like mye i verdi (`krakk`). Det er overfangst som gir konkurs med full tønne.
5. Fredning: 1904 låses Finnmark-flokkene (båtene seiler hjem) og 1,4 s etter kommer Sør-Georgia-arket. 1966 låses blåhval-flokkene. Låste flokker føder videre, men ingen kan fange der.
6. Årsskifte: `årsKost` = stasjonen (`fast`) + full pris for båter ute + `havnAndel` for båter i havna. Under null = konkurs (ikke før `gulvTil`). Grønt år = noe fanget og havet krympet ikke.
7. Brett: 1880 Nordkapp, 1892 Sørøya (reserve), 1904 nytt ark (Sør-Georgia), 1925 nytt ark (Sørishavet) med kokeriet til salgs. Seier når 1969 begynner.

## Tekst (RederensKart.tsx, `hendelse`)

Lærings-øyeblikk (maks tre): `nyttår` (årsskiftet til 1880), `pris` (1,6 s etter første prisfall), `fredning` (1,8 s etter 1966). Rød ring forklares med en lapp ved ringen første gang (`sjekkRød`), ikke en boks. Hit-stop (`STOPP`) og `rykk` ved slipp på flokk, kjøp, død, prisfall, fredning og tap. Myk start (`roligStart`): ingen banner, og ingen oljetall, dråper eller GRØNT ÅR før 3 s etter første slipp. IWC-kvoten: banner «1946: Hvalkvote», lapp ved strekene første gang båtene stanser, og lapp + lærdom om kvoten var for høy (bare når havet faktisk krympet). Lapper: start, til salgs, for dyrt, flokk borte, tønna snart tom, taster. Flytere: +olje ved havna (samlet), -kost ved nyttår, -pris ved kjøp, «Flokken kom seg!», «På håret!».

## Knapper

- Hvor raskt havet tømmes: `fangst.intervall`, `fødsel.perHvalPerSek`, `maks` per flokk.
- Økonomien: `fatVerdi`, `vedlikehold`, `kokeri`, `havnAndel`, `fast`, `tilbud[].pris`. `fast` i 1904 og 1925 er det som feller «sparsom» (én båt betaler ikke stasjonen).
- Hvor mye eleven må følge flokkene: `fart`, `rx`/`ry` i `levels.ts`.

## Fallgruver

- Plasser for HUD: kartusjen dekker x 16-230, y 16-108 (GRØNT ÅR-stempelet har fast plass i kartusjen, x 144-220, y 55-77); regnskapet x 688-896, y 12-108 (fra 1929 til y 130, fra 1946 til y 158); stripa y 500-540; knappene øverst til høyre. Flokker (sløyfe + radius 46) må ligge utenfor.
- Havnesona må ikke overlappe noen flokksløyfe, ellers kan båten ikke slippes på flokken.
- `lav * maks` må være over `tomtHav` (6) i brett 1.
- Alle økonomitall er olje per år, men årene går i ulik fart (1,5 / 2 / 2,5 s). Fangst og fødsler er per sekund.
- Markedsroboten må se på lageret (staven), ikke telle fat per år: år på 2,5 s gir så mye støy at «fat i fjor» fikk forvalteren til å sende båtene hjem og ut igjen, og den gikk konkurs.
- Grønt år målt per flokk (hver fanget flokk minst like stor) ga «sparsom» flere poeng enn «forvalter». Behold målet for hele havet.
- Flytende oljetall (+inn, -kost, -kjøp, «På håret!») spretter i `PENGER`-spalten (x 630, `skall.ts`), ikke ved havna eller tønna: der dekket de stedsnavn og regnskapet. Prisfallet står ved x 430.
- Lærings-øyeblikket om fredning har ikke anker: kortet midt øverst dekker ingen FREDET-stempler. FREDET tegnes etter båtene.
- Årene er 30 % kortere enn før vurdering 2. Alt som er «per år» (vedlikehold, `fast`, kokeri, `marked.kjøpPerÅr`) og robotenes buffere i år (`kjøpReserve`, `presset`) er skalert likt. `marked.grense` er et lagernivå og skaleres ikke.
- Båtene legger seg `båt.følgAvstand` (26 px) fra midten av flokken, på siden de ble sluppet (eller kom fra), så hvalen i midten synes. Robotene slipper midt på flokken.
- Artene endrer økonomien: blåhval gir 1,2 x olje men føder 0,6 x. Flokker med blåhval må starte nær `høy` (0,75 av maks), ellers sender forvalteren aldri båter dit og står stille i årevis (Georgia ga 14 % seier med blåhval på n 16).
- Stasjonen i Sørishavet koster 3,5 i 1925-1927 og 5 fra 1928: med 5 fra 1925 gikk forvalteren konkurs ved overgangen; med 3,5 hele veien vant «sparsom» (én båt på en stor blåhvalflokk betalte stasjonen).
