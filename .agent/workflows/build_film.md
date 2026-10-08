---
description: Bygg en artikkelfilm - en artikkel fortalt som film med stemme, teksting, 2D- og 3D-grafikk. Titanic er referansen.
---

# Skill: Bygg artikkelfilm

En artikkelfilm er en artikkel som eleven kan **spille av**. Nettleserens norske stemme leser et
manus, tekstingen står under bildet, og bildet **viser** det stemmen sier: skipet som synker, 2200
prikker der bare 1178 får plass i livbåtene, kartet der redningsskipet kommer for sent. Tenk
PowerPoint på steroider, eller en kort dokumentar.

**Referansen er Titanic:** `/film/historie/industriell-revolusjon/titanic`
(manus: `src/features/film/manus/historie/industriell-revolusjon/titanic.json`). Eieren kalte den
«fuckings amazing». Les manuset før du skriver ditt eget. Det er malen for tempo, språk og
hvor ofte bildet skifter.

---

## 1. Slik virker det (les før du skriver noe)

- **Manuset styrer alt.** Et manus er en liste scener. Hver scene har ÉN visual og 2-6 replikker.
- **Beat = replikken som leses nå** (0, 1, 2 ...). Visualen får `beat` og endrer bildet når
  beaten skifter. Synken går per replikk, ikke per sekund, for stemmen er ulik fra maskin til
  maskin. Bruk derfor aldri faste sekunder for å treffe et ord. Bruk beats.
- **Uten norsk stemme går filmen i tekstmodus:** hver replikk står så lenge det tar å lese den.
  Filmen må derfor fungere uten lyd.
- **Teksting ligger i eget felt UNDER bildet.** Hele 16:9-flaten er din, også nederste kant.
- **Filer, og hvorfor de ligger der:**

| Hva | Hvor |
|---|---|
| Manus | `src/features/film/manus/<fag>/<emne>/<leksjon>.json` - stien SKAL speile artikkelen i `public/content/` |
| Filmens egne visualer | `src/features/film/visuals/<film-id>/<Navn>.tsx` - fila eksporterer `export function <Navn>` |
| Generelle visualer | `src/features/film/visuals/*.tsx`, registrert i `visuals/index.ts` (`GENERELLE`) |
| Spiller, forteller | `FilmPage.tsx`, `useFilmNarrator.ts` |

Filmer og egne visualer **finnes automatisk** (`import.meta.glob`). En ny film legger bare til
nye filer - den endrer aldri `index.ts`, `filmIndex.ts`, `App.tsx` eller artikkelen. «Se som
film»-knappen i artikkelen dukker opp av seg selv. Rør ikke de delte filene i en film-PR.

---

## 2. Manuset

```json
{
  "id": "titanic",
  "tittel": "Titanic: Skipet som ikke kunne synke",
  "kilde": "/historie/industriell-revolusjon/titanic",
  "bilde": "/images/industriell-revolusjon/titanic-hero.webp",
  "utenforArtikkel": [
    { "tall": 2469, "begrunnelse": "Galdhøpiggens høyde, brukt som sammenligning. Kartverket." }
  ],
  "scener": [
    {
      "id": "natt",
      "kapittel": "Natten",
      "visual": { "type": "TitanicHavet", "props": { "modus": "kollisjon" } },
      "klokke": ["23.38", "23.39", "23.40", "23.40", "23.41"],
      "replikker": [
        { "si": "Det er natt, den fjortende april 1912. Vi er midt ute på Atlanterhavet." },
        { "si": "Klokka 23.40 roper utkikken i masta: Isfjell rett forut!",
          "uttale": "Klokka tjue på tolv roper utkikken i masta: Isfjell rett forut!" }
      ]
    }
  ]
}
```

