---
name: oppgrader-religion-artikkel
description: Finn og oppgrader én placeholder-religionsartikkel i KRLE verdensreligioner til plan_article-standard (signaturkomponent + rikt innhold + kilder). Scanner public/content/krle/religion/, identifiserer artikler som mangler interaktive komponenter, lar brukeren velge blant 4 kandidater fra ulike religioner, og kjører /plan_article automatisk på den valgte. Valgfritt argument: religion-navn for å begrense søket (f.eks. "islam", "buddhisme").
---

# Oppgrader Religionsartikkel

Workflow for å systematisk løfte placeholder-artikler i KRLE verdensreligioner til
full plan_article-standard. Kjøres **én artikkel om gangen**.

Arbeidslista og statusoversikten for hele prosjektet ligger i `docs/KRLE_OPPRUSTNING.md`.
Les den før første kjøring — den definerer hva «ferdig» betyr og i hvilken rekkefølge
artiklene skal tas.

## Steg 1: Skann placeholder-artikler

Kjør dette Python-skriptet fra repo-roten:

```bash
python3 << 'EOF'
import json, os, re, sys

ARGS = sys.argv[1:] if len(sys.argv) > 1 else []
FILTER_RELIGION = ARGS[0].lower() if ARGS else None

# Komponenter som IKKE teller som signaturkomponent
SIG_IGNORE = {'Quiz', 'FactBox', 'QuoteBlock', 'TimelineComponent', 'MicroGame',
              'Gallery', 'MapCarousel', 'LinkButton', 'Comparison', 'WritingFix',
              'Oppgaver', 'Kildeliste', 'Image'}

base = 'public/content/krle/religion/'
results = []

def count_words(content):
    n = 0
    for b in content:
        if not isinstance(b, dict):
            continue
        if b.get('type') == 'text':
            n += len(re.split(r'\s+', str(b.get('content') or '').strip() or ''))
        elif b.get('type') == 'list':
            for i in (b.get('items') or []):
                n += len(re.split(r'\s+', str(i).strip() or ''))
    return n

for root, dirs, files in os.walk(base):
    for f in files:
        if not f.endswith('.json'):
            continue
        path = os.path.join(root, f)
        try:
            with open(path, encoding='utf-8') as fp:
                d = json.load(fp)
        except Exception as e:
            print(f'PARSE-FEIL {path}: {e}', file=sys.stderr)
            continue
        if not isinstance(d, dict):
            continue

        # Fallback til mappenavnet: public/content/krle/religion/<religion>/...
        parts = path.split(os.sep)
        religion = d.get('religion') or (parts[4] if len(parts) > 4 else '?')
        if FILTER_RELIGION and religion.lower() != FILTER_RELIGION:
            continue

        # ØDELAGT SKJEMA: mangler content helt, eller har blokker uten "type".
        # Disse renderer tomt eller feil og har høyeste prioritet.
        content = d.get('content')
        if not isinstance(content, list):
            results.append(dict(path=path, religion=religion, title=d.get('title', f),
                                id=d.get('id', f[:-5]), blocks=0, words=0, has_sig=False,
                                has_oppg=False, has_kilde=False,
                                broken=True, score=1000))
            continue
        if any(isinstance(b, dict) and b.get('type') is None for b in content):
            results.append(dict(path=path, religion=religion, title=d.get('title', f),
                                id=d.get('id', f[:-5]), blocks=len(content),
                                words=count_words(content), has_sig=False,
                                has_oppg=False, has_kilde=False, broken=True, score=900))
            continue

        names = [b.get('name') for b in content
                 if isinstance(b, dict) and b.get('type') == 'component']
        has_sig = any(n and n not in SIG_IGNORE for n in names)
        has_oppg = 'Oppgaver' in names
        has_kilde = 'Kildeliste' in names
        words = count_words(content)

        # FERDIG = signaturkomponent + hale + nok tekst.
        # Mikrospill teller IKKE: per-religion-artikler skal ikke ha det.
        # Se docs/KRLE_OPPRUSTNING.md §2.1.
        if has_sig and has_oppg and has_kilde and words >= 800:
            continue

        score = ((3 if not has_sig else 0)
                 + (1 if not has_oppg else 0)
                 + (1 if not has_kilde else 0)
                 + max(0, (800 - words) // 100))

        results.append(dict(path=path, religion=religion, title=d.get('title', d.get('id', f)),
                            id=d.get('id', f[:-5]), blocks=len(content), words=words,
                            has_sig=has_sig, has_oppg=has_oppg,
                            has_kilde=has_kilde, broken=False, score=score))

# Prioriter intro/sentrale-trekk per religion over andre, men aldri over ødelagte filer
PRIORITY_KEYWORDS = ['intro', 'sentrale', 'introduksjon', 'grunnlegger']
broken, priority_first, rest = [], [], []
seen_religions = set()

for r in sorted(results, key=lambda x: -x['score']):
    if r['broken']:
        broken.append(r)
        continue
    is_key = any(kw in r['id'].lower() or kw in r['title'].lower() for kw in PRIORITY_KEYWORDS)
    if is_key and r['religion'] not in seen_religions:
        priority_first.append(r)
        seen_religions.add(r['religion'])
    else:
        rest.append(r)

ordered = broken + priority_first + rest

print(f'# {len(results)} kandidater ({len(broken)} med ødelagt skjema)')
print('STATUS|RELIGION|TITLE|WORDS|BLOCKS|MANGLER|ID|PATH')
for r in ordered[:20]:
    if r['broken']:
        status = 'BROKEN'
    elif not r['has_sig']:
        status = 'EMPTY'
    else:
        status = 'PARTIAL'
    mangler = ','.join(k for k, v in (('sig', r['has_sig']),
                                      ('oppg', r['has_oppg']), ('kilde', r['has_kilde']))
                       if not v) or '-'
    print(f"{status}|{r['religion']}|{r['title']}|{r['words']}|{r['blocks']}|{mangler}|{r['id']}|{r['path']}")
EOF
```

