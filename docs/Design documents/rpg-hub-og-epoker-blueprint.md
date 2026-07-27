# Blueprint: Hub, epoker og flerspiller i rollespillet

**Status:** Forslag (ikke godkjent). Utviklet i samtale 2026-07-26.
**Rute:** `/oving/rpg`
**Forhold til Nordvik-blueprinten:** utvider den. Se §13.
**Gjelder:** `src/features/rpg/`

---

## 0. Harde rammer

Arves uendret fra `minnevokteren-nordvik-blueprint.md`:

- **Ingen nye grafikk- eller lydfiler.** Alt tegnes prosedyralt i `spriteforge.ts` /
  `tileforge.ts` og syntetiseres i `audio.ts`.
- **Chromebook-first.** 1366x768 er referanseskjermen.
- **Ingen lenker ut av spillet under en handling.**

Nytt:

- **Epokene er enspiller. Hubben er flerspiller.** Ingen nettverkskode kommer noen gang
  inn i en epoke. Se §4.1.
- **Ingen fritekst-chat.** Se §4.4.

---

## 1. Hvorfor dette gjøres før kapittel 1

Tre funn fra kodegjennomgangen avgjorde rekkefølgen.

**1. Kapittel 1 krever stedbytte, og det finnes ikke.** Torstein seiler fra Nordvik til
Lindisfarne. Det er to kart. Dagens kode kan ikke bytte kart i det hele tatt:

| Sted | Hva som er låst |
|---|---|
| `engine/WorldScene.ts:212` | Scenen heter bokstavelig talt `'nordvik'` |
| `engine/boot.ts:44` | `game.scene.start('nordvik', { quester })`, hardkodet |
| `engine/WorldScene.ts:219-247` | `create()` leser `ZONE_BY_ID.nordvik.tema` og kaller `byggNordvik()` uten parameter |
| `engine/WorldScene.ts:13,463,1570` | Importerer `NORDVIK_SPAWN` fast |
| `engine/WorldScene.ts:594,640` | `byggNpcer`/`byggLandemerker` itererer `NORDVIK_NPCS`/`NORDVIK_LANDMARKS` direkte |
| `engine/quests.ts:79` | `zones.find(z => z.id === 'nordvik')` |
| `store/useRpgStore.ts:96` | `sisteSone` settes til `'nordvik'` og leses aldri. Dødt felt. |
| `engine/worldgen.ts:46-279` | Ett kart, magiske koordinater, ingen JSON og ingen editor |

Stedskiftet må altså bygges uansett. Hubben får det gratis.

**2. Prosjektilsystemet finnes allerede, men angrepet er hardkodet nærkamp.**
`Prosjektil`-interfacet (`WorldScene.ts:83-92`), `oppdaterProsjektiler()` (`:2066-2123`)
med terreng- og treffkollisjon, `piercing` og `fraFiende`. Fiender skyter alt
(`EnemyDef.skytende`, `types.ts:200`, brukt i `:1900-1917`), og besvergelser skyter
(`:1602-1618`). Det eneste som mangler for bue, og senere gevær, er at `slaa()`
(`:1157-1267`) alltid gjør sving-tween og sirkelsektor-treff.

Konsekvens: gjør angrep til data **før** du legger til flere våpen, ellers får du en
tredje parallell if-kjede ved siden av `slaa()` og `manover()` (`:1274-1320`).

**3. Kampsystemet har ubrukte kroker som peker riktig vei.**
`Kamp.vurderTreff()` tar imot `ublokkerbart` og `hak` (`engine/kamp.ts:250-252`), men
`fiendeSlaar()` sender ingen av dem (`WorldScene.ts:1922-1929`). `VaapenKamp.iRekke`
(`types.ts:131`) leses ingen steder. Berserkerangrep, øksehak og skjoldborg er
spesifisert i Nordvik-blueprinten, halvveis forberedt i typene, og ikke koblet.

### 1.1 Den ene virkelige gjelden

`WorldScene.ts` er 2409 linjer og blander terrengbygging, kollisjon, input,
spillerlogikk, kampgeometri, fiende-AI, prosjektiler, loot, dialog-triggere,
boss-tilstand, atmosfære, partikkelpool og dybdesortering. Alt i denne blueprinten går
gjennom den fila.

Sikkerhetsnettet finnes: `scripts/verify-rpg-kamp.mjs` og `scripts/verify-rpg-drap.mjs`
driver kampen i ekte nettleser og leser `aria-valuenow` fra HUD-stolpene.

> **Ikke fjern `aria-valuenow` fra `Stolpe` i `components/Hud.tsx:227`.** Det er
> verifikasjonsskriptenes eneste inngang.

---

## 2. Begrepene

Fire nivåer, klart adskilt. Skillet må ligge i typene, ikke i hodet til den som koder.

