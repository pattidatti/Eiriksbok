# Stempelet - kart over mappa

Nansenkontoret i Genève 1931-1938: slå stempelet på passene før båndet går tomt, og hold kassa
i live. Brief: `docs/microgames/briefer/stempelet.md`. Fase: **gråboks** (primitive former, ingen
kunst, juice eller lyd). Komponent: `../Stempelet.tsx` (meny, løkke, input, tekst, lagring,
usePlaytest, slutt-skjerm).

| Fil | Hva den gjør |
| --- | --- |
| `tuning.ts` | Alle tallene: år, bånd (`pass`), timing i slaget (`stempel`), kassa og husleie, frimerkearket, grå saker, tap, ranger, press. Endre her først. |
| `levels.ts` | `BRETT` (ett år per brett: nye pass, maks på bordet, andel tomme lommer, frimerkeark), plassene på bordet, personene. |
| `state.ts` | Typene (`Game`, `Pass`, `Ut`) og `newGame(seed)`, `lagPass`, `papirløse`, `husleie`. Ingen regler. |
| `rules.ts` | Fagkjernen: `slå()` (fullt/skjevt, pris, kassa), `kanStemple`, `pris`, `blirTilFornyelse`, `trekkBetaler` (jevn teller, ikke terning), `reis` (personen reiser videre, arkivkort). |
| `game.ts` | Kjerneløkka `update(g, dt)`: stempelet følger pekeren, båndene krymper, skuffen, nye pass, frimerkearket, tap, årsskiftet med husleie. Grepene `sikt`, `siktPlass`, `trykk`, `slipp`, `nestePass`. `press`, `framdrift`. |
| `bots.ts`, `sim.ts` | Robotene (`saksbehandler`, `nybegynner`, `gratis-for-alle`, `knappemoser`) og simuleringen. |
| `world.tsx` | Visningen i 3D: kamera 55 grader ned, bordet (pekeren), passene per plass (gyllen mynt eller svart lommehull), stempelet med hvitt treffefelt, myntstabelen, mynter i lufta, husleie-regningen, papirløs-hylla, frimerkearket. |
| `hud.tsx`, `hudData.ts` | DOM-HUD-en: år, saksnummer, taster, og merkelapper festet til bordet (+1/-2/-3 ved lommene, kassa, husleie, hylla). |
| `texts.ts`, `farger.ts`, `fx.ts` | All tekst (mål, regler, bordlapper, lapper, øyeblikk, tap, seier, lærdom), paletten, og slagtid, kamera til ankere (`tilSkjerm`), flygende mynter (`flyg`, `myntPlass`, `regningHull`). |

## Kjerneløkka

1. Hvert pass har et bånd (`igjen` av `varer`, 16-20 s). Under `pass.fornyFra` (50 %) er det til
   fornyelse: lomma vises (mynt hvis personen kan betale, ellers tom). Gyldige pass kan ikke stemples.
2. Eleven fører stempelet dit (henger etter pekeren, `stempel.følg`), holder og slipper. Holdt
   `fullFra`-`fullTil` s = fullt bånd, ellers skjevt (halvt bånd lagt på).
3. Kassa: mynt +1, tom lomme -2, grå sak -3, frimerkeark +4. Kassa kan ikke gå under 0: har den
   ikke nok, skjer ingenting.
4. Tomt bånd: personen går i skuffen i 6 s og kommer tilbake som grå sak. 6 papirløse (skuff + grå
   på bordet) = tap. Personer reiser videre etter `pass.blirMin`-`blirMaks` s med gyldig pass.
5. Ved nyttår trekkes husleia (`kasse.husleie[år]`), og myntene flyr fra stabelen til regningen. Ikke nok = tap.
6. En ny tom lomme får samme bånd som et mynt-pass (`pass.parAvstand`), så begge går ut samtidig.

## Hvorfor spillet virker (balansen)

Lomma er fast for personen. Den flinke tar mynt-passene med en gang de er til fornyelse (mer
gebyr) og de tomme lommene sent, rett før de går ut (koster sjeldnere). «Gratis for alle» fornyer
alle så fort de kan og går tom for penger rundt 1935-36.

## Knapper som styrer mest

- Kassapresset: `kasse.tomLomme`, `kasse.husleie`, `kasse.frimerke`, `BRETT[].tom`.
- Arbeidspresset: `BRETT[].nyHvert` og `maks`, `pass.blirMin/Maks`, `pass.fornyFra`.
- Ferdighetstrappen: `stempel.fullFra/fullTil`, `stempel.følg`.

## Fallgruver

- Brett 1: et pass går ikke ut før det har ristet 4 s (`update`).
- `g.ut` tømmes av komponenten (`Loop`) og av `step` i simuleringen.
- Komponentfiler eksporterer bare komponenter: tall og hjelpere i `.ts`-filene.
