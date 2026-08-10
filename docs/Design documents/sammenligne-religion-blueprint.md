# Subject Blueprint: Sammenligne religion

> **Status:** `Draft`
> **Version:** 1.0
> **Opprettet:** 2026-08-10
> **Omfang:** Flerårsprosjekt, bygges i faser. Denne blueprinten er komplett; ingen filer er bygget ennå.

---

## 1. Metadata

* **Type:** `Topic` (Emne)
* **Parent (Fag):** `krle`
* **Topic ID:** `sammenligning`
* **Title:** Sammenligne religion
* **Rute:** `/krle/sammenligning` → artikler på `/krle/sammenligning/<slug>`
* **Filmappe:** `public/content/krle/sammenligning/`
* **Målgruppe:** 10. trinn (LK20, RLE01-03)
* **Søsterdokument:** `docs/KRLE_OPPRUSTNING.md` — arbeidslista for å løfte de eksisterende KRLE-artiklene opp på plan_article-standard. De to dokumentene bygges i takt; se §9.4.
* **Visual Theme:** `Ni tråder, ett vev` — lys glassbakgrunn (`bg-slate-50`) med ni faste fargetråder hentet fra `public/data/religion/*.json`, slik at samme religion har samme farge overalt i boka.

| Religion | Farge | Gruppe |
|---|---|---|
| Jødedom | `#3b82f6` | Abrahamittiske røtter |
| Kristendom | `#6366f1` | Abrahamittiske røtter |
| Islam | `#10b981` | Abrahamittiske røtter |
| Bahá'í | `#14b8a6` | Nyere bevegelser |
| Mormonisme | `#8b5cf6` | Nyere bevegelser |
| Jehovas vitner | `#0ea5e9` | Nyere bevegelser |
| Hinduisme | `#ec4899` | Indiske tradisjoner |
| Buddhisme | `#f59e0b` | Indiske tradisjoner |
| Sikhisme | `#ff9933` | Indiske tradisjoner |

---

## 2. The Narrative Arc

> *Hvilken historie forteller vi?*

**The Hook:**
«Ni religioner. Ett spørsmål om gangen. Hvor mye ligner egentlig svarene?»

**The Arc:**
Resten av KRLE-faget er bygget **per religion** — eleven leser om kristendom, så om islam, så om buddhisme. Dette emnet snur aksen 90 grader. Her tar vi **ett menneskelig spørsmål om gangen** og lar alle ni tradisjonene svare i samme rom.

Buen går fra det **kosmiske** (hvor kommer alt fra, hvem er Gud), gjennom det **levde** (bønn, riter, høytider, mat, klær), til det **etiske og eksistensielle** (hva er et godt liv, hvorfor finnes det vondt). Eleven starter med å møte forskjeller som virker enorme, og oppdager underveis at menneskene stiller de samme spørsmålene — de svarer bare ulikt.

**Emosjonell bue:** Overraskelse → Gjenkjennelse → Forvirring («men de sier jo det motsatte!») → Mønster → Egen stemme.

---

### 2.1 Forholdet til `/krle/sammenlign` (viktig arkitekturvalg)

Boka har allerede en **maskin-sammenligning**: `scripts/generate-comparison-manifest.mjs` scanner `comparison_tags` i per-religion-artiklene og bygger `/krle/sammenlign/tema/:tag`, som stabler de eksisterende artiklene side ved side.

Det nye emnet erstatter ikke dette — det leverer det maskinen ikke kan:

| | `/krle/sammenlign/tema/:tag` | `/krle/sammenligning/<slug>` (ny) |
|---|---|---|
| Kilde | Auto-generert fra `comparison_tags` | Skrevet av et menneske |
| Innhold | Rå artikler ved siden av hverandre | Tolkning, mønster, kontrast, refleksjon |
| Rolle | Oppslagsverk / rådata | Undervisningstekst |

**Teknisk sikkerhet:** generatoren scanner kun `public/content/krle/religion/*/*/artikkel.json`. Den nye mappa `public/content/krle/sammenligning/` ligger utenfor det mønsteret, så generatoren berøres ikke. Hver ny artikkel får en «Se rådataene»-lenke til sin tilsvarende tema-side der en slik finnes.

---

### 2.2 Toneregler (gjelder alt innhold i emnet)

1. **Beskriv, ikke vurder.** «Muslimer ber fem ganger om dagen», ikke «Islam har et strengt bønnesystem».
2. **Sammenligning er ikke rangering.** Ingen tradisjon skal fremstå som mer «logisk», «moderne» eller «primitiv» enn en annen.
3. **Ulike størrelser skal ikke fremstilles som like store.** Jehovas vitner og mormonisme er kristne trossamfunn med noen millioner medlemmer; kristendom og islam har milliarder. Gruppeinndelingen i tabellen over skal brukes konsekvent — aldri ni likestilte kolonner uten kontekst.
4. **Indre mangfold skal nevnes.** «Mange hinduer …», ikke «Hinduer …». Hver artikkel skal minst ett sted si at det finnes ulike syn innad i tradisjonen.
5. **Språk for 14-åringer.** Fagbegreper forklares første gang de brukes. Alltid `å`, `ø`, `æ`.

---

## 3. The Learning Path (The Spine)

De 17 temaene i prioritert byggerekkefølge, pluss stiene. Kolonnen «Kilder» = hvor mange av de ni religionene som har en per-religion-artikkel å lenke til, og hvilken kvalitet de faktisk holder (`ferdig / halv / stub`, målt 2026-08-10 — se `docs/KRLE_OPPRUSTNING.md`). Kolonnen «Samisk» merker temaene der samisk religion kommer inn som gjestestemme.

