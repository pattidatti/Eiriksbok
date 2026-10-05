# Elleve år (`kongens-tallerkener`) - kart over mappa

Ferdig spill (2D-canvas). Brief: `docs/microgames/briefer/kongens-tallerkener.md`. Komponent: `../KongensTallerkener.tsx`
(arkadeskall, THEME, HUD-kartusjene, tekst via `useArcadeText`, pause, lyd, rekord, `usePlaytest`).

| Fil         | Hva den gjør                                                                                                   |
| ----------- | -------------------------------------------------------------------------------------------------------------- |
| `tuning.ts` | Alle tallene: snurr, tallerkentyper (gull, vekt, `tak` per år, `tyngre` per år), start, bue, protest, tvungne `titler`, kista (`forbruk`, `krig`, `hoff`), sidene, parlamentet (`tilbud`), poeng, press. Endre her først. |
| `levels.ts` | Stengene på scenen (`SLOTS`: x og dybde), `avstand`/`naboer` (hvem én bue når) og brettene (`BRETT`, `brettFor(år)`). |
| `state.ts`  | Typene (`Game`, `Slot`, `Plate`, `Page`, `Tin`, `Flyt`, `GameEvent`) og `newGame(seed)`. Ingen regler. |
| `rules.ts`  | Fagkjernen og grepene: `swipeHit`/`swipe`, `acceptPage`, `parlamentTilbud`/`parlamentTar`/`takeParliament`, `hoffForbruk`, `skottetrekk`, `inntekt(stang)`. |
| `game.ts`   | Kjerneløkka `update(g, dt)`: kalender og årsoppgjør (poeng), tvungne titler, protester, snurr dør ut, gull inn/ut (hoff, skotter), sider, tinntallerkenen, seier og tap. `pressure(g)`. |
| `bots.ts`   | Robotene: seende, halvgod, tar-alt, aldri-parlament, mester-alene (`BOTS`) og knappemoseren (`makeRandomBot`). |
| `sim.ts`    | `SimSpec` for `scripts/sim-microgame.mts`, `snapshotOf()`, `BOT_INFO`, `ARSAK` (delt med `usePlaytest`).        |
| `layout.ts` | Hvor alt står på flata 960x540 (`STAGE`, `VP`, `CHEST`, `TIN`, `hookPos`, `lampPos`) og treff for pekeren (`segmentHits`, `FART_REF`). |
| `art.ts`    | Kunsten som tegnes én gang per oppløsning (`buildArt`): bakteppe med havn, skystripa (`skyer`, glir i `drawSkies`), kulissene (`wings`, over skyene), gulv, proscenium, skyrekke, vignett, lerretskorn, teppet, stormkulissen og ikonene (skip, segl, våpenskjold). |
| `fx.ts`     | Visningstilstanden (`ViewState`): mynter, gnister, røyk, fallende tallerkener, heising til loftet, sidene, tinntallerkenens vei, storm, lyn, skottenes hånd, teppet, rysting og hit-stop. `onEvents` gjør hendelser til lyd og bevegelse. |
| `draw.ts`   | Tegningen per bilde (`drawGame`): stenger og tallerkener (vakling, glans, overspinn, protest, «reddet»), navneskilt, prislapper, tinntallerkenen, storm, støv, sporet. |
| `pit.ts`    | Orkestergraven: rampelysene (gulltaket), kista med myntberget, skottenes hånd, myntene og sekkene. |
| `sfx.ts`    | Lyden (`makeSfx`): syngende metall, mynter, knusing, tinnklokke, sekker, trommer og torden. |
| `YearBar.tsx` | Tidslinja 1629-1649 på slutt-skjermen (merker 1640, 1642, 1649) og fargene `GOLD`, `CREAM`, `KRONE`. |
| `SluttSkjerm.tsx` | Slutt-skjermen (`Result`): seier eller tap, ett regnskap «gitt bort + igjen = stenger», rang, «Dette skjedde». |
| `texts.ts`  | Tips ved tap, `seierLinje`, rangene (etter år alene, med desimal), `sluttLinje`.                                |

## Kjerneløkka

Tre regler eleven skal huske: snurr kildene; kista tømmes; parlamentet gir gull mot en stang.

1. Eleven tegner en bue. Hvert linjestykke som krysser en tallerken, kaller `swipeHit` med farten:
   snurr += fart x `snurr.perFart`. Over `snurr.flyr` flyr den. Buen når bare naboen til forrige
   tallerken (`bue.nabo`), og en ny bue kan ikke treffe før `bue.nedkjoling` s etter forrige.
