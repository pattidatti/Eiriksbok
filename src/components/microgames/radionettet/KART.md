# Radionettet - kart

Andre verdenskrig som tower defense + auto-battler. Brief: `docs/microgames/briefer/radionettet.md`.
Fase: **kunst v2** (realistisk strategispill-look etter kunstbrief versjon 2; plakatlooken forkastet 2026-09-30). Komponenten: `../Radionettet3D.tsx`.

## Filene

| Fil | Hva |
|---|---|
| `tuning.ts` | Alle tall: enheter (`UNITS`), fiender (`ENEMIES`), radio, kamp, sperreild, økonomi, poeng, `PLAN_MAX` |
| `levels.ts` | Slagene (`SLAG`): vei, kommandovogn, start-forsyninger, bølger (`groups`), butikkens utvalg, faste opplæringskort, kanaler, `kutt`, det nye i bølgen (`nytt`) |
| `game.ts` | Tilstanden `G` og grepene: `pick`, `place` (+sammenslåing), `toggleLink`, `startWave`, `sperre`, `nextSlag`, `update`. Faser: `plan` → `wave` → (`slagVunnet` / `vunnet` / `tapt`) |
| `combat.ts` | Én bølge per tidssteg (`stepWave`): fiender kommer, radionettets øyne, dine enheter skyter, fly, fiendens enheter, artilleri som kutter linjer |
| `bots.ts` | Robotene (samvirke, halvgod, uten-radio, bare-vogner, tilfeldig) - samme grep som eleven |
| `sim.ts` | Simuleringskontrakten + `trace(bot, seed, verbose)` til feilsøking |
| `world.tsx` | Kamera (ortografisk, tilpasser seg vinduet), enheter og fiender (tårn dreier mot mål, rekyl, vrak som brenner, fly med propeller som krenger, stuper og styrter), radiolinjer (lysende stiplede bånd, instanser) og sporlys |
| `markers.tsx` | Det som ligger på bakken under enhetene: myk skygge (også under fly, krymper med høyden) og ringen som sier hvem som er hvem (grønn din, gul i nettet, rød fiende - lys når nettet ser den) |
| `light.tsx` | Sol med skygger, himmellys og `Environment` per slag (Dunkerque overskyet, El Alamein middagssol, Kursk ettermiddag) |
| `terrain.tsx` | Bakken malt i canvas per slag (gress/åkre/hekker, sand/stein, korn/jord, hav, vei, hjulspor, kratre, korn), mørkere utenfor brettet; pynt utenfor kartet (instanser med skygge), kommandovogna og radioringen |
| `models.ts` | Farger (`C`, `PAL` per slag) og figurene: mange biter slått sammen (`build`) med farge i hjørnene og UV-er, ett felles `figureMaterial()` med kamuflasje/slitasje-tekstur (`camo()`). `modelsFor(look)` gir enhetene i slagets farger; `plain` = uten mønster |
| `fxPool.ts`, `effects.tsx` | Myk røyk, ild som gløder, støv, jordklumper som faller og brannflekker: lageret og grepene (`boom`, `blast`, `flash`, `burn`, `scorch`) og tegningen (røyk + glød som egne shader-instanser med farge og tetthet per partikkel, flekkene flatt på bakken). `consume` gjør spillets `g.fx` om til effekter |
| `hud.tsx`, `hudData.ts` | Kommandobåndet øverst (mørk oliven, sjablongskrift `Stardos Stencil`) og butikken nederst (kakifargede kort); roller, forhåndsvisning av bølgen og CSS |

## Fagregelen (én regel)

`combat.ts` → `canTarget()`: en enhet skyter på det den ser selv, eller - hvis den er i radionettet
(`u.linked`) - på alt `g.netSeen` inneholder. `netVision()` fyller `netSeen` fra alle koblede enheter
hvert steg. Nedgravd panservern (`e.dug`) ses bare innenfor `camo` (infanteriet har lang `camo`,
vogna nesten ingen). Artilleriet har `sight` 1,6 men `range` 10. Jagere i nettet ser fly på
`COMBAT.flyØyne` og følger bombefly i nettet. Bombefly i nettet bomber der nettet ser flest fiender;
alene bomber de et tilfeldig sted på veien.

## Knapper i tuning.ts

- Vanskelighet per slag: `levels.ts` (`start`, `groups`), inntekt `ECONOMY.perBølge`.
- Radio: `RADIO.rekkevidde` (fra kommandovogna), kanaler per bølge i `levels.ts`.
- Panservernet graver seg ned: `COMBAT.pakGraverVed` (må være ≤ pak-rekkevidden), `pakBlir`, `bølgeMaks`.
- Sammenslåing: `COMBAT.kopier` (1, 2, 3 like på samme rute).

## Balanse

`npx tsx scripts/sim-microgame.mts --ids radionettet` (grønn 2026-09-30: samvirke vinner ~80 %,
uten-radio taper på El Alamein bølge 1 - artilleriet uten nett ser ingenting).
Én runde bølge for bølge:
`npx tsx -e "import('./src/components/microgames/radionettet/sim.ts').then(m => m.trace('samvirke', 3, true))"`

## Fallgruver

- React-kompilatoren (lint): en prop som endres i `useFrame`, må hete `...Ref` (`fxRef`, `speedRef`).
  Partiklene flyttes i `fxPool.step`, ikke i komponenten.
- `build()` er egen (ikke kitets `mergeParts`), fordi kitet sletter UV-ene og kamuflasjeteksturen trenger dem.
- Fly kaster ikke ekte skygge (`shadow={false}`): skyggen rett under i `markers.tsx` viser hvor de er.
  Den ekte skyggen ville falt skrått og sett ut som et annet fly.
- Nedgravd panservern som nettet ikke ser, får ingen ring - ellers avslører ringen det.
- Likhetsvakten måler mest farge: plakaten er fra Kursk (`--cover-at 290`). Fra Dunkerque (grønt og mørkt)
  ble den 0,50 mot inn-mot-stranda; Kursk gir 0,28 (2026-09-30).

- En bølge slutter bare når alle fiender er døde eller forbi. Alt som kan bli stående
  (nedgravd pak, jagerfly uten mål) må ha en vei ut - se `pakBlir`, `bølgeMaks` og jagernes `timer`.
- Lint (`react-hooks/refs`): les aldri `gRef.current` i render. HUD-en tar et øyeblikksbilde
  (`view()`), 3D-listene oppdaterer lokal state fra `useFrame`.
- Maks tre lærings-øyeblikk per runde: bare `nytt` uten `lapp` blir et øyeblikk.
