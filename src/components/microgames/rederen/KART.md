# Rederens kart - kart over mappa

Ferdig bygd (fase 3b, etter vurdering 3: lesbar tønne, hvaler uten ringer, vendepunkt-lapper, krisa fra 1931). Brief: `docs/microgames/briefer/rederens-kart.md`.
Komponent: `../RederensKart.tsx` (skall, input, lyd, tekst via `useArcadeText`, lagring, meny/pause/slutt-skjerm, selvspill).

| Fil | Hva den gjør |
| --- | --- |
| `tuning.ts` | Alle tallene: tid, fangst, fødsel, `arter` (blå/finn/sei: olje, fødsel, tegnet lengde), `kvote` (IWC 1946: hval per år), tomtHav, båt, økonomi (vedlikehold, kokeri, havnAndel, gulvTil, `fast` = stasjonen), `marked` (oljeprisen fra 1929: grense, fall, bunn; `krise` = verden kjøper mindre fra 1931), `fredning` (Finnmark 1904, blåhval 1966), `startBåter`, `tilbud`, `maksTilbud`, vandring, poeng, press, ranger. |
| `levels.ts` | `KART` per kartark: havn, `sone` (havna som rektangel), `plasser` (faste båtplasser), `kokeriPlass`, land/is, stedsnavn, kompassrose, dybdekurver, `alder` (hvor gulnet). `BRETT` (år, hav, nytt ark, flokker med `art`; blåhval fredes i 1966). Sørishavet har fem store flokker (to blå, to finn, én sei). `brettFor`, `iSone`. |
| `game.ts` | Tilstanden, `newGame` (båt 1 i havna, båt 2 alt ute på Vadsø-flokken = rød ring fra start), `send` (grepet; drar du en båt til salgs ut av havna, er den kjøpt), og `update`: vandring, fødsler, fangst, fat, tomt hav, årsskifte (`marked` = prisfall på tønna, `fyllTilbud`, regnskap `innIÅr`/`sist`, `fred` = låser flokker), `byttOm` (forbudet i Finnmark kommer 1,4 s før det nye arket), oljelageret (`lager`, `pris`), IWC-kvoten (`kvoteNådd`, hendelsene `kvoteStart`, `kvote`, `kvoteForHøy` fem år etter), tap og seier. Fat har `verdi` (artens olje). |
| `rules.ts` | Fagkjernen og hjelpere: `fangerFra` (aldri fra fredet flokk, aldri når årets kvote er tatt), `kvoteÅpen`, `kvoteFull`, `fødselsrate`, `årLengde`, `vedlikehold`, `fastKost`, `havnKost` (0 til salgs), `årsKost`, `egne`, `sløyfe`, `press`, `framdrift`, `markedÅpent`, `prisFor`, `fatPåVei`. |
| `bots.ts` / `sim.ts` | Robotene (`vett()`: lav/høy, `blåLav`/`blåHøy` (blåhvalen tas ned først, den vokser nesten ikke igjen), hver, tønneVett, maksUte, hjemTom, `kjøpReserve`, `marked`: ser / lærer etter første prisfall / aldri; ved fullt marked går båten med minst olje per fat hjem først; `grådig`, `tilfeldig`) og simuleringskontrakten. |
| `ark.ts` | Kartarket som offscreen-canvas (papir, fiber, flekker, bretter, kurslinjer, vannlinjer, land/is med skravering, rose, dybder, navn, gradert ramme) og hvalstempelet per art (`hvalStempel`, `tegnHvalStempel`, `tegnHvalKant` = hvalen med farget kant: blåhval lang og lys med rund snute og flekker, finnhval slank med lys høyre kjeve, seihval kort og mørk; 3 varianter hver). Cache per ark og oppløsning. Palett `P`. |
| `fx.ts` | Effekter i ekte tid: bølger, røyk, hval som tas, unger som popper, døde flokker, båtenes kurs og sprett, tønne- og årshopp, arkbytte, `rykk` (hele bildet hopper), `lås` (en rav ring strammer seg når båten slippes på flokken), `fred` (FREDET/FORBUDT-stempelet slås). `fraHendelse` leser spillets hendelser. |
| `draw.ts` | Scenen: arkbytte, havnesona (lyser når du drar), en tynn grense rundt flokken (rav når du drar dit), flokken som én stor hval som selv bærer fargen (grønn/rød kant og skygge = vokser/krymper, blinker nesten tom, ingen kant = fredet; `hvalLengde`: artens lengde ganger hvor full flokken er, kjølvann, stor sprut, ungen svømmer inn som en liten hval), rødt pausemerke over båter når kvoten er tatt, båter ovenfra, prislapp, fangstlinjer, fat, hint (fast pil + hånd), drag, sikte, oljedråper, lampelys. |
| `hud.ts` | Kartusjen (år, hav, år til 1968), regnskapet (`REGNSKAP`, `linjer`): tønna med fyllnivå og linjer med vanlige ord - «Tom om N år!» bare når det haster, «Inn 4 - ut 3 fat i året», fra 1929 «Oljeprisen: full / Prisen faller snart! / N %», fra 1946 «Kvote: N av 12 hval / Kvoten er tatt!» (`regnskapH` = høyden etter antall linjer, `prisLinje` til tap-bildet), stripa nederst (tegnforklaring; fra 1904 artene i stedet for «tar hval» og fat-teksten; tidslinje), tap-bildet og `tapTekst` (årsaken i én setning, også på slutt-kortet). KONKURS slås under regnskapet. |
| `TapKort.tsx` | Slutt-kortet (tap og seier): lite, på motsatt side av stempelet (`tapMål` i `hud.ts`), én setning, ett punkt fra «Dette skjedde» og én stor knapp. Rekorden står i menyen. |
| `skall.ts` | Tema, kvalitetsnivå (`velgNivå`) og tallene for frys, hit-stop og hvor oljetallene spretter (`PENGER`, under regnskapet). |
| `texts.ts` | Mål (menyen er én linje), lapper (maks 7 ord; rød ring, marked, forbud, fredning, kvote, kvote for høy, vendepunktene `år1904`, `år1925`, `år1931`, `år1946`), lærings-øyeblikk (`ØYEBLIKK`: nyttår, pris, fredning), tips (`TIPS_PRIS` når prisfallet felte selskapet), «Dette skjedde», lærdom (også `kvote` og `arter`). |

