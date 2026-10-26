---
description: Bygg en artikkelfilm - en artikkel fortalt som film med stemme, teksting, 2D- og 3D-grafikk. Titanic er referansen.
---

# Skill: Bygg artikkelfilm

En artikkelfilm er en artikkel som eleven kan **spille av**. En innspilt fortellerstemme leser et
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
- **Stemmen lages for deg.** Innen en time etter at manuset er merget, lager Actionen
  `.github/workflows/film-lyd.yml` fortellerstemmen (Google Chirp 3 HD, «Algieba», tempo 0,95),
  sjekker den med Whisper og legger den i Cloudflare R2. Du lager aldri lyd selv og legger aldri
  lydfiler i repoet. Til lyden er klar, og når et manus er endret siden sist, leser nettleserens
  stemme. Tidene i lydfila styrer beatene, så synken per replikk gjelder fortsatt. Uttaler
  stemmen noe feil, rett det med `uttale` på replikken.
- **Uten stemme i det hele tatt går filmen i tekstmodus:** hver replikk står så lenge det tar å
  lese den. Filmen må derfor fungere uten lyd.
- **Teksting ligger i eget felt UNDER bildet.** Hele 16:9-flaten er din, også nederste kant.
  Kapittelnavnet står i kontrollinja under bildet, ikke i bildet, så det aldri dekker
  grafikken din.
- **Sluttskjermen lager seg selv.** Etter filmen får eleven tre spørsmål hentet fra
  artikkelens egen `Quiz` (de som filmen dekker best), en lenke til artikkelen og kildene i
  artikkelens `Kildeliste`. Du skriver ingenting til den. Filmen gir XP (`film-watched`) og
  måles i `/admin/stats` (Aktivitet -> Filmer): hvor mange som starter, ser ferdig, og hvilken
  scene de gir seg på.
- **Bakgrunnslyd** settes per scene med `lyd` (se tabellen under). Den lages i nettleseren,
  ligger svakt under stemmen og har egen av-knapp. Et dypt, mykt slag markerer nytt kapittel.
- **Filer, og hvorfor de ligger der:**

| Hva | Hvor |
|---|---|
| Manus | `src/features/film/manus/<fag>/<emne>/<leksjon>.json` - stien SKAL speile artikkelen i `public/content/` |
| Filmens egne visualer | `src/features/film/visuals/<film-id>/<Navn>.tsx` - fila eksporterer `export function <Navn>` |
| Generelle visualer | `src/features/film/visuals/*.tsx`, registrert i `visuals/index.ts` (`GENERELLE`) |
| Spiller, forteller | `FilmPage.tsx`, `useFilmNarrator.ts` |
| Innspilt stemme | `scripts/film-lyd/lag_lyd.py` (Action `film-lyd.yml` hver time) → R2-bøtta `eiriksbok-lyd`, vist av Workeren i `cloudflare/lyd-worker/`. Rør dem ikke i en film-PR |

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
| `kapittel` | Settes på første scene i hver del. Vises i kontrollinja under bildet, med et kapittelslag i lyden. 4-7 kapitler. |
| `lyd` | Valgfri. Bakgrunnslyd fra denne scenen til en senere scene setter en annen: `hav`, `vind`, `storm`, `ild`, `regn`, `rom` (lav klang, innendørs og alvor) eller `stille`. Sett den der filmen er et sted (havet, vidda, en brann, en sal), og `stille` når den går over til kart og tall. Ikke på folkemord og terror mot sivile. |
| `klokke` | Valgfri. Én verdi per replikk (`null` = skjul). Bare klokkeslett som står i artikkelen, pluss minuttene rett før for oppbygging. |
| `si` | Teksten som vises og leses. 1-3 korte setninger. Stemmen leser én setning om gangen, og Chrome kutter en ytring etter ca. 15 sekunder, så ingen setning over 30 ord høyt (et tall som «1825» teller fire). `validate-film` stopper lengre setninger. |
| `uttale` | Når stemmen skal si noe annet enn tekstingen: klokkeslett («tjue på tolv»), forkortelser, tall stemmen leser feil. |
| `utenforArtikkel` | Hvert tall i filmen som ikke står i artikkelen, med begrunnelse og kilde. Helst tom. Også målestokker i prikkfelt (700 prikker = 700 000) og tall regnet ut fra artikkelen. |
| `vurdering` | Skrives av nattrutinen etter den uavhengige vurderingen: `{ "dato", "viser", "lesbart", "variasjon", "forstaelig", "tro", "sum" }`. Forbedringskjøringen velger filmen med lavest sum. |

