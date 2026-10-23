# Subject Blueprint: Personlig økonomi
> **Status:** `Approved` (klar for nattrutinen, én artikkel om gangen)
> **Version:** 1.0

---

## 0. Hvorfor dette emnet

Om tre-fire år får elevene sin første lønnsslipp, sitt første kredittkorttilbud og sin første
«betal om 30 dager»-knapp. Ingen skolebok har vist dem tallene på innsiden. Emnet gir dem
verktøyene før de trenger dem, og knytter dem til samfunnsfagets store spørsmål om skatt,
forbruk og hvem som tjener på at unge låner.

Emnet er et nytt topic. Simulatoren i `pengeliv-blueprint.md` (`/oving/pengeliv`) er planlagt,
men ikke bygget. Når den finnes, bør artiklene lenke til den. Fram til da: ikke lenk dit.

---

## 1. Metadata
- **Type:** `Topic` (Emne)
- **Parent (Fag):** `samfunnskunnskap`
- **Topic ID:** `personlig-okonomi`
- **Title:** Personlig økonomi: Pengene dine
- **Visual Theme:** Ungdom i hverdagen: mobilskjerm med bank-app, deltidsjobb i kiosk,
  hybelkjøkken, kassa på butikken. Varmt, nært, aldri stock-aktig glatt.

---

## 2. The Narrative Arc

**The Hook:**
"Du har fått sommerjobb og tjener 20 000 kroner. Hvorfor kommer det bare 15 000 inn på kontoen?
Og hvorfor vil tre ulike selskaper gi deg kreditt før du har betalt for noe som helst?"

**The Arc:**
Vi følger pengene fra de kommer inn (lønnsslippen), gjennom det du bruker dem på (budsjett),
til fellene (forbrukslån, kjøp nå - betal senere, svindel) og til slutt det som får pengene til å
vokse (sparing og rentes rente). Siste artikkel handler om rettighetene dine som forbruker.

---

## 3. The Learning Path (The Spine)

1. **[Article]** Lønnsslippen: Hvor blir pengene av? (ID: `lonnsslippen`)
2. **[Article]** Budsjett: Å velge hva pengene skal gå til (ID: `budsjett`)
3. **[Article]** Kreditt og forbrukslån: Når lån blir dyrt (ID: `kreditt-og-forbrukslan`)
4. **[Article]** Kjøp nå, betal senere (ID: `kjop-na-betal-senere`)
5. **[Article]** Sparing og rentes rente (ID: `sparing-og-rentes-rente`)
6. **[Article]** Svindel på nett: Slik lurer de deg (ID: `svindel`)
7. **[Article]** Dine rettigheter som forbruker (ID: `forbrukerrettigheter`)

---

## 4. The Content Matrix (The Bricks)

### 1. Lønnsslippen
- **File:** `public/content/samfunnskunnskap/personlig-okonomi/lonnsslippen.json`
- **Pedagogical Goal:** Brutto og netto lønn, skattekort, frikort for unge med lav inntekt,
  feriepenger og trygdeavgift. Eleven skal kunne lese en lønnsslipp linje for linje.
- **Beats:** Hook: sommerjobben og kontoen som viser mindre enn avtalt. Conflict: er det trukket for
  mye? Resolution: frikortet, og pengene du kan få igjen på skattemeldingen.
- **Signaturidé:** En lønnsslipp der eleven klikker på hver linje og får den forklart.
- **Connections:** Når den finnes: `/samfunnskunnskap/okonomi/skatt`.
- **Faktasjekk:** frikortgrensen endres hvert år. Hent fra skatteetaten.no og sett `factChecked`.

### 2. Budsjett
- **File:** `public/content/samfunnskunnskap/personlig-okonomi/budsjett.json`
- **Pedagogical Goal:** Faste og variable utgifter, buffer, og at et budsjett handler om valg.
  Bruk SIFOs referansebudsjett (hva det koster å leve) som kilde.
- **Beats:** Hook: første måned på hybel. Conflict: pengene tar slutt den 20. Resolution: et
  budsjett er en plan, ikke en straff.
- **Signaturidé:** Eleven fordeler en månedslønn på hybel, og så kommer en uventet regning.
- **Connections:** `/samfunnskunnskap/okonomi/inflasjon-og-rente`.

### 3. Kreditt og forbrukslån
- **File:** `public/content/samfunnskunnskap/personlig-okonomi/kreditt-og-forbrukslan.json`
- **Pedagogical Goal:** Hva effektiv rente er, hvorfor forbrukslån og kredittkort er så dyre, og
  hvordan gjeld kan vokse når du bare betaler minstebeløpet. Gjeldsregisteret.
