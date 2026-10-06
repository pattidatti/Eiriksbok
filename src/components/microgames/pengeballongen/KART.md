# Pengeballongen - kart over mappa

Ferdig bygg (fase 6: kunst, juice, lyd, tekst; forbedring 1: sjanser, Ola-boka, roret, ny HUD). Brief: `docs/microgames/briefer/pengeballongen.md`.
Komponent: `../Pengeballongen.tsx` (skall, input, lagring, meny/pause/slutt-skjerm, øving fra 1870, selvspill).

| Fil | Hva den gjør |
| --- | --- |
| `tuning.ts` | Alle tallene: år, fart, ballong, løft (varme, akselerasjon, tynn luft, synk, flosshatter, rolig start), penger (pris, sparing før/utenfor/i båndet, grense, valgår), Ueland-gangeren (nær-bånd, vindu, trinn, fall), formene, veiskillene (`gapLav`, `kongeveiKostnad`), press, ranger, `øvFra`. |
| `levels.ts` | Brettene (bildetekst, banner, terreng før 1833), sletta før 1833, `FORMER` per valgperiode (tind / bølgende skrapeåser / veiskille), finalen, kongens utgifter, funnene med fagsetning. |
| `terrain.ts` | Tid <-> år <-> vei, `lagTerreng(rng)`, oppslag `bakke`, `fastTopp`, `knausVed`. |
| `state.ts` | Typene og `newGame(seed, fraÅr?)` (øving hopper til 1870 med alt før lagt inn). |
| `rules.ts` | Fagkjernen: `hold()`, `ror()`, `fly()` (fysikksteget, delt med robotene), `synk()`, `stig()`, `klaring()`, `nærhet()`, `iBåndet()`, `kostnad()`, `sparing()`, `krasjer()`, `press()`, `rang()`. |
| `game.ts` | Kjerneløkka `update(g, dt)`: varme og løft, penger og sparing, gangeren, veiskillene, funn, valgene, spor, krasj, landing. |
| `bots.ts` / `sim.ts` | Robotene (`pilot()` spår med samme fysikk) og simuleringskontrakten. |
| `analyse.ts` | Tuning-verktøy: `npx tsx src/components/microgames/pengeballongen/analyse.ts 100` viser seier, poeng, snitt-ganger og andel av valggrensen tidlig/sent per robot. |
| `art.ts` | Paletten `P`, kvalitetsnivå (`?kvalitet=`), kritt-korn som mønster, skyer, `støy`/`hash`. |
| `scene.ts` | Himmel (varmere mot 1884, sol bak Stortinget), skyer, tre fjell-lag med snø og dis, forgrunnen i kornet kritt med skrapt hvitt, graner, nær-båndet (prikker), glød, knauser med krone, utgifter, funn. |
| `figures.ts` | Ballongen med bonde, Ueland, flosshatter og Sverdrup; spøkelset; tingstua; funnet; kronen; Stortinget. |
| `hud.ts` | Litografibladet: papirmarg, bildetekst, tast, Spart, brennerpris, tidslinja (målet), Ueland-ovalen, valgstabelen. |
| `draw.ts` | Setter bildet sammen (rekkefølgen), `skala`/`tilSkjerm`/`flateX`. |
| `fx.ts` | Partikler (mynter, gnister, røyk, hatter, luer, papir), mynter som flyr til telleren, rystelse i ekte tid. |
| `juice.ts` | Hva verden gjør hver ramme (mynter i brenneren, gnister i båndet, nesten-bom) og ved hendelser. |
| `sound.ts` | Lydene på `createArcadeSynth`. |
| `coach.ts` | All tekst under runden: bannere, lapper, de tre lærings-øyeblikkene, poengtekst. |
| `texts.ts` | Tekstene: mål, regler, lapper, BEAT, tips, «Dette skjedde» (`SKJEDDE`), lærdom. |

## Kjerneløkka

1. Ballongen står på x = 288 og ruller mot høyre. Ett grep: hold (mellomrom, pil opp, W, mus).
2. Hold koster `kostnad()` (10 Spd/s, +15 % per hatt fra kongeveien). Slipp sparer `sparing()`:
   6/s før 1833, 2/s over nær-båndet, 10 x gangeren i båndet.
