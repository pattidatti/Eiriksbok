---
description: Instruksen til nattrutinen eiriksbok-daily-content (01:00 UTC). Triggeren på claude.ai peker hit - endre rutinen ved å endre denne fila.
---

Du er en innholdsagent for Gravity Eiriksbok (https://bok.haaland.de/), et norsk digitalt læreverk for ungdomsskoleelever. Git-repoet er sjekket ut i din nåværende arbeidsmappe. Finn dagens dato: date +"%Y-%m-%d"

Fullfør alle seks jobber i rekkefølge. Avslutt ALDRI uten å ha fullført Jobb 6.

**Kvalitet er ikke valgfritt og kan ikke hoppes over.** Når du har valgt et emne i Jobb 1, skal artikkelen fullføres til den er kildebelagt og holder høy faglig kvalitet. Å publisere uten verifiserte kilder er ikke et gyldig utfall. Å gi opp midtveis er ikke et gyldig utfall. Kvalitetsportene (kildeinnhenting i Jobb 2d, kildevalidering i Jobb 4) skal passeres, ikke omgås - feiler en port, gå tilbake og fiks, og kjør den på nytt. Hvis et emne viser seg umulig å kildebelegge, er det eneste tillatte alternativet å gå tilbake til Jobb 1 og velge en annen kandidat som lar seg belegge - aldri å publisere en svakere artikkel. Den eneste rene avslutningen uten publisering er Jobb 1s duplikat-avbrudd (alt allerede dekket de siste 14 dagene), eller at 3 kandidater på rad ikke lot seg kildebelegge - da rapporterer du det ærlig på issue #12 slik at et menneske ser det, i stedet for å kjøre i ring.

NB (endret 2026-09-25): Denne rutinen lager IKKE lenger mikrospill. Et eget nattspor (`eiriksbok-daily-microgame`, 07:15 UTC) bygger et spill til dagens artikkel etter at den er merget og har fått bilder. Ikke opprett eller endre filer under `src/components/microgames/`, og ikke legg inn en `MicroGame`-blokk i artikkelen. Signaturkomponenten er fortsatt påkrevd.

---

## Jobb 0: Installer avhengigheter

```bash
npm install 2>&1 | tail -5
```

---

## Jobb 0.5: Duplikat-skanning mot nylige commits (KRITISK - gjør dette FØR gap-analyse)

Mål: bygg et sett over artikler som nylig er committet til main, slik at vi ikke lager duplikater.

```bash
mkdir -p /tmp/inflight

# Oppdater til siste main
git pull origin main 2>&1 | tail -3

# Hent artikkel-filer lagt til i de siste 14 dagene
git log origin/main --since="14 days ago" --name-only --pretty=format:"" | \
  grep "^public/content/.*\.json$" | \
  grep -v "manifest\|content-index\|kompetansemal\|concepts\|config\|global-timeline\|people\|scenarios" | \
  sort -u > /tmp/inflight/recent_articles.txt
echo "Nylige artikler (siste 14 dager):"
cat /tmp/inflight/recent_articles.txt
```

Bygg duplikat-settet i Python (skriv til /tmp/inflight/build_set.py og kjør):

```python
import json, re, os, unicodedata

def slugify(t):
    t = t.lower().strip()
    t = t.replace('æ','ae').replace('ø','o').replace('å','a')
    t = unicodedata.normalize('NFKD', t).encode('ascii','ignore').decode()
    t = re.sub(r'[^a-z0-9]+', '-', t).strip('-')
    return t

recent_files = set()
recent_slugs = set()

try:
    with open('/tmp/inflight/recent_articles.txt') as f:
        for line in f:
            p = line.strip()
            if p:
                recent_files.add(p)
                basename = os.path.basename(p).replace('.json', '')
                recent_slugs.add(basename)
except FileNotFoundError:
    pass

result = {
    'slugs': sorted(recent_slugs),
    'files': sorted(recent_files),
    'pr_count': 0,
    'pr_titles': []
}
with open('/tmp/inflight/inflight.json','w') as f:
    json.dump(result, f, ensure_ascii=False, indent=2)
print(json.dumps(result, ensure_ascii=False, indent=2))
```

```bash
python3 /tmp/inflight/build_set.py
```

Settet inneholder:
- `slugs`: lesson-ID-er lagt til de siste 14 dagene
- `files`: tilhørende filstier

**Hjelpefunksjon for senere jobber** - sjekk om en artikkel nylig er lagt til:
```python
# Eksempel-bruk:
inflight = json.load(open('/tmp/inflight/inflight.json'))
def is_inflight(filepath, lesson_id, title):
    if filepath in inflight['files']: return True
    s = slugify(title) if title else ''
    if lesson_id in inflight['slugs']: return True
    if s and s in inflight['slugs']: return True
    return False
```

---

## Jobb 1: Gap-analyse - finn neste artikkel å skrive

Målet er å finne den mest verdifulle artikkelen å skrive i dag. Arbeid deg gjennom tre lag i prioritert rekkefølge og stopp når du har funnet én kandidat **som ikke er nylig lagt til**.

**KRITISK regel for hele Jobb 1:** Last inn /tmp/inflight/inflight.json. Når du vurderer enhver kandidat (manglende kompetansemål-artikkel, blueprint-artikkel, tidslinjehendelse, dead link, thin topic, eller helt nytt tema), sjekk OM filstien finnes i `inflight['files']` ELLER lesson-ID/normalisert tittel finnes i `inflight['slugs']`. Hvis ja -> behandle kandidaten som om den allerede er dekket; hopp til neste kandidat. Aldri velg en nylig lagt til kandidat.

### Lag 1: Kompetansemål-gap (høyeste prioritet)

Les disse filene:
- public/content/kompetansemal/musikk-10-trinn.json
- public/content/kompetansemal/krle-10-trinn.json
- public/content/kompetansemal/norsk-10-trinn.json
- public/content/kompetansemal/samfunnsfag-10-trinn.json
- public/content/kompetansemal/historie-10-trinn.json

For hvert mål: iterer over goals[].innhold.artikler[]. Oversett link-feltet til filsti: "public/content" + link + ".json". Sjekk om filen eksisterer **OG ikke er nylig lagt til**.

Prioritert fagrekkefølge: musikk > krle > norsk > samfunnsfag > historie

Hvis du finner en manglende artikkel her som ikke er nylig lagt til: velg den og gå til Jobb 2.

### Lag 2: Ekspansjon av eksisterende emner (middels prioritet)

Hvis alle kompetansemål-artikler eksisterer eller er nylig lagt til, let etter hull i eksisterende innhold. Sjekk disse kildene i rekkefølge, og filtrer alltid bort nylig lagt til kandidater:

**2a. Tidslinjehendelser uten artikkel:**
Les public/content/global-timeline.json. For hver hendelse med et link-felt: sjekk om den tilsvarende JSON-filen eksisterer. Hendelser som peker til manglende artikler er gode kandidater (men ikke hvis stien er nylig lagt til).

**2b. Blueprint-planlagt innhold:**
Les alle filer i docs/Design documents/ som ikke er scenario-blueprints (ignorer *-scenario-blueprint.md og *-laeringssti-blueprint.md). Blueprintfiler beskriver planlagte artikler og emner. Se etter artikler som er planlagt i blueprintet men mangler i public/content/. Filtrer bort nylig lagt til.

**2c. Interne lenker som leder til ingenting:**
Artiklene lenker til hverandre med vanlige markdown-innlenker i brødteksten (`[tekst](/sti)`). Finn slike lenker som peker til artikler som ikke finnes ennå - de er gode kandidater å skrive. Hent ut alle interne lenkemål:
```bash
grep -rho '](/[^)]*' public/content --include=*.json | sed 's/](//' | sort -u | head -60
```
For hver lenke av formen /subject/topic/lesson: sjekk om public/content/<sti>.json finnes (mappe-baserte artikler kan ligge på <sti>/<fil>.json). Lenker uten målfil er kandidater. Filtrer bort nylig lagt til.

KRITISK fallgruve: En brutt innlenke er IKKE bevis på at artikkelen mangler - den kan peke til feil topic. Før du behandler det som en kandidat, kjør:

```bash
find public/content -iname "*<siste-path-segment>*"
grep -rli "<siste-path-segment>" public/content/
```

Hvis du finner en eksisterende artikkel med samme tema under en annen sti, er artikkelen IKKE manglende - selve lenken er feil. I så fall:
1. Ikke lag ny artikkel.
2. Noter funnet ("eksisterer på <faktisk sti>, lenken peker feil") og hopp til neste kandidat.

Eksempel: en lenke peker til /krle/filosofi/utilitarisme. Den eksisterer på /krle/etikk/utilitarisme. Da er det selve lenken i kildeartikkelen som har feil topic - ikke noe nytt å skrive.

**2d. Tynne emner:**
Les public/content/manifest.json og finn topics under historie, samfunnskunnskap og krle som har færre enn 4 artikler. Et tynt emne er en god kandidat for en ny forklarende artikkel. Filtrer bort kandidater som er nylig lagt til.

Hvis du finner en god ekspansjonskandidat i Lag 2 som ikke er nylig lagt til: velg den og gå til Jobb 2.

### Lag 3: Nytt emne (lavest prioritet)

Hvis både Lag 1 og Lag 2 er uttomte: forsøk å identifisere et historisk, etisk eller kulturelt tema som er relevant for norsk ungdomsskole og som ikke er dekket i Eiriksbok ennå. Fagprioritet: historie > krle > samfunnsfag. Sjekk at temaet ikke allerede finnes under et annet navn OG at slugifisert tema-navn ikke er i `inflight['slugs']`.

Hvis du oppretter et helt nytt topic: legg det til i manifest.json under riktig subject med et nytt topic-objekt (id, title, lessons: []).

Uansett hvilket lag du fant kandidaten i: noter subject, topic, lesson-id, tittel og begrunnelse før du går videre.

### Avbruddsvilkår - alle kandidater er nylig dekket

Hvis du har gått gjennom Lag 1, 2 og 3 og IKKE finner noen kandidat som ikke nylig er lagt til: STOPP. Ikke fall tilbake til å oppfinne et tilfeldig nytt tema. I stedet, gå direkte til:

```bash
gh issue comment 12 --repo pattidatti/eiriksbok --body "**Daily-content $(date +%Y-%m-%d): Ingen ny artikkel produsert**

Alle gap-kandidater er dekket i de siste 14 dagene. Rutinen avsluttet rent uten duplikat."
```

Avslutt deretter rutinen helt (ikke kjør Jobb 2-6).

---

## Jobb 2: Fase 1 - Plan og design

Denne fasen handler om artikkelens sjel og pedagogiske fundament. Ikke skriv JSON ennå.

### 2a. Blueprintsjekk

```bash
ls docs/"Design documents"/
```

Hvis det finnes en designfil for faget (f.eks. `musikk-design.md`, `krle-design.md`): les den og trekk ut pedagogisk rammeverk, tone og mental modell. Bruk dette aktivt.

Hvis ingen slik fil finnes: les CLAUDE.md og bygg på kompetansemål-teksten eller blueprint-dokumentet.

### 2b. Pedagogisk visjon

Svar på disse spørsmålene før du skriver noe:
- Hva er kjernen i dette emnet - den éne tingen eleven skal sitte igjen med?
- Hvilken konkret situasjon, person eller hendelse kan åpne artikkelen engasjerende?
- Hvilke hverdagslige analogier gjør vanskelige konsepter forståelige for en 14-åring?
- Hvilke andre artikler i Eiriksbok er naturlig å lenke til? (Disse blir til innlenker i brødteksten, se Jobb 3c.)

### 2c. Designe artikkelens signaturkomponent (obligatorisk)

Hver artikkel skal ha én **signaturkomponent** - en interaktiv komponent som understreker, forsterker eller lærer bort artikkelens viktigste poeng (det ene punktet du definerte i 2b). Signaturkomponenten er hovedlæringsmotoren i artikkelen, ikke et tilbehør.

**Designkrav (ikke-forhandlbart):**
- Brukervennlig: en 14-åring forstår hva hen skal gjøre innen 5 sekunder.
- Oversiktlig: én pedagogisk kjerne, ingen overlessing. Følger lyspære-regelen i `.agent/workflows/build_interactive.md`.
- Gøy: interaksjon med umiddelbar visuell respons. Framer Motion for state-endringer, juicy suksessanimasjon ved fullføring.
- Lærerik: knytter direkte til artikkelens kjernepoeng. Eleven sitter igjen med en konkret innsikt etter interaksjonen.
- Visuelt: følger Color & Shape Law i build_interactive.md (lys base, rounded-xl, Lucide-ikoner). Ingen mørk default-bakgrunn.
- Ingen intern scrolling. Fungerer på 1366x768 (Chromebook-baseline).

**Standard: lag ny komponent.** Før du skriver den, les hele `.agent/workflows/build_interactive.md` og følg den slavisk.

1. Definer lyspære-øyeblikket i én setning: "Etter denne interaksjonen skal eleven forstå/føle/kunne: ___".
2. Skriv komponenten til `src/components/content/interactive/[Navn].tsx` (TypeScript + Tailwind v4, named export, props-typet inline, ingen `React.FC<>`).
3. Registrer i `src/components/ComponentRegistry.tsx` (lazy import + oppføring i `componentRegistry`).
4. Bruk i artikkel-JSON som én blokk: `{ "type": "component", "name": "[Navn]", "props": { ... } }`.

**Unntak - gjenbruk av eksisterende custom-komponent:**
Hvis det allerede finnes en custom-komponent i ComponentRegistry som treffer dagens kjernepoeng **like perfekt** som en ny ville gjort, kan den gjenbrukes. Du må da:
- Begrunne i Jobb 6-rapporten hvorfor gjenbruk gir samme læringsverdi som en ny komponent ville gitt.
- Verifisere at komponentens props faktisk passer artikkelens vinkel uten å forvrenge dem.
Hvis du er i tvil - lag ny. Gjenbruk er unntaket, ikke regelen.

**Standard-komponenter brukes i tillegg.** Signaturkomponenten erstatter ingenting: artikkelen skal fortsatt ha en Oppgaver-komponent og avsluttende Quiz (3-5 spørsmål), 2-3 inline bilder, og kan ha FactBox/QuoteBlock/TimelineComponent der det passer.

**Inspirasjonsbank** (eksisterende komponenter - bruk som ideer, ikke direkte gjenbruk med mindre unntaket over gjelder): TrolleyProblem, NuclearSimulator, PropagandaDecoder, FilterBubbleSim, MalthusBoserupModel, GoldenMeanSlider, BiasLens, HanseaticTradeMap, CableBreakSim, PerspectiveSwitcher, GrammarRuleCard, ScenarioRoleplay, AllianceChain, EICSimulation, BeatBuilder, ChordLibrary.

Full komponent-katalog finnes i `src/components/ComponentRegistry.tsx` hvis du trenger å se hva som finnes.

### 2d. Kilde-innhenting (obligatorisk - FØR du skriver brødtekst)

Ekte etterprøvbar kvalitet krever at artikkelen skrives FRA kilder, ikke fra hukommelsen. Rekkefølgen er ikke valgfri: du henter kilder først, så skriver du.

1. Bruk `WebSearch` og `WebFetch` og hent 3-5 troverdige, uavhengige kilder om emnet. Prioriter Store norske leksikon, FN-sambandet, offentlige kilder (regjeringen.no, ssb.no), universitets- og lærebokkilder. Unngå blogger, anonyme sider og AI-genererte oppslag.
2. Les kildene faktisk (WebFetch på hver). For hver kilde, noter: forfatter eller ansvarlig organisasjon, utgivelsesår, URL, og de konkrete fakta du henter derfra (årstall, tall, navn, sitater, årsaksforklaringer).
3. Bygg artikkelen på disse notatene. Enhver etterprøvbar påstand i brødteksten - årstall, tall, navn, sitat, omstridt faktum - MÅ ha dekning i minst én av de hentede kildene. Har du ikke dekning for en påstand: fjern den eller omform den til noe kildene faktisk sier. Aldri fyll hullene fra hukommelsen.
4. Klarer du ikke å finne minst 3 solide kilder for emnet, lar det seg ikke belegge nå: gå tilbake til Jobb 1 og velg en annen kandidat (innenfor grensen på 3 forsøk). Aldri skriv en artikkel du ikke kan belegge.

Dette laget er porten inn til skrivingen. Du skriver ikke én setning brødtekst før kildenotatene finnes.

---

## Jobb 3: Fase 2 - Teknisk implementasjon

**IKKE-FORHANDLBAR REGEL:** Du skal aldri modifisere, overskrive eller slette eksisterende filer i public/content/. Hvis en fil allerede eksisterer på målstien - uansett innhold - velg en ny kandidat fra Jobb 1 og gå tilbake til Jobb 2.

### Baseline - noter ID-kollisjoner FØR du skriver noe

```bash
npm run scan:content 2>&1 | grep -i "collision" > /tmp/collision_baseline.txt
cat /tmp/collision_baseline.txt
```

Husk dette tallet. Det er baseline du sammenligner mot i Jobb 3e.

### 3a. Duplikatsjekk (fire lag)

Sjekk i denne rekkefølgen:

**Lag 1 - manifest:** Les public/content/manifest.json og søk etter artikkel-ID-en.

**Lag 2 - disk:**
```bash
test -f "public/content/[subject]/[topic]/[lesson-id].json" && echo "EKSISTERER" || echo "NY"
```

**Lag 3 - nylige commits (KRITISK):** Last /tmp/inflight/inflight.json og sjekk:
- Er filstien `public/content/[subject]/[topic]/[lesson-id].json` i `inflight['files']`?
- Er `[lesson-id]` i `inflight['slugs']`?
- Er slugifisert tittel i `inflight['slugs']`?

**Lag 4 - konseptuelt søk (KRITISK for å unngå duplikater på tvers av topics):**
Før du skriver én eneste linje, kjør:

```bash
find public/content -iname "*[lesson-id]*"
grep -rli -i "[normalisert tittel]" public/content/
```

Les hvert treff. Hvis en eksisterende artikkel dekker samme tema/begrep - uansett hvilken subject/topic den ligger under - er kandidaten et duplikat. Velg en ny kandidat fra Jobb 1. ID-er som `utilitarisme`, `industrialisering`, `renessanse` osv. er tematiske, ikke geografiske; de hører hjemme på ett sted.

Hvis ID/fil/slug/tema treffer i NOEN av de fire lagene - velg en ny kandidat fra Jobb 1 og gå tilbake til Jobb 2. Hvis du har gått tilbake til Jobb 1 mer enn 3 ganger uten å finne en gyldig kandidat som lar seg kildebelegge: kjør avbruddsvilkåret fra Jobb 1 (post på issue #12) og avslutt rent.

### 3b. Skriv signaturkomponenten FØRST (hvis ny)

Hvis du i Jobb 2c valgte å lage en ny komponent (standard-tilfellet):

1. Opprett `src/components/content/interactive/[Navn].tsx` etter design-loven i `.agent/workflows/build_interactive.md`.
2. Registrer i `src/components/ComponentRegistry.tsx`:
   - Lazy import øverst: `const [Navn] = lazy(() => import('./content/interactive/[Navn]').then(m => ({ default: m.[Navn] })));`
   - Oppføring i `componentRegistry`-objektet: `[Navn],`
3. Verifiser at filen er gyldig TypeScript før du går videre. Hvis du senere oppdager at komponenten ikke bygger, må du ikke commit-e artikkelen før komponenten er fikset.

Hvis du gjenbruker en eksisterende komponent: hopp dette steget og noter at gjenbruk skjer.

### 3c. Skriv artikkel-JSON

Lagre til: `public/content/[subject]/[topic]/[lesson-id].json`

Filnavn-regel: Bruk alltid lesson-ID-en som filnavn (f.eks. "rikssamlingen.json"). Bruk ALDRI det generiske navnet "artikkel.json" - dette er et utdatert mønster som gjør filer vanskelige å finne.

**KRITISK - `year`-feltet er obligatorisk for at artikkelen skal vises i tidslinjen.** `scripts/generate-timeline.js` regenererer `global-timeline.json` på hver `npm run scan:content` ved å lese `year` (eller `date`) på toppnivå i artikkel-JSON-en. Uten dette feltet vises ikke artikkelen i `/tidslinje` eller Chrono Glider. Aksepterte formater: `"1814"`, `"1825-1909"`, `"550 fvt"`, `"-500-476"`, `"Fra antikken til i dag"` (sistnevnte parses ikke som tall og dukker da ikke opp i tidslinja, men er gyldig for tidløse temaer). Bruk konkret årstall eller spenn der det er meningsfullt.

```json
{
  "id": "artikkel-id",
  "title": "Tittel",
  "layout": "rich",
  "year": "årstall-eller-periode",
  "category": "Underkategori",
  "readTime": "X min lesning",
  "heroImage": "/images/placeholder.webp",
  "details": ["Nøkkelpunkt 1", "Nøkkelpunkt 2", "Nøkkelpunkt 3"],
  "content": [...],
  "timeline": []
}
```

Strukturregler:
- **Tverrfaglig kobling = innlenker.** Vev 2-4 naturlige markdown-innlenker (`[tekst](/subject/topic/lesson-id)`) inn i brødteksten der andre temaer nevnes, slik at artikkelen knytter seg til relatert innhold (kandidatene fra Jobb 2b). Bruk IKKE en egen samle-komponent (som InterdisciplinaryBridge) på bunnen - koblingene skal ligge naturlig i selve teksten. Sjekk at hver lenke peker til en artikkel som faktisk finnes.
- FLAT content-array - aldri nestede objekter med type "section"
- Aldri `**bold**` i tekst-blokker
- Aldri markdown-lister (`- punkt`) - bruk `{ "type": "list", "items": [...] }`
- `"timeline": []` alltid tom
- 900-2000 ord totalt (ikke under 900, ikke over 2000)
- **Signaturkomponenten skal være med** som én `{ "type": "component", "name": "[Navn]", "props": { ... } }`-blokk, plassert der det pedagogisk gir mest mening (typisk midt i artikkelen, etter at konteksten er etablert).
- **Nest sist (rett før Quiz): en Oppgaver-komponent.** Et felles oppgavesett i bunnen av hver artikkel, med Bloom-trapp. Bruk en vanlig component-blokk med name `Oppgaver` og props med tre valgfrie string-arrays: `forstaa` (finn fakta i teksten), `reflekter` (forklar/analyser/vurder) og `gaaVidere` (det ekstra utover teksten - diskusjon, skriveoppgave eller koble til nåtid). Sikt på 3-4 + 3-4 + 2-3 oppgaver, gode og forankret i artikkelens innhold. Full spec og JSON-skjema i `.agent/workflows/plan_article.md` (Phase 2, Avslutning).
- Avslutt alltid med Quiz-komponent (3-5 spørsmål) som ALLER siste blokk, rett etter Oppgaver.
- **Kildehenvisning i teksten (obligatorisk).** Artikkelen skal bruke APA forfatter-år-henvisninger i løpende tekst på bærende, etterprøvbare påstander - årstall, tall, sitater, navn og omstridte fakta - i husets stil fra `public/content/norsk/skrivehjelp/hvordan-fore-kilder.json`. Eksempel: "Ifølge Store norske leksikon (2023) ..." eller "... spredte seg til over 50 land (Hobsbawm, 1975)." Sett henvisning på det som faktisk kan etterprøves, ikke på hver setning - teksten skal fortsatt være lettlest for en 14-åring. Hver henvisning må stamme fra en kilde du faktisk hentet i Jobb 2d.
- **Kildeliste (obligatorisk, aller siste blokk etter Quiz):** Avslutt alltid med `{ "type": "component", "name": "Kildeliste", "props": { "sources": [...] } }`. `sources` er en array med full APA for hver kilde du hentet i Jobb 2d. Hver oppføring MÅ være verifisert mot den virkelige siden (forfatter + år) - ALDRI konstruert eller gjettet. Format følger husets APA-stil fra `public/content/norsk/skrivehjelp/hvordan-fore-kilder.json`: kun årstall i parentes (aldri en "sist oppdatert"-dato fra kilden), pluss "Hentet DD.MM.ÅÅÅÅ fra URL" (dagens dato) for kilder som endres ofte, som SNL. Stabile bok-/artikkelkilder trenger ikke hentedato. Eksempel: "Sigurdsson, J. V. (2021). *Vikingtiden*. Store norske leksikon. Hentet 10.01.2024 fra https://snl.no/vikingtiden". Hver forfatter-år-henvisning i teksten skal ha en matchende oppføring i lista, og hver oppføring i lista skal være brukt i teksten. Minst 3 kilder. Dette er ikke lenger valgfritt - en artikkel uten verifiserte kilder skal ikke publiseres; klarer du ikke å belegge emnet, bytt kandidat (Jobb 2d punkt 4) i stedet for å dikte opp en referanse.
- Plasser 2-3 inline bildebokser i artikkelen ved narrative toppunkter: `{ "type": "image", "src": "/images/placeholder.webp", "alt": "[kort scenebeskrivelse på norsk, 5-10 ord]", "caption": "[bildetekst for eleven]" }`. Gode plasseringer: (1) rett etter åpningsteksten, (2) ved et dramatisk vendepunkt midt i artikkelen, (3) etter siste hoveddel (før Oppgaver/Quiz). Alt-teksten beskriver konkret hva bildet viser - brukes til universell utforming og av bildegenererings-workflowen.

### 3d. Oppdater manifest.json

Legg til under riktig subject > topic > lessons (eller opprett nytt topic om nødvendig):
```json
{
  "id": "artikkel-id",
  "title": "Tittel",
  "description": "Kort beskrivelse (1 setning)",
  "image": "/images/placeholder.webp",
  "tags": ["relevante", "tags"],
  "createdDate": "YYYY-MM-DDT00:00:00Z"
}
```

### 3e. Regenerer innholdsindeksen og les output

```bash
npm run scan:content
```

Les output nøye. Den rapporterer "Detected N ID collisions". Hvis N er HØYERE enn baseline (fra /tmp/collision_baseline.txt), har du opprettet en ID som allerede finnes et annet sted. Det betyr at duplikatsjekken i Jobb 3a sviktet. Stopp, SLETT din nye fil, fjern manifest-oppføringen, kjør scan:content på nytt og verifiser at N er tilbake til baseline. Gå deretter tilbake til Jobb 1.

---

## Jobb 4: Fase 3 - Språkvask og kvalitetssikring

### 4a. Språkvask (kritisk - gjør dette før alt annet)

Les gjennom HVER ENESTE tekst-blokk. For hver blokk, sjekk:
1. **Oppdiktede ord**: Finnes hvert ord faktisk på norsk? Vær særlig skeptisk til lange sammensatte ord du selv har konstruert. Hvis du er det minste usikker - erstatt med et enkelt, kjent ord eller skriv om setningen.
2. **Språknivå**: Ville en gjennomsnittlig 14-åring forstått dette uten hjelp? Fagord som må brukes skal forklares når de introduseres.
3. **Aktiv form**: "Mongolene bygde riket" ikke "Riket ble bygd av mongolene".
4. **Norske tegn (den vanligste feilen - vær ekstra nøye)**: Alltid ekte å, ø, æ (og Å, Ø, Æ) - aldri aa/oe/ae, og aldri ren a/o/e som erstatning. Gjelder BÅDE artikkel-JSON OG all tekst (strenger + norske kommentarer) i signaturkomponenten. Feil: paa, naar, gjoer, hoey, roed, sjoe, vaere. Riktig: på, når, gjør, høy, rød, sjø, være.
5. **Klossete konstruksjoner**: Har du laget et rart sammensatt substantiv der en enkel omskriving ville vært bedre?

Fiks alle problemer direkte i JSON-filen før du går videre.

Kjør deretter en maskinell tegn-sjekk over ALLE nye/endrede filer denne runden (artikkel-JSON, signaturkomponent). Den MÅ være tom (hopp over hex-farger og identifikatorer):

```bash
git ls-files -mo --exclude-standard | grep -E "\.(json|tsx)$" | xargs -r grep -nEi "\b(paa|naar|gaar|staar|faar|maa|blaa|graa|smaa|gjoer|hoey|roed|groen|soek|oey|noed|vaere|laere|aere|foer|loep|soem|stoer|sjoe)\b" 2>/dev/null
```

Gir det treff: rett til å/ø/æ og kjør på nytt til den er tom.

### 4b. Teknisk validering

```bash
python3 -c "import json; json.load(open('public/content/[subject]/[topic]/[lesson-id].json')); print('Artikkel OK')"
python3 -c "import json; json.load(open('public/content/manifest.json')); print('Manifest OK')"
```

```bash
python3 << 'EOF'
import json, sys
art = json.load(open('public/content/[subject]/[topic]/[lesson-id].json'))
errors = []
if not art.get('year') and not art.get('date'): errors.append('year/date mangler - uten dette vises artikkelen ikke i /tidslinje')
if art.get('timeline') != []: errors.append('timeline er ikke tom')
for i, b in enumerate(art.get('content', [])):
    t, c = b.get('type'), b.get('content', '')
    if t == 'section': errors.append(f'Blokk {i}: ugyldig type section')
    if t == 'text' and '**' in c: errors.append(f'Blokk {i}: bold-markdown')
    if t == 'text' and (c.strip().startswith('- ') or (chr(10) + '- ') in c): errors.append(f'Blokk {i}: markdown-liste')
print('FEIL:', errors) if errors else print('Struktur OK')
EOF
```

### 4c. Signaturkomponent-validering

Verifiser at artikkelen faktisk har en signaturkomponent, og at den er korrekt registrert. Bytt ut `[SignaturkomponentNavn]` med komponentens faktiske navn:

```bash
python3 << 'EOF'
import json, sys, os
ART = 'public/content/[subject]/[topic]/[lesson-id].json'
REG = 'src/components/ComponentRegistry.tsx'
SIG = '[SignaturkomponentNavn]'  # bytt ut

art = json.load(open(ART))
used = [b.get('name') for b in art.get('content', []) if b.get('type') == 'component']
if SIG not in used:
    print(f'FEIL: Signaturkomponent {SIG} brukes ikke i artikkelen'); sys.exit(1)

reg = open(REG).read()
if SIG not in reg:
    print(f'FEIL: {SIG} er ikke registrert i ComponentRegistry.tsx'); sys.exit(1)

comp_path = f'src/components/content/interactive/{SIG}.tsx'
if not os.path.exists(comp_path):
    print(f'NB: {SIG} har ikke egen fil - antar gjenbruk av eksisterende komponent. Sjekk at import i registry peker til riktig fil.')
else:
    print(f'OK: {SIG} laget på {comp_path}')

print('Signaturkomponent OK')
EOF
```

Hvis valideringen feiler: stopp, fiks komponenten (riktig navn, registrert, brukt i JSON), og kjør valideringen på nytt før Jobb 4d.

### 4c-bis. Kildevalidering (obligatorisk port)

Verifiser at artikkelen faktisk er kildebelagt. Bytt ut stien:

```bash
python3 << 'EOF'
import json, sys
ART = 'public/content/[subject]/[topic]/[lesson-id].json'
art = json.load(open(ART))
content = art.get('content', [])
kl = [b for b in content if b.get('type') == 'component' and b.get('name') == 'Kildeliste']
sources = kl[0].get('props', {}).get('sources', []) if kl else []
text = ' '.join(b.get('content','') for b in content if b.get('type') == 'text')
# Tell forfatter-år-henvisninger: parenteser som inneholder et 3-4-sifret årstall
intext = 0
pos = 0
while True:
    a = text.find('(', pos)
    if a == -1: break
    close = text.find(')', a)
    if close == -1: break
    inside = text[a+1:close]
    runs = ''.join((ch if ch.isdigit() else ' ') for ch in inside).split()
    if any(3 <= len(r) <= 4 for r in runs):
        intext += 1
    pos = close + 1
errors = []
if not kl: errors.append('Kildeliste-komponent mangler (skal være aller siste blokk)')
if len(sources) < 3: errors.append('For få kilder: ' + str(len(sources)) + ' (krav: minst 3)')
if intext < 2: errors.append('For få forfatter-år-henvisninger i teksten: ' + str(intext) + ' (krav: minst 2)')
if errors:
    print('FEIL:', errors); sys.exit(1)
print('Kildevalidering OK - ' + str(len(sources)) + ' kilder, ' + str(intext) + ' in-text-henvisninger')
EOF
```

Feiler denne: IKKE publiser. Gå tilbake til Jobb 2d, hent flere kilder og legg inn manglende henvisninger, og kjør valideringen på nytt til den er grønn.

### 4d. Build-sjekk

```bash
npm run build 2>&1 | tail -30
```

Hvis TypeScript-feil: les og fiks dem. Vanlige feil i nye signaturkomponenter: manglende type på props, ubrukte imports, feil Framer Motion-API.

---

## Jobb 5: Atomisk PR til main

KRITISK: Alle endringer i denne runden - artikkel-JSON, manifest, content-index, signaturkomponent, ComponentRegistry - må publiseres som én commit på én feature-branch og åpnes som én PR. Aldri split over flere pushes. Hvis noe i denne jobben feiler etter at branchen er pushet, ikke kompenser ved å sende enkeltfiler via MCP `create_or_update_file` - det er nettopp den fallbacken som ga manifest-orphans for Napoleon (2026-05-12) og Jernbanen (2026-05-13). Rapporter feilen i Jobb 6 i stedet og avslutt.

### 5a. Lag feature-branch og commit alt sammen

```bash
git config user.email "pattidatti@gmail.com"
git config user.name "Eiriksbok Agent"

DATE=$(date +%Y%m%d)
BRANCH="claude/content-${DATE}-[lesson-id]"

git fetch origin main
git checkout -B "$BRANCH" origin/main

# Re-anvend alle endringer fra working tree (de eksisterer allerede der etter Jobb 3-4).
git add "public/content/[subject]/[topic]/[lesson-id].json"
git add public/content/manifest.json
git add public/content/content-index.json
git add "src/components/content/interactive/[SignaturkomponentNavn].tsx" 2>/dev/null || true
git add src/components/ComponentRegistry.tsx
git diff --name-only HEAD | grep -E "version\.json|stats\.html" | xargs -r git add

git commit -m "innhold: legg til [artikkel-tittel] ([fag])"
```

### 5b. Push feature-branch

```bash
git push -u origin "$BRANCH"
```

Cloud-sandboxen tillater push til branches med `claude/`-prefiks. Hvis push likevel returnerer 403 her: STOPP. Ikke fall tilbake til MCP per-fil-upload. Rapporter feilen direkte i Jobb 6 og avslutt.

### 5c. Åpne PR og forsøk auto-merge

```bash
PR_URL=$(gh pr create \
  --base main \
  --head "$BRANCH" \
  --title "innhold: [artikkel-tittel] ([fag])" \
  --body "Automatisk publisering fra \`eiriksbok-daily-content\`.

- Artikkel: \`public/content/[subject]/[topic]/[lesson-id].json\`
- Manifest oppdatert med ny leksjon
- Signaturkomponent: \`[Navn]\` ([ny | gjenbruk])
- Content-index regenerert

Atomisk - alt eller ingenting på main.")

# Forsøk auto-merge (squash). Feiler stille hvis auto-merge er av i repo-innstillinger
# eller hvis ingen CI beskytter main; PR-en blir da liggende åpen for manuell merge.
gh pr merge --squash --auto "$PR_URL" 2>&1 | tail -3 || true

PR_NUMBER=$(echo "$PR_URL" | grep -oE '[0-9]+$')
PR_STATE_JSON=$(gh pr view "$PR_NUMBER" --json state,mergedAt,mergeCommit)
echo "PR state: $PR_STATE_JSON"

# Sett variabler for Jobb 6
MERGED_SHA=$(echo "$PR_STATE_JSON" | python3 -c "import json,sys; d=json.load(sys.stdin); print((d.get('mergeCommit') or {}).get('oid') or '')")
if [ -n "$MERGED_SHA" ]; then
  COMMIT_URL="https://github.com/pattidatti/eiriksbok/commit/$MERGED_SHA"
  PR_STATUS="MERGED ($COMMIT_URL)"
else
  COMMIT_URL=""
  PR_STATUS="ÅPEN - venter på review/CI"
fi
echo "PR_URL=$PR_URL"
echo "PR_STATUS=$PR_STATUS"
```

Variablene `$PR_URL` og `$PR_STATUS` brukes i Jobb 6.


---

## Jobb 6: Varsle notifikasjonslogg (issue #12)

Post en fullstendig statusrapport til notifikasjonsloggen på GitHub:

```bash
gh issue comment 12 --repo pattidatti/eiriksbok --body "**Ny artikkel publisert** - $(date +%Y-%m-%d)

**Tittel:** [artikkel-tittel]
**Fag:** [fag] | **Emne:** [topic]
**Kilde:** [Lag 1/2/3] - [begrunnelse for valget]
**PR:** $PR_URL
**Status:** $PR_STATUS

### Pedagogisk vinkel
[1-2 setninger]

### Sammendrag
[3-4 setninger om innholdet]

### Signaturkomponent
**Navn:** [Navn]
**Lyspære-øyeblikk:** [én setning om hva eleven sitter igjen med etter interaksjonen]
**Ny eller gjenbruk:** [Ny | Gjenbruk - kort begrunnelse hvis gjenbruk]
**Hvorfor passer den artikkelens kjernepoeng:** [1-2 setninger]

### Øvrige komponenter
[List Oppgaver, Quiz, FactBox, bilder osv. som ble brukt i tillegg.]

### Neste 5 kandidater
[nummerert liste med lag-angivelse og tittel]

### Total status
| Fag | Kompetansemål-artikler |
|---|---|
| Musikk | X/Y |
| KRLE | X/Y |
| Norsk | X/Y |
| Samfunnsfag | X/Y |
| Historie | X/Y |"
```
