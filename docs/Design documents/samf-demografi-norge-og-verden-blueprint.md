# Subject Blueprint: Demografi - Norge og verden i dag
> **Status:** `Approved` (klar for nattrutinen, én artikkel om gangen)
> **Version:** 1.0

---

## 0. Hvorfor dette emnet

Demografi-emnet har de store modellene (den demografiske overgangen, befolkningspyramider,
Malthus mot Boserup), men lite om hva som skjer akkurat nå. De mest omtalte befolkningssakene i
norske nyheter - at det blir født færre barn, eldrebølgen og innvandring - mangler. Denne
blueprinten bruker modellene på virkelige land.

Denne blueprinten utvider det eksisterende emnet. Den lager ikke et nytt topic.

---

## 1. Metadata
- **Type:** Utvidelse av eksisterende `Topic`
- **Parent (Fag):** `samfunnskunnskap`
- **Topic ID:** `demografi` (finnes allerede - ikke opprett på nytt)
- **Visual Theme:** Mennesker i hverdagen: fødeavdeling, sykehjem, tomme skoleklasser på bygda,
  storbygater i Lagos og Shanghai.

---

## 2. The Narrative Arc

**The Hook:**
"I 2009 fikk norske kvinner nesten to barn hver. I dag er tallet nær 1,4. Hva skjer med et land
når det blir født for få barn til å erstatte foreldrene?"

**The Arc:**
Vi starter i Norge (få barn, mange eldre, innvandring, folk som flytter til byen) og går så ut i
verden til to motsatte ytterpunkter: Kina, som prøvde å stoppe befolkningsveksten med tvang, og
Afrika sør for Sahara, der befolkningen fortsatt vokser raskt.

---

## 3. The Learning Path (The Spine)

1. **[Article]** Hvorfor får nordmenn så få barn? (ID: `fodselstallet-i-norge`)
2. **[Article]** Eldrebølgen: Hvem skal ta vare på de gamle? (ID: `eldrebolgen`)
3. **[Article]** Innvandring til Norge i tall (ID: `innvandring-i-tall`)
4. **[Article]** Fra bygd til by: Når skolen på bygda legges ned (ID: `sentralisering`)
5. **[Article]** Ettbarnspolitikken i Kina (ID: `ettbarnspolitikken`)
6. **[Article]** Afrikas befolkningsvekst: Verdens yngste kontinent (ID: `afrikas-befolkningsvekst`)

---

## 4. The Content Matrix (The Bricks)

### 1. Hvorfor får nordmenn så få barn?
- **File:** `public/content/samfunnskunnskap/demografi/fodselstallet-i-norge.json`
- **Pedagogical Goal:** Forklar fruktbarhetstall (hvor mange barn hver kvinne får i snitt), at 2,1
  trengs for at befolkningen skal holde seg lik uten innvandring, og de vanligste forklaringene:
  folk får barn senere, boligpriser, utdanning, valgfrihet.
- **Beats:** Hook: fødselstallet er lavere enn noen gang. Conflict: Norge har barnehager og lang
  foreldrepermisjon - likevel faller tallet. Resolution: ingen vet sikkert hvorfor, og det er
  uenighet om det er et problem.
- **Signaturidé:** Eleven endrer fruktbarhetstallet og ser befolkningspyramiden om 50 år.
- **Connections:** `/samfunnskunnskap/demografi/befolkningspyramider`,
  `/samfunnskunnskap/demografi/den-demografiske-overgangen`.
- **Faktasjekk:** hent siste fruktbarhetstall fra SSB og sett `factChecked`.

### 2. Eldrebølgen
- **File:** `public/content/samfunnskunnskap/demografi/eldrebolgen.json`
- **Pedagogical Goal:** Flere eldre og færre i arbeid betyr flere som trenger pleie og pensjon, og
  færre som betaler skatt. Forklar forsørgerbyrden (hvor mange i jobb det er per pensjonist) og
  mangelen på helsepersonell.
- **Beats:** Hook: et sykehjem som ikke finner nok sykepleiere. Conflict: hvem skal betale og hvem
  skal gjøre jobben? Resolution: løsninger som diskuteres - jobbe lenger, innvandring, teknologi.
