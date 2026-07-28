# Minnevokteren (`/oving/rpg`)

Et rollespill i sanntid der eleven spiller seg gjennom fagstoffet.

**Hallen** er rammen: en tidslinje eleven går på, delt med klassen, med en
portal per epoke. **Vikingtiden** er den ene ferdige epoken, og der spiller hun
historien rett - ingen metafor.

**Kapittel 1 er 793.** Hun lærer skjoldet av Ravn, legger bordene i skroget
selv, holder breddegraden vestover, og går i land på Lindisfarne. Etterpå
sitter hun ved kildebordet og leter etter en norrøn beretning om det hun
nettopp gjorde, og finner feltet tomt.

**Kapittel 2 er 872.** Hun er Åsa, datteren hans, husfrue på samme gård med
nøklene i beltet. Mennene er ved Hafrsfjord. Hun sår åkeren, avgjør hvem av
tre som får korn av henne, møter dem som kommer for å ta gården, fører en
drapssak på tinget - og ser om det er nok til vinteren.

Dette er et eget spor, adskilt fra 3D-mini-spillmotoren i `src/games/engine/`
og fra mikrospillene i `src/components/microgames/`.

## Kort om valgene

| Valg                               | Hvorfor                                                                                                                                                                          |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Phaser 3** (lazy-lastet)         | Sanntids-kamp trenger tilemap, kamera-effekter, tweens og partikler. Phaser gir det ferdig. Ligger i egen bunt (~340 kB gzip) som bare lastes på denne ruta.                     |
| **All grafikk tegnes prosedyralt** | Ingen bildefiler. Figurer bygges lagvis som en påkledningsdukke (`engine/spriteforge.ts`), så karakterskaping og synlig rustning koster ingenting i grafikkarbeid.               |
| **All lyd syntetiseres**           | `engine/audio.ts` lager kamplyder og en generativ slått med Web Audio. Ingen lydfiler.                                                                                           |
| **Spørsmål hentes fra boka**       | `scripts/generate-quest-bank.mjs` skanner alle Quiz-komponenter i `public/content/` og skriver `public/data/rpg/quest-bank.json`. Nytt fagstoff dukker automatisk opp i spillet. |
| **Fagstoffet ligger i reglene**    | Kapittelet lærer ikke bort ved å fortelle. Eleven kan `[Klinkbygging]` fordi hun bygget et skrog som fløt, og `[Breddegradseiling]` fordi hun holdt høyden vestover. Hvis hun kan vinne uten å ha forstått det, lærer ikke spillet det bort. |

## Filer

```
RpgPage.tsx              Ruta: Phaser-lerret + React-grensesnitt + broen mellom dem
types.ts                 Alle domenetyper
data/
  classes.ts             Tre klasser, nivåkurve, utseendevalg
  items.ts               Våpen, rustning, amuletter, priser
  enemies.ts             Fiendearketyper + bossen
  epoker.ts              De 11 epokene, én ferdig. Årstall, palett, regelsett, bank-sone.
  kapitler.ts            De fem kapitlene i vikingtiden. Steg, roller, flagg.
  aetter.ts              Ættene rundt Nordvik, og hva et menneske koster i bot
  aaret.ts               Kapittel 2: forrådet, avlingen, valgene og vinterregnskapet
  ting.ts                Vitnene og lovhjemlene på tinget
  begreper.ts            Minnetreet: det eleven kan fordi hun har gjort det
  kilder.ts              Kildene på bordet i mellomspillene. Ekte, med henvisning.
  mellomspill.ts         Bordet mellom to kapitler: kort, veiinger, det tomme feltet
  klipp/kapittel1.ts     Cutscenene: sjøsettingen og stranda
  lindisfarne.ts         Klosteret: landemerkene, og valgene hun tar der
  hub.ts                 Minnevokterens hall: portaler, landemerker, benker, palett
  folelser.ts            De åtte ikonene elevene kan sende hverandre
  regelsett/viking.ts    Verb-kontrakten for vikingtiden: pust, skjold, rull
  vaapen.ts              Skjold, angrepsform per våpenart og kostnadene i kampen
  nordvik.ts             Nordvik i 793: NPC-er, landemerker og håndskrevne oppdrag
  nordvik872.ts          Nordvik i 872: de som ble igjen, haugen og bua
  steder.ts              STEDER-registeret. Ett sted = ett kart med alt som hører til
engine/
  boot.ts                Starter Phaser (dynamisk import), starter scenen på et stedId
  WorldScene.ts          Orkestrering: bygger stedet, kobler systemene, styrer reisen
  systems/
    spiller.ts           Eleven: figur, styring, slag, gard, alt som kan skje med henne
    fiender.ts           Fiende-AI, spawning, bossen og kunnskapsdysten
    verden.ts            Bakken, kollisjonen, objektene og atmosfæren
    interaksjon.ts       Hint, E-trykk, dialog-triggere, utropstegn
    prosjektiler.ts      Alt som flyr: piler og kastespyd
    effekter.ts          Partikler, flytende tall og glimt
    loot.ts              Sølv og gjenstander på bakken
    gjester.ts           De andre elevene: figur, navn, følelse, glidning
    entiteter.ts         Delte typer for systemene
  klipp.ts               Cutscene-avspilleren
  opplaering.ts          Fire økter på tunet, mot Ravn
  klokke.ts              Årshjulet: fire årstider, og dagene en handling koster
  aere.ts                Ære, ætt-ære, priser - og om naboætta stiller opp
  gaarden.ts             Året i 872: årstidsskiftene, bua og oppgjøret
  angrepet.ts            Båten i vika: kampen, og kampen som ikke skjer
  ting.ts                Sakens fire trinn: frist, vitner, hjemmel, dom
  raidet.ts              Lindisfarne, i to halvdeler
  lindisfarnegen.ts      Bygger klosterøya
  farkost.ts             Båter: besittelse, styring og egen kollisjonsmaske
  portal.ts              Portalene: lys, skilt, hint og reisen mellom steder
  samvaer.ts             Benkene ved bålet, og følelsen over eget hode
  worldgen.ts            Bygger Nordvik-kartet
  hubgen.ts              Bygger hallen: tidslinjeveien, lunden og skogen
  spriteforge.ts         Figurer, fiender, våpen, effekter, pikselfont
  tileforge.ts           Terrengfliser, overgangsfliser og verdensobjekter
  pixels.ts              Tegneverktøy, fargeramper, kontur, seedet tilfeldighet
  audio.ts               Web Audio-syntese
  quests.ts              Setter sammen quester + finner hvor svaret står i verden
  bridge.ts              Hendelser mellom scene og React
  enhet.ts               Har enheten berøringsskjerm?
net/
  hubRom.ts              Transporten: rom, tilstedeværelse, posisjon over RTDB
  useHubRom.ts           Det eneste som kjenner både broen og nettet
  navnevakt.ts           Hvilke navn et klasserom skal slippe å lese
store/useRpgStore.ts     All spillertilstand, lagringsformatet + kobling til «Min læring»
components/              Karakterskaper, HUD, hall-HUD, dialog, kunnskapsutfordring,
                         sekk, logg, butikk, skjermkontroll, atmosfære-overlegg,
                         klippscene (bjelker og replikk), skroget, navigasjonen,
                         mellomspillet (bordet med kildene), minnetreet,
                         opptakten, bua (Forradet) og tinget (Tingsak)
```

