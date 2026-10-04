# Generalstreiken - kart over mappa

Gråboks (fase 3a). Brief: `docs/microgames/briefer/generalstreiken.md`. Komponent:
`../Generalstreiken.tsx` (skall, input, selvspill, start-/pause-/sluttskjerm).

| Fil | Hva den gjør |
| --- | --- |
| `tuning.ts` | Alle tallene: fart (6 ruter/s, +0,1 per ledd, tak 11), startleddene, kø for svinger, fabrikkverdier før/etter Grenelle og fjernbonus, spawnradius, x2 SAMMEN, `grenelleFra`, `splittetUnder`, kalenderen (`dagSek`), ranger, pressvekter. |
| `levels.ts` | De tre brettene fra briefens punkt 11: rutenett, Paris, fabrikker som blinker samtidig, fartstak, knapp, mål, bølgen (start, økning), kalender, `frist`, fjernbonus og navngitte fabrikker. |
| `state.ts` | Typene (`Game`, `Fabrikk`, `Hendelse`, `Årsak`), `newGame(seed, bi)` og `startBrett()`. Seedet rng i spillet. |
| `rules.ts` | Fagkjernen og grepene: `styr()`, `trykk()` (GRENELLE, så AVSLUTT), `knapp()`, `millioner()`, `fart()`, `bølgeFart()`, `bølgeAvstand()`, `verdiFor()`, `press()`, `poeng()`, `rang()`, `tap()`, `neste()`. |
| `game.ts` | Kjerneløkka `update(g, dt)`: nye fabrikker, fristen, bevegelse rute for rute (`ettSteg`: kø, kartkanten svinger selv, krasj kutter kjeden, hekting, x2), bølgen bakfra, brett 1 vunnet ved målet. |
| `bots.ts` | Robotene (én kilde for sim og usePlaytest): streikeleder, halvgod, aldri-avslutt, aldri-grenelle, tilfeldig. Styringen simulerer sine egne svinger med `ettSteg`. |
| `sim.ts` | `SimSpec`, `snapshotOf()`, `GAME_ID`, `MAKS_SEKUNDER`. |
| `draw.ts` | Gråboksvisningen: rutenett, fabrikker som svarte bokser med verdi, kjeden i rødt, bølgen i blått, HUD (teller, mål, kalender/frist, bølgeavstand, x2), brettkortet. Paletten `P`. |
| `texts.ts` | Tapene med tips, seiersplakaten, brettkort og mål. |

## Kjerneløkka

1. Hodet går én rute per `1/fart` s. Svinger ligger i kø (maks `TUNING.kø`). Ved kartkanten
   svinger hodet selv mot mest plass - kanten er aldri et tap.
2. Hekter du på en fabrikk, får kjeden ett ledd med fabrikkens verdi (`verdiFor`). Nyeste ledd
   ligger nærmest hodet, eldste ved halen. Millionene = summen av leddene.
3. Krasj i egen kjede: alt fra krasjpunktet og bakover faller av. Under 0,5 millioner = splittet.
4. `trykk()`: GRENELLE (fra 1,5 millioner) starter bølgen, som spiser halen med
   `start + økning * sekunder`. AVSLUTT lagrer millionene i `resultat[bi]`. Under målet = tap.
5. Fristen (`frist`, brett 3 = 30. mai) uten GRENELLE = tap. Brett 1 har ingen knapp.
6. Én runde i sim/selvspill = brett 1, 2 og 3 etter hverandre. Poeng = tiendeler av millioner
   summert over brettene. Seier = AVSLUTT med minst 8 på brett 3.
7. `valg` teller nye fabrikker (2-4 å velge mellom), GRENELLE og AVSLUTT.

## Knapper

- Vinnerandelen: `bølge` i levels.ts brett 3 og `fabrikk.etter`/`fjernBonus`.
- Hvor lenge man venter med GRENELLE: kalenderen (`frist`) mot farten man hekter på i.
- `sammen` (x2) gir mye: vinduet på 1,5 s og `minAvstand` styrer hvor ofte.

## Fallgruver

- `verdi[]` og `body[]` må alltid ha samme lengde.
- Hendelsene tømmes av komponenten og av `sim.step` hver ramme.
- Robotene får ett grep per 0,2 s; de legger bare svinger de rekker før neste grep.
