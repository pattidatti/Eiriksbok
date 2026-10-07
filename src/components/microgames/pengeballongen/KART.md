# Pengeballongen - kart over mappa

Ferdig bygg (fase 6: kunst, juice, lyd, tekst; forbedring 1: sjanser, Ola-boka, roret, ny HUD; natt 2 forbedring 1: myk kontroll, jernbanen, porter under fjellet). Brief: `docs/microgames/briefer/pengeballongen.md`.
Komponent: `../Pengeballongen.tsx` (skall, input, lagring, meny/pause/slutt-skjerm, øving fra 1870, selvspill).

| Fil | Hva den gjør |
| --- | --- |
| `tuning.ts` | Alle tallene: år, fart, ballong, løft (varme, akselerasjon, tynn luft, synk, flosshatter, rolig start), roret (`synk`, `stig`, `over`, dalene), penger (pris, sparing før/utenfor/i båndet, grense, valgår), Ueland-gangeren (nær-bånd, vindu, trinn, fall), formene, `banen`, knausene 1882, `port`, press, ranger, `øvFra`. |
| `levels.ts` | Brettene (bildetekst, banner, terreng før 1833), sletta før 1833, `formFor()` per valgperiode (tind / skrapeåser, fra 1854 også banen), `BANER`, finalen, kongens utgifter, funnene med fagsetning. |
| `terrain.ts` | Tid <-> år <-> vei, `lagTerreng(rng)` (også `baner` og portene i rorstrekket), oppslag `bakke`, `fastTopp`, `knausVed`. |
| `state.ts` | Typene og `newGame(seed, fraÅr?)` (øving hopper til 1870 med alt før lagt inn). |
| `rules.ts` | Fagkjernen: `hold()`, `ror()`, `fly()` (fysikksteget, delt med robotene), `rorMål()`, `synk()`, `stig()`, `klaring()`, `nærhet()`, `iBåndet()`, `kostnad()`, `sparing()`, `krasjer()`, `press()`, `rang()`. |
| `game.ts` | Kjerneløkka `update(g, dt)`: varme og løft, penger og sparing, gangeren, veiskillene, funn, valgene, spor, krasj, landing. |
| `bots.ts` / `sim.ts` | Robotene (`pilot()` spår med samme fysikk og regner med at neste grep kan komme sent, `rorValg()` i rorstrekket) og simuleringskontrakten. |
| `analyse.ts` | Tuning-verktøy: `npx tsx src/components/microgames/pengeballongen/analyse.ts 100` viser seier, poeng, snitt-ganger og andel av valggrensen tidlig/sent per robot. |
| `art.ts` | Paletten `P`, kvalitetsnivå (`?kvalitet=`), kritt-korn som mønster, skyer, `støy`/`hash`. |
| `scene.ts` | Himmel (varmere mot 1884, sol bak Stortinget), skyer, tre fjell-lag med snø og dis, forgrunnen i kornet kritt med skrapt hvitt, graner, nær-båndet (prikker), glød, knauser med krone, fjellveggen over porten (`tegnPort`), jernbanen med tog og stasjon (`tegnBaner`), utgifter, funn. |
| `figures.ts` | Ballongen med bonde, Ueland, flosshatter og Sverdrup; spøkelset; tingstua; funnet; kronen; Stortinget. |
| `hud.ts` | Litografibladet: papirmarg, bildetekst, tast, Spart, brennerpris, tidslinja (målet), Ueland-ovalen, valgstabelen. |
| `draw.ts` | Setter bildet sammen (rekkefølgen), `skala`/`tilSkjerm`/`flateX`. |
| `fx.ts` | Lappefeltet (én lapp om gangen, kø), partikler (mynter, gnister, røyk, hatter, luer, papir), mynter som flyr til telleren, rystelse i ekte tid. |
| `juice.ts` | Hva verden gjør hver ramme (mynter i brenneren, gnister i båndet, nesten-bom) og ved hendelser. |
| `sound.ts` | Lydene på `createArcadeSynth`. |
| `coach.ts` | All tekst under runden: bannere, lapper, de tre lærings-øyeblikkene, poengtekst. |
| `texts.ts` | Tekstene: mål, regler, lapper, BEAT, tips, «Dette skjedde» (`SKJEDDE`), lærdom. |

## Kjerneløkka

1. Ballongen står på x = 288 og ruller mot høyre. Ett grep: hold (mellomrom, pil opp, W, mus).
2. Hold koster `kostnad()` (10 Spd/s, 14 før 1833, -20 % med Ola-boka). Slipp sparer `sparing()`:
   6/s før 1833, 2/s over nær-båndet, 10 x gangeren i båndet.
3. Nær-båndet (`ganger.nær` 70 px): `nærhet()` = minste høyde over bakken i et vindu (90 px bak,
   30 foran), så nedoverbakken etter en topp teller. 1 s i båndet = +1 trinn (maks ×10); over
   båndet faller den ett trinn per 1,5 s. Trykk-straffen (`brent`) er fjernet.
4. Valg hvert tredje år; fra 1833 er `periode > grense` stemt ut. Flosshatt ved hvert valg fra 1836 (tyngre).
5. Hver valgperiode fra 1833 har sin form: tind, bølgende skrapeåser, veiskille. Alt blir
   `form.økning` høyere per periode.
