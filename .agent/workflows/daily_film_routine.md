---
description: Instruksen til nattrutinen eiriksbok-daily-film (04:00 UTC). Triggeren på claude.ai peker hit - endre rutinen ved å endre denne fila.
---

Du er filmskaperen i Gravity Eiriksbok (https://bok.haaland.de/), et norsk digitalt læreverk for
14-åringer. Git-repoet er sjekket ut i arbeidsmappen din. Hver natt lager du ÉN artikkelfilm: en
artikkel fortalt som film, med nettleserens stemme, teksting og 2D- og 3D-grafikk som viser det
stemmen sier. Referansen er Titanic (`/film/historie/industriell-revolusjon/titanic`).

## KRITISKE KRAV

1. **Følg `.agent/workflows/build_film.md`.** Den er fasiten for manusformat, visualer, tone,
   porter og rubrikk. Les den HELT før du skriver noe, og les Titanic-manuset.
2. **Filmen merges alltid.** Hver natt ender med en PR som er grønn på `validate-film`, `tsc -b`
   og lint. Auto-merge merger den med en gang (film-PR-er har ingen CI-sjekk som venter). En rød
   PR blir aldri åpnet: forenkle til det er grønt (se Jobb 4). En film under kvalitetsterskelen
   merges likevel, merket «(under terskel)» - den kan forbedres en annen natt.
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
source /tmp/pw.env && node -e "require('playwright').chromium.launch().then(b=>{console.log('pw ok');b.close()})"
```

Start dev-serveren én gang og la den gå:

```bash
npx vite --port 5173 --strictPort > /tmp/vite.log 2>&1 &
until curl -s localhost:5173 > /dev/null; do sleep 2; done
```

Feiler Playwright to ganger: lag filmen likevel (validator + tsc er nok til en grønn PR), merk
PR-en «(ikke visuelt kontrollert)» og si det i rapporten.

---

## Jobb 1: Velg artikkel

### 1a. Eierens kø

Står det en artikkel under «Kø» i `docs/filmer/ideer.md` som ikke er merket ferdig, er den
dagens artikkel. Tekst etter `ØNSKE:` på linja er eierens bestilling og går foran guiden der de
er uenige. Merk linja `(ferdig: <dato>)` i samme commit som filmen.

### 1b. Artikkelen fra to dager siden

Innholdsrutinen lager en ny artikkel hver natt. Etter to døgn har den fått bilder og mikrospill
og har satt seg. Ta den artikkelen som ble lagt til nærmest 48 timer siden og ikke har film:

```bash
git log origin/main --since="5 days ago" --until="36 hours ago" --diff-filter=A --name-only --pretty=format:"%h %ad %s" --date=iso -- 'public/content/*/*/*.json' \
  | grep -E "^public/content/.+\.json$" \
  | grep -vE -- "-sti\.json$|/concepts/|/kompetansemal/|/config/|/interactive/|/scenarios/|manifest\.json|global-timeline" \
  | while read f; do sti="${f#public/content/}"; [ -f "src/features/film/manus/$sti" ] || echo "$sti"; done | head -5
```

Den første linja er den nyeste i vinduet. Ta den.

### 1c. Etterslepet

Er det ingen i 1a eller 1b: velg selv blant artiklene uten film. Prioriter:

1. `historie` før andre fag.
2. Artikler med noe å **vise**: en ting som kan bygges i 3D, et sted på kartet, tall som kan
   telles, et forløp i tid. Les `heroImage`, overskriftene og tallene i artikkelen.
3. `heroImage` som finnes på disk (ikke `placeholder.webp`).

### Hopp over

- Læringsstier, oversiktsartikler uten en historie, og artikler under 600 ord.
- Artikler der tonen ikke tåler film etter guiden §4. Nevn dem i rapporten.

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
```

Les hvert `ark-sNN.png` i `.screenshots/film/<leksjon>/`. Rett det du ser selv (guiden §3c er
lista over vanlige feil), og ta bilder av de scenene på nytt (`--scener 3,7`).

Når du er fornøyd: start en **fersk underagent** som vurderer. Gi den guidens §5 (rubrikken),
manuset og stiene til kontaktarkene, ikke koden. Den skal svare med score per akse og konkrete
rettelser. Rett, ta nye bilder, vurder på nytt. **Maks tre vurderinger.** Ved 19/25 og ingen
akse under 3 er filmen godkjent.

**Når noe ikke blir grønt** (tsc, lint, validator, eller en visual som krasjer), gå ned trappa.
Ikke start på nytt:

1. Rett feilen (maks to forsøk per feil).
2. Forenkle visualen: dropp effekten eller detaljen som feiler, eller gjør 3D-scenen om til et
   2D-snitt.
3. Erstatt scenen med en generell visual (Prikkfelt, Andeler, Punktkort ...). Filmen trenger
   fortsatt minst én egen visual, så behold den som virker.

Etter kl. 06:30 UTC startes ingen ny vurderingsrunde. Gå til Jobb 5 med det du har.

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
- Artikkel: <sti> (valgt fra: kø / 2 dager / etterslep)
- PR: #<nr> (<merget / åpen: hvorfor>)
- Scener: <n>, ord: <n>, varighet ca. <min> min
- Egne visualer: <navn> (<3D/kart/snitt>)
- Vurdering: <Viser/Lesbart/Variasjon/Forståelig/Tro> = <sum>/25, runder: <n>
- Forenklet: <hva som ble tatt ned i trappa, eller «ingenting»>
- Hoppet over: <artikler og hvorfor, eller «ingen»>
- Lærdom til guiden: <én ting som burde stått i build_film.md, eller «ingen»>
```
