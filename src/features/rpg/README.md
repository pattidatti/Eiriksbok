# Minnevokteren (`/oving/rpg`)

Et rollespill i sanntid der eleven spiller seg gjennom fagstoffet. Tåka
(«Glemselen») spiser det folk husker, og eleven henter det tilbake.

Dette er et eget spor, adskilt fra 3D-mini-spillmotoren i `src/games/engine/`
og fra mikrospillene i `src/components/microgames/`.

## Kort om valgene

| Valg | Hvorfor |
|---|---|
| **Phaser 3** (lazy-lastet) | Sanntids-kamp trenger tilemap, kamera-effekter, tweens og partikler. Phaser gir det ferdig. Ligger i egen bunt (~340 kB gzip) som bare lastes på denne ruta. |
| **All grafikk tegnes prosedyralt** | Ingen bildefiler. Figurer bygges lagvis som en påkledningsdukke (`engine/spriteforge.ts`), så karakterskaping og synlig rustning koster ingenting i grafikkarbeid. |
| **All lyd syntetiseres** | `engine/audio.ts` lager kamplyder og en generativ slått med Web Audio. Ingen lydfiler. |
| **Spørsmål hentes fra boka** | `scripts/generate-quest-bank.mjs` skanner alle Quiz-komponenter i `public/content/` og skriver `public/data/rpg/quest-bank.json`. Nytt fagstoff dukker automatisk opp i spillet. |

## Filer

```
RpgPage.tsx              Ruta: Phaser-lerret + React-grensesnitt + broen mellom dem
types.ts                 Alle domenetyper
data/
  classes.ts             Tre klasser, nivåkurve, utseendevalg
  items.ts               Våpen, rustning, amuletter, priser
  spells.ts              Besvergelser (låses opp av riktige svar, ikke loot)
  enemies.ts             Fiendearketyper + bossen
  zones.ts               Verdenskartet - 11 soner, én ferdig. Hele paletten per sone.
  nordvik.ts             Sone 1: NPC-er, landemerker og håndskrevne spørsmål
engine/
  boot.ts                Starter Phaser (dynamisk import)
  WorldScene.ts          Verden, bevegelse, kamp, fiende-AI, atmosfære
  worldgen.ts            Bygger Nordvik-kartet
  spriteforge.ts         Figurer, fiender, våpen, effekter, pikselfont
  tileforge.ts           Terrengfliser, overgangsfliser og verdensobjekter
  pixels.ts              Tegneverktøy, fargeramper, kontur, seedet tilfeldighet
  audio.ts               Web Audio-syntese
  quests.ts              Setter sammen quester + finner hvor svaret står i verden
  bridge.ts              Hendelser mellom scene og React
  enhet.ts               Har enheten berøringsskjerm?
store/useRpgStore.ts     All spillertilstand + kobling til «Min læring»
components/              Karakterskaper, HUD, dialog, kunnskapsutfordring, sekk,
                         logg, butikk, skjermkontroll og atmosfære-overlegg
```

## Slik henger læring og spill sammen

- **Quest = spørsmål.** Hver quest har en `kilde`: den personen eller den steinen
  som faktisk har svaret. `finnKilde()` i `engine/quests.ts` slår den opp ved å
  matche stikkord mot spørsmålet og fasiten, og hintet peker dit. Alle 17
  bankspørsmålene i Nordvik har en kilde i verden.

  > Dette er lett å ødelegge. Legger du til spørsmål i en sone uten å legge til
  > tilsvarende `kunnskap`/`stikkord` i sonens data, faller de tilbake på et
  > ærlig, men kjedeligere hint («svaret står i artikkelen»). Sjekk at antallet
  > uten kilde er null når du utvider en sone.

- **Kunnskapen ligger bak et klikk.** «Spør X ut» i dialogen er sammenrullet, så
  fasiten ikke står oppslått rett over svarknappen.
- **Galt svar koster.** Første bom avslører ikke fasiten - bare hvor svaret står.
  Andre bom lukker oppdraget uten belønning, men gir forklaringen. Alternativene
  stokkes på nytt for hvert forsøk.
