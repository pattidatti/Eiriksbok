# Brevnettet - kart

Hans Nielsen Hauge 1796-1814 som nettverksbygging i sanntid (Mini Metro-verbet med klippe-vri).
Brief: `docs/microgames/briefer/brevnettet.md`. Komponenten: `../Brevnettet3D.tsx`.
Fase: **forbedring 1** (raidklipp, 1804-klipp av enslige tråder, ringbonus, feel). Neste: ny vurdering.

## Filene

| Fil | Hva |
|---|---|
| `tuning.ts` | Alle tall: veven, `kantAndel` (nye stuer ute ved kanten), `nøsterTak` (knaggen rommer 8), trådlengde, Hauge, lensmannen (`førsteVarsel`, `nøsterPerStue`, `klippHver`, `klippVarsel`, `klippSpredning`), fengsel (`saltverk`, `nøsterPerÅr`), ringen, `RANGER` |
| `levels.ts` | Brettene `BRETT` (ett per år): `nøster`, `startStuer`, `stueHver`, `lensFørst`/`lensHver`, `varsel` (4-5 s ritt), `ringTid`, `spøkelse`, `fengsel` |
| `net.ts` | Nettet: `Stue`, `Tråd`, `HAUGE = 0`, `iFare` (fagregelen), `tenteNaboer` |
| `game.ts` | Tilstanden, `newGame`, grepet `bind` (også knyt om), `update`, `truet`, `visÅr`, `framdrift`, `press`. Hendelser i `g.hendelser` (`ryk` = en tråd røk, til visningen). `g.stat` til «Dette skjedde» |
| `bots.ts`, `sim.ts` | Robotene (`binder`, `halvgod`, `bare-hauge`, `tilfeldig`) og simuleringen |
| `view.ts` | Farger (`FARGE`), mål på veven og utsnittet (`VEV`), `FENGSEL`, `treff`, `sikreFarger` |
| `art.ts` | Figurene som trappetrinn: `pikselGeo` (tegn-rutenett -> klosser med vertex-farger), hus, rose, Hauge, rytter. Teksturer: veven (farge + normalkart), glød, brev, garn, tømmer |
| `ressurser.ts` | Alle geometrier og materialer, laget én gang (`ressurser()`), `settLysmåler` |
| `trappeskrift.ts` | 5 x 7-skriften (årstall, logo, HUD-tall): `tegnTrapp`, `tegnTrappLerret` |
| `fx.ts` | Juice uten regler: trådender som pisker (`brekk`), fnugg (`strø`), risting, flakking, morgensol. `stegFx` i ekte tid |
| `world.tsx` | `Vev`, `AnnoSkilt` (crispCanvas i øvre bord), `Rekordstrek`, `Lys` (talglys, hemisfære, morgensol), `Inndata`, `Kamera` (tilpasser avstanden til vinduet) |
| `stuer.tsx` | Stuene: mørk/tent/truet/raknet, rose, glød, ventering (rhombe + folk), fare-ring |
| `garn.tsx` | Trådene (12 ledd per kjedelinje, instanser), brev, dra-tråd, spøkelsestråd, `Fnugg` |
| `figurer.tsx` | Hauge, lensmannen med stiplet sti, fengselet under veven |
| `hud.tsx` | `Hud` (år mot 1814, knagg med nøster, tente stuer, kljåsteiner) og `TrappLogo` |
| `texts.ts` | Tap, tips, seier, `ØYEBLIKK`, `LAPP`, `LÆRDOM`, `lærdomFra(g)` |

## Kjerneløkka

`update` i `game.ts`: Hauge slippes ut -> saltverket -> nye stuer to og to ute ved kanten (den ene
på lensmannens side) -> lensmannen rir (`arrest`) -> klipp i fengselsårene -> ringer -> brev ->
stue-år (og ett nøste per fengselsår) -> neste brett. Seier: minst to tente stuer i 1814.

## Fagregelen

`rakne` i `game.ts` (bruker `iFare`): etter hver arrestasjon og hvert klipp rakner tente stuer uten
tråd til en annen tent stue. Bare tråd fra Hauge tenner (`bind`).

Lensmannen kutter (`merkVerste`, `merkAlleSvake`, `kuttTikk`): fra 1799 merker han i hvert raid
tråden som bærer mest (rød mens han rir, ryker når han tar Hauge). I 1804 merker han ALLE tråder
som en stue henger på alene (hendelsen `stor`), så bare ringer står. Etter et raid gir hver tent
stue et nøste (maks `nøsterMaks`) og hver stue i ring (`ringStuer`, to tente naboer) ett til
(`nøsterPerRing`). Det er det som gjør ringer lønnsomme og trappen bratt.

## Knapper

- Garn: `nøster` per brett, `nøsterTak`, `nøsterPerStue`/`nøsterMaks`, `nøsterPerRing`, `fengsel.nøsterPerÅr` (0).
- Klipp: `raidKlippFra` (brett 3 = 1799), `fengsel.storeKlipp`, 1804-rittet (`varsel` 6 i `levels.ts`).
- Tempo: `stueHver`, `lensHver`, `varsel`, `ringTid` per brett.
- Fengselsårene: `klippHver` og `klippSpredning` (middels svarer på røde tråder, men går tom for garn).

## Balanse

`npx tsx scripts/sim-microgame.mts --ids brevnettet`. Ett spor:
`npx tsx -e "import('./src/components/microgames/brevnettet/sim.ts').then(m => m.spor('binder', 3))"`

## Fallgruver

- Komponentnavn kan ikke starte med æøå (`react-refresh`): derfor `Garn` og `AnnoSkilt`.
- Mutér aldri `fx`, ressurser eller spilltilstand i en komponent: bruk funksjonene i `fx.ts`
  og `ressurser.ts` (`react-hooks/immutability`).
- `[data-mg-stage] canvas` er absolutt plassert i skallet: HUD-lerreter trenger `position: static`.
- Instansfarger settes fra første bilde (`sikreFarger`), ellers kompileres shaderen på nytt.
- Inndata: klikk på en prikk uten å dra = hold tråden, neste klikk fullfører (pekeplate).