## Slik henger læring og spill sammen

-   **Quest = spørsmål.** Hver quest har en `kilde`: den personen eller den steinen
    som faktisk har svaret. `finnKilde()` i `engine/quests.ts` slår den opp ved å
    matche stikkord mot spørsmålet og fasiten, og hintet peker dit. Alle 17
    bankspørsmålene i Nordvik har en kilde i verden.

    > Dette er lett å ødelegge. Legger du til spørsmål i en sone uten å legge til
    > tilsvarende `kunnskap`/`stikkord` i sonens data, faller de tilbake på et
    > ærlig, men kjedeligere hint («svaret står i artikkelen»). Sjekk at antallet
    > uten kilde er null når du utvider en sone.

-   **Kunnskapen ligger bak et klikk.** «Spør X ut» i dialogen er sammenrullet, så
    fasiten ikke står oppslått rett over svarknappen.
-   **Galt svar koster.** Første bom avslører ikke fasiten - bare hvor svaret står.
    Andre bom lukker oppdraget uten belønning, men gir forklaringen. Alternativene
    stokkes på nytt for hvert forsøk.
-   **Bossen er beskyttet.** Den store Glemselen tar ingen skade før eleven svarer
    riktig. Hvert riktige svar river ned ett skjold. Galt svar koster liv som går
    forbi usårbarheten.
-   **«Min læring» teller forståelse, aldri drap.** Spillet har sitt eget
    XP-tall til nivå og utstyr, og det er ikke det samme tallet. `recordActivity`
    kalles fra fem steder og ingen av dem er en kamp: et begrep løftet til
    «forstått», et puzzle løst, en tingsak ført til dom, et mellomspill, et
    kapittel. Kobles den til drap, blir «Min læring» et mål på hvor mange eleven
    har drept - og det er ikke tallet vi vil vise en lærer.

## Styring

| Tast                           | Handling                                    |
| ------------------------------ | ------------------------------------------- |
| WASD / piltaster               | Gå                                          |
| Mellomrom                      | Slå (kombo 1-2-3)                           |
| **Shift holdt, i ro**          | Reis garden                                 |
| **Shift trykket, i bevegelse** | Rull (kort usårbarhet)                      |
| **Retning under gard**         | Vend garden, skjoldgang i 45 % fart         |
| **Shift + mellomrom**          | Våpenets manøver (hak / stikk / skjoldstøt) |
| E                              | Snakk / les / åpne / gå om bord / sett deg  |
| I / L / M / Esc                | Sekk / oppdrag / minnetre / meny            |

Shift betyr to ting, og det er ikke tvetydig: rullen har alltid krevd bevegelse
(`utslag > 0.001` i `oppdaterSpiller`), så «Shift i ro» kan bare være garden.
Holder eleven Shift gjennom en rull, reiser garden seg i det rullen slutter.

Håndkontroll støttes (venstre stikke går, A slår, B ruller, **RB holdt** er gard,
RB+A er manøver, Y samhandler). På berøringsskjerm
vises `Skjermkontroll` med analog styrestikke og knapper - uten den er spillet
uspillbart på nettbrett. Der er garden en **veksling**, ikke et hold: tommelen kan
ikke holde skjoldet og slå samtidig.

## Epoke, sted og regelsett

Tre nivåer, klart adskilt - skillet ligger i typene, ikke i hodet til den som
koder:

| Begrep        | Hva det er                                                            | Fil                       |
| ------------- | --------------------------------------------------------------------- | ------------------------- |
| **Sted**      | Ett kart, med tema, folk, landemerker og spawnpunkt                   | `data/steder.ts`          |
| **Epoke**     | Innholdsmodul: eget regelsett, egne steder, egen sone i spørsmålsbanken | `data/epoker.ts`          |
| **Regelsett** | Verb-kontrakten: hva ressursen er, hva vernet er, hvordan hun beveger seg | `data/regelsett/viking.ts` |

Nordvik er et *sted* i epoken «vikingtiden». Lindisfarne blir et annet sted i
samme epoke, og arver da både regelsettet og fagstoffet gratis.

Hubben er det ene stedet med `epokeId: null`. Den ligger utenfor alle epoker,
og det er ikke en mangel - se «Minnevokterens hall» under.

## Minnevokterens hall

Der eleven begynner, og der hun kommer hjem. Hallen er en **tidslinje du går
på**: én vei fra vest til øst, og portalene ligger langs den i kronologisk
rekkefølge. Går hun østover, går hun framover i år.

Avstanden mellom portalene er **kvadratrota** av hvor lenge siden det er - ikke
årene selv, og ikke logaritmen. Rå proporsjon presser fire epoker oppå hverandre
i den ene enden; log ble prøvd, målt og forkastet, for mennesker velger epoker
omtrent log-jevnt og da blir avstandene *like*. Veien ble en liste, og nettopp
den forskjellen den skulle lære bort forsvant. Kvadratrota lar steget fra
steinalderen til antikken være fem ganger så langt som steget fra
industrialiseringen til krigen.

Fire epoker har `aar: null` - språk, tro, samfunn og musikk er ikke tider. De
står i lunden sør for veien. Det er en påstand om at ikke alt hører hjemme på en
akse, og den er verdt å vise.

| Fil | Hva |
| --- | --- |
| `data/hub.ts` | Portalplassering, landemerker, palett. Regner ut hvor hver epoke havner. |
| `engine/hubgen.ts` | Kartet: veien, sidestien, lunden, skogen |
| `engine/portal.ts` | Portalene: lys, skilt, hint, E, og reisen |

Noen valg som er lette å tråkke feil i senere:

-   **Hallen bytter ikke epoke.** `ankomSted(stedId, null)` lar `epokeId` stå.
    Uten det ville et skritt inn i hallen lagt vikingtiden bort og åpnet en tom
    «hub-epoke», og eleven ville sett nivået sitt falle til 1 i HUD-en.
