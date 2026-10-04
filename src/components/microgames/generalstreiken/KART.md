# Generalstreiken - kart over mappa

Ferdig spill med kunst (Atelier Populaire-silketrykk). Brief: `docs/microgames/briefer/generalstreiken.md`.
Komponent: `../Generalstreiken.tsx` (arkadeskall, input, tekst via `useArcadeText`, lyd, lagring,
selvspill, start-/pause-/sluttskjerm, demo-streik bak menyen).

| Fil | Hva den gjør |
| --- | --- |
| `tuning.ts` | Alle tallene: fart (6,2 ruter/s + 0,19 per ledd, tak 11), startleddene (4 x 0,025), kø for svinger, fabrikkverdier før/etter Grenelle og fjernbonus, `minAvstand` før og `etterAvstand` (8-14) etter Grenelle, `vent` (gangetallet på hele streiken etter Grenelle: x1 + 0,045 per sekund, tak x2,2), `slump` (bølgefarten byttes tilfeldig 0,65-1,55 ved hvert byks), `tv` (TV-kvelden 21. mai på brett 3: 3 fabrikker langt unna x 0,2), `x2` (15 %, langt ute, 6 s, dobler bare sin egen grunnverdi), `byks` (bølgen: `kryp` 40 % jevnt, resten i byks hvert 3.-6. s med `varsel` 1 s før), `krasjStraff` (0,04 per ledd), `trekk`, `grenelleFra`, `splittetUnder`, kalenderen, `seier` (7/9/12), ranger, pressvekter (fart, `trangt`, kalender, bølgen). |
| `levels.ts` | De tre brettene: rutenett, Paris, `regioner` med vekt, fabrikker samtidig (3/3/4), fartstak, knapp, mål (2,5 / 4 / 7), `startDag` (brett 3: 17. mai), bølgen (`start`, `vekst` per fabrikk, `økning` per sekund), kalender, `frist`, fjernbonus, x2, `leddPer` (brett 1: 2 ledd per fabrikk), `klynge` (brett 1: tre fabrikker tett), `splitt` (brett 1: krasj splitter ikke), navngitte fabrikker. |
| `state.ts` | Typene (`Game`, `Fabrikk`, `Hendelse` med `hekt`/`krasj`/`grenelle`/`spist`/`varsel`/`byks`/`brett`/`tv`, `Årsak`), `newGame(seed, bi)` og `startBrett()`. `etterN`, `bevart`, `vekst`, `sisteRegion`, `byksNeste`, `bølgeFaktor`, `tvSendt`, `krasj`. Seedet rng i spillet. |
| `rules.ts` | Fagkjernen og grepene: `styr()`, `trykk()` (GRENELLE, så AVSLUTT), `knapp()`, `rå()` (grunnverdien), `millioner()` (rå x gangetallet), `fart()`, `bølgeFart()` (snittfart), `planleggByks()`, `byksVarsel()`, `bølgeAvstand()`, `bølgeSek()`, `gangetall()` (tidsbasert), `nærhet()` (grov måler 0-2), `verdiFor()`/`grunnverdi()`, `erX2()`, `seierNivå()`, `trangt()`, `press()`, `poeng()`, `rang()`, `tap()`, `neste()`. |
| `game.ts` | Kjerneløkka `update(g, dt)`: nye fabrikker (`nyFabrikk`: klynger på brett 1, regioner før Grenelle, en ny region minst 8 ruter unna etter), fristen, bevegelse rute for rute (`ettSteg`: kø, kartkanten svinger, krasj kutter kjeden og trekker `krasjStraff`, hekting med `leddPer`), bølgen bakfra (kryp + byks med varsel), `tvKveld()`. |
| `bots.ts` | Robotene (én kilde for sim og usePlaytest): streikeleder (regner tiden til neste fabrikk mot snittfarten, AVSLUTT når halen blinker og bølgen er nær), halvgod, aldri-avslutt, aldri-grenelle, tilfeldig. |
| `sim.ts` | `SimSpec`, `snapshotOf()`, `GAME_ID`, `MAKS_SEKUNDER`. |
| `art.ts` | Kunsten som tegnes én gang: palett `P`, `FONT`, `pickTier()` (`?kvalitet=lav`), `layout()`/`ruteTilSkjerm()` (plakaten skjev 0,7 grader på muren), `tegnBakgrunn()` (mur, plakatrester, papir, limrynke, kartlinje per brett, stedsnavn), `tegnFlekker()` (flekkemasken), formene `fabrikkForm`, `folkForm`, `neveForm`, `deGaulleForm`. |
| `draw.ts` | Hver ramme: svart lag (spøkelse, fabrikker som blinker, verdier, x2-nedtelling, ringer, røyk), blekklaget (rød uro fra Sorbonne, blå flate etter Grenelle, de Gaulle, okkuperte fabrikker, kjeden med folk skåret ut, bølgen og blinket ved halen, folk som går hjem, sprut, telleren) med flekkemaske og 1,5 px feilregistrering, papirbiter, gangetallet ved hodet, HUD (skala med mål/nivåer og rekordstrek, datoseddel), rakel-sveipet. |
| `fx.ts` | Juice i ekte tid: partikler, risting, telleren som ruller og spretter, folk som går hjem, ledd som falt av, merker, ringer, sveipet. |
| `sound.ts` | Lydene (fløyte + klask per ledd, stiger med rekka; krasj, GRENELLE, varsel, byks, avslutt, seier, tap) på arkadesynthen. |
| `Sluttplakat.tsx` | Slutt-skjermen (tittel, rang, tekst, konkret tips ved tap, «Dette skjedde», knappene). |
| `tips.ts` | `Resultat` og `tipsFor()`: tapsskjermens tips ut fra hvordan runden endte. |
| `texts.ts` | Tapene med tips, seiersplakatene (`SEIER`), brettkort, `MÅL_TEKST`, plakatveggen (`PLAKATER`, `SLAGORD`), lærings-øyeblikkene (`ØYEBLIKK`), `BRETT_BANNER`, `AVSLUTT_LAPP`, `TV`, `ÅRSAKER`/`FØLGER` («Dette skjedde»), `NY_START`. |

