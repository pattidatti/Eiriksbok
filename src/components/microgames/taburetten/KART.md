# Taburetten - kart

Riksretten 1884 som crowd-surf-løper: du er statsrådsstolen på hendene til Stortinget.
Brief: `docs/microgames/briefer/taburetten.md`. Fase: **bygd** (kunst, juice, tekst, lyd).
Komponenten: `../Taburetten3D.tsx` (meny, løkke, input, tekst, lyd, lagring, usePlaytest, slutt-skjerm).

## Filene

| Fil                         | Hva                                                                                                                                                                                              |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `tuning.ts`                 | Alle tall: fysikk, hender (bølger, vern, flertall), kongens øyer (`øy`), synk (`feilFall`), bytte (perfekt-/sent-vindu, seier), poeng (multiplikator fra landinger), hindringer, frispill, press |
| `levels.ts`                 | Brettene (`BRETT`), manuset (`MANUS`: lapper, valgbannere med kandidat, dommen), passasjerene med `figur`, kalenderen                                                                            |
| `state.ts`                  | Tilstanden `Game`, `newGame(seed)`, `harFlertall`, `Ut` (hendelser til visningen)                                                                                                                |
| `crowd.ts`                  | **Fagregelen**: `løft(g)` (flertall / vern på øy / mellom øyer / synk) og `oppdaterHender`. Bølgene og stolens fysikk (`stegStol`)                                                               |
| `øyer.ts`                   | Kongens øyer før dommen: gapet vokser med rødt flertall (`gap`)                                                                                                                                  |
| `game.ts`                   | `update`, grepene `hold`, `bytt` (perfekt / bytte / unødvendig / feil), `aktivtBanner`, `fortsett`, manus, frispill-bannere, tap og seier, `press`, `framdrift`, `tilSeier`                      |
| `spawn.ts`                  | Hindringer og avisark foran stolen; mellom øyene bare lave kjerrer                                                                                                                               |
| `bots.ts`, `sim.ts`         | Robotene (`flertallsmann`, `nølende`, `kongens-mann`, `nervøs`, `knappemoser`) og simuleringen                                                                                                   |
| `tegning.ts`, `kulisser.ts` | Tresnitt i canvas: hånd, erme, mengde, stol, karikaturer, hatter, gardist, stråler; hindringer, avisark, fasader, Stortinget, Slottet, brostein, valgplakaten                                    |
| `teksturer.ts`              | Teksturbanken (tegnes én gang per side)                                                                                                                                                          |
| `world.tsx`                 | Kamera (dykker og trekker ut, skjelv i ekte tid), kulisser med parallakse, gata og fare-linja, solstreker                                                                                        |
| `folk.tsx`                  | Mengden (instanserte hender og ermer, rødt/blått i stripas andel), stolen med statsråd, hatt, livgarde, den som kastes av, glorie, fartsstreker, vernlinja                                       |
| `ting.tsx`                  | Hindringer, avisark, valgplakater (`crispCanvas`) med stiplet treffsone, papirbiter                                                                                                              |
| `hud.tsx`, `hudData.ts`     | Vittighetsblad-HUD: masthode med kalender, stripa (114 figurer), prisrubrikk, «Neste»-oval, «I stolen», mål og taster, Bytt-knapp, skravering ved synking                                        |
| `fx.ts`, `lyd.ts`           | Øyeblikkene for juice (tidsstempler, skjelv, ankere) og lydene                                                                                                                                   |
| `texts.ts`, `farger.ts`     | Regler, lapper, lærings-øyeblikk, tips, «Dette skjedde», ranger, samlekort. Palett og skrifter                                                                                                   |

## Fagregelen (én regel)

`crowd.ts` → `løft()`: fargen i stolen med flertall i stripa = høye bølger; blå før dommen = livgarden
bærer bare på øyene, imellom drar flertallet stolen ned; ellers jevn synking (`synk.fart`) til gata.
Uten flertall står multiplikatoren på x1. Etter valget 1882 (69+ røde) er gapene røde soner:
en fin landing der = anklagen, og først da kommer dommen. Valgbanneret har en kandidat: ta den bare hvis den har
flertallsfargen og den som sitter ikke har det (`bytt`).

## Knapper i tuning.ts

- Selmer etter dommen: `synk.fart` (dør rundt 56 s). Schweigaard-fella: `synk.feilFall`.
- Øyene: `øy.gapStart`, `øy.gapK`, `øy.synk`. Hopphøyde: `fysikk.kast`, `hender.*Amp`.
- Multiplikator: `poeng.multFin`, `multPerfekt`, `multMaks`. Trappen: `poeng.seier`, `poeng.perfekt`.
- Frispill: `fri.*` og `synk.fri*`.

## Balanse

`npx tsx scripts/sim-microgame.mts --ids taburetten` (grønn 2026-10-03 etter diagnosen).

## Fallgruver

- Anklagen krever en fin landing (nedsiden) i en rød sone; passiv spiller dunker og anklager aldri.
- Kampanjen slutter med seier (`mode = 'won'`); «Fly videre» kaller `fortsett`. Simuleringen ser bare kampanjen.
- Robotenes `utsikt` må bruke samme delsteg som `update`.
- Høye hindringer før dommen står bare midt på en øy (`hindring.øyMargin`), ellers blir de umulige.
- Dommen løfter stolen til vernhøyden, så Selmer synker like langt uansett hvor dommen treffer.
- Komponentfiler eksporterer bare komponenter; konstanter i `farger.ts`, `texts.ts`, `fx.ts`.
- Plakaten ruller med `PL_FART` (ikke stolens fart), ellers er den utenfor bildet til det er for sent.