| Begrep | Hva det er | Eksempler |
|---|---|---|
| **Sted** | Ett kart. Har tema, kartbygger, NPC-er, landemerker, spawnpunkt, regelsett. | `hub`, `nordvik-793`, `lindisfarne`, `nordvik-872` |
| **Kapittel** | En spillbar bue i en epoke. Eier hvilke steder som finnes, og `verden: { fjern, legg, endre }`. | 793, 872, 995, 1030, 1066 |
| **Epoke** | Innholdsmodul med eget regelsett og egne kapitler. Én portal i hubben. | `vikingtiden`, `forste-verdenskrig`, `voc` |
| **Regelsett** | Verb-kontrakten for en epoke. | skjold + pust vs. dekning + nerve |

`ZoneDef` i `data/zones.ts` ble `EpokeDef` i `data/epoker.ts` (R4). Merk at de elleve sonene allerede har
fulle 10-farges paletter, og at `scripts/generate-quest-bank.mjs` sorterer spørsmål inn i
dem etter årstall (`ZONE_RULES`, `zoneByYear`). **Epokelisten finnes nesten ferdig som
utkast.** Den er ikke et løfte, se §12.

---

## 3. Hubben

### 3.1 Formen

Hubben er en tidslinje du går på. En vei eller en elv renner gjennom hele kartet, og
portalene ligger langs den i kronologisk rekkefølge med avstand proporsjonal med tid
(komprimert der spennet blir for stort).

> **Rettet etter R7.** Denne paragrafen sa opprinnelig «log-skalert». Log ble bygget,
> målt og forkastet - den gjorde avstandene like og gjorde veien til en liste. Bygget er
> kvadratrota av «hvor lenge siden». Se statusnotatet under §10.

Da lærer eleven kronologi med føttene. «Vikingtiden ligger nærmere Stiklestad enn
steinalderen ligger vikingtiden» blir en kroppslig erfaring i stedet for et tall på en
akse.

### 3.2 Tre roller, i denne rekkefølgen

1. **Navigasjon** fra dag én. Portalene er inngangene til epokene.
2. **Sosialt rom** når §4 er bygget.
3. **Trofehall** etter hvert som epokene fylles: det eleven har tatt med seg hjem
   ligger her, synlig.

### 3.3 Fiksjonen

Minnevokteren-rammen overlever her. Den ble kuttet i Nordvik-blueprinten (§1, §15) fordi
den la et lag fiksjon mellom eleven og fagstoffet **inne i** en epoke. Utenfor epoken
koster den ingenting, og hubben trenger en grunn til å eksistere. Navnet beholdes.

### 3.4 Det tomme rommet

Et åpent rom klokka 22 en søndag har én elev i seg. Hubben må være god alene, ellers
leser flerspilleren som en ødelagt funksjon.

- Bålet skal være verdt å sitte ved uansett.
- **Spor.** Hubben bærer merker etter dem som var der før: fotavtrykk, en stein lagt på
  en varde, teller på hver portal. Asynkront, nesten gratis, og stedet føles aldri dødt.

---

## 4. Flerspiller

### 4.1 Regelen

> **Hubben er sammen. Epokene er alene.**

Dette er ikke en nedskalering, det er riktig design. Nordvik-blueprintens sterkeste
øyeblikk (§3, andre halvdel av Lindisfarne, der spillet slutter å juble og musikken
faller til én tone) kollapser med en klassekamerat i rommet som spammer emotes. Det
samme gjelder mellomspillene: kildekritikk krever at eleven er alene med sitt eget valg.

Konsekvens for arkitekturen: **epokene trenger aldri nettverkskode.** Det er en enorm
forenkling, og den skal forsvares.

### 4.2 Teknisk grunnlag

Repoet har en fungerende Firebase RTDB-stack. Riktig mønster å kopiere er **ikke** quiz
battle, men `src/features/music/components/composition/useRealtimeComposition.ts` (526
linjer): delt dokument, egen presence-node med `onDisconnect()`-opprydding (`:85`), og
granulære path-oppdateringer via `basePath` (`:123`).

| Fil | Hva vi bruker |
|---|---|
| `src/lib/firebase.ts` | `db` (RTDB, europe-west1) |
| `src/hooks/usePresence.ts` | Anonym persistent id i `localStorage['gravity_anon_id']`, `onDisconnect().remove()` |
| `useRealtimeComposition.ts` | Presence-node + granulære path-oppdateringer |
| `database.rules.json` | Ny node `rpg-hub`. **Må skrives med regler, ikke åpen r/w som `rooms`.** |
| `engine/bridge.ts:9-58` | Typede emittere scene↔React. Naturlig sted å hekte transporten på. |

**Budsjett:** posisjon på ~10 Hz per spiller, interpolert i Phaser. Rom på 20-30. RTDB
tåler det. RTDB tåler **ikke** 60 Hz kampsynk, og vi trenger det ikke, jf. §4.1.

### 4.3 Rom-modellen