## Kjerneløkka

1. Hodet går én rute per `1/fart` s. Farten øker med lengden. Svinger ligger i kø. Ved
   kartkanten svinger hodet selv - aldri et tap.
2. Hekter du på en fabrikk, får kjeden `leddPer` ledd (verdien deles på dem). Millionene =
   summen av leddene + `bevart`.
3. Krasj i egen kjede: alt fra krasjpunktet og bakover faller av, og hvert ledd trekker
   `krasjStraff` ekstra med en gang. Under 0,5 millioner = splittet (ikke på brett 1).
4. `trykk()`: GRENELLE (fra 1,5) starter bølgen (de Gaulles marsj, tegnet som et blått tog med
   flagg ved halen). Etter det vokser gangetallet på hele streiken hvert sekund (x1 + 0,045 s,
   tak x2,2); x2-fabrikker dobler bare grunnverdien. Telleren viser rå x gangetall.
   Bølgens snittfart er `(start x vekst^n + økning x sekunder) x bølgeFaktor` (ny tilfeldig
   faktor ved hvert byks); 40 % kryper jevnt, resten
   kommer i byks på 2-4 ledd hvert 3.-6. sekund, med et blått blink 1 s før. Hvert spist ledd
   trekker 50 % av verdien. AVSLUTT lagrer millionene i `resultat[bi]`. Under målet = tap.
5. Fristen (brett 3 = 30. mai) uten GRENELLE = tap. Brett 1 har ingen knapp.
6. Én runde = brett 1 (ca. 13-15 s), 2 (ca. 20-25 s) og 3 (ca. 35 s). Poeng = tiendeler av
   millioner summert. Seier = AVSLUTT med minst 7 på brett 3, i nivåer 7 / 9 / 12. TV-kvelden 21. mai gir +0,6 fra
   fabrikker langt unna.
7. `valg` teller nye fabrikker, GRENELLE og AVSLUTT. `press()`: før Grenelle fart + hvor tett
   egen kjede ligger rundt hodet (`trangt`) eller kalenderen; etter Grenelle bølgen.

## Knapper

- Hvor mye «vent litt til» lønner seg: `vent.perSek`, `vent.tak`, `fabrikk.etter` og `trekk` mot `bølge.vekst` og `slump`.
- Hvor uforutsigbar bølgen er: `byks.kryp` (lavere = større byks) og `byks.hvert`.
- Risiko på brett 1: `leddPer`, `klynge`, `krasjStraff`, `fartTak`.
- Presset i første tredjedel: `press.trangt`; i siste: `press.bølgeSek`.

## Fallgruver

- `verdi[]` og `body[]` må alltid ha samme lengde (vekst-leddene får `vekstVerdi`).
- Hit-stop: `fx.stopp` fryser `update` noen hundredeler ved hekting (bare i komponenten, ikke i sim).
- Hendelsene tømmes av komponenten (`reager`) og av `sim.step` hver ramme.
- Robotene får ett grep per 0,2 s. Menyens demo-streik bruker samme robot på et eget `Game`.
- `draw.ts` hopper over kunsten på 1x1-lerretet selvspillet bruker for mellomsteg.
- Blekklaget må stå i `source-over` når telleren tegnes, og i `destination-out` bare for
  folkene og flekkemasken.
