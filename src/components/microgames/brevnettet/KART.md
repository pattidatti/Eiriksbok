# Brevnettet - kart

Hans Nielsen Hauge 1796-1814 som nettverksbygging i sanntid (Mini Metro-verbet med klippe-vri).
Brief: `docs/microgames/briefer/brevnettet.md`. Komponenten: `../Brevnettet3D.tsx`.
Fase: **gråboks** (primitive former, ingen kunst eller juice). Neste: kunst etter kunstbriefen.

## Filene

| Fil | Hva |
|---|---|
| `tuning.ts` | Alle tall: veven (`vev`), trådlengde (`tråd.maksLengde`), Hauge (`inne`, `utAvstand`), lensmannen (`førsteVarsel`, `klippHver`, `klippVarsel`, `klippSvak`), saltverket 1809, ringen (`snartFull`, `steiner`), poeng (`brevFart`, `brev`, `tentIMål`), `RANGER` |
| `levels.ts` | Brettene `BRETT` (ett per år): `sek`, `nøster` (inntekt), `startStuer`, `stueHver`, `lensFørst`/`lensHver`, `varsel`, `ringTid`, `spøkelse`, `fengsel`. Opptrappingen fra briefen punkt 11 |
| `net.ts` | Nettet: `Stue`, `Tråd`, `HAUGE = 0`, `iFare` (fagregelen: tent stue uten tråd til annen tent stue), `gruppe`, `tenteNaboer` |
| `game.ts` | Tilstanden `Game`, `newGame(seed)`, grepet `bind(g, a, b)` (eleven og robotene), `kanBinde`, `update(g, dt)`, `visÅr`, `framdrift`, `press`. Hendelser i `g.hendelser` (tømmes av komponenten/simuleringen) |
| `bots.ts` | `binder` (vinner), `halvgod` (middels: treg, ingen ekstra tråder), `bare-hauge` (taper: ignorerer fagkjernen), `tilfeldig` (knappemoser) |
| `sim.ts` | SimSpec + `snapshotOf`, `årsakTekst`, `spor(bot, seed)` til feilsøking |
| `view.ts` | Farger (`FARGE`, paletten fra kunstbriefen), `treff` (pekeren -> prikk), typene `Drag`/`Spøkelse` |
| `world.tsx` | 3D-visningen: `Vev`, `Stuer` (instanser + ringstolpe), `Garn` (tråder, brev, dra-tråd, spøkelsestråd), `Figurer` (Hauge, lensmannen), `Inndata` (usynlig flate), `Kamera` |
| `texts.ts` | Tap, tips, seier, lærings-øyeblikk (`ØYEBLIKK`), lapper (`LAPP`), «Dette skjedde» (`LÆRDOM`) |

## Kjerneløkka

`update` i `game.ts`: Hauge slippes ut -> saltverket (fengsel) -> nye stuer -> lensmannen rir/tar
Hauge (`arrest` river Hauges tråder og kaller `rakne`) -> klipp i fengselsårene (`klipp`) -> ringer
fylles (`ringer`, full ring = kljåstein) -> brev gir poeng (`brev`) -> neste brett. Seier: minst to
tente stuer når fengselsbrettet er slutt (`avslutt`).

## Fagregelen

`rakne` i `game.ts` (bruker `iFare` i `net.ts`): etter hver arrestasjon og hvert klipp rakner tente
stuer som ikke har tråd til en annen tent stue. Bare tråd fra Hauge tenner (`bind`).

## Knapper

- Garn: `nøster` per brett i `levels.ts` (mest følsomme tallet for balansen).
- Tempo: `stueHver`, `lensHver`, `varsel`, `ringTid` per brett.
- Fengselsårene: `klippHver`, `klippSvak` (hvor ofte lensmannen går etter svake tråder).

## Balanse

`npx tsx scripts/sim-microgame.mts --ids brevnettet`. Ett spor:
`npx tsx -e "import('./src/components/microgames/brevnettet/sim.ts').then(m => m.spor('binder', 3))"`

## Fallgruver

- `react-refresh/only-export-components` godtar ikke æøå i starten av komponentnavn-regexen -
  derfor heter trådkomponenten `Garn`. Konstanter og hjelpere bor i `view.ts`.
- Materialer som endres i `useFrame`, ligger på modulnivå (ellers `react-hooks/immutability`).
- Inndata: klikk på en prikk uten å dra = hold tråden, neste klikk fullfører (pekeplate).