-   **Regelsettet er vikingtidens**, gjennom fallbacken i `regelsettFor`. Et eget
    «fredelig» sett for et sted uten fiender ville vært regelsett nummer to,
    skrevet for å slippe å vise en pust-stolpe. Blueprintens §5 sier nei til det.
-   **Én dør inn er ingen dør ut.** Nordvik har en port hjem
    (`NORDVIK_PORTAL`), og `worldgen` rydder plass til den - ellers kan et tre
    stå midt i porten.
-   **Eleven kommer ut av den døra hun gikk inn i.** `WorldScene.ankomstRute()`
    finner porten som peker tilbake dit hun kom fra. Uten det lander hun ved
    bålet i vest hver gang hun kommer hjem, og må gå hele veien østover på nytt.
-   **Portalene kjenner ikke epokene sine.** Tittel, årstall, farge og om den er
    åpen slås opp i `EPOKER`. En ny epoke blir synlig i hallen uten at noen
    skriver den inn to steder.

### Spor

Hallen bærer merker etter den som var der før (blueprint §3.4): en liten stein
ved portalen for hver gang eleven har gått inn i epoken, og en stein på varden
for hver gang hun har kommet hjem. Begge ligger i `hub`-noden i lagringen.

Sporene er hennes egne, også nå som rommet er delt. Det er et valg: en varde
som vokser av alle sammen ville vært en teller for hele skolen, og en teller
sier ingenting om hvor ofte *du* har vært her. Formen tåler begge deler - et
tall per portal og en haug ved varden - så det som eventuelt endrer seg er hvor
tallet kommer fra.

## Hallen er delt

Regelen som styrer hele nettlaget står i én linje:

> **Hubben er sammen. Epokene er alene.**

Det er ikke en nedskalering, det er riktig design. De stille øyeblikkene inne i
en epoke - kildekritikken, valget eleven må ta alene - kollapser med en
klassekamerat som spretter rundt i bildet. Og konsekvensen for arkitekturen er
enorm: **ingen epoke trenger noen gang nettverkskode.**

Regelen håndheves ett sted, og det er med vilje ikke i nettlaget:
`Sted.flerspiller` er sant for hallen og udefinert for alt annet, og
`useHubRom` kobler til på nettopp det flagget. Da kan ingen slå på flerspiller
for en epoke ved å endre en if-setning inne i transporten - det må gjøres i
`steder.ts`, ved siden av alt annet som sier hva stedet er.

| Fil | Hva |
| --- | --- |
| `net/hubRom.ts` | Rom, tilstedeværelse, posisjon over RTDB. Kjenner ikke Phaser. |
| `net/useHubRom.ts` | Det eneste som kjenner både broen og nettet |
| `net/navnevakt.ts` | Hvilke navn et klasserom skal slippe å lese |
| `engine/systems/gjester.ts` | Tegner de andre. Kjenner ikke Firebase. |
| `engine/samvaer.ts` | Benkene ved bålet, og følelsen over eget hode |
| `components/HubHud.tsx` | Hvem er inne, hva kan jeg si, hvordan skjuler jeg noen |

**Slik henger det sammen.** Scenen melder hvor eleven står over broen
(`minStilling`, ti ganger i sekundet) uten å vite at det finnes et nett.
`useHubRom` tar det videre. De andre kommer inn fra Firebase og sendes samme
vei tilbake (`gjester`). Ingen av de to sidene vet om den andre.

Ting som er lette å ødelegge her:

-   **Gjestene skal aldri bli React-tilstand.** Ti meldinger i sekundet ganger
    seksten elever er hundre og seksti oppdateringer i sekundet. Ble hver av
    dem en `setState`, ville hele grensesnittet tegnes på nytt like ofte. Bare
    *navnelista* er tilstand, og den friskes opp én gang i sekundet.
-   **`onDisconnect()` settes før første skriving.** Snus rekkefølgen, og eleven
    mister nettet i mellomrommet, blir hun stående som et spøkelse i rommet for
    alltid.
-   **Vi tegner 120 ms bakpå, og glidningen ebber ut.** Rå posisjoner ti ganger
    i sekundet gir figurer som teleporterer. Gjettingen videre finnes for å
    dekke *én* tapt melding - den skal ikke dekke at noen har sluttet å sende.
    Derfor er den full etter 200 ms, borte etter 400, og da står figuren
    nøyaktig på siste kjente sted. Uten uttoningen blir en elev som fryser
    stående et stykke fra der hun faktisk er, i tolv sekunder.
-   **Taket på seksten i rommet er en tegnegrense, ikke en nettgrense.** Uten
    det får du seksti figurer med navneskilt på en Chromebook og en
    bildefrekvens på ti.
-   **Rommet velges ved å lese hele treet én gang.** Alternativet - en teller
    ved siden av - kan ikke holdes i takt, for `onDisconnect()` kan sette en
    verdi men ikke trekke fra en.
-   **Innholdet vinner over møbelet.** `Interaksjon.sjekk()` returnerer om den
    har et mål, og benken spør sist. Sto benken først, stjal den E-tasten fra
    varden tre ruter unna. Ett unntak: sitter hun allerede, eier benken
    trykket, ellers åpner E skiltet ved siden av og hun blir sittende.

### Trygghet

Rommene er åpne og elevene har ingen konto. Det gir tre krav, og alle tre er
bygget:

-   **Ingen fritekst-chat.** Åtte faste ikoner (`data/folelser.ts`), og
    `trygtIkon()` prøver også det som kommer *inn* - reglene i basen kan bare
    måle lengden på en tekst, ikke skille et ikon fra et annet.
-   **Navnevakt.** Bokstaver, mellomrom og bindestrek, 2-16 tegn, pluss en
    blokkliste. Tegnsettet er det viktigste av de tre: uten sifre og skilletegn
    finnes det ingen URL, ingen «snap: …» og ingen tallspam å skrive. Den
    kjøres både på det eleven skriver og på det som kommer inn fra nettet - en
    klient som går utenom grensesnittet skal ikke kunne vise noe hallen ikke
    ville godtatt.
-   **Skjul-knappen.** Ett trykk, lokalt, uten å be om lov. Det finnes ingen å
    klage til, så hun må kunne fjerne noen fra sitt eget bilde selv.

> **Reglene i `database.rules.json` er det som faktisk gjelder.** Klientside
> alene er et forslag. Endres tegnsettet i `navnevakt.ts`, må regelen under
> `rpg-hub` endres i samme åndedrag - ellers får eleven et navn godkjent på
> skjermen som tjeneren nekter, og hun blir stående usynlig uten at noe sier
> hvorfor.

