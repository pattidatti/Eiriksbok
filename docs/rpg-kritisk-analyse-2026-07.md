# Minnevokteren: kritisk analyse av vikingtiden

Dato: 2026-07-28. Grunnlag: `main` @ `84dc1295`, kjørt i egen worktree.

Metode: full lesning av `src/features/rpg/` (29 000 linjer), pluss **kjørende
verifisering** i ekte nettleser på 1366x768 (Chromebook-baseline) med Playwright.
Alle åtte steder lastet, kapittel 1-5 åpnet, opplæringen spilt, reise mellom
steder utført, teksturer dumpet ut og lest piksel for piksel.

Funn merket **[MÅLT]** er reprodusert i nettleser av meg. Funn merket **[LEST]**
er lest ut av koden, men ikke kjørt.

---

## Dommen, kort

Skrivingen er den beste i hele Eiriksbok. Historiefaget er ekte: eleven holder
et blot, fører en drapssak, står i en rekke, og møter kildene etterpå og ser
hullet der en norrøn beretning skulle stått. Ingen andre moduler i prosjektet
kommer i nærheten.

**Men spillet under teksten er ikke i spillbar stand.** Fire feil gjør at en
elev som gjør akkurat det spillet ber henne om, ikke kommer gjennom kapittel 1:

1. Spillet **fryser** ved første treff etter en reise mellom to steder.
2. **Opplæringen kan ikke fullføres** fordi tretten abstrakte monstre står på
   tunet og slår henne ned til 1 liv mens Ravn lærer bort skjoldet.
3. **Startknappen ligger under skjermkanten** på Chromebook.
4. Å skrive et navn med **i, l eller m** i seg åpner et fullskjermspanel oppå
   karakterskaperen.

Og bak de fire ligger et mønster: motoren har fått mye ny funksjonalitet uten at
noen har spilt gjennom det som allerede fantes. Tre bærende kampmekanikker er
koblet fra i kabelen, ikke i logikken. Tretti verifiseringsskript passerer på et
system som fryser.

Er det gøy? **Ikke ennå.** Kampen har én dominant strategi (hamre mellomrom),
skjoldet er pynt, og fem av seks signaturmekanikker er flervalgsspørsmål i
kostyme. Er det oversiktlig? **Nei.** Eleven får aldri vite hva kapittelet vil
at hun skal gjøre. Er det kaos på skjermen? **I kamp, ja.** Ser det juicy ut?
**Halvveis** - grunnarbeidet er der, men det svakeste treffet har svakest
tilbakemelding, og figuren har en rød stripe over halsen i hver eneste ramme.

---

## 1. Blokkere

### B1. Spillet fryser ved første treff etter en reise **[MÅLT]**

`engine/WorldScene.ts:125,133`

```ts
private efx = new Effekter(this);
private fx  = new KampFx(this);
```

Dette er klassefelt, altså konstruktøren, altså **én gang per Scene-instans**.
Alle andre systemer bygges på nytt i `create()`. Reise skjer via
`this.scene.restart()` (`WorldScene.ts:923`), som gjenbruker instansen. Phasers
`DisplayList.shutdown()` destruerer alt i visningslista og setter
`gameObject.scene = undefined`, men de poolede bildene blir liggende i arrayet.

`engine/systems/effekter.ts:26-27` henter fra poolen og kaller `setTexture`, som
er `this.scene.sys.textures.get(...)`. Med `scene === undefined` kaster den.

Målt gjennom den ekte reiseveien, Nordvik → Lindisfarne:

```
pool før reise: 2
sted: lindisfarne
FEIL: TypeError: Cannot read properties of undefined (reading 'sys')
x før/etter D holdt i 1,6 s: 216 → 216   >>> SPILLET ER FROSSET
```

Kastet skjer inne i `scene.update`. Phaser planlegger neste bilde *etter*
callbacken, så løkka stopper for godt. Eleven må laste siden på nytt.

Dette er nøyaktig kapittel 1s klimaks: hun trener med Ravn i Nordvik (skadetall
fyller poolen), seiler til Lindisfarne, og første slag i raidet fryser spillet.

`KampFx.vask()` (`kampfx.ts:479-491`) tømmer `flekker`, `lik` og `dyttTween`,
men ikke `this.pool`. `Effekter` har ingen `vask()` i det hele tatt.

