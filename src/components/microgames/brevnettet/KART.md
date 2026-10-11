# Brevnettet - kart

Hans Nielsen Hauge 1796-1814 som nettverksbygging i sanntid (Mini Metro-verbet med klippe-vri).
Brief: `docs/microgames/briefer/brevnettet.md`. Komponenten: `../Brevnettet3D.tsx`.
Fase: **gråboks etter diagnose 1** (primitive former, ingen kunst eller juice). Neste: kunst etter kunstbriefen.

## Filene

| Fil | Hva |
|---|---|
| `tuning.ts` | Alle tall: veven (`vev`), trådlengde (`tråd.maksLengde`), Hauge (`inne`, `utAvstand`), lensmannen (`førsteVarsel`, `nøsterPerStue`, `nøsterMaks`, `klippHver`, `klippVarsel`, `klippSpredning`), saltverket 1809, ringen (`snartFull`, `steiner`), `brevFart` (bare pynt), `RANGER` |
| `levels.ts` | Brettene `BRETT` (ett per år): `sek`, `nøster` (startgarn, resten kommer fra raid), `startStuer`, `stueHver` (per par), `lensFørst`/`lensHver`, `varsel` (3-4 s ritt), `ringTid`, `spøkelse`, `fengsel`. Opptrappingen fra briefen punkt 11 |
| `net.ts` | Nettet: `Stue`, `Tråd`, `HAUGE = 0`, `iFare` (fagregelen: tent stue uten tråd til annen tent stue), `tenteNaboer` |
| `game.ts` | Tilstanden `Game`, `newGame(seed)`, grepet `bind(g, a, b)` (eleven og robotene; på en rødmerket tråd = knyt om), `kanBinde`, `update(g, dt)`, `truet` (stuer som rakner ved neste raid/klipp - visningen lar dem synke og blinke), `visÅr`, `framdrift`, `press`. Hendelser i `g.hendelser` (tømmes av komponenten/simuleringen) |
| `bots.ts` | `binder` (vinner), `halvgod` (middels: treg, ingen ekstra tråder), `bare-hauge` (taper: ignorerer fagkjernen), `tilfeldig` (knappemoser) |
| `sim.ts` | SimSpec + `snapshotOf`, `årsakTekst`, `spor(bot, seed)` til feilsøking |
| `view.ts` | Farger (`FARGE`, paletten fra kunstbriefen), `treff` (pekeren -> prikk), typene `Drag`/`Spøkelse` |
| `world.tsx` | 3D-visningen: `Vev`, `Stuer` (mørk = lav og grå med krympende ring, tent = høy og gul, truet = synker og blinker), `Garn` (tråder, brev bare mellom tente stuer, dra-tråd, pulserende spøkelsestråd), `Figurer` (Hauge, lensmannen som venter ved kanten og rir langs en rød sti), `Inndata` (usynlig flate), `Kamera` |
| `texts.ts` | Tap, tips, seier, lærings-øyeblikk (`ØYEBLIKK`), lapper (`LAPP`), «Dette skjedde» (`LÆRDOM`) |

## Kjerneløkka

`update` i `game.ts`: Hauge slippes ut -> saltverket (fengsel) -> nye stuer to og to, én på hver
halvdel -> lensmannen rir/tar Hauge (`arrest` river Hauges tråder, kaller `rakne` og gir ett nøste
per stue som fortsatt lyser, maks `nøsterMaks`) -> klipp i fengselsårene (`klipp`: alltid tråden
som får flest stuer til å rakne, rød i `klippVarsel` s) -> ringer fylles (`ringer`, full ring =
kljåstein) -> brevene glir (`brev`, pynt) -> stue-år (poeng: tente stuer per nytt år) -> neste
brett. Seier: minst to tente stuer når fengselsbrettet er slutt (`avslutt`).

HUD-en viser tente stuer (stort), nøster og «x av 3 stuer ga opp». Poengene (stue-år) vises bare
på sluttskjermen.

## Fagregelen

`rakne` i `game.ts` (bruker `iFare` i `net.ts`): etter hver arrestasjon og hvert klipp rakner tente
stuer som ikke har tråd til en annen tent stue. Bare tråd fra Hauge tenner (`bind`).

## Knapper

- Garn: `nøster` per brett i `levels.ts` (mest følsomme tallet for balansen).
- Tempo: `stueHver`, `lensHver`, `varsel`, `ringTid` per brett.
- Fengselsårene: `klippHver` og `klippSpredning`. Middels-roboten havner nær terskelen (to stuer)
  her, så små endringer vipper seieren hans fra 0 til 100 %. Endre i steg på 0,05 s.
- Inntekt: `nøsterPerStue`/`nøsterMaks` (per raid).

## Balanse

`npx tsx scripts/sim-microgame.mts --ids brevnettet`. Ett spor:
`npx tsx -e "import('./src/components/microgames/brevnettet/sim.ts').then(m => m.spor('binder', 3))"`

## Fallgruver

- `react-refresh/only-export-components` godtar ikke æøå i starten av komponentnavn-regexen -
  derfor heter trådkomponenten `Garn`. Konstanter og hjelpere bor i `view.ts`.
- Materialer som endres i `useFrame`, ligger på modulnivå (ellers `react-hooks/immutability`).
- Inndata: klikk på en prikk uten å dra = hold tråden, neste klikk fullfører (pekeplate).
