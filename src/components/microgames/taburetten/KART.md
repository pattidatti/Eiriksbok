# Taburetten - kart

Riksretten 1884 som crowd-surf-løper: du er statsrådsstolen på hendene til Stortinget.
Brief: `docs/microgames/briefer/taburetten.md`. Fase: **gråboks** (bokser og flate farger, ingen kunst
eller juice). Komponenten: `../Taburetten3D.tsx` (meny, løkke, input, usePlaytest, slutt-skjerm).

## Filene

| Fil | Hva |
|---|---|
| `tuning.ts` | Alle tall: fysikk (tyngde, `tungFaktor`, `kast`, fart), hender (bølger, vern, flertall), synk, bytte (perfekt-vindu, køtid, tom stol, seier), poeng, hindringer, frispill, press |
| `levels.ts` | Brettene (`BRETT`: marsjfart, hindringer) og manuset (`MANUS`: lapper, bannere, dommen, Schweigaard, køen med Sverdrup, seiersbanneret). Passasjerene |
| `state.ts` | Tilstanden `Game`, `newGame(seed)`, `harFlertall`, `Ut` (hendelser til visningen) |
| `crowd.ts` | **Fagregelen**: `løft(g)` (flertall / vern / synk / tom) og `oppdaterHender`. Bølgene (`flate`, `helning`), stolens fysikk (`stegStol`: hold = tung, kast ved bølgetopp uten hold, fin landing/dunk) |
| `game.ts` | `update(g, dt)`, grepene `hold`, `bytt` (perfekt / unødvendig / vanlig), `fortsett` (frispill), manus, frispill-bannere, køen, tap og seier, `press`, `framdrift` |
| `spawn.ts` | Hindringer og avisark foran stolen (`nyeTing`), treff (`kollisjoner`) |
| `bots.ts`, `sim.ts` | Robotene (`flertallsmann`, `nølende`, `kongens-mann`, `knappemoser`) og simuleringen. Robotene planlegger med `utsikt` (spiller kopien videre) |
| `world.tsx` | Gråboksen i R3F: hender (instanser), stol, livgarde, kø, hindringer, ark, bannerstolper, gata, følgekamera |
| `hud.tsx`, `hudData.ts` | Stripa, kalenderen, poeng og x-multiplikator, hvem som sitter og neste, Bytt-knappen |
| `texts.ts`, `farger.ts` | Regler, tips ved tap, lærdom, ranger. Paletten fra kunstbriefen |

## Fagregelen (én regel)

`crowd.ts` → `løft()`: fargen i stolen med flertall i stripa = høye bølger (høyere jo større flertall);
blå før dommen = vernlinja; ellers jevn synking (`synk.fart`) til gata. Ingen flaks: løftet regnes fra
stripa, ikke fra hendene under stolen.

## Knapper i tuning.ts

- Hvor snart Schweigaard når gata: `synk.fart` (sammen med `MANUS`-tidene for dommen og seiersbanneret).
- Hopphøyde: `fysikk.kast` og bølgehøyden (`hender.vernAmp`, `flertallAmp*`). Hindringshøyder: `hindring.lav/kjerre/middels/trådBunn`, plassering `hindring.fase`.
- Perfekt bytte: `bytte.perfektVindu`. Tom stol: `bytte.køTid` > `bytte.tomMaks` gjør dobbeltbytte farlig.
- Frispill: `fri.*` (fart, bannertetthet, margin) og `synk.fri*`.

## Balanse

`npx tsx scripts/sim-microgame.mts --ids taburetten` (grønn 2026-10-03 i gråboksen).

## Fallgruver

- Kampanjen slutter med seier (`mode = 'won'`); «Fly videre» kaller `fortsett` og starter frispillet.
  Simuleringen ser bare kampanjen.
- Robotenes `utsikt` må bruke samme delsteg som `update` (`PLAYTEST_DT / delsteg`), ellers bommer den på hindringer.
- Hindringstypen velges etter brettet stolen er i når den når hindringen (`brettVed`), ellers møter Selmer
  brett 1-hindringer etter dommen.
- `world.tsx` eksporterer bare komponenter (fast refresh); fargene ligger i `farger.ts`.