### Lengde og tempo

- **12-16 scener, 550-1100 ord** (4-7 minutter med stemme). Titanic: 15 scener, 930 ord.
- **Bildet skal endre seg på hver beat.** Noe nytt dukker opp, noe flytter seg, et tall teller
  opp. En beat der bildet står stille mens stemmen snakker, er en død beat.
- **Ny visual minst hvert 40. sekund.** Bytt mellom 3D, kart, data og store setninger.
- **Samme visual i høyst 4 scener, og høyst ett Punktkort.** (Tittelkort og Sluttkort teller
  ikke.) `validate-film` stopper filmen som bryter det. Et kart med sju moduser er fortsatt ett
  kart for eleven. Punktkort er lysbilder; vis heller det som skjer.
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
  `validate-film` sjekker at alle tall står i artikkelen, også tall skrevet med ord («ti år»,
  «tjue»), og at «19» står som eget tall (ikke bare inni «1912»). Påstander uten tall fanger
  den ikke. Dem tar faktasjekken i §5.

---

## 3. Visualene

### 3a. Generelle (gjenbruk dem)

Alle tar `fraBeat`: elementet vises fra den replikken (0-basert) og ut scenen.

| Visual | Bruk når | Props |
|---|---|---|
| `Tittelkort` | Tittel over hero-bildet, tall som teller opp, et spørsmål | `tittel`, `undertittel?`, `bilde?`, `tall?: [{verdi, etikett, fraBeat, tone?: 'rod'\|'gronn', omtrent?: false, prefiks?}]`, `sporsmal?: {tekst, fraBeat}`. Tallene får «ca.» foran; `omtrent: false` for eksakte tall (52 gisler, 72 år), `prefiks: "minst"` / `"over"` når artikkelen sier det (skriv da ikke «minst» i etiketten). Årstall hører hjemme i tittel eller undertittel, ikke i `tall` («1 644»). Skriften krymper selv for lange ord, men hold `tittel` kort og legg resten i `undertittel`. |
| `Prikkfelt` | «Hvor mange av hvor mange»: ett merke per menneske | `figur: 'prikk'\|'person'`, `steg: [{fraBeat, total, farget, farge?, restFarge?, tittel, fargeEtikett?, restEtikett?, visTall?: false}]`. Siste steg med `fraBeat <= beat` vises. Hold `total` under ca. 3000. Forklaringen viser `farget` og `total - farget` foran etikettene; er prikkene en skala (100 like store grupper, «tusenvis») eller en rate (344 av 1000 døde, da blir resten «656 levde», en ny påstand), sett `visTall: false` og la stemmen si skalaen. Med tall må `restEtikett` gi mening sammen med `total - farget` («99 friske», ikke «99 folket i området»). En andel av noe annet enn figurene (hvem som sto bak, ikke hvem som ble rammet) trenger et eget bilde. |
| `Livbater` | Kapasitet mot bruk (seter, plasser, senger) | `bater: [{navn, plasser, brukt, fraBeat}]` |
| `Andeler` | Andel per gruppe som stolper, til slutt to grupper som ringer | `tittel`, `kilde?`, `rader: [{etikett, reddet, totalt, fraBeat, farge}]`, `sammenlign?: {fraBeat, venstre, hoyre}` |
| `Punktkort` | 2-4 følger, regler eller grunner | `tittel`, `punkter: [{ikon, tittel, tekst?, fraBeat}]`. Ikon: `livbat`, `radio`, `is`, `avtale`, `skip`, `penger`, `hest`, `haer`, `stjerne` |
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
  verdenskartet med `useFilmVerden()` fra `src/features/film/kart/` (lokalt, aldri CDN):
  - Uten argument gir det det grove kartet (1:110 mill.). Det holder for verden og store regioner.
  - Zoomer kartet inn på et lite område (en landsdel, en fjord, en by), gi utsnittet:
    `useFilmVerden([[vest, sør], [øst, nord]])`. Da får du det fine kartet (1:50 mill., med
    fjorder og øyer), men bare landene i utsnittet. Har kartet flere moduser, gi utsnittet for
    modusen, eller `undefined` for de vide. Aldri hele verden i fint kart: det ga over ett
    sekund per bilde på Chromebook-nivå.
  - Zoomer kartet så langt inn at landegrensene ikke lenger forteller hvor vi er, legg på
    `<Oversiktskart utsnitt={...} omrade={...} etikett="Norge" />` fra samme mappe: et lite
    kart i hjørnet med en rød ramme rundt utsnittet. Se `RorosKart.tsx`.