### Å sitte er ikke en positur

Figuren settes ned på benken i idle-ramma, nøyaktig som hun står stille om bord
i færingen - `settOmBord(true)` med fast posisjon og retning. En `sitte`-positur
ville tvunget `KOLONNER`, `START`, `POSITUR_LENGDE` og hele positurlista i
`forgeHumanoid` til å endres i samme åndedrag, for tre rammer ingen har tegnet.

Til gjengjeld måtte benken bli tretti piksler bred: en seksten piksler bred
stokk under en atten piksler bred figur er helt borte i det noen setter seg på
den.

### Verb-kontrakten

Fella er å generalisere `Vaapen` til noe som dekker alt fra øks til Mauser. Vi
generaliserer de tre verbene i stedet:

| Verb                | 793           | 1916               | Til hest           |
| ------------------- | ------------- | ------------------ | ------------------ |
| Innsats (mellomrom) | hugg          | skyt / lad         | ri ned             |
| Vern (shift)        | reis skjoldet | kast deg i dekning | trekk i tøylene    |
| Ressurs             | pust          | nerve              | hestens krefter    |

Derfor står ordene «pust» og «skjold» ikke i noen signatur i `engine/kamp.ts`
eller `engine/systems/spiller.ts` lenger. De er vikingtidens ord, og de kommer
inn med `Regelsett`. Å dukke i det granaten kommer er nøyaktig samme ferdighet
som å reise skjoldet i det øksa kommer - den kontinuiteten får vi gratis så
lenge kontrakten holdes.

**Vikingtiden er eneste implementasjon, og det skal den være.** Poenget er ikke
å ha to regelsett, det er at signaturene tåler det andre når det kommer.

Arbeidsdelingen mellom de to tall-filene:

-   `data/regelsett/viking.ts` eier **formen** på epoken: hva ressursen heter og
    hvor fort den kommer tilbake, hva vernet er og hvor mye det dekker, hvor
    fort eleven går og om hun kan rulle. Byttes når epoken byttes.
-   `data/vaapen.ts` eier **hva hver handling koster** og hvor tungt et treff
    kjennes: kombofaktorer, blokkpris, hitstop, slitenhet. Byttes ikke.

Ordene HUD-en skriver kommer også fra regelsettet (`ressurs.navn`, `vern.navn`,
`vern.brutt`). Merk at `ressurs.navn` er «Pust» og at
`scripts/verify-rpg-kamp.mjs` finner stolpen på nettopp det ordet
(`[aria-label="Pust"]`). Endres det, må skriptene endres i samme åndedrag.

## Farkoster

Færingen ligger fortøyd ved bryggeenden i Nordvik. Eleven går ut på plankene,
trykker E, og ror. Modellen er minimal med vilje: besittelse og styring, ingen
fysikk.

-   **Figuren står stille om bord, og det er farkosten som beveger seg.**
    Alternativet er en `ritt`-positur, og den ville tvunget `KOLONNER`, `START`,
    `POSITUR_LENGDE` og hele positurlista i `forgeHumanoid` til å endres i samme
    åndedrag - for tre rammer ingen har tegnet. Hesten får sin positur den dagen
    hesten kommer.
-   **Farkosten har sin egen kollisjonsmaske.** `kart.farbart`, ikke
    `kart.blokkert`. De to er nesten motsatte, men ikke helt: brygga er gåbar
    *og* usjøbar, for et fartøy seiler ikke under en brygge. Alt som gjør en
    rute om til noe annet enn vann må rydde begge maskene - fjellbeltet gjorde
    det ikke, og da rodde båten tvers gjennom berget.
-   **Skroget prøves i midten og ved baugen, aldri ved hekken.** Hekken ligger
    der båten allerede er, og den er per definisjon lovlig. Tas den med, kan en
    båt som ligger inntil ei brygge aldri legge fra, fordi dens egen hekk står
    over plankene.
-   **Spillerens kropp slås av mens hun seiler** (`body.enable = false`).
    Kollisjonen hennes er bygget for å holde henne unna vann, og båten skal
    nettopp dit.
-   **Landgang settes av farkosten, ikke av spilleren.** Den leter opp nærmeste
    rute innenfor to ruter som eleven kan stå på, og nekter hvis det ikke finnes
    noen. Uten den sperren kunne hun gå i land midt i fjorden og bli stående på
    vannet - en tilstand ingenting i spillet vet hvordan den kommer seg ut av.
-   **Farkost-laget har førsterett på E og hintlinja.** Står eleven på brygga med
    både en båt og en nabo innen rekkevidde, skal ett trykk gjøre én ting. Derfor
    tar `Interaksjon.sjekk()` et `aktiv`-flagg og hviler mens båten eier bildet.

Fjorden i Nordvik er fire-fem ruter bred. Derfor er farkosten en færing på 30
piksler og ikke langskipet på 66: et fartøy som er lengre enn farvannet er bredt,
kan ikke snu. Knarren som skal bære eleven til Lindisfarne hører til kapittel 1.

## Kampsystemet

Kampen bygger på vernet, ikke sverdet. All logikk ligger i `engine/kamp.ts`
(ren tilstand, ingen Phaser), formen i regelsettet, kostnadene i
`data/vaapen.ts`, og `Spiller` gjør bare inndata, treffgeometri og effekter.
Kjerneregelen:

> Står du bak et reist skjold når slaget kommer, blokkerer du.
> Reiser du skjoldet i det slaget kommer, parerer du.

Derfor måles paradevinduet fra rammen garden reiser seg (`sidenReist`), ikke fra
tastetrykket. Blokk koster pust og hakker skjoldet; parade koster ingenting og
kaster angriperen ut av balanse. Det gjør det å gjemme seg bak skjoldet til den
dårlige strategien uten at vi trenger å straffe den.

-   **Pust** er utholdenhet: slag, blokk, rull og manøver koster, garden drenerer
    6 i sekundet, og gjenvinningen starter 700 ms etter siste handling. Tom pust tar
    aldri en handling fra eleven - den svekker den (trege slag, stavring i stedet
    for rull, og garden faller).
-   **Skjoldet** er en forbruksvare med synlig slitasje: fire rammer i en egen
    tekstur (`forgeSkjold`), ett hakk per blokk, brudd på null. Slitasjen er en
    teller eleven kan se, aldri en terning - er den tilfeldig, føles bruddet urettferdig.
    Slitasjen er et flagg på epoken (`vern.slitasje`): en skyttergrav slites ikke
    av å bli skutt på.
