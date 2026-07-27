# Blueprint: Nordvik - vikingtiden som spillbar kampanje

**Status:** Etappe 1, 1b og 2 er bygget. Kapittel 1 er spillbart fra ende til
annen: opplæringen mot Ravn, skroget, sjøsettingen, navigasjonen, Lindisfarne i
to halvdeler, valgene og hjemkomsten. Neste er etappe 3 (Mellomspill I).
Se statusnotatet under §13.
**Rute:** `/oving/rpg`
**Erstatter:** «Minnevokteren», den abstrakte sone-rammen. Navnet lever videre som
hubbens fiksjon, utenfor epokene, der det ikke står mellom eleven og fagstoffet.
**Se også:** `rpg-hub-og-epoker-blueprint.md` - hub, epoker og flerspiller. Den er
rammen rundt denne. Endringer den medfører her er merket «Oppdatert» i §12, §13 og §15.
**Fag:** historie / samfunnsfag
**Emne:** vikingtiden (13 artikler)
**Målgruppe:** 10. trinn
**Estimert spilletid:** 4-6 timer, fem kapitler

---

## 0. Harde rammer

**Alt bygges inne i spillet.** Ingen `MicroGame`-embeds, ingen gjenbruk av
`PantheonExplorer`, `TradeRouteMap` eller detektiv-motoren, ingen lenker ut av spillet
midt i en handling. Nordvik skal være ett sammenhengende spill, ikke en meny med
snarveier til resten av boka. Artiklene er kildemateriale for innholdet, ikke moduler
som embeddes.

**Ingen nye grafikk- eller lydfiler.** Alt tegnes prosedyralt i `spriteforge.ts` /
`tileforge.ts` og syntetiseres i `audio.ts`. Det gjelder også cutscenes.

**Chromebook-first.** 1366x768 er referanseskjermen.

---

## 1. Hva som endret seg, og hvorfor

Den forrige rammen het Minnevokteren: en tåke spiste hukommelsen, og eleven felte
abstrakte fiender som «Kildeløs Påstand» og «Anakronisme» med historiske kilder som
våpen. Elegant på papiret. Men den la et lag fiksjon mellom eleven og fagstoffet, og
alt som må forklares konkurrerer med det som skal læres.

**Ny ramme: du spiller historien rett.** Du bygger skipet. Du er med til Lindisfarne.
Du står ved Stiklestad. Ingen metafor.

Kildekritikken forsvinner ikke - den flytter til sømmene, mellom kapitlene, der den
blir hardere enn den var som monsterkamp. Se §6.

### Grunnprinsippet står

> **Hvis eleven kan vinne uten å ha forstått det, lærer ikke spillet det bort.**

Fagstoffet ligger i reglene, ikke i dialogboksene. Sosial rang, ære, hevn, lov,
årstid, gaveøkonomi, skjoldbruk og kildekritikk er ting du må mestre for å komme
videre.

### Kompetansemål (SAF01-04, 10. trinn)

| Mål | Hvor det treffes |
|---|---|
| vurdere korleis ulike kjelder gir informasjon ... og korleis einsretta kjelder eller mangel på kjelder kan prege forståinga vår | **Mellomspillene** (§6). Særlig Mellomspill I. |
| drøfte korleis framstillingar av fortida ... har påverka haldningane og handlingane til folk | **Du blir en kilde** (§11.4) og epilogen (§4, kap. 5) |
| gjere greie for årsaker til og konsekvensar av konfliktar, og reflektere over om endringar av føresetnader kunne ha hindra dei | **Ære og ætt** (§7.1), **tinget** (§7.2), kontrafaktisk epilog |
| utforske korleis teknologi har vore ein endringsfaktor | **Skroget** og **navigasjonen** (§10.1, §10.2) |
| reflektere over korleis menneske er påverka av geografiske forhold og historisk kontekst | **Årshjulet** (§7.3), og at samme gård spilles i fire tidsaldre |

---

## 2. Kampanjen: én gård, fire generasjoner

Nordvik er ikke en sone. Nordvik er **en gård ved en fjord**, og du spiller den fem
ganger over 273 år. Samme kart hver gang, synlig forandret.

**Stedet er hovedpersonen.** Hovet blir kirke, med den gamle stolpen fortsatt synlig i
veggen. Gravhaugene blir kirkegård. Åkeren vokser utover. Skipet fra 793 råtner i
naustet i 872 og er borte i 995. Endring over tid, sett, ikke lest.

**Aksen:** i 793 er du den som kommer. I 1066 er du den som ikke kommer hjem.

---

## 3. Hvorfor eleven utfører raidet

Dette er den mest omstridte avgjørelsen i blueprinten, og den er tatt bevisst.

Eleven angriper Lindisfarne selv. Munkene kan ikke forsvare seg. Angrepsknappen virker.

**Begrunnelsen:**

1. **Vi lager ikke et spill om vikinger som utelater det vikingene er kjent for.** Et
   raid der eleven er tilskuer er en løgn om hva som skjedde, og elevene ser den.
2. **Poenget kommer først etterpå, og det krever at hun gjorde det.** I Mellomspill I
   leser hun Alkuins brev og den angelsaksiske krøniken. Og hun oppdager det som er
   sant: **det finnes ingen norrøn beretning om Lindisfarne. Ikke én.** Alt vi vet om
   793 vet vi fordi de vi angrep kunne skrive. Den innsikten er ikke mulig å gi til
   noen som bare så på.
3. **Kampen er ekte, og den skal være god.** Vi lager ikke en scene der angrepsknappen
   ikke virker. Det er ikke gripende, det er forvirrende.

### Scenen har to halvdeler

**Første halvdel: full kamp.** Lindisfarne var et samfunn, ikke et kapell. Klosteret
hadde en stor arbeidsstokk, og folk forsvarer seg. Øyas egne menn møter dere med det de
har: spyd, økser, én gammel hjelm. De er flere enn dere, og de slåss for alvor.

Dette er kapittelets kampklimaks, og det skal være deilig. HP-stolper, skadetall,
kritiske treff, avslutninger, lemlestelse, loot-eksplosjon, fanfare. Alt fra §5.3
skrudd til topps. Han som fører dem, har navnestolpe øverst på skjermen.

Ingen brynjer, og ingen kongens ombudsmann: den kampen er ikke belagt i kildene, og
Mellomspill I sier det høyt til eleven etterpå. Se §16.4.

**Andre halvdel: du har vunnet.** Motstanden er nede. Det som er igjen på øya, er de
som ikke kan slåss.

Ingenting endrer regler. Angrepet virker likt. Blodet ser likt ut. Spillet slutter
bare å juble: ingen fanfare, ingen skadetall, ingen loot-sprett. Musikken faller bort
og blir stående på én tone.

Det er kontrasten som bærer, ikke en regelendring. Og fordi spillet ikke sier noe, blir
det heller ikke en preken.

**Valgene hennes:**

- Hun tar det hun vil: relikvieskrinet (gull), bøkene (verdiløse for henne,
  uerstattelige for dem), guttene (mest verdt av alt).
- Hun kan la være. Spillet sier ingenting, verken ros eller straff.
- Brenner hun skriptoriet, stopper ingen henne. Og i Mellomspill I står det tomt der
  kilden skulle vært.
- Alt hun tok med hjem, ligger i graven hennes i kapittel 5. Eleven ser det igjen.

**Hvorfor dette er riktig avveining:** ga spillet seiersfanfare for en ubevæpnet munk,
ville det ha sagt «dette var en seier» - og da leser Mellomspill I som at spillet
kjefter på eleven for noe det nettopp belønnet henne for. Spillet ville motsagt seg
selv. Nå gjør det ikke det, samtidig som eleven får den fullblods kampen kapittelet
skylder henne.

---

## 4. Kapitlene

| Kap. | År | Du er | Det som skjer | Kampen |
|---|---|---|---|---|
| **1** | 793 | **Torstein Ormsson**, 17 | Bygg skroget. Første ferd vestover. Lindisfarne. | Opplæring hjemme mot Ravn. Kampklimaks mot øyas menn. |
| **2** | 872 | **Åsa Torsteinsdotter**, husfrue | Mennene er ved Hafrsfjord. Du styrer gården. Andre kommer for å ta den. | Forsvar av tunet. Spyd og rekke. |
| **3** | 995 | **Torgils**, ung | Olav Tryggvasons menn kommer med den nye troen. Blot eller dåp. | Holmgang. Og et valg om å slåss mot egen ætt. |
| **4** | 1030 | **Halvard**, bonde | Stiklestad. Du står i bondehæren, mot kongen. | Skjoldborg. Formasjonskampen. |
| **5** | 1066 | **Orm den yngre** | Stamford Bridge. | Kort. Du vinner ikke. |

Mellom hvert kapittel: et **Mellomspill** (§6).

### Kapittel 1 - 793: Skroget og stranda

Du er sytten. Faren din, Orm, bygger et skip, og han er sur på deg.

- **Skroget** (§10.1). Du legger bordene. Feil bordlegging synker synlig på prøveturen.
- **Kampopplæringen** skjer hjemme, mot Ravn, en huskarl som ler av deg. Det er her
  hele kampsystemet læres, og det er en person, ikke en tutorial-dukke.
- **Navigasjonen** (§10.2). Ingen kompass. Solhøyde, fugler, drivved, skyer over land.
- **Lindisfarne.** Kapittelets kampklimaks mot ombudsmannen og mennene hans, og det
  som kommer etter. Se §3.