| Felt | Regel |
|---|---|
| `kilde` | Artikkelens sti, nøyaktig. |
| `bilde` | Artikkelens `heroImage`. Startskjermen og Tittelkort bruker det. |
| `kapittel` | Settes på første scene i hver del. Blir skilt i bildet og navn i tidslinja. 4-7 kapitler. |
| `klokke` | Valgfri. Én verdi per replikk (`null` = skjul). Bare klokkeslett som står i artikkelen, pluss minuttene rett før for oppbygging. |
| `si` | Teksten som vises og leses. 1-3 korte setninger. |
| `uttale` | Når stemmen skal si noe annet enn tekstingen: klokkeslett («tjue på tolv»), forkortelser, tall stemmen leser feil. |
| `utenforArtikkel` | Hvert tall i filmen som ikke står i artikkelen, med begrunnelse og kilde. Helst tom. |

### Lengde og tempo

- **12-16 scener, 550-1100 ord** (4-7 minutter med stemme). Titanic: 15 scener, 930 ord.
- **Bildet skal endre seg på hver beat.** Noe nytt dukker opp, noe flytter seg, et tall teller
  opp. En beat der bildet står stille mens stemmen snakker, er en død beat.
- **Ny visual minst hvert 40. sekund.** Bytt mellom 3D, kart, data og store setninger.
- **Begynn i en scene, ikke med en tittel.** Titanic åpner på havet klokka 23.38, og tittelen
  kommer i scene 2. Første setning skal sette eleven et sted.
- **Slutt med hva det betyr.** Sluttkort med 2-4 store setninger, og den siste er uthevet.

### Språk (samme krav som artiklene)

- **Skriv for en 14-åring, og skriv for øret.** Korte setninger. «Tenk deg ...». Spørsmål til
  eleven. Gjentakelse er lov i tale.
- Ekte æ, ø, å. Aldri tankestrek eller em-dash. Ingen markdown.
- Hvert fagord forklares i samme replikk.
- **Bare fakta fra artikkelen.** Artikkelen er kildebelagt, filmen er det ikke. Du skriver om
  for øret, du legger ikke til nye fakta. Et nytt tall krever `utenforArtikkel` med kilde, og
  da bør det være en sammenligning (fjell, fotballbaner), ikke en ny påstand.
  `validate-film` sjekker at alle tall står i artikkelen.

---

## 3. Visualene

### 3a. Generelle (gjenbruk dem)

Alle tar `fraBeat`: elementet vises fra den replikken (0-basert) og ut scenen.

| Visual | Bruk når | Props |
|---|---|---|
| `Tittelkort` | Tittel over hero-bildet, tall som teller opp, et spørsmål | `tittel`, `undertittel?`, `bilde?`, `tall?: [{verdi, etikett, fraBeat, tone?: 'rod'\|'gronn'}]`, `sporsmal?: {tekst, fraBeat}` |
| `Prikkfelt` | «Hvor mange av hvor mange»: ett merke per menneske | `figur: 'prikk'\|'person'`, `steg: [{fraBeat, total, farget, farge?, restFarge?, tittel, fargeEtikett?, restEtikett?}]`. Siste steg med `fraBeat <= beat` vises. Hold `total` under ca. 3000. |
| `Livbater` | Kapasitet mot bruk (seter, plasser, senger) | `bater: [{navn, plasser, brukt, fraBeat}]` |
| `Andeler` | Andel per gruppe som stolper, til slutt to grupper som ringer | `tittel`, `kilde?`, `rader: [{etikett, reddet, totalt, fraBeat, farge}]`, `sammenlign?: {fraBeat, venstre, hoyre}` |
| `Punktkort` | 2-4 følger, regler eller grunner | `tittel`, `punkter: [{ikon, tittel, tekst?, fraBeat}]`. Ikon: `livbat`, `radio`, `is`, `avtale`, `skip` |
| `Dypet` | Dybde eller høyde i riktig målestokk | `dybde`, `fjell?: {navn, hoyde, fraBeat}`, `vrakFraBeat?` |
| `Sluttkort` | Store setninger til slutt | `setninger: [{tekst, fraBeat, uthevet?}]`. Hver beat viser bare sine egne setninger. Ingen beat uten setning. |