-   **Dekningen er retningsbestemt.** 120 grader rundt blikkretningen. Angrep fra
    siden og bakfra går rett gjennom, og det er derfor rekka finnes. Sektoren hører
    til epoken (`vern.dekning`), ikke til den enkelte gjenstanden - alle rundskjold
    dekket like mye.
-   **Garden kan ikke hamres.** `vern.hvile` holder skjoldet nede i 260 ms etter
    at det er senket, så eleven ikke kan ligge i et evig paradevindu.

Kamptilstanden sendes til HUD-en over broen (`fraSpill.emit('kamp', …)`) elleve
ganger i sekundet, ikke 60 - en store-skriving per bilde ville tegnet HUD-en på
nytt like ofte. Pust- og livsstolpene har `aria-valuenow`, som er det
`scripts/verify-rpg-kamp.mjs` leser når den driver kampen i en ekte nettleser.

Blueprinten for hele kampanjen: `docs/Design documents/minnevokteren-nordvik-blueprint.md`.
Refaktoreringen mot hub, epoker og flerspiller (R1-R8):
`docs/Design documents/rpg-hub-og-epoker-blueprint.md`. R1-R8 er bygget, og
refaktoreringen er dermed ferdig. Neste er kapittel 1, etter Nordvik-blueprintens
etappe 2.

## Kapittel 1: 793

Vikingtiden spilles som en kampanje over fem kapitler på samme gård
(`docs/Design documents/minnevokteren-nordvik-blueprint.md`). Kapittel 1 er
bygget; de fire andre står i `data/kapitler.ts` med rolle og år, og uten steg -
et steg ingen har bygget er et løfte vi ikke kan holde.

Framdriften er en **liste med steg-id-er** i kampanjetilstanden, ikke et tall.
Et tall kan bare gå én vei og sier ingenting om hva eleven gjorde; en liste
tåler at hun tar skroget før hun har trent med Ravn, og at vi legger inn et steg
midt i uten at hvert lagrede spill i et klasserom hopper et hakk.

| Steg | Hva | Hvor |
| --- | --- | --- |
| `k1-ravn` | Fire økter: slag, blokk, parade, alvor | `engine/opplaering.ts` |
| `k1-skroget` | Legg bordene. Feil skrog synker synlig. | `components/Skroget.tsx` |
| `k1-sjosettingen` | Skipet på vannet. Orm sier ingenting. | `data/klipp/kapittel1.ts` |
| `k1-navigasjonen` | Hold breddegraden vestover, uten kompass | `components/Navigasjonen.tsx` |
| `k1-stranda` | Klosteret ligger der. Det har ingen mur. | `data/klipp/kapittel1.ts` |
| `k1-motstanden` | Øyas menn. Kampklimakset. | `engine/raidet.ts` |
| `k1-byttet` | Det som er igjen. Valgene. | `data/lindisfarne.ts` |
| `k1-hjem` | Orm spør hva du tok med | `data/nordvik.ts` |

Og så, i det kapittelet er over: **Mellomspill I**.

Ting som er lette å ødelegge her:

-   **Ravn og raidet er de eneste som setter ut fiender selv.** Alt annet går
    gjennom `Sted.spawner`, og den er tom både i hallen og på Lindisfarne.
    Uten den lista ville hver ny motstander i `data/enemies.ts` begynt å vandre
    rundt på hvert eneste kart - også på gårdstunet hjemme.
-   **Kapittelhandlinger er ikke oppdrag.** Et oppdrag er et spørsmål med et
    svar i verden, og det bygges av questmotoren fra spørsmålsbanken. En
    handling (`NpcDef.handlinger`) er et sted i kapittelet: Ravn som reiser seg
    fra stubben, Orm som rekker deg et bord. Scenen eier hva som skjer, dataene
    sier bare hva knappen heter.
-   **Cutscenene rydder i `finally`.** Bjelker, kamerafølge og tåketetthet
    henger igjen for alltid hvis eleven hopper over midt i.
-   **Kameraets ease heter `Sine.easeInOut`.** `Sine.InOut` finnes i
    `Phaser.Math.Easing`, men ikke i `EaseMap`, og slår ut som «this.ease is not
    a function» *inne i* kameraets oppdatering. Da stopper scenen, klippets
    nedtelling fyrer aldri, og cutscenen blir hengende med låsen på.
-   **Et sted uten NPC-er har ingen oppdrag.** `byggQuester` returnerer tom
    liste. Uten den vakten reduserte giver-valget over en tom liste, og hele
    reisen til Lindisfarne stoppet med en feil som pekte på questmotoren.

### De to halvdelene på Lindisfarne

Første halvdel er kapittelets kampklimaks, og den skal være deilig. Andre
halvdel er de som ikke kan slåss. **Ingenting endrer regler:** angrepet virker
likt, blodet ser likt ut. Spillet slutter bare å juble - ingen skadetall, ingen
XP, ingen loot, ingen fanfare, og musikken faller til én tone (`startEnTone`).

Hele forskjellen er ett flagg, `Fiende.stille`. Det er med vilje: en
regelendring ville gjort det til en straff eleven kan lese seg til, og da blir
det en preken. Kontrasten bærer, og fordi spillet ikke sier noe, sier det ikke
for mye.

## Kapittel 2: 872

Samme gård, 79 år senere. Åsa Torsteinsdotter er husfrue og hauld, mennene er
sør ved Hafrsfjord, og nøklene til bua henger i beltet hennes. Kapittelet har
nesten ingen kamp - motoren er årshjulet, forrådet og hvem hun står i gjeld til.

| Årstid | Hva som avgjøres | Hvor det ligger |
| --- | --- | --- |
| **Vår** | Hvor mye såkorn i jorda, og om det skjer før våronna er omme | `Gaarden.velg('saaingen')` |
| **Sommer** | Hvem hun mater: Harald, motstanderne hans, eller naboætta | `Gaarden.gave()` |
| **Høst** | Innhøstingen, slakten - og båten som kommer inn vika | `Gaarden.inngang('host')`, `Angrepet` |
| **Vinter** | Om det holdt, og så bordet med kildene | `Gaarden.gjorOppVinteren()`, `WorldScene.bordetEtterKapittelet()` |

**Ingenting er tilfeldig.** Avlingen henger på når hun sådde og hvor mye hun
turte å legge i jorda: tidlig gir tre ganger igjen, sent gir halvannen. Går det
galt, skal eleven kunne peke på valget som gjorde det - ikke på en terning.
Regnestykket for vinteren står framme i bua hele året, og det er *samme
funksjon* som gjør opp til slutt (`vinterregnskap`). To regnestykker for det
samme er den sikreste måten å gjøre et spill urettferdig på.