- **Et snitt eller en mekanisme i SVG:** hvordan noe virker (skottene, en dampmaskin, en
  demning, et parlament).

**Mal for en 3D-visual** (kopier strukturen fra `visuals/titanic/TitanicHavet.tsx`):

```tsx
export function DdagenStranda({ beat, playing, props }: VisualProps<{ modus: string }>) {
    const dpr = useMemo<[number, number]>(() => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]), []);
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, position: [20, 8, 30] }}
            >
                <Scene beat={beat} playing={playing} />
            </Canvas>
            {/* Merkelapper og tall som DOM over lerretet, ikke som 3D-tekst */}
        </div>
    );
}
```

- **`resize={{ offsetSize: true }}` er påbudt.** Filmen tegnes alltid minst 1000 px bred og
  skaleres ned som et bilde på mobil (`Lerret` i `FilmPage.tsx`). Uten flagget måler lerretet
  den nedskalerte størrelsen og blir bittelite. Tegn derfor for 1000x562 og bruk vanlige
  px/rem-størrelser; ikke `vw`/`vh` (bruk `cqw`/`cqh` om noe skal følge bildets størrelse).
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
9. **Merkelapp under overskriften.** Bykart og 3D-merker havner lett oppå filmens egen
   overskrift øverst i midten, eller i bildekanten når kameraet flytter seg. `shots-film`
   finner det nå (se §5). Skjul merket i beatene der kameraet står for nær.
10. **`motion.text` med `y`** blir en transform i tillegg til attributtet, så etiketten flyttes
    dobbelt. Animer bare `opacity` på SVG-tekst.
11. **`vectorEffect="non-scaling-stroke"` + animert `pathLength`** i et kart som skaleres med
    `transform` gir en brutt linje. Bruk `strokeWidth={n / skala}` på linjer som tegnes opp.
12. **`geoNaturalEarth1().fitExtent` med en Polygon-ramme** gir hele verden (feil vinding).
    Bruk `MultiPoint` med hjørnene.
13. **Komponentnavn med Æ/Ø/Å først** (`Åker`) regnes ikke som komponent av hooks-linten.
    Bruk ASCII-forbokstav.
14. **Heltebilde med slagord** på politisk følsomme tema: Tittelkort viser bildet i flere
    beats. Sjekk bildet, eller dropp `bilde`. Sett aldri sitattegn eller utropstegn på
    parafraser i merkelapper.
15. **Krim tegnes som russisk** i verdenskartet. Handler filmen om tiden før 2014, tegn `KRIM`
    fra `src/features/film/kart/grenser.ts` over Russland i Ukrainas farge.