Åpne rom som auto-fylles. Alle som er inne havner i samme rom til det er fullt, så
åpnes et nytt. Ingen kode, ingen lobby, ingen venting.

### 4.4 Navn og trygghet

Eleven velger og viser sitt eget navn. `CharacterCreator` beholder fritekstfeltet.

Fordi rommene er åpne og elevene ikke har konto, legges det inn en **navnevakt**:

- Norske bokstaver, mellomrom og bindestrek. 2-16 tegn.
- Blokkliste.
- Ingen URL-er, ingen tallspam.
- Lokal **skjul-knapp** på andre spillere. Skjuler figur og navn for den som trykker,
  lagres lokalt.

**Ingen fritekst-chat.** Emoji-hjul og faste fraser. Fritekst mellom mindreårige uten
konto og uten moderasjon er ikke noe dette produktet skal ha.

Navnet ligger i presence-noden og fjernes av `onDisconnect()`. Ingenting lagres om
andre elever.

### 4.5 Det de gjør sammen

**Bålet og benkene.** Sett deg ned, delt animasjon, emoji-hjul. Rent sosialt, nesten
gratis, og det er dette de faktisk kommer til å bruke.

Alt annet (kappløp, skjoldvegg-lek, beretningsvegg) står som mulig senere. Ikke bygg
det nå.

---

## 5. Regelsettet: verb-kontrakten

Fella er å generalisere `Vaapen` til noe som dekker alt fra øks til Mauser. Ikke gjør
det. Generaliser de **tre verbene** i stedet.

| Verb | 793 | 1916 | Til hest | På dekk |
|---|---|---|---|---|
| Innsats (mellomrom) | hugg | skyt / lad | ri ned | salve |
| Vern (shift) | reis skjoldet | kast deg i dekning | trekk i tøylene | dukk bak relingen |
| Ressurs | pust | nerve | hestens krefter | mannskap |

Kjerneregelen overlever intakt:

> Står du bak et reist vern når slaget kommer, blokkerer du.
> Reiser du vernet i det slaget kommer, parerer du.

Å dukke i det granaten kommer er nøyaktig samme ferdighet som å reise skjoldet i det
øksa kommer. Eleven lærer én ferdighet i 793 og bruker den i 1916 uten at noen forklarer
noe. Det er en pedagogisk kontinuitet vi får gratis ved å holde kontrakten.

```ts
export interface Regelsett {
    id: EpokeId;
    ressurs: { id: string; navn: string; farge: string; maks: number;
               gjenvinning: number; pause: number };
    vern: { art: 'skjold' | 'dekning' | 'toyler'; dekning: number;
            slitasje: boolean; paradeVindu: number };
    bevegelse: { fart: number; rull: boolean; farkost: boolean };
    angrepsformer: AngrepsformId[];
}
```

**Vikingtiden er eneste implementasjon nå.** Ikke bygg nummer to. Poenget er at
signaturene ikke skal ha ordet «skjold» i seg.

Praktiske navneendringer:
- `KampTilstand.skjold` → `vern`
- HUD-en leser en ressurs-deskriptor `{ navn, farge }` i stedet for å hardkode «Pust»
- Fartskonstantene i `WorldScene.ts:111-119` (`SPILLER_FART`, `RULL_FART`, `RULL_MS`,
  `RULL_NEDKJOLING`, `USARBAR_MS`) flyttes til regelsettet

---

## 6. Angrepsform i stedet for switch

`WeaponArt` er i dag en lukket streng-union med switch-er på fem steder:

| Sted | Hva |
|---|---|
| `data/vaapen.ts:48-58` | `VAAPEN_KAMP: Record<WeaponArt, VaapenKamp>` (uttømmende, gir kompileringsfeil ved ny art. Bra.) |
| `engine/spriteforge.ts:558-601` | `forgeWeapon`, `switch (art)`, ny art faller til `default` |
| `engine/kampfx.ts:346-460` | `avslutning()`, `switch (art)` |
| `engine/audio.ts:191-224` | Én lyd per art |
| `engine/WorldScene.ts:1285-1311` | Manøverlogikken som if-kjede på `vk.manover` |

Modellen med to nivåer (per gjenstand i `items.ts`, per art i `vaapen.ts`) er god og
beholdes. Det som legges til er **angrepsform**:

```ts
export type Angrepsform =
    | { art: 'sving'; bue: number; rekkevidde: number }
    | { art: 'stott'; bue: number; rekkevidde: number; gjennom: boolean }
    | { art: 'skudd'; prosjektil: ProsjektilDef; ladeMs: number; ammo: string | null }
    | { art: 'kast'; prosjektil: ProsjektilDef; forbruker: string };
```

`slaa()` splittes i `svingAngrep()` og `skuddAngrep()`, der den siste gjenbruker
`this.prosjektiler` som allerede finnes.

Samtidig ryddes to ting scanningen fant:

