# Blueprint: Kjedereaksjonen (`/oving/kjedereaksjonen`)

> Et 2D-plattformspill der årsak-virkning-kjeden er bakken du løper på.
> Du velger hvilken konsekvens som følger av hendelsen foran deg, og den
> riktige materialiserer seg som plattformen du lander på. Bak deg spiser
> Glemselen banen. Riktige svar gir fart, og fart er det eneste som holder
> deg foran den.

---

## 1. Sjelen

Historiefaget handler ikke om å huske at Svartedauden kom i 1349. Det handler
om å forstå hvorfor pesten førte til at bønder plutselig kunne kreve bedre
vilkår. Det er kompetansemålet, og det er akkurat den delen som er vanskeligst
å øve på, fordi kausalitet ikke lar seg pugge som et årstall.

Kjedereaksjonen gjør kausalitet til fysikk. Årsaken står i steinen under deg.
Virkningen er hullet foran deg. Velger du feil konsekvens, holder ikke steinen,
og du faller. Ikke fordi spillet straffer deg, men fordi kjeden brast.

Pedagogisk kjerne:
- **Kausalitet som bevegelse**: eleven bygger seg fysisk fremover gjennom en
  årsakskjede, og ser den etterpå som en bro hun har krysset.
- **Momentum**: du kan ikke stoppe og gruble i ro. Rask, intuitiv
  årsaksresonnering er ferdigheten spillet trener.
- **Feil er informasjon**: et feil valg gir en kort forklaring på hva som
  faktisk skjedde med den påstanden, ikke et rødt kryss.

Dette er det første spillet i Eiriksbok som er en ekte sanntids-sidescroller.
Kunnskapsløypa dekker rundebasert roguelike, Stjernehimmelen dekker repetisjon,
mini-spillmotoren dekker 3D-førsteperson. Denne fyller det tomme feltet: 2D
action som fungerer godt på Chromebook.

## 2. Bygger på det som finnes

| Behov | Finnes allerede | Fil |
|---|---|---|
| Fag/emne-struktur | Manifest med subjects → topics → lessons | `public/content/manifest.json` via `useManifest()` |
| Progresjon og XP | `recordActivity({ kind: 'practice-game', ... })` | `src/features/progress/useProgressStore.ts` |
| Deterministisk tilfeldighet | `djb2Hash`, `mulberry32`, `shuffleWith` | `src/utils/reviewScheduler.ts` |
| Lyd | Delt singleton med felles mute-nøkkel | `src/hooks/useStepSounds.ts` |
| Full bredde-layout | `FULL_WIDTH_PATHS` | `src/context/LayoutContext.tsx` |
| Reducer-mønster for spilltilstand | Kunnskapsløypas `runReducer` | `src/components/games/loype/runReducer.ts` |

Ingen nye npm-avhengigheter. Canvas 2D + eksisterende Framer Motion for UI-chrome.

Det eneste som er genuint nytt er **innholdstypen**: årsakskjeder. Den finnes
ikke i banken fra før, og må forfattes. Se §4.

## 3. Spillmekanikken

### 3.1 Kjernesløyfen (ett ledd, cirka 8 sekunder)

1. **Løping.** Figuren løper automatisk mot høyre. Eleven styrer ikke fart.
   Under føttene står gjeldende ledd i kjeden som tekst i steinen:
   «Svartedauden dreper omtrent halvparten av folket i Norge.»
2. **Gapet.** Et stup nærmer seg. Over gapet svever tre plattformer i tre
   høyder, hver med en påstand. De er lesbare på god avstand, så eleven leser
   mens hun løper.
3. **Tenkeøyeblikket.** Ved kanten går tiden i sakte film (cirka 60 prosent
   fart) i inntil 4 sekunder. Eleven velger med `1`/`2`/`3` eller pil opp/ned
   pluss mellomrom. Velger hun ikke, hopper figuren mot midterste plattform.
4. **Utfallet.**
   - **Riktig:** plattformen låser seg, et lysglimt løper gjennom hele kjeden
     bakover, farten øker ett hakk, og teksten på plattformen blir det nye
     leddet i steinen. Kameraet rykker fremover.
   - **Feil:** plattformen sprekker under føttene og eleven faller ned i
     **feilsporet**, en lavere bane. Der står forklaringen («Byene vokste ikke.
     Folk flyttet ut av byene, for smitten var verst der det bodde flest.»)
     Etter cirka 3 sekunder klatrer figuren opp igjen på riktig plattform.
     Kjeden fortsetter, men Glemselen har tatt inn på deg.