**Fiks:** tøm begge pooler i `rydd()`, eller flytt konstruksjonen inn i `create()`.

### B2. Tretten monstre slår eleven ned til 1 liv under opplæringen **[MÅLT]**

Nordvik er det eneste stedet med `spawner` (`data/steder.ts:148`), og lista er
den gamle abstrakte fra før kampanjen ble historisk: `glemseltaake`,
`kildelos-paastand`, `anakronisme`, `ryktespokelse`, `vrangbilde`. Den slås ikke
av under opplæringen.

Målt fra det øyeblikket eleven trykker «Vis meg» hos Ravn:

| tid | liv | fiender på tunet |
|---|---|---|
| 0 s | 130 | 5 |
| 8 s | 105 | 8 |
| 16 s | 75 | 12 |
| 24 s | 35 | 14 |
| 32 s | **1** | 14 |

Ravn gjør alt riktig (`fredelig: true`, står stille). Det er tåkemonstrene som
slår. Eleven overlever bare fordi `ovingsmodus` gulver skaden på 1 liv
(`spiller.ts:1096`). Hun blir dyttet rundt, mister blikkretning og rekker aldri
å lande de tre treffene økt 1 krever. En kjøring på sju minutter med konstant
angrep endte på `teller: 0 av 3`.

Skjermbildet sier alt: «RAVN - ØKT 1 AV 4 / Treff Ravn tre ganger» nede til
venstre, `1 / 130` oppe til venstre, og blodsprut over hele tunet.

I tillegg står bossen `den-store-glemselen` (320 liv) på kartet fra første
sekund, og «Anakronisme» og «Ryktespøkelse» vandrer rundt på en gård i 793.

**Fiks:** `Opplaering.start()` må stanse spawneren, og `nordvik`-spawneren bør
byttes til vikingtidens egne fiender eller tømmes.

### B3. Startknappen ligger under skjermkanten **[MÅLT]**

`components/CharacterCreator.tsx`

Målt på 1366x768:

```
dokumenthøyde 768, vindu 768, rullebare beholdere 2
UNDER FOLDEN  top=772  720x60  «Gå inn i hallen»
```

Siden selv ruller ikke (`scrollHeight === innerHeight`). Det er en indre
beholder på 864 px som ruller, og bunnraden («Uttrykk: Rolig / Bestemt / Blid /
Skeptisk») ligger flush mot skjermkanten. Klassisk falsk bunn: det ser ferdig
ut, og den eneste knappen videre er usynlig. På 1280x600 forsvinner også
frisyre- og hårfargevalgene.

**Fiks:** fest handlingsraden nederst (`sticky bottom-0`), eller flytt den opp
ved siden av navnefeltet.

### B4. Å skrive navnet sitt åpner paneler oppå skaperen **[MÅLT]**

`RpgPage.tsx:309-367`

Tastelytteren er registrert ubetinget, uten sjekk på om en figur finnes eller om
fokus står i et tekstfelt. Panelene rendres uten `character`-vakt
(`RpgPage.tsx:621,625,627,685`).

Målt: å skrive «Mikkel» i navnefeltet åpner Minnetreet i fullskjerm på `m`-en.
Navnet blir stående i feltet bak. `i` åpner Sekken, `l` åpner Oppdrag, `Esc`
åpner pausemenyen med **«Ny figur (sletter alt)»** over en figur som ikke finnes.

Norske elevnavn med i, l eller m: Mikkel, Vilma, Emil, Ida, Live, Mia, Ingrid,
Mathilde, Liam, Milla, Oliver, Amalie. Dette treffer omtrent halve klassen.

**Fiks:** `if (!character || e.target instanceof HTMLInputElement) return;`

---

## 2. Er det gøy? Kampen

### K1. Særslagene når aldri forsvaret. Fem fiender mister lærepengen sin **[MÅLT]**

`engine/WorldScene.ts:198`

```ts
nerkampTreff: (fiende) => this.helt.nerkampTreff(fiende),
```

Kroken er erklært `(fiende: Fiende, sar?: Sarslag)` (`fiender.ts:50`) og kalles
med begge (`fiender.ts:534`), men pilfunksjonen tar bare ett argument. Målt i
nettleser: `kroker.nerkampTreff.length === 1`, kildestrengen er nøyaktig linja
over. `sar` er alltid `undefined`.

