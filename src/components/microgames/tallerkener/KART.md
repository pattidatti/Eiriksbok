# Elleve år (`kongens-tallerkener`) - kart over mappa

Gråboks (fase 3a). Brief: `docs/microgames/briefer/kongens-tallerkener.md`. Komponent: `../KongensTallerkener.tsx`.

| Fil         | Hva den gjør                                                                                                   |
| ----------- | -------------------------------------------------------------------------------------------------------------- |
| `tuning.ts` | Alle tallene: snurr, tallerkentyper (gull, vekt, `tak` per år), start, bue (nabo, nedkjøling), protest, forbruket per år og `krig`, sidene, parlamentet, poeng, press. Endre her først. |
| `levels.ts` | Stengene på scenen (`SLOTS`: x og dybde), `avstand`/`naboer` (hvem én bue når) og brettene (`BRETT`, `brettFor(år)`). |
| `state.ts`  | Typene (`Game`, `Slot`, `Plate`, `Page`, `Tin`, `GameEvent`) og `newGame(seed)` (tre tallerkener fra start). Ingen regler. |
| `rules.ts`  | Fagkjernen og grepene: `swipeHit`/`swipe` (snurr, kombo, nabo-bue, nedkjøling, overspinn, titler gir tvungen ny tallerken), `acceptPage`, `parlamentTar`/`takeParliament`, `forbruk`, `inntekt(stang)`. |
| `game.ts`   | Kjerneløkka `update(g, dt)`: kalender og årsoppgjør (poeng), protester, snurr dør ut, ærlige valg, gull inn/ut, sider, tinntallerkenen, seier og tap. `pressure(g)`. |
| `bots.ts`   | Robotene: seende, halvgod, tar-alt, aldri-parlament (`BOTS`) og knappemoseren (`makeRandomBot`).                |
| `sim.ts`    | `SimSpec` for `scripts/sim-microgame.mts`, `snapshotOf()`, `BOT_INFO`, `ARSAK` (delt med `usePlaytest`).        |
| `layout.ts` | Hvor alt står på flata 960x540 og treff for pekeren (`segmentHits`, `FART_REF` = fart 1 i px/s).               |
| `draw.ts`   | Gråboks-tegningen med primitive former (trekant = skip, sirkel = monopol, firkant = våpenskjold). `ViewState`. |
| `texts.ts`  | Tips ved tap, rangene (etter år alene), sluttlinja «Du styrte alene i N år. Karl klarte 11.».                   |

## Kjerneløkka

Tre regler eleven skal huske: snurr kildene; kista tømmes; parlamentet gir gull mot en stang.

1. Eleven tegner en bue. Hvert linjestykke som krysser en tallerken, kaller `swipeHit` med farten:
   snurr += fart x `snurr.perFart`. Over `snurr.flyr` flyr den. Buen når bare naboen til forrige
   tallerken (`bue.nabo`), og en ny bue kan ikke treffe før `bue.nedkjoling` s etter forrige.
2. To eller flere i samme bue = kombo: xN gull i `snurr.komboTid` s. (Rundemultiplikatoren er kuttet.)
3. Snurret dør ut med `spinTap` (`tapPerAar` = 12 % tyngre hvert år fra 1629). Fra 1634 gir en
   protest hvert `protest.hver` s én tilfeldig tallerken et dytt på `protest.dytt`.
4. Hver stang er en egen kilde (skip, monopol, våpenskjold) med et `tak` på gull per år.
   Et våpenskjold i overspinn selger en tittel, og en ny våpenskjold-tallerken settes inn på en
   ledig stang (du kan ikke si nei).
5. Kista: + `inntekt` fra snurrende tallerkener under taket, - `forbruk(g)` (tabell per år, + `krig`
   fra 1639, + `overtidVekst` per år etter 1640).
6. Fra brett 2 bærer sider inn nye tallerkener hvert `sider.hver` s.
7. Fra 1635 senker tinntallerkenen seg (en parlamentsøkt). Slipp den på en stang: stanga heises til
   taket for godt (før 1639 også nærmeste egne stang, `parlament.forKrigen`), og den øser
   `gull/gullSent/gullStorm` over `oser` s. Fra 1639 kommer den med en gang og oftere.
8. Poeng ved hvert årsskifte: gull i kista x stenger igjen. Seier: 1640 med gull i kista, så overtid.
   Tap før 1640 (tom kiste eller ingen stenger) halverer poengene (`poeng.tap`).
9. `valg` telles bare når en ny tallerken vakler mens minst én annen vakler, og når parlamentet
   senker seg.

## Knapper som styrer mest

- Om aldri-parlament dør i 1639: `kiste.forbruk` (1635-1638) og `kiste.krig`.
- Om halvgod overlever krigen: `parlament.gullStorm`, `kiste.krig`, `kiste.forbruk` 1636-1638.
- Om tar-alt mister alle stengene før 1639: `parlament.forKrigen` + syklusen (`hver`, `nede`, `oser`).
- Press i første tredjedel: `kiste.start` og `kiste.forbruk` 1629-1631.
- Hvor hardt sjongleringen er: `snurr.tap`, `snurr.tapPerAar`, `bue.nedkjoling`, `protest`.

## Fallgruver

- Poeng kommer bare fra årsoppgjøret; parlamentets gull teller gjennom kista, men koster stenger.
- `aarNa(g)` er desimalår; `forsteParlament` er heltallsåret da første økt ble tatt.
- Robotene sveiper med samme `swipe` som pekeren, men uten piksel-sikting (fart regnes ut). De
  respekterer nedkjølingen og bygger buen fra nabo til nabo.
- Komponenten tømmer `g.events` hver frame (gråboksen har ingen juice ennå; `protest` har ingen visning).
