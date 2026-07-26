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
  nordvik.ts             Nordvik: NPC-er, landemerker og håndskrevne oppdrag
  steder.ts              STEDER-registeret. Ett sted = ett kart med alt som hører til
engine/
  boot.ts                Starter Phaser (dynamisk import), starter scenen på et stedId
  WorldScene.ts          Orkestrering: bygger stedet, kobler systemene, styrer reisen
  systems/
    spiller.ts           Eleven: figur, styring, slag, gard, alt som kan skje med henne
    fiender.ts           Fiende-AI, spawning, bossen og kunnskapsdysten
    verden.ts            Bakken, kollisjonen, objektene og atmosfæren
    interaksjon.ts       Hint, E-trykk, dialog-triggere, utropstegn
    prosjektiler.ts      Alt som flyr: piler, kastespyd, besvergelser
    effekter.ts          Partikler, flytende tall og glimt
    loot.ts              Sølv og gjenstander på bakken
    entiteter.ts         Delte typer for systemene
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
Refaktoreringen mot hub, epoker og flerspiller (R1-R8):
`docs/Design documents/rpg-hub-og-epoker-blueprint.md`. R1 og R2 er bygget.

## Verifisering

Seks skript driver spillet i en ekte nettleser. De krever at `npm run dev`
kjører, og leser scenen gjennom `window.__rpg` (og registeret gjennom
`window.__rpgSteder`), som `boot.ts` bare eksponerer i dev.

| Skript | Hva det dekker |
|---|---|
| `verify-rpg-kamp.mjs` | Pust, gard, kostnader, skjoldgang |
| `verify-rpg-drap.mjs` | At et drap gir XP, og at tiden går normalt etterpå |
| `verify-rpg-verden.mjs` | At bakken, tåka, kollisjonen og objektene finnes |
| `verify-rpg-samhandling.mjs` | Hint, E-trykk, dialog, landemerker, utropstegn |
| `verify-rpg-boss.mjs` | Kunnskapsdysten: riktig svar river skjold, galt gjør ikke |
| `verify-rpg-reise.mjs` | Stedskifte: bygges på nytt, og ingenting lekker |

To ting de har lært på den harde måten: et tastetrykk må **holdes** i over 100 ms
(Phasers `Key.onUp` nullstiller `_justDown`, så `page.keyboard.press()` blir
aldri sett), og fasit skal leses fra dataene, ikke gjettes - `QuizChallenge`
stokker alternativene per forsøk.

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
- **Animasjon.** Hver figur har alle 56 rammene sine i én tekstur: fire
  retninger × (2 idle, 4 gange, 3 slag, 3 rull, 2 gard). Se `heltFrame()`.
  Endrer du dette, må `KOLONNER`, `START`, `POSITUR_LENGDE` og positurlista i
  `forgeHumanoid` endres i samme åndedrag.
- **Pikselfonten** (`forgeTallfont`) har sifre, skilletegn og hele alfabetet med
  æ, ø og å. Den hadde bare `0123456789+-!XP ` en stund, og da rendret «Skjold!»
  som en nesten blank boble - alt annet falt tilbake på mellomrom. `glyfIndex()`
  løfter små bokstaver, så tekst kan skrives naturlig.
- **Kameraet dyttes, det ristes ikke.** `dytt(vinkel, piksler)` skyver
  `followOffset` langs treffvektoren og eases tilbake. Rystelse i alle retninger
  leser som støy; et dytt leser som kraft. `setScroll` virker ikke her - kameraet
  følger spilleren og overskriver det neste bilde.
- **Zoomen holdes på hele tall.** Blueprinten ba om 3.0 → 3.4 i kamp, men
  fraksjonell zoom gir ujevne piksler i en pikselartscene. I stedet strammes
  dødsonen (40×30 → 14×10) når noe jager eleven. Samme innsnevring, uten å ofre
  skarpheten. Kortvarige fraksjonelle zoom (et kick) er greit; varige er ikke.

## Gore, avslutninger og saktefilm

`engine/kampfx.ts` eier alt som gjør kampen deilig: kamerastøt, klaskesprett,
blod, løsdeler, lik, saktefilm og én avslutningsanimasjon per våpenart. Modulen
kjenner ingen spillregler - den tar bare imot «noe traff her, i denne retningen,
med denne vekten». Sprite-materialet (`losdel-<id>`, `lik-<id>`) smis av
`forgeEnemy`, i fiendens egen farge, så en ny fiende får sine egne rester uten at
noen tegner noe.

