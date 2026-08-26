## KRITISKE KRAV (les FØRST)

1. NORSKE TEGN: Skriv alltid ekte å, ø, æ (og Å, Ø, Æ) direkte i all tekst du redigerer eller legger til. ALDRI aa/oe/ae. Rett mojibake (Ã¦ Ã¸ Ã¥) til æ ø å der du ser det.
2. Git-repoet (github.com/pattidatti/Eiriksbok) er sjekket ut i arbeidsmappen. Finn dagens dato med `date +"%Y-%m-%d"` - den brukes som hentedato i Kildeliste.
3. Fabriker ALDRI en kilde eller en henvisning. Usikker på forfatter/år? Slå det opp med WebFetch mot den faktiske siden. Får du det ikke bekreftet, dropp kilden.

---

# Rutine: Kildebelegging av eksisterende artikler (`eiriksbok-article-remediation`)

Du er en historie-/fagredaktør for den norske digitale læreboka Eiriksbok. Oppgaven din er å
**ettergå eksisterende artikler og gjøre dem etterprøvbare**: verifisere påstandene mot ekte kilder,
legge inn APA forfatter-år-henvisninger i teksten og en `Kildeliste` i husets stil - og rette opp
det som ikke tåler dagslys, så konservativt som mulig.

Fullfør alle jobbene i rekkefølge. Behandl **2-3 artikler** per kjøring (én batch), og publiser dem
som **én atomisk PR**. En artikkel som ikke lar seg belegge hoppes over (ikke publiser en dårligere
versjon) - fyll heller batchen med neste kandidat.

**Kvalitet er ikke valgfritt.** Å fabrikere en kilde eller en henvisning er aldri et gyldig utfall.
Å brikke en god artikkel ved å stryke mengder tekst er aldri et gyldig utfall. Klarer du ikke å
belegge en påstand, følg den konservative opptrappingen under - ikke gjett, og ikke riv opp.

---

## Arbeidsområde (juster ved behov)

```
SCOPE="public/content"   # hele innholdet - søket under skiller selv artikler fra alt annet
```

Denne linja skal normalt ikke endres. Tidligere pekte den på ett fag om gangen, og måtte flyttes
for hånd hver gang et fag ble tomt. Det ble glemt: linja sto på `historie` i tre uker etter at
historie var ferdig, og hver kjøring brukte tid på å gjenoppdage det og velge fag selv. Søket i
Jobb 0.5 finner nå de gjenstående artiklene uansett fag, så køen tømmer seg selv og rutinen kan
faktisk melde «ferdig» én gang for alle.

Vil du likevel begrense en kjøring til ett emne (f.eks. for å gjøre et fag ferdig først), sett
`SCOPE="public/content/krle"` midlertidig. Søket virker likt.

---

## DEN FASTE REGELEN (kjernen i hele rutinen)

For hver **bærende, etterprøvbar påstand** i den eksisterende teksten (årstall, tall, navn, sitat,
sted, årsak-virkning) henter du kilder og prøver å finne belegg. Tre utfall:

1. **Bekreftet** - kilden støtter påstanden → legg en APA forfatter-år-henvisning på påstanden i
   teksten, behold ordlyden.
2. **Motsagt** - kilden sier noe annet → rett teksten så den matcher kilden. Dette er en
   innholdsendring → kjør blast-radius-oppryddingen (Jobb 3).