- Kapittelet ender med at du kommer hjem og faren din spør hva du tok med.

### Kapittel 2 - 872: Nøklene

Du er Åsa, husfrue på Nordvik. Alle våpenføre menn er sør ved Hafrsfjord. Gården er din.

- **Nøklene på beltet er ikke pynt.** De er en mekanikk: du styrer forrådet, og
  vinteren kommer. Årshjulet (§7.3) er kapittelets motor.
- **Hvem mater du?** Harald trenger korn. Motstanderne hans trenger korn. Du velger,
  og valget avgjør hvilken side gården står på når det er over.
- **Angrepet.** Noen kommer for å ta gården mens mennene er borte. Du kjemper, med
  spyd, i rekke, med de du har: en gammel mann, to kvinner, en trell du kan velge å gi
  våpen. Gir du trellen våpen, endres alt om ham etterpå.
- **Æren er ditt sterkeste våpen.** Med høy nok ære trenger du ikke kjempe i det hele
  tatt: naboætten kommer og stiller seg foran tunet ditt.

Dette kapittelet lærer husfruas faktiske makt bedre enn noe avsnitt kan.

### Kapittel 3 - 995: Blot eller dåp

Olav Tryggvasons menn er i fjorden. De har med seg en prest og tolv væpnede menn.

- **Blotet** (§10.4) er nå ulovlig. Holder du det likevel?
- **Holmgangen** (§5.5). En av kongens menn utfordrer deg formelt. Tre skjold, en hud,
  og reglene som følger med.
- **Splittelsen.** Halve gården vil døpes. Det er ikke tro mot vantro. Det er de som
  ser hvor makten går, mot de som ikke gjør det. Din egen bror er på den andre siden.
- Kapittelet ender med at kirken reises. Oppå hovet. Med stolpen i veggen.

### Kapittel 4 - 1030: Stiklestad

Du er bonde. Du står i bondehæren. Mot kongen.

- **Skjoldborgen** (§5.4) er hele kapittelet. Formasjonskampen, i sin fulle form.
- Du vinner. Olav dør. Og innen året er omme kalles han hellig, og din side er de som
  drepte en helgen.
- Mellomspill IV viser deg hvordan det skjedde: hvem som skrev det ned, når, og for hvem.

### Kapittel 5 - 1066: Den som ikke kommer hjem

Kort, tett, uunngåelig.

Du seiler med Harald Hardråde. Ved Stamford Bridge går det galt. Kampen er ikke
vanskelig fordi fienden er sterk - den er umulig fordi dere ikke har brynjene deres.
De ligger på skipene.

Du dør. Det er ikke game over. Det er slutten.

**Epilogen:** kamera stiger over Nordvik i år 1100. Kristen gård. Kirkegård der
haugene sto. Relikvieskrinet fra Lindisfarne ligger i en av gravene. Ingen på gården
kan si hva Torstein het.

Så kommer det kontrafaktiske:

> Hva om seilet aldri var funnet opp?
> Hva om klostrene hadde vært befestet?
> Hva om Åsa hadde matet den andre siden?

Eleven velger én, og kartet tegnes på nytt foran henne.

---

## 5. Kampsystemet

Kampen skal være knallgod for sin egen del. Det er også der mest fagstoff sitter, for
vikingkamp har mer innebygd mekanikk enn noe fantasy-system.

### 5.0 Styringen

Tre verb, tre taster. Vi legger ikke til én ny tast for kampsystemet - vi gir de tre
som finnes mer å si. Grunnen er Chromebook: hendene til en 14-åring ligger på WASD
eller på piltastene, og alt som krever en fjerde finger på et ukjent sted blir ikke
brukt. Besvergelsene forsvinner (§15), så 1-4 frigjøres, og de brukes ikke til kamp.

| Inndata | Handling |
|---|---|
| WASD / piler | Gå |
| **Mellomrom** | Slå. Kombo 1-2-3. |
| **Shift holdt, i ro** | Reis garden |
| **Shift trykket, i bevegelse** | Rull (uendret) |
| **Retning mens garden er oppe** | Vend garden, skjoldgang i 45 % fart |
| **Shift + mellomrom** | Våpenets manøver: hak, stikk-gjennom, ellers skjoldstøt |
| E | Snakk / les (uendret) |

Koden gjør allerede halve jobben: rullen krever bevegelse
(`utslag > 0.001`, `WorldScene.ts:982`). Derfor er «Shift i ro» og «Shift i bevegelse»
to forskjellige handlinger uten at noe blir tvetydig. Holder eleven Shift gjennom en
rull, reiser garden seg i det rullen slutter - rull rett inn i skjoldveggen er den
første flytende kombinasjonen hun oppdager selv.

**Paraden er reisningen, ikke stillingen.** Dette er den ene regelen hele kampsystemet
står på:

> Står du bak et reist skjold når slaget kommer, blokkerer du.
> Reiser du skjoldet i det slaget kommer, parerer du.

Blokk koster pust og hakker skjoldet. Parade koster ingenting og kaster angriperen ut
av balanse. Det gjør det å gjemme seg bak skjoldet til den dårlige strategien uten at
vi trenger å straffe den: eleven som står med garden oppe hele kampen, tømmer pusten
og mister skjoldet, mens eleven som leser varselet får alt gratis. Samme tast, to helt
forskjellige ferdigheter.

Vinduet måles fra rammen garden reiser seg (`skjoldReistTid`), ikke fra tastetrykket.
Reiser hun for tidlig, blir det en vanlig blokk - aldri en straff.

**Retningen.** Figuren har fire retninger, ikke 360. Garden dekker sektoren hun vender
mot pluss 15 grader på hver side, altså 120 grader i praksis: blokk lykkes når
`|vinkel(angrep) - retning| <= 60°`. Treff utenfor sektoren går rett gjennom. Under
gard settes `retning` av retningsinndata selv når farten er nede, så hun kan snu seg
mot en fiende bak uten å slippe skjoldet.

**Håndkontroll.** A slår, B ruller, **RB holdt** er gard, RB+A er manøver, Y er bruk.
Håndkontrollen har nok knapper til at gard og rull ikke trenger å dele. Merk at
`padKant()` gir kanttrykk - garden trenger holdt tilstand, altså `pad.R1` lest direkte.

**Berøringsskjerm.** Her er gard en **veksling**, ikke et hold: ett trykk reiser
skjoldet, ett trykk senker det. Tommelen kan ikke holde og trykke samtidig. Og fordi
paraden er reisningen, blir trykket på nettbrett nøyaktig samme ferdighet som
tastetrykket - «trykk i det slaget kommer». `Skjermkontroll` får en fjerde knapp, og
`touchTrykk` utvides med `'gard'`.

Vekslingen kan ikke misbrukes, for garden faller av seg selv når pusten er tom. Det er
den samme grensen for alle tre inndatametodene.

**Teknisk:** `Positur` i `spriteforge.ts` får `'gard'` med 2 rammer (reist, presset).
`KOLONNER` går fra 12 til 14, `START.gard = 12`, og `'gard'` må legges i lista i
`spriteforge.ts:317`. Skjoldet tegnes som **egen sprite-lag** ved siden av
`vapenSprite`, ikke inn i helte-arket - da koster et nytt slitasjetrinn ingen rammer.

### 5.1 Kjernen: skjoldet, ikke sverdet

Vikingkamp handlet om skjoldet. Det var våpensystemet. Å binde, hake og kontrollere
motstanderens skjold til det åpnet seg et hull.

**Skjoldet er en forbruksvare.** Lindetre, tynt, bygget for å ta imot og splintres.
Hvert blokkerte tungt treff hakker en flis av kanten, synlig på sprite-en. Etter seks
til åtte går det i to, med et smell, og du står bar. Historisk sant, og gratis spenning.

```ts
interface Skjold {
    id: string;
    /** Treff det tåler. Går ned ved blokk, ikke ved perfekt parade. */
    helse: number;
    maks: number;
    /** Grader det dekker. Rundskjold 120, ikke 360. */
    dekning: number;
}
```

**Dekningen er retningsbestemt.** Skjoldet dekker 120 grader dit du vender. Angrep
bakfra og fra siden treffer uansett. Det er derfor rekka finnes.

**Perfekt parade.** Blokker innenfor telegraferingsvinduet (`EnemyDef.varsel` finnes
alt) og angriperen kastes ut av balanse. Full åpning, og skjoldet tar ingen skade.
Dette er øyeblikket alt annet bygges rundt.

**Pust.** Slag, blokk og rull koster. Ekte kamper var korte og utmattende. Det gjør
kampen lesbar i stedet for spammbar. Tom pust = du kan ikke blokkere.

### 5.2 Våpnene er ikke statoppgraderinger

Hvert våpen har en manøver som er et historisk faktum.

| Våpen | Egenart | Særtrekk | Hva det lærer |
|---|---|---|---|
| **Spyd** | Lang rekkevidde, smal bue | Stikk gjennom rekka. Sterkt i formasjon, svakt alene. | Spydet var det vanlige våpenet |
| **Øks** | Middels, bred bue | **Hak:** kroker motstanderens skjold og river det ned. Blokkerer du en hake, mister du skjoldet i stedet for helsa. | Skjeggøksa var designet for nettopp dette |
| **Sverd** | Rask, allsidig | Ingen svakhet. Og du får ikke ett før kapittel 3. | Sverd var status og formue, ikke utstyr |
| **Sax** | Kort, hurtig | Virker når skjoldet er borte. Siste utvei. | Alle hadde en. Ingen valgte den. |
| **Bue** | Avstand | Ubrukelig i rekke. | Derfor lav status |