**Det harde valget er ikke kornet, det er hvem hun gir det til.** Kornet finnes
bare én gang, og ett svar lukker spørsmålet. Gaven til naboætta ser ut som
sløsing i juni, og er forsikring i oktober og i februar:

-   **Om høsten** kommer Gaute Gråkappe for å ta gården. Har hun ære nok *og*
    Sæbø-ætta noe å takke for, stiller de seg foran tunet, og han snur.
    Kampen som ikke skjer, skal være det eleven skryter av - derfor krever den
    to handlinger, ikke én (`stillerOpp` i `engine/aere.ts`).
-   **Om vinteren** kommer Vigdis over isen med mer korn enn hun fikk, hvis det
    knep. Det er gjengaven, og den er hele ættesamfunnet i én vinter.

**Trellen.** Kåre kan få et spyd før angrepet. Da binder han den ene, og hun
står mot to. Og på tinget etterpå står navnet hans i vitnelista - grått, fordi
en ufri mann ikke kan bære vitnemål, uansett hva han så. Lista underviser ved
å nekte.

**Tinget** har fire trinn, og de er hele saken: lys drapet innen ett døgn
(ellers er det mord), skaff vitner (de kan ikke kjøpes), anfør riktig hjemmel
(feil hjemmel taper saken selv om hun har rett i sak), og hør dommen. Fristen
varsles ikke av spillet - den står på steinen ved tingbålet, og Torgeir sier
den. Bot går fra bingen og gjør vinteren smalere; fredløshet er en tilstand, og
ikke game over.

Ting som er lette å ødelegge her:

-   **Bua avgjør ingenting.** `Forradet.tsx` viser og melder; `Gaarden` eier
    hva et valg koster. Samme regel som for kildebordet.
-   **Årstidsskiftene ligger samlet i `Gaarden.inngang()`.** Spres de utover,
    får man to steder som begge tror de høster den samme åkeren.
-   **`Angrepet.gjenopprett()` leser fasen ut av lagringen.** Uten den
    forsvinner fem menn i vika i det eleven tar en tur innom hallen: scenen
    bygges på nytt, og et felt i minnet er ikke sant.
-   **Året kan ikke skyves forbi en uavklart båt eller en uført sak.**
    `Gaarden.bua()` tar bort «La året gå videre» - ellers finnes det en vei
    rundt kapittelets eneste kamp, og en vei til å la et drap bli ulyst for godt.

## Mellomspillet: bordet med kildene

Mellom to kapitler forlater eleven året hun spilte og ser tilbake på det hun
nettopp gjorde. Formen er et bord med kilder på: hun legger dem ut, leser dem og
veier dem. Ingen kamp, ingen tidspress, ingen poeng for å svare fort.

Mellomspill I kommer etter 793, og det er **hele grunnen til at eleven utfører
raidet selv**. Hun leser Alkuins brev og den angelsaksiske krøniken, og så er
det ett felt igjen på bordet. Hun får ikke opplyst at det ikke finnes noen
norrøn kilde om Lindisfarne - hun får en knapp som sier «se etter en norrøn
kilde», og feltet blir stående tomt mens hun ser på det.

Brente hun skriptoriet, står det en linje til.

Mellomspill II kommer etter 872, og heter **«Én kilde er ikke to»**. Der bordet
i 793 viste et hull, viser dette to kilder som ser ut som to og er én: Snorres
utdrag ender med «Så sier Hornklove:» og strofen han siterer, og Haraldskvadet
finnes ikke noe annet sted enn inne i Snorre og Fagrskinna. Det tomme feltet er
**årstallet** - eleven har nettopp levd et helt år i 872, og ingen kilde gir det
året. Ga hun korn til Haralds mann i sommer, står det en linje til.

Bordet kommer *etter* vinteren, ikke oppå den:
`WorldScene.bordetEtterKapittelet()` venter til beskjeden om oppgjøret er lest.
Vakten er `kapittel:N` i storen, så regelen gjelder ethvert kapittel som ender i
en beskjed - ikke bare dette.

| Fil | Hva |
| --- | --- |
| `data/kilder.ts` | Kildene: hvem, hvor, for hvem, hva de sier, og hvor det står |
| `data/mellomspill.ts` | Bordet: hvilke kort, hvilke veiinger, hva det tomme feltet sier |
| `components/Mellomspill.tsx` | Bordet på skjermen |
| `WorldScene.apneMellomspill` / `avsluttMellomspill` | Låsen, begrepene og regnskapet |

Ting som er lette å ødelegge her:

-   **Bordet deler ikke ut begreper.** Komponenten melder at hun la kildene fra
    seg, og hva hun rakk; `avsluttMellomspill` i scenen konterer. Samme regel
    som for puzzlene, og av samme grunn: det er spillet som skal avgjøre hva et
    bord er verdt, ikke det som tegner det.
-   **Fasiten står uansett hva hun svarte.** Uten tidspress og uten kamp er det
    ingenting å straffe, og et bom er ofte den korteste veien inn i hvorfor.
    Legger noen inn poeng på bordet, er det den regelen som ryker først.
-   **Går hun fra bordet før det tomme feltet, er ingenting fullført.**
    `mellomspillFerdig` har `gjennomgatt`, og den er falsk da. Hun har ikke sett
    det bordet skulle vise henne.
-   **Kapittelet peker på mellomspillet, ikke omvendt.**
    `KapittelDef.mellomspillEtter` er den ene pekeren. Ligger den samme
    koblingen to steder, driver de fra hverandre.
-   **Utdragene er ikke omskrevet.** Dragene står i krøniken fordi de faktisk
    står der. En kilde vi har gjort lettere å svare på, er ikke en kilde lenger,
    og `henvisning` er der for at en lærer skal kunne sjekke nettopp det. Er et
    utdrag oversatt eller flyttet mellom målformer, står det i `henvisning`.
-   **Det tomme feltet er data, ikke en tekst i komponenten.** `feltNavn` og
    `feltSvar` på `TomtFelt` sier hva som blir stående på kortet. Hullet er ikke
    det samme hver gang: i 793 er det en kilde som ikke finnes, i 872 er det et
    årstall ingen har skrevet ned.

Bordet ligger framme i pausemenyen etterpå. Kildekritikk er det ene i dette
spillet som blir bedre av å leses to ganger, og `fullforMellomspill` gir XP bare
første gang.