Følgen er at `ublokkerbart` og `hak` er døde i hele spillet:

| Fiende | Skal | Gjør |
|---|---|---|
| Berserk | ublokkerbart hvert 2. slag | blokkeres normalt |
| Øksekar, Gaute, Skjalg, Mannen med hjelmen | river skjoldet | ingenting |
| Den store Glemselen | ublokkerbart hvert 3. | kan gjemmes bort bak skjoldet |

Verre: telegraferingen fyrer fortsatt (`fiender.ts:405-408` setter egen tint og
større varselring). Spillet **sier** at dette slaget er annerledes, og gjør så
ingenting annerledes. Eleven lærer at det gule varselet ikke betyr noe.

Det river også ut begrunnelsen for tre-skjold-regelen i holmgangen, og for
berserken i skjoldborgbølgene.

Merk: `verify-rpg-kamp.mjs` melder «OK hak river hele skjoldet». Den prøver
`kamp.vurderTreff` direkte, ikke veien fiendene faktisk går.

### K2. Piler kan ikke blokkeres **[LEST]**

`WorldScene.ts:182`: `skadSpiller: (skade) => this.helt.skad(skade)`.
Prosjektiler går rett i `skad()` og forbi `vurderTreff()`. Bueskytteren og
ryktespøkelset kan ikke møtes med skjold. Et vikingrundskjold som ikke stopper
piler er den ene tingen en 14-åring prøver først.

### K3. Ett treff kansellerer fiendens oppladning. Dominant strategi **[LEST]**

`fiender.ts:626` setter `tilstand = 'stotet'` uten unntak, også midt i `varsler`.
Spillerens rekkevidde (42 px) er større enn huskarlens (26), utfallet bærer
figuren 13 px fram gratis, og nedkjølingen (380 ms) er kortere enn fiendens
minste syklus etter et treff (ca. 1000 ms). En huskarl rekker aldri å slå
tilbake mot en elev som hamrer mellomrom.

Konsekvens: skjold, gard og parade er valgfrie i alle en-mot-en-oppgjør, og det
gjelder opplæringen, holmgangen og bossen. Hele kampsystemets tese - «kampen
bygger på vernet, ikke sverdet» - er ikke i drift.

### K4. Ingen kan bli frisk igjen **[MÅLT]**

`useRpgStore.settHp` har null kallsteder utenfor storen. `endreHp` kalles ett
sted, med negativt tall. Ingen mat, ingen søvn, ingen forbruksgjenstand i
`items.ts`. De to eneste kildene til liv er nivåstigning og **å dø**
(`spiller.ts:1123-1126`, som også reparerer skjoldet).

Døden koster 15 % sølv og er ellers billigste vei til å bli hel. Kombinert med
at holmgangen taper på 45 % liv (`holmgang.ts:286`) og skjoldborgen brister på
28 % (`skjoldborg.ts:429`), uten at noen av dem fyller opp først: en elev kan
tape kapittel 3s klimaks i første bilde, uten at Skjalg har rørt henne.

### K5. Skjoldoppgraderinger er dødt innhold **[MÅLT]**

`Kamp.byttVern()` (`kamp.ts:128`) har null kallsteder. Rundskjoldet av lindetre
og det jernskodde rundskjoldet finnes i `vaapen.ts` og aldri i spillet. Eleven
går hele kampanjen med treningsskjoldet. Skjoldet repareres bare som bivirkning
av at scenen bygges på nytt, altså av å ta en tur innom hallen.

### K6. Kombo og paradevindu er usynlige **[LEST]**

`komboTrinn` og `nyligReist` ligger begge i `KampSnapshot` og leses av ingen
komponent. Trinn 3 koster 67 % mer pust og gir ingen ekstra skade, bare mer
tilbakestøt - altså dytter den fienden lenger vekk. Og den kan ikke velges bort:
komboevinduet (586 ms) er alltid lengre enn nedkjølingen (380 ms).

### K7. Hitstop på vanlige treff er for svakt **[LEST]**

`vaapen.ts:116-119`: lett 40 ms, tungt 90, parade 160, drap 140. 40 ms er 2,4
bilder. Bransjenormen for et solid nærkampstreff er 50-120 ms. Det vanligste
treffet har svakest tilbakemelding. Foreslått: lett 65-75.

