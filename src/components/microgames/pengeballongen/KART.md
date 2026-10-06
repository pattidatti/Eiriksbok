# Pengeballongen - kart over mappa

Gråboks (fase 4, med diagnosegrep 1). Brief: `docs/microgames/briefer/pengeballongen.md`. Komponent: `../Pengeballongen.tsx`
(skall, input, tekst via `useArcadeText`, lagring, selvspill, meny/pause/dødskort).

| Fil | Hva den gjør |
| --- | --- |
| `tuning.ts` | Alle tallene: år (0,83 s til 1833, 1,65 s etter = 100 s), fart, ballongen (mål, tak), løftet (varme, akselerasjon opp/`akselerasjonNed`, stigefart nede/oppe, `tynnLuft`, synk, flosshatter, rolig start), pengene (10 Spd/s, grensen 29, valgårene), Ueland-gangeren (nær-båndet), formene (tind, kam, `økning` per valg), veiskillene (`gapLav`, kongeveiens hatt), press, ranger. |
| `levels.ts` | Brettene (`BRETT`: bildetekst, banner, terrengregler før 1833, dalbunnen etter), den høye sletta før 1833 (`SLETTE`), formrekkefølgen per valgperiode (`FORMER`: tind, skrapedal, veiskille), de åpne veiskillene etter 1882, kongens navngitte utgifter og funnene med fagsetning. |
| `terrain.ts` | Tid <-> år <-> vei (`årFor`/`tidFor` med fartsskifte i 1833, `RUNDE`, `veiVed`, `tidForVei`, `fartVed`), `lagTerreng(rng)` (tilfeldige rygger før 1833, én form per valgperiode etter, finalen), oppslag: `bakke`, `fastTopp` (= bakken), `knausVed`. |
| `state.ts` | Typene (`Game`, `Hendelse`, `Årsak`) og `newGame(seed)`. Ingen regler. |
| `rules.ts` | Fagkjernen: `hold()` (eneste grep), `synk()`, `stig()` (tynn luft: høyt = dyrt), `klaring()`, `krasjer()`, `press()`, `rang()`. |
| `game.ts` | Kjerneløkka `update(g, dt)`: tid/vei, varme og løft, penger og spart, gangeren (nær-båndet), veiskillene (over/under, kongeveiens hatt), funn, valgene (stemt ut / flosshatt), valgpunkter, spor, krasj, landing. |
| `bots.ts` | Robotene (én kilde for sim og usePlaytest): flink, nybegynner, sløseren, gniten, tilfeldig. `pilot()` spår med samme fysikk og har et skrapegrep for nær-båndet. |
| `sim.ts` | `SimSpec`, `snapshotOf()`, `GAME_ID`, `MAKS_SEKUNDER`. |
| `draw.ts` | Gråboks-tegningen med flate former i kunstbriefens palett `P`, `skala`/`tilSkjerm`/`flateX`, nær-båndet (stiplet strek), HUD (bildetekst, Spart, tidslinje, Ueland-oval, valgmåleren som liggende stolpe under ovalen). |
| `texts.ts` | All tekst: mål, regler, lapper, lærings-øyeblikk, tips ved tap, «Dette skjedde». |

## Kjerneløkka

1. Ballongen står fast på x = 288 og ruller mot høyre i fast fart per år. Eleven har bare ett
   grep: hold (mellomrom, pil opp, W, mus/trykk). Varmen følger knappen med `varmeTau`, farten
   følger varmen med `akselerasjon`. Ingen retning før 1884.
2. Hold koster 10 Spd/s og fyller stabelen (`periode`). Slipp sparer 10 x gangeren (`spart` = poeng).
3. Løftet er svakere høyt oppe (`stigLav` -> `stigHøy`, kurve `tynnLuft`). Derfor koster det mer
   å fly høyt, og den som skraper tett over fjellene bruker minst.
4. Valg hvert tredje år fra 1827. 1827 og 1830 vinker bøndene. Fra 1833: `periode > grense` = stemt
   ut. Fra 1836 klatrer en flosshatt om bord ved hvert valg (`perHatt` tyngre).
5. Ueland-gangeren fra 1833: under `nær` px over bakken (nær-båndet) vokser den ett trinn per
   `trinn` s, og straks ballongen er over båndet går den til ×1.
6. Fra 1833 har hver valgperiode (ca. 5 s) sin form: tind (dyr), skrapedal (lang og flat, for
   gangeren), veiskille. Tinden og kammen blir `form.økning` høyere per valg.
7. Kongens veiskille (før 1882): kam med knaus over. Under = smal åpning rett over kammen
   (billig, teller som nær-bånd). Over = kongeveien (dyr, +1 flosshatt). Begge er lovlige. Fra
   1882: åpne knauser over dalen.
8. Seier: år >= 1884,5 (Løvebakken). Tap: `krasjer()` (fjell eller knaus) eller stemt ut.
9. `valg` telles når en rygg, et funn, et veiskille eller et ekte valg (700 px før) kommer til syne.

## Knapper

- Marginen mellom flink og sløseren: `grense` mot `tynnLuft`/`stigHøy`. Flink bruker 16-22 per
  periode, sløseren 30-32 (grense 29: bare 1 Spd margin!), nybegynnerens kongevei 25-34.
- Hvor nybegynneren ryker: `form.økning` (svært følsom: 0,08 = 2-4 % seier, 0,06 = 11-14 %),
  `form.kam` og `veiskille.tykkelse` (hvor høyt kongeveien går).
- Gangeren: `ganger.nær`. 35 px er for smalt for en robot som trykker i ticks på 0,2 s (×1,2).
- Den lave åpningen: `veiskille.gapLav` - for lite og flink treffer undersiden av knausen.

## Fallgruver

- Hele terrenget lages i `newGame` fra seed; endrer du farten, flytter alt seg (årene følger tida).
- Knausen sjekkes mot hele ballongen (`halvBredde`), bakken bare mot kurven (`kurvHalv`).
- Komponenten tømmer `g.hendelser` hver ramme; sim.ts gjør det samme i `step`.
- Simuleringen steger med 0,05 s, nettleseren med andre steg. En robot med for liten fare-margin
  (1 px) vinner i simuleringen men krasjer i nettleseren. Test med flere dt.
