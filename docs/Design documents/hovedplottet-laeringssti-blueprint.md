# Blueprint: Læringssti - Hovedplottet

**Status:** Bygget (12.08.2026)
**Fag:** krle
**Emne:** sammenligning
**Sti-ID:** hovedplottet-sti
**Fil:** `public/content/krle/sammenligning/hovedplottet-sti.json`
**Målgruppe:** Ungdomsskole (10. trinn)
**Estimert tid:** 2 timer
**Kompetansemål:** rle01-03-10-06, rle01-03-10-13, rle01-03-10-15 (arvet fra `lidelse` og `frelse`)

---

## Rød tråd

**Alle religioner forteller den samme historien. De er uenige om hvem som er helten.**

Det gjennomgående spørsmålet er femdelt, og eleven møter det i hvert eneste steg:

| Ledd | Spørsmålet | Fagordet |
|---|---|---|
| 1. Diagnosen | Hva er galt? | lidelse, synd, uvitenhet |
| 2. Årsaken | Hvorfor er det galt? | syndefall, karma, tørst, haumai |
| 3. Målet | Hvor skal vi? | frelse, moksha, nirvana, mukti |
| 4. Veien | Hvordan kommer vi dit? | nåde, søylene, den åttedelte vei |
| 5. **Regien** | **Hvem gjør jobben?** | **den skarpe aksen** |

De fire første leddene ligner hverandre mistenkelig mye på tvers av ni tradisjoner.
Det femte spriker fra ende til annen: kristendommen sier at Gud gjør jobben og du tar
imot, buddhismen sier at du gjør den helt alene og ingen kan gjøre den for deg. Det er
her stien har sin sprengkraft. Eleven oppdager først likheten, og så at likheten skjulte
den største uenigheten.

---

## Artikkelgrunnlag

Alle artikler eksisterer og er ferdig oppgradert. Ingen må opprettes.

| # | Artikkel | Tittel | URL | Egen komponent | Brukes i |
|---|---|---|---|---|---|
| 1 | buddhisme/sentrale-trekk | En diagnose og en behandling | `/krle/religion/buddhisme/sentrale-trekk` | DharmahjuletUtforsker | Steg 1 |
| 2 | sammenligning/lidelse | Lidelse: Hvorfor finnes det vondt? | `/krle/sammenligning/lidelse` | TeodiseVerkstedet | Steg 2 |
| 3 | kristendom/frelse | Gaven ingen kan fortjene | `/krle/religion/kristendom/frelse` | Signeringsbordet | Steg 3 |
| 4 | islam/frelse | Vekten som ikke lyver | `/krle/religion/islam/frelse` | VektskaalenPaaDommensDag | Steg 4 |
| 5 | hinduisme/frelse | Ikke et bedre sted, men ut | `/krle/religion/hinduisme/frelse` | SamsaraHjulet | Steg 5 |
| 6 | jodedom/frelse | Verden er ikke ferdig | `/krle/religion/jodedom/frelse` | DenneVerdenFoerst | Steg 6 |
| 7 | sammenligning/frelse | Frelse: Målet med det hele | `/krle/sammenligning/frelse` | FrelsensStige | Steg 7 |

**Bonuslenker (ikke pålagt lesing):** `buddhisme/frelse` (Hvor ble det av flammen?),
`sikhisme/frelse` (Dråpen som ikke ble borte), `sammenligning/doden` (EtterlivsKartet).

**Ikke egne steg, men til stede overalt:** sikhisme, bahai, mormonisme og Jehovas vitner
møter eleven gjennom sammenligningsartiklene i steg 2 og 7, og som kortstokk i
Plottmaskinen i steg 8. Det er et bevisst valg: fire dyplesninger i Akt 2 er nok til å
etablere mønsteret, og de fem andre tradisjonene fungerer bedre som prøvestein på et
mønster eleven allerede har.

---

## Narrativ bue

### Samlende metafor: manuskriptet

Eleven er ikke turist på religionsbesøk. Hun er **manusleser**. Ni forfattere har levert
inn hvert sitt utkast til den samme historien: noe er galt, noe skal fikse det. Jobben er
å lese utkastene, finne ut hvor de er enige, og peke på nøyaktig hvor de skiller lag.

Metaforen bærer stegtitlene («Filmen du så sist», «Bygg plottet»), språket i
oppgavene («hvem er helten i dette utkastet?») og hele avslutningen, der eleven
oppdager at hun også går rundt med et manus.