Kamerastøtet (`dytt`, retningsbestemt) er riktig tenkt og godt dosert. Paraden
og drapet er godt dosert. Det er bare grunnslaget som mangler vekt.

### K8. Bue-kiting er en garantert skadefri seier **[LEST]**

Elevens fart er 96 px/s; raskeste fiende er 78. Hun løper fra alt. Med jaktbua
(rekkevidde 300 px) kan hun skyte og trekke seg i det uendelige, og selv med tom
pust går skuddet med 0,6x skade.

---

## 3. Er UI-en god? Oversikt og rot

### U1. Eleven får aldri vite hva kapittelet vil at hun skal gjøre **[MÅLT]**

`data/kapitler.ts:427` definerer `synligeSteg()`. Den har **null kallsteder**.
25 velskrevne mål-linjer (`StegDef.mal`) rendres aldri.

Oppdragsloggen (L) viser bare quiz-oppdragene. Målt på en fersk kapittel 1:

> **Oppdrag** · PÅGÅR (0): «Ingen. Snakk med folk som har et gult utropstegn
> over hodet.» · FULLFØRT (0): «Ingen ennå.»

Ingenting sier «gå til Ravn». Måltavla i HUD-en fylles bare av sju set-pieces
(opplæring, raid, gården, angrepet, holmgangen, skjoldborgen). Andel steg med
synlig mål: kapittel 3 har 1 av 4, kapittel 4 har 1 av 5, **kapittel 5 har 0 av 2**.

Etter blotet i 995 sier ingenting at kongens mann har krevd henne ut. Kapittel 4
åpner med at Bård står på tunet, og eleven må finne ham blant seks personer uten
et eneste hint.

Dette er den største effekten per linje kode i hele funksjonen: dataene er der,
de er velskrevne, og de er ikke koblet til skjermen.

### U2. Utropstegnet peker på quizen, ikke på historien **[LEST]**

`interaksjon.ts:305-313` setter markøren utelukkende ut fra `quester`.
`NpcDef.handlinger` - der kapittelet faktisk ligger - leses ikke. Og
`byggQuester` fordeler bankspørsmål rundgang over alle NPC-er uten handlinger.

Resultat: praktisk talt alle på kartet har utropstegn hele tiden. Målt i
Nordvik: 7 markører, 6 synlige samtidig. Markøren bærer null signal om hvem som
fører historien videre. Eleven lærer i kapittel 1 at gult utropstegn betyr «her
skjer det noe», og fra kapittel 2 betyr det «her er et flervalgsspørsmål om
merovingertiden».

### U3. Ingen stolpe har en synlig etikett **[MÅLT]**

`components/Hud.tsx:400-440`. `merkelapp` brukes bare som `aria-label`. Det som
vises er `{verdi} / {maks}`.

Målt på skjermen: to stolper over hverandre, «130 / 130» og «100 / 100». Ordene
«Liv» og «Pust» står ingen steder. I kapittel 2-4 kommer to gullfargede stolper
til, som skilles bare på metning og tykkelse, og erfaringsstolpen viser
**ingenting** - verken tall eller ord. Nivåtallet står som et bart tall i en
boks.

Prosjektet har eksplisitt krav om klasserom-storskjerm. Sju HUD-elementer som
bærer tilstand er 10-11 px.

### U4. HUD-en tegnes under alle overlegg, med knapper som ikke virker **[MÅLT]**

`RpgPage.tsx:429` gater `Hud` på `character && klar && !klipp.pa`, uten hensyn
til `overlegg`. `Skjermkontroll` og `HubHud` er korrekt gatet; `Hud` er glemt.

Målt: under en samtale med Ravn er nivåmerket, navnet, begge stolpene,
skjoldrutene, sølv, riktige og alle fire knappene fullt synlige rundt
dialogboksen. Jeg klikket «Sekk» seks ganger under dialogen. Ingenting skjedde -
`Ramme` på `z-40` fanger klikket, men knappen ser trykkbar ut.

### U5. Esc er ikke konsistent **[LEST]**

- På dødsskjermen går Esc til `lukk()`, som tar av låsen uten å kalle
  `gjenoppliv()`. Kameraet står svart, liv er 0, og eneste vei ut er
  pausemenyen. `dod` mangler i unntakslista på `RpgPage.tsx:318`.
