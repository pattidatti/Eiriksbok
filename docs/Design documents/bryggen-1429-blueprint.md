# Blueprint: Bryggen 1429 (arbeidstittel)

> Et stort 3D-tredjepersonsspill: en åpen, levende by i Bergen fra 1420-årene til 1455, sett
> gjennom øynene til en tysk stuejunge på Hansakontoret. GTA i middelalderen, med tonen fra
> Kingdom Come: Deliverance.

| Felt | Verdi |
|---|---|
| id (foreløpig) | `bryggen-1429` |
| Parent (Fag) | Historie (kobles også til samfunnskunnskap og KRLE) |
| Emner i boka | `historie/middelalderen/hanseatene`, `historie/norsk-middelalder/hansadrapet-1455` |
| Status | Følelse og motor godkjent av eieren 02.10.2026. Første gård bygget av modulsettet; venter på eierens vurdering. Navn ikke valgt |
| Gråboks | `/test/bryggen-graboks` (egen rute, ikke i galleriet) |
| Første gård | `/test/bryggen-gard` (`?kvalitet=lav` for lav-nivået) |
| Motor | **A**: ny, liten Three.js-motor i `src/games/bryggen/motor/` (valgt, se §9) |
| Dato | 2026-10-02 |

Merkene brukt i dokumentet:

- **[V]** verifisert mot kilde i kildelista (§11).
- **[U]** usikkert eller omstridt i kildene. Spillet må si det ærlig.
- **[S]** spilldesign: et valg vi tar, ikke et historisk faktum.
- **[K]** sjekk før bygging: ikke funnet i kildene ennå. Skal ikke inn i spillet før det er bekreftet.

---

## 1. Fem navneforslag

| # | Navn | Begrunnelse |
|---|---|---|
| 1 | **Junge** | Det tyske ordet for gutten nederst på rangstigen. Kort, rått og personlig. Spillet handler om ham og hva han blir med på. Ordet forklares første gang det brukes, og eleven lærer det uten å legge merke til det. *Anbefalt.* |
| 2 | **Bryggen 1429** | Sted og år for den første store hendelsen (plyndringen og brannen). Lett å forstå og søke opp, men lover bare starten av en historie som går til 1455. |
| 3 | **Stokkfisk** | Varen alt dreier seg om. Navnet sier at dette er et spill om penger og makt, ikke om riddere. Kan høres litt komisk ut for en 14-åring før de har spilt. |
| 4 | **Kontoret** | Det tyske kontor var en by i byen med egne lover. Tittelen er kald og nøktern, og den peker mot hovedspørsmålet: hvem bestemmer her? |
| 5 | **Før Munkeliv** | Peker mot klimakset i 1455 og det moralske valget. Mørkt og stemningsfullt, men sier lite før man kjenner historien. |

---

## 2. Sjel og fortellerbue

**Én setning:** En gutt fra Lübeck kommer til Bergen for å lære handel, og blir mann i et
samfunn der pengene er sterkere enn loven, til han i 1455 må velge hva han er med på.

**Bue:** Eleven begynner som den svakeste på Bryggen: han bærer fisk, får juling og lærer
reglene. Byen er stor, våt og farlig, og alt er nytt. Etter hvert ser han hvordan systemet
virker: fiskerne fra nord sitter i gjeld, Kontoret styrer kornet, kongens menn på Bergenhus
prøver å holde igjen, og kirken står midt imellom. Han stiger i gradene og får mer makt selv.
Når Kontoret i 1455 går til angrep på kongens høvedsmann Olav Nilsson, er spilleren ikke en
tilskuer lenger. Han er en av dem.

**Grunnregel for historien [S]:** Spilleren kan ikke forandre det som skjedde. Olav Nilsson
og biskop Torleiv dør i Munkeliv kloster uansett. Spilleren bestemmer bare sin egen rolle: om
han er med, nekter, advarer eller redder noen. Det lærer eleven noe viktig: historien er ikke
et spill med riktig svar, men mennesker som valgte innenfor rammer de ikke styrte.

**Tone [S]:** Rå og alvorlig. Ingen vitser om vold. Fyll, fattigdom, hengninger og prostitusjon
vises ærlig og med alvor, aldri pirrende. Kamp har blod og død. Selve spillverdenen er grå og
regnfull. UI-et er lyst og lesbart, i husets stil.

---

## 3. Læringsmål

Etter spillet skal en 14-åring sitte igjen med fire ting. Hvert mål er bundet til noe eleven
*gjør*, ikke bare leser.

| Mål | Hva eleven gjør i spillet | Hvor |
|---|---|---|
| **Tørrfisk mot korn** - stokkfisk fra nord ut, korn, mel, hamp og øl inn, og gjelden som bandt fiskerne | Bærer, sorterer og veier fisk; fører gjeldsboka; pruter med en fisker som ikke kan si nei | Bryggen, kaia, sjøstua |
| **Livet på Kontoret** - rangstigen, sølibat, ingen ild i gårdene, schøtstuene, straffelekene | Lever etter reglene og blir straffet når han bryter dem; stiger fra junge til husbonde | Gårdene, schøtstuene |
| **Makt og konflikt** - Kontoret mot kongens menn på Bergenhus, norske borgere og håndverkere, og kirken | Ryktet hos fem grupper stiger og faller etter valgene hans | Hele byen |
| **Byen som helhet** - hvor Vågen, Bryggen, Holmen, Vågsbunnen, Stranden, Øvregaten og Nordnes ligger | Finner fram uten kart-pil på slutten; ror over Vågen | Hele byen |

Kobling til læreplanen (samfunnsfag etter 10. trinn, LK20, gjengitt på bokmål): mål 7, *gjøre
rede for årsaker til og konsekvenser av sentrale historiske konflikter og reflektere over om
endrede forutsetninger kunne ha hindret konfliktene* (1455-valget); mål 2, *vurdere hvordan
ulike kilder gir informasjon om et tema, og hvordan mangel på kilder kan prege forståelsen*
(«Dette vet vi»-tekstene); mål 5, *reflektere over hvordan mennesker har kjempet for endringer
og samtidig vært preget av geografi og historisk kontekst* (Olav Nilsson, fiskerne).
Kjennetegnene *Handlingsalternativer* og *Perspektiver* er selve spillmekanikken.

### «Dette vet vi»-tekstene [S]

Korte, faste tekstbokser (minst 13 px, lyse) som dukker opp første gang eleven møter noe der
kildene er tynne eller sene. De sier tre ting: hva vi vet, hvor vi vet det fra, og hva vi ikke
vet. Eksempel for straffelekene:

> **Dette vet vi.** De brutale spillene på Kontoret er beskrevet i kilder fra 1500- og
> 1600-tallet. Kong Christian 4. så borgspillet da han var i Bergen i 1599. Vi vet ikke sikkert
> om spillene fantes allerede på 1400-tallet, da denne historien foregår. Spillet tar dem med
> fordi de forteller hvor hardt livet var for guttene, men det er en antakelse.

---

## 4. Historisk grunnlag

### 4.1 Tidslinje for spillet

