---
description: Kjør bildegenerering via Antigravity — genererer hero- og inline-bilder for artikler med placeholder.webp og committer resultatet.
---

Kjør følgende steg i rekkefølge:

## Steg 1: Skann etter brutte bildereferanser (Fase B)

```bash
cd /home/irik/eiriksbok && python3 -c "
import os, json, glob

broken = {}
for f in sorted(glob.glob('public/content/**/*.json', recursive=True)):
    try:
        data = json.load(open(f))
    except:
        continue
    def find_images(obj):
        paths = []
        if isinstance(obj, str) and obj.startswith('/images/') and 'placeholder' not in obj:
            paths.append(obj)
        elif isinstance(obj, dict):
            for v in obj.values(): paths.extend(find_images(v))
        elif isinstance(obj, list):
            for item in obj: paths.extend(find_images(item))
        return paths
    missing = [p for p in set(find_images(data)) if not os.path.exists('public' + p)]
    if missing:
        broken[f] = sorted(missing)

total = sum(len(v) for v in broken.values())
print(f'Fase B: {total} brutte referanser i {len(broken)} filer')
for f, imgs in sorted(broken.items()):
    for img in imgs:
        print(f'  {f.replace(\"public/content/\", \"\")} -> {img}')
"
```

## Steg 2: Skann etter placeholder.webp (Fase A)

```bash
cd /home/irik/eiriksbok && echo "Fase A: $(grep -rl 'placeholder.webp' public/content/ --include='*.json' | wc -l | tr -d ' ') filer med placeholder.webp" && grep -rl 'placeholder.webp' public/content/ --include='*.json' | sort | sed 's|public/content/||'
```

Rapporter funnene fra Fase B og Fase A til brukeren. Hvis begge fasene er tomme, avslutt og si at det ikke er noe å generere.

## Steg 3: Kall agy for generering

Kall bildegenererings-skriptet (dette bruker agy/Antigravity med Gemini Imagen):

```bash
bash /home/irik/scripts/agy-generate-images.sh
```

Vent til skriptet er ferdig.

## Steg 4: Rapporter resultatet

```bash
tail -20 /home/irik/logs/agy-generate-images.log
```

Rapporter: antall bilder generert (hvis noe ble committet vises commit-meldingen i loggen), eller hvorfor ingenting ble generert (kvote-feil, ingen endringer, osv.).
