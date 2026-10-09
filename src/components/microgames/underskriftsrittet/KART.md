# Underskriftsrittet - kart over mappa

GRÅBOKS (primitive former, ingen kunst, ingen juice). Brief: `docs/microgames/briefer/underskriftsrittet.md`.
Komponent: `../Underskriftsrittet.tsx` (skall, input, kamera, lapper, meny/pause/slutt-skjerm, selvspill).

| Fil | Hva den gjør |
| --- | --- |
| `tuning.ts` | Alle tallene: hesten (skritt/galopp/sving/terreng), kartgrense, tunet (radius, navnefart, segl ved 20), kommisjonen (8 segl, 2 fra Telemark), lyktene, fangsten, dristig, dragonene, poeng, ranger, kamera. |
| `levels.ts` | `BRETT`: de tre månedene (Vestre Moland, Nedenes, Telemark) med bygder, landevei, åser, lykter per navn, lyktfart, fangtid, dragoner. `månedNavn()`. |
| `game.ts` | Tilstanden, `newGame`, grepet `styr(g, dx, dz, styrke)` og kjerneløkka `update`: `rir` -> `samler` (navn, `nyttNavn`, segl, seier) -> `lykteneGår` -> `fangsten` -> `måneden` (neste brett / vinter). |
| `rules.ts` | Rene hjelpere: terreng (vei/ås), `navneFart`, `ser` (åsen skjuler deg), `pressFra`, `rang`. |
| `bots.ts` / `sim.ts` | Robotene (`vett()`: flukt, unngåTun, sirkel, hvert, forut, blind) og simuleringskontrakten. |
| `world.tsx` | Gråboks-verdenen: `Kart` (bakke, vei, åser, tun med fyll og segl, utgangen), `Hest` (+ fangstring), `Lykter` (pool på 24). |
| `hud.tsx` | Kartusjen (måned + bygd + kalender), klagebrevet (navn), kommisjonsmåleren (8 segl). Egen 10 Hz-tilstand. |
| `palette.ts` | Fargene fra kunstbriefen. |
| `texts.ts` | Mål, regler, tips ved tap, seiersteksten, kravene og lærdommen. |

## Kjerneløkka

1. Hesten rir med fart og vekt: holdt tast = mot galopp, sluppet = skritt. Krapp sving bremser.
2. Inne i ringen rundt et tun renner navn: flest midt på og i skritt (`navneFart`). Ved 20 navn: segl.
3. Navn nummer `førsteLykt` og så hvert `navnPerLykt` i en bygd tenner en lykt 10-18 m unna. Lykta går
   til stedet der navnet ble skrevet, leter i en sløyfe som går inn over midten, går videre til nyeste
   underskrift etter `leteTid`, og slukner etter `levetid`. Brett 1: første lykt står, andre går.
4. I lyset fylles fangstringen (`fangTid`), full = tatt. Navn med en lykt nær teller dobbelt (dristig).
5. Brett 3: 12 navn på 5 s sender en dragon fra landeveien som rir etter deg (ser deg ikke på åsen).
6. Brettet går videre når alle bygdene har segl og du rir ut ved stolpen, eller når måneden er over.
   8 segl (minst 2 fra Telemark) = seier. Desember slutt = «Vinteren kom».

## Knapper

- Vanskelighet: `lykt.lys`, `levetid`, `leteTid`, `levels.ts` (`navnPerLykt`, `lyktFart`, `fangTid`, `sekunder`).
- Hvor deilig samlingen er: `tun.maksFart`, `kant`, `galoppAndel`.
- Ferdighetstrappen: `poeng`, `dristig`, robotenes `vett()`-tall.

## Fallgruver

- Lykter som jaget hesten (`lykt.ser` > 0) samlet seg i flokker og gjorde spillet uvinnelig - står på 0.
- Bygder nær kartkanten ble feller: hold dem minst 12 m fra `grense`.
- Brett 1 har en skjult måned (95 s) så en passiv spiller ikke blir stående for alltid.
- Klageboka (funn på tvers av runder) er ikke bygd ennå.