- **Bossen er beskyttet.** Den store Glemselen tar ingen skade før eleven svarer
  riktig. Hvert riktige svar river ned ett skjold. Galt svar koster liv som går
  forbi usårbarheten.
- **Besvergelser låses opp av kunnskap.** `SpellDef.krevesRiktige` er antall
  riktige svar totalt - ikke nivå og ikke loot.
- **«Min læring».** `fullforQuest()` og `felleBoss()` kaller
  `useProgressStore.recordActivity()` med riktig fag og emne, så spillet teller
  på lik linje med en quiz i boka.

## Styring

| Tast | Handling |
|---|---|
| WASD / piltaster | Gå |
| Mellomrom | Slå (kombo 1-2-3) |
| **Shift holdt, i ro** | Reis garden |
| **Shift trykket, i bevegelse** | Rull (kort usårbarhet) |
| **Retning under gard** | Vend garden, skjoldgang i 45 % fart |
| **Shift + mellomrom** | Våpenets manøver (hak / stikk / skjoldstøt) |
| E | Snakk / les / åpne |
| 1-4 | Besvergelser |
| I / L / Esc | Sekk / oppdrag / meny |

Shift betyr to ting, og det er ikke tvetydig: rullen har alltid krevd bevegelse
(`utslag > 0.001` i `oppdaterSpiller`), så «Shift i ro» kan bare være garden.
Holder eleven Shift gjennom en rull, reiser garden seg i det rullen slutter.

Håndkontroll støttes (venstre stikke går, A slår, B ruller, **RB holdt** er gard,
RB+A er manøver, X kaster første besvergelse, Y samhandler). På berøringsskjerm
vises `Skjermkontroll` med analog styrestikke og knapper - uten den er spillet
uspillbart på nettbrett. Der er garden en **veksling**, ikke et hold: tommelen kan
ikke holde skjoldet og slå samtidig.

## Kampsystemet

Kampen bygger på skjoldet, ikke sverdet. All logikk ligger i `engine/kamp.ts`
(ren tilstand, ingen Phaser), alle tallene i `data/vaapen.ts`, og `WorldScene`
gjør bare inndata, treffgeometri og effekter. Kjerneregelen:

> Står du bak et reist skjold når slaget kommer, blokkerer du.
> Reiser du skjoldet i det slaget kommer, parerer du.

Derfor måles paradevinduet fra rammen garden reiser seg (`sidenReist`), ikke fra
tastetrykket. Blokk koster pust og hakker skjoldet; parade koster ingenting og
kaster angriperen ut av balanse. Det gjør det å gjemme seg bak skjoldet til den
dårlige strategien uten at vi trenger å straffe den.

- **Pust** er utholdenhet: slag, blokk, rull og manøver koster, garden drenerer
  6 i sekundet, og gjenvinningen starter 700 ms etter siste handling. Tom pust tar
  aldri en handling fra eleven - den svekker den (trege slag, stavring i stedet
  for rull, og garden faller).
- **Skjoldet** er en forbruksvare med synlig slitasje: fire rammer i en egen
  tekstur (`forgeSkjold`), ett hakk per blokk, brudd på null. Slitasjen er en
  teller eleven kan se, aldri en terning - er den tilfeldig, føles bruddet urettferdig.
- **Dekningen er retningsbestemt.** 120 grader rundt blikkretningen. Angrep fra
  siden og bakfra går rett gjennom, og det er derfor rekka finnes.
- **Garden kan ikke hamres.** `KAMP.gardHvile` holder skjoldet nede i 260 ms etter
  at det er senket, så eleven ikke kan ligge i et evig paradevindu.

Kamptilstanden sendes til HUD-en over broen (`fraSpill.emit('kamp', …)`) elleve
ganger i sekundet, ikke 60 - en store-skriving per bilde ville tegnet HUD-en på
nytt like ofte. Pust- og livsstolpene har `aria-valuenow`, som er det
`scripts/verify-rpg-kamp.mjs` leser når den driver kampen i en ekte nettleser.

