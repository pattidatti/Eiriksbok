# Elleve år (`kongens-tallerkener`) - kart over mappa

Gråboks (fase 3a). Brief: `docs/microgames/briefer/kongens-tallerkener.md`. Komponent: `../KongensTallerkener.tsx`.

| Fil         | Hva den gjør                                                                                                   |
| ----------- | -------------------------------------------------------------------------------------------------------------- |
| `tuning.ts` | Alle tallene: snurr, tallerkentyper, forbruket per år, sidene, parlamentets tallerken, poeng, press. Endre her først. |
| `levels.ts` | Stengene på scenen (`SLOTS`: x og dybde) og brettene (`BRETT`, `brettFor(år)`): sider, parlament, gratis erstatning. |
| `state.ts`  | Typene (`Game`, `Slot`, `Plate`, `Page`, `Tin`, `GameEvent`) og `newGame(seed)`. Ingen regler.                    |
| `rules.ts`  | Fagkjernen og grepene: `swipeHit`/`swipe` (snurr, kombo, overspinn, flyr), `acceptPage`, `takeParliament`, `forbruk`, `inntekt`. |
| `game.ts`   | Kjerneløkka `update(g, dt)`: kalender, snurr dør ut, gull inn/ut, sider, tinntallerkenen, seier og tap. `pressure(g)`. |
| `bots.ts`   | Robotene: seende, halvgod, tar-alt, aldri-parlament (`BOTS`) og knappemoseren (`makeRandomBot`).                |
| `sim.ts`    | `SimSpec` for `scripts/sim-microgame.mts`, `snapshotOf()`, `BOT_INFO`, `ARSAK` (delt med `usePlaytest`).        |
| `layout.ts` | Hvor alt står på flata 960x540 og treff for pekeren (`segmentHits`, `FART_REF` = fart 1 i px/s).               |
| `draw.ts`   | Gråboks-tegningen med primitive former. `ViewState` (glansvinkel, buesporet, drag).                            |
| `texts.ts`  | Tips ved tap, rangene (etter år alene), sluttlinja «Du styrte alene i N år. Karl klarte 11.».                   |

## Kjerneløkka

1. Eleven tegner en bue (pointerdown/move). Hvert linjestykke som krysser en tallerken, kaller
   `swipeHit` med farten der: snurr += fart x `snurr.perFart`. Over `snurr.flyr` flyr den.
2. Tallerken nummer to i samme bue = kombo: alle i buen gir xN gull i `snurr.komboTid` s, og
   rundemultiplikatoren `g.mult` stiger med `rundeMultPerKombo`. Fall eller fly nullstiller den.
3. Snurret dør ut med `spinTap` (tyngre for hvert år fram til 1640, våpenskjold 1,9x). Under
   `vakle` vakler den (et nytt valg telles), under `slakk` gir den ikke gull, ved 0 faller den.
4. Kista: + `inntekt` fra snurrende tallerkener, - `forbruk(g)` (tabell per år, x`storm` fra 1639,
   +`overtidVekst` per år etter 1640).
5. Fra brett 2 bærer sider inn nye tallerkener hvert `sider.hver` s (først nye stenger bakover,
   så tomme stenger mot `sider.erstatt` gull). Dra tallerkenen til stanga før `sider.venter` s.
6. Fra 1635 senker tinntallerkenen seg (`parlament.nede` s). Dra den til en stang: stanga heises
   til taket for godt, tinntallerkenen øser `gull/gullSent/gullStorm` over `oser` s.
7. Seier: 1640 med gull i kista (`g.won`), runden går videre som overtid. Slutt: tom kiste
   (`kiste`) eller alle `kroker` fulle (`parlament`). Fasen er `vunnet` hvis `g.won`.

## Knapper som styrer mest

- Om aldri-parlament dør i 1639: `kiste.forbruk` (1635-1638) og `kiste.storm`.
- Om halvgod overlever krigen: `parlament.gullStorm`, `parlament.hverStorm`, `oser`.
- Om tar-alt mister alle stengene før 1640: `parlament.hver` + `nede` + `oser` (syklusen).
- Hvor hardt sjongleringen er: `snurr.tap`, `snurr.tapPerAar`, `typer.vapen.vekt`.

## Fallgruver

- Poeng er bare gull fra egne tallerkener x `g.mult`; parlamentets gull gir ikke poeng.
- `aarNa(g)` er desimalår; `forsteParlament` er heltallsåret da første tinntallerken ble tatt.
- Robotene sveiper med samme `swipe` som pekeren, men uten piksel-sikting (fart regnes ut).
- Komponenten tømmer `g.events` hver frame (gråboksen har ingen juice ennå).