| # | Slug | Tittel | Smart-dimensjon | Kilder | Kvalitet | Samisk | LK20 |
|---|---|---|---|---|---|:-:|---|
| 1 | `skapelse` | Hvor kommer alt fra? | Narrative | 2/9 | 0F / 1H / 1S | ✅ | 1, 13 |
| 2 | `gudsbilde` | Én, mange eller ingen gud? | Doctrinal | 8/9 | 0F / 1H / 7S | | 1, 6 |
| 3 | `bonn` | Å snakke med det hellige | Ritual + Experiential | 8/9 | 0F / 1H / 7S | | 1, 13 |
| 4 | `overgangsriter` | Fra vugge til grav | Ritual | 9/9 | 1F / 1H / 7S | | 1, 13 |
| 5 | `doden` | Hva skjer når vi dør? | Doctrinal + Narrative | 8/9 | 1F / 1H / 7S | ✅ | 13 |
| 6 | `frelse` | Målet med det hele | Doctrinal | 8/9 | 0F / 1H / 7S | | 6, 13 |
| 7 | `hellige-tekster` | Bøkene som styrer liv | Narrative + Doctrinal | 9/9 | 0F / 1H / 8S | | 6, 7 |
| 8 | `grunnleggere` | Menneskene bak | Narrative | 9/9 | 0F / 1H / 8S | | 10 |
| 9 | `etikk-og-leveregler` | Hva er et godt liv? | Ethical | 0/9 | — | ✅ | 10, 15 |
| 10 | `hoytider` | Den hellige kalenderen | Ritual | delvis¹ | 1F | ✅ | 1, 9 |
| 11 | `hellige-rom` | Rommene vi bygger for det hellige | Material | 0/9 | — | ✅ | 1 |
| 12 | `symboler-og-klaer` | Tro du kan se | Material | delvis¹ | 1F | | 1, 9 |
| 13 | `mat-og-renhet` | Hva får du spise? | Ritual + Ethical | delvis¹ | 1F | | 1 |
| 14 | `kjonn-og-roller` | Kjønn, roller og likeverd | Social + Ethical | 0/9 | — | | 8, 12 |
| 15 | `ledelse-og-fellesskap` | Hvem bestemmer? | Social | 0/9 | — | | 1, 4 |
| 16 | `pilegrim` | Reisen til det hellige | Material + Experiential | 0/9 | — | | 1 |
| 17 | `lidelse` | Hvorfor finnes det vondt? | Doctrinal + Experiential | 0/9 | — | ✅ | 13, 15 |

¹ Har allerede en tverrgående artikkel under `krle/religion-og-kultur/` (`hoytider-og-kultur`, `symboler-og-klaer`, `mat-og-religion`). Disse skal **ikke** dupliseres — se §9.3.

> **Advarsel om kildekvalitet.** Kolonnen «Kilder» sier bare at det *finnes* en artikkel, ikke at den duger. Kvalitetskolonnen viser realiteten: nesten alle kildeartiklene er stubber på 60–90 ord uten komponenter eller kilder. Et tema regnes derfor ikke som ferdig før kildeartiklene er opprustet — se koblingen i §9.4 og arbeidslista i `docs/KRLE_OPPRUSTNING.md`.

**Læringsstier (registreres under `tools[]`, ikke `lessons[]`):**

| Sti-ID | Tittel | Type | Bygges i |
|---|---|---|---|
| `skapelse-sti` | Før alt fantes | Fordypning | Fase 2 |
| `sammenligning-sti` | Å se med to øyne | Metode | Fase 4 |
| `gudsbilde-sti` | Hvem er Gud? | Fordypning | Fase 5 |
| `bonn-sti` | Ordene vi sender oppover | Fordypning | Fase 5 |
| `doden-sti` | Den siste døra | Fordypning | Fase 6 |

---

### 3.1 Kildedekning per religion (faktisk status på disk)

| Artikkel-ID | jødedom | kristendom | islam | bahá'í | mormonisme | jeh. vitner | hinduisme | buddhisme | sikhisme |
|---|---|---|---|---|---|---|---|---|---|
| `intro` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️² |
| `grunnleggere` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `hellige-tekster` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `sentrale-trekk` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `overgangsriter` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `bonn` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `frelse` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `gudsbilde` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `skapelse` | ❌ | ✅ | ⚠️³ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

² Fila ligger i `sikhisme/introduksjon/`, men manifestet registrerer lesson-ID `intro`. Lenken er sannsynligvis brutt — se §9.1.
³ `public/content/krle/religion/islam/skapelse/artikkel.json` finnes på disk, men mangler i `manifest.json`. Artikkelen er usynlig i navigasjonen, men plukkes opp av comparison-manifestet — se §9.1.

---

## 4. The Content Matrix (The Bricks)

Alle filer: `public/content/krle/sammenligning/<slug>.json`

### Article 1: Hvor kommer alt fra? (`skapelse`) — PILOT

* **File:** `public/content/krle/sammenligning/skapelse.json`
* **Dimension:** `narrative` · **LK20:** 1, 13 · **Kilder:** kristendom ✅, islam ⚠️ (må registreres)
* **Pedagogical Goal:** Eleven skal kunne beskrive hvordan ulike tradisjoner forklarer verdens opphav, og forklare at et univers med en begynnelse og et univers uten begynnelse gir helt ulike svar på hva mennesket er til for.
* **Comparison Hook:** «Bibelen bruker seks dager på å skape verden. Hinduismen bruker ikke dager i det hele tatt — der har universet aldri begynt, og det kommer aldri til å slutte.»
* **The Narrative Beats:**
  * [ ] **The Hook:** To univers med helt ulik form — linje mot sirkel.
  * [ ] **The Conflict:** Hvis verden har en begynnelse, har den en hensikt og en skaper. Hvis den ikke har det, hva da?
  * [ ] **The Resolution:** Alle fortellingene svarer på det samme: hvorfor er vi her, og hva skal vi gjøre med det?
* **Signaturkomponent:** `SkapelsesVeven`
* **Livssynshumanisme:** ja — «Og de som ikke tror?» (Big Bang som fortelling uten hensikt)
* **Gjestestemme samisk:** ja — verden i tre lag, og landskapet selv som besjelet
* **Merknad:** Krever nye kildeartikler for de øvrige religionene. Bygges i fase 2.

### Article 2: Én, mange eller ingen gud? (`gudsbilde`)

* **File:** `public/content/krle/sammenligning/gudsbilde.json`
* **Dimension:** `doctrinal` · **LK20:** 1, 6 · **Kilder:** 8/9
* **Pedagogical Goal:** Eleven skal kunne bruke fagbegrepene monoteisme, polyteisme, panteisme og ikke-teisme presist, og plassere de ni tradisjonene i forhold til hverandre.
* **Comparison Hook:** «Buddhismen har ingen skapergud. Hinduismen har millioner av guder — som mange hinduer sier er én. Hvordan kan begge deler stemme?»
* **The Narrative Beats:**
  * [ ] **The Hook:** Er «hvor mange guder?» i det hele tatt riktig spørsmål?
  * [ ] **The Conflict:** Bildeforbud mot ikoner mot gudestatuer — hva sier det om gudsbildet?
  * [ ] **The Resolution:** To akser, ikke én: antall *og* nærhet.
* **Signaturkomponent:** `GudsbildeAksen`

### Article 3: Å snakke med det hellige (`bonn`)

* **File:** `public/content/krle/sammenligning/bonn.json`
* **Dimension:** `ritual` + `experiential` · **LK20:** 1, 13 · **Kilder:** 8/9
* **Pedagogical Goal:** Eleven skal kunne sammenligne bønn langs fire akser — retning, tid, kropp og ord — og forklare hvorfor formen betyr noe for den som ber.
* **Comparison Hook:** «Halvannen milliard mennesker snur seg mot det samme punktet på jorda fem ganger om dagen. En buddhist som mediterer, snur seg ikke mot noe.»
* **The Narrative Beats:**
  * [ ] **The Hook:** Kroppen vet hvor bønnen går.
  * [ ] **The Conflict:** Fastsatte ord til fastsatt tid, mot fri samtale når du vil — hvilken er «ekte» bønn?
  * [ ] **The Resolution:** Bønn er å sette seg selv i forhold til noe større. Formen er språket.