**Sverdet er en scene, ikke et drop.** Du får det av noen, med en historie festet til.
Ingen tilfeldig fiende dropper et sverd, noensinne.

### 5.3 Juice-laget

Motoren har allerede `hitstop()`, `shake()`, `pikselSprut()`, `flytTekst()`,
`stovsky()`, tilbakestøt-tilstanden og 48-rammers ark. Dette er finpussen som skiller
«fungerer» fra «deilig».

| Grep | Tall | Hvorfor |
|---|---|---|
| **Hitstop etter vekt** | lett 40 ms, tungt 90, parade 160, drap 140 | Ett tall for alt gjør at ingenting føles tungt |
| **Retningsbestemt kamerastøt** | 3-6 px langs treffvektoren, ease-out 120 ms | Rystelse i alle retninger leser som støy. Dytt leser som kraft. |
| **Utfall i slaget** | figuren bæres 8-10 px fram i trefframmen | Enkeltgrepet som gir mest utslag i 2D-action |
| **Forberedelse bakover** | 2 rammer som trekker 3 px tilbake før utfallet | Anticipation. Gjør slaget lesbart for begge parter. |
| **Treffblink** | 2 rammer hvit tint på den truffede | Nesten gratis, enormt utslag |
| **Våpenspor** | prosedyral bue i slagretningen, fader over 90 ms | `ItemDef.weapon.bue` finnes alt |
| **Klaskesprett** | mål klemmes 1.15 x 0.85 i trefframmen, tilbake på 80 ms | Squash and stretch |
| **Tilbakestøt-kurve** | rask ut, hard stopp. Aldri lineær. | Lineær knockback føles som å skyve en kasse |
| **Lyd i tre lag** | sus før treff, anslag ved treff, materiale (tre/jern/skjold/kropp) | Synten klarer alle tre |
| **Kamerazoom** | 3.0x rolig → 3.4x i kamp, 400 ms ease | Rommet snevres inn når det gjelder |
| **Skjoldflis** | 3-5 trepartikler langs blokkvinkelen, tresprak | Gjør slitasjen synlig før bruddet |
| **Paradeblink** | 1 ramme hvit hele skjermen + gnistregn + metallklang | Belønningen må være umulig å overse |
| **Pustebrudd** | HUD-stolpen rister rødt når den bunner ut | Eleven må kjenne det, ikke lese det |

**Kombo:** tre slag i kjede. Det tredje har lengre forberedelse og større utbetaling
(90 ms hitstop, dobbelt tilbakestøt). Bommer du på det tredje, står du i etterslep.

### 5.3b Utbetalingen

Vi holder ikke igjen. Målgruppa spiller God of War på fritida, og en kamp som ikke
tør å levere, føles som en skoleoppgave.

| Grep | Detalj |
|---|---|
| **HP-stolper** | Over alle fiender. Bosser og navngitte motstandere får stolpe med navn og tittel øverst på skjermen. |
| **Skadetall** | Flytende tall på hvert treff. Kritiske i gult, dobbel størrelse, med sprett. |
| **Blod** | Retningsbestemt sprut langs treffvektoren. Flekker som blir liggende på bakken hele kampen. |
| **Avslutninger** | Egen animasjon når et treff dreper: 160 ms hitstop, skjermen avmettes i 6 rammer, blodbue. Én variant per våpentype. |
| **Lemlestelse** | Skjoldarm, hjelm og våpen kan slås av som egne sprites som spretter og blir liggende. Motstanderen kjemper videre uten. |
| **Skjermkant** | Blod inn fra kantene under 30 % liv, pulserende i takt med hjerteslag i lyden. |
| **Drapsserier** | I skjoldborgen: teller som bygger seg, med stigende trommeslag. Brytes linjen, nullstilles den. |
| **Loot-eksplosjon** | Sølv og gjenstander spretter ut i bue med klingende metall, én lyd per objekt. |
| **Nivåstigning** | Full stopp, hvitt blink, hornstøt fra synten, tall som slår ut. |
| **Kamerakick ved drap** | 8 px, dobbelt av vanlig treff. |

### 5.4 Skjoldborgen (kapittel 4, Stiklestad)

Samme system, i formasjon. Reglene endres:

- Du kan ikke rulle. Du kan ikke løpe fram.
- **Skjoldet ditt dekker deg og halve mannen til venstre. Han dekker deg.**
- Går du fram, åpner du et hull, og mannen ved siden av deg dør. Han faller, og linjen
  brister utover fra der du sto.
- Seier er å **holde linjen i 90 sekunder**. Ikke å drepe noe.
- Spydet er nå det beste våpenet i spillet. Øksa er nesten ubrukelig.

Dette er det motsatte av alt spillet har lært deg til nå, og det er poenget:
vikingkrig var formasjon og disiplin, ikke berserkerkaos.

### 5.5 Holmgangen (kapittel 3)

Historien har allerede designet denne bossfighten.

- Kjempes på en utstrakt hud eller kappe. **Kanten er arenaen.**
- **Tre skjold er tillatt.** Går alle tre, står du bar. Tre skjold er tre liv.
- **Å trå utenfor huden er å vike.** Én fot utenfor = advarsel. Begge = tap.
- Ingen kan blande seg.

Du trenger ikke finne på en eneste regel. Og eleven lærer en institusjon ved å
overleve den.

### 5.6 Fiendene er folk

| Arketype | Telegrafering | Hvordan den løses | Faglig |
|---|---|---|---|
| **Spydmann** | Langt stikk, langt varsel | Vik til siden, ikke bakover | Rekkevidde slår hurtighet |
| **Øksekar** | To trinn: hak, så slag | Ikke blokker haken. Vik. | Skjeggøksas funksjon |
| **Bueskytter** | Sikte-linje vises | Tvinger bevegelse, bryter posisjon | Lav status, høy nytte |
| **Huskarl** | Speilbilde av deg | Ekte duell: skjold, pust, parade | Yrkeskrigeren |
| **Berserk** | Ublokkerbart, rødt varsel | Må vikes | Og i mellomspillet: berserkene er stort sett et sagagrep |

### 5.7 To slags motstandere

Skillet går ikke mellom «lov å nyte» og «ikke lov å nyte». Det går mellom hvem som er
inne i ættesystemet og hvem som ikke er det.

**Fremmede** - øyas menn, engelsk fyrd, kongens huskarler, leiesoldater,
raidere fra en annen fjord. Full pakke: HP-stolpe, skadetall, kritiske treff,
avslutninger, lemlestelse, loot-eksplosjon, fanfare. Ingen etterspill. Dette er
flertallet av kampene i spillet, og de skal være det eleven gleder seg til.

**Folk fra bygda** - naboer, ættefeller, navngitte motstandere i en pågående strid.
Samme kamp, samme juice, men **etterspill**: drapsteksten er navnet hans, ætten hans
får vite det, og hevnerne kommer (§7.1). Det gjør ikke kampen mindre god - det gjør
den til en hendelse i stedet for en oppgave.

Eleven ser forskjellen før hun slår: folk fra bygda har navn over hodet.

**Og de fleste bygdekonflikter kan løses uten kamp** - bot, gave, ting. Ikke fordi vold
er stygt, men fordi det var slik samfunnet fungerte. Er sverdet alltid det beste
valget innad i bygda, har vi lært bort noe feil. Mot fremmede er sverdet ofte akkurat
det riktige valget, og da skal spillet levere.

### 5.8 Tallene

Startverdier å justere ned fra, ikke sannheter. De er valgt så en kamp mot én huskarl
varer 20-30 sekunder og krever fire til seks vekslinger.

**Pust.** Maks 100. Stiger ikke med nivå - pust er menneskelig, og en sytten år gammel
gutt puster ikke bedre enn en huskarl. Det som endrer seg med utstyr, er hvor billig
blokken er.

| Handling | Pust |
|---|---|
| Slag 1 | 12 |
| Slag 2 i kombo | 14 |
| Slag 3 i kombo | 20 |
| Blokk, lett treff | 8 |
| Blokk, tungt treff | 18 |
| **Perfekt parade** | **0, og +15 tilbake** |
| Rull | 15 |
| Manøver (hak / stikk / skjoldstøt) | 22 |
| Gard oppe | 6 per sekund |
| Å reise garden | 0 |

**Gjenvinning:** 22 per sekund, men først 700 ms etter siste handling og siste treff,
og aldri mens garden er oppe. Pausen er det som tvinger eleven ut av rekkevidde for å
puste, og den bevegelsen ut og inn *er* vikingkampens rytme.

**Tom pust tar aldri en handling fra eleven. Den svekker den.**

| Ved pust under kostnaden | Hva som skjer |
|---|---|
| Gard | Kan ikke reises. Er den oppe, faller den. |
| Slag | Går likevel: skade × 0,6, hastighet × 1,35. Trege, tunge slag. |
| Rull | Blir en stavring: 60 % avstand, ingen usårbarhet. |

HUD-stolpen rister rødt ved bunn (§5.3), og synten legger et tungt åndedrag under.

**Skjoldet.**

| Skjold | Helse | Tyngde | Hvor |
|---|---|---|---|
| Treningsskjold | 5 | +2 pust per blokk | Ravn, kap. 1 |
| Rundskjold, lindetre | 7 | 0 | Standard |
| Jernskodd rundskjold | 9 | +3 pust per blokk | Kap. 3 og utover |