- Under et klipp er `overlegg.type === 'ingen'`, så Esc både hopper over klippet
  *og* åpner pausemenyen. I/L/M åpner et panel oppå letterboxen og tar av låsen
  midt i cutscenen.
- Esc på en kunnskapsutfordring lukker uten å telle forsøket, så
  anti-gjettingsmekanikken i `QuizChallenge` kan omgås helt.

### U6. Minnetreet er en vegg med 28 like grå kort **[MÅLT]**

Første gang eleven åpner M ser hun tolv identiske kort: «Ukjent · TÅKE · Et ord
ingen har sagt til deg ennå», og 16 til under folden. Teller: «0 av 28 forstått».

Intensjonen (ikke vise hva som mangler, så treet ikke blir en huskeliste) er
riktig. Utførelsen leverer null informasjon og null motivasjon. Et gruppert
treff - «Kapittel 1: 0 av 6» - ville gitt struktur uten å gi bort svarene.

### U7. Styringen læres aldri bort **[LEST]**

WASD og piltaster nevnes ingen steder i grensesnittet. Ravns økter dekker
mellomrom og Shift. **Rull og manøver undervises aldri.** Pausemenyen har ingen
tasteoversikt. Eleven kommer til skjoldborgen i kapittel 4 uten å ha rullet.

### U8. Skjermkontrollen dekker oppgavekortet, uten av-knapp **[LEST]**

`harBeroring()` er `maxTouchPoints > 0`, altså sann på enhver Chromebook med
berøringsskjerm, også i laptop-modus. Styrestikka (`bottom-6 left-6 h-32 w-32`)
overlapper oppgavekortet (`bottom-20 left-3 w-64`) med ca. 72 px. Det er
oppgavekortet som er «det ene eleven holder på med». Ingen bryter i menyen.

### U9. Varsler legger seg oppå motstanderens helsestolpe **[LEST]**

Motstanderblokken står på `top-14`, varselstakken på `top-16`, begge
`left-1/2`. Opptil fire varsler samtidig. «Et skjold brister!» fyres i nøyaktig
den situasjonen der bossens stolpe er satt.

### U10. Kaos i kamp: sju ting kjemper om samme blikk **[LEST]**

Blodkant pulserer over hele flaten, pustestolpen rister rødt, flytende skadetall
over figuren, motstanderstolpen krymper, et amber varsel legger seg oppå den,
kameraet blinker rødt over hele skjermen, og oppgavekortet teller nede til
venstre. Ingen av dem er nedprioritert i forhold til de andre.

Det røde fullskjermsblinket ved hvert treff (`spiller.ts:1106`) er verdt en egen
merknad: Phasers `flash` starter på full alpha, det tas ikke hensyn til
`prefers-reduced-motion`, og dette vises på projektor i et klasserom.

---

## 4. Grafiske bugs

### G1. Figuren har en rød stripe over halsen i hver eneste ramme **[MÅLT]**

`pixels.ts:165-166`. `ramp()` dreier hue mot blått i skyggen, og korteste vei fra
en varm hudtone går **baklengs gjennom rødt**. Nøyaktig feilen som er dokumentert
og løst for teltduken i `tileforge.ts:456-459`, men aldri for hud.

Jeg dumpet `helt`-teksturen ut av kjørende spill og leste pikslene:

```
rad 8:  #e0a878 #e0a878 #e0a878 #dc6944 #dc6944   ← hud, skyggeside
rad 9:  #e0a878 #ca221d #ca221d #ca221d           ← nakke
rad 10: #ca221d #ca221d #ca221d #ca221d #ca221d   ← nakke
```

`#ca221d` er tomatrød. Den ligger over halsen på alle 56 rammene, i alle fire
retninger, på helten og på hver eneste NPC. Det leser som et kutt, ikke som en
skygge. Dette er den mest synlige grafiske feilen i spillet, og den står midt i
bildet hele tiden.

### G2. Langskipet i Nordvik står oppå fjellet **[MÅLT]**

`worldgen.ts:108`: `langskip = [3, 46]`. Målt i kjørende spill:

```
LANGSKIP: {"tx":3,"ty":46,"terreng":"stein","blokkert":true,"farbart":false}
```