Blueprinten for hele kampanjen: `docs/Design documents/minnevokteren-nordvik-blueprint.md`.

## Ting som er lett å ødelegge igjen

Disse er alle feil som har vært i koden, og som ikke er åpenbare:

- **Lås og fysikkpause må følges ad.** Alt som skal fryse spillet går gjennom
  `settLaast()` i `WorldScene`. Setter du `this.laast` direkte, fortsetter
  fiendene å slå mens eleven leser et spørsmål - og hun kan dø midt i en
  fagforklaring.
- **`bossVakt` nullstilles i `settLaast(false)`.** Gjør den ikke det, blir
  bossen udødelig for alltid hvis eleven trykker Esc på bossspørsmålet.
- **Fiender må rydde colliderne sine.** `spawnFiende` tar vare på dem i
  `fiende.collidere`, og `drepFiende` fjerner dem. Uten det lekker to per fiende,
  for alltid.
- **Ikke bak props inn i store renderTextures.** Det ble prøvd for å spare
  tegnekall og halverte bildefrekvensen: kartbrede, gjennomsiktige flater som
  overlapper hverandre koster mer i overtegning enn de sparer i tegnekall.
- **Kollisjonsbokser skal ut av visningslista.** `lagBoks` kaller
  `this.children.remove()`. 286 usynlige rektangler i lista tredoblet lengden på
  det som sorteres etter dybde hver frame.
- **Tilbakestøt trenger en egen tilstand.** Uten `tilstand: 'stotet'` overskriver
  AI-en farten allerede neste bilde, og treffet flytter fienden to piksler.

## Slik ser det ut

- **Overgangsfliser.** Hver flistype har fire kanter og fire hjørner
  (`forgeKanter`). Prioriteten i `FLIS_PRIORITET` bestemmer hvem som legger
  kanten sin oppå hvem. Sanden har et eget «skum»-sett som bare brukes der den
  møter vann.
- **Kontur og fargeramper.** `Painter.outline()` legger 1px kontur rundt alt.
  `ramp()` hue-shifter mot kaldt i skyggen og varmt i lyset i stedet for å gange
  fargen med et tall.
- **Animasjon.** Hver figur har alle 48 rammene sine i én tekstur: fire
  retninger × (2 idle, 4 gange, 3 slag, 3 rull). Se `heltFrame()`.
- **Atmosfære.** Tåkeslør driver over verden i to lag, bålet lyser og flakker, og
  himmeltonen + vignetten legges av React oppå lerretet (`Atmosfare`) - inne i
  scenen ville de blitt skalert av kamerazoomen.

## Legge til en ny sone

Sonene finnes allerede som data - `quest-bank.json` har spørsmål til alle
sammen. Å åpne en ny sone er byggearbeid, ikke innholdsarbeid:

1. Sett `spillbar: true` på sonen i `data/zones.ts`, og fyll ut hele `tema`.
   Alt terreng, tømmer, tak og løvverk leses derfra, så en ny sone får sitt eget
   utseende uten ny grafikk.
2. Lag `data/<sone>.ts` med NPC-er, landemerker og håndskrevne bossspørsmål,
   etter mønsteret i `nordvik.ts`. Husk `stikkord` på alt - det er dem som gjør
   at svarene finnes i verden.
3. Lag en kartgenerator etter mønsteret i `worldgen.ts`.
4. Registrer sonen i `WorldScene` og i `byggNordvikQuester`-tilsvarende funksjon
   i `engine/quests.ts`.

## Innhold som holdes utenfor

`EXCLUDED_LESSONS` i `scripts/generate-quest-bank.mjs` holder noen emner ute av
spillet - 22. juli, folkemord og krigen mot terror. Innholdet står uendret i
boka; det hører bare ikke hjemme i en ramme der du slår ned monstre og plukker
opp loot. Legg til flere id-er der ved behov.
