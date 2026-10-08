# Rederens kart - kart over mappa

Gråboks (fase 3a). Brief: `docs/microgames/briefer/rederens-kart.md`.
Komponent: `../RederensKart.tsx` (skall, input, lagring, meny/pause/slutt-skjerm, hint, selvspill).

| Fil | Hva den gjør |
| --- | --- |
| `tuning.ts` | Alle tallene: tid (sek per år per periode), fangst (radius, intervall, fatVerdi, fatFart), fødsel, tomtHav, båt (fart, havnSnap), økonomi (startTønne, vedlikehold per periode, kokeri, gulvTil), flåte, vandring, poeng, press, ranger. |
| `levels.ts` | `KART` (havn og land per kartark) og `BRETT` (år, havnavn, nytt kartark, flokker med sløyfe). `brettFor(år)`. |
| `game.ts` | Tilstanden, `newGame`, grepet `send(g, id, x, y)` og kjerneløkka `update`: vandring og fødsler, båter som fanger, fat hjem, tomt hav, årsskifte (vedlikehold, konkurs, grønne år, nye brett og båter, seier). |
| `rules.ts` | Fagkjernen og hjelpere: `fangerFra`, `fødselsrate`, `årLengde`, `vedlikehold`, `årsKost`, `sløyfe`/`framtid`, `press`, `framdrift`. |
| `bots.ts` / `sim.ts` | Robotene (`vett()`: lav/høy terskel, hver, følg, forut, tønneVett, maksUte; `grådig`, `tilfeldig`) og simuleringskontrakten. |
| `draw.ts` | Gråboks-tegningen: land, havn med tønne, flokker (prikker + ring), båter, fat, kurs, hint-pil, kartusj, tegnforklaring, lapper. |
| `texts.ts` | Mål, regler, tips, «Dette skjedde», lærdom. |

## Kjerneløkka

1. Eleven drar en båt (`send`). Båten tøffer dit og ligger i ro. Ligger den innenfor `fangst.radius` av en levende flokk, tar den én hval per `fangst.intervall`, og et fat ruller hjem til havna eller kokeriet. Først i tønna teller fatet.
2. Hver hval får en unge med sjansen `fødsel.perHvalPerSek` per sekund (aldri over `maks`). `f.netto` = fødsler minus fangst per sekund; ringen er grønn når den er >= 0. Én båt tar mer enn en full flokk føder.
3. Flokkene vandrer langs en sløyfe (`fart` i `levels.ts`), så båten blir liggende og flokken glir bort.
4. Årsskifte: `årsKost` trekkes fra tønna. Under null = konkurs (ikke før `gulvTil`). Grønt år = noe fanget og havet krympet ikke; gir bonus etter `poeng.grønnBonus`.
5. Nye brett: 1880 ny flokk, 1904 nytt ark (Sør-Georgia), 1925 nytt ark (Sørishavet) og kokeriet. Flåten fylles opp etter `flåte`.
6. Tap: færre enn `tomtHav` hval eller alle flokker borte (tomt hav), eller konkurs. Seier når 1969 begynner.

## Knapper

- Hvor raskt havet tømmes: `fangst.intervall`, `fødsel.perHvalPerSek`, `maks` per flokk.
- Hvor hardt økonomien presser: `fatVerdi`, `vedlikehold`, `kokeri`, `flåte`.
- Hvor mye eleven må følge flokkene: `fart` og `rx`/`ry` i `levels.ts`.

## Fallgruver

- En robot som følger flokken, må sammenligne med der flokken skal være (`framtid`), ellers sender den båten på nytt hvert tick og står fast.
- Alle økonomitall er olje per år, men årene går i ulik fart (1,5 / 2 / 2,5 s). Fangst og fødsler er per sekund.