| År | Hendelse | Merke |
|---|---|---|
| ca. 1350 | Det tyske kontor i Bergen etablert. Holder til på Bryggen til 1754 | [V] SNL Det tyske kontor |
| 1393 | Vitaliebrødrene går i land på Nordnes, kjemper mot byfolk og styrker fra Holmen. Bergen plyndret og delvis brent | [V] Byleksikon, SNL |
| 1408 | Mariakirken overdras til Det tyske kontor | [V] Bergen byleksikon (Middelalderkirker) |
| 1413 | Mikaelskirken i Vågsbunnen brenner | [V] Byleksikon |
| 1420-årene | Birgittinerne overtar Munkeliv kloster på Nordnes. Dobbeltkloster med nonner og munker | [V] Lokalhistoriewiki |
| 1428 | En avdeling av vitaliebrødrene plyndrer Bergen uten motstand | [V] SNL vitaliebrødrene |
| april 1429 | Bartholomeus Voet kommer med 7 skip og ca. 400 mann. Norsk leidangsflåte møter dem i Vågen. Voet får hjelp av ca. 10 skip fra Wismar. Byen plyndres og brennes, også kongsgården og bispegården på Holmen | [V] Byleksikon; flåtestørrelsen [U] |
| 1432 | Nytt overfall | [V] Byleksikon |
| 1450 | Unionstraktaten mellom Danmark og Norge signeres på Bergenhus under Christian 1.s besøk | [V] SNL Bergenhus festning |
| 1. sept. 1455 | Tyskerne angriper høvedsmann Olav Nilsson på tinget. Han flykter til Munkeliv med sønnen Nils, broren Peder og biskop Torleiv. Klosteret brennes, over 60 drepes | [V] SNL Olav Nilsson, Lokalhistoriewiki |
| 1490 | Hanseatene betaler mannbot (7000 danske mark) | [V] artikkelen hansadrapet-1455 (Opsahl & Salvesen) |

**Den norske flåten i 1429 [U]:** SNL sier «fire store og svært mange mindre norske skip (noen
kilder antyder opptil 100)». Norsk Wikipedia anslår 40-50 skip og ca. 1500 mann fra Hordaland
og Sogn, og ca. 300 norske døde på de fire store skipene. Spillet skal vise at tallene er usikre.

**Hvem vitaliebrødrene kjempet for [U]:** Historikere er uenige om raidene i 1428-29 var rene
røvertokt eller angrep på forsyningslinjene til den norske unionsflåten under krigen mot
Holstein og hansaen (SNL). Hvordan Det tyske kontor på Bryggen forholdt seg mens byen brant, er
ikke beskrevet i noen av de åpne kildene (søkt 02.10.2026: byleksikonet, SNL, norsk og engelsk
Wikipedia). Det vi vet: hansabyene var i krig med kongen, og raiderne kom delvis fra Wismar, en
hansaby. Kildene nevner bare kongsgården, bispegården og «deler av byen» som brent, ikke Bryggen
**[U]**. Neste kilde å lese er Brekke, *Kontoret. Hanseatenes historie* (2024). Kapittel 2 må
skrives slik at spilleren ser tvetydigheten, ikke et fasitsvar.

**Olav Nilssons tittel:** Eieren skrev «fogden». Kildene kaller ham *høvedsmann* på Bergenhus:
kongens fremste mann i byen, med ansvar for borgen, loven og forsvaret [V]. Spillet bruker
«høvedsmann» og forklarer ordet første gang.

### 4.2 Livet på Kontoret

| Tema | Det vi vet | Merke |
|---|---|---|
| Ledelse | To oldermenn, et råd på 18 («die Achtzehner») og en sekretær. Fellesmøtet het «die Morgensprache» | [V] SNL Det tyske kontor |
| Gårdene | Hver gård var delt i «Gesellschaften» (stuer), hver med sin husbonde | [V] SNL |
| Rangstigen | Museets fortelling: *stuedreng/stuejunge* (rydder, henter vann og ved, lager mat), *skutedreng* (laster og losser skip), *gesell/svenn* (arbeidsleder, lærer guttene å lese, skrive og regne), *husbonde* | [V] for 1600/1700-tallet (Hanseatiske museum); [U] for 1400-tallet |
| Alder | Guttene kom fra 12-årsalderen | [V] Hanseatiske museum, men for senere tid [U] |
| Sølibat | Ugifte menn og gutter fra nordtyske hansabyer. De giftet seg ikke med norske kvinner | [V] Hanseatene-artikkelen (Orning, Arnesen) |
| Antall | Ca. en tidel av Bergens ca. 10 000 innbyggere var tyskere | [V] Orning |
| Ild | Åpen ild var forbudt i gårdene. Matlaging og varme skjedde i ildhus og schøtstuer bakerst | [V] Hanseatiske museum, Byleksikon |
| Schøtstuene | Samlingsrom bak gården. Om vinteren flyttet hele gården inn for varme måltider | [V] |
| Straff | En stuedreng kunne få «fem harde slag over ryggen» for å bryte en regel | [V] museets fortelling, senere tid [U] |
| Straffelekene | Røykspillet (bundet over brennende avfall fra garveriene, dynket med seks tønner vann, kunne ende med døden), vannspillet (slag så hardt at offeret led i uker), borgspillet (pisking; Christian 4. så det i 1599), damspillet (kastet i skittent vann). Forbudt av hansabyene 1592, Kontoret nektet. Avskaffet ved lov 1671 | [V] for 1500/1600-tallet; [U] for 1400-tallet |
| Vakthunder, port som stenges om kvelden | Ofte nevnt i populærfortellinger om Bryggen. Søkt 02.10.2026 uten treff i åpne kilder. Museet nevner bare at schøtstuene skulle stenges «i rett tid» om kvelden, og at en edru svenn skulle sitte vakt med brannsprøyte og vannbøtte (senere tid) | **[S]** Hunder og stengt port er designvalg. «Dette vet vi» sier ikke at det var slik |
| «Nordens farligste plass» | Mannsoverskuddet ga prostitusjon og kriminalitet | [V] Orning |

### 4.3 Handelen

- Tørrfisk (stokkfisk) var over 80 prosent av Norges eksport på 1300-tallet [V].
- Kontoret styrte kornimporten og saltet til fisket, og eksportmarkedet for tørrfisk [V].
- Nordfarergjeld: fiskerne fikk korn og utstyr «på bok» og kunne bli bundet i gjeld i årevis [V].
- Jektene førte tørrfisk og tran sørover, og bygg, havre, hvete og hamp nordover [V].
- Sommer-ankomsten til jektene: SNL beskriver at jektene hentet tørrfisken i juni og seilte til
  Bergen. Detaljene gjelder senere århundrer [U]. Spillet bruker «jektene kommer om sommeren»
  uten eksakte datoer.
- **Mynt [V]:** Det ble ikke preget norsk mynt fra 1387 til 1482. Det kjennes ingen norske
  mynter fra Erik av Pommern, Christoffer av Bayern eller Christian 1. (Holst). I Bergen betalte
  man med hansabyenes mynter: lybske *witten* og hulpenninger, og danske mynter etter at Danmark
  tok i bruk det lybske systemet. Regneenhetene var de gamle: 1 mark = 8 øre = 24 ertog = 240
  penninger [V Samlerhuset]. Spillet bruker «witten» som mynten i lomma og «mark» som det store
  regnestykket i gjeldsboka.
- **Vekt [V]:** Fisk ble veid i *våg* og *bismerpund*. Bylova av 1276 satte 1 bismerpund =
  24 merker ≈ 5,1 kg. Fra 1604 er 1 våg = 3 bismerpund ≈ 18,5 kg; på Vestlandet kunne en våg
  være ca. 22,5 kg (SNL). Våg-størrelsen i 1420-årene er ikke slått fast **[U]**. Spillet bruker
  «en våg er omtrent det en gutt kan bære» (ca. 18 kg) og veier med bismer (stangvekt med lodd).
- **Priser [U]:** Ingen åpne kilder gir priser for 1420-årene. Bytteforholdet fisk mot korn er
  kjent: rundt år 1500 fikk fiskeren 8 kg rug for 1 kg tørrfisk på markedet i Bergen, og 50 år
  senere bare halvparten (Holm mfl. 2019, etter Nedkvitne 1988). Spillet regner i *bytteforhold*
  (fisk mot korn), ikke i oppdiktede myntpriser, og sier at tallet er fra rundt 1500.