Skjermbilde bekrefter det: skroget med skjoldene ligger halvveis oppå den grå
fjellflaten. Gjelder 793 og 1030 (som ikke sender `langskip` og arver
standardverdien). 872 sender `null`, 995 sender `KONGENS_KNARR` og er OK.

### G3. Kystlinjen har ingen overgang **[MÅLT visuelt]**

`systems/verden.ts:163-167` tegner et helt ugjennomsiktig vannlag oppå
bakke-teksturen hver frame. Alle overgangsfliser mot vann males over.
`sandskum`-materialet, som finnes utelukkende for møtet sand/vann, tegnes aldri.

Synlig i hvert eneste skjermbilde: gress/sand-grensen er myk og ujevn,
sand/vann-grensen er en knivrett 16-pikslers trapp. Det er det fila selv kaller
«det tydeligste amatørsignalet en topp-ned-verden kan ha».

### G4. Dybdeskalaen har fem reelle brudd **[LEST]**

| Problem | Konsekvens |
|---|---|
| Nær-tåka på 29000, kampinfo på 18000-20000 | skadetall og livsstolper tintes av tåka |
| Blod (-880), lik (-875) under fjern-tåka (-850) | liket vaskes ut mens mannen ved siden står skarpt |
| Blod og løsdeler på 19000, fiendens stolpe på 18000 | et hammerdrap kaster 32 partikler over stolpen eleven leser |
| Portalskilt på 30000 | «GRYET / 3000 F.KR.» tegnes oppå eleven som går foran |
| Spilleren på `baat.y - 4`, skroget på `baat.y` | eleven tegnes bak båten hun ror |

Portalskiltene er også dyre: 286 permanente fontbilder i hallen, 48 % av
visningslista, alle dybdesortert hver frame.

### G5. Flisvarianten repeterer perfekt hver 8. rute **[LEST]**

`verden.ts:71-74` bruker XOR av to lineære ledd. Bare de tre laveste bitene
overlever `% 8`, og de gir et mønster som gjentar seg eksakt hver 128 px. På
1366x768 med zoom 3 ser eleven 3,5 x 2 hele repetisjoner samtidig.

Samme fil bruker `flis.length` som frøkomponent, så `gress` og `stein` (begge
lengde 5) får identiske kantprofiler, og `sand`, `aker` og `vann` likeså.

### G6. Cutscene-avspilleren henger for alltid om scenen rives **[LEST]**

`klipp.ts:123` bruker `time.delayedCall`. Phasers `Clock.shutdown` fjerner timere
uten å fyre dem, så løftet løses aldri og `finally` kjøres ikke. Da blir
letterbox-bjelkene og låsen stående, to modul-globale lyttere lekker, og
`klippGaar` blir stående `true` - ingen cutscene spiller igjen i den økta.

### G7. Ytelse **[MÅLT]**

Målt i headless Chromium på 1366x768: 30-47 fps. Lavest i Nordvik 1030 (30) og
Stiklestad/Riccall (33). Ingen manglende teksturer noe sted.

Tre kostnadsdrivere: portalskiltene (286 fontbilder), 14 store halvgjennomsiktige
tåkeflak med skala opptil 5 (overtegning er det dyreste på Chromebook-GPU), og
et drap som koster rundt 60 GameObjects og 85 tweener i ett bilde. Dessuten
tegner `RpgPage` seg på nytt 11 ganger i sekundet fordi kamptilstanden går
gjennom React-state, og `Hud` abonnerer på hele storen.

---

## 5. Er historien strømlinjeformet, eller er det støy?

### S1. Ti engangs-systemer, tre som gjenbrukes **[LEST]**

Gjenbrukt: sanntidskampen, `QuizChallenge`, mellomspillet.

Engangs: opplæringen, skrogbyggeren, cutscener, navigasjonen, farkosten, raidet,
årshjulet, forrådet, angrepet, tinget, blotet, holmgangen, vinternettene,
skjoldborgen.

Ny UI eleven må lære per kapittel: k1 ≈ 9, k2 ≈ 7, k3 ≈ 3, k4 ≈ 1, k5 ≈ 0.