- **Avslutningene skiller på våpen.** Sverdet kutter på tvers, øksa slår ned i
  bakken, spydet skyver kroppen bakover før den siger, hammeren knuser til grus.
  Hver har sin egen lyd. Legger du til en våpenart, legg til en gren - `default`
  slenger bare kroppen av gårde.
- **Lemlestelse skjer én gang per fiende**, første gang den går under halvt liv
  (`fiende.lemlestet`). Den slåss videre uten biten. Det er ikke et nytt tall å
  følge, det er at eleven *ser* at motstanden er slitt ned.
- **Saktefilmen telles ned aller først i `update`**, før hver tidlige retur. Lå
  nedtellingen etter hitstop- eller lås-returen, kunne den henge igjen for alltid
  hvis eleven åpnet en dialog i drapsøyeblikket - og da går hele spillet i sirup
  uten at noen skjønner hvorfor. `KampFx.tikk()` skal alltid få **ekte** delta;
  bare spillogikken skaleres.

### To fallgruver som kostet tid

- **Phasers `flash` er ikke avmetting.** Den fyller skjermen med fargen på full
  alpha og fader ut, så en «mørk flash» for å ta fargen ut av bildet er i praksis
  et svart blink midt i drapet. Det ble prøvd, sett på et skjermbilde og fjernet.
  Ekte avmetting krever en egen pipeline. Hvitt blink er greit - hvitt leser som
  et høylys, mørkt leser som en glipp.
- **Skalerte firkanter leser ikke som blod.** Første forsøk brukte `fx-bit`
  (3×3 hvit rute) skalert opp til 1,9×1,2 - resultatet så ut som spredte murstein
  på plenen. Blod trenger små, ujevne former (`fx-flekk`, fire varianter) og en
  mørkere farge enn sprutet i luften. Konturen må også bort på småbiter, ellers
  leser løsdelene som fasetterte krystaller.
- **Atmosfære.** Tåkeslør driver over verden i to lag, bålet lyser og flakker, og
  himmeltonen + vignetten legges av React oppå lerretet (`Atmosfare`) - inne i
  scenen ville de blitt skalert av kamerazoomen.

## Legge til et nytt sted

Et sted er ett kart. Scenen kjenner ingen steder ved navn - den bygger det den
får inn i `init()`, så et nytt sted er en oppføring i registeret, ikke en endring
i motoren:

1. Lag `data/<sted>.ts` med NPC-er, landemerker og håndskrevne oppdrag, etter
   mønsteret i `nordvik.ts`. Husk `stikkord` på alt - det er dem som gjør at
   svarene finnes i verden.
2. Lag en kartgenerator etter mønsteret i `worldgen.ts`.
3. Fyll ut hele `tema` (i dag hentet fra `data/zones.ts`). Alt terreng, tømmer,
   tak og løvverk leses derfra, så stedet får sitt eget utseende uten ny grafikk.
4. Legg stedet inn i `STEDER` i `data/steder.ts`. Det er hele registreringen:
   tema, kartbygger, spawnpunkt, folk, landemerker, boss og musikk.

NPC- og landemerke-id-er må være unike på tvers av steder - grensesnittet slår
dem opp med `finnNpc`/`finnLandemerke` uten å vite hvor eleven står.

### Reise mellom steder

`WorldScene.bestillReise(stedId)` ber om å komme et annet sted. React bygger
questene for det nye stedet og svarer med `utforReise`, som toner ut og bygger
scenen på nytt. Kjør `node scripts/verify-rpg-reise.mjs` etter endringer i
oppbyggingen: Phaser rydder scenen, men ikke det som ligger utenfor den, og
skriptet måler nettopp det.

## Innhold som holdes utenfor

`EXCLUDED_LESSONS` i `scripts/generate-quest-bank.mjs` holder noen emner ute av
spillet - 22. juli, folkemord og krigen mot terror. Innholdet står uendret i
boka; det hører bare ikke hjemme i en ramme der du slår ned monstre og plukker
opp loot. Legg til flere id-er der ved behov.
