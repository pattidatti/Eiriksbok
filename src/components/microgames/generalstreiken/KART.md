# Generalstreiken - kart over mappa

Gråboks (fase 3a). Brief: `docs/microgames/briefer/generalstreiken.md`. Komponent:
`../Generalstreiken.tsx` (skall, input, selvspill, start-/pause-/sluttskjerm).

| Fil | Hva den gjør |
| --- | --- |
| `tuning.ts` | Alle tallene: fart (6,2 ruter/s + 0,19 per ledd, tak 11), startleddene, kø for svinger, fabrikkverdier før/etter Grenelle og fjernbonus, `minAvstand` før og `etterAvstand` (10-15) etter Grenelle, `stige` (x1 + 0,2n), `x2` (15 %, langt ute, 6 s), `trekk` (bølgen tar 50 % av et spist ledd), `grenelleFra`, `splittetUnder`, kalenderen (`dagSek`), `seier` (6/8/11), ranger, pressvekter. |
| `levels.ts` | De tre brettene: rutenett (maks 34x20, så én rute er minst 24 px ved 1366x768), Paris, `regioner` med vekt (der fabrikkene dukker opp), fabrikker samtidig (2/3/4), fartstak, knapp, mål, bølgen (`start`, `vekst` per fabrikk, `økning` per sekund), kalender, `frist`, fjernbonus, x2 og navngitte fabrikker. |
| `state.ts` | Typene (`Game`, `Fabrikk` med `x2Til`, `Hendelse`, `Årsak`), `newGame(seed, bi)` og `startBrett()`. `etterN` = fabrikker siden Grenelle, `bevart` = millioner bølgen ikke tok. Seedet rng i spillet. |
| `rules.ts` | Fagkjernen og grepene: `styr()`, `trykk()` (GRENELLE, så AVSLUTT), `knapp()`, `millioner()` (kjeden + `bevart`), `fart()`, `bølgeFart()`, `bølgeAvstand()`, `bølgeSek()`, `gangetall()`, `verdiFor()`, `erX2()`, `seierNivå()`, `press()`, `poeng()`, `rang()`, `tap()`, `neste()`. |
| `game.ts` | Kjerneløkka `update(g, dt)`: nye fabrikker (`nyFabrikk`: regioner før Grenelle, 10-15 ruter fra hodet etter), fristen, bevegelse rute for rute (`ettSteg`: kø, kartkanten svinger selv, krasj kutter kjeden, hekting, `etterN`), bølgen bakfra (trekker `trekk` av hvert spist ledd), brett 1 vunnet ved målet. |
| `bots.ts` | Robotene (én kilde for sim og usePlaytest): streikeleder (regner med tiden til neste fabrikk mot `bølgeSek`), halvgod (nærmeste fabrikk, sover, nøyer seg med en lav seier), aldri-avslutt, aldri-grenelle, tilfeldig. Styringen simulerer sine egne svinger med `ettSteg`. |
| `sim.ts` | `SimSpec`, `snapshotOf()`, `GAME_ID`, `MAKS_SEKUNDER`. |
| `draw.ts` | Gråboksvisningen: rutenett, fabrikker som svarte bokser med verdi (x2: rød ramme og nedtelling), kjeden i rødt, bølgen i blått, gangetallet ved hodet, HUD (teller, skala 0-12 med mål eller 6/8/11, kalender/frist, bølgeavstand), brettkortet. Paletten `P`. |
| `texts.ts` | Tapene med tips, seiersplakatene i tre nivåer (`SEIER`), brettkort og mål. |

## Kjerneløkka

1. Hodet går én rute per `1/fart` s. Farten øker med lengden (ca. 7 ved 4 ledd, 11 ved 25).
   Svinger ligger i kø (maks `TUNING.kø`). Ved kartkanten svinger hodet selv - aldri et tap.
2. Hekter du på en fabrikk, får kjeden ett ledd med fabrikkens verdi (`verdiFor`). Nyeste ledd
   ligger nærmest hodet, eldste ved halen. Millionene = summen av leddene + `bevart`.
3. Krasj i egen kjede: alt fra krasjpunktet og bakover faller av. Under 0,5 millioner = splittet.
4. `trykk()`: GRENELLE (fra 1,5 millioner) starter bølgen. Etter det gir fabrikk nr. n
   grunnverdi x (1 + `stige` x n), dukker opp 10-15 ruter fra hodet, og bølgen går
   `start x vekst^n + økning x sekunder` ledd/s. Hvert spist ledd trekker 50 % av verdien.
   AVSLUTT lagrer millionene i `resultat[bi]`. Under målet = tap.
5. Fristen (`frist`, brett 3 = 30. mai) uten GRENELLE = tap. Brett 1 har ingen knapp.
6. Én runde i sim/selvspill = brett 1 (ca. 17 s), 2 (ca. 20 s) og 3 (ca. 35 s). Poeng =
   tiendeler av millioner summert over brettene. Seier = AVSLUTT med minst 6 på brett 3,
   i nivåer 6 / 8 / 11.
7. `valg` teller nye fabrikker (2-4 å velge mellom), GRENELLE og AVSLUTT.
8. `press()`: før Grenelle fart og kalender, etter Grenelle 0,5 + 0,5 x hvor nær bølgen er
   i sekunder (`bølgeSek` mot 20 s).

## Knapper

- Hvor mye «én til» lønner seg: `stige`, `fabrikk.etter` og `trekk` mot `bølge.vekst`.
- Hvor lenge brett 3 varer etter Grenelle: `bølge.start` og `vekst` i levels.ts.
- Hvor mye som ligger langt ute: vektene i `regioner` (brett 3: ca. 60 % over 12 ruter fra
  Paris før Grenelle).
- Presset i siste tredjedel: `press.bølgeSek` og `press.kalender`.

## Fallgruver

- `verdi[]` og `body[]` må alltid ha samme lengde. Bølgen legger halve verdien av et spist ledd i `bevart`.
- Hendelsene tømmes av komponenten og av `sim.step` hver ramme.
- Robotene får ett grep per 0,2 s; de legger bare svinger de rekker før neste grep.