### 3.2 Glemselen

En vegg av grå tåke kommer inn fra venstre i konstant fart. Alt den passerer
mister farge. Elevens løpefart øker med streak, så riktige svar er bokstavelig
talt det som holder deg foran glemselen. Et fall i feilsporet koster tid,
ikke liv.

Blir du tatt igjen, er runden slutt, men oppsummeringen viser hele kjeden du
rakk å bygge. Ingen «game over»-skjerm uten innhold.

Dette er hele straffesystemet. Ingen liv, ingen hjerter, ingen instadød. Kravet
er å tenke raskt, ikke å hoppe presist.

### 3.3 Drivkrefter (RPG-laget)

Etter hver fullførte kjede velger eleven én av tre **drivkrefter**. De er de
samme drivkreftene historiefaget bruker til å forklare endring, og hver gir en
evne som speiler hva drivkraften gjør i virkeligheten:

| Drivkraft | Evne | Begrunnelse |
|---|---|---|
| Teknologi | Dobbelthopp | Teknologi lar deg nå det du ikke nådde før |
| Økonomi | Ett fall koster halv tid | Rikdom kjøper deg ut av trøbbel |
| Makt | Tenkeøyeblikket varer 2 sekunder lenger | Makt gir deg tid andre ikke har |
| Religion | Fjerner én gal plattform i første ledd av hver kjede | Tro gir retning før du vet svaret |
| Natur | Glemselen går 15 prosent saktere | Naturen setter tempoet, ikke du |

Drivkreftene varer ut økten (3 kjeder på rad = en «ferd»). De lagres ikke på
tvers av økter i v1.

### 3.4 Sluttbildet: broen

Når en kjede er fullført, zoomer kameraet ut og viser hele kjeden som en
sammenhengende bro av lysende steiner, fra første årsak til siste virkning,
med figuren på toppen. Dette er belønningen: eleven ser strukturen hun nettopp
løp gjennom, samlet i ett bilde. Feilledd vises som en liten omvei under broen.

Sluttskjermen lister leddene som tekst med lenke til artikkelen hvert ledd kom
fra, slik at «jeg skjønte ikke det der» har et sted å gå.

## 4. Datamodell: årsakskjeden

### 4.1 Formen

En kjede er en lineær sekvens av **ledd**. Det avgjørende designgrepet: det
riktige svaret i ett ledd **er** teksten i neste ledd. Da kan ikke kjeden være
en samling løsrevne spørsmål, den må faktisk henge sammen.

`public/content/kjeder/<id>.json`:

```json
{
    "id": "svartedauden",
    "title": "Svartedauden",
    "subjectId": "historie",
    "topicId": "middelalderen",
    "epoke": "Middelalderen",
    "start": "Norge i 1348: rundt 350 000 mennesker, og nesten alle er bønder.",
    "ledd": [
        {
            "tekst": "Svartedauden kommer til Bergen i 1349 og dreper omtrent halvparten av folket.",
            "feil": [
                {
                    "tekst": "Kongen forbyr handel med utlandet.",
                    "hvorfor": "Ingen visste hva som spredte pesten. Handelen fortsatte som før."
                },
                {
                    "tekst": "Folk flytter inn til byene for å få hjelp.",
                    "hvorfor": "Det motsatte skjedde. Byene var farligst, og de som kunne, flyktet ut."
                }
            ],
            "link": "/historie/middelalderen/svartedauden"
        },
        {
            "tekst": "Det blir mangel på folk til å gjøre arbeidet.",
            "feil": [ ... ]
        }
    ],
    "slutt": "Norge trengte over 200 år på å bli like folkerikt som før pesten."
}
```

- Første ledd bruker `start` som årsak i steinen.
- `feil[].hvorfor` er teksten eleven møter i feilsporet. Den skal forklare,
  ikke irettesette, og være under 20 ord.
- `link` er valgfri per ledd, og peker til artikkelen leddet bygger på.
- Kjedelengde: 5 til 8 ledd. Kortere føles tynt, lengre sprenger konsentrasjonen.

### 4.2 Validering

`scripts/validate-kjeder.mjs` (kjøres i `scan:content`) sjekker:
- 5-8 ledd, nøyaktig 2 feilalternativer per ledd
- alle `link` finnes i manifestet (gjenbruker logikken fra
  `scripts/check-internal-links.cjs`)
