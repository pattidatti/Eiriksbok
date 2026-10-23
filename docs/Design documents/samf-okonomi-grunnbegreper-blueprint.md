# Subject Blueprint: Økonomi - grunnbegrepene
> **Status:** `Approved` (klar for nattrutinen, én artikkel om gangen)
> **Version:** 1.0

---

## 0. Hvorfor dette emnet

Økonomi-emnet i samfunnskunnskap har elleve artikler, men det mangler grunnmuren. Vi har
artikler om petrodollaren, den naturlige renten og Milei, men ingen som forklarer hvordan en
pris blir til, hva BNP er, eller hvorfor folk blir arbeidsledige. Det er begrepene elevene
møter i nyhetene hver uke, og som de smale artiklene bygger på.

Denne blueprinten utvider det eksisterende emnet. Den lager ikke et nytt topic.

---

## 1. Metadata
- **Type:** Utvidelse av eksisterende `Topic`
- **Parent (Fag):** `samfunnskunnskap`
- **Topic ID:** `okonomi` (finnes allerede i manifestet - ikke opprett på nytt)
- **Visual Theme:** Hverdagsøkonomi. Butikkhyller, prislapper, havner, kontorlandskap, NAV-kontor.
  Moderne Norge og verden, ikke historisk.

---

## 2. The Narrative Arc

**The Hook:**
"Hvorfor koster en billett til Taylor Swift 10 000 kroner, mens et glass vann er gratis -
selv om du dør uten vann og klarer deg fint uten Taylor Swift?"

**The Arc:**
Vi starter i butikken med prisen, går videre til konkurranse og monopol, løfter blikket til
hele landets økonomi (BNP, arbeidsledighet, skatt), og ender med Norges særtilfelle (oljefondet)
og verden (globalisering). Hver artikkel står på egne bein, men rekkefølgen under er den
pedagogiske.

---

## 3. The Learning Path (The Spine)

1. **[Article]** Tilbud og etterspørsel: Slik blir prisen til (ID: `tilbud-og-ettersporsel`)
2. **[Article]** Monopol og konkurranse: Hvem bestemmer prisen? (ID: `monopol-og-konkurranse`)
3. **[Article]** BNP: Hva er et land verdt? (ID: `bnp`)
4. **[Article]** Arbeidsledighet: Hvorfor finner ikke alle jobb? (ID: `arbeidsledighet`)
5. **[Article]** Skatt: Hvorfor betaler vi, og hvem betaler mest? (ID: `skatt`)
6. **[Article]** Oljefondet og handlingsregelen (ID: `oljefondet`)
7. **[Article]** Globalisering: Hvorfor T-skjorta di er sydd i Bangladesh (ID: `globalisering`)

---

## 4. The Content Matrix (The Bricks)

### 1. Tilbud og etterspørsel
- **File:** `public/content/samfunnskunnskap/okonomi/tilbud-og-ettersporsel.json`
- **Pedagogical Goal:** Eleven skal forstå at prisen er der mange som vil kjøpe møter mange som
  vil selge. Når noe er sjeldent og mange vil ha det, stiger prisen. Forklar knapphet med
  vann og diamanter (verdiparadokset) og billettsalg.
- **Beats:** Hook: konsertbilletten som koster mer enn en måneds lommepenger. Conflict: hvorfor
  stiger prisen på jordbær i februar og faller i juli? Resolution: prisen er et signal som
  forteller produsenter hva de skal lage mer av.
- **Signaturidé:** Eleven skrur på tilbud og etterspørsel i et marked (f.eks. sommerjordbær) og
  ser prisen finne et nytt likevektspunkt.
- **Connections:** `/samfunnskunnskap/okonomi/produksjon`, `/samfunnskunnskap/okonomi/inflasjon-og-rente`.

### 2. Monopol og konkurranse
- **File:** `public/content/samfunnskunnskap/okonomi/monopol-og-konkurranse.json`
- **Pedagogical Goal:** Forstå hvorfor konkurranse presser prisene ned, og hva som skjer når én
  aktør eier hele markedet. Konkurransetilsynet. Vinmonopolet som et monopol staten har valgt
  med vilje (helse, ikke profitt).
- **Beats:** Hook: tre kjeder eier nesten alle dagligvarebutikkene i Norge. Conflict: er det
  dårlig for oss? Resolution: staten passer på konkurransen, men noen monopol er bevisste valg.
- **Signaturidé:** Eleven driver en kiosk i en by uten konkurrent, og så åpner en ny kiosk tvers
  over gata.
- **Connections:** `/samfunnskunnskap/okonomi/okonomiske-skoler`.
- **Faktasjekk:** hent markedsandeler fra Konkurransetilsynet eller SSB. Ikke gjett tall.

### 3. BNP
- **File:** `public/content/samfunnskunnskap/okonomi/bnp.json`
- **Pedagogical Goal:** BNP er verdien av alt et land lager på ett år. Forklar BNP per innbygger,
  og hva BNP ikke måler: frivillig arbeid, miljø, lykke, hvordan pengene fordeles.
- **Beats:** Hook: hvis du klipper naboens plen for penger øker BNP - klipper du din egen, gjør
  den ikke det. Conflict: Norge og Qatar er rike på papiret, men er livet like godt? Resolution:
  BNP er et termometer, ikke en fasit. FNs levekårsindeks (HDI) måler mer.
