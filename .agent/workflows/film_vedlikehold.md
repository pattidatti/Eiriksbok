---
description: Instruksen til rutinen eiriksbok-film-vedlikehold (mandager 05 UTC). Leser lærdommene filmrutina har meldt siste uke og retter verktøyene og guiden, så samme feil ikke meldes igjen og igjen.
---

Du er verktøymakeren for artikkelfilmene i Gravity Eiriksbok (https://bok.haaland.de/). Git-repoet
er sjekket ut i arbeidsmappen din. Filmrutina (`daily_film_routine.md`) lager fire filmer i døgnet
og melder hver gang en «Lærdom til guiden» på issue #12. Før denne rutina fantes, ble den samme
lærdommen meldt ti ganger på fire dager uten at noen rettet den. Din jobb er å rette dem.

## KRITISKE KRAV

1. **Ett smalt diff.** Du endrer verktøyene og guiden: `scripts/validate-film.mjs`,
   `scripts/shots-film.mjs`, `scripts/film-*.mjs`, `.agent/workflows/build_film.md`,
   `.agent/workflows/daily_film_routine.md`, de generelle visualene i `src/features/film/visuals/*.tsx`
   og `src/features/film/kart/`. Aldri en enkelt films manus eller egen visuals-mappe, aldri
   artikler, manifest eller lydskriptet.
2. **Ikke ødelegg eldre filmer.** Etter en endring i en generell visual eller i validatoren skal
   `node scripts/validate-film.mjs` (alle filmer) fortsatt være grønn, og du tar `shots-film` av
   minst to filmer som bruker visualen du endret.
3. **Lengden på filmene ligger fast** (eieren 2026-10-17). Ikke stram inn ordtall eller scenetall.
4. Norsk med ekte æ, ø, å. Aldri tankestrek eller em-dash.
5. Én commit, én PR, markør `eiriksbok-film-vedlikehold` i PR-body. Ingen destruktive git-kommandoer.

## Jobb 1: Samle lærdommene

```bash
gh api repos/{owner}/{repo}/issues/12/comments --paginate \
  --jq '.[] | select(.created_at > (now - 8*86400 | todate)) | select(.body | startswith("## Film")) | .body' \
  > /tmp/rapporter.md
grep -A3 "Lærdom til guiden" /tmp/rapporter.md
```

Grupper lærdommene: like lærdommer er én. Les `build_film.md` og fjern dem som allerede står der
eller allerede er rettet i koden (sjekk koden, ikke bare guiden).

## Jobb 2: Sorter

For hver lærdom, velg den sterkeste rettelsen som passer:

1. **Verktøyet kan hindre feilen** (validatoren kan stoppe den, `shots-film` kan finne den, en
   generell visual kan gjøre det riktige av seg selv). Gjør det. Det er alltid best.
2. **Feilen er en fallgruve i kode filmene skriver selv.** Legg den i §3c i `build_film.md`, kort
   og med løsningen.
3. **Lærdommen er feil, eller et enkelttilfelle.** Hopp over og si hvorfor i rapporten.

Se også etter mønstre i vurderingene: er én akse lav i mange rapporter, er det et tegn på at
guiden mangler noe.

## Jobb 3: Rett og prøv

Rett. Kjør:

```bash
node scripts/validate-film.mjs && npx tsc -b && npx eslint src/features/film scripts
npx vite --port 5173 --strictPort > /tmp/vite.log 2>&1 &
until curl -s localhost:5173 > /dev/null; do sleep 2; done
node scripts/shots-film.mjs <en film som bruker det du endret> --port 5173
```

(Playwright-oppsettet står i Jobb 0 i `daily_film_routine.md`.)

## Jobb 4: PR og rapport

PR med tittel `film-vedlikehold: <kort>` og body som lister hver lærdom og hva som ble gjort med
den (rettet i verktøy / lagt i guiden / hoppet over, og hvorfor). Markør `eiriksbok-film-vedlikehold`.

Rapport som kommentar på issue #12:

```
## Filmvedlikehold <dato>
- Lærdommer lest: <n> (etter sammenslåing: <n>)
- Rettet i verktøy: <liste>
- Lagt i guiden: <liste>
- Hoppet over: <liste med grunn>
- PR: #<nr>
```

Var det ingen nye lærdommer, skriv bare rapporten og avslutt uten PR.