- Middelnedertysk ga 30-40 prosent av norske dagligord: *arbeid, handel, toll, betale* [V].
  Spillet bruker dette: plattyske ord i dialogen som eleven kjenner igjen.

---

## 5. Kart over byen

### 5.1 Oversikt (skjematisk, nord opp)

```
 Skjematisk, ikke i målestokk. Vågen går fra nordvest (havet) mot sørøst (Vågsbunnen).

          Holmen (nordvest)
          Håkonshallen, Magnus Lagabøtes tårn,
          Kristkirken, Apostelkirken, kongsgården, bispegården
             \
              \  Bryggen (nordøstsiden av Vågen)
               \ gårdsrekker med gavlen mot sjøen, Mariakirken bak
                \ ---- Øvregaten går bak gårdene ----
     havet  ~~~~ V Å G E N ~~~~~~~~~~~~~~~~~~~~~~~~~~~  Vågsbunnen (sørøst)
                 /                                     Eyrastein / Korskirken,
                /  Stranden (sørvestsiden)              Skostredet, skomakerne
   Nordnes     /   norske borgere
   Munkeliv kloster, rettersted
```

Bryggen strakte seg i middelalderen fra *Eyrastein*, der Korskirken ble reist, til Holmen
[V Byleksikon]. Kartet er skjematisk. Det endelige kartet tegnes fra Bryggens Museums
utgravningsplaner og gamle bykart **[K]**.

### 5.2 Steder med verifiserte fakta

| Sted | Hva vi vet | Merke | Fase |
|---|---|---|---|
| **Bryggen** | Smale, lange parseller, forretning mot bryggen, lager/bo/verksted innover. Enkel- og dobbeltgårder, svalganger over gårdsrommet i andre etasje. Laftehus med torvtak etter brannen 1248. 2-3 etasjers uisolerte lagerhus (loft). Bygget på bolverk av kryssstablet tømmer | [V] | **MVP** |
| Bryggens gårder | Navn som overlevde: Finnegården, Holmedalen, Bellgården, Jakobsfjorden, Svensgården, Enhjørningsgården, Bredsgården. Brynjolvsgard i nord var større. Hvilken gård som lå inntil Nikolaikirkeallmenningen i 1420-årene er ikke funnet **[K]**, så den første gården i spillet har ikke navn ennå | [V] | MVP (2-3 gårder) |
| Allmenninger | Brede tverrgater fra sjøen og opp, sikret av kongen etter brannen i 1248 som branngater. Bylova 1276: 8 alen (ca. 4,4 m) brede. Nattevakta skulle melde seg ved hver allmenning. Langs Bryggen fra nord til sør: *Maria allmenning* (mot Mariakirken, funnet 1979, 7-8 m bred nederst), *Bua allmenning* (mellom Bugården og Bredsgården), *Breida allmenning* (der Svensgården står), *Nikolaikirkeallmenning* / Yngre Breida (byens midtpunkt, torg til 1470, rådhuset *stefnustova*, 18 m bred ved Vinkjelleren), *Auta allmenning* (dagens Vetrlidsallmenning, Bryggens sørgrense) | [V] Byleksikon, Wikipedia | MVP (Nikolaikirkeallmenning) |
| Bryggefronten | Vågen ble fylt ut etter hver storbrann fram til 1332; kailinja fra 1332 er kjent fra utgravninger og skriftlige kilder. Etter brannen i 1476 lå fasaden og kaifronten på samme sted til 1900 (Ersland 2022). I 1420-årene lå fronten et sted mellom 1332-linja og 1476-linja **[U]**. Spillet bruker 1332-linja: det er den siste dokumenterte før vår tid | [V] grenser; [U] eksakt linje | MVP |
| Takene | Torvtak fra middelalderen [V]. Dagens teglstein er fra etter 1702-brannen [V Stiftelsen Bryggen]. Gråboks/MVP bruker torv og bordtak | [V] | MVP |
| **Mariakirken** | Bergens eldste sognekirke, bygget før 1160. Overdratt Kontoret 1408 | [V] | MVP (fasade) |
| **Vågen** | Den isfrie havna. Gikk lenger inn enn i dag (til dagens Domkirkegaten, i eldre tid). Strandlinja rundt år 1000 lå 100-150 m innenfor dagens kai | [V]; linja i 1420 som bryggefronten over [U] | **MVP** |
| **Holmen** | Håkonshallen (ferdig 1261). Magnus Lagabøtes tårn («kastellet ved sjøen», ca. 1273, ringmur, grav og vindebro). Kristkirken (første steinkirke, domkirke, revet 1531). Apostelkirken (ca. 1300, revet 1529-30). Kongsgården og bispegården (brent 1429) | [V] | Fase 3 |
| **Vågsbunnen** | Bunnen av Vågen. Mikaelskirken brant 1413. Skostredet: korteste vei mellom Bryggen og Stranden | [V] | Fase 2 |
| **Skomakerne** | De fem tyske lauene («de fif Amten»): bakere, barberere, buntmakere, gullsmeder, skomakere, ca. 150 mann. Skomakerne var sterkest og kunne sperre Skostredet. Oppløst 1560 | [V] Wikipedia; [U] tall for 1420-årene | Fase 2 |
| **Stranden** | Strandsiden sørvest for Vågen, de norske borgernes side | [V] grovt; detaljer [K] | Fase 2 |
| **Øvregaten** | Gata bak Bryggen. Gårdene gikk opp mot den | [V] | Fase 2 |
| **Nordnes** | Munkeliv kloster (grunnlagt 1107-1110, birgittinere fra 1420-årene, brent 1455). Rettersted nær Margaretakirken på nordøstsiden i middelalderen; flyttet til vestsiden på 1500-tallet | [V] | Fase 4 |
| Andre kirker i perioden | *Martinskirken:* på oversiden av Øvregaten, der Fløibanens nedre stasjon står i dag. Tysk kirke for Bryggen fra ca. 1400; biskop Aslak Bolt godkjente i 1408 Mariakirken og Martinskirken som sognekirker for tyskerne. *Nikolaikirken:* steinkirke øverst på Nikolaikirkeallmenningen (ved dagens nr. 5b), skadet eller ødelagt i brannen 1413, igjen 1476, ruin med steintårn ca. 1580 **[U]** om den var i bruk i 1420-årene. *Jonsklosteret:* augustinerkloster, kirka lå ved dagens Fortunen mellom Strandgaten og Tårnplass, brant 1561. *Korskirken* og *Olavskirken* (i dag Domkirken) står fortsatt. *Mikaelskirken* brant 1413 | [V] Byleksikon, Wikipedia | Fase 2-4 |

### 5.3 MVP-avgrensning

MVP = **Bryggen + Vågen**: 3-4 gårder i full detalj, kaia, et gårdsrom med svalgang, en
schøtstue, Mariakirken som fasade i bakgrunnen, og Vågen med Holmen og Stranden som silhuetter i
tåka. Resten av byen bygges ikke før Bryggen holder referansestandard.

---

## 6. Hovedhistorien

Gutten kommer i 1426 som 12-åring. Da er han 15 i 1429 og 41 i 1455.