* **Signaturkomponent:** `BonneKompasset` + mikrospill `VendMotMekka3D`

### Article 4: Fra vugge til grav (`overgangsriter`)

* **File:** `public/content/krle/sammenligning/overgangsriter.json`
* **Dimension:** `ritual` · **LK20:** 1, 13 · **Kilder:** 9/9 (full dekning)
* **Pedagogical Goal:** Eleven skal kunne forklare hva en overgangsrite gjør — den flytter et menneske fra én status til en annen — og gjenkjenne mønsteret i egne og andres liv.
* **Comparison Hook:** «Konfirmasjon, bar mitzvah, amrit sanskar, upanayana. Fire navn på det samme øyeblikket: da du sluttet å være barn.»
* **The Narrative Beats:**
  * [ ] **The Hook:** Fire livsfaser som går igjen overalt.
  * [ ] **The Conflict:** Hva skjer når riten blir tradisjon uten tro? (Kulturkristendom, borgerlig konfirmasjon.)
  * [ ] **The Resolution:** Riter er samfunnets måte å si «nå er du noe annet».
* **Signaturkomponent:** `LivetsTrapp`
* **Livssynshumanisme:** ja — Human-Etisk Forbunds navnefest, konfirmasjon og gravferd

### Article 5: Hva skjer når vi dør? (`doden`)

* **File:** `public/content/krle/sammenligning/doden.json`
* **Dimension:** `doctrinal` + `narrative` · **LK20:** 13 · **Kilder:** 8/9 (via `doden`-taggen på overgangsriter-artiklene)
* **Pedagogical Goal:** Eleven skal kunne skille mellom lineære og sykliske etterlivsforestillinger og forklare hva hver av dem gjør med synet på rettferdighet.
* **Comparison Hook:** «I noen religioner dør du én gang og dømmes. I andre dør du utallige ganger, og hver gang tar du med deg regningen fra sist.»
* **The Narrative Beats:**
  * [ ] **The Hook:** Dør du én gang eller mange?
  * [ ] **The Conflict:** Dom mot karma — hvem holder regnskapet?
  * [ ] **The Resolution:** Begge svarer på: er urettferdighet det siste ordet?
* **Signaturkomponent:** `EtterlivsKartet`
* **Livssynshumanisme:** ja
* **Gjestestemme samisk:** ja — de dødes rike under bakken, og reglene for hvordan graven skal legges

### Article 6: Målet med det hele (`frelse`)

* **File:** `public/content/krle/sammenligning/frelse.json`
* **Dimension:** `doctrinal` · **LK20:** 6, 13 · **Kilder:** 8/9
* **Pedagogical Goal:** Eleven skal kunne forklare forskjellen mellom å bli *reddet av noen* og å *frigjøre seg selv*, og bruke begrepene nåde, karma, moksha og nirvana riktig.
* **Comparison Hook:** «Luther sa at du ikke kan gjøre noe for å bli frelst. Buddha sa at ingen andre enn du selv kan gjøre det.»
* **The Narrative Beats:**
  * [ ] **The Hook:** Frelse fra hva, egentlig?
  * [ ] **The Conflict:** Nåde mot innsats — tro eller gjerninger?
  * [ ] **The Resolution:** Målet former veien: paradis krever noe annet enn utslokning.
* **Signaturkomponent:** `FrelsensStige`

### Article 7: Bøkene som styrer liv (`hellige-tekster`)

* **File:** `public/content/krle/sammenligning/hellige-tekster.json`
* **Dimension:** `narrative` + `doctrinal` · **LK20:** 6, 7 · **Kilder:** 9/9
* **Pedagogical Goal:** Eleven skal kunne sammenligne hvordan tekster får autoritet, og vurdere kilder kritisk — også religiøse.
* **Comparison Hook:** «Koranen ble diktert. Bibelen ble samlet. Vedaene ble husket i tusen år før noen skrev dem ned. Guru Granth Sahib er ikke en bok — den er en levende guru.»
* **The Narrative Beats:**
  * [ ] **The Hook:** Hvem bestemte hva som kom med?
  * [ ] **The Conflict:** Bokstavtro mot tolkning.
  * [ ] **The Resolution:** En tekst er hellig fordi et fellesskap behandler den som hellig.
* **Signaturkomponent:** `TekstensReise`

### Article 8: Menneskene bak (`grunnleggere`)

* **File:** `public/content/krle/sammenligning/grunnleggere.json`
* **Dimension:** `narrative` · **LK20:** 10 · **Kilder:** 9/9
* **Pedagogical Goal:** Eleven skal kunne sammenligne etiske ideer fra sentrale skikkelser og se hvordan fortellingen om grunnleggeren former religionen.
* **Comparison Hook:** «Jesus ble dyrket som Gud. Muhammed nektet å bli det. Buddha sa at spørsmålet ikke var viktig.»
* **The Narrative Beats:**
  * [ ] **The Hook:** Fire menn som forandret verden ved å si nei til makten sin tid.
  * [ ] **The Conflict:** Profet, lærer eller Gud — hva var de?
  * [ ] **The Resolution:** Etikken deres overlevde dem.
* **Signaturkomponent:** `StemmeneFraFortiden`

### Article 9: Hva er et godt liv? (`etikk-og-leveregler`)

* **File:** `public/content/krle/sammenligning/etikk-og-leveregler.json`
* **Dimension:** `ethical` · **LK20:** 10, 15 · **Kilder:** 0/9 (hentes fra `sentrale-trekk` og `ethical`-dimensjonen i `public/data/religion/`)
* **Comparison Hook:** «Nesten alle religioner har funnet fram til den samme setningen, uavhengig av hverandre: gjør mot andre det du vil at de skal gjøre mot deg.»
* **Signaturkomponent:** `GyllenRegelVeven`
* **Livssynshumanisme:** ja
* **Gjestestemme samisk:** ja — ta bare det du trenger, og gi tilbake til stedet
* **Kobling:** lenker til `krle/etikk/`-artiklene (pliktetikk, utilitarisme, dygdsetikk)

### Article 10: Den hellige kalenderen (`hoytider`)

* **File:** `public/content/krle/sammenligning/hoytider.json`
* **Dimension:** `ritual` · **LK20:** 1, 9 · **Kilder:** eksisterende `krle/religion-og-kultur/hoytider-og-kultur`
* **Comparison Hook:** «Måneåret er elleve dager kortere enn solåret. Derfor flytter ramadan seg gjennom årstidene, mens julen står stille.»
* **Signaturkomponent:** `HelligKalender` (sirkulært årshjul, sol- mot måneår)
* **Gjestestemme samisk:** ja — de åtte årstidene og reinens år, en kalender styrt av dyret og lyset

