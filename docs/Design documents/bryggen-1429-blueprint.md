# Blueprint: Bryggen 1429 (arbeidstittel)

> Et stort 3D-tredjepersonsspill: en åpen, levende by i Bergen fra 1420-årene til 1455, sett
> gjennom øynene til en tysk stuejunge på Hansakontoret. GTA i middelalderen, med tonen fra
> Kingdom Come: Deliverance.

| Felt | Verdi |
|---|---|
| id (foreløpig) | `bryggen-1429` |
| Parent (Fag) | Historie (kobles også til samfunnskunnskap og KRLE) |
| Emner i boka | `historie/middelalderen/hanseatene`, `historie/norsk-middelalder/hansadrapet-1455` |
| Status | Følelse og motor godkjent av eieren 02.10.2026. Første gård bygget av modulsettet, godkjent av eieren 02.10.2026 («ser skambra ut», også uten lyseffektene). Kvalitet byttes med knapp/G mens spillet går. Nabogårdene bygget av modulsettet 02.10.2026, eieren spiller på full. Utkraging og glugger godkjent av eieren 02.10.2026 («ser bra ut»). Schøtstua kan gås inn i (ildsted, ljore, benker, bord), bygget 02.10.2026, venter på eierens spilltest. Bua og lagerloftet i vestre forhus kan gås inn i (tørrfisk, bismer, gjeldsbok, trapp, svalgangsdør), bygget 02.10.2026, venter på eierens spilltest. Mariakirken står som kulisse bak gårdene i nordenden (tvillingtårn, basilika, gotisk kor, tynnere tåke så den synes fra Vågen), bygget 02.10.2026, venter på eierens spilltest. Figurer med klær (junge, husbonde, svenn, skutedreng, stuedreng) og sju folk som sitter og jobber i bua og schøtstua, bygget 02.10.2026, venter på eierens spilltest. Øvregaten med ølstua, Mariakirken innvendig og veien til Bergenhus med borggården kan gås til, og oppdragene «Brev til Mariakirken» og «Budet til Bergenhus» kan spilles til ende, bygget 02.10.2026, venter på eierens spilltest. Navn ikke valgt |
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
| **Vågsbunnen** | Bunnen av Vågen. Mikaelskirken brant 1413 (og 1393) og ble ikke bygget opp igjen; den var sognekirke for de tyske skomakerne. Tyske skomakere leide Vågsbunnen gård av kongen i 1330 og holdt til i Vågsbunnen gjennom middelalderen. Skostredet: den nordligste veien mellom Bryggen og Stranden, med opptil 36 skomakerboder med to håndverkere i hver og brygger mot Vågen | [V] Byleksikon «Skostredet», Wikipedia «Vågsbunnen» | Bygget 02.10.2026 (§10) |
| **Skomakerne** | De fem tyske lauene («de fif Amten»): bakere, barberere, buntmakere, gullsmeder, skomakere, ca. 150 mann. Skomakerne var sterkest og kunne sperre Skostredet. Oppløst 1560 | [V] Wikipedia; [U] tall for 1420-årene | Fase 2 |
| **Stranden** | Strandsiden sørvest for Vågen, de norske borgernes side | [V] grovt; detaljer [K] | Fase 2 |
| **Øvregaten** | Gata bak Bryggen. Gårdene gikk opp mot den. Hvor høyt den lå over Bryggen i 1420-årene, hvordan den var lagt og hvilke hus som sto der, er ikke funnet **[K]** | [V] | Bygget 02.10.2026 (§10) |
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
| **Runepinnen** | Les og risse runer på trepinner: eierlapper på varer, beskjeder, en bønn. Puslespill med runealfabetet | På Bryggen er det funnet rundt 670 runeinnskrifter, mest på trepinner [V Wikipedia «Bryggen inscriptions»; tallet 597 som sto her, er ikke funnet igjen]. Folk skrev i hverdagen | N, K |
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
standard, avgjøres av måleren på eierens egen maskin. Eieren spilte på full kvalitet og syntes begge
nivåene ser bra ut (02.10.2026). Standard er full; eleven bytter med «Grafikk»-knappen eller G, og
valget huskes i nettleseren.

**Målt med nabogårdene av modulsettet** (02.10.2026, samme rute, oppløsning og llvmpipe). Forrige
commit (plassholderne i flat farge) ble kjørt i en egen worktree og målt annenhver gang med den nye,
så maskinlasten er lik:

| Oppsett | Snitt FPS | Laveste | Tegnekall | Trekanter |
|---|---|---|---|---|
| Plassholdere, full | 22 | 19 | 27-103 | 36-62k |
| Nabogårder, full | 19,5 | 17 | 32-157 | 39-122k |
| Plassholdere, lav | 47 | 39 | 30-105 | 37-62k |
| Nabogårder, lav | 40 | 31 | 30-156 | 39-122k |

Fra Vågen med hele fronten i bildet: ca. 155 tegnekall og 120-180k trekanter, 17-20 FPS på full. Alt
holder seg innenfor §9.5. Prisen (ca. 12 % på full, 15 % på lav) er pikslene: teksturert tre der
plassholderne var flat farge. Den første versjonen hadde hele nabogården som én klump og ga 176k
trekanter; delt i to halvdeler og med laftehoder på 5 kanter ble det 122k, men FPS-en flyttet seg
nesten ikke. Det bekrefter at programvare-rasteriseren er pikselbundet. En gård tar ca. 12 ms å bygge
når cella strømmes inn. Chromebook-tallet mangler fortsatt (eieren hadde ikke maskinen tilgjengelig);
på stasjonær går full kvalitet «nydelig».

Med utkraging og glugger (samme to bilder fra Vågen): 19 FPS på full og 37,5 på lav, 182-190
tegnekall og 145-157k trekanter (fra 149k). Ingen nye materialer, så tegnekallene står stille.

Inne i schøtstua (02.10.2026, samme maskin): 21-22 FPS på full og 51-53 på lav, 33-187 tegnekall og
46-135k trekanter avhengig av hvor kameraet ser. Innredningen ligger i husets egne bøtter; bålet koster
tre tegnekall og ett felles punktlys, stein ett til.

Rotter og lyd (02.10.2026, programvare-GL, samme maskin): rottene koster ett tegnekall (pluss ett i
skyggen) og ca. 720 trekanter per rotte som synes; gjemte rotter tegnes ikke. JS-tiden målt i siden
over 600 bilder med 12 rotter (9 framme): 0,06 ms per bilde i snitt for rottene og 0,015 ms for
lyden. Maskinen var så lastet at FPS-måleren sto fast på 15-16 både med og uten rotter og lyd, og med
og uten etterbehandling (`?post=0`), så forskjellen kunne ikke måles der.

Inne i bua (02.10.2026, samme maskin, programvare-GL): 14-18 FPS på full og 39 på lav, 105-148
tegnekall og 131-151k trekanter. Tørrfisken kostet først 70k trekanter (rund fisk, begge sider av
stabelen); flat fisk på ti trekanter, og bare på sidene som synes, tok den ned til ca. 10k.

Med figurer og folk (02.10.2026, samme maskin, Vulkan-llvmpipe, målt annenhver gang mot forrige
commit i en egen worktree, to runder; maskinlasten svingte mye, så FPS-en er støyete):

