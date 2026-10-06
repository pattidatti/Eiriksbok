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
   nedoverbakken etter en topp teller. 2 s i båndet = +1 trinn (maks ×5); over båndet faller den
   ett trinn per 0,5 s (korte hopp under 0,5 s er gratis).
4. Valg hvert tredje år; fra 1833 er `periode > grense` stemt ut. Flosshatt ved hvert valg fra 1836 (tyngre).
5. Hver valgperiode fra 1833 har sin form: tind, bølgende skrapeåser, veiskille. Alt blir
   `form.økning` høyere per periode.
6. Kongens veiskille: under knausen (1,6 ballonghøyder) = gangeren +1 med en gang. Over =
   kongeveien: +1 flosshatt, brenneren +15 % resten av runden, gangeren til ×1.
7. Seier: 1884,5 (Løvebakken). Tap: fjell/knaus eller stemt ut.
8. Ny sjanse (`sjekk`): fra 1833 lagres et sjekkpunkt ved hvert valgflagg. Krasj eller stemt ut
   spoler tida tilbake dit (`slutt()` i game.ts), trekker 15 % av det sparte og bruker én av tre sjanser.
9. Ola-boka (funn 1831): henger høyere enn de andre funnene. Tatt = brenneren 20 % billigere (`kostnad()`).
10. Roret (`ror`): fra 1884,0 går tida sakte (`år.rorTempo`), eleven får pil ned / S / trykk under
    ballongen (`ror()`), brenneren svarer raskere (`fly()`), og tre bratte daler har en stemme
    i bunnen (40 x gangeren). Uten roret synker ballongen for sakte til å nå dem.

## Knapper

- Flink-robotens poeng: `ganger.nær`, `ganger.vindu`, `ganger.trinn`. Vinduet er det som gjorde ×5 mulig.
- Hvor tett budsjettet er: `penger.grense` (26) mot `løft.synkTil` og `form.økning`.
  Flink bruker 60 % tidlig og 70 % sent, sløseren 115 %.
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