Slitasje: lett blokk hakker 1, tungt 2, parade 0. Øksehaken tar hele skjoldet hvis den
blokkeres. Tre synlige slitasjetrinn (over 66 %, over 33 %, resten) og et brudd.

**Paradevinduet:** 180 ms, målt fra reisningen. For tidlig gir vanlig blokk.
Ublokkerbare angrep (berserk, rødt varsel) kan ikke pareres - de må vikes.

**Telegrafering** (`EnemyDef.varsel`, finnes alt):

| Fiende | Varsel |
|---|---|
| Ravn under opplæring | 700 ms, og han sier hva han skal gjøre først |
| Spydmann | 620 ms |
| Øksekar, haket | 540 ms |
| Øksekar, slaget | 420 ms |
| Huskarl | 380 ms |
| Berserk (ublokkerbar) | 300 ms, rødt varsel |

Ravn starter på 700 og går ned til 450 gjennom opplæringen. Eleven merker at hun blir
bedre, men det er Ravn som er blitt raskere. Det er en løgn vi tar med glede.

**Komboen:** neste slag må starte innen 320 ms etter at forrige er ferdig. Tredje slag
har 2 rammer lengre forberedelse, 90 ms hitstop og dobbelt tilbakestøt. Bommer hun på
det tredje, står hun i 400 ms etterslep uten gard.

**Fart:** `SPILLER_FART` 96 uendret, skjoldgang 45 % av den. Rullen beholder
`RULL_FART` 260, `RULL_MS` 260, `RULL_NEDKJOLING` 620.

---

## 6. Mellomspillene

Mellom hvert kapittel forlater eleven 793 og ser tilbake på det hun nettopp gjorde.
Dette er kildekritikken, og den er hardere enn den var som monsterkamp, fordi hun var der.

Formen: et bord med kilder på. Du legger dem ut, leser dem, veier dem. Ingen kamp,
ingen tidspress. 5-10 minutter.

### Mellomspill I - «Hvem skrev dette ned?» (etter 793)

Du leser to kilder om raidet du nettopp utførte:

- **Alkuin av York, brev 793.** Kirkemann, skriver til kongen av Northumbria. Dette er
  Guds straff over et syndig folk. Han var ikke der.
- **Den angelsaksiske krøniken.** Fæle varsler, lyn, drager på himmelen, og så kom
  hedningene.

Så viser bordet det tredje feltet, og det er tomt.

> **Norrøne kilder om Lindisfarne: ingen.**
>
> Ikke ett kvad. Ikke én runestein. Ikke én saga skrevet i nærheten av 793.
> Alt du vet om det du nettopp gjorde, vet du fordi de du angrep kunne skrive.

Brente eleven skriptoriet, står det en linje til: *Og du var der da det ble avgjort
hvem som fikk fortelle.*

Dette er det sterkeste øyeblikket i hele kampanjen, og det er umulig å gi til noen som
bare så på.

### Mellomspill II - «Én kilde er ikke to» (etter 872)

Snorre forteller om Hafrsfjord, skrevet ca. 1230. Skaldekvadene er samtidige, men de
er kongens skalder. Arkeologien sier noe om maktkonsentrasjon, men ikke om et slag.

Oppgaven: finn ut hva vi faktisk vet om Hafrsfjord. Svaret er «mindre enn Snorre sier»,
og eleven kommer fram til det selv.

### Mellomspill III - «Hvem gagner denne fortellingen?» (etter 995)

Kristningsberetningene er skrevet av kirken, om kirkens seier. Partiskhetslinsen
introduseres her som verktøy: hvem skrev, for hvem, hva ville de oppnå.

### Mellomspill IV - «Hvordan en taper blir en helgen» (etter 1030)

Du drepte Olav. Innen et år var han hellig. Mellomspillet viser hvem som skrev det
ned, når og hvorfor - Sigvat Tordarson (kongens egen skald, samtidig) og Snorre
(200 år etter, for kongsætten).

Dette er kompetansemålet om framstillinger av fortida, servert rent.

### Mellomspill V - «Og du?» (etter 1066)

Alle kildene på bordet samtidig, i tidsrekkefølge. Hullene blir synlige. Og til slutt:
**dine egne beretninger** fra §11.4, slik de har spredt seg gjennom kapitlene.

### Kildene

| Kilde | Type | Nærhet | Av / for | Kommer i |
|---|---|---|---|---|
| Alkuins brev, 793 | brev | samtidig | kirkemann, til en konge | Mellomspill I |
| Den angelsaksiske krøniken | annal | nesten samtidig (nedskrevet ca. 890) | ofrene, for ettertiden | I |
| Skaldekvad om Hafrsfjord | dikt | samtidig | kongens skald | II |
| Heimskringla (Snorre, 1230) | saga | 300 år etter | islending, for kongsætten | II, IV |
| Ibn Fadlan, 922 | reiseberetning | samtidig | fremmed, for kalifen | III |
| Runeinnskriften på tingvollen | innskrift | samtidig | den som betalte | III |
| Sigvat Tordarson om Stiklestad | dikt | samtidig | kongens skald | IV |
| Gravgodset i haugen | arkeologi | samtidig | ingen | V |

---

## 7. Systemene

### 7.1 Ære og ætt

- **Ære** er en synlig stolpe i HUD-en. 0 til 100.
- Lav ære: folk gir deg ikke oppdrag, prisene stiger, tinget hører ikke på deg, NPC-er
  slutter å hilse når du går forbi.
- Høy ære: folk gir deg gaver uoppfordret, og naboætten stiller opp når du trenger dem.
  I kapittel 2 kan høy nok ære erstatte hele forsvarskampen.
- Stiger av: å holde ord, å gi gaver, å tale en annens sak, å gjøre opp for deg.
  Faller av: å ta uten å gi, å bryte tingfred, å drepe uten å lyse det.

**Hevn.** Dreper du noen med ætt, kommer hevnerne. Ikke straks, men med jevne
mellomrom, og de blir flere. Tre utveier: **bot** på tinget (krever mannebot-kunnskap
og at du lyste drapet i tide), **gave** (for liten er en fornærmelse, for stor gjør
motparten til din skyldner og fornærmer også), eller **ingenting** - og da blir du
**fredløs**. Halve kartet blir fiendtlig. Fredløshet er ikke game over, det er en
tilstand du kan leve i, og den lærer hva et samfunn uten stat gjør med den det støter ut.

**Ætt går i arv mellom kapitlene.** En uoppgjort strid i 793 kan møte deg i 872.

### 7.2 Tinget

Fire trinn:

1. **Lys drapet innen ett døgn.** Ellers er det ikke drap, det er **mord**, og mord kan
   ikke bøtes. Spillet varsler ikke om fristen. Den står på runesteinen ved tingvollen,
   og du må ha lest den.
2. **Skaff vitner.** Krever ære og at du faktisk har snakket med folk. Vitner kan ikke
   kjøpes.
3. **Anfør loven.** Feil lovhjemmel taper saken selv om du har rett i sak.
4. **Lovsigemannen resiterer**, fra hukommelsen. De frie mennene dømmer, vektet av din
   ære, dine vitner og om du anførte riktig.

### 7.3 Årshjulet

Fire årstider. Handlinger koster dager. Klokken er en ring i hjørnet.

| Årstid | Mulig | Læres av seg selv |
|---|---|---|
| **Vår** | Så. Reparere skip. | Sår du ikke, sulter gården i vinter |
| **Sommer** | Ferd, handel, ting | Hele forklaringen på hvorfor vikingferdene var sommerferder |
| **Høst** | Slakt, innhøsting, blot | Overskuddet avgjør om du overlever |
| **Vinter** | Ingen ferd, intet ting. Men sagaene fortelles. | Vinteren er kunnskapsinnhentingen |

Årshjulet er motoren i kapittel 2 og bakteppet i alle andre.

### 7.4 Minnetreet

Kunnskap er ikke et tall, det er handlingsrom. Begreper erverves ved bruk, ikke ved
lesing: du kan `[Klinkbygging]` fordi du har bygget et skrog som fløt.

```
[Klinkbygging] «Bordene ligger over hverandre. Det skipet er bygget for
                åpent hav - ikke for elva her.»
[Mannebot]     «Femti mark for en fri mann. Du krever for mye, Einar.»
[Blot]         «Du helte ut ølet før du drakk. Hvem ofret du til?»
[Nordvegen]    «Dere kaller det ikke et land. Dere kaller det en vei.»
```

Tre tilstander per node: **ukjent** (tåkelagt), **hørt** (møtt), **forstått** (brukt).
Minnetreet er også det som synkroniseres til «Min læring».

### 7.5 Koblingen til «Min læring»

I dag fyrer `recordActivity()` fra `fullforQuest()` (`useRpgStore.ts:244`) og
`felleBoss()` (`:295`). Begge forsvinner med §15. Uten nye ankere slutter spillet
stille å telle for eleven - den verste feilen vi kan gjøre, fordi den ikke synes før
noen spør hvorfor rollespillet ikke gir XP.

**Regelen: XP i «Min læring» gis for forståelse, aldri for drap.** Spillet har sitt
eget XP-tall til nivå og utstyr. Det er ikke det samme tallet, og de skal aldri møtes.