- **Beats:** Hook: en gaming-PC til 15 000 kroner på kredittkort. Conflict: etter to år har du
  betalt mye mer enn PC-en kostet. Resolution: regel - lån aldri til ting som er borte før lånet
  er betalt.
- **Signaturidé:** Eleven betaler ned kredittkortgjeld med minstebeløp eller med fast beløp og ser
  totalprisen.
- **Connections:** `/samfunnskunnskap/okonomi/hvordan-penger-blir-til`.

### 4. Kjøp nå, betal senere
- **File:** `public/content/samfunnskunnskap/personlig-okonomi/kjop-na-betal-senere.json`
- **Pedagogical Goal:** Hvordan delbetaling og faktura i nettbutikker fungerer, gebyrene når du
  betaler for sent, og hvorfor butikkene tjener på at du handler mer. Inkasso.
- **Beats:** Hook: tre små kjøp, tre fakturaer, én glemt. Conflict: 200 kroner blir 1 000.
  Resolution: hvordan du holder oversikt.
- **Signaturidé:** Følg én glemt faktura gjennom purring, inkassovarsel og inkasso.
- **Connections:** `/samfunnskunnskap/mennesket-kultur-samfunn/kjendismakt` (påvirkning til å kjøpe).
- **Faktasjekk:** gebyrsatser er regulert - hent fra Finanstilsynet eller Forbrukerrådet.

### 5. Sparing og rentes rente
- **File:** `public/content/samfunnskunnskap/personlig-okonomi/sparing-og-rentes-rente.json`
- **Pedagogical Goal:** Rentes rente, forskjellen på sparekonto, fond og aksjer (risiko), og
  hvorfor det betyr så mye å begynne tidlig. BSU for unge. Ikke investeringsråd - forklar
  mekanismene.
- **Beats:** Hook: to venner sparer like mye, men den ene starter ti år tidligere. Conflict: hvorfor
  ender den ene med nesten dobbelt så mye? Resolution: tid er den viktigste ingrediensen.
- **Signaturidé:** En vekstkurve der eleven velger startalder, beløp og rente.
- **Connections:** `/samfunnskunnskap/okonomi/inflasjon-og-rente`.

### 6. Svindel på nett
- **File:** `public/content/samfunnskunnskap/personlig-okonomi/svindel.json`
- **Pedagogical Goal:** De vanligste svindeltypene mot unge: falske nettbutikker, «pengemuldyr»
  (noen låner kontoen din for å flytte penger), falske SMS-er fra bank eller Posten, og
  investeringssvindel på sosiale medier. Hvordan du sjekker og hva du gjør når det har skjedd.
- **Beats:** Hook: «Kan du ta imot 5 000 kroner på kontoen din og sende dem videre? Du får 500.»
  Conflict: det er straffbart, selv om du ikke visste det. Resolution: varseltegnene.
- **Signaturidé:** Ekte eller falsk? Eleven vurderer meldinger og nettbutikker.
- **Connections:** `/samfunnskunnskap/mennesket-kultur-samfunn/km-10-digitale-spor`. Når den finnes:
  `/samfunnskunnskap/rettsstaten/ungdom-og-kriminalitet`.
- **Kilder:** Politiet, Økokrim, bankenes egne svindelsider, Forbrukerrådet.

### 7. Dine rettigheter som forbruker
- **File:** `public/content/samfunnskunnskap/personlig-okonomi/forbrukerrettigheter.json`
- **Pedagogical Goal:** Angrerett ved netthandel, reklamasjon (å klage på en vare som går i
  stykker), og hvem du kan klage til (Forbrukerrådet, Forbrukerklageutvalget).
- **Beats:** Hook: mobilen slutter å virke etter 13 måneder, og butikken sier garantien er ute.
  Conflict: har de rett? Resolution: reklamasjonsretten er lengre enn garantien.
- **Signaturidé:** Eleven møter tre klagesituasjoner og finner riktig regel.
- **Connections:** `/samfunnskunnskap/styringsformer/km-14-lover-normer`.
- **Faktasjekk:** reklamasjonsfrister står i forbrukerkjøpsloven. Sjekk lovdata.no.

---

## 5. Neste steg
- Første artikkel som bygges oppretter topicet `personlig-okonomi` under `samfunnskunnskap` i
  manifestet (id, title, lessons). Sjekk at IDen ikke finnes fra før.
- Nattrutinen (Lag 2b) bygger én artikkel om gangen.
