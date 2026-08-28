# Pengeliv

## Blueprint for privatøkonomi-simulator i Eiriksbok

**Rute:** `/oving/pengeliv`
**Type:** egen feature-modul (`src/features/okonomi/`), ikke 3D-motoren og ikke mikrospill-systemet
**Status:** idéutvikling ferdig, ikke påbegynt
**Sist oppdatert:** 2026-08-28

---

## 1. Konseptet

Eleven bygger og styrer sin egen økonomi gjennom et helt liv i en app som ser ut som en
ekte bank. Én klokke driver lønn, skatt, sparing, gjeld, bolig og børs samtidig. Det er en
livssimulator med bank-app-skall, ikke et brettspill og ikke et regneark.

## 2. Problemet det løser

Brutto lønn, skattekort, BSU, forvaltningsgebyr og effektiv rente møter unge første gang i
det øyeblikket det gjelder deres egne penger. Ingen har vist dem innsiden av tallene.
Forskjellen mellom å begynne å spare som 18-åring og som 30-åring er umulig å føle uten å
se den skje.

## 3. Målgruppe

Alle som vil lære. Ikke bundet til ett trinn eller kompetansemål. Nivået legges på «ung
person med deltidsjobb som snart flytter ut». Chromebook 1366x768 er designbaselinjen.

## 4. Læringsmålene

| Mål | Hvor det treffes |
|---|---|
| Hvor mye som forsvinner i skatt | Lønnsslippen, brutto til netto linje for linje |
| Rentes rente over tid | Framskrivningsgrafen, og speilvendt i kredittkortmodulen |
| Budsjett er valg, ikke tall | Hver krone flyttet mellom mat og moro flytter framskrivningen |
| Risiko og hvorfor spredning virker | Fond og børs, kurver som svinger ulikt i samme krakk |

---

## 5. Arkitekturen

### Den økonomiske profilen

Én persona som alle moduler leser og skriver til. Endrer du lønna i skattemodulen, endres
budsjettet. Kjøper du en aksje, forsvinner pengene fra brukskontoen.

Profilen holder:

- alder, yrke og lønn
- karrierebane og utdanningsnivå
- skattekort og valgte fradrag
- husholdning (samboer, barn)
- kontoer med saldo (brukskonto, sparekonto, BSU, ASK, IPS)
- fonds- og aksjebeholdninger
- lån med restgjeld og rente
- bolig (leie eller eie, verdi, lån)
- faste og variable utgifter
- innstillinger for klokke og hendelser

Eleven starter med å velge en ferdig persona (lærling, student, butikkansatt,
nyutdannet). Appen sier eksplisitt: *dette er dine tall nå, endre dem*. Stillas som
fjernes.

### Klokka

Én løpende tidslinje for hele profilen, uten øvre grense. Klokka stopper automatisk ved
**milepæler og mål**: sparemål nådd, gjeldfri, fylte år, vesentlige endringer. Dette
gjelder også når hendelser er slått av, så ingen spoler blindt forbi det viktige.

### Inflasjon

Tallene vises **nominelt**, slik de faktisk vil stå på kontoen i 2066. En stiplet linje
viser hva de er verdt i dagens penger. Avstanden mellom de to linjene er sin egen lærdom,
men krever at appen forklarer forskjellen tydelig når grafen først vises.

---

## 6. Modulene

Sidemeny til venstre i tre grupper, med saldo og klokke alltid synlig øverst.
**Alt er åpent fra start.** Elleve moduler krever gruppering på lav skjermhøyde.

### Gruppe: Økonomien din

**Oversikt**
Formue, gjeld, netto, kontantstrøm og framskrivningsgrafen som alltid viser hvor du
havner med dagens valg.

**Lønn og skatt**
Brutto til netto linje for linje, som et ekte skatteoppgjør. Trinnskatt med alle trinn,
trygdeavgift, minstefradrag, personfradrag. Fradrag eleven kan skru på og av: renter,
BSU, pendling, fagforening.

**Budsjett**
Husleie, strøm, mat, mobil, transport, forsikring, abonnementer, klær, moro. Overskuddet
er det som kan spares, og det står synlig hele tiden.

**Lån og gjeld**
Kredittkort og forbrukslån med minsteinnbetalings-fella, avbetaling og «kjøp nå, betal
senere», studielån i Lånekassen med stipendomgjøring og rentefritak, boliglån med
annuitet eller serie. Nedbetalingsplanen tegnes opp.

### Gruppe: Sparing og investering

**Sparing**
Brukskonto, sparekonto med rente, og BSU med 10 % fradrag, årlig tak, samlet tak og
binding til boligformål.

**Fond**
Univers med kategori, geografi, risikonivå og forvaltningshonorar: globalt indeksfond,
norsk aksjefond, bransjefond, rentefond, kombinasjonsfond. Fire poenger:

1. Gebyrer spiser formuen (vist som kroner over tid, aldri bare prosent)
2. Spredning demper fallet
3. Risiko henger sammen med tidshorisont
4. Et fond er bare mange av de samme aksjene eleven ser på børsen