### Perspektiv og tone

«Du»-stemme. Eleven tiltales som en som allerede er ekspert på plott uten å vite det:
hun har sett hundrevis av filmer og vet nøyaktig hva som må skje i akt tre. Stemmen
starter lett og gjenkjennelig, blir alvorligere i møtet med lidelsen, spisser seg til i
Akt 2 der de fire svarene ikke går an å forene, og lander i noe personlig.

### Emosjonell bue

Gjenkjennelse (dette kan jeg jo) → overraskelse (buddhismen sier plottet høyt) →
ubehag (lidelsen er ekte, og hvem har skylda?) → spenning (fire svar som ikke passer
sammen) → aha (skjelettet er felles, men regien spriker) → selvinnsikt (jeg har også
et manus).

### Stegtittel-stil

Evokative, korte, gjerne med en skjult vending. «Gaven» og «Vekten» står som to
enkeltord mot hverandre og gjør kontrasten synlig allerede i innholdsfortegnelsen.

---

## Steg-for-steg plan

10 steg (prolog + 3 akter). Hvert steg leser **maksimalt én artikkel** og har **5 oppgaver**
i Bloom-stigende rekkefølge.

| # | Steg-ID | Fase | Tittel | Type | Artikkel | Komponent | Bloom |
|---|---|---|---|---|---|---|---|
| 0 | ditt-eget-plott | Prolog | Filmen du så sist | refleksjon | - | - | 1-3 |
| 1 | diagnosen-sagt-hoyt | Akt 1: Diagnosen | Diagnosen som ble sagt høyt | fakta | buddhisme/sentrale-trekk | MicroGame `attedelt-vei-hjulet` | 1-2 |
| 2 | hva-er-galt | Akt 1: Diagnosen | Hva er galt? | utfordring | sammenligning/lidelse | TeodiseVerkstedet (i artikkelen) | 2-3 |
| 3 | gaven | Akt 2: Utveien | Gaven | fakta | kristendom/frelse | Signeringsbordet (i artikkelen) | 2 |
| 4 | vekten | Akt 2: Utveien | Vekten | fakta | islam/frelse | VektskaalenPaaDommensDag (i artikkelen) | 2-3 |
| 5 | ut-ikke-opp | Akt 2: Utveien | Ut, ikke opp | fakta | hinduisme/frelse | SamsaraHjulet (i artikkelen) | 2-3 |
| 6 | plottet-som-nekter | Akt 2: Utveien | Plottet som nekter | refleksjon | jodedom/frelse | DenneVerdenFoerst (i artikkelen) | 3 |
| 7 | hvem-gjor-jobben | Akt 3: Mønsteret | Hvem gjør jobben? | utfordring | sammenligning/frelse | FrelsensStige (i artikkelen) | 3 |
| 8 | bygg-plottet | Akt 3: Mønsteret | Bygg plottet | utfordring | - | **Plottmaskinen** (ny) | 3-4 |
| 9 | ditt-eget-plott-igjen | Akt 3: Mønsteret | Ditt eget plott, andre gang | oppgave | - | - | 4 |

### Steg 0 - Filmen du så sist (Prolog, ingen forkunnskaper)

Eleven skriver plottet i en film, serie, bok eller et spill hun er glad i, i fem ledd:
hva er galt i starten, hvorfor, hvor skal det ende, hva må til, og **hvem fikser det**.
Ingen fasit. Svarene lagres og hentes fram igjen i steg 9.

Poenget med prologen er å gi eleven malen i hendene før hun vet at det er en mal.
Når buddhismen i steg 1 legger fram nøyaktig samme skjema, har hun allerede fylt det ut.

Oppgaver: (Fakta) skriv de fem leddene for din historie → (Forståelse) hva ville skjedd
om helten ikke gjorde noe? → (Forståelse) er det noen andre enn helten som må gjøre en
jobb? → (Anvendelse) skriv om slutten slik at noen utenfra redder alt, og vurder om
historien blir bedre eller dårligere → (Refleksjon) ta vare på svarene.

### Steg 1 - Diagnosen som ble sagt høyt (Akt 1)

Buddhismen er inngangsdøra fordi den er den eneste som legger fram plottet som et
skjema. De fire edle sannhetene er bygget som en legejournal: symptomet, årsaken,
beskjeden om at det finnes en kur, og behandlingen. Eleven får malen presentert som
noe en religion sier om seg selv, ikke som noe en lærebok har funnet på.