- **Signaturidé:** Sorter aktiviteter i «teller i BNP» og «teller ikke».
- **Connections:** `/samfunnskunnskap/demografi/km-6-levekaar-verden`, `/samfunnskunnskap/demografi/fattigdom`.

### 4. Arbeidsledighet
- **File:** `public/content/samfunnskunnskap/okonomi/arbeidsledighet.json`
- **Pedagogical Goal:** Forstå de vanligste årsakene til at folk står uten jobb: lavkonjunktur
  (bedriftene selger mindre), ny teknologi gjør en jobb unødvendig, og at det tar tid å bytte
  jobb. Forklar hva NAV gjør, og forskjellen på registrert ledighet (NAV) og ledighet målt i
  SSBs spørreundersøkelse.
- **Beats:** Hook: en fabrikk på et lite sted legger ned. Conflict: det finnes ledige jobber -
  bare ikke der, og ikke av den typen. Resolution: utdanning, flytting og støtte fra staten.
- **Signaturidé:** Følg tre personer som mister jobben av tre ulike grunner.
- **Connections:** `/samfunnskunnskap/arbeidsliv/fremtidens-arbeidsliv`, `/samfunnskunnskap/okonomi/finanskriser`.

### 5. Skatt
- **File:** `public/content/samfunnskunnskap/okonomi/skatt.json`
- **Pedagogical Goal:** Hva skatt og avgifter er, hvorfor vi betaler, og forskjellen på flat og
  progressiv skatt (jo mer du tjener, jo større del betaler du). Moms på det du kjøper.
- **Beats:** Hook: du betaler skatt allerede - hver gang du kjøper en brus. Conflict: bør de rike
  betale mer, eller er det urettferdig? Resolution: skatt er prisen for fellesskapet, og
  partiene er uenige om hvor høy den skal være.
- **Signaturidé:** Eleven fordeler et skattebudsjett eller sammenligner flat og progressiv skatt
  for tre personer med ulik lønn.
- **Connections:** `/samfunnskunnskap/arbeidsliv/lonn-og-ulikhet`. Når de finnes:
  `/samfunnskunnskap/personlig-okonomi/lonnsslippen`, `/samfunnskunnskap/velferd/hva-skatten-betaler`.
- **Avgrensning:** Den personlige lønnsslippen hører hjemme i Personlig økonomi. Her handler det
  om skatt som samfunnsordning.

### 6. Oljefondet og handlingsregelen
- **File:** `public/content/samfunnskunnskap/okonomi/oljefondet.json`
- **Pedagogical Goal:** Hvorfor Norge sparer oljepengene i et fond i utlandet, og regelen for hvor
  mye staten kan bruke hvert år (handlingsregelen: om lag 3 % av fondet). Etiske retningslinjer
  for hva fondet kan eie.
- **Beats:** Hook: hver nordmann eier en bit av nesten alle store selskaper i verden. Conflict:
  hvorfor ikke bruke pengene nå? Resolution: pengene skal vare også for barna og barnebarna dine.
- **Signaturidé:** Eleven bestemmer hvor mye av fondet staten skal bruke hvert år, og ser hva som
  skjer med fondet over 50 år.
- **Connections:** `/samfunnskunnskap/handel-og-infrastruktur/energi-og-rorledninger`,
  `/samfunnskunnskap/okonomi/petrodollaren`.
- **Avgrensning:** Komponenten `Oljepengevalget` finnes allerede. Sjekk hvor den brukes, og lag
  noe annet enn en kopi.
- **Faktasjekk:** fondets størrelse endrer seg daglig - hent tall fra nbim.no, og sett
  `factChecked`.

### 7. Globalisering
- **File:** `public/content/samfunnskunnskap/okonomi/globalisering.json`
- **Pedagogical Goal:** Forstå hvorfor varer lages der det er billigst, hva det gir (billige varer,
  jobber i fattige land) og hva det koster (dårlige arbeidsvilkår, sårbare forsyningskjeder).
- **Beats:** Hook: følg én T-skjorte fra bomullsåker til butikkhylle. Conflict: Rana Plaza-ulykken
  i Bangladesh i 2013. Resolution: hvem har ansvaret - selskapet, landet eller deg som kjøper?
- **Signaturidé:** Spor reisen til ett produkt og prisen som legges på i hvert ledd.
- **Connections:** `/samfunnskunnskap/okonomi/komparativt-fortrinn`,
  `/samfunnskunnskap/handel-og-infrastruktur/global-handel-oversikt`.

---

## 5. Avgrensning mot eksisterende innhold

- `inflasjon-og-rente`, `hvordan-penger-blir-til` og `finanskriser` dekker penger og renter. Ikke
  forklar dem på nytt - lenk.
- `handel-og-infrastruktur` dekker de fysiske handelsrutene. Globalisering-artikkelen handler om
  hvorfor produksjonen flytter, ikke om skip og kabler.

## 6. Neste steg
Nattrutinen (`.agent/workflows/daily_content_routine.md`, Lag 2b) bygger én artikkel om gangen
herfra. Artiklene registreres under det eksisterende topicet `okonomi` i manifestet.