Kapittel 2 er det skarpeste bruddet: eleven har brukt 35 minutter på kamp,
skjold, båt og seiling, og så åpner 872 med årshjul, bu, gaveøkonomi,
ærebarometer og tingsak - mens kampen nesten er borte. Ingenting hun lærte i 793
er i bruk. Ingenting hun lærer i 872 kommer tilbake i 995.

Det ene som faktisk bygger på seg selv er kampen: skjold → parade → holmgang →
skjoldborg som snur alle vanene. Det mønsteret burde vært malen for resten.

### S2. Signaturmekanikkene er flervalgsquizer i kostyme **[LEST]**

| Skjerm | Påstand | Faktisk |
|---|---|---|
| `Skroget` | «Legg bordene selv» | 4 spørsmål x 2-3 knapper |
| `Navigasjonen` | «Hold breddegraden vestover» | 4 spørsmål x 3 knapper |
| `Blotet` | «Hold blot» | 3 spørsmål x 3 knapper |
| `Vinternettene` | «Svar kongens mann» | 1 valg av 3 |

Alle fire deler samme tre hooks og samme knappeliste. De er ett system i fire
drakter. De to som kan feile har ubegrenset omprøving med fasiten avslørt
underveis, og terskelen er 3 av 4 riktige.

Husets egen regel står i README linje 42: *«Hvis hun kan vinne uten å ha forstått
det, lærer ikke spillet det bort.»* `[Klinkbygging]` løftes i dag til «forstått»
av å gjette seg gjennom fire flervalg to ganger.

### S3. Kildedekningen kollapser etter kapittel 1 **[LEST]**

Andel bankspørsmål som har en kilde i verden:

| Kart | Med kilde |
|---|---|
| nordvik (793) | 17/17 |
| nordvik-995 | 13/17 |
| nordvik-872 | 9/17 |
| riccall | 6/17 |
| nordvik-1030, stiklestad | **4/17** |
| lindisfarne | 0 (ingen NPC-er) |

De øvrige faller på hintet «Svaret står i artikkelen X - åpne den og les». På
Stiklestad, på slagdagen, får eleven 13 oppdrag som ber henne forlate spillet.

Bossen, de håndskrevne oppdragene, farkosten og cutscenene finnes også bare i
kapittel 1. Og banken er tynn: 17 spørsmål for hele vikingtiden, hvorav 5 kommer
fra artikkelen «Merovingertiden», som ikke er vikingtid.

### S4. Kapittel 5 ender i ingenting **[MÅLT]**

- `kapitler.ts:402` peker på `mellomspillEtter: 'mellomspill-5'`. Den finnes
  ikke - `mellomspill.ts` har bare 1 til 4. `WorldScene.ts:1537` svelger det stille.
- `fullforKapittel(5, …)` kalles aldri. Kallstedene finnes for 1, 2, 3 og 4.

Eleven svarer Øystein om brynja og så er det slutt. Ingen avslutningsskjerm,
ingen kildebord, ingen XP, ingen oppføring i pausemenyen. Hun står i en leir med
fire NPC-er hun har snakket ferdig med. Kapittel 1-4 tar 25-40 minutter hver;
kapittel 5 tar 5-8.

### S5. Lesemengden er høy, men språket treffer **[LEST]**

Ca. 16 500 ord prosa, altså rundt 110 minutter ren lesing i en kampanje på 2-2,5
timer. Over 70 % av spilletiden er lesing.

Lesbarheten på det spillet skriver selv er god: LIX 16-24, 7-12 ord per setning.
Godt under målet for en 14-åring. Unntaket er `kilder.ts` (LIX 37), og det er
med vilje og riktig - originalutdragene skal ikke omskrives.

To reelle problemer: `leidang` brukes uforklart i kapittel 2 og 4 og forklares
først i kapittel 5, og begrepet heter «Kongens krav» i minnetreet, så det ikke
kan slås opp. Og kapittel 4-5 har høy egennavnstetthet (Tore Hund, Kalv
Arnesson, Knut den mektige, Sigvat Tordarson, Grimkjell, Morkere, Edvin, Tostig,
Øystein Orre, Tjodolv) uten noe sted å slå dem opp.

### S6. Hallen lover elleve epoker og leverer én **[LEST]**

Ti av elleve portaler svarer «X er ikke bygget ennå. Den kommer.» Spørsmålsbanken
har allerede 942 spørsmål til dem. En elev som går hele tidslinjen møter ti
stengte dører per åpne.