- ingen ledd-tekst over 90 tegn, ellers blir plattformen uleselig i fart
- `subjectId`/`topicId` finnes i manifestet
- ingen brutte norske tegn

Den genererer `public/content/kjeder/kjede-oversikt.json` som spillet laster
først. Filen heter bevisst ikke `index.json`: innholdsskanneren utleder nøkler
fra filnavn, og «index» er generisk nok til å kollidere med neste index.json
noen legger inn et annet sted i `public/content/`.

### 4.3 Innhold i v1

Kausalitet er kjernen i historie og samfunnskunnskap. Andre fag venter.

Åtte kjeder, valgt fordi de har tydelige, lærebokfaste årsakskjeder og allerede
har artikkeldekning:

| Kjede | Fag/emne |
|---|---|
| Svartedauden | historie/middelalderen |
| Den franske revolusjon | historie/den-franske-revolusjon |
| Fra dampmaskin til fabrikkby | historie/industriell-revolusjon |
| Veien til første verdenskrig | historie/forste-verdenskrig |
| Fra Versailles til Hitler | historie/mellomkrigstiden |
| Jernteppet faller | historie/den-kalde-krigen |
| Oljen forandrer Norge | historie/norge-i-moderne-tid |
| Renta og lommeboka di | samfunnskunnskap/okonomi |

Hver kjede er cirka 90 sekunder. En ferd på 3 kjeder er cirka 5 minutter, som
passer en økt-avslutning.

## 5. Visuell stil

Lyst, i tråd med resten av Eiriksbok. Trusselen kommer fra Glemselen som spiser
farge bakfra, ikke fra en mørk palett.

- **Bakgrunn:** tre parallakse-lag med silhuetter fra epoken kjeden hører til.
  Middelalderen får kirketårn og åser, industrien får piper og takrygger. Laget
  skifter gradvis mens kjeden skrider frem, så verden forandrer seg med
  årsakskjeden.
- **Plattformer:** varme sandsteinsplater med teksten hugget inn. Riktig valgt
  plate får en gyllen glød som blir liggende.
- **Glemselen:** myk grå tåkevegg. Alt bak den tegnes i gråtoner med lav
  metning. Ingen skummel visuell effekt, bare farge som forsvinner.
- **Typografi:** Outfit, stor. Plattformtekst må være lesbar på projektor fra
  bakerste rad, og på 1366×768 uten zoom.
- **Kanvas 2D, én rAF-løkke.** Fast tidssteg på 1/60 med akkumulator, så
  fysikken oppfører seg likt på en treg Chromebook. Framer Motion brukes kun
  til oppsett, oppsummering og drivkraft-valg.
- **`prefers-reduced-motion`:** parallaksen fryses, kameraet klipper i stedet
  for å panorere, og Glemselen vises som en statisk kant i stedet for å krype.

## 6. Filplan (MVP)

```
Nye filer:
  src/types/kjede.ts                             Kjede, Ledd, RunState, Drivkraft
  src/utils/kjedeFysikk.ts                       Ren fysikk: gravitasjon, hopp, kamera
  src/components/games/kjede/kjedeReducer.ts     Tilstandsmaskin for en ferd
  src/components/games/kjede/drivkrefter.ts      Definisjoner + effekter
  src/components/games/kjede/loadKjeder.ts       Henter kjede-oversikt.json + kjede
  src/components/games/kjede/KjedeCanvas.tsx     rAF-løkke, render, input
  src/components/games/kjede/KjedeHud.tsx        Fart, streak, drivkrefter, mute
  src/components/games/kjede/KjedeSetup.tsx      Velg fag/kjede, forklaring
  src/components/games/kjede/KjedeChoice.tsx     Tenkeøyeblikk-overlay
  src/components/games/kjede/KjedeSummary.tsx    Broen + ledd med lenker
  src/pages/KjedereaksjonenPage.tsx              Orkestrering
  public/content/kjeder/<8 filer>.json           Innholdet
  scripts/validate-kjeder.mjs                    Validator + index-generator

Endrede filer:
  src/routes.ts                                  KjedereaksjonenPage-factory
  src/App.tsx                                    Rute /oving/kjedereaksjonen
  src/context/LayoutContext.tsx                  Legg til i FULL_WIDTH_PATHS
  src/pages/PracticePage.tsx                     Inngangskort
  package.json                                   validate-kjeder inn i scan:content

Avhengigheter:
  types/kjede.ts → kjedeFysikk.ts → kjedeReducer.ts → KjedeCanvas/Hud/Choice
    → KjedereaksjonenPage → App
```

