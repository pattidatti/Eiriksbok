# Radionettet - kart

Andre verdenskrig som tower defense + auto-battler, seks slag. Brief: `docs/microgames/briefer/radionettet.md`.
Fase: **gråboks-diagnose 2 + slag 4-6** (kunst v2 står). Komponenten: `../Radionettet3D.tsx`.

## Filene

| Fil | Hva |
|---|---|
| `tuning.ts` | Alle tall: enheter (`UNITS`), fiender (`ENEMIES`), radio (`rekkevidde`, `stafett`), kamp (batteri, sprut), sperreild, økonomi, poeng, ordrekort (`KORT`, `KORT_TALL`) |
| `levels.ts` | Slagene (`SLAG`): veier (`veier`, gruppene velger `vei`), kommandovogn, `ring`, `elv`, start, bølger, butikk, kanaler, `sikt` (tåke), `fart` (fiendens fart per bølge), `inntekt`, batterier (`pos`), det nye i bølgen (`nytt`) |
| `game.ts` | Tilstanden `G` og grepene: `pick`, `place` (+sammenslåing), `toggleLink`, `startWave`, `sperre`, `nextSlag(g, kort)`, `update`. Radioen: `reachable`, `relink` (stafetten, `u.via`), `canPlace` |
| `combat.ts` | Én bølge per tidssteg (`stepWave`): fiender på sin vei (`e.r`), radionettets øyne (`netVision`, `eyes` med tåke/speidere), dine enheter, fly, batteriet (`actBatt`), nedslag med sprut (`impact`) |
| `bots.ts`, `sim.ts` | Robotene og simuleringen (`nybegynner` = slik en elev spiller første gang: sprer seg, slår ikke sammen). `perSlag(bots, n)` tuner ett slag om gangen; `trace(bot, seed, verbose, slag)` |
| `world.tsx` | Kamera, figurer (tårn dreier, rekyl, vrak, fly), radiolinjer (fra `u.via`), sporlys, gyldige ruter |
| `soldiers.tsx` | Soldatene som instanser: gange, kne og sikte, rekyl hver for seg, faller når troppen tar skade, fallskjermhopp med kuppel |
| `hl.ts`, `markers.tsx` | Markering (hover/klikk: hjørner + lysere figur; kommandovogna er `HQ_ID`, og `src` er der linja går fra), skygger, ringene (din/nett/fiende) og stafett-ringene |
| `ground.ts`, `terrain.tsx`, `relief.tsx` | Høyden (`heightAt`; `lift`/`tilt` = bakken under et punkt i slaget, også åsene inne på brettet), skyskygger og bakkemarkeringene (`MARKS`: radioring, stafett-ringer, gyldige ruter, ruta under musa - tegnet i bakkeshaderen); bakken malt per slag, pynt, skjørt; vann, bru, kratervoller, stein, dis/tåke |
| `damage.tsx`/`damagePool.ts` | Skadetallene over den som blir truffet (combat sender `Fx` `tall`; `wait` = granaten er på vei) |
| `cine.ts` | Kinokameraet og sakte film: `bulletTime(c, x, z, dur)` (minst 5 s mellom, bølgens siste fiende alltid), `cineScale` (spillets tempo, ganges inn i `io.timeScale`), `cineDepth` (zoom og vignett). `Camera` i `world.tsx` følger fienden i bølgen (zoom 1,2, svai), dykker mot stedet i sakte film, og viser hele kartet i planleggingen, med kort i hånda og med sperreild |
| `warfog.tsx`/`fogState.ts` | Krigståka rundt brettet: tre lag plan med støy-skyer (to på lav), masken regnet på bakken bak tåka (`uShift`), artilleriglimt og salver som lyser den opp innenfra (`fogFlash`, også fra `Ambience`) |
| `flare.ts` | Lysglimt fra kampen: fire punktlys (to på lav) som gjenbrukes (`flare()`), tegnet i `Flares` i `light.tsx`. `fxPool` tenner dem ved smell, nedslag, kanonskudd og gnister. Antallet lys er fast, ellers kompileres materialene på nytt |
| `rank.ts` | Gradsmerket over sammenslåtte enheter (to vinkler / stjerne for veteran), sprite som aldri skjules |
| `life.tsx` | Verden som lever: flyformasjoner høyt oppe (pynt), småbåter ved kysten |
| `light.tsx`, `models.ts`, `hud.tsx`/`hudData.ts` | Lys per look, figurene (`PAL`, `SQUAD`, `soldierParts`), HUD |
| `fxPool.ts`/`effects.tsx` | Effekter: `consume` gjør skudd (`Fx.by` = hvem skjøt, `hard` = panser) om til flamme, granat, nedslag og lyd; `Ambience` er stemningen (røyksøyler per slag, kanonglimt, dis, vind/måker). Lydene står i `makeSfx` i `Radionettet3D.tsx` |

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

`npx tsx scripts/sim-microgame.mts --ids radionettet` (grønn 2026-10-01: samvirke 93 %, nybegynner vinner Dunkerque
med 7 igjen, trappen 965 < 1730 < 5835). Ett slag om gangen:
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
- Alt som står på bakken, må bruke `lift(def, x, z)` (og `tilt` for kjøretøy og ringer). Effektene får
  bakkehøyden selv (`fx.setGround`), så y i `fxPool` er over bakken. Store flate ringer/ruter hører hjemme
  i bakkeshaderen (`MARKS`), ikke som flate mesher (de skjæres av åsene).
- Shader-materialer (`warfog.tsx`) må ha `#include <tonemapping_fragment>` og `<colorspace_fragment>`, ellers blir fargene mørke og grumsete.
- Sammenslåing: `setTiles` verdi 3 (blå kanal) = en lik enhet å legge oppå; tegnes hvit og pulserende i bakkeshaderen.
- Sporlys og granater er partikler med `streak` (strekkes langs farten i `effects.tsx`); `drag 0` alene betyr bare rett linje, ikke full tetthet.
- Treff: figurene blinker med `figureMaterialHit` og rister (`hitPulse` i `world.tsx`), styrt av at `hp` faller.
- Skadetallene starter aldri under 13 px (`pop` i `damagePool.ts`), ellers feiler selvspillets skriftport.
- Åsene inne på brettet går bare opp fra null (`inner` i `ground.ts`): et søkk under null viser skjørtet.
- Eierens dev-server på 5173 kan servere gamle filer: test mot egen Vite på 5190 (`.screenshots/vite.test.config.mjs`).
