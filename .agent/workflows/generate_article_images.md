---
description: Generer hero-bilde og inline-bilder for artikler som mangler bilder (placeholder.webp eller manglende bildefiler)
---

# Bildegenerering for Eiriksbok-artikler

Kjør denne workflowen når du vil generere bilder for nye artikler som mangler bilder. Workflowen scanner repoet for plassholdere og brutte bildereferanser, skriver detaljerte Gemini-prompts basert på artikkelinnhold og stil, genererer bilder, og commiter resultatet.

---

## ABSOLUTTE FORBUD — LES DETTE FØRST

Disse reglene overstyrer alt annet. De gjelder uten unntak, uansett feilsituasjon eller omstendighet:

1. **ALDRI lag erstatningsbilder.** Gradient-bakgrunner med tekst, SVG-bannere, fargeflater med artikkeltittel, minimalistisk design — ingen av disse er akseptable bilder. Bildene skal være ekte fotografier generert av Gemini Imagen. Dersom Gemini ikke kan generere et bilde, forblir plassholder.webp i JSON-en.

2. **ALDRI lag nye skript.** Ikke lag `generate-fallback-images.js`, `optimize-single.js`, `prepare-image-jobs.js`, `split-jobs.js` eller noe lignende. Workflowen bruker kun de verktøyene som allerede eksisterer.

3. **ALDRI commit bilder uten å verifisere dem.** Hvert bilde skal visuelt bekreftes (via filstørrelse eller faktisk visning) at det er et fotografi — ikke et grafisk element.

4. **Kvote-feil = STOPP.** Dersom Gemini returnerer 429 (quota exceeded), stopp umiddelbart. Commit det som er generert hittil. Gjør ingenting mer. Se **Kvotehåndtering** under.

---

## Steg 1: Hent den prioriterte bildekøen

```bash
node scripts/scan-image-queue.js
```

Skriptet skanner alle artikler og scenarier og sorterer **alle** bildehull i én global kø:

| Prioritet | Hva | Handling |
|---|---|---|
| 1 | Hero, brutt referanse (ekte sti i JSON, fil mangler) | Lagre til stien som allerede står i JSON-en |
| 2 | Hero, plassholder (`placeholder.webp`) | Generer, lagre til `lagreTil`, oppdater JSON + manifest |
| 3 | Inline, brutt referanse | Lagre til stien som står i JSON-en |
| 4 | Inline, plassholder | Generer, lagre til `lagreTil`, oppdater JSON |
| 5-6 | Andre bilder (komponent-props, scenario-noder) | Samme mønster, brutt før plassholder |

**Jobb køen ovenfra og ned. Alle hero-bilder skal være ferdige før du rører det første
inline-bildet.** Dette er ikke en stilpreferanse - hero-bildet er det eneste bildet som
vises to steder, både øverst i artikkelen og på leksjonskortet i emneoversikten. En artikkel
uten hero er et synlig hull i navigasjonen; et manglende inline-bilde skjuler appen selv
(`isPendingImage`), og eleven merker det knapt. Kvoten tar slutt lenge før køen gjør det, så
rekkefølgen avgjør hva elevene faktisk får se.

Det følger av dette at du **ikke** ferdigstiller én artikkel om gangen. Du tar hero-bildet i
artikkel A, så hero-bildet i artikkel B, og kommer tilbake til A sine inline-bilder først når
hvert eneste hero i køen er dekket.

Nyttige flagg:

```bash
node scripts/scan-image-queue.js --kun hero     # bare hero-nivået (prioritet 1-2)
node scripts/scan-image-queue.js --limit 20     # de 20 øverste
node scripts/scan-image-queue.js --json         # maskinlesbart, samme rekkefølge
```

Hvert element i køen forteller deg alt du trenger: `fil` (artikkel-JSON-en), `felt` (hvilket
bilde i artikkelen), `naavaerende` (dagens verdi), `lagreTil` (hvor bildet skal lagres) og
`maaOppdatereJson` (om JSON og manifest må endres etterpå).

**Ikke finn på egne filnavn.** Bruk `lagreTil` fra køen - den håndterer også tilfellet der to
artikler heter det samme i ulike mapper (alle religionene har en `skapelse`-artikkel, og uten
denne logikken ville islams og hinduismens skapelsesbilde havnet i samme fil).