Komponent: mikrospillet `attedelt-vei-hjulet` legges i steget (artikkelen har allerede
`samsara-syklusen`, så det blir ingen dublett). Hjulet er ledd 4, veien, gjort håndfast.

Oppgaver: (Fakta) les artikkelen → (Fakta) skriv de fire edle sannhetene med egne ord →
(Forståelse) hvilke av de fem leddene fra prologen dekker de fire sannhetene, og hvilket
mangler? → (Forståelse) hva er «tørst», og hvorfor er den årsaken og ikke symptomet? →
(Anvendelse) still en diagnose på en situasjon i ditt eget liv etter samme mal.

### Steg 2 - Hva er galt? (Akt 1)

Fra én tradisjons diagnose til ni. Sammenligningsartikkelen `lidelse` med
TeodiseVerkstedet. Her møter eleven det harde spørsmålet: hvis Gud er god og allmektig,
hvorfor gjør verden vondt? Og motstykket: de indiske svarene som ikke trenger å
forsvare noen Gud, fordi karma gjør regnskapet selv.

Dette er stiens emosjonelle bunnpunkt, og det skal det være. Plottet har ingen kraft
hvis diagnosen er lettvint.

Oppgaver: (Fakta) les artikkelen → (Fakta) forklar teodise → (Forståelse) hva er
forskjellen på fysisk og moralsk ondt? → (Analyse) bruk TeodiseVerkstedet: velg
innvendingen du selv synes er sterkest, og skriv hvorfor → (Etikk) en venn mister noen.
Hvilket av svarene i artikkelen ville du aldri sagt høyt til henne, og hvorfor?

### Steg 3 - Gaven (Akt 2)

Kristendommen: `Gaven ingen kan fortjene`. Ledd 5 settes til ytterpunktet «noe utenfor
deg gjør jobben». Nåde. Signeringsbordet i artikkelen gjør det konkret.

Oppgaver: (Fakta) les → (Fakta) hva betyr nåde? → (Forståelse) hvorfor er det viktig at
frelsen er en gave og ikke lønn? → (Analyse) hvis gaven er gratis, hva er da poenget med
å gjøre gode gjerninger? → (Anvendelse) fyll ut de fem leddene for kristendommen.

### Steg 4 - Vekten (Akt 2)

Islam: `Vekten som ikke lyver`. Samme familie, samme ene Gud, samme lineære tid - og et
tydelig annet svar på ledd 5. Du gjør jobben, Gud er barmhjertig. Kontrasten mot steg 3
er hele poenget, og steget skal si det rett ut: her er to slektninger som er uenige om
det viktigste.

Vekten skal ikke fremstilles som kaldt regnskap. Artikkelen viser at barmhjertigheten
er en del av regnestykket.

Oppgaver: (Fakta) les → (Fakta) hva veies på dommens dag? → (Forståelse) hvorfor er
fire av fem søyler noe du gjør, ikke noe du tror? → (Analyse) sett gaven og vekten ved
siden av hverandre. Hva er den ene tingen de er mest uenige om? → (Anvendelse) fyll ut de
fem leddene for islam.

### Steg 5 - Ut, ikke opp (Akt 2)

Hinduismen: `Ikke et bedre sted, men ut`. Nå brytes en antakelse eleven ikke visste at
hun hadde: at målet er et sted man kommer til. I de indiske tradisjonene er målet
utgangen. Ikke et bedre rom i huset, men ut av huset.

Her introduseres samsara og moksha, og tiden slutter å være en strek og blir et hjul.

Oppgaver: (Fakta) les → (Fakta) hva er samsara og moksha? → (Forståelse) forklar hvorfor
«et bedre sted» ikke er noe mål her → (Analyse) hva er årsaken til at du er fanget, og
hvem har skylda? → (Anvendelse) fyll ut de fem leddene for hinduismen.

### Steg 6 - Plottet som nekter (Akt 2)

Jødedommen: `Verden er ikke ferdig`. Malen knirker. Her handler det ikke først og fremst
om at *du* skal reddes, men om at *verden* skal repareres, og jobben gjøres her, ikke
etterpå. Ledd 3 og ledd 5 vil rett og slett ikke passe inn i skjemaet.

Dette steget er stiens motstykke til «den tomme ruta» i overgangsriter-stien: øyeblikket
der eleven får lov til å oppdage at verktøyet ikke passer perfekt på alt, og at det er
en oppdagelse, ikke en feil.