Mangler du et ikon i `Punktkort`, kan du legge til et lucide-ikon i `IKONER` i `Punktkort.tsx` og i
`IKONER` i `scripts/validate-film.mjs`. Det er den eneste delte endringen en film-PR får gjøre.
En generell visual som ikke passer, bygger du heller som filmens egen.

### 3b. Filmens egne visualer (signaturen)

**Hver film har minst én egen visual, og den bærende scenen bør være 3D.** Titanic har fire:
`TitanicHavet` (3D: kollisjon, størrelse, forlis), `TitanicSkott` (snitt: rommene som fylles),
`TitanicKlasser` (snitt: hvor klassene bodde) og `TitanicKart` (kart: Carpathia). Det er de som
gjør filmen til en film. Eieren vil ha unike signaturer, aldri gjenbruk av en annen films.

Velg det artikkelen handler om **og som kan vises**:

- **En ting i 3D:** skip, fly, bygning, maskin, våpen, mur, verktøy. Bygg den av primitiver
  (bokser, sylindere, `ExtrudeGeometry`), toon/flat-shaded, ikke fotorealistisk.
- **Et forløp i 3D:** kollisjon, utbrudd, slag, bygging, forfall. Kamera og objekter endrer seg
  per beat.
- **Et kart (d3-geo):** hvor ting skjedde, ruter, fronter, grenser som flytter seg. Hent
  verdenskartet med `useAtlasWorld()` (lokalt, aldri CDN).
- **Et snitt eller en mekanisme i SVG:** hvordan noe virker (skottene, en dampmaskin, en
  demning, et parlament).

**Mal for en 3D-visual** (kopier strukturen fra `visuals/titanic/TitanicHavet.tsx`):

```tsx
export function DdagenStranda({ beat, playing, props }: VisualProps<{ modus: string }>) {
    const dpr = useMemo<[number, number]>(() => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]), []);
    return (
        <div className="absolute inset-0">
            <Canvas dpr={dpr} camera={{ fov: 42, position: [20, 8, 30] }}>
                <Scene beat={beat} playing={playing} />
            </Canvas>
            {/* Merkelapper og tall som DOM over lerretet, ikke som 3D-tekst */}
        </div>
    );
}
```

- **Beat-klokke:** i `useFrame`: `const dt = playing ? Math.min(delta, 0.05) : 0`; nullstill
  `beatTid` når `beat` skifter. Alt animeres ut fra `(beat, beatTid)`. På pause fryser bildet.
- **Kamera per beat:** en funksjon `kameraFor(beat, t) -> { pos, se }`, og kameraet glir dit
  (`lerp` med `1 - exp(-1.3 * dt)`). Første bilde hopper rett dit.
- **Overganger skal tåle hopp.** Eleven kan hoppe rett til beat 3 uten å ha sett beat 0-2. Bruk
  dempet glidning mot et mål for hver beat, ikke hendelser som må ha skjedd før.
- **`<color attach="background">` og `<fog attach="fog">`** i JSX. Endre aldri `scene` fra
  `useThree()` direkte (lint stopper det).
- Chromebook: ingen skygger, ingen postprosessering, under ca. 150 mesher, instanser for mange
  like ting.

**2D-visualer:** SVG med `viewBox="0 0 1600 900"` og `preserveAspectRatio="xMidYMid meet"`,
framer-motion for overganger. Animerte SVG-attributter (`y`, `height`, `pathLength`, `d`) går
fint med `motion.rect` osv. **Ikke** send en `MotionValue` til `transform` på en `<g>`, for det
blir `[object Object]`. Les verdien inn i state med `useMotionValueEvent` og skriv en vanlig
streng.

### 3c. Lærdommer fra Titanic (feil som ble rettet - ikke gjør dem igjen)