---

## Steg 2: Les og analyser artikkelen

For hvert element i køen: åpne artikkel-JSON-en som står i `fil` og trekk ut:

- `id`, `title`, `year`, `category`, `subjectId` (fra filstien)
- Hero-bilde (`felt: heroImage`): de tre første tekst-blokkene gir konteksten
- Inline-bilde (`felt: content[type=image] #n`): tekst-blokkene **rett før og etter** akkurat
  den blokken gir konteksten for hva bildet skal vise

---

## Steg 3: Velg bildestil

Velg stil basert på fag og innhold. Ikke alltid cinematisk foto - velg det som gir best pedagogisk verdi:

| Fag / Kontekst | Anbefalt stil |
|---|---|
| Historie - krig, politikk, reise | Cinematisk fotorealisme |
| Historie - hverdagsliv, handel | Cinematisk fotorealisme med varmt lys |
| KRLE - religion, ritualer | Høykvalitets dokumentarfotografi eller kunstnerisk representasjon |
| KRLE - filosofi, etikk | Stilisert portrett eller konseptuelt bilde |
| Samfunnsfag - institusjoner, demokrati | Editorial/dokumentarfotografi |
| Musikk - instrumenter, fremføring | Nærbilde med bokeh, varm belysning |
| Norsk - litteratur, forfattere | Portrett eller bokstavelig scene fra teksten |

---

## Steg 4: Skriv bildeprompts

### Mal for hero-bilde (cinematisk standard):

```
A highly realistic 4K cinematic photograph of [konkret scene/motiv fra artikkelens åpning],
[tidsepoke med spesifikke detaljer, f.eks. "late 9th-century Scandinavia"].
[Lyssetting: morgenlys/kveldsglød/stearinlys/diffust dagslys].
[Kameravinkel: eye level / high angle / foreground+background-komposisjon].
[2-3 spesifikke historiske detaljer: klær, arkitektur, gjenstander].
16:9 ratio. No text, no watermarks.
```

### Mal for inline-bilder:

Samme struktur, men motiv er hentet fra konteksten rundt bildeplasseringen i artikkelen. Inline-bilder skal vise et **annet aspekt** av emnet enn hero-bildet - unngå repetisjon.

### Regler for gode prompts:

- Aldri generiske fraser som "ancient times" or "long ago" - alltid spesifikt tidsrom
- Aldri "an AI image of..." - beskriv motivet direkte
- Spesifiser alltid et konkret motiv (person, scene, gjenstand) - ikke abstrakt konsept
- Unngå tekst og symboler i bildet med "No text, no watermarks, no anachronisms"
- For KRLE-bilder: "respectful, dignified representation" der det gjelder religiøse motiver

---

## Steg 5: Generer bilder med Gemini — ett om gangen

**Viktig: behandle bildene ett for ett, ikke i en batch.** Etter hvert enkelt bilde: sjekk om Gemini returnerte feil. Fikk du 429 — stopp umiddelbart (se Kvotehåndtering under). Fikk du et annet kall-feil — logg det, hopp to neste bilde og fortsett.

Filnavngivning: bruk `lagreTil` fra køen i Steg 1. Mønsteret er
`public/images/[emne]/[stamme]-hero.webp` for hero og `-01.webp`, `-02.webp` ... for
inline-bilder, men køen har allerede regnet ut det riktige navnet - også for artikler som
deler id på tvers av mapper.

Eksempel for artikkelen `public/content/historie/vikingtiden/rikssamlingen.json`:
- `public/images/vikingtiden/rikssamlingen-hero.webp`
- `public/images/vikingtiden/rikssamlingen-01.webp`

Lagre og optimaliser genererte bilder ved å enten kjøre enkelt-optimalisering eller samle dem i en batch for å unngå gjentatte godkjenninger:

**Alternativ A (Batch-kjøring for å slippe gjentatte prompts):**
Skriv jobbene til `scripts/image-jobs.json` i dette formatet:
```json
[
  { "src": "/sti/til/generert/bilde.jpg", "dest": "public/images/[topic]/[lesson-id]-hero.webp" }
]
```
Deretter kjører du den helt statiske kommandoen som kun krever én enkelt godkjenning:
```bash
node scripts/process-image-jobs.js
```