Oppgaver: (Fakta) les → (Fakta) hva betyr det at verden ikke er ferdig? → (Forståelse)
hvorfor snakker jødedommen mindre om livet etter døden enn de andre? → (Analyse) prøv å
fylle ut de fem leddene. Hvilket ledd nekter å bli fylt ut, og hva sier det oss? →
(Refleksjon) er en religion dårligere fordi den ikke lover deg noe etter døden?

### Steg 7 - Hvem gjør jobben? (Akt 3)

Sammenligningsartikkelen `frelse` med FrelsensStige. Nå plasserer eleven alle ni på
aksen fra «du gjør alt selv» til «noe utenfor deg gjør alt». De fire hun har lest
grundig fungerer som festepunkter for de fem hun ikke har lest.

Oppgaver: (Fakta) les → (Fakta) hva betyr nirvana, moksha og mukti? → (Forståelse) sorter
alle ni fra mest selvhjulpen til mest avhengig av Gud → (Analyse) hvilke to tradisjoner
overrasket deg mest med plasseringen sin? → (Analyse) sikhismen sier både «du må huske»
og «Guds nåde fullfører». Kan begge deler stemme samtidig?

### Steg 8 - Bygg plottet (Akt 3, hardt)

Signaturkomponenten Plottmaskinen. Se egen seksjon.

Oppgaver: (Anvendelse) bygg plott for tre tradisjoner → (Analyse) hvilke ledd lignet
mest på hverandre? → (Analyse) hvilket ledd spriket mest, og hvorfor akkurat det? →
(Analyse) hvilket kort var vanskeligst å plassere riktig, og hva forvirret deg? →
(Syntese) skriv én setning som er sann for alle ni tradisjonene, og én som er sann for
bare én av dem.

### Steg 9 - Ditt eget plott, andre gang (Akt 3)

Eleven henter fram filmen fra prologen og legger den ved siden av de ni. Så kommer den
siste vendingen: **et liv uten religion har også et plott.**

Klimakampen har en diagnose (vi ødelegger kloden), en årsak (utslipp og grådighet), et
mål (en klode som tåler oss), en vei (kutte utslipp) og en regi (vi må gjøre det selv,
ingen kommer og fikser det). Teknologioptimismen har det. «Bli den beste versjonen av
deg selv» har det: noe er galt med deg, årsaken er dine egne vaner, målet er et bedre
deg, veien er disiplin, og regien er hundre prosent din.

Poenget er ikke at klimakamp er en religion. Poenget er at mennesker bruker samme
skjelett når de skal forklare hva som er galt og hva som må til, og at skjelettet derfor
ikke er noe merkelig religiøse mennesker driver med. Det er en måte å tenke på som
eleven allerede bruker.

Oppgaver: (Refleksjon) les det du skrev i prologen. Hva vil du legge til nå? →
(Anvendelse) fyll ut de fem leddene for klimakampen → (Analyse) hva er den viktigste
forskjellen mellom et religiøst og et ikke-religiøst plott? → (Etikk) er det en trøst
eller en byrde å høre at ingen kommer og fikser det for deg? Begrunn → (Syntese) skriv
fem setninger som svarer på: hva er hovedplottet i religion? Bruk minst fire fagord
fra stien.

---

## Interaktive komponenter

Fire berøringspunkter, plassert ved vendepunkter og ikke jevnt utover.

### 1. MicroGame `attedelt-vei-hjulet` (steg 1, eksisterende)

Den åttedelte veien som hjul. Plassert i det første faglige steget fordi ledd 4, veien,
er det leddet som er lettest å forstå som noe man *gjør*. Lett komponent tidlig, i tråd
med at Akt 1 ikke skal være tung.

### 2. TeodiseVerkstedet (steg 2, i artikkelen)

Ligger allerede i `lidelse`. Steget instruerer eleven i å bruke den aktivt og velge sin
egen sterkeste innvending. Plassert ved stiens emosjonelle bunnpunkt.

### 3. FrelsensStige (steg 7, i artikkelen)

Ligger allerede i `frelse`. Steget bruker den til å gjøre ledd 5 om til en fysisk akse
eleven sorterer på. Plassert der mønsteret skal bli synlig for første gang.

### 4. Plottmaskinen (steg 8, NY - stiens signaturkomponent)

