# Rederens kart - kart over mappa

Ferdig bygd (fase 3b, etter diagnose 2). Brief: `docs/microgames/briefer/rederens-kart.md`.
Komponent: `../RederensKart.tsx` (skall, input, lyd, tekst via `useArcadeText`, lagring, meny/pause/slutt-skjerm, selvspill).

| Fil | Hva den gjør |
| --- | --- |
| `tuning.ts` | Alle tallene: tid, fangst, fødsel, tomtHav, båt, økonomi (vedlikehold, kokeri, havnAndel, gulvTil, `fast` = stasjonen), `startBåter`, `tilbud` (båter til salgs: år, pris, kokeri), `maksTilbud`, vandring, poeng, press, ranger. |
| `levels.ts` | `KART` per kartark: havn, `sone` (havna som rektangel), `plasser` (faste båtplasser), `kokeriPlass`, land/is, stedsnavn, kompassrose, dybdekurver, `alder` (hvor gulnet). `BRETT` (år, hav, nytt ark, flokker). `brettFor`, `iSone`. |
| `game.ts` | Tilstanden, `newGame` (båt 1 i havna, båt 2 alt ute på Vadsø-flokken = rød ring fra start), `send` (grepet; drar du en båt til salgs ut av havna, er den kjøpt), og `update`: vandring, fødsler, fangst, fat, tomt hav, årsskifte (`fyllTilbud`, regnskap `innIÅr`/`sist`), tap og seier. |
| `rules.ts` | Fagkjernen og hjelpere: `fangerFra`, `fødselsrate`, `årLengde`, `vedlikehold`, `fastKost`, `havnKost` (0 til salgs), `årsKost`, `egne`, `sløyfe`, `press`, `framdrift`. |
| `bots.ts` / `sim.ts` | Robotene (`vett()`: lav/høy, hver, tønneVett, maksUte, hjemTom, `kjøpReserve`; `grådig`, `tilfeldig`) og simuleringskontrakten. |
| `ark.ts` | Kartarket som offscreen-canvas (papir, fiber, flekker, bretter, kurslinjer, vannlinjer, land/is med skravering, rose, dybder, navn, gradert ramme) og hvalstempelet (4 varianter). Cache per ark og oppløsning. Palett `P`. |
| `fx.ts` | Effekter i ekte tid: bølger, røyk, stempler som tas, unger som popper, døde flokker, båtenes kurs og sprett, tønne/år/grønt-stempel, arkbytte. `fraHendelse` leser spillets hendelser. |
| `draw.ts` | Scenen: arkbytte, havnesona (lyser når du drar), ringer (blå bue = hval igjen, grønt/rødt bånd med piler = vokser/krymper), stempler, båter ovenfra, prislapp, fangstlinjer, fat, hint (fast pil + hånd), drag, sikte, oljedråper, lampelys. |
| `hud.ts` | Kartusjen (år, hav, år til 1968, tellestreker, GRØNT ÅR-stempel), regnskapet med tønna (I tønna, Inn i år, Ut ved nyttår, ikon per båt: fylt = ute, omriss = havn, «Tom om N år»), stripa nederst (tegnforklaring + tidslinje med flagg ved 1968 og rekordmerke), tap-bildet. |
| `texts.ts` | Mål, regler, lapper (maks 7 ord), lærings-øyeblikk (`ØYEBLIKK`: rød, nyttår, kokeri), tips, «Dette skjedde», lærdom. |

## Kjerneløkka

1. Eleven drar en båt (`send`). Slippes den på en flokk, følger den flokken. Slippes den i havnesona, legger den seg på plassen sin (`hjemme`). Ligger båten i ro innenfor `fangst.radius`, tar den én hval per `fangst.intervall`, og et fat ruller hjem til havna eller kokeriet. Først i tønna teller fatet (`innIÅr`).
2. Hver hval får en unge med sjansen `fødsel.perHvalPerSek` per sekund. `f.netto` = fødsler minus fangst; ringen er grønn når den er >= 0. `kritisk` -> `reddet` når en nesten tom flokk vokser til halvparten igjen.
3. Ny teknikk = en båt til salgs i havna (`tilbud`). Eleven kjøper ved å dra den ut (`pris` fra tønna), eller lar være. Til salgs koster den ingenting.
4. Årsskifte: `årsKost` = stasjonen (`fast`) + full pris for båter ute + `havnAndel` for båter i havna. Under null = konkurs (ikke før `gulvTil`). Grønt år = noe fanget og havet krympet ikke.
5. Brett: 1880 Nordkapp, 1892 Sørøya (reserve), 1904 nytt ark (Sør-Georgia), 1925 nytt ark (Sørishavet) med kokeriet til salgs. Seier når 1969 begynner.

## Tekst (RederensKart.tsx, `hendelse`)

Lærings-øyeblikk (maks tre): `rød` (første flokk under 62 % med båt på, `sjekkRød`), `nyttår` (årsskiftet til 1880), `kokeri` (kokeriet til salgs). Lapper: start, til salgs, for dyrt, flokk borte, tønna snart tom, taster. Flytere: +olje ved havna (samlet), -kost ved nyttår, -pris ved kjøp, «Flokken kom seg!», «På håret!».

## Knapper

- Hvor raskt havet tømmes: `fangst.intervall`, `fødsel.perHvalPerSek`, `maks` per flokk.
- Økonomien: `fatVerdi`, `vedlikehold`, `kokeri`, `havnAndel`, `fast`, `tilbud[].pris`. `fast` i 1904 og 1925 er det som feller «sparsom» (én båt betaler ikke stasjonen).
- Hvor mye eleven må følge flokkene: `fart`, `rx`/`ry` i `levels.ts`.

## Fallgruver

- Plasser for HUD: kartusjen dekker x 16-230, y 16-108; regnskapet x 688-896, y 12-132; stripa y 500-540; knappene øverst til høyre. Flokker (sløyfe + radius 46) må ligge utenfor.
- Havnesona må ikke overlappe noen flokksløyfe, ellers kan båten ikke slippes på flokken.
- `lav * maks` må være over `tomtHav` (6) i brett 1.
- Alle økonomitall er olje per år, men årene går i ulik fart (1,5 / 2 / 2,5 s). Fangst og fødsler er per sekund.
- Grønt år målt per flokk (hver fanget flokk minst like stor) ga «sparsom» flere poeng enn «forvalter». Behold målet for hele havet.
