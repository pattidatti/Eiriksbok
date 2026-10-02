# Båtdekket klokka 00.45 - kart over mappa

Gråboks (fase 3a). Brief: `docs/microgames/briefer/klokka-0045.md`. Komponent: `../BatdekketKlokka.tsx`.

| Fil         | Hva den gjør                                                                                                   |
| ----------- | -------------------------------------------------------------------------------------------------------------- |
| `tuning.ts` | Alle tallene: seiersgrensen (705), landgangen, firetider, krengning, vann, ankomster per klasse (faser), gitterporten, planleggeren, ranger. `kl('01.40')` gir spillsekunder. |
| `levels.ts` | De fire brettene og de 20 båtene (side, slag, plasser, frist = når vannet når festet, tette frister).          |
| `state.ts`  | Typene (`Game`, `Båt`, `Gruppe`) og `newGame(seed)`. Ingen regler.                                              |
| `rules.ts`  | Fagkjernen: `bytt()` (landgangen bytter side), `gåOmBord()` (køen går forfra inn i båten landgangen peker mot), `hold()`, `frist()` (vann eller lås), `firetid()`, `sisteStart()` (planleggeren), `press()`, `rang()`. |
| `game.ts`   | Kjerneløkka `update(g, dt)`: raketter, nye grupper, gange og port, davitene, landgangen, firingen, frister (tapte båter), brettskifte, slutt. |
| `bots.ts`   | Robotene (én kilde for sim og usePlaytest): klok, halvgod, fir-straks, venter-alltid, tilfeldig.              |
| `sim.ts`    | `SimSpec` for `scripts/sim-microgame.mts`, `snapshotOf()` og `GAME_ID`.                                         |
| `draw.ts`   | Gråboks-tegningen på et virtuelt ark 960x540: profilstripe, snitt som krenger, vann, landgangen, køen som små figurer i grupper, båtene med lunte, HUD, brettkort. `treff()` for pekeren. |
| `texts.ts`  | Startreglene, tap med tips, SOLAS-linja og tallene fra 1912.                                                    |

## Kjerneløkka

1. Grupper starter i lugarene (klasse 1, 2, 3 åpner til ulike klokkeslett) og går opp trappa
   (`gang`). Tredje klasse stopper ved gitterporten til `portÅpner`. På dekket stiller de seg i én kø.
   Få folk i starten (ingen tror at skipet synker), mange mot slutten.
2. Landgangen peker mot babord eller styrbord. `gåOmBord()`: køen går selv, forfra, inn i båten på
   den siden med `landgang.perSek` folk i sekundet (bare før firingen har startet). `bytt()` snur
   landgangen; den står stille i `landgang.bytt` sekunder. Eleven velger NÅR og hvilken side, aldri HVEM.
3. `hold(side)`: etter `holdForsinkelse` løper tauet; båten firer med `firetid` (tregere på
   den høye siden). Slipper du, stopper båten. En båt som har begynt å gå ned, kan ikke fylles.
4. Hver hengende båt har en lunte som brenner ned mot fristen (vannet når festet, eller krengningen
   låser styrbord-livbåtene). Brenner lunta ut, er båten og folkene i den tapt - men runden går videre.
5. Når båten er nede eller tapt, svinger neste båt på den siden ut etter `svingUt`. Når alle båtene i
   brettet er nede eller tapt, kommer neste brett (kortet står `kort` sekunder). Klokka går hele tiden.
6. Slutt når alle båtene er nede eller tapt (eller 02.20). Seier: reddet (`brukt`) > `seier` (705, som i
   1912). Tap: årsaken er `tomme` om tomme plasser i båtene på vannet veier mer enn plassene i tapte
   båter, ellers `tapt`.
7. `valg` teller bare sidebytter og firinger som starter (ærlig, ikke pyntet).

## Knapper

- Vanskelighet totalt: `klasser.*.faser` (hvor mange som kommer når) mot fristene i `levels.ts`.
  Tette frister tidlig gjør at venting på full båt koster båtene etter.
- Landgangen: `landgang.perSek` (flaskehalsen sent på natta) og `landgang.bytt` (prisen for å bytte).
- Låsing: `krengning` og `låsGrader`. Høy side tregere: `firing.høyTreghet`.
- Robotenes plan: `plan.pause` (sekunder mellom to firinger) og marginen i `bots.ts`.

## Fallgruver

- Fristene er absolutte klokkeslett, men brettene starter når forrige er ferdig. Fir-straks kommer
  tidlig til brett 3 og 4 og fyller dem fulle i flommen; den taper bare fordi brett 1 og 2 går nesten
  tomme. Gir du flere folk tidlig, stiger fir-straks mot 705.
- Venter-alltid mister nesten alle båtene i brett 1 og 2 (folkene i dem er borte), så den ligger langt
  under. Gjør du landgangen mye raskere, kan den klare seg.
- `poeng` = reddet (folk i båter som er nede). Folk i tapte båter teller ikke.
