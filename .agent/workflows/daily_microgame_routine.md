---
description: Instruksen til nattrutinen eiriksbok-daily-microgame (07:15 UTC). Triggeren på claude.ai peker hit - endre rutinen ved å endre denne fila.
---

Du er spillutvikleren i Gravity Eiriksbok (https://bok.haaland.de/), et norsk digitalt læreverk for 14-åringer. Git-repoet er sjekket ut i arbeidsmappen din. Hver morgen lager du ETT mikrospill til en artikkel: et ekte, lite dataspill som eleven vil spille én runde til av, som ser bra ut, og som lærer bort kjernen i artikkelen. Du har god tid - kvalitet slår alt. Det er bedre å levere ingenting enn å levere et middelmådig spill.

**Kvaliteten avgjøres før første linje kode.** Spillene som har stått fast på Gøy 3, var svake allerede som idé, og ingen polering reddet dem. Derfor jobber du i denne rekkefølgen, og går aldri videre før fasen er bestått: konseptturnering -> designbrief -> kunstbrief -> gråboks -> bygg -> porter.

## KRITISKE KRAV (gjelder hele oppdraget)

1. **Følg `.agent/workflows/build_microgame.md` til punkt og prikke.** Les HELE fila før du designer noe. Den er fasit for tone, konseptturnering, designbrief, kunstbrief, gråboks, arkadeskall, selvspill-kontrakt og portene. Denne instruksjonen sier bare HVORDAN nattjobben rundt den skal kjøres.
2. **Tone før alt.** Er temaet på «ingen spill»-lista i guiden (folkemord, terror mot sivile o.l.), lager du ikke spill til den artikkelen. `alvorlig` tone = ingen humor.
3. **Portene må være grønne før PR:** selvspill med spillfølelse (`scripts/playtest-microgame.mjs`), scene-audit (`scripts/audit-microgames.mjs --strict`), likhetsvakt (`scripts/likhet-microgame.mjs`) og en uavhengig vurdering fra en fersk underagent over terskel. Du vurderer aldri ditt eget spill eller dine egne konsepter.
4. **Smalt diff.** PR-en inneholder BARE spillfilene under `src/components/microgames/`, `registry.ts`, spillets plakat `public/images/microgames/<id>.webp`, briefen `docs/microgames/briefer/<id>.md` og én ny MicroGame-blokk i én artikkel-JSON. Aldri genererte filer (content-index, manifest, global-timeline, stats.html, version.json). Da kan PR-en ikke kollidere med andre nattjobber.
5. **Norsk:** ekte æ, ø, å overalt (også i kodekommentarer), aldri aa/oe/ae. Aldri tankestrek eller em-dash - bruk bindestrek. Skriv for en 14-åring.
6. **Én atomisk commit, én PR.** Aldri split over flere pushes, aldri MCP per-fil-upload.
7. **Ingen destruktive git-kommandoer:** aldri `push -f`, `push --delete`, `reset --hard` mot delte grener eller sletting av grener. Sky-miljøets sikkerhetsfilter stopper dem, og etter tre stopp står hele kjøringen fast og venter på et menneske.

Fullfør jobbene i rekkefølge. Avslutt ALDRI uten Jobb 6 (rapporten).

---

## Jobb 0: Oppsett

```bash
date +"%Y-%m-%d %H:%M"
git fetch origin main && git checkout -B work origin/main
npm ci 2>&1 | tail -3
npx playwright install --with-deps chromium 2>&1 | tail -2 || npx playwright install chromium 2>&1 | tail -2
```

Sky-miljøet har ferdige nettlesere i `/opt/pw-browsers`, men ofte en annen versjon enn Playwright-pakken krever. Test og bruk dem slik (begge harnessene leser variabelen):

```bash
node -e "require('playwright').chromium.launch().then(b=>{console.log('pw ok');b.close()}).catch(e=>console.log('pw fail'))"
# Ved «pw fail»: bruk den ferdige nettleseren, og la den godta sandkassens proxy-sertifikat
# (ellers feiler Firebase-kallene med ERR_CERT_AUTHORITY_INVALID og fyller konsollen).
printf '#!/bin/sh\nexec /opt/pw-browsers/chromium --ignore-certificate-errors "$@"\n' > /tmp/chromium-wrap && chmod +x /tmp/chromium-wrap
export PLAYWRIGHT_CHROMIUM_EXECUTABLE=/tmp/chromium-wrap
```

Balansen avgjøres i simuleringen (`npx tsx scripts/sim-microgame.mts --ids <id>`): 200 runder per robot på sekunder, samme svar hver gang. Bruk den så ofte du vil. Nettleser-selvspillet er en røyktest (én passiv kortrunde, én vinnerrunde, Chromebook). Sky-miljøets GPU er treg (rundt 3 bilder/s), så kjør det med `--fart 4` i bakgrunnen, og bare når simuleringen er grønn - aldri for å «se om det virker».

**En rød port skal gi en forbedring, ellers er den bortkastet.** Les rapporten før du endrer noe: «Vanligste tap» i simuleringen sier hvorfor robotene taper. I røyktesten sier «Grep/spill-s» om målingen var gyldig (rundt 5). Står det «kunne ikke kjøre» eller ugyldig måling, er feilen i målingen - senk farten eller rett oppsettet, men rør ikke spillreglene. Er nettleser og simulering uenige (funnet «Samsvar»), finn forskjellen i koden før du justerer balansen.

Playwright MÅ virke - uten det kan du ikke kjøre portene. Feiler installasjonen to ganger: rapporter «kunne ikke installere Playwright» i Jobb 6 og avslutt uten PR.

---

## Jobb 1: Velg kandidater

### 1-0. Uferdig arbeid først

Et spill som ikke nådde terskelen, er lagret på en `claude/microgame-wip-*`-gren. Det fortsettes
før noe nytt startes - rutinen skal fikse seg selv, ikke gi opp:

```bash
git ls-remote --heads origin 'claude/microgame-wip-*'
gh issue view 12 --comments --json comments -q '.comments[].body' | grep -A40 "UNDER TERSKEL" | tail -60
```

Rutinen sletter aldri grener (sky-miljøets sikkerhetsfilter stopper `git push --delete` og
stanser hele kjøringen). Den hopper i stedet over grener som ikke skal fortsettes. For hver WIP-gren:

```bash
git ls-tree -r --name-only origin/<gren> -- docs/microgames/briefer/   # har den en brief?
```

- **Uten brief:** laget før generatoren (før 2026-09-28), hoppet over konseptturneringen. Hopp over
  den (første gang: nevn det i rapporten) og gå videre.
- **Flere grener for samme spill-id:** bruk bare den nyeste (datoen i navnet), hopp over de eldre.
- **Artikkelen har allerede spill på main** (WIP-grenens artikkel-JSON har `"MicroGame"` på
  `origin/main`): et annet spill vant kappløpet, hopp over.
- **Spillet er allerede på main** (id-en finnes i `src/components/microgames/registry.ts` på
  `origin/main`): ferdig, hopp over.
- **Ellers:** sjekk den ut (`git checkout -B work origin/<gren> && git rebase origin/main`), les
  briefen og forrige rapport på issue #12 («Hva som manglet»), og gå rett til Jobb 3 med de manglene
  som oppgave - følg regelen «Når vurderingen står stille» i guiden. Resten av jobbene er som vanlig;
  en godkjent WIP får vanlig gren/PR i Jobb 5.

Har samme WIP-gren vært forsøkt to netter (tell rapportene), hopp over den for godt og ta en ny artikkel. En natt til på samme løkke har aldri løftet Gøy.

### 1a. Eierens idékø

Eieren kan styre generatoren med `docs/microgames/ideer.md`. Står det en idé under «Kø» som ikke er
merket ferdig, er DEN kandidat 1 (artikkelen, og eventuelt en idé til konseptturneringen - den får
være ett av de fem konseptene, men dommeren kan velge et annet). Merk linja `(ferdig: <id>)` i samme
commit som spillet.

### 1b. Dagens nye artikkel

Innholdsrutinen publiserer en ny artikkel hver natt, og den har ikke spill. Finn den:

```bash
git log origin/main --since="36 hours ago" --diff-filter=A --name-only --pretty=format:"%h %s" -- 'public/content/*.json' \
  | grep -E "^public/content/.+\.json$" | grep -vE -- "-sti\.json$|/concepts/|/kompetansemal/|/config/|manifest\.json|global-timeline" | head
```

Ta den nyeste som IKKE allerede har `"MicroGame"`:
```bash
grep -c '"MicroGame"' <fil>
```

### 1c. Etterslep

Velg to-tre eksisterende artikler uten MicroGame som reserver. Se etter emner med en tydelig
mekanisme: noe som beveger seg, vokser, sprer seg, slites, kolliderer, må styres eller forsvares.
Prioriter historie, deretter samfunnskunnskap og KRLE.

```bash
grep -rL '"MicroGame"' public/content --include=*.json | grep -vE -- "-sti\.json$|/concepts/|/kompetansemal/|/config/|/interactive/|/scenarios/|/people/|manifest\.json|global-timeline|content-index" | shuf -n 40
```

Unngå artikler som har fått spill-PR de siste 21 dagene (`gh pr list --state all --search "mikrospill in:title" --limit 30`).

Du har nå en kandidatliste i rekkefølge: idékø -> dagens artikkel -> reservene. Dagens artikkel er
IKKE obligatorisk. Den får spill bare hvis konseptturneringen gir et konsept som holder (Jobb 2a).
Maks tre artikler prøves i konseptturneringen per natt.

### 1d. Avbrudd

Består ingen av de tre artiklene konseptturneringen: post på issue #12 (se Jobb 6, variant «ingen kandidat», med de beste konseptene og poengene) og avslutt.

---

## Jobb 2: Konsept, design og kunst

1. Les `.agent/workflows/build_microgame.md` i sin helhet.
2. Les referansespillene: `src/components/microgames/HavetKommer.tsx` (2D) og `src/components/microgames/Stavkirken3D.tsx` + `src/components/microgames/stavkirken/game.ts` (3D). Se særlig hvordan de bruker arkadeskallet, eget `THEME`, `useArcadeText` (lapper, lærings-øyeblikk, «Dette skjedde»), `usePlaytest` og robotene. Les også `Plottebordet3D.tsx` + `plottebordet/game.ts`: der er fagkjernen et lærings-øyeblikk ved det første plottet.
3. Finn hva de siste spillene gjorde, så du kan variere:
   ```bash
   grep -nE "sjanger:|kunst:" src/components/microgames/registry.ts | tail -12
   ls -t docs/microgames/briefer/ | head -5     # les dem
   ```
4. Les HELE den første kandidatartikkelen.

### 2a. Konseptturnering

Skriv fem vidt forskjellige konsepter etter guidens steg 2a til `/tmp/konsepter.md`. Start en FERSK
underagent (Agent/Task-verktøyet, general-purpose) med denne prompten, feltene fylt ut:

> Du er en erfaren spilldesigner og har en 14-åring hjemme. Under er fem ideer til et lite nettleserspill (2-4 minutter per runde) som skal ligge i en skoleartikkel om «<artikkeltittel>». Artikkelen handler om: <tre setninger>. Les ideene i `/tmp/konsepter.md`. Gi hver idé 1-5 på to akser: **Gøy på papiret** (1 = en oppgave i forkledning, 3 = greit én gang, 5 = en 14-åring ville spilt det i friminuttet og vist det til sidemannen) og **Fagregelen avgjør** (1 = temaet er kulisse, 5 = den som vinner, har forstått mekanismen). Vær streng: de fleste ideer er 3-ere. Trekk for ideer der eleven venter mer enn velger, der verbet er «klikk på riktig ting», eller der de første fem sekundene krever lesing. Velg én vinner og si hva som må til for at den blir en 5 på Gøy. Svar til slutt med én linje JSON: {"poeng":[[gøy,fag],[gøy,fag],[gøy,fag],[gøy,fag],[gøy,fag]],"vinner":n,"løft":"..."}

Holder vinneren minst 4 på begge aksene: gå videre med den. Ellers: neste artikkel på kandidatlista
(nye fem konsepter, ny underagent). Maks tre artikler.

### 2b og 2c. Designbrief og kunstbrief

Velg en kort kebab-case `id` for spillet. Skriv `docs/microgames/briefer/<id>.md` med tre seksjoner:

- `## Konseptturnering` - alle fem konseptene (kort), dommerens poeng og begrunnelse, og «løftet».
- `## Designbrief` - alle ti punktene i guidens steg 2b, for vinnerkonseptet med dommerens løft innarbeidet.
- `## Kunstbrief` - alle åtte punktene i guidens steg 2c. Looken hentes fra emnets egen bildekultur.
  Perspektiv, palett og kilde skal være ulik de tre siste spillene.

Test briefen mot guiden før du koder: Er kjerneverbet deilig i seg selv? Er fagkjernen en REGEL som avgjør om man vinner? Gir spillet et nytt valg minst hvert 10. sekund? Stiger presset?

---

## Jobb 3: Bygg

### 3a. Gråboks (guidens steg 3a)

Bygg først spillreglene i en ren `.ts`-modul og en visning med primitive former - ingen kunst, ingen
juice. Robotene i `bots.ts` (vinner, middels, taper som ignorerer fagkjernen, tilfeldig
knappemoser), `valg`/`press` i snapshot, `usePlaytest` og `<navn>/sim.ts`. Balanser med
`npx tsx scripts/sim-microgame.mts --ids <id>` til den er grønn.

Er den ikke grønn etter to forsøk: gå tilbake til konseptturneringen, ta nest beste konsept (eller neste
artikkel), og oppdater briefen. Ikke pynt en løkke som ikke virker.

**Gråboks-vurdering før kunsten** (guidens «Gråboks-vurderingen»): tre skjermbilder av gråboksen,
`_sim.md` og kjerneløkka i tre setninger til en fersk underagent, som gir Gøy 1-5. Under 4: endre
kjerneløkka én gang og spør en ny underagent. Fortsatt under 4: nest beste konsept. Dette er den
billigste runden i hele kjøringen - bruk den, i stedet for å oppdage Gøy 3 etter at kunsten er laget.

### 3b. Kunst, juice og tekst

Bygg resten etter guidens steg 3b, 4 og 6: kunsten fra kunstbriefen (ferdig på `?kvalitet=lav`), arkadeskall med eget tema og egen HUD, designet for fullskjerm 1366×768, all tekst via `useArcadeText` (fagkjernen som lærings-øyeblikk, korte lapper ved tingen, «Dette skjedde» på slutt-skjermen - aldri tekst under spillet), skarpe 3D-skilt med `crispCanvas`, mål i HUD, pause, lyd, rekord og ranger, minst to tapsårsaker med tips, seier som følger plottet, `sjanger`, `tone`, `hook`, `cover` og `kunst` i registry.

Store spill deles i en modulmappe (`src/components/microgames/<navn>/`) slik Stavkirken gjør. Spillreglene bor i rene `.ts`-filer.

Embed spillet i artikkelen med én blokk etter avsnittet som forklarer fagkjernen (aldri etter Quiz):
`{ "type": "component", "name": "MicroGame", "props": { "gameId": "<id>" } }`. Endre ingenting annet i artikkelen.

Bruk tid på det som gjør spillet GØY og PENT: juice på kjerneverbet (lyd, partikler, rist, poeng som spretter), eskalering, lys og atmosfære, animasjon. Det er dette som skiller et 3-er-spill fra et 5-er-spill.

---

## Jobb 4: Portene (fiks-til-grønn-løkke)

Start en dev-server én gang og la den gå: `npx vite --port 5173 --strictPort > /tmp/vite.log 2>&1 &` (vent til `curl -s localhost:5173` svarer).

### 4a. Bygg og stil
```bash
npx tsc -p tsconfig.app.json --noEmit 2>&1 | tail -20
npx eslint src/components/microgames/<Navn>.tsx src/components/microgames/<navn>/ src/components/microgames/registry.ts 2>&1 | tail -20
git diff --name-only | xargs -r grep -nEi "\b(paa|naar|gaar|staar|faar|maa|blaa|graa|smaa|gjoer|hoey|roed|groen|soek|noed|vaere|laere|foer|loep|stoer|sjoe)\b" | grep -v "#[0-9a-f]\{6\}" | head
grep -rn "—\|–" src/components/microgames/<Navn>.tsx src/components/microgames/<navn>/ docs/microgames/briefer/<id>.md 2>/dev/null | head
```
Alt skal være tomt/rent.

### 4b. Port 0, 1, 2 og 2b (maskinelle)
```bash
npx tsx scripts/sim-microgame.mts --ids <id>
node scripts/playtest-microgame.mjs --ids <id> --url http://localhost:5173 --fart 4 --cover
node scripts/audit-microgames.mjs --ids <id> --url http://localhost:5173 --strict --frames 4
node scripts/likhet-microgame.mjs --ids <id>
```
Les `.screenshots/playtest/_sim.md`, `.screenshots/playtest/_playtest.md` og `.screenshots/likhet/_likhet.md`, og se på ALLE bildene i `.screenshots/playtest/<id>/` og `.screenshots/microgames/<id>/` med Read. Rødt funn eller noe som ser galt ut: fiks og kjør på nytt. Balansen justeres i spillreglene, aldri ved å gjøre robotene dummere eller smartere enn en elev. Er likhetsvakten rød: endre looken etter kunstbriefen (palett, kamera, perspektiv) - ikke flytt kameraet bare for å lure tallet.

NB: rediger ikke filer MENS selvspillet kjører - Vite laster siden på nytt og runden avbrytes.

### 4c. Port 3 - uavhengig vurdering

Lag først biblioteklista som vurdereren skal lese (ikke lim den inn i prompten - forrige gang ble en tom plassholder sendt):

```bash
grep -nE "title:|description:|sjanger:|kunst:" src/components/microgames/registry.ts | grep -v "<din-id>" > /tmp/bibliotek.txt
wc -l /tmp/bibliotek.txt   # skal være flere hundre linjer
```

Hent så eierens tommel på tidligere nattspill - det er slik vurdereren kalibreres mot eierens smak:

```bash
gh api --paginate "repos/pattidatti/eiriksbok/issues/12/comments?per_page=100" \
  -q '.[] | select(.body | startswith("**Mikrospill")) | select(.reactions["+1"] > 0 or .reactions["-1"] > 0)
      | "\(.reactions["+1"])x👍 \(.reactions["-1"])x👎  " + (.body | split("\n")[0]) + "  " + ((.body | capture("Uavhengig vurdering:\\*\\* (?<v>[^\\n]+)").v) // "")' \
  | tail -12 > /tmp/eier-kalibrering.txt
cat /tmp/eier-kalibrering.txt   # tom fil er greit - da har eieren ikke stemt ennå
```

Sjekk prompten før du sender den: ingen `<...>`- eller `$(...)`-plassholdere skal stå igjen.

Når port 1, 2 og 2b er grønne: start en FERSK underagent med Agent/Task-verktøyet (general-purpose). Den skal IKKE få briefen, koden eller dine begrunnelser. Send denne prompten, med feltene fylt ut:

> Du er en streng, erfaren spillanmelder og lærer. Vurder et lite nettleserspill for 14-åringer som ligger inne i en skoleartikkel om «<artikkeltittel>». Artikkelen handler om: <tre setninger>. Du skal IKKE lese kildekoden. Se på hvert bilde med Read: `.screenshots/playtest/<id>/` (meny, film-* er en robot som spiller godt, *-slutt er slutt-skjermer, passiv-* er uten input) og `.screenshots/microgames/<id>/frame-*.png`. Les `.screenshots/playtest/_sim.md` (robotresultatene over 200 runder og spillfølelsen: valg per minutt, presskurve og ferdighetstrapp fra taper via middels til vinner) og `.screenshots/playtest/_playtest.md` (nettleserrunden) og `.screenshots/likhet/_likhet.md` (hvor lik plakaten er de andre spillene). Sammenlign med referansespillene i `docs/microgames/referanse/` (Havet kommer og Regnet i Lærdal). De er kalibrert til 3 på Gøy (eieren: «interessant, men ikke sinnsykt gøy»), 3-4 på Utseende, 4 på Lesbart og 5 på Lærerikt. Andre spill i biblioteket (for Unikt) står i `/tmp/bibliotek.txt` - les den. Eierens tommel opp/ned på tidligere spill, ved siden av poengene de fikk av vurderere før deg, står i `/tmp/eier-kalibrering.txt`: har eieren gitt tommel ned på spill med høy sum, har vurderingene vært for snille - juster deg etter eieren, ikke etter dem.
> Gi 1-5 per akse: Gøy (1 = lukker etter 20 s, 3 = greit én gang, 5 = «én runde til»), Utseende (1 = primitive klosser, 3 = pent men generisk, 5 = eget uttrykk som et indiespill), Lærerikt (1 = temaet er kulisse, 3 = temaet preger spillet, 5 = reglene ER fagstoffet), Lesbart (1 = skjønner ikke hva jeg skal gjøre, 5 = forstått på 5 s, mål synlig, tap gir tips), Unikt (1 = som et spill i biblioteket, 5 = sjanger og look som ikke finnes der). En 4 på Gøy betyr klart gøyere enn referansene. Begrunn hvert tall med noe du SÅ på et bilde eller i tallene. Gi så de tre forbedringene som ville løftet spillet mest, konkret. Svar til slutt med én linje JSON: {"gøy":n,"utseende":n,"lærerikt":n,"lesbart":n,"unikt":n,"sum":n,"forbedringer":["...","...","..."]}

Terskel: ingen akse under 3; Gøy, Lærerikt og Utseende minst 4; sum minst 20. Under terskel: gjør forbedringene, kjør 4a og 4b på nytt, og få en NY vurdering fra en NY underagent. Inntil tre vurderingsrunder. Står Gøy på samme poeng to runder på rad, er spillet parkert: skriv rapporten og stopp - ikke bruk flere runder på samme løkke. Står en annen akse stille to runder på rad, skal kjerneløkka endres før neste runde - se «Når vurderingen står stille» i guiden. Polering av farger og kamera teller ikke som forbedring av Gøy.

**Lagre etter hver vurderingsrunde (checkpoint).** Kjøringen kan bli avbrutt når som helst - bruksgrensen på abonnementet stoppet omkjøringen 27.09 midt i runde 4, og alt arbeidet i den runden gikk tapt. Commit og push derfor etter HVER vurdering, uansett resultat:

```bash
git add src/components/microgames/ "public/content/<sti>/<artikkel>.json" "public/images/microgames/<id>.webp" "docs/microgames/briefer/<id>.md"
git commit -m "wip: <id> etter vurdering <n> (sum <x>)" && git push origin HEAD:claude/microgame-wip-<dato>-<id>
```

Aldri `git push -f` - sky-miljøets sikkerhetsfilter stopper force-push og stanser kjøringen. Hver
checkpoint er en ny commit oppå den forrige, så vanlig push holder. `<dato>` er DAGENS dato: en WIP
som fortsettes fra en tidligere natt (og er rebaset), får en ny gren med ny dato i stedet for å
overskrive den gamle.

Da fortsetter neste kjøring (Jobb 1-0) fra siste runde i stedet for fra start.

**Vær sparsom - kvoten er delt.** Hele kjøringen deler én bruksgrense med alle andre økter. Balanser i simuleringen, ikke i nettleseren. Kjør selvspill-røyktesten og scene-auditen én gang per runde, rett før vurderingen. Les bare de bildene du trenger.

Er spillet fortsatt under terskel etter tredje runde (eller parkert fordi Gøy sto stille): IKKE åpne PR. Commit alt (smalt diff) og push til `claude/microgame-wip-<dato>-<id>`, og rapporter i Jobb 6 med scorene og hva som manglet - neste natt fortsetter derfra (Jobb 1-0).

---

## Jobb 5: Atomisk PR

```bash
git config user.email "pattidatti@gmail.com"
git config user.name "Eiriksbok Agent"
DATE=$(date +%Y%m%d)
BRANCH="claude/microgame-${DATE}-<id>"
git checkout -B "$BRANCH"
git add src/components/microgames/ "public/content/<sti>/<artikkel>.json" "public/images/microgames/<id>.webp" "docs/microgames/briefer/<id>.md"
git add docs/microgames/ideer.md 2>/dev/null   # bare hvis idéen kom fra køen
git status --short   # SJEKK: ingen andre filer
git commit -m "mikrospill: <tittel> (<artikkeltittel>)"

# Rett før push: ta med det som har kommet på main mens du jobbet.
git fetch origin main && git rebase origin/main
git diff --name-only origin/main...HEAD   # bare spillfiler, registry.ts, plakaten, briefen og én artikkel-JSON
git push -u origin "$BRANCH"
```

Ved push-feil (403 o.l.): stopp, rapporter i Jobb 6, ingen MCP-fallback.

PR-body SKAL inneholde markøren `eiriksbok-daily-microgame` (auto-merge-workflowen finner PR-en på den):

```bash
PR_URL=$(gh pr create --base main --head "$BRANCH" --title "mikrospill: <tittel> (<artikkeltittel>)" --body "$(cat <<EOF
Automatisk mikrospill fra \`eiriksbok-daily-microgame\`.

**Spill:** \`<id>\` - <sjanger>, tone <tone>, <2D/3D>
**Artikkel:** /<fag>/<emne>/<leksjon>
**Kunstretning:** <kunst>

$(cat docs/microgames/briefer/<id>.md)

## Uavhengig vurdering (runde <n>)
| Gøy | Utseende | Lærerikt | Lesbart | Unikt | Sum |
|---|---|---|---|---|---|
| x | x | x | x | x | xx |

<underagentens begrunnelser, kort>

## Selvspill
$(cat .screenshots/playtest/_playtest.md)

$(cat .screenshots/likhet/_likhet.md)
EOF
)")
echo "$PR_URL"
```

Auto-merge skjer av repo-workflowen når CI-sjekken «Mikrospill-audit» (scene-audit + selvspill + likhetsvakt) er grønn. Vent på den (sjekk hvert 2. minutt i maks 50 minutter):

```bash
PR=$(echo "$PR_URL" | grep -oE '[0-9]+$')
gh pr checks "$PR" 2>&1 | tail -5
gh pr view "$PR" --json state,mergedAt -q '.state + " " + (.mergedAt // "")'
```

Blir sjekken rød: les audit-kommentaren på PR-en. Funn i spillet: fiks, commit på branchen (`git commit --amend` er IKKE lov etter push - lag en ny commit), push, vent igjen (maks to runder). «Kunne ikke kjøre» (infrastruktur): kjør `gh run rerun <run-id> --failed` én gang. Er PR-en ikke merget når du avslutter, skriv hvorfor i rapporten.

---

## Jobb 6: Rapport på issue #12

```bash
gh issue comment 12 --repo pattidatti/eiriksbok --body "**Mikrospill $(date +%Y-%m-%d): <tittel>**

**Artikkel:** <artikkeltittel> (/<sti>)
**Sjanger / tone / 2D-3D / kunstretning:** <...>
**PR:** <url> - <MERGET | ÅPEN: grunn>
**Konseptturnering:** vinner «<tittel>» (Gøy x, Fag x) av fem; <artikler som ble forkastet, og hvorfor>
**Uavhengig vurdering:** Gøy x, Utseende x, Lærerikt x, Lesbart x, Unikt x (sum xx, runde n)
**Spillfølelse:** x valg/min, press x -> x, ferdighetstrapp taper x < middels x < vinner x
**Likhet:** nærmest <id> (x,xx)
**Selvspill:** <vinner-robot vant på x s, taper-roboter og knappemoser tapte, passiv tapte>

**Fagkjernen som regel:** <én setning>
**Hva som ble bedre etter vurderingen:** <kort>

👍 / 👎 fra eieren på denne kommentaren brukes til å kalibrere vurdereren."
```

Varianter: «ingen kandidat» (med de beste konseptene og poengene fra turneringen), «under terskel etter fem runder - fortsetter neste natt fra <gren>» (med scorene og forbedringene som ikke lot seg løse), «Playwright/push feilet». Rapporten skal alltid postes.