| Kap. | År | Alder | Rang | Innhold | Valg og konsekvens |
|---|---|---|---|---|---|
| Prolog: **Ankomst med koggen** *(MVP)* | vår 1426 | 12 | ny junge | Koggen fra Lübeck legger til. Opplæring i å gå, ro og snakke. Gutten får gård og husbonde og lærer de tre første reglene: ingen ild, ingen kvinner, ingen handel på egen hånd | Ingen. Eleven lærer byen |
| 1: **Tyven i natt** *(MVP)* | høst 1426 | 12 | stuejunge | Noen stjeler fra gården. Gutten sniker og jager over svalganger og tak; det ender i et slagsmål i smuget. Første møte med vaktene og ettersøkt-systemet | Tar han tyven selv, eller roper han på vakta? Tyven er en sulten nordlandsgutt [S] |
| 2: **Uten motstand** | 1428 | 14 | stuejunge | Vitaliebrødrene plyndrer byen. Ingen forsvarer den. Gutten ser at noen i byen tjener på kaoset | Hjelper han en norsk familie å gjemme kornet? Rykte hos borgerne mot Kontoret |
| 3: **Brannen** | april 1429 | 15 | skutedreng | Voets 7 skip mot leidangsflåten i Vågen. Wismar-skipene kommer. Kongsgården og bispegården brenner. Gutten ror færing gjennom slaget | Ro ut for å redde folk fra de tapte skipene, eller berge lasten til husbonden? [S] |
| 4: **Nordfarerne** | 1430-årene | 16-20 | skutedreng → lærling | Jektene kommer. Gutten fører gjeldsboka og ser hva den gjør med en fiskerfamilie. Straffelekene som overgang til neste rang | Juks på vekta for husbonden? Slette en gjeld? |
| 5: **Egen handel** | 1440-årene | 22-30 | svenn (gesell) | Gutten lærer opp yngre junger og driver egen handel i det skjulte. Konflikt med skomakerne i Skostredet. Christian 1. på Bergenhus i 1450 | Brudd på Kontorets regler gir penger, men risiko |
| 6: **Høvedsmannen** | sommer 1455 | 41 | husbonde | Olav Nilsson kommer tilbake til Bergen og vil tvinge tyskerne under norsk lov. Kontoret planlegger | Hvem forteller han hva? |
| 7: **Munkeliv** | 1. sept. 1455 | 41 | husbonde | Angrepet på tinget. Flukten over Vågen. Klosteret brenner | Være med, nekte, advare, eller redde nonner og munker. Olav dør uansett |
| Epilog | 1490 | (død eller 76) | - | Mannboten. Elise Eskildsdatters kaperkrig. Hva ble av gutten? | Slutten avhenger av ryktet |

**Filmscener [S]:** én per kapittel inn og ut, laget i motoren (ingen video). Kamera og
animasjon styres av et lite sekvensverktøy (se §9.6).

---

## 7. Sideoppdrag og aktiviteter

Hver aktivitet er et minispill med egen mekanikk, ett læringsmål og en fraksjon.
Fraksjonene: **K** Kontoret, **B** Bergenhus/kongens menn, **N** norske borgere og håndverkere,
**Ki** kirken, **F** nordlandsfiskerne.

### 7.1 Fra bestillingen

| Aktivitet | Mekanikk | Læringsmål | Fraksjon |
|---|---|---|---|
| Heise og bære tørrfisk | Timing på vinsjen, balanse når du bærer (for mye last = du sakker og vakler) | Varen og arbeidet | K |
| Sortere etter kvalitet | Rask sortering: se, kjenn, legg i riktig haug (tydelige kjennetegn) | Kvalitet gir pris | K |
| Veie på bismer | Flytt loddet til armen ligger vannrett | Hvordan man veide | K, F |
| Laste koggen | Pakkepuslespill: tyngdepunkt og plass i lasterommet | Handel i stor skala | K |
| Prute med fiskere og kornhandlere | Bud og motbud, der den andre har en grense du må lese | Bytteforholdet fisk-korn | F, N |
| Gjeldsbok | Føre inn og ut, se fiskerens gjeld vokse | Nordfarergjelden | F, K |
| Juks på vekta | Risiko-meter: jo mer du jukser, jo større sjanse for å bli tatt | Makt og tillit | K mot F |
| Straffelekene | Overlevelse: pust i røyken, hold ut i vannet. Med «Dette vet vi» | Livet nederst på stigen | K |
| Kappro | Rytmeroing i takt (samme åretak som gråboksen) | Vågen og båtene | N |
| Smugling om natta | Sniking i mørke med lykt du kan skru av, vakter med syn | Regler og brudd | mot K, B |
| Dykke etter tapt last | Pust, mørke, finne og feste tauet | Sjøfart og risiko | K |
| Jage tyver fra koggene | Jakt og kamp på dekk og rigg | Livet i havna | K |

### 7.2 Nye forslag (8)

| Aktivitet | Mekanikk | Læringsmål | Fraksjon |
|---|---|---|---|
| **Runepinnen** | Les og risse runer på trepinner: eierlapper på varer, beskjeder, en bønn. Puslespill med runealfabetet | På Bryggen er det funnet 597 runeinnskrifter, mest på trepinner [V]. Folk skrev i hverdagen | N, K |
| **Brannvakt og bøttekjede** | Patruljér gårdene om natta og finn ulovlig ild; når det brenner, organiser bøttekjeden før det sprer seg | Ildforbudet og hvorfor (brannene 1248, 1476, 1702) [V] | K, N |
| **Jekta kommer** | Møt en nordlandsfisker på kaia; samtale der du ser handelen fra *hans* side, med gjelden fra fjoråret | Perspektivbytte: fiskerens liv | F |
| **Skomakerverkstedet i Skostredet** | Syrytme og lærstykker; senere en sperret gate du må forhandle deg gjennom | De tyske håndverkerne og konflikten med Kontoret [V] | N, K |
| **Budet til Bergenhus** | Lever et brev til kongens skriver gjennom porten på Holmen: sniking, passord, timing på vaktene | Kongens makt og hvor den satt | B |
| **Ølstua i Øvregaten** | Terningspill med innsats og juks; slåsskamp hvis du blir tatt. Fyllas mørke side vises med alvor | Byliv og fattigdom | N |
| **Rottejakt på lagerloftet** | Fang rotter før de ødelegger fisken, med katt og feller | Lagring av mat og tap | K |
| **Messe i Mariakirken** | Bære lys og svare i messen på latin uten å bomme; lær hvorfor Kontoret hadde sin egen kirke (1408) [V] | Kirken og tyskernes egen kirke | Ki, K |

---

## 8. Systemene

### 8.1 Kamp (gråboksen prøver dette)
Arkade-slagsmål: lett slag (venstre klikk / J), tungt slag (hold venstre / K), blokk (høyre / L),
unnamanøver (Q), avslutning (F når fienden vakler). Slag «suger» spilleren mot nærmeste fiende.
Fienden varsler før den slår (lyser opp, fast hint nederst). Blokkerer du like før treffet, får
du motslag. Treffpause, kamerarisk og skadetall over den som blir truffet. Blod blir liggende.
Senere: kniv, kølle, sverd (Sword_Attack finnes i animasjonspakken), flere fiender som venter
på tur (Arkham-modellen).

### 8.2 Ettersøkt og rettspleie
Tre nivåer: **mistenkt** (folk ser deg), **etterlyst** (byvakta/Kontorets folk leter), **jaget**
(alle vakter, hunder [S]). Hvem som jager avhenger av offeret og stedet: Kontoret dømte sine egne
etter egne regler [V: eget samfunn med egne lover], kongens høvedsmann og bytinget resten.
Rettspleien skal være lærerik: bytinget (fjerdingene hadde 12 representanter hver, bylov 1276
[V]), bøter, pisking, landsforvisning, og galgen på Nordnes som game over. Byfolk kan drepes, men
konsekvensen er hard og varig.