### Article 11: Rommene vi bygger for det hellige (`hellige-rom`)

* **File:** `public/content/krle/sammenligning/hellige-rom.json`
* **Dimension:** `material` · **LK20:** 1 · **Kilder:** 0/9
* **Comparison Hook:** «En moské har ingen bilder. En ortodoks kirke er dekket av dem. Begge vil vise deg det samme.»
* **Signaturkomponent:** gjenbruk av mikrospill (`Bedehuset3D`, `LalibelaKirke3D`, `TempeletsRenselse3D`) + `RommetsGrammatikk`
* **Gjestestemme samisk:** ja — sieidi og hellige fjell. Det sterkeste poenget i temaet: en helligdom man ikke bygger, men finner.

### Article 12: Tro du kan se (`symboler-og-klaer`)

* **File:** `public/content/krle/sammenligning/symboler-og-klaer.json`
* **Dimension:** `material` · **LK20:** 1, 9 · **Kilder:** eksisterende `krle/religion-og-kultur/symboler-og-klaer`
* **Comparison Hook:** «Korset var et henrettelsesredskap. Nå henger det rundt halsen på folk som aldri har vært i en kirke.»
* **Signaturkomponent:** `SymbolLeksikon`

### Article 13: Hva får du spise? (`mat-og-renhet`)

* **File:** `public/content/krle/sammenligning/mat-og-renhet.json`
* **Dimension:** `ritual` + `ethical` · **LK20:** 1 · **Kilder:** eksisterende `krle/religion-og-kultur/mat-og-religion`
* **Comparison Hook:** «For en hindu er kua hellig. For en jøde er grisen uren. For en buddhist handler det ikke om dyret, men om lidelsen.»
* **Signaturkomponent:** `MatbordetsRegler`

### Article 14: Kjønn, roller og likeverd (`kjonn-og-roller`)

* **File:** `public/content/krle/sammenligning/kjonn-og-roller.json`
* **Dimension:** `social` + `ethical` · **LK20:** 8, 12 · **Kilder:** 0/9
* **Comparison Hook:** «Den norske kirke fikk sin første kvinnelige prest i 1961. Sikhismen slo fast likeverd mellom kjønnene i 1499. Praksis og prinsipp er ikke det samme.»
* **Signaturkomponent:** `RolleneOverTid` (tidslinje med prinsipp mot praksis i to spor)
* **Merknad:** Faglig krevende. Krever ekstra kildearbeid og streng anvendelse av tonereglene i §2.2.

### Article 15: Hvem bestemmer? (`ledelse-og-fellesskap`)

* **File:** `public/content/krle/sammenligning/ledelse-og-fellesskap.json`
* **Dimension:** `social` · **LK20:** 1, 4 · **Kilder:** 0/9
* **Comparison Hook:** «Katolikkene har én pave. Islam har ingen. Hvem avgjør da hva som er riktig?»
* **Signaturkomponent:** `MaktensForm` (pyramide mot nettverk mot ingen struktur)

### Article 16: Reisen til det hellige (`pilegrim`)

* **File:** `public/content/krle/sammenligning/pilegrim.json`
* **Dimension:** `material` + `experiential` · **LK20:** 1 · **Kilder:** 0/9
* **Comparison Hook:** «To millioner mennesker går rundt den samme steinen samtidig. Andre går alene til Nidaros i tre uker.»
* **Signaturkomponent:** `PilegrimsKartet` (gjenbruker `d3-geo`-oppsettet fra `src/components/atlas/`)

### Article 17: Hvorfor finnes det vondt? (`lidelse`)

* **File:** `public/content/krle/sammenligning/lidelse.json`
* **Dimension:** `doctrinal` + `experiential` · **LK20:** 13, 15 · **Kilder:** 0/9
* **Comparison Hook:** «Hvis Gud er god og allmektig, hvorfor finnes det barn som sulter? Buddhismen svarer ikke på spørsmålet — den avviser premisset.»
* **Signaturkomponent:** `TeodicéVerkstedet`
* **Livssynshumanisme:** ja
* **Gjestestemme samisk:** ja — her hører også fornorskningen hjemme: hva skjer med et folks tro når den blir forbudt?
* **Merknad:** Emnets tyngste tema. Plasseres sist med vilje — krever at eleven kan begrepene fra artikkel 2, 5 og 6.

---

## 5. The Comparison Matrix (KRLE Special)

> *Ni religioner × Ninian Smarts sju dimensjoner. Dette er innholdsreferansen artiklene skal være konsistente med.*

### 5.1 Abrahamittiske røtter

| Dimensjon | Jødedom | Kristendom | Islam |
|---|---|---|---|
| **Ritual** | Sabbat, omskjæring, bar/bat mitzvah | Dåp, nattverd, gudstjeneste | Salat (5×), sawm (ramadan), hajj |
| **Narrative** | Utgangen av Egypt, pakten med Abraham | Jesu liv, død og oppstandelse | Åpenbaringen i Hira-grotten, hijra |
| **Experiential** | Sabbatshvile, klagemuren | Nåde, lovsang, omvendelse | Overgivelse (islam), fred i bønnen |
| **Social** | Rabbiner, synagoge, ingen sentralmakt | Prest/pastor/pave, menighet, kirkesamfunn | Imam, umma, ingen presteskap |
| **Ethical** | De ti bud, halakha, tikkun olam | Nestekjærlighet, tilgivelse | Sharia, zakat, de fem søylene |
| **Doctrinal** | Én udelelig Gud, utvalgt folk, pakt | Treenighet, inkarnasjon, arvesynd | Tawhid, profetrekken, ingen arvesynd |
| **Material** | Synagoge, torarull, menora, davidsstjerne | Kirke, kors, ikoner, altertavle | Moské, minaret, kalligrafi, bildeforbud |

### 5.2 Indiske tradisjoner

| Dimensjon | Hinduisme | Buddhisme | Sikhisme |
|---|---|---|---|
| **Ritual** | Puja, arti, samskara-riter | Meditasjon, offergaver til Buddha | Amrit sanskar, lesning av Guru Granth Sahib |
| **Narrative** | Vedaene, Mahabharata, Ramayana | Siddharthas fire møter og oppvåkning | Guru Nanaks forsvinning i elva |
| **Experiential** | Darshan (å se guden), bhakti | Opplysning, indre stillhet | Naam simran (å huske Guds navn) |
| **Social** | Kastesystem (omdiskutert), brahminer | Sangha (munkefellesskap), lekfolk | Gurdwara, langar (fellesmåltid), likeverd |
| **Ethical** | Dharma (plikt), ahimsa, karma | De fem forskriftene, medfølelse, ahimsa | Ærlig arbeid, deling, tjeneste (seva) |
| **Doctrinal** | Brahman, atman, samsara, moksha | Ingen skapergud, fire edle sannheter, anatta | Én Gud uten form, avvisning av kaste |
| **Material** | Tempel, murti (gudebilde), om-tegnet | Stupa, buddhastatue, dharmahjulet | Gurdwara, khanda, de fem k-ene |