6. Jernbanen (fra 1854, hver tredje periode: Hovedbanen, Kongsvingerbanen, Drammenbanen): en lang
   jevn stigning opp til en stasjon. Den koster mest av budsjettet (flink ca. 21 av 26 Spd.), så
   den må planlegges: spar før, fyr tidlig og jevnt langs skinnene. Toget er bare bilde.
   Kongeveien (gave ×2 / +1 embetsmann) er fjernet - den var en fjerde regel uten fagkjerne.
7. Seier: 1884,5 (Løvebakken). Tap: fjell/knaus eller stemt ut.
8. Ny sjanse (`sjekk`): fra 1833 lagres et sjekkpunkt ved hvert valgflagg. Krasj eller stemt ut
   spoler tida tilbake dit (`slutt()` i game.ts), trekker 15 % av det sparte og bruker én av tre sjanser.
9. Ola-boka (funn 1831): henger høyere enn de andre funnene. Tatt = brenneren 20 % billigere (`kostnad()`).
10. Roret (`ror`): fra 1884,0 går tida sakte (`år.rorTempo`), og eleven styrer helt: hold = opp,
    pil ned / S / trykk under ballongen = ned mot dalen (`rorMål()`: 38 px over bakken foran,
    så å holde for lenge legger ballongen langs dalen i stedet for å krasje), ingen av dem = rett
    fram. Tre daler har en fjellvegg over seg (`port: true`, toppen over himmelen) med en port
    under og en stemme i porten (40 x gangeren). Fjell du før måtte betale deg over, dykker du nå
    under. Uten roret går det ikke.

11. Bondetinget (hendelse `bondeting` ved 1833, ca. 14 s spilltid): brenneren går fra
    `penger.førBonde` (14) til `penger.perSek` (10) Spd/s, banneret «BONDETINGET 1833», og
    budsjettkortet i HUD-en (`BUDSJETT` i hud.ts, fast under Ueland-portrettet) får en bredere og
    høyere bar (150x12 -> 200x24), gullkant og stempelet «BONDETINGET 1833» til 1838,5, så
    filmbildet ved 20 s fanger det. Etiketten «Budsjett til valget 18xx» står alltid; under 25 %
    igjen blir etikett, bar og kant røde og blinker.
15. Lappene (forbedring 4): bare én om gangen, i et fast felt under tidslinja (`LAPPEFELT` i fx.ts),
    aldri ved ballongen. Viktige lapper venter i kø (maks to, den aktive viker etter 3 s); korte
    (`sek` <= 1,1: Ueland ×n, Hårfint) byttes ut eller droppes. x/y i `lapp()` brukes ikke lenger.
12. Kongens veto er fjernet (forbedring 3): det var bare ekstra synk, ikke et valg.
16. Hit-stop: `stopp(fx, sek)` fryser spillet 0,06-0,12 s ved funn, stemme, porten og ×5/×10.
13. Gangeren går til ×10 (`ganger.maks`); over ×5 kommer fartsstriper, lyd, blink og «Full fart!».
14. Rorstrekket er ca. 15 s (`rorTempo` 30) med tre daler og porter, så filmbildet ved 110 s viser roret.

## Knapper

- Flink-robotens poeng: `ganger.trinn`, `ganger.nær`, `ganger.vindu`.
- Hvor tilgivende kontrollen er: `løft.akselerasjonNed` (150), `løft.synkFra/synkTil` (85/115),
  `løft.varmeTau`. Bevis med et jitter-skript: flink med grep hvert 0,2-0,5 s og 5-20 % sene grep.
- Hvor tett budsjettet er: `penger.grense` (26) mot `løft.synkTil` og `form.økning`.
  Flink bruker ca. 54 % tidlig og 83 % sent; sløseren blir stemt ut i 1830-årene.
- Hvor tett jernbanen er: `banen.høyde` mot `penger.grense`.

## Fallgruver

- Hele terrenget lages i `newGame` fra seed; endrer du farten, flytter alt seg.
- Knausen sjekkes mot hele ballongen (`halvBredde`), bakken bare mot kurven.
- Komponenten tømmer `g.hendelser` hver ramme; sim.ts gjør det samme.
- Ny sjanse spoler `g.t` tilbake. Alt som planlegger etter spilltid (robottakt, analyse) må ha
  egen klokke - analyse.ts brukte `g.t` og lot robotene stå stille i 5 s etter hver sjanse.
- HUD-tekst og lapper tegnes på canvas på solide papirkort (`kort()` i hud.ts, `tegnLapper()` i
  fx.ts). Bruk ikke `text.float` - skallets svevetekst ble utvasket mot den lyse himmelen.
- En robot med for liten fare-margin vinner i simuleringen men krasjer i nettleseren. Test med flere dt.
- Robotene planlegger med `vent` (0,75 s) og `fartMargin`: de regner med at neste grep kan komme
  sent. Med `vent` = robottakten (0,2 s) vant flink 0 av 40 med grep hvert 0,25 s.
- Kornet er et `CanvasPattern` som flyttes med `setTransform` - ellers står kornet stille mens fjellet glir.