| Ankerpunkt | `kind` | XP | `activityId` |
|---|---|---|---|
| Begrep løftet til `forstatt` | `microgame-played` | 15 | `oving/rpg/begrep/<id>` |
| Puzzle løst (§10) | `microgame-played` | 15 | `oving/rpg/puzzle/<id>` |
| Tingsak ført til dom | `microgame-played` | 15 | `oving/rpg/sak/<id>` |
| Mellomspill fullført | `minigame-played` | 60 | `oving/rpg/mellomspill/<id>` |
| Kapittel fullført | `minigame-played` | 60 | `oving/rpg/kapittel/<nr>` |

Alle med `subjectId: 'historie'`, `topicId: 'vikingtiden'`, `score: 1`.

Et helt kapittel gir da rundt 240 XP for 45-60 minutter. `dailyXpTarget` er 80, så ett
kapittel er tre dagers innsats. Det stemmer med arbeidet.

**Vi legger ikke til nye `ActivityKind`-verdier.** De to vi bruker finnes, gir riktig
størrelsesorden, og huker av `practice`-målet i «Dagens mål» - som er sant, dette *er*
en øving. Vi bruker bevisst ikke `review-session`: den huker av «Fullfør dagens økt»,
og et mellomspill er ikke repetisjonskort. Blir rollespillet stort nok til at
statistikken trenger egne bøtter, splitter vi ut `rpg-begrep` og `rpg-kapittel` da.

**Idempotens.** `recordActivity` dedupliserer på `kind:activityId`
(`useProgressStore.ts:231`), så et gjentak gir bare repetisjonsbonus. Spillet skal
likevel ikke kalle to ganger: `begreper`, `sette`, `kilder`, `saker` og
`kapitlerFullfort` er vaktene, og de ligger i kampanjetilstanden (§12.1).

---

## 8. Cutscenes

Bygget på det motoren har: kamera (`fade`, `shake`, `pan`, `zoom`), tweens,
`spriteforge`-figurer, `settLaast()`, `fraSpill`-broen og synten. Ingen video.

```ts
// src/features/rpg/engine/klipp.ts
export type Klipp =
    | { art: 'letterbox'; pa: boolean }
    | { art: 'kamera'; til: [number, number]; ms: number; zoom?: number }
    | { art: 'folg'; hvem: string | 'spiller' }
    | { art: 'gaa'; hvem: string; til: [number, number]; ms?: number }
    | { art: 'vend'; hvem: string; retning: 'opp' | 'ned' | 'venstre' | 'hoyre' }
    | { art: 'si'; hvem: string; tekst: string; ms?: number }
    | { art: 'tanke'; tekst: string }
    | { art: 'vent'; ms: number }
    | { art: 'toning'; inn: boolean; ms: number; farge?: number }
    | { art: 'ryst'; ms: number; styrke: number }
    | { art: 'lyd'; navn: string }
    | { art: 'musikk'; rot: number; modus: number } | { art: 'stille' }
    | { art: 'taake'; tetthet: number; ms: number }
    | { art: 'sett'; hvem: string; synlig: boolean }
    | { art: 'spawn'; def: string; ved: [number, number] }
    | { art: 'flagg'; navn: string; verdi: boolean };
```

### Fire regler

1. **Ingen fakta som bare finnes i cutscenen.** Cutscenes setter innsats og stemning.
   Fagstoffet lever i systemene og i mellomspillene.
2. **Alltid hoppbar** etter første visning.
3. **Maks 40 sekunder.**
4. **Vis handling, ikke replikk.** Én god bevegelse slår tre replikker.

### Cutscenene

| ID | Kap. | Hva som skjer |
|---|---|---|
| `sjosettingen` | 1 | Skipet ditt går på vannet for første gang. Ingen sier noe. Orm legger hånda på bordganget du la. |
| `stranda` | 1 | Kjølen skraper sand. Kamera stiger. Klosteret ligger der, uten mur. Ingen har sett dere ennå. |
| `nokler` | 2 | Åsa får nøkleknippet i hånda. Mennene går ned mot sjøen bak henne. Ingen snur seg. |
| `presten` | 3 | En knarr glir inn i fjorden. Tolv menn i brynje. Én i hvit kjortel. Bygda står helt stille. |
| `kirken` | 3 | Kirken reises oppå hovet. Siste bilde: den gamle stolpen, fortsatt i veggen. |
| `linjen` | 4 | Bondehæren stiller opp. Kamera panorerer langs rekka. Du kjenner igjen fire ansikter fra tidligere kapitler. |
| `broen` | 5 | Stamford Bridge. Brynjene ligger igjen på skipene, i sola, urørt. |
| `epilog` | 5 | Nordvik år 1100. Se §4. |

---

## 9. Show, don't tell

### Forbudt

Infoplakater. «Visste du at»-bokser. NPC-er som sier «som du vet, var samfunnet delt i
tre stender». Tekst som forklarer noe eleven kan se.

### Verden koder fagstoffet

| Det eleven ser | Det hun lærer |
|---|---|
| Trellen har ikke navn over hodet. Bare **Trell**. Ingen sko. | Ufrie hadde ingen rettslig person |
| Åsa har nøkler tegnet inn på beltet. Ingen andre har det. | Husfrua styrte alt innenfor dørstokken |
| Langhuset har én dør og ett ildsted midt på gulvet | Slik bodde de |
| Gravhaugen er større enn langhuset | Makt vises i døden |
| Kirken er reist oppå hovet, gammel stolpe i veggen | Synkretisme og maktovertakelse |
| Sølvet er hakket i biter, og Bera bruker vekt | Hakkesølv. Verdi var vekt. |
| Skipet ligger på land om vinteren med masten nede | Årshjulet styrte alt |
| Klosteret på Lindisfarne har ingen mur | Ingen hadde tenkt tanken før 793 |
| Ditt skip fra 793 råtner i naustet i 872, borte i 995 | Tid |

### Barker

NPC-er snakker til **hverandre** når du går forbi, ikke til deg.

```
Orm   → gutten:  «Ikke der. Kjølen først. Alltid kjølen først.»
Bera  → Åsa:     «Fire mark. Og da veier jeg pent.»
Trell → ingen:   (sier ingenting. Aldri.)
Torhild → seg selv: «...og den som dreper og ikke lyser det, han er... han er...»
```

---

## 10. Puzzles

Løses av periodekunnskap, ikke av å flytte klosser.

**10.1 Skroget** (kap. 1). Legg bordene. Klink eller kravell, kjøl først eller sist,
mast før eller etter bordgangene. Orm prøveseiler. Feil skrog synker, og du ser det
synke. → `[Klinkbygging]`

**10.2 Navigasjonen** (kap. 1). Nordvik til Lindisfarne uten kompass. Solhøyde ved
middag, solskyggetavle, fugler, drivved, skyformasjoner over land. Bommer du på
breddegraden, driver du sørover og møter ingenting. → `[Breddegradseiling]`

**10.3 Forrådet** (kap. 2). Nøkkelmekanikken. Fordel korn, salt, kjøtt og fôr over fire
årstider, med for lite av alt. Hvem spiser? Trellene sist er lettest og verst.
→ `[Husfrua]`, `[Årshjulet]`

**10.4 Blotet** (kap. 3). Hva ofres, til hvem, når. Odin for god avling virker ikke -
Frøy er fruktbarhetsguden. Ingen retter deg. Avlingen svikter neste høst. → `[Blot]`

**10.5 Runeinnskriften** (kap. 2 eller 3). Kartlegg den yngre futhark fra tre kjente
innskrifter, les den fjerde. Belønningen er at den sier noe helt hverdagslig:
*«Toke reiste denne steinen etter Gorm, faren sin. Han var en god bonde.»*
Runesteiner er minnesmerker, ikke magi. → `[Runer]`

**10.6 Boten** (kap. 2-4). Regn ut riktig mannebot ut fra den dreptes stand,
omstendighetene og om du lyste drapet. For høyt bud er en fornærmelse. For lavt taper
saken. → `[Mannebot]`

**10.7 Lasten** (kap. 3). Vekt mot volum mot verdi. Pelsverk, hvalrosstann, rav, jern,
treller. Trellene gir mest sølv. Spillet kommenterer ikke det. → `[Hakkesølv]`

---

## 11. Oppdragstypologi

### Forbudt

- «Hent 5 av X.»
- «Snakk med A, gå til B, kom tilbake» uten at noe skjer underveis.
- Oppdrag der belønningen bare er tall.
- Oppdrag som *er* et flervalgsspørsmål.

### Regelen for alt henting

Ærendet er aldri poenget. **Møtet underveis** er poenget. Hvert ærend krysser minst ett
distrikt og avdekker noe eleven ikke visste at hun skulle se.

### Typene

**11.1 Sak** - en konflikt gjennom rettsapparatet (§7.2).
**11.2 Ferd** - du seiler, og valgene underveis har konsekvenser.
**11.3 Håndverk** - §10.
**11.4 Vitnesbyrd** - signaturtypen.

Du ser noe skje. Ingen forklarer det. Så spør tre forskjellige folk hva som skjedde:

```
Hva så du ved naustet i går kveld?

  1. «Einar tok kua. Jeg så det.»                     [nøkternt]
  2. «Einar stjal kua midt på lyse natta, uten skam.»  [farget]
  3. «Det var mørkt. Jeg så en skikkelse og en ku.»    [forbeholdent]
  4. «Ingenting. Jeg så ingenting.»                    [tilbakeholdt]
```

Versjonen din sprer seg som bark. Den vokser. Og den overlever **mellom kapitlene**:
i 872 hører Åsa historien om Einar, og den er ikke lenger den du fortalte. I
Mellomspill V ligger den på bordet, sammen med Snorre og Alkuin.