**Tyveribolken i bylova (1276), egen oversettelse fra norrønt [V tekst; oversettelsen bør
sjekkes mot en trykt norsk oversettelse]:**

| Hva | Første gang | Neste gang |
|---|---|---|
| Stjeler mat fordi han sulter og ikke kan arbeide | Ingen straff | |
| Stjeler for en verdi av 1 øre | Kjøper seg fri fra pisking med 3 mark sølv | 6 mark. Kan han ikke betale: pisket og brennemerket med en nøkkel på kinnet. Tredje gang: pisket, og kongen tar 6 mark. Fjerde gang: drept |
| Stjeler for en halv mark | Bot på 13 mark og 8 ertog, eller landsforvist | Drept |
| Stjeler for en mark eller mer | Straffes av kongens mann, men beholder livet | Mister jord, eiendom og livet |
| Den bestjålne tar tyven med godset | Godset bindes på ryggen hans (om det er vitner), og han føres bundet til *gjaldkeren*, kongens mann som holdt orden i byen | |

Dette passer spillet: den første sulten er tilgitt, og straffen øker for hver gang. Fattigdom og
hardhet i samme lov. Slagsmål og drap (mannhelgebolken) er ikke oversatt ennå **[K]**.

### 8.3 Rykte
Fem målere (K, B, N, Ki, F), fra -100 til 100. Handlinger flytter dem, ofte to i motsatt
retning. Ryktet låser opp oppdrag, priser og hjelp, og avgjør slutten.

### 8.4 Ferdigheter (bedre av bruk)
Styrke (bære), slåsskamp (treffe og blokkere), pruting (lese grensen), roing (takt), regning og
lesing (gjeldsbok, runer, brev). Ingen poengfordeling: man blir god av å gjøre det.

### 8.5 Rangstigen
Junge → skutedreng/lærling → svenn → husbonde. Hver rang låser opp gårder, oppdrag og
rettigheter (nøkkel til lageret, egen stue, egen handel).

### 8.6 Økonomi
Lønn i mat og husrom, små penger fra arbeid, store penger fra egen handel som bryter Kontorets
regler. Mynt, vekt og bytteforhold: se §4.3.

### 8.7 Dagsplaner
Hver figur har en enkel plan: arbeid, måltid, kirke, ølstue, søvn. Porten til Kontoret stenges
om kvelden [K/S]. Gårdsvakter med hunder [K/S].

### 8.8 Dyr
Bryggehunder [K], griser i smugene, måker over fisken, rotter, katter. Dyr er CC0-glTF.

### 8.9 Skip
Kogger inn og ut av Vågen. Jekter med tørrfisk om sommeren [V/U]. Spilleren ror færing (MVP),
senere styrer kogge, rir hest og trekker vogn.

### 8.10 Vær og år
Regn og tåke det meste av tiden, snø om vinteren, lyse sommernetter. Været påvirker oppdrag:
tåke gjør smugling lettere, storm stenger havna, regn slukker brann (og demper lyder).

---

## 9. Teknisk plan

### 9.1 Motor-audit: hvorfor den gamle motoren føltes janky

Lest i `src/games/engine/` (GameEngine.ts er 3646 linjer, alt i én klasse).

**1. Figurer og animasjon: stive, dårlige overganger, ingen vekt**
- Figurene er bokser og kuler uten skjelett: `CharacterBuilder.ts:150-260` (BoxGeometry for
  kropp, armer og bein). Ingen ekte animasjon kan spilles på dem.
- Gangen er en fast sinus: `GameEngine.ts:2782-2791` svinger bein og armer med
  `Math.sin(this.time * 10)` uansett fart. Føttene glir fordi steglengden ikke følger farten.
  NPC-er har samme svakhet: `CharacterBuilder.ts:270-292`.
- Overgangen fra gange til stillstand er `rotation.x *= 0.85` per bilde
  (`GameEngine.ts:2790`). Den er avhengig av bildefrekvensen og har ingen kurve.
- Landing er en skalering av hele figuren (`GameEngine.ts:2797-2800`): tegneserie-squash, ikke vekt.
- `AssetLoader.ts:39` kan laste glTF, men motoren har ingen `AnimationMixer` noe sted.

**2. Bevegelse og kamera: glir, setter seg fast, går gjennom vegger, rykker**
- Ingen akselerasjon: `GameEngine.ts:3461-3465` setter forflytningen rett til
  `moveDir * SPEED * dt`. Figuren starter og stopper momentant, og føles som den glir.
- Feil kobling mellom bilde og fysikk: forflytningen settes én gang per *bilde*
  (`GameEngine.ts:3476`), men `PhysicsWorld.ts:437-447` tar 0, 1 eller flere *faste* steg. På
  bilder uten fysikksteg går bevegelsen tapt, på bilder med to steg brukes den bare én gang.
  Posisjonen leses rett ut uten interpolering (`GameEngine.ts:2744-2749`). Det gir hakking,
  verst på Chromebook der bildefrekvensen svinger.
- Kameraet sjekker vegger med én tynn stråle (`PhysicsWorld.ts:423-434`). Strålen slipper gjennom
  glipen mellom to vegger og ser ikke at kameralinsen stikker inn i veggen ved siden av.
- Kameraet glattes *etter* veggsjekken (`GameEngine.ts:3254`): når armen blir kortere, ligger
  kameraet igjen inne i veggen i flere bilder.
- I trange smug gir den opp med vilje: `GameEngine.ts:3289`, `if (clampFactor < 0.05) return ideal`
  setter kameraet bak veggen.
- «Setter seg fast»: autostep 0,3 m med minste bredde 0,15 m (`PhysicsWorld.ts:347`) og trapper
  bygget som ekte trinn, maks 45° skråning (`PhysicsWorld.ts:350`).

**3. Utseende og helhet: prosedyralt, billig, spillene ligner hverandre**
- Teksturene tegnes på canvas i koden (`TextureKit.ts`), ikke fotografiske PBR-teksturer.
- Guiden anbefaler `flatShading` + vertex-farger og én felles look uten fargegradering
  (`BUILD_GAME_GUIDE.md` §6.2). På lav-tier slås skygger og etterbehandling av (§6.3).
- Alle spill bygges av de samme deklarative byggeklossene (`buildRoom`, `addProp`) og fire
  figurtyper (`types.ts:106`: scientist, farmer, noble, monk). Da ligner de hverandre.

### 9.2 Tre veier

| | A) Ny, liten Three.js-motor | B) Babylon.js | C) Fikse den gamle |
|---|---|---|---|
| Hva | Bygget for dette spillet rundt Rapier KCC, fjærarm-kamera, AnimationMixer og strømming | Ferdig motor med fysikk (Havok), animasjon, navmesh, LOD | Rette de konkrete feilene i GameEngine.ts |
| Bundle | Three og Rapier finnes allerede i prosjektet (`three`-chunk, `rapier`-chunk). Ny kode i gråboksen: ca. 2900 linjer (motor, gråboks og side) | `@babylonjs/core` 9.29 er 72 MB upakket; et normalt tre-ristet oppsett er etter erfaring 1,5-2,5 MB minifisert, pluss Havok-WASM (`@babylonjs/havok` 4,4 MB upakket). Anslag, ikke målt | Ingen ny kostnad |
| Økosystem | Samme som resten av boka. Mikrospillene, artiklene og R3F bruker Three | Nytt API, ny feilsøking, to 3D-motorer i samme app. Hele kjeden (lys, materialer, verktøy) må læres på nytt | Kjent |
| Risiko | Vi må bygge strømming, navmesh og LOD selv (Three har LOD-klassen; navmesh via `recast-navigation` (MIT) ved behov) | Lavere teknisk risiko på systemer, høyere risiko for at det aldri blir «vår» motor | Høy: problemene sitter i grunnmuren (monolitt på 3646 linjer, bokser som figurer, bilde-dt mot fast fysikk). 8+ spill er bygd på den, og de skal ikke røres |
| Gjenbruk | Bare det som er bevist godt: Rapier-oppsettet, ideer fra `SeascapeBuilder` | Ingenting | Alt |