**Hvorfor ny:** ingen eksisterende komponent gjør det denne stien handler om, nemlig å
la eleven bygge en femdelt påstandskjede og deretter stable flere kjeder oppå hverandre
for å se skjelettet. FrelsensStige rangerer på én akse. GudsbildeAksen plasserer på to.
Plottmaskinen bygger en struktur og sammenligner strukturer. Den er stiens tese gjort
klikkbar, og uten den er steg 8 bare en skriveoppgave.

**Slik virker den:**

1. Eleven velger én av ni tradisjoner.
2. Fem tomme felt vises loddrett: Hva er galt? / Hvorfor? / Hvor skal vi? / Hvordan? /
   Hvem gjør jobben?
3. En kortstokk til høyre inneholder de fem riktige kortene pluss tre forstyrrere hentet
   fra andre tradisjoner. Forstyrrerne er poenget: at «paradis» ikke passer som
   buddhismens mål må kjennes feil før eleven forstår hvorfor.
4. Kortene dras på plass (dnd-kit, allerede i stacken). Riktig plassering låser feltet og
   skriver leddet inn i en setningskjede som bygges nedover.
5. Når tre tradisjoner er ferdig bygget, låses knappen «Legg dem oppå hverandre» opp.
6. Sammenstillingen: fem rader, tre kolonner. Rad 1-4 markeres med felles farge fordi
   utkastene sier omtrent det samme. Rad 5, Regien, spretter ut på en vannrett akse der
   kortene lander på hver sin kant. Det er avsløringen.

**Props (konseptnivå):**

```
title, intro
slots:      [{ id, label, hint }] x5
traditions: [{ id, name, group: 'abrahamittisk'|'indisk'|'nyere', color }] x9
cards:      [{ id, traditionId, slotId, text }] x45
distractors: antall forstyrrerkort per runde (3)
regiAxis:   { leftLabel: 'Du gjør jobben selv',
              rightLabel: 'Noe utenfor deg gjør jobben',
              positions: { traditionId: 0.0-1.0 } }
compareAt:  3
revealTitle, revealText
```

**Chromebook 1366x768:** fem felt loddrett i venstre kolonne, kortstokk i høyre. I
sammenstillingsvisningen krymper kortene til korte etiketter slik at 5x3-rutenettet får
plass uten scrolling. Ingen visning krever mer enn 700 px høyde.

**Kortinnhold (utkast, alle ni tradisjoner):**

| Tradisjon | Hva er galt? | Hvorfor? | Hvor skal vi? | Hvordan? | Hvem gjør jobben? |
|---|---|---|---|---|---|
| Jødedom | Verden er ikke slik den skal være | Mennesker bryter pakten og lar urett stå | En verden som er reparert | Holde budene og gjøre rett mot andre | Vi, sammen, her i denne verden |
| Kristendom | Mennesket er skilt fra Gud og dør | Synd: mennesket valgte sin egen vei | Evig liv sammen med Gud | Tro på Jesus, som tok straffen | Gud gjør jobben. Du tar imot |
| Islam | Mennesker glemmer Gud og gjør galt | Vi er glemsomme og svake, ikke ødelagte | Paradis, etter dommen | De fem søylene og gode handlinger | Du gjør jobben. Gud er barmhjertig |
| Bahai | Menneskeheten er splittet, sjelen uutviklet | Vi kjenner ikke Gud, og ser lite i mørket | Sjelen vokser videre mot Gud | Bønn, tjeneste for andre, Bahá'u'lláhs lære | Du vokser. Gud sender veiledere |
| Mormonisme | Vi er skilt fra vår himmelske Far og dør | Fallet, og våre egne synder | Det høyeste riket, sammen med familien | Dåp, tempelritualer og lydighet | Kristi nåde gjør det mulig, du gjør din del |
| Jehovas vitner | Verden styres feil, og døden tar alle | Opprøret mot Jehovas styre | Evig liv på en gjenopprettet jord | Lære Bibelen, døpe seg, forkynne | Jehova rydder opp. Du velger side i tide |
| Hinduisme | Du er fanget i et kretsløp uten slutt | Uvitenhet om hvem du egentlig er | Moksha: ut av kretsløpet | Handling, hengivenhet eller innsikt | Du går veien selv, over mange liv |
| Buddhisme | Alt gjør vondt fordi ingenting varer | Du klamrer deg til det som forsvinner | Nirvana: flammen slukner | Den åttedelte veien | Du gjør jobben helt alene |
| Sikhisme | Du er skilt fra Gud og fødes på nytt | Du er opptatt av deg selv i stedet for Gud | Mukti: dråpen forenes med havet | Huske Guds navn, arbeide ærlig, dele | Du husker. Guds nåde fullfører |