**Alternativ B (For enkeltbilder):**
```bash
node scripts/process-generated-image.js /sti/til/generert/bilde.jpg public/images/[topic]/[lesson-id]-hero.webp
```
Dette skriptet konverterer automatisk til WebP, endrer bredden (1600px standard, 2560px for kart), og lagrer filen på rett sted. Siden kommandoen alltid har samme struktur (`node scripts/process-generated-image.js`), slipper du å godkjenne en ny unik kommando per bilde dersom sandkassen din støtter prefiks-matching.

### Kvalitetskontroll etter hvert bilde

Etter at et bilde er lagret på disk, verifiser det umiddelbart:

```bash
# Sjekk filstørrelse — ekte Gemini-bilder er vanligvis > 50 KB
ls -lh public/images/[topic]/[lesson-id]-hero.webp
```

Et ekte fotografi fra Gemini Imagen vil typisk være **50 KB–500 KB**. En SVG-rendert gradient, fargeflate eller tekst-banner vil være **< 20 KB**. Hvis en fil er uvanlig liten, er noe galt — ikke commit den.

---

## Steg 6: Oppdater artikkel-JSON og manifest.json

**Bare for elementer der køen sier `maaOppdatereJson: true`** (plassholderne). For brutte referanser står stien allerede riktig i JSON-en - hopp over dette steget for dem.

For hvert bilde generert fra en placeholder, oppdater JSON-filen:

**Hero-bilde** - bytt ut i toppnivå-feltet i selve artikkelen (`public/content/[sti].json`):
```json
"heroImage": "/images/vikingtiden/rikssamlingen-hero.webp"
```

**Kortet i manifest.json** - Hero-bildet brukes også på artikkel-kortet! Finn artikkelen din i `public/content/manifest.json` og oppdater `image`-feltet der til samme path som hero-bildet.

**Inline-bilder** - bytt ut `src` i den aktuelle blokken i artikkel-JSON. Behold `alt` og `caption` som de er.

Verifiser at JSON fortsatt er gyldig etter endringene:
```bash
python3 -c "import json; json.load(open('public/content/[sti].json')); print('OK')"
python3 -c "import json; json.load(open('public/content/manifest.json')); print('OK')"
```

---

## Steg 7: Commit direkte til main

```bash
git config user.email "pattidatti@gmail.com"
git config user.name "Eiriksbok Image Agent"

DATO=$(date +%Y%m%d)

# Sørg for at vi er på main
git checkout main
git pull

# Legg til bilder og oppdaterte JSONer
git add public/images/
git add public/content/

git commit -m "bilder: legg til genererte artikkelbilder (${DATO})"
git push origin main
```

---

## Kvotehåndtering

**Regel: 429 = STOPP UMIDDELBART.**

Når Gemini returnerer HTTP 429 (quota exceeded / resource exhausted):

1. **Stopp all videre bildegenerering.** Prøv ikke på neste artikkel. Prøv ikke med lavere oppløsning. Prøv ikke en annen metode.
2. **Commit det som er generert hittil** via Steg 7. Null bilder generert = ingen commit.
3. **Avslutt workflowen.**

Hva du **ikke** gjør ved kvote-feil:
- Lag ikke gradient-bilder, SVG-bannere, fargeflater eller tekst-overlays som erstatning
- Lag ikke nye skript for å lage alternative bilder
- Oppdater ikke JSON-filer med stier til bilder som ikke er ekte Gemini-genererte fotografier
- Reset ikke stier tilbake til `placeholder.webp` — la de som har spesifikke stier beholde dem

La de ubehandlede artiklene beholde sine placeholder-stier. Neste kjøring plukker dem opp igjen øverst i køen, og fordi hero-bildene ligger først, fortsetter neste kjøring akkurat der denne slapp.

---

## Kjøringsmønster

Workflowen er designet for **ukentlig kjøring** etter at den daglige innholdsrutinen har produsert nye artikler gjennom uken. Kjør den manuelt i Antigravity når du vil ta et batch med bilder.

Sier `scan-image-queue.js` at køen er tom, er det ingenting å gjøre - avslutt.