- **Fire kopier** av `ITEM_BY_ID[…]?.weapon?.art ?? 'sverd'` (`WorldScene.ts:530, 1159,
  1276, 1476`) erstattes av én `utrustetVaapen()`-selektor i storen.
- `ublokkerbart` og `hak` kobles opp fra `fiendeSlaar()` til `Kamp.vurderTreff()`, som
  allerede tar dem imot.

Bue i kapittel 1 er da samme system som gevær i 1. verdenskrig, med andre tall og en
ladesyklus.

---

## 7. Farkost

Minimal besittelse og styring. Ingen fysikk.

- Spilleren går inn i en `Farkost`, som er en entitet med egen bevegelse, egen sprite og
  egne kollisjonsregler.
- Seilturen Nordvik til Lindisfarne blir ekte i stedet for et grensesnitt. Navigasjons-
  puzzlet (Nordvik-blueprinten §10.2: solhøyde, fugler, drivved) legges oppå en farkost
  eleven faktisk styrer.
- Hest = farkost med ett sete. VOC-skip = farkost med N seter.
- N seter fra dag én i typen, men bare 1 brukt nå. Da kan flere elever seile sammen i
  hubben senere uten ny modell.

**Konsekvenser i sprite-laget.** `Positur` (`spriteforge.ts:31`) må trolig få en
`ritt`-tilstand, og da må `KOLONNER`, `START`, `POSITUR_LENGDE` (`:38-49`) og
positurlista i `forgeHumanoid` endres i samme åndedrag, pluss `oppdaterHeltRamme()`
(`WorldScene.ts:546-592`). Se fallgruve 15 i Nordvik-blueprinten.

For skip kan dette unngås helt: figuren står stille på dekket, og farkosten er det som
beveger seg. **Gjør det slik i første omgang.** Ritt-posituren kommer når hesten kommer.

---

## 8. Lagringstilstand v4

Én migrering, gjort riktig. Samme localStorage-nøkkel `rpg-minnevokteren-v1`,
`version: 3 → 4`. Å bytte nøkkel er å slette alle lagrede spill i klasserom som spiller.

```ts
interface SaveState {
    version: 4;
    /** Global. Følger eleven overalt. */
    spiller: { navn: string; appearance: Appearance };
    hub: { apnedePortaler: EpokeId[]; spor: number };
    epoker: Record<EpokeId, {
        kapittel: number;
        /** Arves mellom kapitler. */
        kampanje: { aettAere, aetter, saker, beretninger, begreper,
                    kilder, sette, fredlos, klokkeAar };
        /** Nullstilles ved kapittelskifte. */
        kapittelState: { hp, niva, xp, solv, sekk, utstyr, vern, aere };
    }>;
}
```

Nordvik-blueprintens §12.1 (kapitteltilstand mot kampanjetilstand) blir det innerste
nivået her, uendret.

**Krav til `migrate()`** (`store/useRpgStore.ts:342-363`): zustand-persist fletter flatt,
så hvert nytt felt må få verdi i `migrate()`. En default i `create()` hjelper ikke en
elev som allerede har et lagret spill. Migreringstabellen i Nordvik-blueprinten §12.2
gjelder uendret, og legges inn under `epoker['vikingtiden']`.

**Ryddes samtidig:** `SaveState` (`types.ts:322-344`) og `RpgState`
(`useRpgStore.ts:18`) har drevet fra hverandre (`questForsok`, `varsler` finnes i den ene
og ikke den andre). Enten avledes `SaveState` fra `partialize`-resultatet, eller så
slettes typen. Ikke la to sannheter stå.

---

## 9. Filstruktur

**Nye filer:**

```
data/epoker.ts             Epokene (erstatter zones.ts)
data/steder.ts             STEDER-registeret
data/regelsett/viking.ts   Første og eneste regelsett
data/angrepsformer.ts      Sving, støt, skudd, kast
engine/sted.ts             StedKontekst, reise mellom steder
engine/farkost.ts          Besittelse og styring
engine/systems/            SpillerController, FiendeSystem, ProsjektilSystem,
                           LootSystem, InteraksjonSystem, VerdensByggeren
net/hubRoom.ts             RTDB-transport for hubben
net/navnevakt.ts           Validering av visningsnavn
components/HubHud.tsx      Spillerliste, emoji-hjul, skjul-knapp
```

**Filer som deles opp eller endres tungt:**

```
engine/WorldScene.ts       2409 → ~600 linjer. Orkestrering, ikke implementasjon.
engine/worldgen.ts         byggNordvik() blir én KartBygger blant flere
engine/boot.ts             Registrerer scener, starter på stedId fra lagringen
engine/quests.ts           byggNordvikQuester → per sted
types.ts                   Regelsett, Angrepsform, Sted, Epoke, SaveState v4
store/useRpgStore.ts       Migrering v4, utrustetVaapen()-selektor
components/Hud.tsx         Ressurs-deskriptor i stedet for hardkodet «Pust»
data/zones.ts              → data/epoker.ts
database.rules.json        Ny rpg-hub-node med regler
```