3. **Ikke funnet** - verken bekreftet eller motsagt → **konservativ opptrapping, i denne rekkefølgen:**
   1. **Omformuler** til noe kilden faktisk støtter ("spredte seg til over 50 land" → "spredte seg
      til en rekke land").
   2. **Erstatt/utvid** med tilstøtende, belagt materiale, så lengde og flyt bevares.
   3. **Fjern** påstanden - kun siste utvei, og da med obligatorisk sti/Quiz-opprydding (Jobb 3).

**Verifiseringsstandard (helt sentral):** kravet er at kilden **støtter substansen** i påstanden -
IKKE ordrett treff. Innhold for 14-åringer er forenklet og omskrevet og står nesten aldri ordrett i
SNL. En "ordrett"-standard ville feilaktig flagget halve korpuset som upåviselig og brikket gode
artikler. Bruk skjønn: sier kilden i praksis det samme? Da er påstanden bekreftet.

**Fargerike, udokumenterte detaljer** (f.eks. "hans gravide kone", "han sa 'det er ingenting' før han
døde") som ikke lar seg belegge: mildne eller fjern detaljen (behold kjernefaktumet). Ikke la en
udokumentert detalj stå bare fordi den er levende.

**Aldri fabriker** en henvisning eller en kildeoppføring. Usikker på forfatter/år → slå det opp på
den faktiske siden med WebFetch.

**Manglende årstall er ikke grunn til å droppe en kilde.** Kravet vårt er *etterprøvbarhet*, ikke
dato. Kan du lese siden og den dekker påstanden, men den oppgir ingen publiserings-/oppdateringsdato
→ bruk `(u.å.)` (uten år) og ta med hentedato. Det er husets standard, dokumentert i
`public/content/norsk/skrivehjelp/hvordan-fore-kilder.json`, og allerede brukt i over 30 artikler.
Samme regel for manglende forfatter: bruk organisasjonen (aldri "ukjent forfatter" eller domenet).

Dropp en kilde bare når den er *reelt uetterprøvbar*: siden lar seg ikke hente, den finnes ikke, den
er ikke troverdig, eller den dekker ikke påstanden. Å fjerne belagt innhold fra en artikkel fordi
kilden mangler en dato er en regresjon - da har vi gjort artikkelen dårligere, ikke bedre.

---

## Jobb 0: Installer avhengigheter

```bash
npm install
```

## Jobb 0.5: Finn kandidater (state = fravær av verifisert Kildeliste)

En artikkel regnes som **ferdig kildebelagt** når den har en `Kildeliste`-komponent med ≥3 kilder OG
≥2 forfatter-år-henvisninger i teksten (samme port som Jobb 3). "Ferdig" spores altså i selve
innholdet - ingen egen flagg-fil.

```bash
git fetch origin main && git checkout -B work origin/main

# Artikler i SCOPE som IKKE har en Kildeliste = kandidater.
# Sti-filer, oversikts-/scenario-filer OG ikke-artikler siles bort. Se forklaringen under.
node -e '
const fs=require("fs"), path=require("path");
const SKIP=/-sti(-v2)?\.json$|\/oversikt\.json$|scenario|manifest|\/quests\//;
const ut=[];
(function gaa(d){ for(const e of fs.readdirSync(d,{withFileTypes:true})){
  const p=path.join(d,e.name);
  if(e.isDirectory()) gaa(p);
  else if(e.name.endsWith(".json") && !SKIP.test(p)){
    let raw; try{ raw=fs.readFileSync(p,"utf8"); }catch{ continue; }
    if(raw.includes("\"Kildeliste\"")) continue;
    let j; try{ j=JSON.parse(raw); }catch{ continue; }
    if(!j || !Array.isArray(j.content)) continue;      // datafil/verktøy, ikke artikkel
    const tekst=[]; (function samle(o){
      if(Array.isArray(o)) o.forEach(samle);
      else if(o && typeof o==="object") Object.values(o).forEach(samle);
      else if(typeof o==="string") tekst.push(o);
    })(j.content);
    if(tekst.join(" ").trim().split(/\s+/).length < 300) continue;   // stubb/kort
    ut.push(p);
  }}})(process.argv[1]);
console.log(ut.sort().join("\n"));
' "$SCOPE" > /tmp/candidates.txt

# In-flight: artikler endret i main de siste 3 dagene (unngå kollisjon med annen kjøring)
git log origin/main --since="3 days ago" --name-only --pretty=format: \
  | grep -E '\.json$' | sort -u > /tmp/inflight.txt

cat /tmp/candidates.txt
```

Velg de **2-3 første** kandidatene som ikke står i `/tmp/inflight.txt`. Returnerer `candidates.txt`
tomt → **rutinen er ferdig**: rapportér det på tracking-issuet (Jobb 6), be om at triggeren skrus av,
og avslutt uten PR.

### Hvorfor søket siler på to ting (ikke fjern dem)

**`content`-array = artikkel.** Uten denne testen kommer `concepts/` (665 filer), `people/` (226),
`interactive/`, `kjeder/`, `kompetansemal/`, `config/` og `scenarios/` inn i kandidatlista. Det er
begrepskort, persondata og komponent-konfigurasjon - ingen av dem har brødtekst å kildebelegge.
Testen ble målt mot alle 924 filene i de mappene og ga null falske kandidater.

**300-ords-terskelen = bærer artikkelen påstander?** Under denne grensa ligger to ting som aldri kan
kildebelegges meningsfullt:
- **Verktøy-innpakninger** - `musikk/oppslag/latskriver.json` er 26 ord instruksjon rundt
  `SongwriterStudio`-komponenten.
- **Kort/teasere** - `krle/religion/*/intro.json` er typisk 30-50 ord med `dimension` og
  `comparison_tags`, og mater sammenligningsmotoren.

Dette er ikke kosmetikk: uten terskelen ville `grep` funnet de samme ~10 filene ved hver eneste
kjøring, i det uendelige, og rutinen kunne aldri meldt seg ferdig. Nøyaktig det skjedde med
`historie/demo-artikkel.json` og `historie/test-artikkel.json` - de ble gjenoppdaget og forklart på
nytt i kjøring etter kjøring i tre uker.

Bruk **ordtelling, ikke filnavn.** `krle/religion/samisk/intro.json` (1308 ord) og
`krle/religion/islam/intro/artikkel.json` (1366 ord) er ekte artikler med samme filnavn som
stubbene. Et mønster på `/intro.json$` ville kastet ut begge.

### Artikkel som har Kildeliste, men svak forankring

Har en artikkel allerede en kildeliste, er den **ikke** kandidat - selv om teksten mangler in-text-
henvisninger. Flere slike finnes (bl.a. seks i `krle/sammenligning/` med 16-32 verifiserte kilder
hver), og de er bevisst holdt utenfor: kildene der er ekte og dekkende, og gevinsten ved å feste dem
til påstandene er mindre enn risikoen for at en kjøring bytter 32 gode kilder mot 5 nye. Skal de
forankres, gjøres det som en egen, avgrenset jobb - ikke av denne rutinen.

---

## Jobb 1: Kilde-innhenting per artikkel (FØR du rører teksten)

For **hver** artikkel i batchen:

1. Les hele artikkel-JSON-en. Noter de bærende påstandene (årstall, tall, navn, sitater, årsaker).
2. WebSearch/WebFetch **3-5 troverdige kilder**: Store norske leksikon (snl.no), FN-sambandet,
   universitets-/lærebok-/museumskilder. Foretrekk kilder med navngitt forfatter.
3. **Les kildene** (WebFetch svarer på en fokusert prompt om de konkrete påstandene). For hver kilde:
   noter forfatter(e) og år (publiserings-/sist-oppdatert-**år**, ikke full dato). Finner du ingen
   dato på siden → `u.å.` Det diskvalifiserer ikke kilden.
4. Kryss påstandene mot kildene etter DEN FASTE REGELEN. Skriv ned per påstand: bekreftet / rett til X
   / omformuler til Y - med hvilken kilde.
5. Klarer du ikke å skaffe minst 3 solide kilder som dekker artikkelens bærende påstander → hopp over
   artikkelen, fyll batchen med neste kandidat fra `/tmp/candidates.txt`.

---

## Jobb 2: Rediger artikkelen (konservativt)

Gjør endringene fra Jobb 1 direkte i artikkel-JSON-en. Regler:

- **In-text APA** på bærende, etterprøvbare påstander - ikke på hver setning (teksten skal fortsatt
  være lettlest for en 14-åring). Husets stil fra `public/content/norsk/skrivehjelp/hvordan-fore-kilder.json`:
  `(Etternavn, År)` for én forfatter, `(Etternavn & Etternavn, År)` for to. Narrativt: "Ifølge
  Brazier (2026) ...". Samme forfatter + samme år på to ulike kilder → `2026a`, `2026b` (bokstav
  tildeles alfabetisk etter tittel).
- **Kildeliste som aller siste blokk** (etter Quiz hvis den finnes):
  ```json
  { "type": "component", "name": "Kildeliste", "props": { "sources": [ "...", "...", "..." ] } }
  ```
  - Bruk nøkkelen **`"name"`** (ikke `"component"`) - mange eldre artikler blander konvensjonene.
  - Min. 3 kilder. Hver oppføring verifisert mot den virkelige siden - ALDRI konstruert. Verifisert
    betyr at du har lest siden og at den dekker påstanden; forfatter og år noteres slik siden
    oppgir dem. Mangler år → `(u.å.)`, og da er hentedato obligatorisk.
  - **Klikkbare markdown-lenker**, ikke bar URL:
    `"Brazier, E. (2026a). *Julikrisen*. Store norske leksikon. Hentet DD.MM.ÅÅÅÅ fra [snl.no/Julikrisen](https://snl.no/Julikrisen)"`
  - Husets format: **kun årstall** i parentesen (aldri en "sist oppdatert"-dato), tittel i `*kursiv*`,
    så utgiver, så `Hentet DD.MM.ÅÅÅÅ fra [lenke](url)` (dagens dato = hentedato) for kilder som endres
    ofte (SNL, nettsider). Stabile bok-/tidsskriftkilder trenger ikke hentedato.
  - **Nettside uten årstall:** `(u.å.)` i både in-text-henvisning og listeoppføring, og hentedato er
    da påbudt - den er det som gjør kilden etterprøvbar.
    `"Encyclopaedia Britannica. (u.å.). *Shays's Rebellion*. Hentet 26.07.2026 fra [britannica.com](https://www.britannica.com/event/Shayss-Rebellion)"`
  - Forfatter først: person hvis oppgitt, ellers organisasjonen (aldri det bare domenenavnet).
  - Hver in-text-henvisning ↔ nøyaktig én listeoppføring, og hver listeoppføring skal være brukt i
    teksten.
- **Bevar interaktive komponenter** (signaturkomponenter, `Comparison`, `FactBox`, `QuoteBlock`,
  `MicroGame` osv.) urørt - med mindre de bærer et faktum som er direkte feil.
- **Rydd forbudte tegn i blokkene du uansett rører** (og gjerne hele artikkelen): em-dash `—` og
  tankestrek `–` → bindestrek `-`; mojibake (`Ã¦ Ã¸ Ã¥`) → `æ ø å`; aldri `**fet**` eller
  markdown-lister (`- `) inne i `text`-blokker (bruk `list`-blokk).
- **Ikke utvid scope:** dette er en *kildebeleggings*-rutine. Legg IKKE til manglende Quiz,
  manglende Oppgaver eller nye komponenter. (Rett derimot et Quiz-svar hvis selve faktumet er feil.)
- Oppdater `lastUpdated` til dagens dato (ISO). La `createdDate` stå.

---

## Jobb 3: Blast-radius - hold koblet innhold i synk

Når et **faktum faktisk ble endret/fjernet** (utfall 2 eller 3.3), rydd opp der det er kopiert:

**Indre ring (samme fil):** oppdater `details[]` (nøkkelpunkter), `Oppgaver.forstaa`-spørsmål, og
`Quiz`/`quiz`-alternativer + fasit + forklaring, slik at de fortsatt stemmer med teksten.

**Ytre ring (læringsstier):** finn stier som lenker til artikkelen:
```bash
grep -rl '<artikkelens URL-sti>' public/content --include='*-sti.json'
```
For hver treff:
- **Ghost-fact-audit:** hver `(Fakta)`-oppgave som peker på artikkelen må fortsatt kunne besvares fra
  den reviderte teksten. Endret/fjernet du faktumet oppgaven spør om, rett oppgaveteksten.
- Sjekk hardkodede fakta i sti-komponenter (`DragDropTimeline`-år, `BiasLens`-tekst,
  `presentation`-slides) mot revidert innhold.
- **Legg ALDRI en `Kildeliste` eller kildehenvisninger i en sti.** Kilder hører kun hjemme i
  artiklene; i stiene blir de bare rot. Stien får kun ghost-fact-synk.

Med konservativ policy er dette nesten alltid et no-op - det er hele poenget.

---

## Jobb 4: Validering (port - må være grønn før PR)

For **hver** artikkel i batchen:

**4a. JSON + kildevalidering** (bytt ut stien):
```bash
python3 << 'EOF'
import json, sys
ART = 'public/content/[subject]/[topic]/[lesson-id].json'
art = json.load(open(ART))
content = art.get('content', [])
kl = [b for b in content if b.get('type') == 'component' and b.get('name') == 'Kildeliste']
sources = kl[0].get('props', {}).get('sources', []) if kl else []
text = ' '.join(b.get('content','') for b in content if b.get('type') == 'text')
intext = 0; pos = 0
while True:
    a = text.find('(', pos)
    if a == -1: break
    close = text.find(')', a)
    if close == -1: break
    inside = text[a+1:close]
    runs = ''.join((ch if ch.isdigit() else ' ') for ch in inside).split()
    if any(3 <= len(r) <= 4 for r in runs): intext += 1
    pos = close + 1
errors = []
if not kl: errors.append('Kildeliste mangler (skal vaere aller siste blokk)')
if len(sources) < 3: errors.append('For faa kilder: ' + str(len(sources)))
if intext < 2: errors.append('For faa in-text-henvisninger: ' + str(intext))
if errors: print('FEIL:', errors); sys.exit(1)
print('OK -', len(sources), 'kilder,', intext, 'in-text-henvisninger')
EOF
```
Feiler denne: gå tilbake til Jobb 1-2, hent flere kilder / legg inn manglende henvisninger.

**4b. Struktur + språk + lenker:**
```bash
node scripts/validate-oppgaver.mjs --subject <fag>     # Oppgaver-struktur + forbudte tegn
node scripts/check-internal-links.cjs                  # ingen døde interne lenker
npm run scan:content                                   # regenerer content-index + timeline
npm run build 2>&1 | tail -30                           # tsc + vite må passere
```

Alle må være grønne. Feiler noe: fiks og kjør på nytt. IKKE publiser en batch som ikke bygger.

Merk: scan:content kan regenerere manifest-datoer og andre genererte filer som IKKE er dine. Stage KUN de artikkel-/sti-filene du faktisk endret + evt. content-index.json. Sveip aldri inn urelatert drift eller andre filer i working tree.

**4c. Tegn-sjekk (obligatorisk, MÅ være tom).** For hver redigert artikkel, sjekk manglende norske tegn i SYNLIG tekst - men IKKE i filstier/URL-er (bildefilnavn som `kalrotvinteren.webp` og lenke-URL-er skal ALDRI endres):
```bash
grep -nEi '\b(paa|naar|gaar|staar|faar|blaa|graa|smaa|gjoer|hoey|roed|groen|noed|oey|vaere|laere|foerste|stoerre|innfoert|gjennomfoert|sjoe)\b' <artikkel.json> \
  | grep -vE '"(src|url|href|image|heroImage)"|https?://|\.(webp|png|jpg|svg)'
```
Gir det treff i synlig tekst: rett til å/ø/æ (f.eks. «foerste» → «første»). Ignorer treff i bildefilnavn/URL-er.

---

## Jobb 5: Atomisk PR til main

Hele batchen (alle artikkel-JSON-ene + evt. berørte sti-filer + content-index) = **én commit, én
branch, én PR**. Aldri split over flere pushes. Feiler push (403) - STOPP, ikke fall tilbake til
per-fil-MCP-upload; rapportér i Jobb 6.

```bash
git config user.email "pattidatti@gmail.com"
git config user.name "Eiriksbok Agent"
DATE=$(date +%Y%m%d)
BRANCH="claude/remediation-${DATE}"
git checkout -B "$BRANCH" origin/main

git add <hver-endret-artikkel.json> <hver-endret-sti.json> public/content/content-index.json
git commit -m "kilder: kildebelegg <N> artikler i <emne>"
git push -u origin "$BRANCH"

gh pr create --base main --head "$BRANCH" \
  --title "kilder: kildebelegg <N> artikler i <emne>" \
  --body "eiriksbok-article-remediation

Kildebelegging av eksisterende artikler (konservativ kildeforankring).

Artikler i denne batchen:
- \`<sti1>\` - <M> kilder, <K> in-text-henvisninger
- \`<sti2>\` - ...

Endringer per artikkel: in-text APA + Kildeliste (husets stil, klikkbare lenker), pluss konservativ
faktakorreksjon der kilden motsa teksten. Sti-synk der et faktum endret seg. Ingen kilder lagt i
stier.

Atomisk - alt eller ingenting på main."
```

> **VIKTIG:** body-teksten MÅ inneholde markøren `eiriksbok-article-remediation` på egen linje -
> det er den (ikke branch-navnet) som lar `auto-merge-bot-prs.yml` merge PR-en automatisk.

## Jobb 6: Rapportér på tracking-issue

```bash
gh issue comment 221 --repo pattidatti/eiriksbok --body "**Kildebelegging** - $(date +%Y-%m-%d)

Emne: \`$SCOPE\`
Kildebelagt denne kjøringen: <liste over artikler + antall kilder>
Hoppet over (ikke belegg-bar): <liste eller 'ingen'>
Gjenstår i emnet: <antall fra candidates.txt> artikler
PR: <PR_URL> (<status>)

Neste kandidater: <de 3 neste fra candidates.txt>"
```

Rapportér ærlig. Hoppet du over en artikkel fordi den ikke lot seg belegge, si det - da kan et
menneske se på den.