## Kjerneløkka

1. Eleven drar en båt (`send`). Slippes den på en flokk, følger den flokken. Slippes den i havnesona, legger den seg på plassen sin (`hjemme`). Ligger båten i ro innenfor `fangst.radius`, tar den én hval per `fangst.intervall`, og et fat ruller hjem til havna eller kokeriet. Først i tønna teller fatet (`innIÅr`).
2. Hver hval får en unge med sjansen `fødsel.perHvalPerSek` per sekund. `f.netto` = fødsler minus fangst; hvalen har grønn kant når den er >= 0. `kritisk` -> `reddet` når en nesten tom flokk vokser til halvparten igjen.
3. Ny teknikk = en båt til salgs i havna (`tilbud`). Eleven kjøper ved å dra den ut (`pris` fra tønna), eller lar være. Til salgs koster den ingenting.
4. Oljemarkedet (fra 1929): hvert fat som kommer hjem, legges på `lager`, som tømmes med `kjøpPerÅr` fat per år (færre fra 1931, `krise`). Over grensa faller `pris` (verdien av nye fat), og ved nyttår mister tønna like mye i verdi (`krakk`). Det er overfangst som gir konkurs med full tønne.
5. Fredning: 1904 låses Finnmark-flokkene (båtene seiler hjem) og 1,4 s etter kommer Sør-Georgia-arket. 1966 låses blåhval-flokkene. Låste flokker føder videre, men ingen kan fange der.
6. Årsskifte: `årsKost` = stasjonen (`fast`) + full pris for båter ute + `havnAndel` for båter i havna. Under null = konkurs (ikke før `gulvTil`). Grønt år (poeng) = fangsten betalte året og havet krympet ikke.
7. Brett: 1880 Nordkapp, 1892 Sørøya (reserve), 1904 nytt ark (Sør-Georgia), 1925 nytt ark (Sørishavet) med kokeriet til salgs. Seier når 1969 begynner.

## Tekst (RederensKart.tsx, `hendelse`)