---

## 10. Etappene

Hver etappe skal etterlate spillet i spillbar stand.

| Etappe | Hva | Rettferdiggjøres av |
|---|---|---|
| **R1** | Del opp `WorldScene`. `SpillerController`, `FiendeSystem`, `ProsjektilSystem`, `LootSystem`, `InteraksjonSystem`, `VerdensByggeren`. Verifiseres av `verify-rpg-kamp.mjs` og `verify-rpg-drap.mjs` etter hvert uttrekk. | Alt annet står på denne |
| **R2** | Sted-abstraksjon. `WorldScene.init(StedKontekst)`, `STEDER`-register, `byggNordvik` blir én `KartBygger`, reise mellom steder. `sisteSone` blir levende. | Kapittel 1 alene (Nordvik → Lindisfarne) |
| **R3** | Angrepsform som data. Splitt `slaa()`. Koble `ublokkerbart` og `hak`. Én `utrustetVaapen()`. Bue som ekte prosjektil. | Bue i kapittel 1, gevær senere gratis |
| **R4** | Regelsett per epoke. Ressurs, vern, bevegelse som data. Viking som eneste implementasjon. | Låser verb-kontrakten før den fossiliseres |
| **R5** | Farkost, minimal. Skip uten ny positur. | Seilturen i kapittel 1 |
| **R6** | `SaveState` v4 med `epoker`-namespace. Rydd `SaveState`/`RpgState`-driften. | Gjøres uansett. Gjør den én gang. |
| **R7** | Hubben som sted. Tidslinjeveien, portaler, én åpen. Tom, men vakker. Spor (§3.4). | Låser rammen |
| **R8** | Flerspiller. Tilstedeværelse, navnevakt, emoji, bålet og benkene, skjul-knapp. | Satsingen |

**R1 til R6 betaler seg selv om hub og flerspiller aldri blir noe av.** Kapittel 1
trenger dem. R7 og R8 er der risikoen ligger: verdien deres avhenger av at det finnes
noe å gå til gjennom portalene.

Etter R8: kapittel 1, etter Nordvik-blueprintens etappe 2.

### Status

**R1-R8 er bygget** (juli 2026). Refaktoreringen er ferdig. Alle elleve
`scripts/verify-rpg-*.mjs` er grønne.

#### R4

`Regelsett.bevegelse.farkost` ble utelatt i R4 og lagt til i R5, der den
faktisk gjøres lest. Et felt ingen leser er den feilen `iRekke` allerede har
gjort i denne kodebasen. Alt annet i §5-signaturen er implementert og lest:
`vern.slitasje` avgjør om blokken hakker, `bevegelse.rull` om rullen finnes, og
`angrepsformer` hvilke verb epoken kjenner.

To ting R4 ryddet underveis, som ikke sto i planen:

- **`SkjoldDef.dekning` er borte.** Alle tre skjoldene hadde 120 - det var en
  epokekonstant forkledd som en gjenstandsegenskap. Den bor nå i `vern.dekning`,
  ett sted. `KAMP.dekningHalv` var en tredje kopi, og den var død.
- **Epoke og bank-sone er skilt.** `Sted.epokeId` het `'nordvik'` og ble slått
  rett opp i spørsmålsbanken. Nå er epoken `'vikingtiden'` med
  `bankSone: 'nordvik'`, så Lindisfarne kan legges til uten at noen må
  regenerere banken eller finne på en epoke som heter det samme som et sted.

#### R5

Færingen ved brygga i Nordvik. Bygget etter §7: besittelse og styring, ingen
fysikk, ingen ny positur. `WorldMap` fikk en egen maske, `farbart`, som §11
fallgruve 6 ber om. Tre ting prøvingen avdekket, og som er verdt å huske:

- **Fjellbeltet ryddet ikke `farbart`.** Ruter som først ble satt til vann og
  siden overskrevet med stein, ble liggende igjen som seilbare. Båten rodde
  tvers gjennom berget. Alt som gjør en rute om til noe annet enn vann må rydde
  begge maskene.
- **Skroget prøves i midten og ved baugen, aldri ved hekken.** Med hekken med i
  prøven kunne båten aldri legge fra brygga: dens egen hekk sto over plankene,
  og hver eneste bevegelse ble avvist.
- **Båten må fortøyes på riktig side.** Første forsøk la den sør for brygga.
  Brygga er usjøbar og fjellet stenger fjorden noen ruter lenger sør, så båten
  lå i en lomme den ikke kom ut av. Nord for brygga er leia åpen.

Farkosten kjenner ingen reisemål. `bestillReise()` fra R2 finnes og virker, men
det er ingenting å seile til før Lindisfarne bygges - å koble en avreise til
kartkanten nå ville vært et løfte uten et sted i den andre enden.

#### R6