3. Nær-båndet: `nærhet()` = minste høyde over bakken i et vindu (90 px bak, 30 foran), så
   nedoverbakken etter en topp teller. 1 s i båndet = +1 trinn (maks ×10); over båndet faller den
   ett trinn per 1,5 s. Et nytt trykk på brenneren mens kurven er i båndet koster ett trinn
   (hendelse `brent`); fjæring innen `ganger.fjær` (1,5 s) etter teller som samme trykk.
4. Valg hvert tredje år; fra 1833 er `periode > grense` stemt ut. Flosshatt ved hvert valg fra 1836 (tyngre).
5. Hver valgperiode fra 1833 har sin form: tind, bølgende skrapeåser, veiskille. Alt blir
   `form.økning` høyere per periode.
6. Kongens veiskille: under knausen (1,6 ballonghøyder) = gangeren +1 med en gang. Over =
   kongeveien: kongens gave (`g.gave`, dobbel sparing i `ganger.gave` = 5 s, synlig i portrettet og
   som mynter), men +1 embetsmann og brenneren +15 % resten av runden.
7. Seier: 1884,5 (Løvebakken). Tap: fjell/knaus eller stemt ut.
8. Ny sjanse (`sjekk`): fra 1833 lagres et sjekkpunkt ved hvert valgflagg. Krasj eller stemt ut
   spoler tida tilbake dit (`slutt()` i game.ts), trekker 15 % av det sparte og bruker én av tre sjanser.
9. Ola-boka (funn 1831): henger høyere enn de andre funnene. Tatt = brenneren 20 % billigere (`kostnad()`).
10. Roret (`ror`): fra 1884,0 går tida sakte (`år.rorTempo`), eleven får pil ned / S / trykk under
    ballongen (`ror()`), brenneren svarer raskere (`fly()`), og tre bratte daler har en stemme
    i bunnen (40 x gangeren). Uten roret synker ballongen for sakte til å nå dem.

11. Bondetinget (hendelse `bondeting` ved 1833, ca. 14 s spilltid): brenneren går fra
    `penger.førBonde` (14) til `penger.perSek` (10) Spd/s, budsjettbaren blir bredere (12 -> 26 px),
    gløder og har lappen «Bondetinget: billigere brenner» under seg til 1838,5, så filmbildet ved
    20 s fanger det. Baren heter «Budsjett til valget 18xx» hele runden.
12. Kongens veto er fjernet (forbedring 3): det var bare ekstra synk, ikke et valg.
13. Gangeren går til ×10 (`ganger.maks`); over ×5 kommer fartsstriper, lyd, blink og «Full fart!».
14. Rorstrekket er ca. 15 s (`rorTempo` 30) med fem daler, så filmbildet ved 110 s viser roret.

## Knapper

- Flink-robotens poeng: `ganger.trinn`, `ganger.fjær` (uten fjær-vinduet når ingen over ×2), `ganger.nær`, `ganger.vindu`.
- Hvor tett budsjettet er: `penger.grense` (26) mot `løft.synkTil` og `form.økning`.
  Flink bruker ca. 50 % tidlig og 55 % sent, sløseren 115 %.
- Hvor nybegynneren ryker: `kongeveiKostnad` (hver kongevei gjør resten dyrere).

## Fallgruver

- Hele terrenget lages i `newGame` fra seed; endrer du farten, flytter alt seg.
- Knausen sjekkes mot hele ballongen (`halvBredde`), bakken bare mot kurven.
- Komponenten tømmer `g.hendelser` hver ramme; sim.ts gjør det samme.
- Ny sjanse spoler `g.t` tilbake. Alt som planlegger etter spilltid (robottakt, analyse) må ha
  egen klokke - analyse.ts brukte `g.t` og lot robotene stå stille i 5 s etter hver sjanse.
- HUD-tekst og lapper tegnes på canvas på solide papirkort (`kort()` i hud.ts, `tegnLapper()` i
  fx.ts). Bruk ikke `text.float` - skallets svevetekst ble utvasket mot den lyse himmelen.
- En robot med for liten fare-margin vinner i simuleringen men krasjer i nettleseren. Test med flere dt.
- Kornet er et `CanvasPattern` som flyttes med `setTransform` - ellers står kornet stille mens fjellet glir.