Lærings-øyeblikk (maks tre): `nyttår` (årsskiftet til 1880), `pris` (1,6 s etter første prisfall), `fredning` (1,8 s etter 1966). Rød hval forklares med en lapp ved hvalen første gang (`sjekkRød`), ikke en boks. Hit-stop (`STOPP`) og `rykk` ved slipp på flokk, kjøp, død, prisfall, fredning og tap. Myk start (`roligStart`): ingen oljetall eller dråper før 3 s etter første slipp. Vendepunktene er lapper på kartet, ikke banner: 1904 og 1925 når arket byttes, 1946 ved kvoten (`vedVendepunkt` = flokken lengst fra havna, så lappen aldri dekker båtene), 1931 under regnskapet (`vedRegnskap`). Første gang båtene stanser for kvoten: lapp ved en båt. Lapper: start, til salgs (over prislappen, `vedSalg`), for dyrt (ved båten), flokk borte, taster. Flytere: +olje og -kost under regnskapet (`PENGER`), -pris ved kjøp, -tap ved prisfall, «Flokken kom seg!», «På håret!». Bare seieren har banner.

## Knapper

- Hvor raskt havet tømmes: `fangst.intervall`, `fødsel.perHvalPerSek`, `maks` per flokk.
- Økonomien: `fatVerdi`, `vedlikehold`, `kokeri`, `havnAndel`, `fast`, `tilbud[].pris`. `fast` i 1904 og 1925 er det som feller «sparsom» (én båt betaler ikke stasjonen).
- Hvor mye eleven må følge flokkene: `fart`, `rx`/`ry` i `levels.ts`.

## Fallgruver

- Plasser for HUD: kartusjen dekker x 16-230, y 16-88; regnskapet x 672-896, y 12-108 (fire linjer: til y 122); stripa y 500-540; knappene øverst til høyre. Flokker (sløyfe + radius 46) må ligge utenfor. Oljetallene spretter fra y 166 og stiger ca. 35, så de stopper under regnskapet.
- Havnesona må ikke overlappe noen flokksløyfe, ellers kan båten ikke slippes på flokken.
- `lav * maks` må være over `tomtHav` (6) i brett 1.
- Alle økonomitall er olje per år, men årene går i ulik fart (1,5 / 2 / 2,5 s). Fangst og fødsler er per sekund.
- Markedsroboten må se på lageret (staven), ikke telle fat per år: år på 2,5 s gir så mye støy at «fat i fjor» fikk forvalteren til å sende båtene hjem og ut igjen, og den gikk konkurs.
- Grønt år målt per flokk (hver fanget flokk minst like stor) ga «sparsom» flere poeng enn «forvalter». Behold målet for hele havet.
- Flytende oljetall (+inn, -kost, prisfall, «På håret!») spretter under regnskapet (`PENGER` i `skall.ts`). Ved x 630 dekket de FINNMARK; ved x 430 dekket prisfallet båtene i havna i Sørishavet.
- Lapper (`text.point`) står alltid over ankeret. Et anker i regnskapet gir tekst oppå tekst: bruk `vedRegnskap` (under kortet) eller et anker på kartet.
- Lærings-øyeblikket om fredning har ikke anker: kortet midt øverst dekker ingen FREDET-stempler. FREDET tegnes etter båtene.
- Årene er 30 % kortere enn før vurdering 2. Alt som er «per år» (vedlikehold, `fast`, kokeri, `marked.kjøpPerÅr`) og robotenes buffere i år (`kjøpReserve`, `presset`) er skalert likt. `marked.grense` er et lagernivå og skaleres ikke.
- Båtene legger seg `båt.følgAvstand` (26 px) fra midten av flokken, på siden de ble sluppet (eller kom fra), så hvalen i midten synes. Robotene slipper midt på flokken.
- Artene endrer økonomien: blåhval gir 1,4 x olje men føder 0,3 x, så den blir tatt ned først og er nesten borte rundt 1960 (robotene tar den ned til 15 %). Flokker med blåhval må starte nær `høy` (0,75 av maks), ellers sender forvalteren aldri båter dit og står stille i årevis (Georgia ga 14 % seier med blåhval på n 16).
- Stasjonen i Sørishavet koster 3,5 i 1925-1927 og 5 fra 1928: med 5 fra 1925 gikk forvalteren konkurs ved overgangen; med 3,5 hele veien vant «sparsom» (én båt på en stor blåhvalflokk betalte stasjonen).