Lagringen er `version: 4` med `epoker`-navnerommet, samme nøkkel, én
migrering. Formen følger §8, med tre avvik som er verdt å begrunne:

- **`hub` er ikke lagt inn.** Det er en hel delstate for et sted som ikke
  finnes ennå, og R4-leksjonen gjelder: et felt ingen leser er den feilen
  `iRekke` allerede har gjort her. R7 legger det til additivt med default -
  det er ikke omstruktureringen fallgruve 11 advarer mot. Den, den dyre
  migreringen, er gjort nå og gjøres bare én gang.
- **`kampanje` har det spillet faktisk har i dag** - `quester`,
  `questForsok`, `riktigeSvar`, `galeSvar`, `lest`, `bosser` - ikke
  `aettAere`, `saker`, `beretninger` og resten fra Nordvik-blueprintens
  §12.2. De feltene hører til systemene i etappe 2 og legges inn av dem.
  Skillet mellom arvet og nullstilt er altså ekte fra dag én, ikke et tomt
  skall.
- **`spells`, `mana` og `character.classId` står.** §12.2 tar dem ut, men det
  er en *spillendring* som hører til etappe 2, ikke til en omlegging av
  lagringsformatet. Hver etappe skal etterlate spillet spillbart.

To ting arbeidet avdekket, som ikke sto i planen:

- **Fallgruven med flat fletting er strukturelt borte.** `merge` er nå total:
  den bygger hele tilstanden gjennom `heleEpoken()`, som fyller hull med
  `tomKampanje()`/`tomtKapittel()`. Et nytt felt kan ikke lenger komme
  tilbake som `undefined` for en elev med et gammelt spill - man må aktivt
  glemme å gi det en default, i stedet for aktivt å huske en migrering.
- **Et unntak under innlasting er usynlig.** `CLASS_BY_ID[…].startWeapon` på
  en klasse-id som ikke finnes kastet midt i rehydreringen, zustand svelget
  det, og eleven møtte karakterskaperen som om hun aldri hadde spilt - med
  spillet sitt liggende urørt på disken til hun laget en ny figur oppå det.
  Alle oppslag har fall nå, og `onRehydrateStorage` logger feilen.

`scripts/verify-rpg-lagring.mjs` sår ekte lagrede spill i localStorage og
leser tilbake både storen og disken: v3 flatt, v1 med stokkede bankoppdrag,
en fremmed epoke som ikke skal røres, epokebytte begge veier, og en lagring
med hull i.

#### R7

Minnevokterens hall står. Elleve portaler, én åpen, og en ny elev begynner
der i stedet for i Nordvik. Fire ting avviker fra §3, og alle fire er
begrunnet av at de ble prøvd:

- **§3.1 sa log-skala. Log var feil.** Prøvd, målt og forkastet: mennesker
  velger epoker omtrent log-jevnt - hver epoke ligger en fast *andel* nærmere
  nå enn den forrige - så `log(alder)` gjorde avstandene like: 240, 240, 176,
  224, 256, 240 piksler. Veien ble en liste, og nettopp den forskjellen den
  skulle lære bort forsvant. Kvadratrota gir 464, 336, 176, 176, 128, 96, og
  da kjennes dyp tid som dyp tid. `verify-rpg-hub.mjs` måler dette, så ingen
  kan sette log tilbake uten at prøven sier fra.
- **Fire epoker står ikke på veien.** Språk, tro, samfunn og musikk er ikke
  tider, og et påfunnet årstall for «Ordheimen» ville vært en løgn på et kart
  som ellers forteller sant. De står i en lund sør for veien, og skiltet ved
  inngangen sier hvorfor. `EpokeDef.aar: null` er det som skiller dem.
- **Hallen har ingen epoke** (`Sted.epokeId: null`), og `ankomSted` bytter
  ikke epoke for den. Uten det ville et skritt inn i hallen lagt vikingtiden
  bort og åpnet en tom «hub-epoke» - eleven ville sett nivået sitt falle til 1
  i det hun kom hjem. Regelsettet blir vikingtidens gjennom fallbacken, og det
  er med vilje: et eget fredelig sett ville vært regelsett nummer to, i strid
  med §5.
- **Én dør inn måtte ha en dør ut.** Nordvik fikk en port hjem, og
  `WorldScene.ankomstRute()` setter eleven ned foran den porten hun kom fra -
  ikke på stedets faste startpunkt. Uten det lander hun ved bålet i vest hver
  eneste gang hun kommer hjem, og må gå hele tidslinjeveien østover på nytt.

**`hub`-noden i lagringen trengte ingen ny versjon.** Den ble utelatt i R6 med
vilje, og ble lagt til nå ved å gi den en default i `merge`. Det er R6-arbeidet
som betaler seg: en lagring uten `hub` får en tom en, og ingen elev merker noe.
Fallgruve 11 handlet om omstrukturering, og den er gjort én gang.