| Vinkel | Før: FPS, tegnekall, trekanter | Etter: FPS, tegnekall, trekanter |
|---|---|---|
| Bua, mot pulten og bismeren | 8-14, 105, 156k | 11-12, 106, 153k |
| Bua, husbonden ved pulten | 9-16, 102, 156k | 12-14, 102, 148k |
| Schøtstua, mot ilden og benken | 10-17, 42, 56k | 13-14, 44, 57k |
| Schøtstua, husbonden ved bordet | 13-18, 30, 46k | 14-15, 31, 43k |
| Kaia, jungen forfra | 17-21, 44, 111k | 14-17, 42, 93k |

Første versjon kostet ca. 14k trekanter per figur (98k for sju folk), og alle ble tegnet selv utenfor
bildet. Etter sammenslåingen på 2 cm og frustum-culling for folkene er en figur en brøkdel av
mannequinen, og trekantene står omtrent stille selv med sju folk. Hver synlig figur er ett tegnekall
(pluss skygge). FPS-en flyttet seg ikke ut over støyen. Chromebook-tallet mangler fortsatt.

Med folk som går (02.10.2026, programvare-GL, 1366×768, full kvalitet): 38-40 figurer lastet langs
fronten. Fra Vågen 294 tegnekall og 428k trekanter, mot 272 og 354k med folkene skjult; i gårdsrommet
224 mot 212 tegnekall. En figur er 6,7k trekanter nær og 2,5k på det grove nivået bak 13 m, uten
skygge, og folk lenger unna enn 45 m tegnes ikke. Scenen uten folk ligger allerede over 250
tegnekall fra Vågen på full kvalitet; det må ses på før flere gårder får innhold.

Tegnekallene kuttet (02.10.2026, SwiftShader, 1366×768, full kvalitet, fotokameraet låst; målt med
`renderBufferDirect` pakket inn per pass, fem bilder per kamera, to kjøringer, tallene var like hver
gang). Vågen: `pos [4, 5, -34]`, `look [6, 3, 12]`. Gårdsrommet: `pos [0, 1.7, 3]`, `look [0, 1.2, 30]`. Totalen er
`renderer.info`; skygge og scene er tellingen per pass (den kan avvike med et par kall).

| Kamera | Før: kall (skygge, scene), trekanter | Etter: kall (skygge, scene), trekanter |
|---|---|---|
| Vågen | 322 (74, 249), 497k | 202 (44, 159), 346k |
| Gårdsrommet | 249 (74, 176), 407k | 173 (44, 130), 378k |

Hva tegnekallene gikk til: den første gården var én `MeshKit` per hus, 12 stykker med 5-8 materialer
hver (68 kall pluss 29 i skyggen), og nabogårdene 15-16 kall hver fordi halvdelene dobler
materialene. Bua var 77k trekanter i ett kall (innredningen), tegnet to ganger fordi den sto i
skyggen. Færingen var 13 kall. Kuttet: gården i to halvdeler (som nabogårdene) med innredningen i en
egen del uten skygge som skjules bak 30 m; halvdelene tegnes samlet lenger unna enn 30 m fra gutten
(uten skygge); færingen i én geometri per materiale; celler bak 110 m (tett tåke) tegnes ikke.
Skjermbildene før og etter er like utenom det som beveger seg (folk, måker, skip). I gårdsrommet tegnes
naboene nå samlet, så trekantene der sank mindre. Igjen: skipene (4 kall og 22k trekanter i skyggen),
allmenningen (16 kall), silhuettene i tåka (20 bokser, ett kall hver når man ser mot Vågen fra kaia)
og havbunnen under det ugjennomsiktige vannet (ett kall).

Trafikken, Vågsbunnen, Nordnes og flere folk (02.10.2026, SwiftShader/Vulkan i Playwright, 1366×768, full
kvalitet, fotokameraet låst, fem avlesninger etter 9 s; main i egen dev-server på samme maskin):

| Kamera | main: ms, tegnekall, trekanter | ny: ms, tegnekall, trekanter |
|---|---|---|
| Vågen `[4, 5, -34]` → `[6, 3, 12]` | 71, 203, 297k | 72, 234, 359k |
| Gårdsrommet `[0, 1.7, 3]` → `[0, 1.2, 30]` | 79, 200, 424k | 78, 220, 458k |
| Kaia `[-8, 1.7, -1.5]` → `[6, 2.5, 6]` | 82, 183, 375k | 80, 206, 425k |
| Torget `[17, 1.7, 4]` → `[19, 3, 30]` | 80, 205, 340k | 77, 222, 367k |

Tiden per bilde flytter seg ikke (programvare-GL er pikselbundet). Tegnekallene øker med 20-35: skipene som
seiler (tre per skip og tre i skyggen), færingene (skrog, årer, roer og last), mannskapet på koggen og de som
prater på kaia. Fra Vågen er det nå 234 av 250 i budsjettet, så nye ting i Vågen bør slås sammen. Lasten i
lekteren var åtte tegnekall (fire bunter à to deler) og er slått sammen til én. Inne i Skostredet 54-104
tegnekall og 130-230k trekanter. Nordnes er ett tegnekall. Trekantene i gårdsrommet var over 400k allerede
før (424k), nå 458k: figurene på kaia. Chromebook-tallet mangler fortsatt.

### 9.6 Strømming og LOD

**Status 02.10.2026:** bygget i `motor/streaming.ts`. Celler lastes innen 120 m og kastes bak 180 m;
middels-nivået (husene som bokser og prismer i flat farge, én tegning per celle) vises bak 70 m.
Gårdene er delt i to halvdeler nær gutten og samlet bak 30 m; innredningen skjules bak 30 m, og
ingenting tegnes bak 110 m utenom landemerkene (§9.5, tegnekallene kuttet).
Kolliderne lages og fjernes med cella. Cellene er foreløpig én gård eller allmenning bred (9-20 × 61 m; nabogårdene har ulik bredde),
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
| Lyd (regn, vind, bølger mot brygge, ild, måker, rotter, fottrinn på tre og gjørme, åretak) | Freesound (forhåndslytting uten innlogging), OpenGameArt, Wikimedia Commons | CC0 / offentlig eie, sjekket per fil | Ja | **I bruk** 02.10.2026, se `public/games/bryggen/audio/KILDE.md` |
| Klatreanimasjon, sidesteg, garde-gange | Mangler i gratis-UAL (finnes i UAL Pro, også CC0, men betalt) | CC0 | Nei (betalt) | Gråboksen bruker Push_Loop + Crouch som erstatning |

Mixamo brukes ikke (krever innlogging).

### 9.8 Kjente svakheter i gråboksen (ærlig)

- Klatringen bruker Push_Loop og Crouch_Idle som stand-in. Den mangler ekte hendene-på-kanten-klipp.
- Fienden sirkler med garden oppe og glir litt på føttene (ingen sidesteg-klipp i gratispakken).
- Mannequin-figuren er nøytral og glatt i gråboksen. I Bryggen har den fått klær (§10), men kroppen er
  fortsatt mannequinens: brede skuldre, ingen fingre, et enkelt ansikt.
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
  brukt på én gård (`/test/bryggen-gard`), godkjent av eieren 02.10.2026. De 14 nabogårdene er bygget
  av samme sett (`bygg/nabogard.ts`), trukket fra et frø: enkelt- eller dobbeltgård, husbredde,
  gårdsrom, antall hus, etasjer, torv/bordtak, svalganger, tone og gavl (bordkledd med vinsj eller
  laftet). To gårder ved siden av hverandre får aldri samme tone, og som oftest ulik gavl. Kaia følger
  hoppene i `FRONT_JOG` med sidevegg i bolverket. Utkraget overetasje og glugger med luker lagt
  til modulsettet 02.10.2026: forhusene krager 0,22-0,45 m per etasje (hver femte har rett gavl),
  båret av bjelkehoder; glugger på framgavlen og langveggen mot gårdsrommet, noen med luka slått
  opp. Hvor mye gårdene på Bryggen kraget i 1420-årene, er ikke målt opp **[K]**. Utkragingen og gluggene godkjent av eieren 02.10.2026.