### 5.3 Nyere bevegelser

| Dimensjon | Bahá'í | Mormonisme | Jehovas vitner |
|---|---|---|---|
| **Ritual** | Bønn, 19-dagersfesten, faste i mars | Dåp, tempelseremonier, faste | Minnehøytiden, dåp ved neddykking |
| **Narrative** | Báb og Bahá'u'lláhs åpenbaringer | Joseph Smiths syn, reisen til Utah | Bibelsk profeti, 1914 som vendepunkt |
| **Experiential** | Enhet, andakt | Vitnesbyrd, personlig åpenbaring | Forkynnelse, håp om paradis på jord |
| **Social** | Åndelige råd, ingen prester | Biskoper, staver, misjonærår | Menighet, eldsterråd, Det styrende råd |
| **Ethical** | Enhet i mangfold, likeverd, utdanning | Visdomsordet, familiefokus, tiende | Politisk nøytralitet, streng moral |
| **Doctrinal** | Én Gud, progressiv åpenbaring | Gud har kropp, evig framgang | Ingen treenighet, 144 000, ikke udødelig sjel |
| **Material** | Ni-kantede hus, ingen bilder | Templer, Mormons bok | Rikets sal, Vakttårnet |

> **Merk:** Bahá'í springer ut av sjia-islam, mens mormonisme og Jehovas vitner springer ut av kristendommen. Grupperingen «nyere bevegelser» er en pedagogisk forenkling og skal forklares for eleven første gang den brukes.

### 5.4 Gjestestemme: samisk religion

Samisk religion står utenfor de ni faste sporene, men kommer inn som **gjestestemme** i seks av temaene. Det dekker LK20-mål 5 — «gjøre rede for og reflektere over samenes og andre urfolks religions- og livssynstradisjoner» — uten å kreve sytten nye samiske kildeartikler på et tynt kildegrunnlag.

**Temaer med samisk seksjon:** `skapelse`, `doden`, `hoytider`, `hellige-rom`, `etikk-og-leveregler`, `lidelse`.
**Temaer uten:** de øvrige elleve. Der finnes det ikke nok solid kildemateriale til å si noe presist, og en tynn seksjon ville vært verre enn ingen.

**Kildegrunnlag:** `public/content/krle/religion/samisk/intro.json` (818 ord, egen signaturkomponent) og `laestadianismen.json` (1240 ord, komplett hale). Begge holder plan_article-standard allerede — samisk er faktisk bedre dekket enn seks av de ni hovedreligionene.

| Dimensjon | Samisk religion |
|---|---|
| **Ritual** | Offer ved sieidi, runebomme (goavddis) brukt av noaiden, bjørnegraven med egne regler for hvordan byttet skulle behandles |
| **Narrative** | Solguden Beaivi og hans døtre, Máttaráhkká og de tre datter-gudinnene som følger mennesket fra unnfangelse til fødsel, Stállu-fortellingene |
| **Experiential** | Joik som måte å *være* noen eller noe på, ikke synge *om* det. Noaidens reise mellom verdener. |
| **Social** | Siida-fellesskapet, noaiden som spesialist framfor prest, ingen skriftlig lære eller organisert presteskap |
| **Ethical** | Ta bare det du trenger, gi tilbake til stedet, respekt for dyret du feller |
| **Doctrinal** | Alt har sjel, verden i tre lag, ingen skarp grense mellom menneske, dyr og landskap |
| **Material** | Sieidi-steiner og hellige fjell, runebommen, gievrie-symboler, landskapet selv som helligdom |

**Egen toneregel for samisk innhold** — kommer i tillegg til reglene i §2.2:

1. **Ikke fortid.** Samisk religiøs tradisjon lever videre i språk, joik, stedsnavn og praksis. Skriv «mange samer», ikke «samene trodde».
2. **Undertrykkelsen skal nevnes** der den er relevant. Runebommer ble brent, sieidier ødelagt, joik forbudt i skolen. Det er en del av historien, ikke en fotnote — men det skal fortelles nøkternt, ikke sentimentalt.
3. **Laestadianismen er ikke det samme som førkristen samisk religion.** Den er en kristen vekkelsesbevegelse med sterk samisk forankring. Hold de to fra hverandre.
4. **Bruk samiske ord** med forklaring: *noaidi*, *sieidi*, *siida*, *joik*, *gievrie*. De er fagbegreper på linje med *salat* og *moksha*.

**Kilder som må hentes ved bygging:** Store norske leksikon (samisk religion, noaidi, sieidi), Sametinget, RiddoDuottarMuseat / Samisk museum. Følg kilde-først-regelen i `plan_article`.

---

## 6. Signaturkomponenter

Alle nye komponenter legges i `src/components/content/interactive/` og registreres i `src/components/ComponentRegistry.tsx`.

**Felles krav (gjelder alle):**
- **Chromebook-first:** baseline 1366×768. Maks **3–4 tradisjoner synlig samtidig** med velger. Ni parallelle spalter er forbudt.
- Bruker religionsfargene fra tabellen i §1.
- Fungerer med tastatur, og har en lesbar tilstand uten interaksjon (for utskrift og presentasjonsmodus).
- Alle data kommer fra `props` i artikkel-JSON — ingen hardkodet religionsdata i komponenten.