### 9.3 Anbefaling: A

Ny, liten motor i Three.js. Gråboksen er beviset: på én økt løste den alle tre audit-punktene
med Rapier KCC, faste steg med interpolering, fjærarm med kulekast og ekte skjelettanimasjon
i klippenes egen takt. Det som mangler (strømming, LOD, navmesh, sekvensverktøy) er godt kjente
teknikker som passer inn i samme lille arkitektur. Babylon gir mer ferdig, men koster en ny
verktøykjede og en ekstra motor i appen. Å fikse den gamle betyr å røre grunnmuren under spill
som ikke skal røres.

**De gamle spillene røres ikke.** Den nye motoren bor i `src/games/bryggen/motor/` og importerer
ingenting fra `src/games/engine/`.

### 9.4 Arkitektur (bygget i gråboksen)

| Fil | Ansvar |
|---|---|
| `motor/physics.ts` | Rapier-verden, kollisjonsgrupper (verden, figurer, båter, tynne ting kameraet ignorerer), stråle- og kulekast |
| `motor/input.ts` | Tastatur, mus, styrepute. Simulering leser per steg, kameraet per bilde |
| `motor/character.ts` | KinematicCharacterController med akselerasjon, sving med vekt, hopp med nådetid, kantklatring (lav kant = hvelv, høy = dra seg opp, grep i lufta) |
| `motor/animator.ts` | AnimationMixer med to lag: fartsblandet bevegelse (hver figur oppgir gå-/jogge-/sprintfart, og der spilles klippet i sin egen takt) og helkropp med inn/ut-toning. Sydde klipp (underkropp fra ett, overkropp fra et annet) |
| `motor/camera.ts` | Fjærarm: kulekast større enn nærplanet, trekkes inn umiddelbart, slippes sakte ut; skulderen kastes sideveis og krymper i smug |
| `motor/boat.ts` | Færing med åretak (dytt bare mens bladene er i vannet), vannmotstand, kollisjon via egen KCC |
| `motor/combat.ts` | Spillerkamp og fiende-AI (tilnærme, sirkle, varsle, slå, komme seg, vakle) |
| `motor/gore.ts` | Blodsprut og flekker som to InstancedMesh-er |
| `graboks/game.ts` | Løkka: faste 1/60-steg, interpolert tegning, treffpause og sakte film |
| `motor/meshkit.ts` | Geometri i bøtter per materiale, UV i meter, fargefaktor per hjørne, kollider-beskrivelser |
| `motor/materials.ts` | PBR-materialer fra teksturene i `public/games/bryggen/textures/`, miljølys, lav-nivå |
| `motor/streaming.ts` | Strømming per celle (§9.6) |
| `bygg/moduler.ts`, `bygg/gard.ts`, `bygg/bryggen.ts` | Modulsettet, den første gården og scenen rundt |

Hver fil under 800 linjer. Løkka simulerer i faste steg og tegner så ofte nettleseren vil.

### 9.5 Ytelsesbudsjett (Chromebook 1366×768, mål: jevne 30 FPS, helst 60)

| Post | Budsjett |
|---|---|
| Oppløsning | 1366×768, pixelRatio maks 1 |
| Tegnekall | ≤ 250 per bilde (instansiering av planker, tønner, fisk) |
| Trekanter | ≤ 400k synlige (figurer ≤ 15k nær, ≤ 2k langt unna) |
| Teksturminne | ≤ 160 MB GPU (1K-teksturer, 2K bare nær spilleren; KTX2/Basis) |
| Skygger | Én retningsbestemt, 1024², kaskade bare rundt spilleren; av på lav-tier |
| Figurer med skjelett | ≤ 12 animert fullt, resten med lav oppdateringsrate eller instansierte |
| Fysikk | Bare nærområdet aktivt; sim-tid ≤ 2 ms |
| JS per bilde | ≤ 6 ms |

**Målt i gråboksen** (Playwright, 1366×768, ruten: sprint inn i gårdsrommet, snu kameraet,
ut mot Vågen; 600 bilder). Maskinen har ikke ekte GPU tilgjengelig i WSL uten skjerm, så det
er målt med to programvare-rasteriserere:

| Oppsett | Snitt FPS | 95-persentil | Sim-tid |
|---|---|---|---|
| llvmpipe (Mesa, CPU), skygger på | 116 | 35,8 ms | 0,04 ms |
| llvmpipe, skygger av | 158 | 36,0 ms | 0,02 ms |
| llvmpipe, CPU strupet 4× (Chromebook-anslag), skygger på | 67 | 80,1 ms | 0,27 ms |
| llvmpipe, CPU strupet 4×, skygger av | 150 | 20,9 ms | 0,11 ms |
| SwiftShader (Chromiums egen programvare), skygger på | 18-31 | ~70 ms | 0,22 ms |

Scenen har 40-200 tegnekall og 28-43k trekanter. Simuleringen koster nesten ingenting (under
0,3 ms selv strupet), så taket er GPU-en. Tallet som gjelder er det eieren leser av måleren
øverst til høyre på sin egen Chromebook. Med `?skygger=0` måles uten skygger.

**Målt på den første gården** (02.10.2026, samme rute og oppløsning, llvmpipe via Vulkan). Maskinen
hadde mer last enn ved forrige måling, så gråboksen er målt på nytt ved siden av:

| Oppsett | Snitt FPS | 95-persentil | Sim-tid | Tegnekall | Trekanter |
|---|---|---|---|---|---|
| Gråboks, skygger på | 38 | 33,4 ms | 0,24 ms | ca. 60 | 28k |
| Gård, full kvalitet | 22 | 50-67 ms | 0,40 ms | 65-125 | 46-64k |
| Gård, `?kvalitet=lav` | 53 | 33,3 ms | 0,23 ms | 64-110 | 48-62k |
| Gård, full, CPU strupet 4× | 21 | 66,7 ms | 1,83 ms | 65 | 51k |
| Gård, lav, CPU strupet 4× | 52 | 33,4 ms | 0,80 ms | 71 | 48k |

Tegnekall og trekanter ligger godt under budsjettet. Det som koster på en programvare-rasterizer er
pikslene: tre teksturoppslag, normalkart, miljølys og skygger på hver flate. Lav-nivået fjerner
normal- og AO-kart, miljølys og skygger og ser nesten likt ut. Hvilket nivå Chromebooken skal få som
standard, avgjøres av måleren på eierens egen maskin.

### 9.6 Strømming og LOD

**Status 02.10.2026:** bygget i `motor/streaming.ts`. Celler lastes innen 120 m og kastes bak 180 m;
middels-nivået (husene som bokser og prismer i flat farge, én tegning per celle) vises bak 70 m.
Kolliderne lages og fjernes med cella. Cellene er foreløpig én gård eller allmenning bred (18 × 61 m),
bygget i kode med `import()`, ikke glTF. Fjernt nivå (silhuettkort) er ikke laget; tåka gjør jobben.

- Byen deles i celler på ca. 60×60 m (en gårdsrekke, Holmen, Vågsbunnen ...). Hver celle er en
  egen glTF/JSON lastet med `import()`/fetch når spilleren er innen 120 m, og kastet ved 180 m.
