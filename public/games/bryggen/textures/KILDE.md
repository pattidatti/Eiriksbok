# Teksturer (PBR)

Alle fra Poly Haven, CC0 1.0. Hentet automatisk 02.10.2026 fra `api.polyhaven.com/files/<id>`,
1K JPG, gjort om til WebP med sharp (farge q80, normal q78-90, ARM q85). Ingen kreditering
kreves, men vi krediterer likevel.

Tre filer per sett:

- `_diff`: farge (sRGB)
- `_nor`: normalkart i OpenGL-format (`nor_gl`), riktig for Three.js
- `_arm`: R = ambient occlusion, G = ruhet, B = metall. Passer rett inn i Three sin
  `aoMap`/`roughnessMap`/`metalnessMap` (samme tekstur i alle tre)

| Fil | Poly Haven-id | Brukes til |
|---|---|---|
| `laft_*` | `wood_plank_wall` | Laftevegger (liggende stokker) |
| `bordvegg_*` | `weathered_planks` | Stående bordkledning på gavler og svalganger |
| `bordtak_*` | `old_planks_02` | Bordtak |
| `torv_*` | `sparse_grass` | Torvtak |
| `dekke_*` | `old_wood_floor` | Bryggedekket og kaia |
| `gardsrom_*` | `wood_planks_dirt` | Plankegangen i gårdsrommet |
| `gjorme_*` | `brown_mud_leaves_01` | Gjørme i smug og allmenninger |
| `raatre_*` | `rough_wood` | Stolper, bjelker, trapper, vinsj |
| `stein_*` | `rock_wall_08` | Ildstedet i schøtstua (hentet 02.10.2026, samme oppskrift) |

Filene er registrert i `scripts/image-ledger.json` slik at `optimize-images` ikke komprimerer
dem på nytt (normalkart tåler dårlig en ekstra lossy runde).

## Høydekart til relieffet (hentet 03.10.2026)

To høydekart (`Displacement`, 1K JPG, md5 sjekket mot `api.polyhaven.com/files/<id>`), gjort om til
gråtone-WebP (q85, `normalise`) med sharp. Brukes av relieffet i bakken (`motor/relieff.ts`) på full
kvalitet. CC0 1.0 som resten.

| Fil | Poly Haven-id | Brukes til |
|---|---|---|
| `gjorme_disp.webp` | `brown_mud_leaves_01` | Steinene og bladene i gjørma får dybde |
| `gardsrom_disp.webp` | `wood_planks_dirt` | Fugene mellom plankene i gårdsrommet |