| # | Tema | Komponent | Konsept |
|---|---|---|---|
| 1 | skapelse | `SkapelsesVeven` | Fire faser (kaos → ordning → mennesket → oppdraget) i parallelle spor. Eleven scrubber gjennom fasene og ser hver tradisjons «beat» ved siden av hverandre. |
| 2 | gudsbilde | `GudsbildeAksen` | Rutenett med to akser: én ↔ mange, og personlig ↔ upersonlig. Eleven drar religionskort inn i feltene og får tilbakemelding. |
| 3 | bonn | `BonneKompasset` | Fire konsentriske ringer: retning, tid, kropp, ord. Velg tradisjon → ringene stiller seg inn. |
| 4 | overgangsriter | `LivetsTrapp` | Livslinje fødsel → voksen → ekteskap → død. Klikk et trinn → ritene stilles opp mot hverandre. |
| 5 | doden | `EtterlivsKartet` | Forgrenet kart: lineær vei (død → dom → evig tilstand) mot syklisk vei (død → gjenfødsel → utgang). |
| 6 | frelse | `FrelsensStige` | Vertikal akse fra «gjort for deg» til «gjort av deg». Tradisjonene plasseres, eleven begrunner. |
| 7 | hellige-tekster | `TekstensReise` | Fra muntlig → nedskrevet → kanonisert → oversatt. Viser hvor lang tid hvert steg tok. |
| 8 | grunnleggere | `StemmeneFraFortiden` | Sitatkort fra hver grunnlegger, blandet. Eleven gjetter hvem som sa hva, og oppdager hvor like de etiske ideene er. |
| 9 | etikk-og-leveregler | `GyllenRegelVeven` | Den gylne regel i ni formuleringer, vevd sammen. Eleven finner den felles kjernen. |
| 10 | hoytider | `HelligKalender` | Sirkulært årshjul som viser hvordan måneår glir mot solår. |
| 11 | hellige-rom | `RommetsGrammatikk` | Plantegning som skifter mellom moské, kirke, synagoge, tempel og gurdwara. |
| 12 | symboler-og-klaer | `SymbolLeksikon` | Symbolgalleri med opprinnelseshistorie og «hva folk tror det betyr» mot «hva det faktisk betyr». |
| 13 | mat-og-renhet | `MatbordetsRegler` | Et bord med matvarer. Velg tradisjon → maten merkes tillatt/forbudt/omdiskutert med begrunnelse. |
| 14 | kjonn-og-roller | `RolleneOverTid` | Tidslinje i to spor: hva teksten sier, og hva praksis har vært. |
| 15 | ledelse-og-fellesskap | `MaktensForm` | Organisasjonsdiagram som skifter form: pyramide, nettverk, eller ingenting. |
| 16 | pilegrim | `PilegrimsKartet` | Verdenskart med pilegrimsruter. Gjenbruker `d3-geo`-oppsettet i `src/components/atlas/`. |
| 17 | lidelse | `TeodicéVerkstedet` | Eleven møter et konkret tilfelle av lidelse og får hver tradisjons svar, med mulighet til å innvende. |

### 6.1 Props-skisser for de fem første

```jsonc
// SkapelsesVeven
{
  "phases": [
    { "id": "kaos",     "label": "Før begynnelsen" },
    { "id": "ordning",  "label": "Verden blir til" },
    { "id": "mennesket","label": "Mennesket kommer" },
    { "id": "oppdraget","label": "Hva skal vi her?" }
  ],
  "traditions": [
    {
      "id": "kristendom", "name": "Kristendom", "color": "#6366f1", "group": "abrahamittisk",
      "beats": {
        "kaos":      { "text": "Mørke over dypet. Gud var der før alt." },
        "ordning":   { "text": "Seks dager. Lys først, så himmel, land, liv." },
        "mennesket": { "text": "Skapt i Guds bilde, sist av alt." },
        "oppdraget": { "text": "Forvalte skaperverket." }
      }
    }
  ],
  "defaultSelection": ["kristendom", "hinduisme", "buddhisme"],
  "maxVisible": 3
}

// GudsbildeAksen
{
  "axes": {
    "x": { "minLabel": "Én gud", "maxLabel": "Mange guder" },
    "y": { "minLabel": "Personlig og nær", "maxLabel": "Upersonlig kraft" }
  },
  "cards": [
    { "id": "islam", "name": "Islam", "color": "#10b981",
      "correctZone": "x0y0",
      "feedback": "Tawhid: Gud er én og udelelig, men også nær - «nærmere enn halspulsåren»." }
  ]
}

// BonneKompasset
{
  "rings": ["retning", "tid", "kropp", "ord"],
  "traditions": [
    { "id": "islam", "name": "Islam", "color": "#10b981",
      "retning": "Mot Kaba i Mekka",
      "tid": "Fem faste tider hver dag",
      "kropp": "Stående, bøyd, knelende, pannen mot bakken",
      "ord": "Faste ord på arabisk, samme overalt i verden" }
  ]
}

// LivetsTrapp
{
  "stages": [
    { "id": "fodsel",   "label": "Fødsel",   "age": "0" },
    { "id": "voksen",   "label": "Voksen",   "age": "12-16" },
    { "id": "ekteskap", "label": "Ekteskap", "age": "-" },
    { "id": "doden",    "label": "Døden",    "age": "-" }
  ],
  "traditions": [
    { "id": "jodedom", "name": "Jødedom", "color": "#3b82f6",
      "rites": {
        "fodsel": { "name": "Brit mila", "text": "Omskjæring på åttende dag - tegnet på pakten." },
        "voksen": { "name": "Bar/bat mitzvah", "text": "13 år. Nå er du ansvarlig for budene selv." }
      } }
  ]
}

// EtterlivsKartet
{
  "paths": [
    { "id": "abrahamittisk", "name": "Lineær vei", "shape": "linear",
      "nodes": [
        { "label": "Døden",  "text": "Livet slutter én gang." },
        { "label": "Dommen", "text": "Regnskapet gjøres opp." },
        { "label": "Evig tilstand", "text": "Paradis eller straff." }
      ] },
    { "id": "indisk", "name": "Syklisk vei", "shape": "cyclic",
      "nodes": [
        { "label": "Døden", "text": "Kroppen dør, ikke atman." },
        { "label": "Karma", "text": "Handlingene dine avgjør neste liv." },
        { "label": "Gjenfødsel", "text": "Og så begynner det på nytt." },
        { "label": "Utgangen", "text": "Moksha eller nirvana - hjulet stopper." }
      ] }
  ]
}
```

---

## 7. Artikkelmal

Fil: `public/content/krle/sammenligning/<slug>.json`

```jsonc
{
  "id": "skapelse",
  "title": "Hvor kommer alt fra?",
  "subject": "krle",
  "topic": "sammenligning",
  "layout": "rich",
  "category": "Sammenligning",
  "readTime": "10 min lesning",
  "heroImage": "/images/krle/sammenligning/placeholder.webp",
  "dimension": "narrative",
  "comparison_tags": ["skapelse", "narrative"],
  "religions": ["kristendom", "islam", "jodedom", "hinduisme", "buddhisme", "sikhisme", "bahai", "mormonisme", "jehovas-vitner"],
  "kompetansemaal": ["rle01-03-10-01", "rle01-03-10-13"],
  "details": ["...", "..."],
  "createdDate": "...",
  "content": [ /* se rekkefølge under */ ],
  "timeline": []
}
```

**Content-rekkefølge (fast for alle 17):**

| # | Blokk | Innhold |
|---|---|---|
| 1 | `text` | **Comparison Hook** — én konkret kontrast, ingen oppvarming |
| 2 | `header` + `text` | Spørsmålet alle stiller — hvorfor temaet er universelt |
| 3 | `component` | **Signaturkomponenten** — tidlig, mens nysgjerrigheten er høy |
| 4 | `header` + `text` ×3 | Én seksjon per **gruppe** (abrahamittiske / indiske / nyere), ikke per religion |
| 5 | `header` + `text` + `list` | **Mønsteret** — hva ligner, hva skiller, hvorfor |
| 6 | `header` + `text` | **Gjestestemmen** — samisk religion, i de seks temaene i §5.4 |
| 7 | `component: MicroGame` | Der et passende mikrospill finnes |
| 8 | `text` | «Og de som ikke tror?» — livssynshumanisme, i utvalgte temaer |
| 9 | `component: FactBox` | «Se rådataene» — lenke til `/krle/sammenlign/tema/<slug>` |
| 10 | `component: Oppgaver` | Bloom-trapp: Forstå / Reflekter / Gå videre |
| 11 | `component: Quiz` | 3–5 spørsmål |
| 12 | `component: Kildeliste` | APA-formaterte kilder |