## 7. Avgrensning: hva MVP bevisst utelater

| Utelatt | Hvorfor | Plan |
|---|---|---|
| Norsk og KRLE | Kausalitet er ikke kjernen i disse fagene, og en tvungen kjede blir kunstig | v2: norsk kan få «virkemiddel → virkning på leseren» som egen variant |
| Automatisk generering av kjeder | Kausalitet må være faglig riktig, en LLM-generert kjede kan ikke slippe rett ut | v2: la den daglige innholdscronen foreslå kjeder som et menneske godkjenner |
| Forgrening (flere gyldige veier) | Doblar forfatterarbeidet og gjør broen uleselig | v3 |
| Kontrafaktisk boss («hva om X aldri skjedde?») | Egen mekanikk, fortjener eget designpass | v2, som avslutning på en ferd |
| Lagret progresjon mellom økter | Drivkrefter varer ut ferden, som i Kunnskapsløypa | v2 hvis det viser seg å savnes |
| Multiplayer/klasseduell | Quiz Battle dekker konkurransebehovet i dag | v3 |
| Berøringsstyring | Chromebook med tastatur er baseline | v1.1: tre trykkfelt på skjermen |

## 8. Suksesskriterier

- En elev som kan stoffet, men er treg på tastaturet, skal aldri tape på det.
  Motorisk krav nær null, kognitivt krav ekte.
- Første kjede skal kunne spilles uten instruksjon. Steinen forteller årsaken,
  gapet forteller at noe må følge.
- Etter en ferd skal eleven kunne gjenfortelle kjeden muntlig. Det er testen på
  om broen fungerer som huskestruktur.
- 60 fps med tre parallakse-lag på Chromebook 1366×768.
- Feilsporet skal føles som en omvei, ikke som en straff. Målt enkelt: elever
  som feiler tidlig, skal fortsatt fullføre kjeden.

## 9. Åpne spørsmål før bygging

1. **Auto-løp eller fri styring?** Blueprinten går for auto-løp, fordi det
   holder oppmerksomheten på teksten. Fri styring gir mer spillfølelse, men
   inviterer til å stoppe og gruble, som dreper momentum-poenget.
   *Avgjort: auto-løp.*
2. **Skal Glemselen kunne ta deg igjen i det hele tatt?** Alternativet er at
   den bare koster poeng. Blueprinten lar den avslutte runden, men med full
   oppsummering, så tapet aldri er tomt. *Avgjort: den kan ta deg, men er
   tunet mildt. Se §10.*
3. **Åtte kjeder holder til én skoletime.** Er det nok til lansering, eller
   bør v1 vente til det finnes cirka 20? *Utsatt: v1 bygde motoren på én
   kjede først, slik at følelsen er verifisert før innhold skaleres.*

---

## 10. Slik ble v1 faktisk bygget (motor + én kjede)

Motoren er ferdig og spillbar på `/oving/kjedereaksjonen` med Svartedauden som
eneste kjede. Avvikene fra blueprinten over, og hvorfor:

| Avvik | Begrunnelse |
|---|---|
| **Hoppet er skriptet, ikke fysikk-simulert** | Valget skjer i lufta uansett, og en ekte hoppbue ville straffet elever som kan stoffet, men bommer på timingen. Motorisk krav er nå null. |
| **Drivkraften «Teknologi» (dobbelthopp) er droppet** | Med skriptet hopp har et dobbelthopp ingen mening. Igjen står Makt, Natur, Økonomi og Religion, som alle virker på tid, tåke eller informasjon. |
| **Drivkraft velges midtveis i kjeden, ikke etter hver kjede** | Med bare én kjede i v1 ville belønningen aldri utløses. Utløses nå ved `ceil(antall ledd / 2)`. |
| **Nytt: innrammingskamera** | Under løping henger kameraet etter figuren. Fra det øyeblikket valgene dukker opp glir det tilbake og rammer inn årsak-steinen og de tre påstandene samtidig. Uten det mistet eleven premisset akkurat idet hun trengte det - den klart viktigste retten i hele byggingen. |
| **Nytt: `MIN_FEILSPOR_LESETID` (1,5 s)** | Eleven kan hoppe ut av feilsporet selv, men ikke før forklaringen har rukket å bli lest. Uten terskelen ble omveien gratis, og da forsvant grunnen til å svare riktig. |
| **Kanvaset fyller bredden i stedet for å letterboxe** | Høyden bestemmer skalaen. Brede skjermer ser mer av verden; `MIN_BREDDE` sikrer at valgkolonnen får plass på smale. |
| **Filnavn** | `kjedeWorld.ts` (simulering) i stedet for `kjedeReducer.ts`, og `KjedeOverlay.tsx` samler tastehint, feilspor-forklaring og drivkraft-valg i stedet for tre filer. |

