# Pengeballongen - kart over mappa

Gråboks (fase 4). Brief: `docs/microgames/briefer/pengeballongen.md`. Komponent: `../Pengeballongen.tsx`
(skall, input, tekst via `useArcadeText`, lagring, selvspill, meny/pause/dødskort).

| Fil | Hva den gjør |
| --- | --- |
| `tuning.ts` | Alle tallene: år (2,4 s), fart, ballongen (mål, tak), løftet (varme, akselerasjon, stigefart nede/oppe, `tynnLuft`, synk, flosshatter, rolig start), pengene (10 Spd/s, grensen 34, valgårene), Ueland-gangeren, funn, veiskillene, press, ranger. |
| `levels.ts` | Brettene (`BRETT`: bildetekst, banner, terrengregler), den høye sletta før 1833 (`SLETTE`), veiskillene, kongens navngitte utgifter og funnene med fagsetning. |
| `terrain.ts` | Tid <-> år <-> vei (`veiVed`, `tidForVei`, `fartVed`), `lagTerreng(rng)` (hele runden seedet), oppslag: `bakke`, `fastTopp` (bakke eller knaus med bom), `knausVed`. |
| `state.ts` | Typene (`Game`, `Hendelse`, `Årsak`) og `newGame(seed)`. Ingen regler. |
| `rules.ts` | Fagkjernen: `hold()` (eneste grep), `synk()`, `stig()` (tynn luft: høyt = dyrt), `klaring()`, `krasjer()`, `press()`, `rang()`. |
| `game.ts` | Kjerneløkka `update(g, dt)`: tid/vei, varme og løft, penger og spart, gangeren, funn, valgene (stemt ut / flosshatt), valgpunkter, spor, krasj, landing. |
| `bots.ts` | Robotene (én kilde for sim og usePlaytest): flink, nybegynner, sløseren, gniten, tilfeldig. `pilot()` spår med samme fysikk. |
| `sim.ts` | `SimSpec`, `snapshotOf()`, `GAME_ID`, `MAKS_SEKUNDER`. |
| `draw.ts` | Gråboks-tegningen med flate former i kunstbriefens palett `P`, `skala`/`tilSkjerm`/`flateX`, HUD (bildetekst, Spart, tidslinje, pengestabel, Ueland-oval). |
| `texts.ts` | All tekst: mål, regler, lapper, lærings-øyeblikk, tips ved tap, «Dette skjedde». |

## Kjerneløkka

1. Ballongen står fast på x = 288 og ruller mot høyre i fast fart per år. Eleven har bare ett
   grep: hold (mellomrom, pil opp, W, mus/trykk). Varmen følger knappen med `varmeTau`, farten
   følger varmen med `akselerasjon`. Ingen retning før 1884.
2. Hold koster 10 Spd/s og fyller stabelen (`periode`). Slipp sparer 10 x gangeren (`spart` = poeng).
3. Løftet er svakere høyt oppe (`stigLav` -> `stigHøy`, kurve `tynnLuft`). Derfor koster det mer
   å fly høyt, og den som skraper tett over fjellene bruker minst.
4. Valg hvert tredje år fra 1827. 1827 og 1830 vinker bøndene. Fra 1833: `periode > grense` = stemt
   ut. Fra 1836 klatrer en flosshatt om bord ved hvert valg (`perHatt` tyngre).
5. Ueland-gangeren fra 1833: under `nær` px over bakken vokser den ett trinn per `trinn` s, over
   `langt` px nullstilles den.
6. Veiskiller: knaus i lufta. Før 1882 stenger kongens bom dalen under (du må over, dyrt). Fra
   1882 er bommen borte: lav ballong tar den trange, billige dalen.
7. Seier: år >= 1884,5 (Løvebakken). Tap: `krasjer()` (fjell eller knaus) eller stemt ut.
8. `valg` telles når en rygg, et funn, et veiskille eller et ekte valg (700 px før) kommer til syne.

## Knapper

- Marginen mellom flink og sløseren: `grense` mot `tynnLuft`/`stigHøy`. Flink bruker 24-33 per
  periode, sløseren 36-40, nybegynneren (stor margin) går over rundt 1848.
- Senere press: `synkTil`, `perHatt`, toppene i `BRETT` og `utgift`-sjansen. Flink taper ~12 % sent.
- Klimakset: `veiskille.gap` (luft under knausen) - for lite og flink treffer undersiden.

## Fallgruver

- Hele terrenget lages i `newGame` fra seed; endrer du farten, flytter alt seg (årene følger tida).
- Knausen sjekkes mot hele ballongen (`halvBredde`), bakken bare mot kurven (`kurvHalv`).
- Komponenten tømmer `g.hendelser` hver ramme; sim.ts gjør det samme i `step`.