Statuskodene:

| Status | Betydning |
|---|---|
| `BROKEN` | Renderer tomt eller feil — mangler `content`, eller har blokker uten `type`. Fiks skjemaet før innholdet. |
| `EMPTY` | Ingen signaturkomponent |
| `PARTIAL` | Har signaturkomponent, men mangler `Oppgaver`, `Kildeliste` eller ordtall |

## Steg 2: Velg kandidat

Parse output-linjene. Velg de **4 øverste kandidatene** — de er allerede sortert slik at
ødelagte filer kommer først, deretter intro/sentrale-trekk-artikler fra ulike religioner.

Bruk **AskUserQuestion** med fire valg formatert slik:
- `label`: `[Religion]: [Tittel]`
- `description`: `[N] ord · [M] blokker · mangler [liste]`

Eksempel:
```
label: "Bahá'í: Introduksjon"
description: "0 ord · ødelagt skjema (renderer tomt) · mangler sig, oppg, kilde"

label: "Islam: Sentrale trekk i Islam"
description: "100 ord · 6 blokker · mangler sig, oppg, kilde"
```

## Steg 3: Kjør plan_article

Når brukeren har valgt en artikkel:

1. Les artikkelfilen (path fra skannen) for å forstå eksisterende innhold og KRLE-felt
   (`religion`, `dimension`, `comparison_tags`).
2. Er statusen `BROKEN`, fiks skjemaet først — konverter `ingress`/`body` til en flat
   `content`-array, eller bytt `name` til `type` på blokkene som mangler det.
3. Invokér `plan_article` via Skill-toolet med KRLE-kravene bakt inn i args.

**Merk om mikrospill:** `plan_article` §4 krever normalt et 3D-mikrospill i tillegg til
signaturkomponenten, og sier «I tvil - lag det». Det gjelder **ikke** her. Per-religion-artikler
i KRLE får signaturkomponenten alene; de romlige spillene bygges i sammenligningsemnet.
Begrunnelsen står i `docs/KRLE_OPPRUSTNING.md` §2.1.

```
Skill({
  skill: "plan_article",
  args: "[religion] [artikkel-tittel] — KRLE-krav: (1) Bevar feltene religion/dimension/comparison_tags — disse driver sammenligningssystemet på /krle/sammenlign/tema/:tag. (2) Tone objektiv og respektfull ('Muslimer tror...', 'Buddhister mener...'), aldri normativ, og nevn indre mangfold minst ett sted ('mange hinduer...', ikke 'hinduer...'). (3) Signaturkomponenten MÅ være ny og spesialtilpasset denne artikkelen — aldri gjenbruk av eksisterende komponent. (4) IKKE lag mikrospill - per-religion-artikler skal ha signaturkomponenten alene, se docs/KRLE_OPPRUSTNING.md §2.1. (5) Mål 900-1200 ord, tilgjengelig for 14-åringer. (6) Fast hale: Oppgaver → Quiz → Kildeliste som de tre siste blokkene. Referanse-mal: public/content/krle/religion/sikhisme/overgangsriter.json"
})
```

**Referanse-malen er `public/content/krle/religion/sikhisme/overgangsriter.json`** — 40 blokker,
1304 ord, egen signaturkomponent (`SikhNavneseremoni`), mikrospill (`anand-karaj-3d`) og komplett
hale. Bruk ikke `kristendom/intro` som mal; den er eldre og mangler `Oppgaver`, `Kildeliste` og
inline-bilder.

## Steg 4: Verifiser (obligatorisk)

Etter mønster fra `.claude/commands/oppgrader_km.md`. Ikke meld artikkelen ferdig før alt er grønt:

1. `npx tsc -b` og `npm run lint` — begge rene
2. `npm run dev`, last artikkelen, **0 konsollfeil**
3. Sjekk signaturkomponenten på **1366×768** — ingen intern scrolling, ingenting avkuttet
4. Kjør `npm run scan:content` og rydd opp i eventuell churn
5. Verifiser at `public/data/comparison-manifest.json` fortsatt har artikkelen på riktig tema

Til slutt: kryss av artikkelen i tabellen i `docs/KRLE_OPPRUSTNING.md` §6, og før den inn i
loggen i §9.

Ikke commit uten at brukeren ber om det.

## Argument-støtte

Hvis brukeren kjørte skillen med et argument (f.eks. `/oppgrader-religion-artikkel islam`):
- Send religion-navnet til Python-skriptet som filter
- Hopp direkte til steg 2 med kun artikler fra den religionen
- Presenter de 4 beste kandidatene for den valgte religionen