### Tuning som bør observeres med ekte elever

Glemselen er tunet mildt: en runde med to feil og full lesetid i feilsporet
kommer komfortabelt i mål. Å bli tatt igjen krever at nesten alt går galt.
Det er bevisst valgt side å bomme på, men tallene i `kjedeFysikk.ts`
(`FOG_SPEED`, `FOG_START_LEAD`, `RUN_BASE`, `FEILSPOR_DUR`) er ett sted å
justere hvis spillet viser seg å mangle spenning i klasserommet.

### Verifisert

Spilt gjennom ende til ende i Chromium på 1366×768: setup, tenkeøyeblikk,
riktig landing, feilspor med forklaring, klatring opp igjen, drivkraft-valg,
fullført kjede med broen, og `prefers-reduced-motion`. Ingen konsollfeil.

---

## 11. Juice-passet

Første versjon var lesbar og pedagogisk riktig, men den var død å spille.
Belønningsøyeblikket var en stein som gled rolig på plass: ingen anslag, ingen
lyd-bilde-kobling, og ingen synlig kjede. Spillet het Kjedereaksjonen, og
eleven så aldri en kjedereaksjon før oppsummeringsskjermen.

Fem grep, i rekkefølge etter hvor mye de betyr:

1. **Kjedeglimtet.** Riktig svar sender en lyskule langs kjeden fra årsak til
   virkning. Kjettingen mellom steinene lyser der pulsen passerer, og steinene
   vaskes gylne i tur og orden. Dette er spillets navn, metafor og belønning i
   én effekt. `tennGlimt()` i `kjedeEffekter.ts`.
2. **Anslaget.** Steinen dunker ned: støvsky langs nedslaget, steinfliser som
   spretter, kort kamerarystelse, og figuren som klemmes og fjærer tilbake.
3. **Synlig fart.** Fartsstriper i juvet, merker som streamer langs landkanten,
   bevegelsesspor bak figuren, og et kamera som ser lenger frem jo raskere hun
   løper. Uten dette var «riktige svar gir deg fart» en usynlig variabel.
4. **De gale svarene får dø.** `CRACK_DUR` fra 0,3 til 0,85 sekunder, med en
   pause der steinen slår sprekker før den gir etter. På 0,3 sekunder var de
   borte før eleven registrerte at de falt.
5. **Progresjon.** `kjedeStats.ts` husker beste resultat, lengste rekke og om
   kjeden er tatt ubrutt. Startskjermen viser rekorden og en drivkraft-samling
   som fylles opp; broen feirer rekorder som ble slått.

Alt dette bor i `kjedeEffekter.ts` og påvirker aldri simuleringen. Juice skal
ikke kunne endre utfallet.

### Bugs juice-passet avdekket

- **Glimtet mistet ankeret sitt.** Banen ble regnet ut fra `w.segment`, som
  øker midt i glimtet, så pulsen hoppet et helt steg fremover underveis.
  Koordinatene låses nå i det slaget skjer (`glimtFra`/`glimtTil`).
- **Glimtet forsvant helt ved redusert bevegelse.** Ankeret ble bare satt inne
  i `steinSlam()`, som er slått av der, så pulsen ble tegnet på x = 0. Glimtet
  er informasjon, ikke pynt, og går nå i begge modi.
- **Fallende steiner la seg oppå det riktige svaret.** Smuldrende steiner
  tegnes nå først.

### Om verifiseringen

`page.screenshot()` bruker 100-200 ms per bilde og strekker dermed nettopp den
tidslinjen man prøver å måle - en bildeserie tatt slik bommet konsekvent på
anslaget. Bruk CDP-screencast (`Page.startScreencast`) når en animasjon på
under ett sekund skal vurderes.

Merk også: headless Chromium svarte lenge `reduce` på `prefers-reduced-motion` i
oppsettet som ble brukt. Sett `reducedMotion: 'no-preference'` eksplisitt på
Playwright-konteksten, ellers tester man aldri spillet slik elevene ser det.