**Børs**
Ekte norske selskaper med simulerte kurser, ingen nettilgang nødvendig. Kjøp og salg med
kurtasje og spredning som friksjon. Alt på ASK, med et **skyggeregnskap** som hele tiden
viser hva det samme hadde kostet uten ASK: «du har utsatt 12 400 kr i skatt». Motoren er
helt nøytral.

**Pensjon**
Folketrygd grovt, innskuddspensjon fra jobb, IPS med fradrag og binding. Framskrevet til
67, der rentes rente er mest dramatisk.

### Gruppe: Livet

**Karriere**
Eleven kan søke ny jobb, be om lønnsøkning, eller ta utdanning. Utdanning er en
investering på linje med fond: du lever gjennom studieårene med lav inntekt, voksende
studielån og en deltidsjobb du selv må balansere mot et stramt budsjett. Den mest
gjenkjennelige situasjonen for målgruppa.

**Bolig**
Fullt boligmarked med priser som stiger og faller, egenkapitalkrav, lånekalkulator,
dokumentavgift og felleskostnader. Å gå fra leie til eie er den store milepælen i appen,
og BSU peker hele tiden mot den.

**Husholdning**
Eleven velger selv når samboer og barn kommer inn. Samboer modelleres som
**utgiftsdeling**, ikke som egen person med egen økonomi. Hvert barn gir kostnader,
barnetrygd og foreldrepermisjon. Ingen overraskelser, alt er elevens valg.

---

## 7. Hendelser

En bryter: livet skjer, av eller på. Påslått kommer bilen som ryker, rentehoppet,
sykdommen, hver med et valg som treffer budsjettet. Avslått er Pengeliv et rent
analyseverktøy der eleven kan isolere årsak og virkning.

## 8. Utfordringer og progresjon

En liste med mål som bygger oppover: budsjett, så sparing, så fond, så børs. Rekkefølgen
er **anbefaling, ikke sperre**. Eleven kan gå rett på børsen. Appen merker når et mål nås
og feirer det.

Fullførte utfordringer gir XP gjennom `recordActivity()`. Samfunnskunnskap-artikler om
personlig økonomi lenker inn med konkrete oppgaver.

## 9. Visuell profil

**Bank i strukturen, lek i reaksjonene.** Layout, tabeller og tall er nøkterne og
gjenkjennelige fra DNB, Nordnet og Skatteetaten. Fargene og animasjonene bor i det som
*skjer*: penger som flyr, grafer som tegner seg, feiringer når et mål nås. Husets lyse
glassmorphism-stil, ikke mørk børsskjerm.

## 10. Data, lagring og vedlikehold

Satser og regler i egen JSON med årstall og synlig «sist kontrollert», i tråd med
faktasjekk-linja på artiklene. Én fil å oppdatere i januar. Fondsunivers, aksjeunivers,
personaer og yrkeslønnskurver ligger som data, ikke i kode.

Profilen lagres lokalt med tre-ords synkkode, som «Min læring».

---

## 11. Byggerekkefølge

Alt skal med, men i faser, og verktøyet slippes til elever før det er komplett.

| Fase | Innhold | Merknad |
|---|---|---|
| 1 | Motoren: profil, klokke, skattemodell, lønnsslipp | Fundamentet alt annet står på |
| 2 | Budsjett koblet til nettolønn | |
| 3 | Sparing, BSU og framskrivningsgrafen | **Slippes her.** Tre av fire læringsmål dekket |
| 4 | Fond, med gebyrpoenget | |
| 5 | Børs med ASK og skyggeregnskap | Fjerde læringsmål på plass |
| 6 | Lån og gjeld | |
| 7 | Pensjon og IPS | Den økonomiske maskinen er komplett |
| 8 | Karriere og utdanning | Livslaget begynner |
| 9 | Bolig | |
| 10 | Husholdning, hendelser, utfordringer og XP | |

## 12. Bevisste valg verdt å huske

- **Nøytral børsmotor** er valgt med åpne øyne. Noen elever blir heldige og tror de er
  flinke. Samtalen om det tas av læreren, ikke av appen.
- **Vanlig aksjedepot** ble valgt bort til fordel for skyggeregnskap, så eleven slipper å
  forholde seg til to kontoer.
- **Nominelle tall** er sterkere, men lettere å misforstå. Forklaringen av
  dagens-kroner-linja må sitte.
- **Samboer uten egen inntekt** holder fokus på elevens egen økonomi.
- **Én felles klokke** gjør dette til en livssimulator, ikke en sandkasse. Det er en
  større MVP enn opprinnelig tenkt, men det er også det som lar rentes rente vises som
  noe som skjer.

## 13. Detaljer som avgjøres ved bygging

- Hvilke selskaper i aksjeuniverset, hvor mange, og hvordan det merkes tydelig at kursene
  er simulerte og ikke investeringsråd
- Hvor fort klokka går mellom stoppunkter, og om farten justeres
- Boligprismodellen: én nasjonal kurve eller flere markeder
- Om utdanningsvalgene speiler ekte norske utdanningsløp eller er generiske