## Lagring

Lagringen har to former, og de er med vilje ikke den samme.

-   **På disken** (`SaveState` i `types.ts`, localStorage-nøkkelen
    `rpg-minnevokteren-v1`) ligger alt i et navnerom per epoke:
    `spiller` er globalt og følger eleven overalt, `epoker[id]` har
    `kampanje` (det hun har lært og gjort - arves mellom kapitler) og
    `kapittelState` (den ene personen i det ene kapittelet - nullstilles ved
    kapittelskifte). Nivå og utstyr følger personen, ikke ætten.
-   **I kjøretiden** (`RpgState` i storen) ligger den *aktive* epoken flatt, så
    ingen komponent trenger å vite hvilken epoke den leser fra. Epoker eleven
    ikke står i, ligger urørt i `andreEpoker`.

`partialize` og `merge` i storen er de eneste to stedene som kjenner begge
formene. Det er verdt å holde slik: før hadde vi to typer som skulle beskrive
det samme, og de hadde drevet fra hverandre uten at noe sa fra.

Tre ting som er lette å ødelegge:

-   **Nøkkelen byttes aldri.** Å bytte den er å slette hvert eneste lagrede
    spill i et klasserom som spiller. Nye former får ny `version` og en
    migrering.
-   **`merge` er total.** Den bygger hele tilstanden gjennom `heleEpoken()`, som
    fyller hullene. Derfor kan ikke et nytt felt lenger komme tilbake som
    `undefined` for en elev med et gammelt spill - den klassen feil er borte,
    men bare så lenge nye felt får default i `tomKampanje()`/`tomtKapittel()`.
-   **Ingen oppslag uten fall.** `CLASS_BY_ID[…].startWeapon` på en klasse som
    er omdøpt kastet et unntak midt i innlastingen, zustand svelget det, og
    eleven møtte karakterskaperen som om hun aldri hadde spilt - med det
    lagrede spillet liggende urørt til hun laget en ny figur oppå det.
    `onRehydrateStorage` logger nå slike feil.

`ankomSted(stedId, epokeId)` er det eneste som bytter epoke: den legger den
forrige bort hel og henter den nye fram hel. `WorldScene.create()` kaller den
hver gang eleven kommer fram et sted.

## Verifisering

Tjueen skript driver spillet i en ekte nettleser. De krever at `npm run dev`
kjører, og leser scenen gjennom `window.__rpg` (og registeret gjennom
`window.__rpgSteder`, storen gjennom `window.__rpgStore`), som `boot.ts` bare
eksponerer i dev.

Er 5173 opptatt (en annen økt kjører allerede), tar Vite neste ledige port. Da
må skriptene få vite hvor de skal:

```bash
RPG_BASE=http://localhost:5175 node scripts/verify-rpg-kamp.mjs
```

| Skript                       | Hva det dekker                                            |
| ---------------------------- | --------------------------------------------------------- |
| `verify-rpg-kamp.mjs`        | Pust, gard, kostnader, skjoldgang                         |
| `verify-rpg-drap.mjs`        | At et drap gir XP, og at tiden går normalt etterpå        |
| `verify-rpg-verden.mjs`      | At bakken, tåka, kollisjonen og objektene finnes          |
| `verify-rpg-samhandling.mjs` | Hint, E-trykk, dialog, landemerker, utropstegn            |
| `verify-rpg-boss.mjs`        | Kunnskapsdysten: riktig svar river skjold, galt gjør ikke |
| `verify-rpg-reise.mjs`       | Stedskifte: bygges på nytt, og ingenting lekker           |
| `verify-rpg-bue.mjs`         | Skytevåpen: ladetid, pil i lufta, rekkevidde              |
| `verify-rpg-farkost.mjs`     | Båten: om bord, ro, land stopper, i land igjen            |
| `verify-rpg-lagring.mjs`     | At et lagret spill overlever migreringen, og epokebytte   |
| `verify-rpg-hub.mjs`         | Hallen: tidslinjen, varden, og reisen inn og hjem igjen   |
| `verify-rpg-flerspiller.mjs` | Navnevakt, glidning, skjul, benk - og at epokene er alene |
| `verify-rpg-opplaering.mjs`  | Ravns fire økter: at han ikke dør, at hun ikke dør       |
| `verify-rpg-skroget.mjs`     | Feil skrog synker, riktig gir begrepet og sjøsettingen  |
| `verify-rpg-lindisfarne.mjs` | Ferden vestover, raidet, stillheten, valgene og hjemveien |
| `verify-rpg-mellomspill.mjs` | Kildebordet begge veier, og det tomme feltet                |
| `verify-rpg-mellomspill2.mjs` | Bordet i 872: at det kommer etter vinteren, og årstallet som mangler |
| `verify-rpg-minnetre.mjs`    | De tre tilstandene, og de to veiene verden løfter dem      |
| `verify-rpg-aarshjul.mjs`    | Årstidsskiftet, gatingen per kapittel, og æren i prisene   |
| `verify-rpg-kapittel2.mjs`   | Kapittelskiftet: hva som arves, hva som nullstilles        |
| `verify-rpg-aaret.mjs`       | Et helt år i 872, gjengaven, og sent sådd korn             |
| `verify-rpg-angrepet.mjs`    | Begge utgangene av båten i vika                            |
| `verify-rpg-tinget.mjs`      | Sakens fire trinn: frist, vitner, hjemmel, dom             |

Tre ting de har lært på den harde måten: et tastetrykk må **holdes** i over 100
ms (Phasers `Key.onUp` nullstiller `_justDown`, så `page.keyboard.press()` blir
aldri sett), fasit skal leses fra dataene og ikke gjettes (`QuizChallenge`
stokker alternativene per forsøk), og en prøve som krever en bestemt
kamptilstand må vente på den *inne i* nettleseren. Poller man fra Node, ligger
det to rundturer mellom «garden står» og slaget - nok til at paradevinduet
rekker å åpne seg, og da blir blokken en parade.

## Våpen og angrepsform

Kampegenskapene ligger i to lag: tallene på gjenstanden (`VaapenDef` i
`items.ts` - skade, hastighet, rekkevidde, bue) og formen på arten
(`VAAPEN_KAMP` i `data/vaapen.ts` - pust, manøver, tyngde og `Angrepsform`).

`Angrepsform` avgjør hvilket verb våpenet har:

- **`sving`** - buen, treffsektoren og komboen. Alle håndvåpen.
- **`skudd`** - strengen trekkes i `ladeMs`, og skuddet går ut i
  prosjektillaget. Rekkevidden (piksler) delt på farten (piksler i sekundet)
  gir levetiden.

