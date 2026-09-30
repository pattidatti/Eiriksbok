# Radionettet - kart

Andre verdenskrig som tower defense + auto-battler, seks slag. Brief: `docs/microgames/briefer/radionettet.md`.
Fase: **gråboks-diagnose 2 + slag 4-6** (kunst v2 står). Komponenten: `../Radionettet3D.tsx`.

## Filene

| Fil | Hva |
|---|---|
| `tuning.ts` | Alle tall: enheter (`UNITS`), fiender (`ENEMIES`), radio (`rekkevidde`, `stafett`), kamp (batteri, sprut), sperreild, økonomi, poeng, ordrekort (`KORT`, `KORT_TALL`) |
| `levels.ts` | Slagene (`SLAG`): veier (`veier`, gruppene velger `vei`), kommandovogn, `ring`, `elv`, start, bølger, butikk, kanaler, `sikt` (tåke), `inntekt`, batterier (`pos`), det nye i bølgen (`nytt`) |
| `game.ts` | Tilstanden `G` og grepene: `pick`, `place` (+sammenslåing), `toggleLink`, `startWave`, `sperre`, `nextSlag(g, kort)`, `update`. Radioen: `reachable`, `relink` (stafetten, `u.via`), `canPlace` |
| `combat.ts` | Én bølge per tidssteg (`stepWave`): fiender på sin vei (`e.r`), radionettets øyne (`netVision`, `eyes` med tåke/speidere), dine enheter, fly, batteriet (`actBatt`), nedslag med sprut (`impact`) |
| `bots.ts`, `sim.ts` | Robotene og simuleringen. `perSlag(bots, n)` tuner ett slag om gangen; `trace(bot, seed, verbose, slag)` |
| `world.tsx` | Kamera, figurer (tårn dreier, rekyl, vrak, fly), radiolinjer (fra `u.via`), sporlys, gyldige ruter |
| `soldiers.tsx` | Soldatene som instanser: gange, kne og sikte, rekyl hver for seg, faller når troppen tar skade, fallskjermhopp med kuppel |
| `hl.ts`, `markers.tsx` | Markering (hover/klikk: hjørner + lysere figur), skygger, ringene (din/nett/fiende) og stafett-ringene |
| `ground.ts`, `terrain.tsx`, `relief.tsx` | Høyden (`heightAt`: åser, sanddyner, hav, elv), skyskygger; bakken malt per slag, pynt, skjørt; vann, bru, kratervoller, stein, dis/tåke |
| `light.tsx`, `models.ts`, `fxPool.ts`/`effects.tsx`, `hud.tsx`/`hudData.ts` | Lys per look, figurene (`PAL`, `SQUAD`, `soldierParts`), effekter, HUD |

## Fagregelen (én regel)

`combat.ts` → `canTarget()`: en enhet skyter på det den ser selv, eller - i nettet (`u.linked`) - på alt
`g.netSeen` inneholder. Nedgravd panservern og batterier (`e.dug`) ses bare innenfor `camo`. Radioen når
kommandovognas `ring` pluss `stafett` fra hver bakkeenhet i nettet; bakkeenheter kan bare stå der (`canPlace`),
fallskjermsoldater (`hopp`) hvor som helst.

## Knapper i tuning.ts

- Vanskelighet per slag: `levels.ts` (`start`, `groups`, `inntekt`), inntekt `ECONOMY.perBølge`.
- Radio: `RADIO.stafett`, ring per slag i `levels.ts`, kanaler per bølge.
- Batteri: `COMBAT.battStart`, `battSalve`, `kuttSkade`; klumpstraff `sprut`, `sprutAndel`.
- Veteraner: `COMBAT.kopier` (for høyt = ren vognhær vinner uten samvirke).

## Balanse

`npx tsx scripts/sim-microgame.mts --ids radionettet` (grønn 2026-09-30: samvirke 93 %, halvgod taper oftest på
El Alamein bølge 3, trappen 1095 < 1835 < 5835). Ett slag om gangen:
`npx tsx -e "import('./src/components/microgames/radionettet/sim.ts').then(m => m.perSlag(['samvirke','halvgod'], 60))"`

## Fallgruver

- React-kompilatoren: en prop som endres i `useFrame`, må hete `...Ref`. Hjelpere i egne `.ts`-filer (`hl.ts`, `ground.ts`), ellers klager fast refresh.
- `build()` er egen (ikke kitets `mergeParts`), fordi kamuflasjeteksturen trenger UV-ene.
- Fly kaster ikke ekte skygge; skyggen rett under (`markers.tsx`) viser hvor de er.
- Skjørtet (`SKIRT_Y`) må ligge under elveleiet og havbunnen, ellers skjuler det vannet.
- Store vannflater har `userData.sceneAuditIgnore`, ellers feiler scene-auditen på innramming.
- En bølge slutter når alle fiender er døde eller forbi; batterier teller ikke (de trekker seg tilbake).
- Nedgravd panservern og batterier som nettet ikke ser, får ingen ring; batteriet synes bare når det skyter.
- Lint (`react-hooks/refs`): les aldri `gRef.current` i render. Maks tre lærings-øyeblikk per runde.
- Eierens dev-server på 5173 kan servere gamle filer: test mot egen Vite på 5190 (`.screenshots/vite.test.config.mjs`).