- **Signaturidé:** Antall i arbeid per pensjonist fra 1970 til 2060, som eleven kan bla gjennom.
- **Connections:** `/samfunnskunnskap/mennesket-kultur-samfunn/robotene-kommer`. Når den finnes:
  `/samfunnskunnskap/velferd/kan-velferdsstaten-vare`.

### 3. Innvandring til Norge i tall
- **File:** `public/content/samfunnskunnskap/demografi/innvandring-i-tall.json`
- **Pedagogical Goal:** Lær eleven å lese SSB-tall om innvandring: hvem kommer, hvorfor (arbeid,
  familie, flukt, utdanning), og forskjellen på innvandrer og norskfødt med innvandrerforeldre.
  Kildekritikk av tall i debatten.
- **Beats:** Hook: to politikere bruker de samme tallene og sier det motsatte. Conflict: hvordan
  kan begge ha rett? Resolution: definisjonene og utvalget avgjør hva tallene viser.
- **Signaturidé:** Eleven velger et utvalg (hele landet, én kommune, én aldersgruppe) og ser
  hvordan bildet endrer seg.
- **Connections:** `/historie/norge-i-moderne-tid/innvandringen-til-norge` (historien),
  `/samfunnskunnskap/demografi/migrasjon-push-pull` (hvorfor folk flytter),
  `/samfunnskunnskap/eksamen/km-1-metode`.
- **Avgrensning:** Historien om innvandringen ligger allerede i historie. Denne artikkelen handler
  om tallene i dag og hvordan de leses.

### 4. Fra bygd til by
- **File:** `public/content/samfunnskunnskap/demografi/sentralisering.json`
- **Pedagogical Goal:** Forklar sentralisering (folk flytter fra bygd til by), hvorfor det skjer,
  og hva det gjør med små steder: skoler, butikker og legekontor som legges ned. Distriktspolitikk.
- **Beats:** Hook: den siste eleven i en bygdeskole. Conflict: skal staten bruke penger på å holde
  liv i små steder? Resolution: ulike syn i politikken.
- **Signaturidé:** En bygd der eleven ser hva som skjer når innbyggertallet faller under ulike
  grenser.
- **Connections:** `/samfunnskunnskap/demografi/urbanisering` (verden), `/samfunnskunnskap/styringsformer/stortinget`.
- **Avgrensning:** `urbanisering` handler om verden. Denne handler om Norge.

### 5. Ettbarnspolitikken i Kina
- **File:** `public/content/samfunnskunnskap/demografi/ettbarnspolitikken.json`
- **Pedagogical Goal:** Hva skjedde da en stat bestemte hvor mange barn folk fikk (fra rundt 1980
  til 2015)? Tvang, skjev kjønnsbalanse og en befolkning som nå eldes raskt.
- **Beats:** Hook: en hel generasjon uten søsken. Conflict: virket det, og til hvilken pris?
  Resolution: Kina oppfordrer nå folk til å få flere barn, men folk vil ikke.
- **Signaturidé:** Sammenlign Kinas befolkningspyramide før, under og etter.
- **Connections:** `/historie/kinas-historie/kina-supermakt`,
  `/samfunnskunnskap/demografi/malthus-vs-boserup`.

### 6. Afrikas befolkningsvekst
- **File:** `public/content/samfunnskunnskap/demografi/afrikas-befolkningsvekst.json`
- **Pedagogical Goal:** Afrika sør for Sahara har den yngste befolkningen i verden. Forklar hvorfor
  veksten fortsatt er høy (hvor langt landene har kommet i den demografiske overgangen) og hva
  det kan bety: mange unge som trenger jobb, men også en stor arbeidsstyrke.
- **Beats:** Hook: halvparten av innbyggerne i Niger er barn. Conflict: problem eller mulighet?
  Resolution: utdanning for jenter er den faktoren som oftest henger sammen med lavere fødselstall.
- **Signaturidé:** Sammenlign medianalderen i Niger, Nigeria, Norge og Japan.
- **Connections:** `/samfunnskunnskap/demografi/den-demografiske-overgangen`,
  `/samfunnskunnskap/demografi/fattigdom`.
- **Faktasjekk:** bruk FNs World Population Prospects eller Verdensbanken. Unngå å framstille
  Afrika som ett land.

---

## 5. Neste steg
Nattrutinen (Lag 2b) bygger én artikkel om gangen. Registreres under det eksisterende topicet
`demografi`.
