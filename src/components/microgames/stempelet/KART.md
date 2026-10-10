# Stempelet - kart over mappa

Nansenkontoret i Genève 1931-1938: slå stempelet på passene før båndet går tomt, og hold kassa
i live. Brief: `docs/microgames/briefer/stempelet.md`. Fase: **kunst og juice** (bygd på
arkadeskallet). Komponent: `../Stempelet.tsx` (meny, løkke med hit-stop og sakte film, tekst,
lyd, lagring, usePlaytest, slutt-skjerm).

| Fil | Hva den gjør |
| --- | --- |
| `tuning.ts` | Alle tallene: år, bånd (`pass`), timing i slaget (`stempel`), kassa og husleie, frimerkearket, grå saker, dilemma, tap, ranger, press. Endre her først. |
| `levels.ts` | `BRETT` (ett år per brett: nye pass, maks, andel tomme lommer, frimerkeark, `bølge` = Saar 1935), plassene på bordet, `LOMME`, `PERSONER` (navn, kvinne, land; 20-23 er Saar). |
| `state.ts` | Typene (`Game`, `Pass`, `Ut`), `newGame`, `lagPass`, `ledigPerson`, `papirløse`, `papirløsListe` (hylla med navn og år), `husleie`. `g.mistet` = alle som ble papirløse i runden. |
| `rules.ts` | Fagkjernen: `slå()` (fullt/skjevt, pris, kassa), `under`, `kanStemple`, `pris`, `blirTilFornyelse`, `trekkBetaler` (jevn teller), `reis` (arkivkort). |
| `game.ts` | Kjerneløkka `update(g, dt)`: stempelet, båndene, skuffen, nye pass, bølgen, dilemma-meldingen, frimerkearket, tap, nyttår. Grepene `sikt`, `trykk`, `slipp`. `press`, `framdrift`. |
| `bots.ts`, `sim.ts` | Robotene og simuleringen. `målMistet(bot)` i `sim.ts` måler hvor mange en robot mister per runde (krav fra diagnose 2: vinneren median 2-4). |
| `world.tsx` | Kamera (55 grader, rykk ved slag), skrivebordet (canvas), vinduslyset som glir over bordet og skifter med årstid/tap/seier, køen med ansikter (`Kø`), avisa med årets overskrift og telegrammet i 1938 (`Avis`), kassa og regningen som glir inn i 1932 (`Pengeting`), støv på middels/høy. |
| `pass.tsx` | Ett pass: canvas med guilloche, bilde, navn, land og stempelmerker (tegnes bare ved endring), båndet som lunte med gnist, lomma (mynt eller tomt felt), dilemma-lys. |
| `stempel.tsx` | Stempelet (tyngde, løft, klem), blekksprut og sjokkring. |
| `bordting.tsx` | Kassa (stabel, røde mynter et slag koster, røde hull til husleia, gyllent spøkelse for gevinst), mynter i lufta, regningen, papirløs-hylla med navnekort, frimerkearket. |
| `tegning.ts` | Alle canvas-tegninger: bord, pass, portrett, merke, frimerkeark, regning, hyllekort, vindu. Skriftene. |
| `hud.tsx`, `hudData.ts` | DOM-HUD: blokkalender med åtte år (målet), nummereringsmaskin, lapper ved lommer, kassa, regning (nedtelling) og hylla. `sammeHud` hindrer unødig rendring. |
| `texts.ts`, `lyd.ts`, `farger.ts`, `fx.ts` | Tekst (lapper, øyeblikk, tap, seier, lærdom, arkivkort), lydene, paletten, delt visningstilstand (slag, mynter, dilemma, `tilSkjerm`). |

## Kjerneløkka

1. Hvert pass har et bånd (16-20 s). Under `pass.fornyFra` (50 %) kan det fornyes: lomma vises.
2. Eleven fører stempelet dit og klikker (hold løfter stempelet, slipp slår). Hvert slag fyller båndet helt; ingen timing.
3. Kassa (fra 1932, `BRETT[].penger`): mynt +1, tom lomme -2, grå sak -3, frimerkeark +4. Ikke nok = ingenting skjer. Lomma synes fra passet kommer.
4. Tomt bånd: personen havner i hylla (navn og år), kommer tilbake som grå sak etter 6 s. 6 papirløse = tap.
5. Nyttår: husleia trekkes (`kasse.husleie[år]`, 0 i 1931). Ikke nok = kontoret stenger.
7. Reist videre (`reis`): passet glir ut over bordkanten, telleren «Reist videre med passet» øverst.
6. 1935: tre flyktninger fra Saar på en gang (`BRETT[4].bølge`).

## Knapper som styrer mest

- Kassapresset og dilemmaet: `BRETT[].tom`, `kasse.husleie`, `kasse.tomLomme`, `kasse.frimerke`.
- Arbeidspresset: `BRETT[].nyHvert`, `maks`, `pass.blirMin/Maks`, `pass.fornyFra`.
- Ferdighetstrappen: prioritering og kassa (robotene skiller seg på tempo og plan), `stempel.følg`.

## Fallgruver

- Brett 1: et pass går ikke ut før det har ristet 4 s (`update`).
- `g.ut` tømmes av komponenten (`Loop`) og av `step` i simuleringen.
- Hit-stop og sakte film (dilemma) gjelder bare nettleseren; simuleringen kjører uten.
- Canvas-teksturene byttes aldri til `null`; passet tegnes på nytt bare når nøkkelen endres.