Ingen av de fire er feil. Det er slik kilder blir til.

**11.5 Ritual** - blot, gravferd, gaveutveksling. Riktig utført endrer verden. Feil
utført fornærmer.

---

## 12. Datamodell

```ts
// ─── Kampanje ───────────────────────────────────────────────────────────────

export interface KapittelDef {
    id: string;
    nr: number;
    aar: number;
    tittel: string;
    /** Hvem eleven er. Ikke en avatar - en person. */
    rolle: { navn: string; alder: number; stand: Stand; kjonn: 'kvinne' | 'mann' };
    /** Verdensendringer siden forrige kapittel. */
    verden: { fjern: string[]; legg: string[]; endre: Record<string, string> };
    mellomspillEtter: string | null;
}

// ─── Kamp ───────────────────────────────────────────────────────────────────

export interface SkjoldDef {
    id: string;
    navn: string;
    helse: number;
    /** Grader skjoldet dekker. Rundskjold 120. */
    dekning: number;
    /** Ekstra pust hver blokk koster. */
    tyngde: number;
}

export interface VaapenDef extends ItemDef {
    weapon: {
        skade: number;
        hastighet: number;
        rekkevidde: number;
        bue: number;
        art: WeaponArt;
        /** Pust per slag. */
        pust: number;
        /** Den historiske særmanøveren. */
        manover?: 'hak' | 'stikk-gjennom' | 'ingen';
        /** Virker i skjoldborg? */
        iRekke: 'god' | 'brukbar' | 'ubrukelig';
    };
}

export interface KampTilstand {
    pust: number;
    maksPust: number;
    skjold: { def: string; helse: number } | null;
    /** Retningen skjoldet vender. Grader. */
    gard: number;
    /** Millisekunder igjen av paradevinduet. */
    paradeVindu: number;
    komboTrinn: 0 | 1 | 2 | 3;
}

// ─── Ære og ætt ─────────────────────────────────────────────────────────────

export type Stand = 'trell' | 'karl' | 'hauld' | 'jarl';

export interface AettDef {
    id: string;
    navn: string;
    medlemmer: string[];
    botsatser: Record<Stand, number>;
}

export interface Sak {
    id: string;
    gjerning: 'drap' | 'tyveri' | 'aereskrenkelse';
    gjerningsmann: string;
    offer: string;
    /** Avgjør drap vs. mord. */
    lyst: boolean;
    skjeddeDag: number;
    vitner: string[];
    anfort: string | null;
    dom: 'ubehandlet' | 'bot' | 'fredlos' | 'frikjent';
}

// ─── Tid, kunnskap, beretning ───────────────────────────────────────────────

export type Aarstid = 'vaar' | 'sommer' | 'host' | 'vinter';
export interface Klokke { aar: number; dag: number; aarstid: Aarstid }

export type Forstaaelse = 'ukjent' | 'hort' | 'forstatt';
export interface BegrepDef {
    id: string;
    navn: string;
    /** Hva som løfter det til 'forstatt'. Aldri et quizsvar. */
    forstasVed: string;
    apner: string[];
}

export interface Beretning {
    hendelseId: string;
    kapittel: number;
    versjon: 'nokternt' | 'farget' | 'forbeholdent' | 'tilbakeholdt';
    /** Antall NPC-er som har gjentatt den. Styrer hvor mye den vokser. */
    spredning: number;
}

// ─── Kilder (mellomspill) ───────────────────────────────────────────────────

export type KildeArt = 'brev' | 'annal' | 'reiseberetning' | 'dikt' | 'innskrift' | 'saga' | 'arkeologi';
export type Naerhet = 'samtidig' | 'nesten' | 'senere' | 'mye-senere';

export interface KildeDef {
    id: string;
    navn: string;
    art: KildeArt;
    naerhet: Naerhet;
    opphav: { hvem: string; for: string; hensikt: string };
    utdrag: string;
    mellomspill: string;
}
```

**Nytt i `SaveState`:** `kapittel: number`, `kampanje: Record<string, unknown>` (det som
arves mellom kapitler), `aere`, `aett`, `saker`, `klokke`, `begreper`, `beretninger`,
`fredlos`, `sette` (spilte cutscenes), `kilder` (leste).

> **Oppdatert.** Disse feltene ligger nå ett nivå ned, under
> `epoker['vikingtiden']`, fordi lagringen må romme flere epoker. Den ytre formen står i
> `rpg-hub-og-epoker-blueprint.md` §8. Alt om hva som arves og hva som nullstilles
> (§12.1) og hele migreringstabellen (§12.2) gjelder uendret innenfor den rammen. Det
> gjøres som **én** migrering, `version: 3 → 4`, med samme localStorage-nøkkel.

**Nye filer:**

```
data/kapitler.ts        De fem kapitlene og verdensendringene
data/kilder.ts          De åtte kildene
data/aetter.ts          Ætter og botsatser
data/begreper.ts        Minnetreet
data/vaapen.ts          Våpen med manøvrer, skjold
data/klipp/             Én fil per cutscene
engine/kamp.ts          Pust, gard, parade, skjoldbrudd, kombo
engine/rekke.ts         Skjoldborg-formasjonen
engine/holmgang.ts      Arenaregler
engine/klipp.ts         Cutscene-avspiller
engine/aere.ts          Ære, hevn, fredløshet
engine/ting.ts          Sakens fire trinn
engine/klokke.ts        Årshjulet
components/Mellomspill.tsx
components/Tingsak.tsx
components/Minnetre.tsx
components/Vitnesbyrd.tsx
components/Kampuf.tsx   Pust, skjoldslitasje, gard
```

**Filer som endres, ikke opprettes:** `types.ts` (CoreStats krymper, SaveState vokser),
`spriteforge.ts` (positur `gard`, skjoldlag), `WorldScene.ts` (`oppdaterSpiller`,
`slaa`, `fiendeSlaar`), `Skjermkontroll.tsx` (fjerde knapp), `Hud.tsx` (mana-stolpen
blir pust, pluss skjold og ære), `useRpgStore.ts` (migrering, nye felt, nye ankere).

### 12.1 Kapitteltilstand mot kampanjetilstand

Fallgruve 12 i praksis. Skillet må ligge i typen, ikke i hodet til den som koder:

| Kapitteltilstand - nullstilles ved kapittelskifte | Kampanjetilstand - arves |
|---|---|
| `hp`, `pust`, `niva`, `xp`, `solv`, `sekk`, `utstyr`, `skjold` | `aettAere`, `aetter`, `saker`, `beretninger`, `begreper`, `kilder`, `sette`, `fredlos`, `appearance` |
| `aere` - personlig, dør med personen | `klokke.aar` - går aldri bakover |

Nivå og utstyr følger **personen**. Orm den yngre i 1066 arver ikke Torsteins sverd fra
793. Han arver at Torstein hadde et, og at ætten er kjent for det.

`aere` starter ikke på null i et nytt kapittel: **`startAere = 30 + aettAere / 2`.**
Bestefarens rykte gir deg et forsprang du ikke har gjort deg fortjent til. Det er
ættesamfunnet, og det er den beste grunnen til at kapittel 1 skal spille inn i
kapittel 2.

### 12.2 Migrering av lagrede spill

Nøkkelen `rpg-minnevokteren-v1` beholdes. Å bytte navn er å slette alle lagrede spill i
klasserom som alt spiller. `version: 3 → 4`.

`migrate()` må gi hvert nytt felt en verdi. Zustand-persist fletter flatt, så et felt
som bare får verdi i `create()`, blir `undefined` for en gammel elev - og første
`.length` krasjer spillet hennes.

| Felt | Ved migrering |
|---|---|
| `mana` | Ut av `partialize`. Pust lagres ikke; den er alltid full ved innlasting, slik helsa klampes i `onRehydrateStorage`. |
| `spells` | Ut. Men ikke stille: eleven får 25 sølv per besvergelse og én linje i loggen - «Nordvik har ingen trolldom. Du fikk sølv for stavene.» Et tap som leser som en utbetaling. |
| `riktigeSvar`, `galeSvar` | Beholdes som statistikk. Låser ikke opp noe lenger. |
| `quester`, `questForsok` | Beholdes urørt. Kapittel 1 leser dem ikke. |
| `bosser` | Beholdes. Glemselen finnes ikke lenger, men å slette lista er å påstå at hun ikke felte den. |
| `character.classId` | Ut (§16.3). `name` og `appearance` beholdes. |
| `sisteSone` | Settes til `nordvik-793` for alle. Den gamle sonen finnes ikke. |
| Alt nytt | `kapittel: 1`, `kampanje: {}`, `aere: 50`, `aettAere: 0`, `aetter: {}`, `saker: []`, `klokke: { aar: 793, dag: 1, aarstid: 'vaar' }`, `begreper: {}`, `beretninger: []`, `fredlos: false`, `sette: []`, `kilder: []`, `skjold: { def: 'treningsskjold', helse: 5 }` |

`CoreStats` krymper til `hp, pust, styrke, vern`. `mana` og `visdom` går ut - uten
besvergelser har visdom ingenting å gange.

Eleven som kommer tilbake til et lagret spill, møter ett skjermbilde, én gang:

> **Nordvik er ikke det samme stedet.**
>
> Tåka er borte. Året er 793. Du er Torstein, sytten vintrer, og faren din bygger et
> skip. Sølvet ditt og ansiktet ditt følger med. Resten er nytt.
>
> `[ Begynn ]`