2. To eller flere i samme bue = kombo: xN gull i `snurr.komboTid` s (hit-stop fra tre).
3. Snurret dør ut med `spinTap` (typens `tyngre` per år: skipsskatten +15 %). Fra 1634 mister
   tallerkenen som tjener mest, halve snurret hvert `protest.hver` s og slingrer rødt uten gull.
4. Hver stang er en egen kilde (skip, monopol, våpenskjold) med et `tak` på gull per år. I årene
   `TUNING.titler` settes en tvungen våpenskjold-tallerken på en ledig stang (lett i 2 s).
5. Kista: + `inntekt`, - `hoffForbruk`, - `skottetrekk` (fra 1639, stiger i overtiden), og
   hoffkostnaden `kiste.hoff` på alt over 90 gull. Å spare lønner seg ikke.
6. Fra brett 2 bærer sider inn nye tallerkener hvert `sider.hver` s.
7. Fra 1639 (låst til skottene kommer) senker tinntallerkenen seg (en parlamentsøkt) og tilbyr de to rikeste stengene
   (`parlamentTilbud`). Slipp den på én: stanga heises til taket for godt, og den øser gull.
8. Poeng ved hvert årsskifte: gull tjent det året x stenger igjen. Seier: 1640 med gull i kista,
   så overtid. Tap før 1640 (tom kiste eller ingen stenger) halverer poengene (`poeng.tap`).
9. Hendelsene i midten (`TUNING.hendelser`, `hendelser()` i game.ts): 1632 tvunget såpemonopol,
   1633/1636 titler, 1634 protester, 1635 skipsskatt i hele landet (tvungen skip bakerst, skip
   tyngre), 1637 Hampden (alle skip får protest), 1638 skottene marsjerer (`marsj` gull/s, figurer
   i `drawSkotter`). Tast 1/2 gir parlamentet stanga med det tallet på prislappen.
10. (Gammel tekst under, se 12.) Borgerkrigen etter 1640: årene går fortere (`tid.aarOvertid` s per år, se `aarNa`), hæren tar
   den rikeste stanga hvert år i `borgerkrig.tarAar` (hendelse `haer`), runden slutter i 1649
   (`aar1649`) eller når du ikke har stenger igjen. Tre kroker (`parlament.kroker`) er slutt før 1640.
11. `valg` telles når en ny tallerken vakler mens minst én annen vakler, og når parlamentet senker seg.

12. Forbedrer 2: 1635 gir to tvungne skip-tallerkener bakerst med `fort` = `hendelser.innlandFort`
   (vakler fort); 1637 gjør skip-tallerkenen lengst inne rød (`plate.hampden` = 2 sveip, gir ikke
   gull før den er sveipet to ganger, hendelse `hampden-ok`). Etter 1640 er borgerkrigen en styrt
   epilog uten tap: ingen sider eller parlament, hæren tar stengene i `borgerkrig.stasjoner`
   (1642, 1645, 1648, 1649 - hendelsene `borgerkrig`, `nma`, `pride`, `rettssak`), og runden
   slutter 0,7 år etter 1649. Hoffkostnaden gjelder bare før 1639.

13. Forbedrer 3: etter 1640 velter soldatene én stang i 1642, 1645 og 1648 (`stasjoner`, ikke i
   1649). Slutt-skjermen teller stenger holdt til 1649 (`egneStenger` når runden slutter). HUD:
   «Stenger: N» og «Parlamentet har tatt: X av 3». Hampden-tallerkenen tegnes lilla med «×2»
   (`hampden` i `PlateLook`). Skottehånda (`drawArm`) tegnes ikke lenger.

## Knapper som styrer mest

- Om mester-alene og aldri-parlament taper: `kiste.krig` og `kiste.hoff` (lageret før krigen).
- Om halvgod overlever krigen: `parlament.gullStorm`, `kiste.krig`, `kiste.forbruk` 1636-1638.
- Om tar-alt mister alle stengene: `parlament.hver`, `nede`, `oser` og `kroker`.
- Hvor hardt sjongleringen er: `snurr.tap`, typenes `tyngre`, `bue.nedkjoling`, `protest`.

## Fallgruver

- Poeng kommer bare fra årsoppgjøret (`aarTjent`); parlamentets gull går i kista, ikke i poengene.
- `aarNa(g)` er desimalår; `forsteParlamentT` er spilltiden for første økt (år alene med desimal).
- Robotene sveiper med samme `swipe` som pekeren, men uten piksel-sikting. De velger blant
  `g.tin.tilbud` som eleven.
- Komponenten sender `g.events` til `onEvents` (fx.ts) og tømmer dem hver frame. Visningen skal
  aldri endre spilltilstand.
- Lærings-øyeblikkene har `until`, ellers står de i sakte film til eleven trykker «Skjønner».
