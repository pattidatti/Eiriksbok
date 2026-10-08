# Rederens kart - kart over mappa

Gråboks (fase 3a, etter diagnose 1). Brief: `docs/microgames/briefer/rederens-kart.md`.
Komponent: `../RederensKart.tsx` (skall, input, lagring, meny/pause/slutt-skjerm, hint, selvspill).

| Fil | Hva den gjør |
| --- | --- |
| `tuning.ts` | Alle tallene: tid (sek per år per periode), fangst (radius, intervall, fatVerdi, fatFart), fødsel, tomtHav, båt (fart, havnSnap, havnPlass, følgAvstand), økonomi (startTønne, vedlikehold per periode, kokeri, havnAndel, gulvTil), flåte, vandring, poeng, press, ranger. |
| `levels.ts` | `KART` (havn og land per kartark) og `BRETT` (år, havnavn, nytt kartark, flokker med sløyfe). `brettFor(år)`. |
| `game.ts` | Tilstanden, `newGame`, `havnPlass`, grepet `send(g, id, x, y)` og kjerneløkka `update`: vandring og fødsler, båter som følger flokken og fanger, fat hjem, tomt hav, årsskifte (vedlikehold, `betalt` og `tappere` for dråpene og tap-bildet, konkurs, grønne år, nye brett og båter, seier). |
| `rules.ts` | Fagkjernen og hjelpere: `fangerFra`, `fødselsrate`, `årLengde`, `vedlikehold`, `havnKost` (full pris ute, `havnAndel` i havna), `årsKost`, `iHavn` (= `b.hjemme`), `sløyfe`/`framtid`, `press`, `framdrift`. |
| `bots.ts` / `sim.ts` | Robotene (`vett()`: lav/høy terskel, hver, tønneVett, maksUte, hjemTom; `grådig`, `tilfeldig`) og simuleringskontrakten. |
| `draw.ts` | Gråboks-tegningen: land, havn med tønne som søyle (én strek per år) og «tom om N år», flokker (prikker + ring som målestokk), båter, fat, oljedråper, hint med hånd, kartusj med tellestreker, tidslinje med flagg ved 1968, tegnforklaring, lapper og tap-bildet (`tegnTap`). |
| `texts.ts` | Mål, regler, tips, «Dette skjedde», lærdom. |

## Kjerneløkka

1. Eleven drar en båt (`send`). Slippes den på en flokk, følger den flokken (`følger`, avstand `følgAvstand`) til eleven flytter den. Slippes den ved havna (`havnSnap`), legger den seg på plassen sin (`havnPlass`) og er `hjemme`. Ligger båten i ro innenfor `fangst.radius` av en levende flokk, tar den én hval per `fangst.intervall`, og et fat ruller hjem til havna eller kokeriet. Først i tønna teller fatet.
2. Hver hval får en unge med sjansen `fødsel.perHvalPerSek` per sekund (aldri over `maks`). `f.netto` = fødsler minus fangst per sekund; ringen er grønn når den er >= 0, og buen viser `n / maks`. Én båt tar mer enn en full flokk føder.
3. Flokkene vandrer langs en sløyfe (`fart` i `levels.ts`). Båten følger selv, så valget er hvilken flokk og når den skal hvile, ikke å jage.
4. Årsskifte: `årsKost` trekkes fra tønna: full pris for båter ute, `havnAndel` for båter i havna, kokeriet `kokeri` (havnAndel i havna). Under null = konkurs (ikke før `gulvTil`). Grønt år = noe fanget og havet krympet ikke; gir bonus etter `poeng.grønnBonus`.
5. Nye brett: 1880 ny flokk, 1892 reserveflokk ved Sørøya (grønn å flytte til), 1904 nytt ark (Sør-Georgia), 1925 nytt ark (Sørishavet) og kokeriet. Nye båter legger seg i havna etter `flåte`; eleven velger selv hvor mange som går ut.
6. Tap: færre enn `tomtHav` hval eller alle flokker borte (tomt hav), eller konkurs. Seier når 1969 begynner.

## Knapper

- Hvor raskt havet tømmes: `fangst.intervall`, `fødsel.perHvalPerSek`, `maks` per flokk.
- Hvor hardt økonomien presser: `fatVerdi`, `vedlikehold`, `kokeri`, `havnAndel`, `flåte`. `havnAndel` skiller sparsom (for få ute) fra halvgod: 0,25 lot sparsom leve til 1941, 0,5 gjør havna dyr.
- Hvor mye eleven må følge flokkene: `fart` og `rx`/`ry` i `levels.ts`.

## Fallgruver

- Båtene følger flokken selv. En robot som sender båten til `framtid` i stedet for flokken, mister `følger` hvis punktet ligger utenfor `fangst.radius`.
- `lav * maks` må være over `tomtHav` (6) i brett 1: en robot som tar Varanger ned til 5 før den flytter, taper i 1870 uansett hva den gjør etterpå.
- Alle økonomitall er olje per år, men årene går i ulik fart (1,5 / 2 / 2,5 s). Fangst og fødsler er per sekund.