**Regler (fra `CLAUDE.md`):** flat `content`-array, ingen nøstede `section`-blokker, aldri `**fet**` i brødtekst, aldri markdown-lister i `text` — bruk `{ "type": "list" }`. `timeline` alltid `[]`.

---

## 8. Læringsstier

### 8.1 3-akts-modellen oversatt til comparison-first

`.agent/workflows/LEARNING_PATH_GUIDE.md` bruker en historie-orientert 3-aktsmodell. Den oversettes slik for KRLE:

| Akt | Historie-versjonen | KRLE-versjonen |
|---|---|---|
| **Steg 0: Prolog** | Setter scenen | **DITT EGET SVAR FØRST** — eleven skriver ned hva hen selv tror, før noen fasit. Svaret hentes fram igjen i siste steg. |
| **Akt 1: Opptakten** | Setup | **SPØRSMÅLET** — hvorfor stiller alle kulturer dette spørsmålet? Hvordan leser man en religiøs tekst? |
| **Akt 2: Konfrontasjonen** | Konflikt | **SVARENE** — ett steg per tradisjon eller gruppe, i dybden. Her ligger komponentene. |
| **Akt 3: Resolusjonen** | Oppløsning | **MØNSTERET** — sammenlign, finn mønsteret, ta stilling, sammenlign med det du skrev i steg 0. |

Grepet med steg 0 er det som gjør comparison-first pedagogisk: eleven har en egen posisjon å måle de andre svarene mot, og opplever i siste steg at hen har flyttet seg.

### 8.2 `skapelse-sti` — «Før alt fantes» (11 steg)

* **Fil:** `public/content/krle/sammenligning/skapelse-sti.json`
* **Manifest:** `sammenligning.tools[]`, `icon: "map"`
* **Estimert tid:** 3–4 timer

| # | Fase | Tittel | Type | Komponent |
|---|---|---|---|---|
| 0 | Prolog | Før alt fantes | refleksjon | — |
| 1 | Akt 1 | Hvorfor forteller alle en skapelsesfortelling? | fakta | — |
| 2 | Akt 1 | Å lese en myte uten å le av den | fakta | `BiasLens` |
| 3 | Akt 2 | Seks dager og et hvileår | fakta | — |
| 4 | Akt 2 | «Vær!» — og det ble | fakta | — |
| 5 | Akt 2 | Universet som puster | utfordring | `SkapelsesVeven` |
| 6 | Akt 2 | Buddhas taushet | refleksjon | — |
| 7 | Akt 2 | Fortellingene fra nord | fakta | — |
| 8 | Akt 2 | Big Bang som fortelling | fakta | — |
| 9 | Akt 3 | Linje eller sirkel? | utfordring | `EtterlivsKartet` (forsmak) |
| 10 | Akt 3 | Kan begge ha rett? | refleksjon | `DebateSimulator` |
| 11 | Akt 3 | Ditt eget svar, andre gang | oppgave | — |

Hvert steg som krever lesing starter med `Les artikkelen [Tittel](/absolutt/sti)`. Oppgavene følger Bloom-trappen med nivået markert i parentes.

### 8.3 `sammenligning-sti` — «Å se med to øyne» (metode, 9 steg)

Lærer eleven *hvordan* man sammenligner, ikke *hva*. Treffer LK20-mål 6 (fagbegreper), 7 (kildekritikk) og 12 (andres perspektiv, uenighet) direkte.

| # | Fase | Tittel | Type |
|---|---|---|---|
| 0 | Prolog | Hva ser du etter? | refleksjon |
| 1 | Akt 1 | Ninian Smarts sju dimensjoner | fakta |
| 2 | Akt 1 | Fagord som faktisk hjelper | fakta |
| 3 | Akt 2 | Likhet er ikke det samme som enighet | utfordring |
| 4 | Akt 2 | Å gjengi noen du er uenig med | utfordring |
| 5 | Akt 2 | Hvem skrev kilden din? | fakta |
| 6 | Akt 2 | Innenfra eller utenfra? | refleksjon |
| 7 | Akt 3 | Lag din egen sammenligning | oppgave |
| 8 | Akt 3 | Uenighet uten krangel | gruppe |

Bygges i fase 4, når det finnes 3–4 temaartikler å peke på.

### 8.4 Øvrige fordypningsstier

`gudsbilde-sti`, `bonn-sti` og `doden-sti` følger samme mal som §8.2, 9–12 steg hver. Detaljeres i egne læringssti-blueprints etter mønster av `docs/Design documents/skapende-skriving-laeringssti-blueprint.md`.

---

## 9. Rydding, avklaringer og faseplan

### 9.1 Datahygiene funnet under kartleggingen (bør ryddes i fase 1)

Full bugliste med foreslåtte fikser står i `docs/KRLE_OPPRUSTNING.md` §7. Kort versjon:

| # | Funn | Detalj | Tiltak |
|---|---|---|---|
| B1 | **Seks tomme intro-sider** | `religion/{bahai,buddhisme,hinduisme,jehovas-vitner,jodedom,mormonisme}/intro.json` bruker `ingress` + `body` i stedet for `content`. Ingen renderer leser `body` — sidene laster tomme. | Konverter til flat `content`-array |
| B2 | **Ødelagt blokk-skjema** | `islam/bonn` og `islam/skapelse` skriver `{"name": "text"}` i stedet for `{"type": "text"}`. Eneste blokker i KRLE uten `type`. Bruker også eksterne Unsplash-URL-er. | Bytt `name` → `type`, erstatt eksterne bilder |
| B3 | **Uregistrert artikkel** | `islam/skapelse/artikkel.json` finnes på disk, men mangler i `manifest.json`. Usynlig i navigasjonen, men plukkes opp av comparison-manifestet. | Legg til under `krle → religion → islam` |
| B4 | **Mulig brutt lenke** | Manifestet registrerer sikhisme-lesson `intro`, men mappa heter `introduksjon/` | Verifiser ruten, rett navnet ett av stedene |
| — | **Ujevn dekning** | Sikhisme mangler `bonn`, `frelse` og `gudsbilde` — de tre temaene der de øvrige åtte har artikkel | Skriv de tre i R3 og R5 |

### 9.2 `generate-comparison-manifest.mjs`

