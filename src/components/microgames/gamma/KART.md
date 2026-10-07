# Gamma - kart over mappa

Ferdig spill (kunst, juice, lyd og tekst). Brief: `docs/microgames/briefer/gamma.md`.
Komponent: `../Gamma.tsx` (skall, input, lagring, meny/pause/slutt-skjerm, selvspill).

| Fil | Hva den gjør |
| --- | --- |
| `tuning.ts` | Alle tallene: dag, verden (gamma, stranda), Inga (fart, fang), haugene, stabelen, varme (fall, fyr, perKubbe, god, hjelpen), røyk, patrulje (varsel, sveip, bredde, rekkevidde), jul, storm, ranger. |
| `levels.ts` | `BRETT` (tittel + lapp for det nye), `dato(dag)`, `brettFor(dag)`. |
| `game.ts` | Tilstanden, `newGame`, grepene `gå`/`leggPå`, og kjerneløkka `update`: Inga, fyring, patruljer, tap/seier, varme netter. |
| `rules.ts` | Fagkjernen: `bakke`, `inne`, `fall`, `fyrer`, `røykSynes`, `iLyset`, `lysTopp`, storm/jul, `press`, `rang`. |
| `bots.ts` / `sim.ts` | Robotene (`vett()`: fyrUnder/fyrTil/vedUnder/treg/røykVett/lysVett) og simuleringskontrakten. |
| `art.ts` | Paletten (Savio-tresnitt), `kvalitet()`, `ripe()`/`bjørk()`, og `bakgrunn(r)`: himmel, nordlys, fjell, fjord, snøbakke og bjørkeskog tegnet én gang til et offscreen-canvas. |
| `figures.ts` | Figurene: gamma snittet åpen (torv, snø, bål, familien med rim), stabelen, vedhaugene, Inga i kofte, røyksøylen, patruljebåten med lyskaster, de allierte skipene. |
| `draw.ts` | Setter bildet sammen: bakgrunn, figurer, partikler, flygende kubber, storm, varmemåleren i tre, datoklossen, tastetegninger og lappene. |
| `fx.ts` | Spillfølelsen: partikler (gnister, snø, flis, damp), kubber som flyr, blus, risting, pusten når lyset går over gamma, motornivået. Ingen regler. |
| `sound.ts` | Lydene på arkadesynthen: dunk og sus, knitring, klakk, klikk når lyset tennes, hjerteslag, og motorduren som levende lyd. |
| `coach.ts` | All tekst under runden: bannere, faste lapper (maks 7 ord), lærings-øyeblikket ved første båt, «+4 ved». |
| `texts.ts` | Mål, regler, tips, «Dette skjedde», lærdom, lappene (`LAPP`) og lærings-øyeblikket (`BEAT`). |

## Kjerneløkka

1. Inga går (`gå`), plukker et fang (`inga.fang`) ved første haug med ved, og legger det i stabelen når hun er inne.
2. Trykk i gamma = `leggPå`: én kubbe fra stabelen på bålet (maks `bålMaks`). Mens bålet brenner (`bål` > 0): +`varme.fyr`/s og røyk +`røyk.opp`/s. Ellers synker varmen (`fall()`), røyken `røyk.ned`/s.
3. Patrulje: `kommer` (`varsel` s, båten synes og høres) -> `lyser` (lyset feier fra stranda opp til `lysTopp` og ned) -> `drar`. Første båt er øving (lyset stanser under gamma).
4. Tap: lyset treffer Inga ute, eller treffer gamma mens røyken synes (`røykSynes`, ikke i storm). Varme 0 = frosset.
5. Seier: dag `dager` (19. februar 1945). Poeng = varme netter (varme >= `varme.god` ved hvert døgnskifte) + `hjelpen` ved seier.

## Knapper

- Hvor mye eleven må bære: `perKubbe`, `fall*`, `fang`, haugene.
- Spillfølelsen: `juice` (flytid for kubbene, gnister, snøfokk, pusten, risting, slutt-bildet, skipene).
- Hvor farlig båten er: `mellom*`, `varsel*`, `sveip*`, `bredde`, `røyk.ned`/`synlig`.
- Ferdighetstrappen: `varme.god` og `hjelpen`.

## Fallgruver

- Den som slutter å fyre når båten kommer, trenger ikke ved akkurat da (stabelen synker ikke). En taper-robot som skal bli tatt ute, må hente ved hele tida (`vedUnder: 10`).
- Lange lys-faser (to sveip) frøs ned de flinke robotene sent i runden - holdt én sveip.
- Pusten (`juice.pust`) og lærings-øyeblikket senker spillets dt i `Gamma.tsx` (`text.timeScale() * fxFart(fx)`). Rister og pust svinner i ekte tid, partiklene i spilltid.
- Lærings-øyeblikket huskes per elev (localStorage). I selvspillet ser bare første runde det; derfor fyrer det når lyset tennes, ikke når det når toppen.
- Inga tegnes inne i gamma ved døra når `inne(g)`, og klippes ved døra når hun går inn og ut, så hun aldri går gjennom torvveggen.