1. **Svart hav.** Mørk havfarge under nattlys blir helt svart. Gi havet `emissive` og lys tåke.
2. **Kameraet inni modellen.** Sjekk at kameraposisjonen for hver beat ligger utenfor alle
   objekter (skorsteiner, master).
3. **Røyk eller partikler foran kameraet** dekker alt. Hold kameraet unna utslippet.
4. **Grå «rullebane».** En flat, gjennomsiktig plate (kjølvann) ser ut som en vei. Dropp den.
5. **Tom beat.** Prikkfelt med `total: 0` og Sluttkort uten setning på beat 0 ga blankt bilde.
   Hver beat skal ha noe å se på.
6. **Kartet zoomet inn på tomt hav.** Zoom til et utsnitt der det er land eller noe å se.
7. **Oppdiktede klokkeslett.** 00.45 og 01.30 sto ikke i artikkelen. Bruk `null`.
8. **Telleanimasjoner som ikke teller.** En overgang på en verdi som allerede er der ved
   montering, animerer ikke. Start fra 0 og sett målet etter montering.

---

## 4. Tone

- **Tragedier, krig og terror:** filmen viser **aldri animert vold mot mennesker**. Ingen fly
  inn i tårn, ingen skudd, ingen døende. Vis det gjennom kart (hvor), tid (klokke), tall
  (prikkfelt), følger (punktkort), og ting (en tom stol, et vrak på havbunnen). Titanic viser
  skipet som synker, men aldri menneskene i vannet - bare tomt hav og livbåter.
- **Ingen humor** på alvorlige tema.
- Folkemord og terror mot sivile: bare kart, tall, følger og minne. Er du i tvil, velg en annen
  artikkel og nevn det i rapporten.

---

## 5. Portene (alt må være grønt før PR)

```bash
node scripts/validate-film.mjs <fag>/<emne>/<leksjon>      # skjema, props, beats, tall, språk
npx tsc -b && npx eslint src/features/film                   # kompilerer og lint
node scripts/shots-film.mjs <fag>/<emne>/<leksjon> --port 5173   # bilder + avspilling, krever Vite
```

`shots-film` lager ett kontaktark per scene i `.screenshots/film/<leksjon>/ark-sNN.png`. **Se på
hvert ark** og sjekk mot rubrikken. Les arkene, ikke enkeltbildene.

### Rubrikken (5 akser, 1-5, terskel 19/25 og ingen akse under 3)

| Akse | 5 betyr |
|---|---|
| **Viser** | Bildet viser det stemmen sier på hver beat. Ingen bilde-beat er bare pynt. |
| **Lesbart** | Ingenting kuttes, overlapper eller er for lite for en Chromebook på 1366×768. Kontrast holder på projektor. |
| **Variasjon** | Minst én overbevisende 3D-scene, minst ett kart eller snitt, minst én dataviz. Bildet skifter ofte. |
| **Forståelig** | En 14-åring henger med uten artikkelen. Fagord forklart. Kort tale. |
| **Tro mot artikkelen** | Ingen nye fakta. Tall stemmer med bildene. Tonen passer emnet. |

Vurderingen gjøres av en **fersk underagent** som ikke har skrevet filmen. Den får manuset og
kontaktarkene, ikke koden. Den svarer med score per akse og en liste konkrete rettelser
(«scene 4 beat 2: kameraet er inni skorsteinen - flytt til ...»). Rett dem og vurder på nytt,
maks tre runder.

---

## 6. Sjekkliste før PR

- [ ] `validate-film`, `tsc -b`, `eslint src/features/film` og `shots-film` er grønne.
- [ ] Hvert kontaktark sett. Ingen tom beat, ikke noe inni modellen, ingenting kuttet.
- [ ] Uavhengig vurdering >= 19/25 (eller PR merket «(under terskel)», se rutinen).
- [ ] PR-en inneholder BARE manus-fila og `src/features/film/visuals/<film-id>/`.
- [ ] Ingen skjermbilder committet (`.screenshots/` er ignorert).