- Tre nivåer per celle: **nær** (full geometri, PBR, kolliderer), **middels** (sammenslåtte
  bokser med bakt tekstur, ingen kollisjon), **fjern** (silhuett-kort i tåka). Tåka er en del av
  LOD-en: den skjuler alt bak 120 m.
- Kollidere lages bare for nær-celler. Rapier-kroppene fjernes når cellen kastes.
- Bygningene bygges i kode av moduler (laftevegg, svalgang, gavl, torvtak, bordtak, trapp), slått
  sammen til én geometri per materiale per hus (få tegnekall).
- Figurer: full skjelettanimasjon nær; lavere mixer-rate (15 Hz) på 20-40 m; bak 40 m bare
  instansierte, statiske eller ingen.
- Sekvensverktøy for filmscener: tidslinje av kamera-skudd, figur-klipp og replikker,
  spilt av i samme løkke (ingen video).

### 9.7 Asset-liste (bare CC0 som kan lastes ned automatisk)

| Hva | Kilde | Lisens | Automatisk nedlasting | Status |
|---|---|---|---|---|
| Animert figur, 46 klipp (gange, jogg, sprint, hopp, slag, rulling, treff, død, sitte, sverd, svømme, kjøre) | Quaternius, *Universal Animation Library* (Standard), speilet på GitHub `J-Ponzo/gltf-universal-animation-library` | CC0 1.0 | Ja (`raw.githubusercontent.com`), lisensfil med | **I bruk** i gråboksen (22 klipp, 2,3 MB GLB) |
| Treteksturer (planker, laft, bord) | Poly Haven: `wood_plank_wall` (laft), `weathered_planks` (bordvegg), `old_planks_02` (bordtak), `old_wood_floor` (bryggedekke), `wood_planks_dirt` (gårdsrom), `rough_wood` (stolper, trapper) | CC0 | Ja, åpent API (`api.polyhaven.com/files/<id>`) | **Hentet** 02.10.2026: 1K, WebP, farge + normal + ARM i `public/games/bryggen/textures/` (se KILDE.md) |
| Tak | Poly Haven `sparse_grass` (torv: mosegrodd, lav gress) | CC0 | Ja | **Hentet** (`torv_*`). Strå (`thatch_roof_angled`) passer ikke Bryggen |
| Bakke, gjørme, stein | Poly Haven `brown_mud_leaves_01` (gjørme i smug og allmenninger); ambientCG `Ground0xx`, `Rock0xx` ved behov | CC0 | Ja (ambientCG: `ambientcg.com/get?file=<id>_1K-JPG.zip`) | **Hentet** (`gjorme_*`) |
| Treverk alternativ | ambientCG `WoodFloor0xx`, `Wood0xx`, `Planks0xx` | CC0 | Ja | Verifisert API |
| Dyr (hund, gris, katt, måke, rotte) | Quaternius *Animal Pack Vol.2* (hund, katt) og *Farm Animals* (gris, hest, ku, sau) på OpenGameArt, direkte zip uten innlogging | CC0 | Ja, men bare FBX. Konvertert til GLB med `fbx2gltf` uten feil | **Prøvd, ikke tatt inn.** 560-800 trekanter, flat lavpoly-stil og bare 2 klipp (stå, gå). Stilen kolliderer med PBR-byen. Holder som stand-in; ekte løsning [K]. Måke og rotte mangler |
| Realistiske menneskefigurer med klær | Det finnes få CC0-figurer som er realistiske og animerte. Kandidater: MakeHuman-eksport (CC0) retargetet til UAL-skjelettet; Quaternius-figurer | CC0 | MakeHuman krever lokal app, ikke nedlasting **[K]** | Største asset-risiko |
| Klatreanimasjon, sidesteg, garde-gange | Mangler i gratis-UAL (finnes i UAL Pro, også CC0, men betalt) | CC0 | Nei (betalt) | Gråboksen bruker Push_Loop + Crouch som erstatning |

Mixamo brukes ikke (krever innlogging).

### 9.8 Kjente svakheter i gråboksen (ærlig)

- Klatringen bruker Push_Loop og Crouch_Idle som stand-in. Den mangler ekte hendene-på-kanten-klipp.
- Fienden sirkler med garden oppe og glir litt på føttene (ingen sidesteg-klipp i gratispakken).
- Mannequin-figuren er nøytral og glatt. Den er for å prøve følelsen, ikke utseendet.
- Fienden har ingen veifinning (navmesh). Klatrer gutten opp på svalgangen, blir fienden stående under.
- Konsollen viser én advarsel fra Rapier sin init (samme som i den gamle motoren).
- Fotlås ble prøvd og forlatt (2026-10-02): UAL-klippene er stiliserte, så fart målt fra
  fotsporet gir tull (jogg-foten 4,5 m/s, sprint «saktere» enn jogg). I tillegg fant
  oppslaget aldri fotbeina (GLTFLoader fjerner punktum fra nodenavn), og sprint-klippet gikk
  i firedobbel takt. Nå bestemmer figurens egne farter takten. Liten fotglid i jogg kan synes.

---

## 10. Asset-tracker (MVP)

- [ ] Hero: Bryggen fra Vågen i regn, 1426, koggen legger til (for galleriet)
- [~] Bryggens gårder: modulsett (laft, svalgang, gavl, torvtak, bordtak, trapp, vinsj). Bygget og
  brukt på én gård (`/test/bryggen-gard`). Nabogårdene er plassholdere i flat farge til den første
  er godkjent. Mangler: utkraget overetasje, glugger, inngang i husene, schøtstue og ildhus innvendig
- [ ] Kogge (navigerbar senere; MVP: legger til i introen)
- [ ] Færing (gråboksens form, med ekte treteksturer)
- [ ] Figurer: junge, husbonde, svenn, nordlandsfisker, tyv, byvakt
- [ ] Dyr: hund, måke, rotte
- [ ] Lyd: regn, måker, plankegang, åretak, folk på plattysk og norsk. Funnet: *Rain (loopable)*, 4 OGG-løkker, CC0, direkte nedlasting fra OpenGameArt. *Steps in wood floor* (CC0, OpenGameArt). Måker, åretak og stemmer **[K]** (neste sted å lete: Wikimedia Commons, der lyd er direkte nedlastbar; sjekk lisens per fil)

---

## 11. Kilder

