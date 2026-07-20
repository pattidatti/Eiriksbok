# Geometri-audit: 3D-mikrospill — 2026-07-20

Full visuell revisjon av alle registrerte 3D-mikrospill for geometri- og
plasseringsfeil (master feil vei, båt på land, svevende/begravd geometri, blokkerte
motiv, gal skala).

**Metode:** `scripts/audit-microgames.mjs` rendret hvert `/mikrospill/<id>` headless
(1366×768) og tok flere skjermbilder over auto-rotasjonen. 10 parallelle
vurderings-agenter leste skjermbildene og bedømte hver scene mot en fast rubrikk.

## Sammendrag

| | Antall |
|---|---|
| Spill vurdert | 132 |
| **BROKEN (åpenbar geometri-feil)** | **0** |
| **SUSPECT (usikkert, se nærmere)** | **0** |
| MINOR (skjønnhet/framing) | ~19 |
| OK (ren) | resten |
| 2D-spill (ingen 3D-scene, n/a) | 1 (`gladius-duell`) |

**Hovedfunn: ingen av de reelle geometri-feilklassene du beskrev finnes lenger i
biblioteket.** Ingen båt på land, ingen feilvendte master/seil, ingenting som svever
eller er begravd, ingen hovedmotiv blokkert. De feilene som fantes ble fikset denne
økta; ingen andre spill hadde tilsvarende feil.

## Fikset denne økta (var reelle feil)

| Spill | Feil | Status |
|---|---|---|
| `hansakoggen-3d` | Seilet hang 90° feil (på tvers av sin egen rå) | ✅ fikset + verifisert |
| `fimreite-1184` | To åser blokkerte fjorden/båtene | ✅ fikset + verifisert |
| `leiegaarden-3d` | **Krasjet totalt** ved lasting (`useShake` utenfor Canvas) | ✅ fikset + verifisert |
| `samsara-syklusen` | Ugyldig hex-farge (`#3020608`) | ✅ fikset |
| `bronseruta-3d` | Duplikate React-keys (konsoll-varsel) | ✅ fikset |

## MINOR — valgfri polering (ingen krever fiks)

Gruppert etter type. Alt lesbart og oppreist; dette er skjønnhets-/framing-noter.

**Steg-0-framing (skjermbilde tatt før elementer dras inn — ser tomt ut):**
- `falanksen-3d`, `persepolis-gaver-3d`, `pyramidebyggeren-3d`, `vikingskip-3d`,
  `gresk-teater-3d` — nesten tom scene før spillet starter. Vurder en rikere
  start-tilstand eller en mer innrammet startvinkel.

**Komposisjon/lesbarhet:**
- `colosseum-3d` — øverste bue-elementer stikker opp som et «kurvhåndtak» (trolig
  etasje under montering)
- `smitten-i-byen-3d` — stor flat brun slab foran dominerer litt
- `teodosianmuren` — tett innzoomet; bakgrunns-terreng virker litt frakoblet
- `hundreaarskrigen-3d` — by-etiketter klumper seg oppå hverandre
- `laasesting-3d` — symaskinens topp kuttes litt av banneret
- `republikkens-soyler-3d` — taket er en uvanlig langstrakt trekant-kile
- `samisk-gjenreising-3d` — tynn flaggstang stikker malplassert opp
- `kapplopet-om-afrika-3d` — flat flate leser ikke tydelig som Afrika

**«Kart/rute leser som vann» (geografisk forvirring, ikke feil):**
- `karavanen-over-sahara-3d` — blå handelsrute gjennom ørkenen leser som elv
- `kristendom-spredning` — kontinent-blobber svever litt løsrevet over nattkloden

**Bevisst mørk/abstrakt iscenesettelse (tematisk riktig, lav kontrast):**
- `ingenmannsland-mg`, `stalmonsteret-3d` (WWI-skyttergrav, natt)
- `demokrati-lysene-3d` (lysene ligner litt stekte egg)
- `ansiktene-i-mengden-3d` (svevende diamant-symbol — trolig tilsiktet)

## Tverrgående funn (utenfor geometri-mandatet)

Flere agenter merket **ødelagte norske tegn** i UI-tekst — «aa/oe/paa» i stedet for
«å/ø» — på tvers av flere spill (bl.a. `sjoimperiet-3d`). Dette er en reell
innholdsfeil, men ikke geometri. Anbefaling: en egen tegn-vask (grep etter `aa`/`oe`
i `src/components/microgames/*.tsx`) som separat oppgave.

## Anbefaling

- **Ingen geometri-fikser er nødvendige.** Feilklassene du rapporterte er løst, og
  resten av biblioteket er rent.
- Det permanente vernet er nå på plass: korrekt-av-konstruksjon kit (`Boat`-konvensjon,
  `Seascape`, DEV-vakthund), skjerpet `build_microgame.md`, og denne audit-harnessen
  (`npm run audit:microgames`) som kan kjøres jevnlig — gjerne som ukentlig rutine, og
  en lett variant som gate på natt-PR-ene.
- Valgfritt: poler et par av de øverste MINOR-punktene og kjør tegn-vasken.
