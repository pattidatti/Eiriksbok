# Båtdekket klokka 00.45 - kart over mappa

Ferdig spill (fase 3c). Brief: `docs/microgames/briefer/klokka-0045.md`. Komponent: `../BatdekketKlokka.tsx`
(skall, input, tekst via `useArcadeText`, lyd, selvspill, start-/pause-/sluttskjerm).

| Fil         | Hva den gjør |
| ----------- | ------------ |
| `tuning.ts` | Alle tallene: seiersgrensen (705), landgangen, firetider, krengning, vann, alvoret (tilstrømningen), klassene (antall fra granskningen, faser), gitterporten, raketter, ranger. `kl('01.40')` gir spillsekunder. |
| `levels.ts` | De 20 båtene, ti per side, i den rekkefølgen de svinger ut (`klar`, `frist`), og fasene i natta (`BRETT`, styrt av klokka). |
| `state.ts`  | Typene (`Game`, `Båt`, `Gruppe`, `Hendelse`) og `newGame(seed)`. Ingen regler. |
| `rules.ts`  | Fagkjernen: `bytt()`, `gåOmBord()` (køen går forfra, tregere mot høy side), `hold()`, `frist()`, `firetid()`, `alvor()`, `sisteStart()` (planleggeren), `påVei()`, `press()`, `rang()`, `reddetKlasse()`. |
| `game.ts`   | Kjerneløkka `update(g, dt)`: raketter, fase, nye grupper (alvoret), gange og port, davitene, landgangen, firingen, frister, slutt. |
| `bots.ts`   | Robotene (én kilde for sim og usePlaytest): klok, halvgod, fir-straks, venter-alltid, tilfeldig. |
| `sim.ts`    | `SimSpec` for `scripts/sim-microgame.mts`, `snapshotOf()` og `GAME_ID`. |
| `geom.ts`   | Geometrien på arket 960x540: dekk, skrog, davitene, trappene, krengningen (`iVerden`), `båtPos`, `skala`/`tilArk`/`fraArk`, `treff()` for pekeren. |
| `papir.ts`  | Det som står stille, tegnet én gang til offscreen-lerret: blåkopipapiret og skipssnittet. Paletten `P` og `strek()` (dobbel, håndtegnet strek). |
| `draw.ts`   | `tegn()`: setter sammen bildet. Himmel, tåke, havet bak, lys i rommene, folk i trappene og bak porten, køen, vannet, rakettlyset. |
| `baater.ts` | Båtene på davitene (lanterner, taljer, målelinje, lunte, tastetegn), landgangen med folk som går over, båter som driver, plask, «FULL»-stempel, raketter. |
| `hud.ts`    | Profilstripa (de 20 båtplassene), tittelfeltet (klokka, reddet mot målet, tomme) og tastefeltet. |
| `former.ts` | Små byggeklosser: silhuetten `figur()`, `målelinje()`, `tast()` og `TegneValg`. |
| `fx.ts`     | Effekter fra hendelsene: folk over landgangen, lanterner som tennes, plask, «FULL»-stempel, raketter. Ingen regler. |
| `lyd.ts`    | Lydene på arkadeskallets synth. |
| `texts.ts`  | All tekst: regler, lapper, lærings-øyeblikk, tap med tips, «Dette skjedde», klassetall fra 1912, pausefakta. |

## Kjerneløkka

1. Grupper starter i lugarene og går opp trappa. Første og andre klasse kommer fortere jo flere
   båter som er nede (`alvor`): i 1912 ville mange ikke gå i de første båtene. Tredje klasse
   samler seg bak gitterporten på D-dekk til `portÅpner` (ca. 01.38), og kommer så i en bølge.
2. Hver side har sin rekke båter; det henger alltid én på babord og én på styrbord, hver med sin
   lunte (frist). Landgangen fyller bare båten den peker mot. `bytt()` snur den (0,6 s stopp).
3. `hold(side)`: etter 0,2 s løper tauet; slipper du, stopper båten. En båt på vei ned tar ingen flere.
4. Lunta brenner ned mot fristen (vannet, eller krengningen som låser styrbord-livbåtene ca. 01.56).
   Brenner den ut, er båten tapt - runden går videre.
5. Slutt når alle båtene er nede eller tapt, eller 02.20. Seier: reddet > 705. Tap: `tomme` eller `tapt`.
6. `valg` teller sidebytter og firinger som starter.

## Knapper

- Dilemmaet tidlig: `alvor` (base, perBåt) mot fristene i brett 1. Lav base = den døde starten.
- Bølgen: `klasser[3]` og `port.åpner` mot fristene for båt 11-4 og de sammenleggbare.
- Flaskehalsen: `landgang.perSek` og firetidene.

## Fallgruver

- Alt over 1178 folk får aldri plass; sene båter fylles nesten alltid. Forskjellen mellom robotene
  ligger i brett 1-2 (alvoret) og i om båtene spares til bølgen.
- `fx` og `draw` leser bare spillet; hendelsene tømmes av komponenten hver ramme.
- Tegningen bruker `g.t`, så pausen og sakte film fryser animasjonene også.