Regi-aksen fra venstre (deg selv) til høyre (utenfra), kalibrert mot trinnene i
`FrelsensStige` i `sammenligning/frelse` slik at de to komponentene ikke motsier hverandre:
buddhisme 0,04 - bahá'í 0,20 - hinduisme 0,26 - jødedom 0,32 - mormonisme 0,50 - islam
0,56 - sikhisme 0,62 - Jehovas vitner 0,78 - kristendom 0,95.

Tre tradisjoner får en merknad under aksen, fordi plasseringen deres lyver litt alene:
jødedommen mener at hele spørsmålet er stilt med feil ord, hinduismens hengivelsesvei
ligger nærmere nåden enn de to andre veiene, og buddhismens unntak er rent land-
buddhismen, der den troende stoler på buddhaen Amitabha.

---

## Hero Image

**Prompt:** A highly realistic 4K cinematic photograph shot from directly above a dark
worn oak table, on which nine handwritten manuscript pages lie spread out in overlapping
rows, each page covered in a different script - Hebrew, Arabic, Devanagari, Pali,
Gurmukhi and Latin - the paper aged to different shades of cream and amber. A single low
warm desk lamp lights the table from the left, leaving the far edges in shadow. Shallow
depth of field on the nearest page. No people. 16:9 ratio.

**Fil:** `/images/krle/hovedplottet-hero.webp`

**Status:** stien står med `"heroImage": "/images/placeholder.webp"`, samme markør som
`lidelse` og `frelse` bruker. Det er den markøren bildegenereringscronen leter etter, så
bildet kommer av seg selv. Kjør `/bilde` om det haster.

---

## Registrering

1. Fil: `public/content/krle/sammenligning/hovedplottet-sti.json`
2. `manifest.json`: legges under `krle` → `sammenligning` → **`tools`** (ikke `lessons`),
   ved siden av `overgangsriter-sti`.
3. `link`: `/krle/sammenligning/hovedplottet-sti`, `icon`: `map`.
4. Ny komponent registreres i `src/components/ComponentRegistry.tsx`.
5. `npm run scan:content` etter at fila er på plass.

---

## Kvalitetssjekk

- [x] Steg 0 finnes, null forkunnskaper
- [x] Alle lenker absolutte, verifisert mot filsystemet
- [x] Bloom-trapp i hvert steg, 5 oppgaver, minst én anvendelsesoppgave
- [x] Ingen duplikat-ID (`hovedplottet` finnes ikke i manifest.json)
- [x] Fire interaktive berøringspunkter, plassert ved vendepunkt
- [x] Kun gyldige stegtyper: fakta, refleksjon, utfordring, oppgave
- [x] Én artikkel per steg
- [x] «Les artikkelen [...]» er første oppgave der artikkelen kreves
- [x] Samlende metafor (manuskriptet) gjennomgående
- [x] Poetiske stegtitler
- [x] JSON validert: 10 steg, 45 kort, 0 strukturfeil
- [x] Ghost-Fact Audit: alle sju artikler lest i sin helhet, alle fakta-oppgaver besvarbare
- [x] `npx tsc -b` og `eslint` rene, `check-internal-links` uten nye døde lenker
- [x] Verifisert visuelt på 1366x768: bygging og sammenstilling fungerer, ingen konsollfeil
- [ ] Hero-bilde generert

---

## Mangler og åpne spørsmål

1. **Hero-bildet** må genereres (`/bilde`) eller midlertidig lånes fra frelse-artikkelen.
2. **Sikhismens plassering på regi-aksen** er den vanskeligste. Sikhismen sier både at du
   må huske Guds navn og at nåden fullfører. Etter faktasjekken ligger den på 0,62, altså
   like over islam, fordi `sammenligning/frelse` setter begge på trinnet «nåde og innsats
   i samme setning». Dette bør likevel en fagperson se på.
3. **Bahai og mormonisme i Plottmaskinen** er de eneste tradisjonene eleven ikke har lest
   en frelse-artikkel om i stien. De dekkes av sammenligningsartikkelen i steg 7. Vurder
   om kortene deres bør merkes «du har ikke lest denne, prøv likevel».
4. **10 steg, ikke 9.** Kravet om én artikkel per steg tvang «Gaven» og «Vekten» fra
   hverandre. Det er en forbedring: kontrasten mellom dem blir tydeligere når de står som
   to steg med hvert sitt enkeltordsnavn.
