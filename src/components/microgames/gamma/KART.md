# Gamma - kart over mappa

Gråboks (fase 3a). Brief: `docs/microgames/briefer/gamma.md`.
Komponent: `../Gamma.tsx` (skall, input, lagring, meny/pause/slutt-skjerm, selvspill).

| Fil | Hva den gjør |
| --- | --- |
| `tuning.ts` | Alle tallene: dag, verden (gamma, stranda), Inga (fart, fang), haugene, stabelen, varme (fall, fyr, perKubbe, god, hjelpen), røyk, patrulje (varsel, sveip, bredde, rekkevidde), jul, storm, ranger. |
| `levels.ts` | `BRETT` (tittel + lapp for det nye), `dato(dag)`, `brettFor(dag)`. |
| `game.ts` | Tilstanden, `newGame`, grepene `gå`/`hold`, og kjerneløkka `update`: Inga, fyring, patruljer, tap/seier, varme netter. |
| `rules.ts` | Fagkjernen: `bakke`, `inne`, `fall`, `fyrer`, `røykSynes`, `iLyset`, `lysTopp`, storm/jul, `press`, `rang`. |
| `bots.ts` / `sim.ts` | Robotene (`vett()`: fyrUnder/fyrTil/vedUnder/treg/røykVett/lysVett) og simuleringskontrakten. |
| `draw.ts` | Gråboks-tegningen: bakke, hauger, røyk, gamma med glød og familie, Inga, båt og lys, storm, dato og hint. |
| `texts.ts` | Mål, regler, tips, «Dette skjedde», lærdom. |

## Kjerneløkka

1. Inga går (`gå`), plukker et fang (`inga.fang`) ved første haug med ved, og legger det i stabelen når hun er inne.
2. Hold inne i gamma = fyr: +`varme.fyr`/s, én kubbe per `perKubbe` s, røyk +`røyk.opp`/s. Ellers synker varmen (`fall()`), røyken `røyk.ned`/s.
3. Patrulje: `kommer` (`varsel` s, båten synes og høres) -> `lyser` (lyset feier fra stranda opp til `lysTopp` og ned) -> `drar`. Første båt er øving (lyset stanser under gamma).
4. Tap: lyset treffer Inga ute, eller treffer gamma mens røyken synes (`røykSynes`, ikke i storm). Varme 0 = frosset.
5. Seier: dag `dager` (19. februar 1945). Poeng = varme netter (varme >= `varme.god` ved hvert døgnskifte) + `hjelpen` ved seier.

## Knapper

- Hvor mye eleven må bære: `perKubbe`, `fall*`, `fang`, haugene.
- Hvor farlig båten er: `mellom*`, `varsel*`, `sveip*`, `bredde`, `røyk.ned`/`synlig`.
- Ferdighetstrappen: `varme.god` og `hjelpen`.

## Fallgruver

- Den som slutter å fyre når båten kommer, trenger ikke ved akkurat da (stabelen synker ikke). En taper-robot som skal bli tatt ute, må hente ved hele tida (`vedUnder: 10`).
- Lange lys-faser (to sveip) frøs ned de flinke robotene sent i runden - holdt én sveip.