Hvis nye `comparison_tags` innføres på kildeartikler, må `TOPIC_LABELS` og `TAG_ALIASES` i `scripts/generate-comparison-manifest.mjs` (linje ~24–56) utvides — ellers får temaet en auto-generert label på `/krle/sammenlign`. Selve sammenligningsartiklene ligger utenfor generatorens glob og trigger ingen endring.

### 9.3 Overlapp med `religion-og-kultur`

Tre temaer (`hoytider`, `symboler-og-klaer`, `mat-og-renhet`) har allerede en artikkel under `krle/religion-og-kultur/`. **Beslutning:** de eksisterende artiklene blir stående der de er. Sammenligningsartikkelen skrives som en ren tverrgående sammenligning og lenker til den eksisterende artikkelen som fordypning. Ingen duplisering, ingen flytting.

### 9.4 Faseplan

Hver fase leverer **både** noe nytt i sammenligningsemnet **og** opprustningen av kildeartiklene det temaet lener seg på. Opprustningsrundene (R0–R7) er definert i `docs/KRLE_OPPRUSTNING.md` §5.

| Fase | Nytt i sammenligningsemnet | Opprustning i samme runde | Status |
|---|---|---|---|
| **0** | **Denne blueprinten** + `KRLE_OPPRUSTNING.md` | — | ✅ |
| 1 | Manifest-topic `sammenligning` + pilotartikkel `skapelse` + `SkapelsesVeven` | **R0**: bugene B1–B4 (9 filer) | |
| 2 | `skapelse-sti` | **R1**: `skapelse` for de religionene som mangler den (8 artikler) | |
| 3 | Tema 2–4 (`gudsbilde`, `bonn`, `overgangsriter`) med signaturkomponenter | **R2–R4**: kildeartiklene for de tre temaene (25 artikler) | |
| 4 | Metode-stien `sammenligning-sti` | — | |
| 5 | Tema 5–8 + `gudsbilde-sti` og `bonn-sti` | **R5**: `frelse`, `grunnleggere`, `hellige-tekster`, `sentrale-trekk` (33 artikler) | |
| 6 | Tema 9–13 + `doden-sti` | **R6**: de 8 kristendom-artiklene i 325–396-båndet | |
| 7 | Tema 14–17 (de faglig tyngste) | **R7**: 17 filosofi-artikler uten quiz og hale | |
| 8 | Bildeproduksjon for hele emnet | — | |

Hver fase er selvstendig komplett — ingenting står halvferdig mellom rundene.

**Rekkefølgen innad i en fase:** sammenligningsartikkelen *blokkerer ikke* på kildeopprustningen (§9.5 punkt 3 gjelder fortsatt — den skrives så den står på egne ben). Men fasen regnes ikke som ferdig før kildeartiklene også er løftet, ellers lenker sammenligningen ned i 60-ords stubber.

### 9.5 Forutsetninger satt uten brukerbekreftelse

Disse ble valgt for å komme videre og kan overstyres:

1. **Emnenavn** «Sammenligne religion», topic-ID `sammenligning`.
2. **Livssynshumanisme** tas med som ekstra stemme i temaene der den har noe å si (skapelse, overgangsriter, døden, etikk, lidelse), ikke i alle 17. Dekker LK20-mål 3 delvis.
3. **Kildehull:** sammenligningsartiklene skrives så de står på egne ben, og lenker til per-religion-artikler der de finnes. Vi venter ikke på full kildedekning før et tema kan bygges.

### 9.6 Åpne spørsmål

1. Skal `/krle/sammenligning` ha en egen landingsside med visuell temaoversikt, eller holder standard emneside fra manifestet?
2. Skal temachipsene på `/krle/sammenlign` lenke til den skrevne artikkelen når en slik finnes?
3. ~~Samisk religion og historiske religioner står utenfor de ni. Skal de inn som gjestestemmer?~~ **Avklart 2026-08-10:** samisk religion kommer inn som gjestestemme i seks utvalgte temaer — se §5.4. Historiske religioner holdes utenfor foreløpig.
4. Skal emnet ha en egen quiz-battle-pakke eller flashcard-sett på tvers av temaene?
5. Skal mikrospill-kravet i plan_article gjelde absolutt alle de 89 artiklene som skal opprustes? Se omfangsdrøftingen i `docs/KRLE_OPPRUSTNING.md` §5. Vurderes etter de første 8–10 artiklene.

---

## 10. The Asset Tracker

Alle bilder er `placeholder.webp` inntil fase 8. Format: WebP, 16:9, maks 1600px bred, under 100KB. Lagres i `public/images/krle/sammenligning/`.

| Status | Type | Beskrivelse | Filnavn |
|---|---|---|---|
| `[ ]` | Hero (emne) | Ni lysende tråder som løper parallelt gjennom mørket og møtes i ett punkt. Abstrakt, ingen religiøse symboler. 16:9. | `sammenligning-hero.webp` |
| `[ ]` | Hero | `skapelse` — En stjernetåke som samtidig ligner en spiral og en linje. Dyp blå og gull. 16:9. | `skapelse-hero.webp` |
| `[ ]` | Hero | `gudsbilde` — Lys som brytes i et prisme og blir til mange farger. 16:9. | `gudsbilde-hero.webp` |
| `[ ]` | Hero | `bonn` — Fugleperspektiv av hender i ulike bønnestillinger, mykt sidelys. 16:9. | `bonn-hero.webp` |
| `[ ]` | Hero | `overgangsriter` — Fire dører på rekke, hver med sitt lys. 16:9. | `overgangsriter-hero.webp` |
| `[ ]` | Hero | `doden` — En sti som deler seg: én går rett fram, én bøyer av i sirkel. Tåkete morgenlys. 16:9. | `doden-hero.webp` |
| `[ ]` | Hero ×12 | Resterende temaer, prompter skrives ved bygging | `<slug>-hero.webp` |

Prompt-mal (fra `docs/image-style-guide.md`):
`A highly realistic 4K cinematic photograph of [scene]. [Lighting description]. [Composition/camera angle]. 16:9 ratio.`

---

## 11. Kvalitetssjekk før hver byggerunde

- [ ] Ingen `**fet**` i brødtekst, ingen markdown-lister i `text`-blokker
- [ ] Flat `content`-array, `timeline: []`
- [ ] Alle lenker i læringsstier er absolutte og starter med `/`
- [ ] Læringsstier registrert under `tools[]`, ikke `lessons[]`
- [ ] Ingen duplikate ID-er i `manifest.json`
- [ ] Signaturkomponenten viser maks 3–4 tradisjoner samtidig og er testet på 1366×768
- [ ] Tonereglene i §2.2 er fulgt — beskrivende, ikke vurderende, og indre mangfold er nevnt
- [ ] Kildeliste i APA, plassert som siste content-blokk
- [ ] `npm run scan:content` kjørt, og `public/data/comparison-manifest.json` er uendret av de nye filene
- [ ] Alle fagbegreper forklart første gang de brukes — ville en 14-åring forstått dette?