Ingen endringslogg. Det er en åpningsscene.

---

## 13. Byggerekkefølge

Seks etapper. Hver enkelt gir noe spillbart.

| Etappe | Hva | Hvorfor her |
|---|---|---|
| **1. Kampsystemet** | `kamp.ts`: pust, retningsbestemt gard, perfekt parade, skjoldbrudd, kombo. Hele juice-tabellen i §5.3. Våpenmanøvrene. Fem fiendearketyper. | Alt annet står på denne. Og den kan testes for seg selv, i dagens Nordvik, uten at noe annet endres. |
| **1b. Refaktorering** | Oppdeling av `WorldScene`, sted-abstraksjon, angrepsform som data, regelsett, farkost, `SaveState` v4, hub og flerspiller. R1-R8 i `rpg-hub-og-epoker-blueprint.md` §10. | **Kapittel 1 krever stedbytte** (Nordvik → Lindisfarne), og det finnes ikke i koden i dag. Se §13.1. |
| **2. Kapittel 1** | 793 komplett: skroget, kampopplæringen mot Ravn, navigasjonen, Lindisfarne, cutscenene `sjosettingen` og `stranda` | Én ferdig, perfeksjonert time. Referansestandarden alt annet måles mot. |
| **3. Mellomspill I** | Bordet, kildene, det tomme feltet | Kapittel 1 er ikke ferdig uten det. Dette er hele poenget med å ha utført raidet. |
| **4. Ære, ætt, ting + kapittel 2** | `aere.ts`, `ting.ts`, mannebot, fredløshet, hevn. Årshjulet. Forrådet. Åsa. | 872 er kapittelet der de sosiale systemene *er* spillet |
| **5. Kapittel 3-5** | Holmgang, skjoldborg, resten av mellomspillene, epilogen | Størst arbeid, minst risiko. Systemene er da bevist. |

**Etappe 1 og 2 alene** er et ferdig, spillbart, knallgodt produkt: én time som ingen
lærebok i Norge har maken til. Det er dét jeg ville bygget og perfeksjonert før noe
skaleres.

### Status

**Etappe 1 er bygget.** `engine/kamp.ts` og `data/vaapen.ts` har pust,
retningsbestemt gard, paradevindu målt fra reisningen, skjoldslitasje og kombo;
`engine/kampfx.ts` har hele §5.3b; de fem menneskelige arketypene står i
`data/enemies.ts`, og `ublokkerbart`/`hak` er koblet gjennom `EnemyDef.sarslag`.

**Etappe 1b er bygget.** R1-R8, se `rpg-hub-og-epoker-blueprint.md` §10.

**Etappe 2 er bygget** (K1a-K1e), og **etappe 3** med den.

| Delet | Hva som står |
|---|---|
| K1a | Kapittelrammen (`data/kapitler.ts`), minnetreet (`data/begreper.ts`), cutscene-avspilleren (`engine/klipp.ts`) og «Min læring»-ankrene fra §7.5 |
| K1b | Fiendene ble folk (§5.6). Kampopplæringen mot Ravn i fire økter, med telegrafering 700→450 |
| K1c | Skroget (§10.1). Feil bordlegging synker synlig, og gir `[Klinkbygging]` |
| K1d | Navigasjonen (§10.2), Lindisfarne som eget sted, og raidet i to halvdeler (§3) |
| K1e | Besvergelser, mana og visdom pensjonert (§15). Migrering med 25 sølv per stav |

**Fire avvik fra planen, alle begrunnet av at de ble prøvd:**

- **Framdriften er en liste, ikke et tall.** §12 sier `kapittel: number`, og det
  står. Men *innenfor* kapittelet er stegene en liste med id-er. Et tall kan bare
  gå én vei og sier ingenting om hva eleven gjorde; en liste tåler at hun tar
  skroget før hun har trent med Ravn, og at vi legger inn et steg midt i uten at
  hvert lagrede spill i et klasserom hopper et hakk.
- **Lederen på Lindisfarne heter «Mannen med hjelmen».** §3 gir ham navnestolpe
  øverst på skjermen, og §16.4 tar fra ham brynja og ombudsmannsrollen. Da satt
  vi igjen med en navnestolpe uten navn - og det ble det beste svaret: ingen
  kilde ga ham et. Mellomspill I skal kunne peke på nettopp den linja.
- **Navigasjonen er et bord, ikke en ratt-tur.** §10.2 legger puzzlet oppå en
  farkost eleven styrer. Farkosten finnes (R5), men den er en færing i en fjord;
  en fire døgn lang overfart styrt med WASD er ikke navigasjon, det er venting.
  Puzzlet er fire døgn med ett tegn hver, og overfarten *er* puzzlet.
- **Klassevalget står igjen (§16.3).** `ClassId` skulle ut og erstattes av et
  rent utseendevalg. Den ligger på flerspiller-tråden (`Gjest.classId`) og i
  `figurLook`, og å bytte den midt i en etappe der resten allerede var verifisert
  ville satt hallen i spill for en kosmetisk gevinst. Den hører til etappe 3.

**Etappe 3 er bygget.** Mellomspill I står, og med det er kapittel 1 ferdig,
ikke bare spillbart.

Bordet er `data/mellomspill.ts` (kort, veiinger, det tomme feltet),
`data/kilder.ts` (kildene, med henvisning), `components/Mellomspill.tsx`
(bordet på skjermen) og `WorldScene.apneMellomspill` / `avsluttMellomspill`
(låsen, begrepene og regnskapet). `scripts/verify-rpg-mellomspill.mjs` driver
det gjennom en ekte nettleser, begge veier gjennom skriptoriet.

Formen holdt: to kilder legges ut og veies med tre spørsmål hver, og så er det
ett felt igjen. Eleven får ikke opplyst at det ikke finnes noen norrøn kilde -
hun får en knapp som sier «se etter en norrøn kilde», og feltet blir stående
tomt mens hun ser på det. Begrepene bordet gir, er `[Samtidig kilde]` og
`[Kildetaushet]`.

**Fem avvik fra planen:**

- **Krøniken er ikke «samtidig».** §6-tabellen sier det, og strengt tatt er det
  galt: notatene er gamle, men boka vi har er skrevet omkring år 890. Hadde
  bordet lært bort at en årbok er en samtidig kilde, ville det lært bort noe som
  ikke stemmer. `Naerhet` fikk derfor verdien `nesten`, og nettopp det spranget
  ble det første veiespørsmålet på krøniken.
- **Datoen er blitt et spørsmål.** Krøniken sier 8. januar; raidet var 8. juni.
  Det står ikke i blueprinten, men det er den beste inngangen til forskjellen på
  å lyve og å skrive feil som kapittelet har: Idus Iunii og Idus Ianuarii er
  nesten samme ord, og feilen er hva som skjer når en tekst kopieres for hånd i
  hundrevis av år.
- **`KildeDef.mellomspill` er utelatt.** §12 gir kilden en peker til
  mellomspillet, men §6-tabellen viser selv at Heimskringla brukes i både II og
  IV. Pekeren går andre veien nå: mellomspillet lister kildene sine.
- **Bare kildene til Mellomspill I ligger inne.** De åtte i §6-tabellen er en
  designliste. En kilde ingen legger ut, er nøyaktig den feilen `iRekke` alt har
  gjort i denne kodebasen.
- **Bordet ligger framme i pausemenyen etterpå.** Det står ikke i planen, og det
  er den ene tingen i spillet som blir bedre av å leses to ganger. XP gis bare
  første gang, så det er ikke en maskin.

Ett funn fra prøvingen, som ikke sto i planen: **fasiten må stå også når hun
bommer.** Første utkast viste den bare ved riktig svar, som quizen gjør. Men
bordet har verken tidspress eller kamp, og det er ingenting å straffe her - et
bom er ofte den korteste veien inn i hvorfor. Prøven måler det nå, for det er
den regelen som ryker først den dagen noen vil legge poeng på bordet.

**Det som gjenstår før kapittel 2:** ingenting av kapittel 1. Neste etappe er
§13 etappe 4 - ære, ætt, ting og årshjulet, og Åsa i 872. Minnetreet har fortsatt
ingen skjerm (`components/Minnetre.tsx` i §12-fillista): seks begreper deles ut
og vises som et varsel, men eleven kan ikke slå dem opp noe sted.

### 13.1 Hvorfor etappe 1b kom til

Kapittel 1 spilles på to kart: Nordvik og Lindisfarne. Dagens kode kan ikke bytte kart i
det hele tatt. `WorldScene` heter bokstavelig talt `'nordvik'` (`WorldScene.ts:212`),
`boot.ts:44` starter den ved navn, `create()` leser `ZONE_BY_ID.nordvik` uten parameter,
og `sisteSone` i storen settes én gang og leses aldri. Stedskiftet må altså bygges
uansett, før kapittel 1, uavhengig av alt som gjelder hub og flerspiller.

Da den jobben likevel skulle gjøres, ble rammen rundt den avgjort samtidig: én hub med
portaler til flere epoker, flerspiller i hubben, og systemer som tåler at en senere
epoke har gevær, hest eller skip i stedet for øks og spyd. Det designet står i
`rpg-hub-og-epoker-blueprint.md`.

Denne blueprinten er uendret av det. Kampanjen, kapitlene, mellomspillene, ære og ætt,
tinget, årshjulet og minnetreet gjelder som skrevet. Vikingtiden blir én epoke blant
flere i stedet for hele spillet, og Nordvik blir ett sted blant flere i stedet for hele
verden.