Arnesen, H. G. (2019). *Hvem var hanseatene?* Det Hanseatiske Museum og Schøtstuene, Museum Vest. Hentet 02.10.2026 fra [hanseatiskemuseum.museumvest.no](https://hanseatiskemuseum.museumvest.no/hvem-var-hanseatene)

Hartvedt, G. H. & Skreien, N. (2009). *Bryggen*. Bergen byleksikon, Bergen byarkiv. Hentet 02.10.2026 fra [bergenbyarkiv.no](https://www.bergenbyarkiv.no/bergenbyleksikon/arkiv/1424543)

Hartvedt, G. H. & Skreien, N. (2009). *Vitaliebrødrene*. Bergen byleksikon, Bergen byarkiv. Hentet 02.10.2026 fra [bergenbyarkiv.no](https://www.bergenbyarkiv.no/bergenbyleksikon/arkiv/1425242)

Hartvedt, G. H. & Skreien, N. (2009). *Spill*. Bergen byleksikon, Bergen byarkiv. Hentet 02.10.2026 fra [bergenbyarkiv.no](https://www.bergenbyarkiv.no/bergenbyleksikon/arkiv/1423295)

Hartvedt, G. H. & Skreien, N. (2009). *Middelalderkirker (oversikt)*. Bergen byleksikon, Bergen byarkiv. Hentet 02.10.2026 fra [bergenbyarkiv.no](https://www.bergenbyarkiv.no/bergenbyleksikon/arkiv/14317214)

Hartvedt, G. H. & Skreien, N. (2009). *Rettersteder*. Bergen byleksikon, Bergen byarkiv. Hentet 02.10.2026 fra [bergenbyarkiv.no](https://www.bergenbyarkiv.no/bergenbyleksikon/arkiv/1422831)

Det Hanseatiske Museum og Schøtstuene. (u.å.). *Drengeliv*. Museum Vest. Hentet 02.10.2026 fra [hanseatiskemuseum.museumvest.no](https://hanseatiskemuseum.museumvest.no/drengeliv)

Det Hanseatiske Museum og Schøtstuene. (u.å.). *Rommene i Schøtstuene*. Museum Vest. Hentet 02.10.2026 fra [hanseatiskemuseum.museumvest.no](https://hanseatiskemuseum.museumvest.no/rommene-i-schotstuene)

Eldjarn, G. (2024). *jekt*. Store norske leksikon. Hentet 02.10.2026 fra [snl.no/jekt](https://snl.no/jekt)

Hammer, E. (u.å.). *Bergenhus festning*. Store norske leksikon. Hentet 02.10.2026 fra [snl.no/Bergenhus_festning](https://snl.no/Bergenhus_festning)

Store norske leksikon. (u.å.). *Rosenkrantztårnet*. Hentet 02.10.2026 fra [snl.no/Rosenkrantztårnet](https://snl.no/Rosenkrantzt%C3%A5rnet)

Herteig, A. E. & Johannesen, N. H. (2026). *Bryggen i Bergen*. Store norske leksikon. Hentet 02.10.2026 fra [snl.no/Bryggen_i_Bergen](https://snl.no/Bryggen_i_Bergen)

Holmboe, H. & Salvesen, H. (2024). *Det tyske kontor*. Store norske leksikon. Hentet 02.10.2026 fra [snl.no/Det_tyske_kontor](https://snl.no/Det_tyske_kontor)

Lokalhistoriewiki.no. (2026). *Munkeliv kloster*. Norsk lokalhistorisk institutt. Hentet 02.10.2026 fra [lokalhistoriewiki.no/Munkeliv_kloster](https://lokalhistoriewiki.no/Munkeliv_kloster)

Opsahl, E. & Salvesen, H. (2026). *Olav Nilsson*. Store norske leksikon. Hentet 15.07.2026 fra [snl.no/Olav_Nilsson](https://snl.no/Olav_Nilsson) (via artikkelen hansadrapet-1455)

Orning, H. J. (2015). *Fiskeeventyret*. Norgeshistorie, Universitetet i Oslo. Hentet 02.10.2026 fra [norgeshistorie.no](https://www.norgeshistorie.no/senmiddelalder/1007-fiskeeventyret.html)

Salvesen, H. & Petersen, L. I. R. (2025). *vitaliebrødrene*. Store norske leksikon. Hentet 02.10.2026 fra [snl.no/vitaliebrødrene](https://snl.no/vitaliebr%C3%B8drene)

Stiftelsen Bryggen. (u.å.). *Byggemåte*. Hentet 02.10.2026 fra [stiftelsenbryggen.no](https://stiftelsenbryggen.no/verdensarven-bryggen/byggemate/)

Wikipedia. (2026). *De fif Amten*. Hentet 02.10.2026 fra [no.wikipedia.org](https://no.wikipedia.org/wiki/De_fif_Amten) (sekundærkilde, bekreftes mot Bryggens Museum før bruk)

Wikipedia. (2026). *Slaget ved Bergen 1429*. Hentet 02.10.2026 fra [no.wikipedia.org](https://no.wikipedia.org/wiki/Slaget_ved_Bergen_1429) (sekundærkilde for flåtetallene, merket [U])

**Assets:** Quaternius. (2025). *Universal Animation Library* (Standard). CC0 1.0. Hentet 02.10.2026 fra [github.com/J-Ponzo/gltf-universal-animation-library](https://github.com/J-Ponzo/gltf-universal-animation-library). Poly Haven (CC0) og ambientCG (CC0), API-ene verifisert 02.10.2026.

Ersland, G. A. (2022). *Perspektiv på Bryggen og det historiske bylandskapet* [Lysbildenotat]. Stiftelsen Bryggen. Hentet 02.10.2026 fra [stiftelsenbryggen.no](https://stiftelsenbryggen.no/sb/wp-content/uploads/VEDLEGG-2.-GAE-Bryggens-bylandskap.pdf)

Hartvedt, G. H. & Skreien, N. (2009). *Allmenninger*. Bergen byleksikon, Bergen byarkiv. Hentet 02.10.2026 fra [bergenbyarkiv.no](https://www.bergenbyarkiv.no/bergenbyleksikon/arkiv/1424448)

Hartvedt, G. H. & Skreien, N. (2009). *Nikolaikirken*. Bergen byleksikon, Bergen byarkiv. Hentet 02.10.2026 fra [bergenbyarkiv.no](https://www.bergenbyarkiv.no/bergenbyleksikon/arkiv/1425080)

Holm, P., Ludlow, F., Scherer, C. mfl. (2019). The North Atlantic Fish Revolution (ca. AD 1500). *Quaternary Research, 108*, 92-106. [doi.org/10.1017/qua.2018.153](https://doi.org/10.1017/qua.2018.153)

Holst, H. (u.å.). *Norges mynter til slutten av 16. århundrede*. Danskmønt.dk. Hentet 02.10.2026 fra [danskmoent.dk](https://www.danskmoent.dk/artikler/holst.htm)

Nielsen, M. A., Friðriksdóttir, J. K. & Rindal, M. (Red.). (2022). *Magnus Håkonsson Lagabøtes bylov og farmannslov*. Bokselskap / Nasjonalbiblioteket. Hentet 02.10.2026 fra [bokselskap.no](https://www.bokselskap.no/wp-content/themes/bokselskap2/tekster/pdf/bylov.pdf) (tyveribolken s. 111, egen oversettelse)

Salvesen, H. & Hofstad, K. (2024). *våg - masseenhet*. Store norske leksikon. Hentet 02.10.2026 fra [snl.no](https://snl.no/v%C3%A5g_-_masseenhet)

Store norske leksikon. (u.å.). *bismerpund*. Hentet 02.10.2026 fra [snl.no/bismerpund](https://snl.no/bismerpund)

Wikipedia. (2026). *Allmenning (gater)*, *Martinskirken (Bergen)*, *Nikolaikirken i Bergen*. Hentet 02.10.2026 fra [no.wikipedia.org](https://no.wikipedia.org/wiki/Allmenning_(gater)) (sekundærkilder, stemmer med byleksikonet)

### Kildeoppgavene (status 02.10.2026)

1. ~~Bryggefronten og allmenningene i 1420-årene.~~ Løst så langt åpne kilder rekker (§5.2):
   1332-linja og 1476-linja er grensene, allmenningene er navngitt. Gjenstår: de eksakte
   utgravningsplanene (Herteig, *The Bryggen Papers*) for å tegne kartet i meter **[K]**.
2. ~~Vakthunder og stengt port.~~ Ingen kilde funnet. Blir designvalg [S] (§4.2).
3. ~~Mynt, vekt og priser.~~ Løst (§4.3). Priser bare som bytteforhold fisk mot korn, rundt 1500 [U].
4. Kontoret under plyndringene 1428-29: ikke funnet i åpne kilder [U]. Les Brekke (2024) **[K]**.
5. ~~Straffer for tyveri.~~ Løst (§8.2). Slagsmål og drap (mannhelgebolken) gjenstår **[K]**.
6. ~~Kirkenes plassering.~~ Løst for Martinskirken, Nikolaikirken og Jonsklosteret (§5.2).