Et nytt skytevåpen er derfor data, ikke en ny gren i `slaa()`: et gevær i 1916
er bua med andre tall og lengre ladetid. Skudd som er fysiske gjenstander må
settes med `fysisk: true` - da peker de dit de flyr og pulserer ikke. Pulsen
hørte til besvergelsene, og de er borte.

Fiendene har `sarslag` etter samme tanke: hvert n-te slag går gjennom garden
(`ublokkerbart`) eller river skjoldet (`hak`), og det telegraferes i egen farge.

## Ting som er lett å ødelegge igjen

Disse er alle feil som har vært i koden, og som ikke er åpenbare:

-   **Lås og fysikkpause må følges ad.** Alt som skal fryse spillet går gjennom
    `settLaast()` i `WorldScene`. Setter du `this.laast` direkte, fortsetter
    fiendene å slå mens eleven leser et spørsmål - og hun kan dø midt i en
    fagforklaring.
-   **`bossVakt` nullstilles i `settLaast(false)`.** Gjør den ikke det, blir
    bossen udødelig for alltid hvis eleven trykker Esc på bossspørsmålet.
-   **Fiender må rydde colliderne sine.** `spawnFiende` tar vare på dem i
    `fiende.collidere`, og `drepFiende` fjerner dem. Uten det lekker to per fiende,
    for alltid.
-   **Ikke bak props inn i store renderTextures.** Det ble prøvd for å spare
    tegnekall og halverte bildefrekvensen: kartbrede, gjennomsiktige flater som
    overlapper hverandre koster mer i overtegning enn de sparer i tegnekall.
-   **Kollisjonsbokser skal ut av visningslista.** `lagBoks` kaller
    `this.children.remove()`. 286 usynlige rektangler i lista tredoblet lengden på
    det som sorteres etter dybde hver frame.
-   **Tilbakestøt trenger en egen tilstand.** Uten `tilstand: 'stotet'` overskriver
    AI-en farten allerede neste bilde, og treffet flytter fienden to piksler.

## Slik ser det ut

-   **Overgangsfliser.** Hver flistype har fire kanter og fire hjørner
    (`forgeKanter`). Prioriteten i `FLIS_PRIORITET` bestemmer hvem som legger
    kanten sin oppå hvem. Sanden har et eget «skum»-sett som bare brukes der den
    møter vann.
-   **Kontur og fargeramper.** `Painter.outline()` legger 1px kontur rundt alt.
    `ramp()` hue-shifter mot kaldt i skyggen og varmt i lyset i stedet for å gange
    fargen med et tall.
-   **Animasjon.** Hver figur har alle 56 rammene sine i én tekstur: fire
    retninger × (2 idle, 4 gange, 3 slag, 3 rull, 2 gard). Se `heltFrame()`.
    Endrer du dette, må `KOLONNER`, `START`, `POSITUR_LENGDE` og positurlista i
    `forgeHumanoid` endres i samme åndedrag.
-   **Pikselfonten** (`forgeTallfont`) har sifre, skilletegn og hele alfabetet med
    æ, ø og å. Den hadde bare `0123456789+-!XP ` en stund, og da rendret «Skjold!»
    som en nesten blank boble - alt annet falt tilbake på mellomrom. `glyfIndex()`
    løfter små bokstaver, så tekst kan skrives naturlig.
-   **Kameraet dyttes, det ristes ikke.** `dytt(vinkel, piksler)` skyver
    `followOffset` langs treffvektoren og eases tilbake. Rystelse i alle retninger
    leser som støy; et dytt leser som kraft. `setScroll` virker ikke her - kameraet
    følger spilleren og overskriver det neste bilde.
-   **Zoomen holdes på hele tall.** Blueprinten ba om 3.0 → 3.4 i kamp, men
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

-   **Avslutningene skiller på våpen.** Sverdet kutter på tvers, øksa slår ned i
    bakken, spydet skyver kroppen bakover før den siger, hammeren knuser til grus.
    Hver har sin egen lyd. Legger du til en våpenart, legg til en gren - `default`
    slenger bare kroppen av gårde.
-   **Lemlestelse skjer én gang per fiende**, første gang den går under halvt liv
    (`fiende.lemlestet`). Den slåss videre uten biten. Det er ikke et nytt tall å
    følge, det er at eleven _ser_ at motstanden er slitt ned.
-   **Saktefilmen telles ned aller først i `update`**, før hver tidlige retur. Lå
    nedtellingen etter hitstop- eller lås-returen, kunne den henge igjen for alltid
    hvis eleven åpnet en dialog i drapsøyeblikket - og da går hele spillet i sirup
    uten at noen skjønner hvorfor. `KampFx.tikk()` skal alltid få **ekte** delta;
    bare spillogikken skaleres.

### To fallgruver som kostet tid

-   **Phasers `flash` er ikke avmetting.** Den fyller skjermen med fargen på full
    alpha og fader ut, så en «mørk flash» for å ta fargen ut av bildet er i praksis
    et svart blink midt i drapet. Det ble prøvd, sett på et skjermbilde og fjernet.
    Ekte avmetting krever en egen pipeline. Hvitt blink er greit - hvitt leser som
    et høylys, mørkt leser som en glipp.
-   **Skalerte firkanter leser ikke som blod.** Første forsøk brukte `fx-bit`
    (3×3 hvit rute) skalert opp til 1,9×1,2 - resultatet så ut som spredte murstein
    på plenen. Blod trenger små, ujevne former (`fx-flekk`, fire varianter) og en
    mørkere farge enn sprutet i luften. Konturen må også bort på småbiter, ellers
    leser løsdelene som fasetterte krystaller.
-   **Atmosfære.** Tåkeslør driver over verden i to lag, bålet lyser og flakker, og
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
3. Fyll ut hele `tema` (i dag hentet fra epoken i `data/epoker.ts`). Alt terreng,
   tømmer, tak og løvverk leses derfra, så stedet får sitt eget utseende uten ny
   grafikk.
4. Legg stedet inn i `STEDER` i `data/steder.ts`. Det er hele registreringen:
   epoke, tema, kartbygger, spawnpunkt, folk, landemerker, farkoster, boss og
   musikk. Kartbyggeren må fylle ut både `blokkert` (der eleven ikke kan gå) og
   `farbart` (der en båt kan ferdes) - de er ikke hverandres motsatte.
   `epokeId` avgjør både regelsettet og hvilken sone i spørsmålsbanken stedet
   henter fagstoff fra - peker den feil, faller stedet tilbake på vikingtiden.

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
