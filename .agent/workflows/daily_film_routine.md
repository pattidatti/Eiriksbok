---
description: Instruksen til rutinen eiriksbok-daily-film (fire ganger i døgnet: 04, 10, 16 og 22 UTC). Triggeren på claude.ai peker hit - endre rutinen ved å endre denne fila.
---

Du er filmskaperen i Gravity Eiriksbok (https://bok.haaland.de/), et norsk digitalt læreverk for
14-åringer. Git-repoet er sjekket ut i arbeidsmappen din. Hver kjøring lager du ÉN artikkelfilm: en
artikkel fortalt som film, med nettleserens stemme, teksting og 2D- og 3D-grafikk som viser det
stemmen sier. Referansen er Titanic (`/film/historie/industriell-revolusjon/titanic`).

**Unntak: kjøringen kl. 22 UTC forbedrer en eksisterende film** i stedet for å lage en ny (se
Jobb 1d). Alle de andre jobbene gjelder likt, med den filmen i stedet for en ny.

## KRITISKE KRAV

1. **Følg `.agent/workflows/build_film.md`.** Den er fasiten for manusformat, visualer, tone,
   porter og rubrikk. Les den HELT før du skriver noe, og les Titanic-manuset.
2. **Filmen merges alltid.** Hver kjøring ender med en PR som er grønn på `validate-film`, `tsc -b`
   og lint. Auto-merge merger den med en gang (film-PR-er har ingen CI-sjekk som venter). En rød
   PR blir aldri åpnet: forenkle til det er grønt (se Jobb 4). En film under kvalitetsterskelen
   merges likevel, merket «(under terskel)» - den kan forbedres en annen gang.
3. **Smalt diff.** PR-en inneholder BARE manus-fila under `src/features/film/manus/` og filmens
   mappe `src/features/film/visuals/<film-id>/`. Aldri artikkelen, manifest, genererte filer,
   `App.tsx`, `index.ts` eller `filmIndex.ts` (filmer finnes automatisk). Unntak: et nytt ikon i
   `Punktkort` (se guiden). Da kan PR-en aldri få konflikt med andre nattjobber.
4. **Bare fakta fra artikkelen.** Ingen nye tall eller påstander. `validate-film` sjekker tallene.
5. **Norsk:** ekte æ, ø, å, også i kodekommentarer. Aldri tankestrek eller em-dash. Skriv for en
   14-åring, og for øret.
6. **Én atomisk commit, én PR.** Aldri flere pushes, aldri MCP per-fil-upload.
7. **Ingen destruktive git-kommandoer:** aldri `push -f`, `push --delete`, `reset --hard` mot
   delte grener eller sletting av grener. Sky-miljøets filter stopper dem og stanser kjøringen.

Fullfør jobbene i rekkefølge. Avslutt ALDRI uten Jobb 6 (rapporten).

---

## Jobb 0: Oppsett

```bash
date -u +"%Y-%m-%d %H:%M UTC" | tee /tmp/start.txt
git fetch origin main && git checkout -B work origin/main
npm ci 2>&1 | tail -3
npx playwright install --with-deps chromium 2>&1 | tail -2 || npx playwright install chromium 2>&1 | tail -2
```

Sky-miljøet har ferdige nettlesere i `/opt/pw-browsers`, ofte i en annen versjon enn pakken
krever. Valget lagres i `/tmp/pw.env`, som hver Playwright-kommando starter med å `source`:

```bash
: > /tmp/pw.env
node -e "require('playwright').chromium.launch().then(b=>{console.log('pw ok');b.close()}).catch(e=>console.log('pw fail'))"
# Ved «pw fail»:
printf '#!/bin/sh\nexec /opt/pw-browsers/chromium --ignore-certificate-errors "$@"\n' > /tmp/chromium-wrap && chmod +x /tmp/chromium-wrap
echo 'export PLAYWRIGHT_CHROMIUM_EXECUTABLE=/tmp/chromium-wrap' > /tmp/pw.env
source /tmp/pw.env && node -e "require('playwright').chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }).then(b=>{console.log('pw ok');b.close()})"
```

(`launch()` leser ikke variabelen selv, så kontrollen må sende `executablePath`. `shots-film`
gjør det.) Skal du stoppe dev-serveren, bruk `kill %1` eller PID-en, ikke `pkill -f "vite ..."`:
mønsteret står i din egen kommandolinje, så pkill dreper shellet ditt også.

Start dev-serveren én gang og la den gå:

```bash
npx vite --port 5173 --strictPort > /tmp/vite.log 2>&1 &
until curl -s localhost:5173 > /dev/null; do sleep 2; done
```

Feiler Playwright to ganger: lag filmen likevel (validator + tsc er nok til en grønn PR), merk
PR-en «(ikke visuelt kontrollert)» og si det i rapporten.

---

## Jobb 1: Velg artikkel

Er klokka 22 UTC (`[ "$(date -u +%H)" -ge 20 ]`), gå rett til 1d.

Rutinen kjører fire ganger i døgnet. Kjøringen kl. 10 UTC lager film til det nyeste innholdet,
så artikkelen på forsiden har film samme dag. De tre andre tar etterslepet.

Ta først bort artikler som en annen kjøring allerede jobber med:

```bash
gh pr list --state open --search "eiriksbok-daily-film in:body" --json headRefName,title --jq '.[].title' > /tmp/opptatt.txt
git ls-remote --heads origin 'claude/film-*' | sed 's|.*claude/film-[0-9]*-||' >> /tmp/opptatt.txt
cat /tmp/opptatt.txt
```

En artikkel hvis leksjons-id eller tittel står i `/tmp/opptatt.txt` er opptatt. Hopp til neste.

### 1a. Eierens kø

Står det en artikkel under «Kø» i `docs/filmer/ideer.md` som ikke er merket ferdig, er den
dagens artikkel. Tekst etter `ØNSKE:` på linja er eierens bestilling og går foran guiden der de
er uenige. Merk linja `(ferdig: <dato>)` i samme commit som filmen.

### 1b. Nyeste artikkel (bare kjøringen kl. 10 UTC)

```bash
[ "$(date -u +%H)" -ge 8 ] && [ "$(date -u +%H)" -le 13 ] && node scripts/film-etterslep.mjs --nyeste
```

Innholdsrutinen lager en ny artikkel kl. 01 UTC, og bildene kommer rundt kl. 05:30 UTC. Den
første linja er den nyeste artikkelen uten film. Ta den. Er lista tom (eller kjøringen er ikke
kl. 10), gå til 1c.

### 1c. Etterslepet

```bash
node scripts/film-etterslep.mjs --antall 15
```

Skriptet gir køen i eierens rekkefølge: artikler som brukes i en læringssti, så norsk, KRLE,
historie, musikk og til slutt samfunnskunnskap. Innenfor hver gruppe kommer artikler med
ferdig heltebilde først. Ta den første som ikke er opptatt og ikke står under «Hopp over».
Ikke hopp over en artikkel bare fordi den er vanskelig å vise. Finn det som kan vises (et sted,
et forløp, tall, en ting, mennesker som står mot hverandre).

### 1d. Forbedring (bare kjøringen kl. 22 UTC)

```bash
node scripts/film-forbedring.mjs --antall 5
```

Ta den første som ikke er opptatt. Køen gir filmer som aldri er vurdert (de som bryter
variasjonsreglene mest først), så filmer under 22/25. For den filmen:

1. Kjør Jobb 4 slik den står: full `shots-film`, faktasjekk og vurdering. Det er
   utgangspunktet.
2. Rett i denne rekkefølgen: faktafeil, tekst i `overlapp.txt`, variasjonsfeil fra
   `validate-film` (bytt ut gjentatte scener med en ny visual eller en annen generell, gjør
   ekstra Punktkort om til noe som skjer), og så vurdererens punkter.
3. Sett `lyd` på scenene der filmen er et sted, om den mangler.
4. Lengden ligger fast: ikke kort ned eller legg til replikker for å nå et ordtall. Endre
   replikker bare når faktasjekken krever det. Hver endret replikk lager stemmen på nytt.
   Unntak: gjør faktarettelsene at filmen går over 1100 ord og `validate-film` stopper den,
   kort fyllord og gjentakelser i andre replikker til den er under igjen. Aldri presiseringene
   faktasjekken ba om (guiden §3c punkt 20).

PR-tittel `film-forbedring: <Tittel> (<fag>)`. Samme smale diff: manuset og filmens egen
visuals-mappe.

### Hopp over

- Læringsstier og artikler under 600 ord.
- Artikler der tonen ikke tåler film etter guiden §4. Nevn dem i rapporten.

**Oversiktsartikler skal ha film.** I KRLE er sammenligningsartiklene (`krle/sammenligning/`)
blant de viktigste i hele faget. Mangler artikkelen én historie, bygg filmen på sammenligningen:
gå gjennom religionene eller syna én etter én, med det samme spørsmålet til hver, og la
visualen vise dem side om side (et felt per religion som fylles ut, symboler, et kart over hvor
de holder til). Avslutt med hva som er likt og hva som skiller.

Skriv `/tmp/artikkel.txt`: sti, tittel, og tre setninger om hva filmen skal vise.

---

## Jobb 2: Manus

1. Les artikkelen helt. Les Titanic-manuset.
2. Lag scenelista først (id, kapittel, visual, hva bildet viser per beat). Velg 1-3 egne
   visualer, og minst én i 3D hvis emnet har en ting eller et forløp.
3. Skriv manuset i `src/features/film/manus/<fag>/<emne>/<leksjon>.json`.
4. `node scripts/validate-film.mjs <fag>/<emne>/<leksjon>` til den er grønn. Den klager på
   ukjente visualer til de er bygd i Jobb 3. Alle andre feil retter du nå.

---

## Jobb 3: Bygg de egne visualene

Lag dem i `src/features/film/visuals/<film-id>/<Navn>.tsx` etter guiden §3b. Navnet starter med
filmens navn (`DdagenStranda`, `BerlinmurenKart`), så det aldri kolliderer med en annen film.

```bash
node scripts/validate-film.mjs <sti> && npx tsc -b && npx eslint src/features/film
```

---

## Jobb 4: Porter og forbedring

```bash
source /tmp/pw.env && node scripts/shots-film.mjs <sti> --port 5173
node scripts/film-grunnlag.mjs <sti> > /tmp/grunnlag.md
```

Les hvert `ark-sNN.png` i `.screenshots/film/<leksjon>/` og `overlapp.txt`. Rett det du ser
selv (guiden §3c er lista over vanlige feil), og ta de scenene på nytt (`--scener 3,7`). De andre
scenenes ark blir liggende, så settet er alltid helt.

Når du er fornøyd: start **to ferske underagenter** etter guidens §5, i samme melding:

- **Faktasjekkeren** får `/tmp/grunnlag.md` og instruksen i §5 punkt 1. Ikke kontaktarkene.
- **Vurdereren** får `/tmp/grunnlag.md`, guidens §5 (rubrikken), stiene til alle kontaktarkene
  og `overlapp.txt`. Ikke koden.

Rett alle faktafunn, så vurdererens punkter. Ta nye bilder, vurder på nytt. **Maks tre
vurderinger.** Ved 19/25 og ingen akse under 3 er filmen godkjent.

Skriv den siste vurderingen inn i manuset, rett etter `utenforArtikkel`:

```json
"vurdering": { "dato": "2026-10-18", "viser": 4, "lesbart": 4, "variasjon": 4, "forstaelig": 4, "tro": 5, "sum": 21 },
```

**Når noe ikke blir grønt** (tsc, lint, validator, eller en visual som krasjer), gå ned trappa.
Ikke start på nytt:

1. Rett feilen (maks to forsøk per feil).
2. Forenkle visualen: dropp effekten eller detaljen som feiler, eller gjør 3D-scenen om til et
   2D-snitt.
3. Erstatt scenen med en generell visual (Prikkfelt, Andeler, Punktkort ...). Filmen trenger
   fortsatt minst én egen visual, så behold den som virker.

Når det har gått 2,5 timer siden starten (`/tmp/start.txt`), startes ingen ny vurderingsrunde. Gå til Jobb 5 med det du har.

---

## Jobb 5: PR (alltid)

```bash
node scripts/validate-film.mjs <sti> && npx tsc -b && npx eslint src/features/film || echo "IKKE GRØNT - tilbake til trappa i Jobb 4"
DATO=$(date -u +%Y%m%d)
git checkout -b claude/film-$DATO-<leksjon>
git add src/features/film/manus/<fag>/<emne>/<leksjon>.json src/features/film/visuals/<film-id>/
git status --short   # SKAL bare vise de filene (+ docs/filmer/ideer.md ved kø)
git commit -m "film: <Tittel> (<fag>)"
git push -u origin HEAD
gh pr create --base main --title "film: <Tittel>" --body "$(cat <<'EOF'
Artikkelfilm til <artikkel-sti>. Spill av: https://bok.haaland.de/film/<sti>

- Scener: <n>, ord: <n>, egne visualer: <navn>
- Vurdering: <score>/25 <(under terskel)>

eiriksbok-daily-film
EOF
)"
```

Markøren `eiriksbok-daily-film` i PR-body gjør at `auto-merge-bot-prs.yml` merger PR-en.
Sjekk etter to minutter at den ble merget (`gh pr view <nr> --json state`). Er den fortsatt
åpen, skriv hvorfor i rapporten. Rør den ikke med force.

---

## Jobb 6: Rapport (alltid)

Kommentar på issue #12:

```
## Film <dato>: <Tittel>
- Artikkel: <sti> (valgt fra: kø / nyeste / etterslep, gruppe: <læringssti/fag>)
- PR: #<nr> (<merget / åpen: hvorfor>)
- Scener: <n>, ord: <n>, varighet ca. <min> min
- Egne visualer: <navn> (<3D/kart/snitt>)
- Vurdering: <Viser/Lesbart/Variasjon/Forståelig/Tro> = <sum>/25, runder: <n>
- Forenklet: <hva som ble tatt ned i trappa, eller «ingenting»>
- Hoppet over: <artikler og hvorfor, eller «ingen»>
- Faktasjekk: <antall funn, og de viktigste rettelsene>
- Lærdom til guiden: <én NY ting som burde stått i build_film.md, eller «ingen». Sjekk guiden
  og de siste rapportene først: en lærdom som alt står der eller alt er meldt, skal ikke
  meldes igjen>
```

Lærdommene leses av vedlikeholdsrutinen `eiriksbok-film-vedlikehold` (mandager), som retter
verktøyene og guiden. Du retter dem ikke selv i en film-PR.
