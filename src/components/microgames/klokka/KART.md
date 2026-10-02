# Båtdekket klokka 00.45 - kart over mappa

Gråboks (fase 3a). Brief: `docs/microgames/briefer/klokka-0045.md`. Komponent: `../BatdekketKlokka.tsx`.

| Fil         | Hva den gjør                                                                                                   |
| ----------- | -------------------------------------------------------------------------------------------------------------- |
| `tuning.ts` | Alle tallene: firetider, krengning, vann, ankomster per klasse (faser), gitterporten, planleggeren, ranger. `kl('01.40')` gir spillsekunder. |
| `levels.ts` | De fire brettene og de 20 båtene (side, slag, plasser, frist = når vannet når festet).                          |
| `state.ts`  | Typene (`Game`, `Båt`, `Gruppe`) og `newGame(seed)`. Ingen regler.                                              |
| `rules.ts`  | Fagkjernen: `vink()` (køen går forfra, bare side velges), `hold()`, `frist()` (vann eller lås), `firetid()`, `sisteStart()` (planleggeren), `press()`, `rang()`. |
| `game.ts`   | Kjerneløkka `update(g, dt)`: raketter, nye grupper, gange og port, davitene, firingen, brettskifte, frister.   |
| `bots.ts`   | Robotene (én kilde for sim og usePlaytest): klok, halvgod, fir-straks, venter-alltid, tilfeldig.              |
| `sim.ts`    | `SimSpec` for `scripts/sim-microgame.mts`, `snapshotOf()` og `GAME_ID`.                                         |
| `draw.ts`   | Gråboks-tegningen på et virtuelt ark 960x540: profilstripe, snitt som krenger, vann, kø, båtene, HUD, brettkort. `treff()` for pekeren. |
| `texts.ts`  | Startreglene, tap med tips, SOLAS-linja og tallene fra 1912.                                                    |

## Kjerneløkka

1. Grupper starter i lugarene (klasse 1, 2, 3 åpner til ulike klokkeslett) og går opp trappa
   (`gang`). Tredje klasse stopper ved gitterporten til `portÅpner`. På dekket stiller de seg i én kø.
2. `vink(side)`: den forreste gruppa går om bord i båten som henger på den siden (bare før
   firingen har startet). Er gruppa større enn plassene, blir resten stående først i køen.
3. `hold(side)`: etter `holdForsinkelse` løper tauet; båten firer med `firetid` (tregere på
   den høye siden). Slipper du, stopper båten. En båt som har begynt å gå ned, kan ikke fylles.
4. Når båten er nede, svinger neste båt på den siden ut etter `svingUt`. Når alle båtene i brettet
   er nede, kommer neste brett (kortet står `kort` sekunder). Klokka går hele tiden.
5. Tap: en båt som ikke er nede når vannet når festet (`frist`), eller en styrbord-livbåt når
   krengningen passerer `låsGrader` mot babord. Seier: alle 20 nede.

## Knapper

- Vanskelighet totalt: `klasser.*.faser` (hvor mange som kommer) mot fristene i `levels.ts`.
- Låsing: `krengning` og `låsGrader`. Høy side tregere: `firing.høyTreghet`.
- Robotenes plan: `plan.gruppe` og `plan.vinkSek` (tiden det tar å vinke en båt full).

## Fallgruver

- Fristene er absolutte klokkeslett, men brettene starter når forrige er ferdig. Endrer du
  firetider eller brettkort, må sim kjøres på nytt: «klok» taper fort på låsingen i brett 3.
- `poeng` = plasser brukt i båter som er nede. «venter-alltid» får mange plasser før den taper,
  så den halvgode må vinne for å ligge over den.