Spor (§3.4) er bygget som portaltellere og steiner på varden - hennes egne
foreløpig. Fotavtrykkene er ikke bygget: de krever et spor-lag som tegner
historikk over terrenget, og verdien er den samme som steinene gir. Formen på
`HubSpor` er den flerspilleren i R8 trenger, så det som endrer seg da er hvor
tallet kommer fra.

En ting prøvingen lærte oss om harnesset, ikke om spillet: headless Chromium
struper `requestAnimationFrame` når ingenting skjer på siden, og da fryser
kameraets fade-in midt i. Spillet går som det skal, men skjermbildet blir
kullsvart og målingen leser en verden som ikke er ferdig bygget. Prøven venter
nå på ekte tilstand (`sisteSted` satt og fade ferdig), ikke på en klokke.

#### R8

Hallen er delt. Åpne rom som fylles av seg selv, medelever som glir over
plassen med navnet sitt over hodet, benker rundt bålet, et hjul med åtte
følelser og en skjul-knapp. `net/hubRom.ts` er transporten,
`engine/systems/gjester.ts` tegner, `net/useHubRom.ts` er det eneste som
kjenner begge sider, og `engine/samvaer.ts` eier benkene.

**§4.1 håndheves ett sted, og det er ikke i nettlaget.** `Sted.flerspiller` er
sant for hallen og udefinert for alt annet, og `useHubRom` kobler til på
nettopp det flagget. Da kan ingen komme til å slå på flerspiller for en epoke
ved å endre en betingelse inne i transporten - det må gjøres i `steder.ts`, ved
siden av alt annet som sier hva stedet er. `verify-rpg-flerspiller.mjs` reiser
inn i Nordvik og måler at både gjestene og nettlaget er borte.

Fire avvik og funn som er verdt å ha skrevet ned:

-   **Ekstrapoleringen måtte ebbe ut.** Fallgruve 7 ber om «maks 200 ms», og
    det ble bygget rett fram først: gjett videre i samme retning, stopp etter
    200 ms. Prøven viste hva som var galt med det - en elev som slutter å sende
    blir stående der gjettingen forlot henne, altså et stykke fra der hun
    faktisk er, helt til pulsen tolv sekunder senere retter det opp. Nå ebber
    gjettingen ut: full styrke etter 200 ms, borte etter 400, og da står
    figuren nøyaktig på siste kjente sted. I tillegg er avstanden takket på 24
    piksler, for én rar melding skal ikke kunne kaste noen ut av verden.
-   **Innholdet vinner over møbelet.** Benkene sto først i E-rekkefølgen, og da
    stjal de tasten fra varden tre ruter unna - eleven kunne ikke legge steinen
    sin, og `verify-rpg-hub.mjs` sa fra med én gang. `Interaksjon.sjekk()`
    returnerer nå om den har et mål, og benken spør sist. Ett unntak, og det er
    nødvendig: sitter hun allerede, eier benken trykket, ellers åpner E skiltet
    ved siden av og hun blir sittende.
-   **Ingen ny positur, igjen.** Å sitte er `settOmBord(true)` med en fast
    posisjon og retning - nøyaktig samme tilstand som å stå om bord i færingen,
    for det er samme sak sett fra figuren. `Positur` er urørt, og §7-advarselen
    om `KOLONNER`/`START`/`POSITUR_LENGDE` gjelder fortsatt for den dagen
    hesten kommer. Til gjengjeld måtte benken bli tretti piksler bred: en
    seksten piksler bred stokk under en atten piksler bred figur er usynlig.
-   **Prøven skal ikke delta i spillet.** Flagget `rpg-uten-nett` i
    localStorage (bare i utviklingsmodus) hindrer `useHubRom` i å koble opp, og
    medelevene settes i stedet inn gjennom `window.__rpgHub.settGjester` - som
    kjører rådataene gjennom `tolkGjest`, den samme tolkningen Firebase-svaret
    går gjennom. Da måles navnevakten og ikoncensuren på det som kommer
    *utenfra*, som er der de hører hjemme, uten at en kjøring skriver en
    oppdiktet elev inn i et ekte klasserom.

To ting som ble ryddet på veien, og som ikke sto i planen:

-   **Påkledningen hadde to sannheter.** `Spiller.heltLook()` regnet ut
    kjortelfargen med en ternær-kjede ved siden av `ClassDef.palette`, som
    inneholdt de samme seks fargene. De holdt seg like helt til noen skulle
    tegne en medelev. Nå kler `figurLook()` i `data/classes.ts` alle, og
    `rustningTier()` er det ene stedet som vet hva en lærbrynje ser ut som.
-   **Pikselskriveren var privat i `Portaler`.** Navneskiltene over hodet
    trengte den samme, og en kopi til ville vært den tredje måten å skrive et
    ord på i denne kodebasen. Den bor nå i `spriteforge.ts` som `skrivPiksel`,
    med et håndtak som kan flyttes og ryddes.