- [~] Schøtstua innvendig (02.10.2026): man går inn den åpne døra bakerst i gårdsrommet. Hule
  laftevegger med sotet innside, golv over bakken, ildsted av stein midt på golvet med flammer, glør
  og røyk som stiger mot ljoren, gryte i kjetting fra en stang over ilden, langbenker langs veggene,
  bord på bukker med skåler, kjenger og brød, ved i hjørnet. Ildlyset flakker, og dagslyset dempes
  når kameraet er inne. At schøtstuene hadde åpen ild, er [V]; innredningen i 1420-årene er ikke
  beskrevet i kildene vi har **[K]**, så den følger eldre norske røykstuer **[S]**. Steinteksturen er
  Poly Haven `rock_wall_08` (CC0). Mangler: ildhus, ekte gårdsnavn og -bredder fra utgravningsplanene **[K]**
- [~] Bua og lagerloftet (02.10.2026): vestre forhus kan gås inn i fra kaia (bu-døra står åpen),
  fra gårdsrommet og fra svalgangen. Bua: stabler av tørrfisk med halene ut, bunter surret med tau,
  kornsekker, tranfat på slind, bismeren med en bunt i kroken, skrivepult med gjeldsboka og kiste.
  Bratt trapp langs veggen opp gjennom et hull i bjelkelaget til loftet, med flere stabler og bunter
  innenfor den åpne loftsdøra under vinsjen. Ingen ild: lyset kommer inn dører og glugger [V forbud
  mot åpen ild]. At forhusene var lagerhus med uisolerte loft, er [V]; innredningen i 1420-årene
  er ikke beskrevet i kildene vi har **[K]**, så den følger museet og senere bilder **[S]**
- [~] Mariakirken som fasade (02.10.2026, `bygg/mariakirken.ts`): oppe i bakken bak gårdene i nordenden,
  på en kirkegård med mur og trekors. Kleberstein, treskipet basilika med høyt midtskip og lave
  sideskip under pulttak, tvillingtårn i vest på 27 m til gesimsen med forhall imellom, romanske
  vinduer høyt oppe bare på sørsida, sørportalen, og gotisk kor med spisse vinduer og strebepilarer
  [V SNL (Ekroll & Thune 2025), Wikipedia]. Tårntoppene i dag er fra 1500-tallet [V]; de lave
  pyramidetakene er et valg **[S]**, for hvordan tårnene endte i 1420-årene er ikke funnet **[K]**.
  Taktekkingen er heller ikke funnet **[K]**. Vinkelen mot gårdsrekkene og avstanden er valgt for
  spillet **[S]**. Kirken har egne materialkopier med halvparten så tett tåke, ellers forsvinner
  den bak 100 m. Kirken kan nå gås inn i (02.10.2026, `bygg/mariakirken-inne.ts`, `bygg/buer.ts`): kirkegården
  er flyttet 7 m bakover på nordsida av Øvregaten og har mur rundt, port mot gata og en gangsti av heller til
  sørportalen, som er et ekte hull. Skipet og koret er hule murer: sideskipene med vinduer høyt oppe, arkaden
  med fire buer på pilarer mellom midtskipet og sideskipene, lysgluggene over bare på sørsida, korbuen og det
  gotiske koret med spisse vinduer, alt med ekte hull man ser dagslyset gjennom [V formen, SNL/Wikipedia].
  Inne: steingolv med gravheller, to trinn opp i koret, høyalter med linduk og to lys, et sidealter i nordre
  sideskip, krusifiks på en bjelke i korbuen, åpent tak med bjelker. Ingen benker: menigheten sto (allment
  kjent, men ikke lagt inn i kildelista **[K]**). At
  Kontorets folk ble begravet i kirken, er [V §5.2]; hellene, alterne, lysene, krusifikset og det åpne taket
  er [S], for innredningen i 1420-årene er ikke funnet **[K]**. Altertavla som står der i dag, er ikke tatt
  med: når den kom til kirken, er ikke sjekket **[K]**. Presten (herr Johannes) og klokkeren (Bertolt) er
  [S]. Dagslyset dempes inne (rommet står skjevt som kirken, `Rom.yaw`), og ildlyset står ved alterlysene.
  Ca. 34 tegnekall og 45k trekanter inne med full kvalitet. Venter på eierens spilltest
- [~] Nikolaikirkeallmenningen (02.10.2026, `bygg/allmenning.ts`, `bygg/torg.ts`, `bygg/nikolaikirken.ts`):
  18 m bred gjørmeallmenning med plankegang opp midten [V bredden]. Torget: fire salgsboder (tørrfisk,
  korn, kurver, tønner), brønn med vinde, slede med tønne, sledespor og pytter. At allmenningen var torg til
  1470 og at den første torgplassen trolig lå øverst, er [V Byleksikon, Wikipedia]; bodene, brønnen og
  sleden er **[S]**. Rådhuset (stefnustova) med steinkjeller, laftet stue, svalgang og trapp man kan gå opp:
  at rådhuset sto ved allmenningen og kirken (ca. 1300-1558), er [V]; utseende og plass er **[S]**, for det
  er ikke funnet **[K]**. Nikolaikirken øverst: romansk steinkirke med ett skip og vesttårn like bredt som
  skipet [V Wikipedia, «trolig»], på langs av Øvregaten [V], tårnet mot Holmen [S: utledet]. Om den var i
  bruk i 1420-årene, er **[U]**; byleksikonet sier skadet eller ødelagt 1413 «og igjen 1476», så her er den
  under reparasjon **[S]**: tårnet med nytt tak (byklokka og brannvakta [V bylova 1276]), nytt tak over
  vestre del av skipet, bare sperrer, sot og stillas i øst, hogd stein og mørtelkar foran. Målene er **[S]**.
  Kirkegården står bak grensa. Fra 02.10.2026 står kirken og kirkegården 7 m lenger bak, på nordsida av
  Øvregaten, med lav mur og stengt grind mot gata; steintrappa går opp til gata gjennom støttemuren, der
  grinda står åpen **[S]**. Gapestokk er ikke lagt
  inn: ingen kilde funnet for en gapestokk på allmenningen i 1420-årene **[K]**. Ca. 10k trekanter og
  15 tegnekall for hele cella. Venter på eierens spilltest. Torgfolk (02.10.2026, `bygg/torgfolk.ts`):
  en fiskekone, en kornselger, en bondekone med kurver og en bødker står i bodene; en kjøpekone går
  mellom bodene og brønnen og stopper ved disken, en borger går mellom kornboden og tønneboden, en
  tjenestejente henter vann med bøtte ved brønnen, nordlandsfiskeren går opp plankegangen og ser på
  kirka, og en svenn går opp trappa til rådhuset og venter ved døra. Samtaler: kornselgeren forteller
  at kornet kommer med koggene fra hansabyene og at Kontoret styrer det [V §4.3]; borgeren gir et norsk
  syn på tyskerne (en av ti i byen, egne lover, ugifte, strid om makta [V §3, §4.2]). Begge slutter med
  «Dette vet vi». Hvem som sto på torget og hva de solgte, er **[S]**; draktene til norske kvinner og
  håndverkere er **[S]**, ikke sjekket mot Bryggens Museum **[K]**