### S7. Fristen som avgjør tingsaken varsles aldri **[LEST]**

Det står som en dyd i README, og alene ville det vært det. Men sammen med U1
(ingen kapittelmål) og U2 (utropstegnet peker på quiz) betyr det at en elev som
ikke tilfeldigvis leser den ene steinen, mister kapittel 2s eneste rettssak
permanent - og saken er eneste vei til begrepet `mannebot`.

---

## 6. Prioritert tiltaksliste

### Nå (spillet er ikke spillbart uten)

| # | Tiltak | Omfang |
|---|---|---|
| 1 | Tøm `efx.pool` og `fx.pool` i `WorldScene.rydd()` | 2 linjer |
| 2 | Stopp spawneren i `Opplaering.start()`, og tøm/bytt `nordvik`-spawneren | ~10 linjer |
| 3 | Fest handlingsraden i `CharacterCreator` nederst i vinduet | CSS |
| 4 | Vakt på tastelytteren i `RpgPage`: `!character` og `HTMLInputElement` | 2 linjer |
| 5 | `nerkampTreff: (fiende, sar) => this.helt.nerkampTreff(fiende, sar)` | 1 linje |

### Deretter (spillet blir gøy)

| # | Tiltak |
|---|---|
| 6 | Koble `synligeSteg()` til oppdragsloggen og HUD-måltavla. Dataene finnes ferdig skrevet |
| 7 | La `oppdaterMarkorer()` lese `NpcDef.handlinger`, og gi kapittelhandlinger en egen markør |
| 8 | Ikke sett `stotet` når fienden står i `varsler`, så oppladningen ikke kan hamres bort |
| 9 | Mål tid-til-drap på nytt etter 8, og skru fiende-HP deretter |
| 10 | Fyll liv ved kapittelskifte og ved `Holmgang.start()` / `Skjoldborg.still()`. Legg inn én forbruksgjenstand |
| 11 | Skriv etikettene «Liv» og «Pust» på stolpene, og «Nivå» ved tallet |
| 12 | Gate `Hud` på `overlegg.type === 'ingen'` |
| 13 | `hitstopLett` 40 → 70. Tegn `komboTrinn` og `nyligReist` i HUD-en |
| 14 | Rut prosjektiltreff gjennom `vurderTreff` |
| 15 | Legg `dod` i Esc-unntakslista, og behandle `klipp.pa` som `apent` |

### Grafikk

| # | Tiltak |
|---|---|
| 16 | Klem `dreiHue` så den aldri passerer 0 grader, eller skriv hudskyggen ut eksplisitt |
| 17 | Flytt langskipet i Nordvik ut av fjellet (og gi 1030 sin egen plassering) |
| 18 | Tegn vannlaget før kantflisene, eller la kantene mot vann tegnes over vannlaget |
| 19 | Rydd dybdeskalaen: gore over -850, verdenspartikler under 18000, portalskilt y-sortert |
| 20 | Bytt XOR-hashen i `flisVariant` mot en ordentlig blandefunksjon, og hash strengen i stedet for lengden |

### Struktur

| # | Tiltak |
|---|---|
| 21 | Lukk kapittel 5: bygg `mellomspill-5` og kall `fullforKapittel(5)`, eller gi en ærlig «Fortsettelse følger»-skjerm |
| 22 | Fiks kildedekningen i 1030, Stiklestad og Riccall, eller skru av bankoppdrag der dekningen er under halvparten |
| 23 | Gi `Skroget` og `Navigasjonen` én ekte handling hver, ikke bare et riktig svar |
| 24 | Grupper minnetreet per kapittel, så «0 av 28» blir «Kapittel 1: 0 av 6» |
| 25 | Legg en styringsside i pausemenyen, og lær bort rull og manøver et sted |

### Verifiseringen selv

De tretti skriptene passerer i dag på et spill som fryser ved reise, har tre
frakoblede kampmekanikker og en opplæring som ikke kan fullføres. De måler at
pusten går opp og ned, ikke at kampen fungerer.

Én prøve som spiller Ravns fire økter til ende, og én som reiser til Lindisfarne
og deretter tar et slag, ville fanget B1, B2, K1 og K3 med én gang.