16. **Kjegleprojeksjon tilpasset to hjørner** (`geoConicConformal`) kutter sørkanten, fordi
    breddegradene bøyer seg. Tilpass med `rammePunkter(sørvest, nordøst)` fra samme fil (et
    rutenett som `MultiPoint`). Det løser også punkt 12.
17. **`rotate` med `transformOrigin` på en SVG-`<g>`** (framer-motion) roterte en målernål rundt
    feil punkt. Regn ut endepunktet og animer `x2`/`y2` direkte.
18. **Vilkårlige Tailwind-klasser** (`h-[15rem]`) i en ny visual-fil ble ikke laget i en
    dev-server som allerede kjørte, og boksen fikk null høyde. Bruk inline `style` for faste mål.
19. **Merkelapper i et stolpediagram** legges utenfor stolpeområdet, ikke oppå stolpene.
20. **For mange ord etter faktasjekken.** Rettelser gjør replikkene lengre, og en film nær 1100
    ord går over taket. Kort ned fyllord og gjentakelser, aldri presiseringene faktasjekken ba om.
21. **drei-`<Html>` i en skjult `<group>`.** `visible = false` i `useFrame` skjuler ikke
    `<Html>`. Rendre merkelappen betinget: `{beat <= 1 && <Html ... />}`.
22. **`strokeDasharray` + animert `pathLength`** blir en hel strek, for framer-motion bruker
    dasharray til å tegne opp linja. En stiplet linje som skal tegnes opp, trenger en maske,
    eller en vanlig `path` med `opacity`-overgang.
23. **Samme `ref` på flere materialer i en `.map()`** peker bare på det siste. Bruk en
    array-ref: `ref={(m) => { refs.current[i] = m; }}`. Et `useMemo`-materiale som endres i
    `useFrame` stoppes av lint (react-hooks/immutability); bruk ref.
24. **`instancedMesh` med matriser satt i `useEffect`** får grensekula fra identitetsmatrisene
    og forsvinner når kameraet ser bort fra origo. Sett `frustumCulled={false}`.
25. **Flate former som ligger ned** (`circleGeometry` med `rotation={[-Math.PI / 2, 0, 0]}`)
    skaleres `[x, z, 1]`, ikke `[x, 1, z]`. Skaleringen skjer før rotasjonen.
26. **HTML i `foreignObject`** tegnes på en flate på 1000x562, ikke 1600x900. På 1600-flaten
    blir `text-3xl` ulesbart lite.
27. **`setState` i en `requestAnimationFrame`-løkke** (en viser som går) holdt
    `document.fonts` i «loading», og `shots-film` fikk timeout. Skriv attributtene direkte
    via ref.
28. **Kameraet under vannflaten i et 3D-snitt** ser toppen gjennom den gjennomsiktige blokken,
    og alt blekner. Hold kameraet over vannet. DOM-merkelapper plasseres med
    `vektor.project(kamera)`, ikke regnet for hånd.