Det som ikke er bygget, og hvorfor: **fotavtrykk i hallen** (§3.4) er fortsatt
ikke der - steinene ved portalene og på varden gir den samme opplysningen, og
et spor-lag som tegner historikk over terrenget er en ny tegneflate for null ny
mening. **Rombytte** (§12) er åpent som før. **Alt annet i §4.5** - kappløp,
skjoldvegg-lek, beretningsvegg - står som mulig senere, og skal fortsatt ikke
bygges nå.

---

## 11. Fallgruver

Nordvik-blueprintens §14 gjelder uendret. I tillegg:

1. **`WorldScene`-oppdelingen må verifiseres per uttrekk**, ikke til slutt. Kjør
   `verify-rpg-kamp.mjs` etter hvert system som flyttes ut. Ett stort uttrekk uten
   mellomsjekk er ikke reverserbart i praksis.
2. **`aria-valuenow` på `Stolpe` (`Hud.tsx:227`) er en API-flate**, ikke tilgjengelighets-
   pynt. Verifikasjonsskriptene leser den.
3. **Fiender må fortsatt rydde colliderne sine** når `FiendeSystem` trekkes ut.
   `fiende.collidere` inn, `drepFiende` ut. Uten det lekker to per fiende, for alltid.
4. **`settLaast()` må følge med ut.** Lås og fysikkpause hører sammen. Blir de skilt i
   oppdelingen, slår fiendene mens eleven leser.
5. **Stedskifte må rydde alt.** Prosjektiler, partikler, tweens, kamerafølge,
   letterbox, tåketetthet. Phaser-restart rydder scenen, men ikke tilstand som ligger i
   moduler utenfor den.
6. **Farkost-kollisjon er ikke spillerkollisjon.** Skipet trenger egen kollisjonsmaske
   mot vann og land. Gjenbruker du spillerens, går skipet på land.
7. **10 Hz posisjon må interpoleres.** Rå RTDB-oppdateringer tegnet direkte gir figurer
   som teleporterer. Lerp mellom siste to prøver, med ekstrapolering på maks 200 ms.
8. **`onDisconnect()` må settes før første skriving**, ikke etter. Ellers blir en elev
   som mister nettet stående som spøkelse i rommet for alltid.
9. **Navnevakten kjører klientside og serverside.** Klientside alene er et forslag, ikke
   en regel. Reglene i `database.rules.json` må validere lengde og tegnsett.
10. **Rommet må ha tak.** Uten maks antall per rom får du 60 figurer på en Chromebook og
    en bildefrekvens på ti.
11. **Epoke-namespacet må inn i migreringen med én gang.** To migreringer på elevenes
    lagrede spill er dobbel risiko for halve gevinsten.

---

## 12. Åpne spørsmål

- **Epokelisten.** Ikke bestemt. Arkitekturen bygges for n. De elleve sonene i
  `zones.ts` står som utkast: Gryet, Marmortorget, Steinborg, Lysbyen, Dampbyen,
  Skyggeåret, Ordheimen, Tempelhagen, Rådhusplassen, Klangdalen. Listen avgjøres når
  vikingtiden er ferdig og testet på elever.
- **Hubbens visuelle identitet.** Tidslinjeveien er formen. Paletten og årstiden er
  ikke bestemt.
- **Trofehall-rollen (§3.2 punkt 3).** Hva tar eleven med seg hjem fra en epoke, og
  hvordan vises det? Ikke designet.
- **Rombytte.** Kan en elev velge å hoppe til et annet rom for å finne en venn, uten at
  vi innfører koder? Åpent.
- **Regelsett nummer to.** Verb-kontrakten er en påstand til den er testet mot en epoke
  som ikke er vikingtiden. Første ekte prøve er 1. verdenskrig eller VOC.

---

## 13. Forholdet til Nordvik-blueprinten

`minnevokteren-nordvik-blueprint.md` §15 skroter sone-modellen eksplisitt: «én god
kampanje slår elleve tynne soner». Denne blueprinten tar rammen tilbake i en annen form.

Det er ikke i strid med intensjonen. Argumentet i §15 var mot elleve tynne **kampanjer**,
ikke mot en navigasjonsramme. Hubben er ikke innhold som konkurrerer med Nordvik, den er
inngangen til den.

**Men §15 må oppdateres**, ellers leser neste person den som gjeldende og river ut det vi
bygger. Konkret:

- §15 «Sone-modellen» omformuleres: sonene blir epoker, og epokebegrepet peker hit.
- §12 «Datamodell» får en henvisning til §8 her for `SaveState` v4.
- §13 «Byggerekkefølge» får R1-R8 som ny etappe 1b, mellom kampsystemet og kapittel 1.

Alt annet i Nordvik-blueprinten står uendret. Kampanjen, kapitlene, mellomspillene,
ære og ætt, tinget, årshjulet, minnetreet og fallgruvene gjelder som skrevet.