- [~] Holmen og Stranden som kulisser (02.10.2026, `bygg/holmen.ts`, `bygg/stranden.ts`), i stedet for de grå
  boksene. Holmen ligger forbi kaienden (+x) og stikker ut i Vågen: kastellet ved sjøen (Magnus Lagabøtes tårn,
  1270-årene, «ringmurstårn med vollgrav og vindebro», kapell med gotiske vinduer [V Byleksikon]; omtrent
  kvadratisk, tre etasjer og kjeller [V Lokalhistoriewiki]; høyden og pyramidetaket **[S]**), ringmuren med tinner
  og et porttårn mot byen (ringmur etter 1248 [V]; løpet og tinnene **[S]**, ikke funnet **[K]**), Håkonshallen
  (gråstein med hjørnekvadrer av kleberstein, tre høyder, spissbuevinduer [V Byleksikon], ca. 37 x 16,4 m
  [V Wikipedia]; trappegavlene er kjent fra Scholeus ca. 1580, i 1420-årene **[U]**), Kristkirken nordvest for
  hallen (treskipet stein, 40 x ca. 20 m [V Byleksikon]; tårnet, koret og takene **[S]**, ingen bilder finnes),
  Apostelkirken (gotisk kapell, revet 1529 [V UiB]; utseendet **[U]**/**[S]**) og trehus i kongsgården og ved
  naustet i bispegården (begge brent 1429 [V Byleksikon]; husene **[S]**). Stranden: glisne grupper av lave
  laftehus med torvtak, naust med gavlen mot sjøen, tømmerstabler og et skip på stokker, trukket fra et frø.
  Bylova 1276 satte av stranda til skipsbygging og tømmer, og husene spredte seg dit etter 1300 [V Wikipedia
  «Strandsiden»]; hvor tett det var bygd i 1420-årene, er ikke funnet **[K]**, så det er glissent **[S]**.
  Avstander og vinkler er komprimert **[S]**. Holmen er statisk med to nivåer (`THREE.LOD`): nær kaienden 3
  tegnekall, ellers 1 (steinbyggene med tynn tåke). Stranden er én celle bak grensa: 3 tegnekall nær, 1 lenger
  unna, ingenting fra kaia. Målt med kulissene skjult og vist: +1 til +4 fra Vågen, +3 ved kaienden, +6 når
  begge er nær; fra kaia og Vågen samme eller færre tegnekall enn de 20 boksene før (147/163 mot 148/168).
  Stranden har ingen kollidere: grensene stopper spilleren før den. Venter på eierens spilltest.
  Holmen og Bergenhus kan gås til (02.10.2026, `bygg/bergenhus.ts`): Holmen står 24 m lenger ut, og kaia
  fortsetter forbi den siste gården til porten i ringmuren, med en plankevei, en rampe av steinheller og
  tre lagerhus innerst. Porttårnet har en ekte gjennomgang med hvelv. Innenfor er borggården foran
  Håkonshallen en celle med kollidere (bakke, ringmur, port, hallen, de to trehusene i kongsgården, nå av
  modulsettet), en skriverbu med pult under et skråtak, vakta på bysida av porten, en vakt til innenfor,
  en som går over borggården og kongens skriver ved pulten. At høvedsmannen satt på Bergenhus som kongens
  fremste mann i byen, er [V §3]; hvor porten var, hvordan borggården var lagt og hva som lå mellom
  Bryggen og Holmen i 1420-årene, er ikke funnet **[K]**. Avstanden er komprimert, og porten, vaktene,
  skriverboden og lagerhusene er **[S]**. Veien 65 tegnekall, borggården 46. Venter på eierens spilltest
- [~] Øvregaten (02.10.2026, `bygg/ovregaten.ts`): gata bak alle gårdene, 2 m opp på en støttemur av stein med
  brystning, plankeveit i midten og gjørme langs kantene. Kirketrappa i Nikolaikirkeallmenningen er oppgangen.
  På nordsida står Nikolaikirken (rett over trappa) og Mariakirken lenger øst, og imellom og vestover norske
  laftehus med gavlen mot gata, trukket fra et frø, med smale smug stengt av plankegjerder. Øst for
  Nikolaikirken ligger ølstua: langveggen med åpen dør mot gata, ildsted midt på golvet under ljoren, benker
  og bord, ølkona Gunhild ved gryta og tre bergensere på benkene; en bødker og øltønner ved døra, og en
  tjenestejente som henter øl i bøtte. En borger går gata, og koner står og går vestover. At Øvregaten gikk
  bak Bryggen og at gårdene gikk opp mot den, og at Martinskirken lå på oversiden og Nikolaikirken på langs
  av den, er [V §5.2]; hvem som bodde langs gata, er ikke funnet **[K]**, så de norske husene er **[S]**. Høyden, støttemuren, plankeveiten, husene og
  ølstua er **[S]**; hvor høyt gata lå og hvordan den så ut i 1420-årene, er ikke funnet **[K]**. Draktene
  til ølkona og klokkeren er **[S]**, ikke sjekket **[K]**. Gatecellene bytter til flatt nivå bak 45 m:
  med full kvalitet koster gata +4 tegnekall fra gårdsrommet og torget (160 og 182 mot 156 og 176 før),
  +5 fra Vågen. Venter på eierens spilltest
- [~] Vågen, vær og etterbehandling (02.10.2026): vannet har bølger (lange dønninger, krapp vind,
  fin krusning nær kameraet), falsk speiling av husrekka og ringer fra regndråper. Regnet faller i en
  boks rundt kameraet og skrus av inne. Full kvalitet får ett etterbehandlingspass: kantutjevning,
  kjølig fargetone ute og varm inne ved ilden, vignett og filmkorn. Bildet ellers er pikselt likt det
  eieren godkjente (målt). Koster ca. 1 FPS i programvare-GL, ingenting på lav. Venter på eierens spilltest
- [~] Lys og stemning (02.10.2026, `motor/stemning.ts`, `himmel.ts`, `vaat.ts`, `luft.ts`, `post.ts`):
  tre stemninger (`?lys=kveld|graatt|morgen`), standard er kveld etter regnet med lav sol over Vågen,
  varme fasader og lange skygger. Himmel med skyer og sol, solglitter i vannet, våte flater med pytter,
  røyk fra ljorene og støv som lyser i sollyset gjennom døra i bua. Full kvalitet får SSAO, glød,
  lysstråler, solglød i tåka og dis over Vågen. «graatt» er nær bildet eieren godkjente først. Målt i
  Edge med GPU (AMD, 1366×768, median ms per bilde, main mot ny): full 14-21 mot 16-26, lav 10-12 mot
  10-13 (uendret). Kaia er dyrest (+5-8 ms: skygger 2048, SSAO ca. 1, røyk ca. 1, og folkene nær
  kameraet animeres fullt). Rettet samme kveld: «morgen» har sola mot sør utpå formiddagen (en ekte
  morgensol står i øst bak gårdene og legger hele fronten i skygge) **[S]**; i skyggen ute løftes
  fyllyset (øyet venner seg, og veggene kaster lys ned i gårdsrommene); pyttene er små, mørke og
  ruere, og pyttene som geometri på torget er fjernet; det drypper fra takskjeggene og
  svalgangstakene når det er vått. Fjellene rundt Bergen står i himmelen: Fløyen rett bak Bryggen,
  Blåmanen, Rundemanen og Sandviksfjellet mot nord, Ulriken lenger inne, Løvstakken, Damsgårdsfjellet
  og Lyderhorn over Vågen og Askøy lavt over Byfjorden. Høydene er ekte [V]; plasseringene er grovt
  avlest og litt flyttet **[S]**. I gråvær forsvinner toppene i skyene. Alt dette sammen: +0,1 til
  +0,7 ms (Edge med GPU, median, to runder mot main). Venter på eierens spilltest
- [~] Døgn og vær (02.10.2026, `motor/dogn.ts`, `stemning.ts`, `himmel.ts`): eieren spilltestet lyset og
  fjellene («ser flott ut») og ba om døgnsyklus. Et døgn er 18 minutter: 10 minutter dag og 8 minutter
  natt **[S]**. Sola står opp i øst-nordøst, går gjennom sør og ned i nordvest og står maks 45° høyt,
  som sent på sommeren i Bergen **[V]**. Stemningen blandes fra nøkkelbilder etter solhøyden (natt,
  blåtime, solnedgang, kveld, dag) og mot grå utgaver når det trekker over. Om natta lyser månen (lavt
  i sør), med stjerner, månehalo i skyene og måneglitter i vannet. Bygene kommer og går (oppholdsvær
  2,5-5 min, regn 1-2,5 min), og det drypper fra takene bare mens det regner og et par minutter etter.
  Spillets rom var tenkt med +x mot nord; Bryggen ligger egentlig langs Vågen mot nordvest **[V]**.
  Fjellene og solbanen er nå regnet om med den dreiningen: Fløyen står bak og til høyre fra Vågen,
  Fløyfjellet rett bak, og Ulriken over enden av Vågen (synlig fra kaia). Kostnad: ingen målbar
  (Edge med GPU, median, to runder mot main; natta som kvelden). Venter på eierens spilltest
- [~] Bære og veie (02.10.2026, `graboks/baering.ts`, `graboks/bismer.ts`): E ved stabelen på kaia gir
  gutten en bunt i armene (saktere gange, ingen sprint, hopp eller slag). Ved bismeren i bua henger
  bunten i kroken, og eleven flytter hanken med A og D til stanga ligger vannrett, og leser av
  merket i bismerpund. På den nordiske bismeren flyttes hanken langs stanga, ikke loddet [V SNL
  «bismer»]. Merkene står tettere jo tyngre varen er, slik de gjør på en ekte bismer. Bismerpund
  ca. 5,1 kg [V bylova 1276]; at en bunt er omtrent en våg (ca. 3 bismerpund) er [U]. Leser han
  av før stanga ligger rett, veier svennen på nytt. Juks på vekta: fra tredje bunt hvisker svennen
  at gutten skal si et halvt pund mindre på nordlendingens fisk (2 på tastaturet). Sjansen for at
  fiskeren merker det øker for hver gang (20, 40, 60 prosent ...). Da møter fiskeren gutten med det
  neste gang de snakker, og samtalen ender med en «Dette vet vi» om bylovas bismerpund [V] og at vi ikke
  vet om eller hvor ofte noen jukset på Bryggen [U]. Selve ordren fra svennen er [S]. Venter på eierens spilltest
- [~] Kogge og jekter i Vågen (02.10.2026, `bygg/skip.ts`, `motor/skrog.ts`, `motor/kogge-modell.ts`,
  `motor/jekt-modell.ts`): en kogge fortøyd et par meter ut fra kaia ved Nikolaikirkeallmenningen, en
  jekt lastet med tørrfisk langs kaia vest for den første gården, og en mindre jekt for anker lenger ute.
  Koggen: flat bunn, høye sider, rette stavner som heller ut, én mast med mastekurv og råseil, roret på
  akterstevnen og kasteller forut og akter [V SNL «kogge»]; kravellbygd under vannet og klinkbygd over
  [V], vist klinkbygd siden bunnen ikke synes. 23 x 7,2 m, innenfor 80-100 fot og 1:3-1:4 [V]; mast,
  kasteller og fribord er [S]. Jekta: klinkbygd og flatbunnet, ett råseil, tørrfisk høyt opp mot masta,
  vengen akter [V SNL «jekt»], men målene og vengen gjelder senere århundrer [U]; 15 m [S]. Seilene er
  beslått (rullet sammen på råa) fordi skipene ligger i havn [S]. Laget i kode med råtre-teksturen og
  fargefaktor per hjørne: to tegnekall per skip, ca. 30k trekanter for alle tre. De gynger med samme
  bølger som vannet, og skroget har en konveks kollider så færingen ikke ror gjennom. Venter på eierens
  spilltest. Gjenstår: koggen som legger til i introen, folk om bord, last som losses, navigerbar kogge.
- [~] Færing (02.10.2026): klinkbygd skrog med fire bordganger per side, stavner i begge ender, ripe,
  tiljer og tofter, med råtre-teksturen fra byen [S: formen er en vanlig vestlandsfæring, ikke målt
  opp fra et funn]. Venter på eierens spilltest
- [~] Figurer (02.10.2026, `motor/figur.ts`, `bygg/folk.ts`): UAL-mannequinen kledd i kode, én
  geometri og ett materiale per drakt. Kjortel med belte og skjørt som følger lårene, hette med kappe
  over skuldrene og lang tut (oppe hos de voksne, nede som krage hos guttene), hoser og lave sko.
  Jungen (spilleren) er 1,58 m, smal og med litt større hode, kort kjortel i ufarget vadmel. Husbonden
  har lang blå kjortel, rød hette, mage, skjegg og pung. Svennen, skutedrengen og stuedrengen har egne
  farger og høyder. At menn i Nord-Europa gikk slik kledd i senmiddelalderen, er [V] (Herjolfsnes:
  hetter med tut, kjortler og hoser, laget så sent som i 1430-årene; Bockstensmannen 1340-1370), og
  på Bryggen er det funnet sko og tekstiler i hopetall [V Bymuseet]. Fargene er [S]: ufarget for
  guttene, plantefarget for husbonden. Snitt og farger på Bryggen i 1420-årene er ikke sjekket mot
  Bryggens Museum **[K]**. Fienden i Bryggen-scenen bruker svenn-drakten. Nordlandsfiskeren (02.10.2026) står på kaia og forteller om gjelda fra sin side
  (samtale med «Dette vet vi»); klærne hans er [S], ikke sjekket [K]. Norske byfolk på torget
  (02.10.2026): fiskekone, bondekone, kjøpekone og tjenestejente (kjortel til anklene, lys hette som
  hodeduk, tjenestejenta med hetta nede), kornselger, borger og bødker; alt [S], sjekkes [K]. Gjenstår:
  tyv, byvakt.
- [~] Folk i gården (02.10.2026): i bua fører husbonden gjeldsboka ved pulten, svennen leser av
  bismeren og skutedrengen står med en bunt i armene. I schøtstua sitter en svenn og en skutedreng på
  benken ved ilden, stuedrengen rører i gryta og en husbonde spiser ved bordet. Løkker på stedet, ingen
  samtaler. De strømmes med cella og har kollider. Hvem som fantes i gården (husbonde, svenner, drenger,
  alle ugifte menn og gutter) er [V]; hva rangene gjorde er fortalt for 1600/1700-tallet [U]; hvem som
  sitter og gjør hva er [S]. Folk som går (02.10.2026, `bygg/vandrer.ts`): skutedrengen bærer bunter
  fra en stabel på kaia opp gårdsrommet og inn i bua, svennen går fra schøtstua ned til kaia og ser ut
  over Vågen. I hver nabogård går en voksen langs kaia og en gutt bærer bunter opp gårdsrommet. De
  stopper og sier fra når gutten står i veien. Samtaler (02.10.2026, `bygg/samtaler.ts`): E ved
  husbonden i bua gir en samtale med valg (1-3) om arbeidet, gjelda, hvem som bestemmer og de tre
  reglene fra prologen, og den slutter med en «Dette vet vi»-tekst. De andre sier en kort replikk.
  Kameraet går over skulderen på gutten, og den han snakker med snur seg. Venter på eierens spilltest
- [~] Trafikk i Vågen (02.10.2026, `bygg/trafikk.ts`): en kogge og en jekt seiler inn fra havet forbi
  Holmen med seilet satt, ankrer, beslår seilet, ligger noen minutter, snur sakte og seiler ut igjen i
  tåka. Tre færinger med roere: ferja mellom kaia foran den første gården og Stranden (med en passasjer),
  lekteren som henter tørrfisk fra jekta for anker og ror den til kaia, og en fisker som ror inn fra havet
  og legger til ved en bryggetrapp i Vågsbunnen. Fire færinger ligger fortøyd ved bryggene der. De viker
  for hverandre, for skipene og for gutten, og skipene og færingene har kollidere som flytter seg med
  (gutten kan ikke ro gjennom dem). Mannskap på koggen ved kaia. Kogger inn og ut og jekter med tørrfisk
  er [V/U §8.9]; at folk ble rodd over Vågen og varene losset med småbåter fra skip for anker, er **[S]**:
  slik fungerte havner uten dypvannskai, men det er ikke funnet en kilde på Vågen i 1420-årene **[K]**.
  Rutene, tidene og hvem som ror, er [S]. Vannet tegnes ikke lenger innenfor skrogene (det sto opp i
  jektene og færingen før). Venter på eierens spilltest
- [~] Vågsbunnen og håndverkerne (02.10.2026, `bygg/vaagsbunnen.ts`, `bygg/verksted.ts`,
  `bygg/kirker-vaagsbunnen.ts`): kaia fortsetter vest for den siste gården til Auta allmenning (Bryggens
  sørgrense [V]) med plankegang, sledespor og en steintrapp opp til Øvregaten, og videre inn i Skostredet.
  På sjøsida av gata står skomakerboder med ryggen mot kaia og bryggetrapper ned til vannet i smauene
  imellom; i hver bod sitter to skomakere, mesteren ved disken og svennen ved benken [V: opptil 36 boder
  med to i hver, brygger mot Vågen]. På landsida står verkstedene til de andre amtene: bakeren med
  steinovn som gløder og brød på disken, gullsmeden med esse og begre, buntmakeren med pelser som henger
  fra taket, barbereren med en kunde i stolen, en norsk smed med esse, belg og ambolt, og to skomakere til
  [V de fem amtene; S at de lå her og hvordan bodene så ut]. Hver bod har en luke slått opp over disken og
  et skilt (sko, brød, beger, skinn, bekken, hestesko) [S; barbererbekkenet som skilt er kjent fra senere
  tid U]. Bak verkstedene: bolighus med gjerder og ved, og ruinen av Mikaelskirken med sotede murer,
  steinrøys, forkullede bjelker og trekors rundt [V at den brant 1413 og ikke ble gjenreist; S hvordan
  ruinen så ut, ikke funnet K]. I vest ligger en bom over gata med en skomakersvenn som vakt; han og
  mester Hans har samtaler som slutter med «Dette vet vi» om Skostredet og amtene [V at skomakerne kunne
  stenge gata, 1507]. Bak bommen svinger gata rundt bunnen av Vågen, og Korskirken står på neset [V at den
  ble reist der; S utseendet]. Kunder, en skomakersvenn som bærer skinn, en tjenestejente med vann, en
  borger som går opp trappa, en fisker til smia og en bondekone går i gata. Hvordan Vågsbunnen så ut i
  1420-årene, er ikke funnet **[K]**; avstandene er komprimert som resten av byen **[S]**. Draktene til
  håndverkerne er [S], ikke sjekket [K]. Venter på eierens spilltest
- [~] Nordnes over Vågen (02.10.2026, `bygg/nordnes.ts`): en ås som stiger bak Stranden og går ned i
  sjøen ytterst, med Munkeliv kloster i lia (steinkirke med vesttårn og tre hus rundt en klostergård) og
  naust og laftehus ved sjøen. At klosteret lå på Nordnes og at birgittinerne overtok det i 1420-årene,
  er [V §5.2]; utseendet er **[S]**, ikke funnet **[K]**. Retterstedet er ikke med. Flat farge i ett
  tegnekall, med tynnere tåke (en blek silhuett i disen). Åsen fortsetter bak Stranden til bunnen av
  Vågen. Venter på eierens spilltest
- [~] Flere folk langs Bryggen (02.10.2026): på kaia foran de fleste nabogårdene står to og prater (en fra
  gården og en fra byen eller båtene), med prateklippet. Alt [S]. Venter på eierens spilltest
- [~] Dyr: måker bygget 02.10.2026 (`motor/maaker.ts`): 16 måker i ett tegnekall, laget i kode
  (ingen asset: lavpoly-pakkene kolliderte med stilen, §9.7). De sirkler over kaia, lander på
  kaidekket og vannet, snur seg og hopper, og letter i flokk når gutten spurter forbi eller går helt
  inntil. Venter på eierens spilltest. Rotter bygget 02.10.2026 (`motor/rotter.ts`, `motor/rotte-modell.ts`):
  svartrotte laget i kode (ca. 720 trekanter, pels som støy i pikselen), alle i ett tegnekall og animert i
  vertex-shaderen (trav, sprang der kroppen strekker seg, snusing, reiser seg, halen slapp i bue eller
  rett bak). De bor i bua og på lagerloftet, langs bolverket og under svalgangene, aldri midt i
  gårdsrommet. De rusler langs veggene, stopper og snuser, piler i rykk, fryser når gutten står helt
  stille og flykter inn i hull og under stablene når han kommer. Står han stille lenge, våger de seg
  fram igjen. API-et (`skrem`, `fang`, `framme`, `onHendelse`) er klart for «Rottejakt på lagerloftet»
  (§7.2). Katter bygget 02.10.2026 (`motor/katter.ts`, `motor/katt-modell.ts`): laget i kode som rotta
  (ca. 1450 trekanter, tabbystriper i pikselen), én til tre i de samme sonene, ett tegnekall. De rusler,
  sitter, vasker seg og sover sammenkrøllet; ser de en rotte, lusker de lavt i rykk og kaster seg (fanger
  eller skremmer via rotte-API-et), og de viker unna gutten når han løper mot dem. Kattebein fra Bryggen
  er et stort funnmateriale, og nesten alle kattene var flådd [V Hufthammer, Universitetsmuseet i Bergen,
  «1956 Tamkatten»]; at de ble holdt som rottefangere på loftene er [S], pelsfargene er [S]. Feller mangler. Svartrotta kom til Norge tidlig på 1200-tallet eller før, brunrotta
  først omkring 1750 [V SNL «svartrotte», «brunrotte»], så rottene på Bryggen i 1420-årene var
  svartrotter: slank kropp, hale lengre enn kroppen, store ører, mørk grå. Venter på eierens
  spilltest. Hund mangler
- [~] Stranden, Vågsbunnen og dagsplanene (03.10.2026, `bygg/strandliv.ts`, `bygg/dagsplan.ts`,
  `bygg/vaagsbunnen-liv.ts`, `motor/dyr.ts`, `graboks/strandliv.ts`). Stranden kan gås på: gutten ror over og
  legger til ved Jonsbryggen (klosteret eide Jonsbryggen [V Byleksikon «Jonsklosteret»]; utseendet [S]).
  Strandtorget med boder, familier i lave laftehus, naust og Jonskirken med et forfallent klosterhus
  (augustinerkloster grunnlagt før 1180, «trolig mer eller mindre øde omkring år 1400», kirka i bruk til 1500-tallet
  [V Byleksikon]; kirka og husene [S]). Vågsbunnen: barn, svenner som arbeider ute, en fyllik og kona hans om
  kvelden (alvor, ingen komikk), griser og hunder ([K] at de gikk løse i Bergen, se §8.8). Dagsplaner (§8.7):
  morgen, dag, kveld og natt; folk går til boden, torget, kirka og hjem, og er inne om natta [S]. Runepinner
  (§7.2): seks ekte innskrifter fra Bryggen (B 1, B 3, B 17, B 149, N B380 og «Ingebjørg»-pinnen) med kilde, og
  oppdraget «Pinnene i gjørma» for N. Griser og hunder er laget i kode (InstancedMesh, vertex-shader), ingen
  asset. Venter på eierens spilltest. Lyd til dyrene mangler
- [~] Lyd (02.10.2026, `motor/lyd.ts`, `motor/lydkobling.ts`): regn ute og på taket inne etter
  `world.regn`, vind, bølger som klukker mot bolverket der kaikanten er nærmest, ildstedet i schøtstua,
  måker som skriker fra der de er (og i kor når flokken letter), rotter som piper og krafser, fottrinn
  på planker ute, golv inne og gjørme (i takt med fotbeina i animasjonen), åretak med plask og knirk
  og vann mot skroget etter farten. Romlig lyd med lytteren i kameraet; inne lukkes et lavpass over
  alt som er ute, og rommet får litt klang. Starter ved første klikk eller Enter; «Lyd»-knapp, M og
  volum, husket i nettleseren. 21 kildefiler fra Freesound (CC0), OpenGameArt (CC0) og Wikimedia
  Commons (offentlig eie), lisens sjekket per fil (`public/games/bryggen/audio/KILDE.md`), ca. 960 kB
  Opus. Venter på eierens spilltest. Folk på plattysk og norsk mangler **[K]**

---

## 11. Kilder

Arnesen, H. G. (2019). *Hvem var hanseatene?* Det Hanseatiske Museum og Schøtstuene, Museum Vest. Hentet 02.10.2026 fra [hanseatiskemuseum.museumvest.no](https://hanseatiskemuseum.museumvest.no/hvem-var-hanseatene)

Hartvedt, G. H. & Skreien, N. (2009). *Bryggen*. Bergen byleksikon, Bergen byarkiv. Hentet 02.10.2026 fra [bergenbyarkiv.no](https://www.bergenbyarkiv.no/bergenbyleksikon/arkiv/1424543)

Hartvedt, G. H. & Skreien, N. (2009). *Vitaliebrødrene*. Bergen byleksikon, Bergen byarkiv. Hentet 02.10.2026 fra [bergenbyarkiv.no](https://www.bergenbyarkiv.no/bergenbyleksikon/arkiv/1425242)

Hartvedt, G. H. & Skreien, N. (2009). *Spill*. Bergen byleksikon, Bergen byarkiv. Hentet 02.10.2026 fra [bergenbyarkiv.no](https://www.bergenbyarkiv.no/bergenbyleksikon/arkiv/1423295)

Hartvedt, G. H. & Skreien, N. (2009). *Middelalderkirker (oversikt)*. Bergen byleksikon, Bergen byarkiv. Hentet 02.10.2026 fra [bergenbyarkiv.no](https://www.bergenbyarkiv.no/bergenbyleksikon/arkiv/14317214)

Hartvedt, G. H. & Skreien, N. (2009). *Rettersteder*. Bergen byleksikon, Bergen byarkiv. Hentet 02.10.2026 fra [bergenbyarkiv.no](https://www.bergenbyarkiv.no/bergenbyleksikon/arkiv/1422831)

Hartvedt, G. H. & Skreien, N. (2009). *Skostredet*. Bergen byleksikon, Bergen byarkiv. Hentet 02.10.2026 fra [bergenbyarkiv.no](https://www.bergenbyarkiv.no/bergenbyleksikon/arkiv/1423165)

Wikipedia. (u.å.). *Vågsbunnen (Bergen)*. Hentet 02.10.2026 fra [no.wikipedia.org](https://no.wikipedia.org/wiki/V%C3%A5gsbunnen_(Bergen))

Det Hanseatiske Museum og Schøtstuene. (u.å.). *Drengeliv*. Museum Vest. Hentet 02.10.2026 fra [hanseatiskemuseum.museumvest.no](https://hanseatiskemuseum.museumvest.no/drengeliv)

Det Hanseatiske Museum og Schøtstuene. (u.å.). *Rommene i Schøtstuene*. Museum Vest. Hentet 02.10.2026 fra [hanseatiskemuseum.museumvest.no](https://hanseatiskemuseum.museumvest.no/rommene-i-schotstuene)

Ekroll, Ø. & Thune, N. A. (2025). *Mariakirken - Bergen*. Store norske leksikon. Hentet 02.10.2026 fra [snl.no/Mariakirken_-_Bergen](https://snl.no/Mariakirken_-_Bergen)

Eldjarn, G. (2024). *jekt*. Store norske leksikon. Hentet 02.10.2026 fra [snl.no/jekt](https://snl.no/jekt)

Store norske leksikon. (2025). *kogge* (fagkonsulent Svein Ording). Hentet 02.10.2026 fra [snl.no/kogge](https://snl.no/kogge)

Hammer, E. (u.å.). *Bergenhus festning*. Store norske leksikon. Hentet 02.10.2026 fra [snl.no/Bergenhus_festning](https://snl.no/Bergenhus_festning)

Store norske leksikon. (u.å.). *Rosenkrantztårnet*. Hentet 02.10.2026 fra [snl.no/Rosenkrantztårnet](https://snl.no/Rosenkrantzt%C3%A5rnet)

Herteig, A. E. & Johannesen, N. H. (2026). *Bryggen i Bergen*. Store norske leksikon. Hentet 02.10.2026 fra [snl.no/Bryggen_i_Bergen](https://snl.no/Bryggen_i_Bergen)

Holmboe, H. & Salvesen, H. (2024). *Det tyske kontor*. Store norske leksikon. Hentet 02.10.2026 fra [snl.no/Det_tyske_kontor](https://snl.no/Det_tyske_kontor)

Lokalhistoriewiki.no. (2026). *Munkeliv kloster*. Norsk lokalhistorisk institutt. Hentet 02.10.2026 fra [lokalhistoriewiki.no/Munkeliv_kloster](https://lokalhistoriewiki.no/Munkeliv_kloster)

Opsahl, E. & Salvesen, H. (2026). *Olav Nilsson*. Store norske leksikon. Hentet 15.07.2026 fra [snl.no/Olav_Nilsson](https://snl.no/Olav_Nilsson) (via artikkelen hansadrapet-1455)

Orning, H. J. (2015). *Fiskeeventyret*. Norgeshistorie, Universitetet i Oslo. Hentet 02.10.2026 fra [norgeshistorie.no](https://www.norgeshistorie.no/senmiddelalder/1007-fiskeeventyret.html)

Salvesen, H. & Petersen, L. I. R. (2025). *vitaliebrødrene*. Store norske leksikon. Hentet 02.10.2026 fra [snl.no/vitaliebrødrene](https://snl.no/vitaliebr%C3%B8drene)

Stiftelsen Bryggen. (u.å.). *Byggemåte*. Hentet 02.10.2026 fra [stiftelsenbryggen.no](https://stiftelsenbryggen.no/verdensarven-bryggen/byggemate/)

Wikipedia. (2026). *Mariakirken i Bergen*. Hentet 02.10.2026 fra [no.wikipedia.org](https://no.wikipedia.org/wiki/Mariakirken_i_Bergen)

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

Bymuseet i Bergen. (u.å.). *Under jorden på Bryggens Museum*. Hentet 02.10.2026 fra [bymuseet.no](https://bymuseet.no/utstillinger/bryggens-museum/)

Wikipedia. (2026). *Herjolfsnes*. Hentet 02.10.2026 fra [en.wikipedia.org](https://en.wikipedia.org/wiki/Herjolfsnes) (sekundærkilde for klesfunnene og dateringen til 1430-årene)

Wikipedia. (2026). *Bockstensmannen*. Hentet 02.10.2026 fra [no.wikipedia.org](https://no.wikipedia.org/wiki/Bockstensmannen) (sekundærkilde, klærne datert 1340-1370)

Wikipedia. (2026). *Allmenning (gater)*, *Martinskirken (Bergen)*, *Nikolaikirken i Bergen*. Hentet 02.10.2026 fra [no.wikipedia.org](https://no.wikipedia.org/wiki/Allmenning_(gater)) (sekundærkilder, stemmer med byleksikonet)

Brochmann, O. (2025). *Håkonshallen*. Store norske leksikon. Hentet 02.10.2026 fra [snl.no/Håkonshallen](https://snl.no/H%C3%A5konshallen)

Hartvedt, G. H. & Skreien, N. (2009). *Håkonshallen*. Bergen byleksikon, Bergen byarkiv. Hentet 02.10.2026 fra [bergenbyarkiv.no](https://www.bergenbyarkiv.no/bergenbyleksikon/arkiv/1424979)

Hartvedt, G. H. & Skreien, N. (2009). *Rosenkrantztårnet*. Bergen byleksikon, Bergen byarkiv. Hentet 02.10.2026 fra [bergenbyarkiv.no](https://www.bergenbyarkiv.no/bergenbyleksikon/arkiv/1425132)

Hartvedt, G. H. & Skreien, N. (2009). *Bergenhus (festningsanlegg)*. Bergen byleksikon, Bergen byarkiv. Hentet 02.10.2026 fra [bergenbyarkiv.no](https://www.bergenbyarkiv.no/bergenbyleksikon/arkiv/1424494)

Hartvedt, G. H. & Skreien, N. (2009). *Kristkirkene*. Bergen byleksikon, Bergen byarkiv. Hentet 02.10.2026 fra [bergenbyarkiv.no](https://www.bergenbyarkiv.no/bergenbyleksikon/arkiv/1425026)

Hartvedt, G. H. & Skreien, N. (2009). *Bispegårder*. Bergen byleksikon, Bergen byarkiv. Hentet 02.10.2026 fra [bergenbyarkiv.no](https://www.bergenbyarkiv.no/bergenbyleksikon/arkiv/1420444)

Universitetet i Bergen. (u.å.). *Kongsgården i Bergen*. Landslovjubileet 2024. Hentet 02.10.2026 fra [landslovjubileet.uib.no](https://landslovjubileet.uib.no/introduksjon/holmen)

Lokalhistoriewiki.no. (u.å.). *Rosenkrantztårnet*. Norsk lokalhistorisk institutt. Hentet 02.10.2026 fra [lokalhistoriewiki.no](https://lokalhistoriewiki.no/wiki/Rosenkrantzt%C3%A5rnet) (kastellet omtrent kvadratisk, tre etasjer og kjeller)

Wikipedia. (2026). *Håkonshallen*, *Rosenkrantztårnet*, *Kristkirkene på Holmen i Bergen*. Hentet 02.10.2026 fra [no.wikipedia.org](https://no.wikipedia.org/wiki/H%C3%A5konshallen) (sekundærkilder: grunnflaten 37 x 16,4 m og trappegavlen etter Scholeus-stikket; stemmer med byleksikonet)

Wikipedia. (2026). *Strandsiden (Bergen)*. Hentet 02.10.2026 fra [no.wikipedia.org](https://no.wikipedia.org/wiki/Strandsiden_(Bergen)) (sekundærkilde for bylova 1276 og utbyggingen etter 1300)

Hartvedt, G. H. & Skreien, N. (2009). *Jonsklosteret*. Bergen byleksikon, Bergen byarkiv. Hentet 03.10.2026 fra [bergenbyarkiv.no](https://www.bergenbyarkiv.no/bergenbyleksikon/arkiv/1421675)

Wikipedia. (2026). *Bryggen inscriptions*. Hentet 03.10.2026 fra [en.wikipedia.org](https://en.wikipedia.org/wiki/Bryggen_inscriptions) (sekundærkilde: rundt 670 innskrifter, B 1, B 3, B 17, B 149, N B380)

Historisk museum, Universitetet i Oslo. (u.å.). *Runer i middelalderbyene* (utstillingen «Kyss meg»). Hentet 03.10.2026 fra [historiskmuseum.no](https://www.historiskmuseum.no/utstillinger/utstillingsarkiv/kyss-meg-runenes-verden/runer-i-middelalderbyene/)

Hansen, G. (u.å.). *1979 Frekke runepinner fra Bryggen*. Tohundre fortellinger, Universitetsmuseet i Bergen. Hentet 03.10.2026 fra [tohundrefortellinger.w.uib.no](https://tohundrefortellinger.w.uib.no/1979/09/15/1979-frekke-runepinner-fra-bryggen/)

### Kildeoppgavene (status 02.10.2026)

1. ~~Bryggefronten og allmenningene i 1420-årene.~~ Løst så langt åpne kilder rekker (§5.2):
   1332-linja og 1476-linja er grensene, allmenningene er navngitt. Gjenstår: de eksakte
   utgravningsplanene (Herteig, *The Bryggen Papers*) for å tegne kartet i meter **[K]**.
2. ~~Vakthunder og stengt port.~~ Ingen kilde funnet. Blir designvalg [S] (§4.2).
3. ~~Mynt, vekt og priser.~~ Løst (§4.3). Priser bare som bytteforhold fisk mot korn, rundt 1500 [U].
4. Kontoret under plyndringene 1428-29: ikke funnet i åpne kilder [U]. Les Brekke (2024) **[K]**.
5. ~~Straffer for tyveri.~~ Løst (§8.2). Slagsmål og drap (mannhelgebolken) gjenstår **[K]**.
6. ~~Kirkenes plassering.~~ Løst for Martinskirken, Nikolaikirken og Jonsklosteret (§5.2).