29. **Tekst i et SVG-kort (`rect`)** flyter ut av kortet når teksten er lengre enn du trodde.
    Mål kortbredden ut fra tekstlengden (ca. 0,55 x skriftstørrelse per tegn), eller bryt
    teksten. `shots-film` ser ikke tekst mot rammen sin.

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
node scripts/validate-film.mjs <fag>/<emne>/<leksjon>      # skjema, props, beats, tall, variasjon, språk
npx tsc -b && npx eslint src/features/film                   # kompilerer og lint
node scripts/shots-film.mjs <fag>/<emne>/<leksjon> --port 5173   # bilder + overlapp + avspilling, krever Vite
node scripts/film-grunnlag.mjs <fag>/<emne>/<leksjon> > /tmp/grunnlag.md   # artikkel + replikker til vurderingen
```

`shots-film` lager ett kontaktark per scene i `.screenshots/film/<leksjon>/ark-sNN.png`. **Se på
hvert ark** og sjekk mot rubrikken. Les arkene, ikke enkeltbildene.

`shots-film` måler også all tekst i bildet (også merkelapper over 3D) og stopper når tekst
overlapper annen tekst (også to merkelapper på samme linje som så vidt går inn i hverandre),
når to SVG-merkelapper på samme linje står kloss inntil hverandre, når SVG-tekst ligger under
en HTML-boks med bakgrunn, eller når tekst er kuttet i bildekanten. Funnene står i `overlapp.txt` i samme
mappe. Rett dem og ta de scenene på nytt med `--scener 3,7`: de andre scenenes bilder og ark
blir liggende, så settet er alltid helt. Tekst tegnet inne i WebGL ser sjekken ikke.

### Rubrikken (5 akser, 1-5, terskel 19/25 og ingen akse under 3)

| Akse | 5 betyr |
|---|---|
| **Viser** | Bildet viser det stemmen sier på hver beat. Ingen bilde-beat er bare pynt. |
| **Lesbart** | Ingenting kuttes, overlapper eller er for lite for en Chromebook på 1366×768. Kontrast holder på projektor. |
| **Variasjon** | Minst én overbevisende 3D-scene, minst ett kart eller snitt, minst én dataviz. Bildet skifter ofte. |
| **Forståelig** | En 14-åring henger med uten artikkelen. Fagord forklart. Kort tale. |
| **Tro mot artikkelen** | Ingen nye fakta. Tall stemmer med bildene. Tonen passer emnet. |

Vurderingen gjøres av **to ferske underagenter** som ikke har skrevet filmen og ikke ser koden:

`film-grunnlag` tar med alle artikkelens blokker (også sitater, faktabokser, `expandable` og
interaktive komponenter) og teksten i hver scenes visual-props («Tekst i bildet»). Tekst som
bare står i filmens egen `data.ts` eller i koden, ser den ikke: lim den inn selv.

Bildene tas på pause, så kontrollinja under bildet viser alltid første kapittel og 0:00. Si
det til vurdereren, så den ikke melder det som en feil.

1. **Faktasjekkeren** får `grunnlag.md` (artikkelen + replikkene + tekst i bildet). Merkelapper
   er påstander på lik linje med replikkene. Den går gjennom hver
   replikk og lister alt som ikke står i artikkelen, er skjerpet, har mistet en presisering
   («Afghanistan-krigen *alene*»), eller kan misforstås når to tall står etter hverandre.
   Svar per replikk: `scene.beat: problem -> forslag`. Ingen funn er et gyldig svar.
2. **Vurdereren** får `grunnlag.md`, kontaktarkene og `overlapp.txt`. Den scorer rubrikken og
   lister konkrete rettelser («scene 4 beat 2: kameraet er inni skorsteinen - flytt til ...»).
   Står det noe i `overlapp.txt`, kan Lesbart ikke få mer enn 3. Den skal bruke hele skalaen:
   4 betyr «ingen merkbare feil», 5 betyr «på høyde med Titanic».

Rett alt fra faktasjekkeren, så vurdererens punkter, og vurder på nytt. Maks tre runder.

---

## 6. Sjekkliste før PR

- [ ] `validate-film`, `tsc -b`, `eslint src/features/film` og `shots-film` (også overlapp) er grønne.
- [ ] Faktasjekken har gått gjennom alle replikker mot artikkelen, og funnene er rettet.
- [ ] `vurdering` er skrevet inn i manuset.
- [ ] Hvert kontaktark sett. Ingen tom beat, ikke noe inni modellen, ingenting kuttet.
- [ ] Uavhengig vurdering >= 19/25 (eller PR merket «(under terskel)», se rutinen).
- [ ] PR-en inneholder BARE manus-fila og `src/features/film/visuals/<film-id>/`.
- [ ] Ingen skjermbilder committet (`.screenshots/` er ignorert).