---

## 14. Fallgruver

Utledet av feil som alt har vært i denne kodebasen (se `src/features/rpg/README.md`)
og av det som ryker først i systemer som dette.

1. **Lås og fysikkpause må følge hverandre.** Alt som fryser spillet - cutscenes,
   mellomspill, tingsaker - går gjennom `settLaast()`. Setter du `this.laast` direkte,
   slår fiendene mens eleven leser.
2. **Cutscenes må rydde etter seg i `finally`.** Letterbox, kamerafølge og tåketetthet
   henger igjen når eleven hopper over, hvis ikke.
3. **Fiender må rydde colliderne sine.** `fiende.collidere` inn, `drepFiende` ut. Uten
   det lekker to per fiende, for alltid.
4. **Kollisjonsbokser skal ut av visningslista.** `lagBoks` kaller
   `this.children.remove()`. 286 usynlige rektangler tredoblet dybdesorteringen.
5. **Tilbakestøt trenger egen tilstand.** Uten `tilstand: 'stotet'` overskriver AI-en
   farten neste bilde, og treffet flytter fienden to piksler.
6. **Ikke bak nye lag inn i store renderTextures.** Kartbrede gjennomsiktige flater som
   overlapper koster mer i overtegning enn de sparer i tegnekall. Halverte
   bildefrekvensen sist.
7. **Skjoldbruddet må være uunngåelig, ikke tilfeldig.** Er det RNG, føles det urettferdig.
   Er det en teller eleven kan se på sprite-en, er det spenning.
8. **Paradevinduet må være gavmildt nok.** Start på 180 ms og juster ned. For stramt =
   eleven slutter å prøve, og da er hele systemet borte.
9. **Fredløshet må ha vei ut.** En elev som blir fredløs skal kunne gjøre opp senere.
   Ellers er det game over uten å hete det.
10. **Vitnesbyrdet har ikke et riktig svar.** Alle fire versjonene er spillbare. «Farget»
    får konsekvenser, men den er ikke feil - den er hvordan kilder faktisk blir til.
11. **Beretningens spredning må lagres, ikke utledes.** Regnes den på nytt ved
    innlasting, endrer et lagret spill seg under eleven.
12. **Kapitteltilstand må skilles fra kampanjetilstand.** Det som arves (ætter, saker,
    beretninger, begreper) må ligge i `kampanje`, ikke i kapittelets egen state, ellers
    forsvinner 273 år med konsekvens ved kapittelskifte.
13. **Ingen lenker ut av spillet under en handling.** Artikkellenken hører hjemme i
    Minnetreet og i mellomspillene, ikke i en kamp.
14. **Gard og rull deler tast, så rekkefølgen avgjør.** Garden må ikke kunne reises mens
    `rullIgjen > 0`, ellers reiser et rulletrykk skjoldet midt i rullen.

    Planen foreslo også en terskel på 120 ms holdt Shift før garden reiser seg. Den ble
    forkastet under bygging, og det var riktig: reisningen *er* paraden, så en terskel
    gjør et velplassert kjapt trykk verdiløst - og et kort trykk koster ingenting, det
    er bare en parade som ikke traff noe. Det som må hindres, er hamring på tasten. Det
    løses i stedet av `KAMP.gardHvile` (260 ms før skjoldet kan reises igjen etter at det
    er senket). Da kan ikke eleven holde seg i et evig paradevindu, og timing lønner seg
    fortsatt.
15. **`KOLONNER` og `POSITUR_LENGDE` må endres i takt.** 12 → 14 kolonner, `START.gard`
    = 12, og `'gard'` inn i posituren-lista i `spriteforge.ts:317`. Glemmer du lista,
    finnes rammene i typen men blir aldri tegnet, og garden vises som idle.
16. **`migrate()` må gi standardverdi til hvert nytt felt.** Persist fletter flatt.
    Defaults i `create()` hjelper ikke en elev som alt har et lagret spill.
17. **Pust må ikke gjenvinnes under lås og hitstop.** Frøs vi fysikken men lot
    pustklokken gå, ville eleven puste ut hele stolpen mens hun leser en dialog - og
    paraden ville bli gratis rett etter hvert treff.
18. **`recordActivity` skal aldri kalles fra kamp.** Ett kall per begrep, puzzle, sak,
    mellomspill og kapittel. Kobles den til drap, blir «Min læring» et mål på hvor mange
    hun har drept, og det er ikke det tallet vi vil vise en lærer.

---

## 15. Det som faller bort

- **Sone-modellen som kampanjeramme.** De ti andre sonene i `data/epoker.ts` (Gryet,
  Marmortorget, Steinborg, Lysbyen, Dampbyen, Skyggeåret, Ordheimen, Tempelhagen,
  Rådhusplassen, Klangdalen) hvilte på Minnevokteren-rammen med tåka og de abstrakte
  fiendene. Den rammen faller bort.

  > **Oppdatert.** Sonene selv gjør det ikke. De blir **epoker** med hver sin portal i
  > hubben, etter `rpg-hub-og-epoker-blueprint.md` §2. Argumentet under står uendret,
  > for det var aldri et argument mot en navigasjonsramme: det var et argument mot
  > elleve tynne *kampanjer*. Ingen epoke bygges ut før vikingtiden er ferdig og testet
  > på elever, og epokelisten er ikke bestemt.

  Én god kampanje slår elleve tynne soner.
- **De abstrakte fiendene.** `glemsel | paastand | anakronisme | rykte | vrangbilde`
  erstattes av folk med navn og ætt.
- **De 17 bankspørsmålene som oppdrag.** Banken beholdes som ryggrad for framtidige
  soner, men ingen oppdrag i Nordvik er lenger et flervalgsspørsmål.
- **`riktigeSvar: number` som opplåsing.** Erstattes av Minnetreet.
- **Besvergelser.** Erstattes av våpenmanøvrer og skjoldbruk.
- **Loot-drops av våpen.** Sverdet er en scene, ikke et drop.

---

## 16. Avgjort

### 16.1 Hvor mye kamp i kapittel 2?

Mindre. Én hard forsvarskamp, og høy ære kan erstatte den helt.

Men med én regel til: **æreveien må være synlig opptjent på forhånd.** Naboætten som
stiller seg foran tunet, må ha sagt noe til Åsa tidligere i kapittelet - «vi står i
gjeld til deg» - og hun må ha gjort det de takker for. Ellers leser den uteblitte kampen
som at spillet hoppet over innhold.

Kampen som ikke skjer, skal være det eleven skryter av. Det krever at hun vet at hun
kjøpte den bort.

### 16.2 Kan eleven dø for godt?

Nei, bortsett fra i kapittel 5, der døden er slutten uansett.

Men gjenopplivingen skal koste noe inne i fiksjonen, ikke ingenting:

- Du våkner der noen fant deg: nærmeste bål, naust eller langhus.
- **Én dag går** på årshjulet. I kapittel 2 er det det dyreste i spillet.
- Den som fant deg, sier noe. Ravn har fjorten replikker og går aldri tom.
- Ingenting mistes. Ikke sølv, ikke utstyr, ikke framgang.

Straff som fjerner framgang, får en 14-åring til å slutte. Straff som koster tid i en
verden der tid er en ressurs, får henne til å spille bedre.

I kapittel 5 er skjermen ferdig skrevet: du dør ved brua, og det står ingen «prøv igjen».

### 16.3 Beholder vi karakterskaperen?

Ja, men som utseendevalg, ikke klassevelger. `CharacterCreator.tsx` beholdes og krympes:
navn og rolle er gitt av kapittelet («Torstein Ormsson, sytten vintrer»), og eleven
velger hud, hår, hårfarge, ansikt og kjortelfarge. `ClassId`, `startSpell` og `affinity`
går ut med besvergelsene.

Og så det som gjør valget bedre enn det var: **utseendevalget arves.** Åsa i 872 har
Torsteins hårfarge. Halvard i 1030 har det samme ansiktet, eldre. Eleven ser sitt eget
ansikt i fire generasjoner uten at vi sier ett ord om slektskap. Det er den billigste
gode ideen i blueprinten - den koster én `appearance` i kampanjetilstanden.

### 16.4 Kampen på Lindisfarne som ikke står i noen kilde

Væpnet motstand på Lindisfarne i 793 er ikke belagt. Alkuin og krøniken beskriver drepte
munker, ikke en kongens ombudsmann med brynjekledde menn. Vi ville altså funnet opp
kampen eleven «var med på», og så brukt Mellomspill I til å lære henne at alt vi vet,
vet vi fra kildene. En skarp elev kan snu det mot oss.

To grep, og problemet blir det sterkeste øyeblikket i mellomspillet:

1. **Motstanden dempes til det kildene tillater.** De som slåss, er øyas egne menn -
   klosteret hadde en stor arbeidsstokk, og folk forsvarer seg. Ingen ombudsmann, ingen
   brynjer. Kampen blir ikke dårligere av å være ujevn. Den blir mer ubehagelig, og det
   er riktigere.
2. **Mellomspill I innrømmer det selv.** Etter det tomme feltet legges det siste kortet
   på bordet:

   > **Kampen du kjempet, står ikke i noen kilde.**
   >
   > Vi la den inn. Kildene forteller om drepte munker, ikke om menn som slo tilbake.
   > Hvorfor tror du vi gjorde det?

Et spill som avslører sin egen dikting, er kildekritikk på høyeste nivå, og det er noe
en lærebok ikke kan gjøre. Det koster oss to setninger.
