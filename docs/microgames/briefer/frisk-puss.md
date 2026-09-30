# Frisk puss! (`frisk-puss`)

Artikkel: Michelangelo (`/historie/renessansen/michelangelo`). Spillet står etter avsnittet som
begynner «I 1508 fikk Michelangelo et oppdrag han ikke ville ha».
Tone: `lett`. Slapstick er lov: lærlingen som snubler med bøtta, paven som klatrer etter deg med
stokken, mesteren som roper ned fra taket. Ingen skader, bare søl.

Eierens bestilling (krav, lest bokstavelig, i sin helhet):

> 3D-plattformer i tredjeperson: kameraet står bak og litt over figuren, og eleven løper, hopper,
> klatrer og balanserer gjennom en bane i en ekte 3D-verden. Ingen 2D-bane i 3D-grafikk, og ikke
> fast kamera. Styringen skal kjennes perfekt: coyote time, hopp-buffer, variabel hopphøyde,
> styring i lufta, kantgrep, klatring på vegger/stiger/tau, veggsprett, balansering, rask respawn
> ved sjekkpunkt (ett trykk, null ventetid). Kamera følger av seg selv, går ikke gjennom vegger,
> viser neste hopp, roterer bare når eleven vil (Q/E eller mus); skygge under figuren; ingen brå
> kameraflytt. Hindre som beveger seg og krever timing, hentet fra emnet (svingende laster,
> fallende steiner, glatte flater, vind, plattformer som ramler, vann som stiger). Replayability:
> tidskamp mot spøkelse av egen beste runde, snarveier bare en flink spiller finner og klarer,
> samleobjekter utenfor hovedruten (historiske funn i en samling), tre stjerner per bane (i mål,
> alle funn, under måltid), rekord og ranger, utfordringer som endrer reglene (uten sjekkpunkter,
> speilvendt bane, stigende vann). Runde 2-4 min for ny spiller, under 1 min for mester.
> Fagregelen avgjør: banen og hindrene er fagstoffet; den som forstår hvordan byggverket/teknikken
> virket, finner den raske og trygge veien; den som bare løper, faller. Hver ny hindertype er et
> lærings-øyeblikk. Kule animasjoner (squash/stretch, støvsky, fartstreker, lene i svinger, hender
> på kanten, knaking før fall, steiner som løsner i kjede, sakte film ved nesten-bom, seiersdans,
> kamera trekker ut ved mål, funn som spretter). Nydelig look fra emnets egen bildekultur (ikke
> papir/tusj/trykk), sterkt lys, dybde, høyde skal føles høyt. Tastatur alene holder. Over 30 fps
> på lav kvalitet ved 1366x768. Deterministisk simulering der en seende robot tar snarveiene og
> vinner, en som ignorerer fagregelen faller oftere, knappemoser kommer ikke i mål.

Hvert punkt i bestillingen har et sted i briefen under: styring og kamera i `## Banen`
(Bevegelse, Kamera), hindre og lærings-øyeblikk (Hindre), snarveier, funn, stjerner, rekord,
ranger, spøkelse og utfordringer (Snarveier, Funn, En runde til), robotene (Simulering),
animasjonene (Animasjoner), looken og ytelsen i `## Kunstbrief`.

## Konseptturnering

Fem konsepter, alle 3D-plattformere i tredjeperson (bestillingen). Fersk dommer, Gøy / Fag:

1. **Frisk puss!** (4 / 4) - VINNER. Du er lærlingen som bærer fersk puss opp stillaset før
   dagens felt tørker. Bøtta gjør deg tyngre. Veggfestede bjelker bærer, Bramantes tau svaier.
2. **Nakken** (2 / 3) - du er Michelangelo og ruller den flyttbare stillasbroen til neste felt.
   Sterk regel om festene, men mye venting på broen.
3. **Bramantes svingebane** (3 / 2) - Tarzan-sving i tau, lande på veggbjelker. Gøy, men
   straffer det verbet spillet lærer deg.
4. **Paven klatrer etter deg** (4 / 2, nummer to) - flukt oppover med paven på hælene. Morsomt,
   men fagregelen er tynn.
5. **Natt i Peterskirken** (2 / 1) - snike inn og signere Pietà. Mørkt, stille, usikker historie.

Dommerens innvendinger mot vinneren: fire regler var for mange; «tau faller alltid» straffer
akkurat det en plattformer lærer eleven å gjøre (svinge og hoppe).

**Løftet** (bygget inn under):
- **Tre regler, ikke fire:** (1) bjelkene i veggen bærer, (2) pussen tørker, (3) søler du bøtta,
  er du tilbake ved sjekkpunktet.
- **Puss-klokka er synlig i taket:** dagens felt over deg går fra mørk våt grå til bleik kalkhvit
  fra kantene og innover. Du ser tiden ved å se opp, ikke på en tallklokke.
- **Tausnarveien er en belønning, ikke en felle:** Bramantes tau-stillas svinger i fast takt.
  Hopper du på i riktig øyeblikk og slipper i ytterpunktet, flyr du over et helt stillasfag.
  Bommer du på timingen, kaster det deg av. Bjelkene i veggen er alltid den trygge veien.
- **Paven som langsom jager nedenfra:** Julius 2. starter på gulvet og klatrer etter deg, men bare
  på det som bærer ham - veggbjelker og stiger. Tauet klarer han ikke. Også mesteren er i fare,
  fordi paven aldri stopper, og tauet er den eneste veien som rister ham av.

## Designbrief

1. **Fantasien.** Du er Michelangelos lærling i Det sixtinske kapell i 1508-1512. Mesteren står
   bøyd bakover 20 meter over gulvet og roper etter frisk puss. Du vil få bøtta opp til ham før
   dagens felt tørker, uten å søle, og uten at paven tar deg igjen.

2. **Kjerneverbet.** Hoppe og klatre med noe tungt i hendene. Bøtta er med hele tiden og endrer
   hvordan figuren kjennes: kortere hopp, tyngre landing, mer svai på smale bjelker. Selve
   hoppet skal være deilig alene: variabel høyde, styring i lufta, squash ved landing, kantgrep
   som «fanger» deg. Bøtta gjør hvert hopp til et lite regnestykke: klarer jeg dette med lasten?

3. **Fagkjernen.** To regler fra artikkelen avgjør om du vinner:
   - *Hvis du går på bjelkene som er festet i hull i veggen, bærer de; hvis du tar Bramantes
     tau-stillas, svinger det, og uten riktig timing kaster det deg av.* (Michelangelo forkastet
     Bramantes stillas og bygde sitt eget, festet i veggene.)
   - *Hvis pussen tørker før bøtta er oppe, må feltet hugges ned, og dagen er tapt.* (Fresko males
     på våt puss. Når kalken tørker, binder den fargen, og etterpå tar pussen ikke imot mer maling.)
   Den tredje regelen (søl = tilbake til sjekkpunkt) er spillets egen, men den gjør at eleven
   velger trygge bjelker framfor løse planker. Byttes veggfestet ut med noe annet, forsvinner
   hele rutevalget - regelen er ikke pynt.

4. **Presset og valgene.** Eskalerer: puss-klokka i taket tørker; paven klatrer etter deg fra
   sekund 20; jo høyere du kommer, desto mer trekk fra vinduene og desto mer slitte planker.
   Nytt valg minst hvert 10. sekund (banen er bygget slik): trygg bjelke eller tausnarvei, vente
   på talja eller løpe under den, hente et funn på en sidegren eller holde tempoet, ta planken som
   knaker eller gå rundt. Selvspillet måler `press` (klokke + pavens avstand) og `valg`
   (forgreninger per 10 s).

5. **Tap.**
   - *Pussen tørket.* Tips: «Fresko males på våt puss. Når kalken tørker, tar den ikke imot mer
     farge, og feltet må hugges ned. Hold deg på bjelkene i veggen, de er raskest i lengden.»
   - *Paven tok deg.* Tips: «Julius 2. maste om når taket ble ferdig. Han klatrer bare på det som
     bærer, så tauet er veien fra ham, hvis du treffer takten.»
   - (Utfordringen «Stigende slam») *Kalkslammet nådde deg.* Tips: «Kalk ble lesket i vann og
     blandet med sand til puss. Kom deg over kanten på karet før det renner over.»
   Fall og søl er ikke tap, bare tid: ett trykk, tilbake ved sjekkpunktet, full bøtte.

6. **Seier.** Når bøtta når mesteren på buebroen under taket før feltet har tørket, vinner du,
   uansett poeng. Mesteren smører pussen på, og feltet blir til et bit av taket (første bane:
   Adams hånd, fingeren som nesten rører Guds). Samlet over banene fylles hele taket, og det
   siste bildet er avdukingen 1. november 1512.

7. **En runde til.** Spøkelse av egen beste runde (med bøtta), rekord per bane, tre stjerner,
   ranger med titler, tolv funn som samles i «Lærlingens kiste» på tvers av runder, poeng-
   multiplikator for rene strekk uten søl, og tre utfordringer som endrer reglene (se Banen).

8. **Sjanger, perspektiv, dimensjon.** 3D-plattformer (Mario 64 / A Short Hike-familien) med
   jagerpress. Tredjeperson, kamera bak og litt over. 3D fordi bestillingen krever det, og fordi
   høyden i kapellet er poenget: eleven skal kjenne 20 meter under seg. Ny sjanger i biblioteket.

9. **Look.** Du løper inne i en fresko: kapellet etter restaureringen, sterke «skiftende» farger
   (cangiante), malt arkitektur og skrått vinduslys i kalkstøv.

10. **Første fem sekunder.** Kapellgulvet i sollys, en bøtte foran figuren, mesteren som vinker
    og roper fra stillaset høyt oppe, og en stige som lyser svakt i solstrålen. Eleven trykker
    pil fram, plukker opp bøtta av seg selv og begynner å klatre. Ingen tekst før første hopp.

## Kunstbrief

1. **Kilden.** Selve Det sixtinske kapell, slik det ser ut etter restaureringen 1980-1994:
   Michelangelos takfresko med cangiante-drakter (stoff som skifter fra grønt til gult, fra rosa
   til lysegrønt i stedet for å bli mørkere i skyggen), den *malte* arkitekturen som rammer inn
   bildene (falske gesimser, søyler og marmorbenker i steinfarge), og det høye, lyse rommet med
   vinduer øverst på veggene og bleik kalkhvit puss. Kjennetegn: lyse, mettede pastellfarger,
   kraftige kropper i lys, og illusjonsarkitektur som ikke kan skilles fra den ekte.
2. **Palett.**
   - `#efe4cc` kalkhvit (tørr puss, vegger, lyse flater, tekst på mørkt)
   - `#6f6a62` våt puss (dagens felt og puss-klokka, mørkt når vått, blekner mot `#efe4cc`)
   - `#c9ad83` travertin (malt arkitektur, gesimser, veggbjelkene, trygg vei)
   - `#3f64b0` lapis (stjernehimmel-fliser, spillerens tunika, funn)
   - `#e0b64a` cangiante gul til `#8fae4c` grønn (gevinst, lys, stjerner, mesteren)
   - `#c2543c` pavelig rød (paven, fare, tau og løse planker har en rød flis på enden)
3. **Form og overflate.** Myke, kraftige figurer som Michelangelos kropper (store hender og
   skuldre, runde muskler), lav-poly med glatte normaler og to-tre toner cel-skygge, men
   *uten* mørk kontur: freskoen har ingen strek, formen kommer fra lyset. Drakter bruker
   cangiante: skyggetonen er en annen farge, ikke en mørkere (toonGradient med fargeskifte).
   Vegger og tak får en fin kalkkorn-tekstur og synlige skjøter mellom dagsfeltene (giornate).
   Stillaset er ubehandlet gran i varm brun, med tydelige jernbeslag der bjelkene går inn i veggen.
4. **Lys.** Formiddag. Sterke, skrå solstråler inn fra vinduene på sørveggen, synlige i
   kalkstøvet, lyse flekker som vandrer over stillaset når du klatrer. Taket er lyst av refleks
   fra veggene, varmt og mykt. Høyere oppe blir lyset sterkere og luften lysere - gulvet under
   deg synker ned i en varm, støvete dis, så høyden kjennes.
5. **Perspektiv og kamera.** Tredjeperson bak og litt over figuren, fritt i rommet. Ulikt de tre
   siste (førsteperson i Tre dager i porten, høyt skrått over festning i Løpegravene, skrå
   tre-kvart ovenfra i Hammer og ambolt).
6. **Typografi og HUD.** HUD-en er kapellets egne navnetavler: under hver profet holder en liten
   putto en steintavle med navnet. Tida og rekorden står på to slike tavler i travertin øverst.
   Puss-klokka er ikke i HUD-en, den er dagens felt i taket (en liten kopi i hjørnet bare når
   taket er ute av bildet). Funn vises som små medaljonger i bronse. Tall i Outfit, fet, sperret
   versal, sot på travertin.
7. **Slik lages det på en Chromebook.** Rommet er én boks med innadvendte flater og
   canvas-teksturer tegnet ved oppstart (kalkkorn, dagsfelt-skjøter, malt arkitektur som flate
   bilder på veggen, ikke geometri). Stillaset er `mergeParts` per seksjon. Solstrålene er
   additive, dobbeltsidige trapeser med gradient (ingen volumetrisk lys). Én retningssol med
   skyggekart bare på `middels`+; på `lav` en mørk skive rett under figuren og paven (den er
   uansett alltid med som hoppehjelp). Tåke i varm kalkfarge nedover gjør dybden. Bloom av på
   `lav`; `lav` skal se ferdig ut med solstråler, cel-toner og tåke.
8. **Ikke slik.** Ikke papir, tusj eller trykk. Ikke polykrom marmor og persisk glasur (Tre dager
   i porten), ikke nattblått og snø med oljelerret (Løpegravene), ikke okermosaikk uten blått
   (Hammer og ambolt). Ikke grønn plen-diorama. Ikke mørk, dunkel kirke: dette er lyst,
   mettet og høyt.

## Banen

### Rommet og høydemeteret

Kapellet er 40 m langt, 13 m bredt og 20 m høyt (omtrent de ekte målene). Høydemeteret står langs
venstre kant som en loddsnor med merker; en liten bøtte-ikon viser hvor du er, et rødt merke
viser paven.

| Høyde | Sone | Hva som er der |
|---|---|---|
| 0 m | Gulvet | Mosaikkgulv i marmor, marmorskranken på tvers, kalkkar, bøtta, talje-rep ned |
| 5 m | Gesimsen | Smal steinkant mellom veggmaleriene, første sjekkpunkt |
| 8-13 m | Vindusbeltet | Vinduene med trekk, nisjer (veggsprett-sjakter), løse arbeidsplanker |
| 13-15 m | Veggbjelkene | Michelangelos bjelker i hull i veggen, over vinduene. Trygg vei, sjekkpunkt |
| 15-18 m | Buebroen | Stillasbroen som spenner over rommet i trinn, følger hvelvet |
| 18-20 m | Taket | Mesterens plattform under dagens felt. Mål |

### Gråboks-banen «Første dag» (60-90 s ny spiller, ca. 30 s mester, måltid 40 s)

Én vegg, én bro. Gulv (bøtta) -> stige til gesimsen (5 m, sjekkpunkt 1) -> tre løse planker over
et vindu (knaker, ramler) *eller* rundt via to veggbjelker -> stige til bjelkerekka (13 m,
sjekkpunkt 2) -> talja som svinger over bjelkerekka -> tre veggbjelker med gap -> buebroen (4 trinn)
-> mesteren (18 m). Tausnarvei: ett tau fra bjelke 1 over til broens trinn 3 (sparer ca. 8 s).
Tre funn. Paven starter på gulvet etter 20 s. Puss-klokka: 90 s.

### Full bane «Skapelsen» (2-4 min ny spiller, under 1 min mester, måltid 75 s)

Begge langveggene og to broer. Gulv -> gesims sør -> vindusbeltet sør (to vinduer, trekk) ->
veggbjelker sør -> første bro over til nordveggen -> veggbjelker nord (løs kalk i kjede) -> vindu
nord (veggsprett-sjakt opp) -> andre bro, høyere, med våt puss på plankene -> buebroen under
Adams felt -> mesteren. Tre sjekkpunkter (gesims sør, bjelker nord, foten av buebroen).
Puss-klokka: 4 min 30 s. Tolv funn fordelt på sidegrener.

### Bevegelse (tall er utgangspunkt, simuleringen finstiller)

| Verktøy | Uten bøtte | Med bøtte |
|---|---|---|
| Løpefart | 6,5 m/s, akselerasjon 40 m/s², brems 55 m/s² | 5,2 m/s |
| Hopphøyde (holdt) | 2,2 m | 1,6 m |
| Hopphøyde (kort trykk, variabel) | 0,9 m (slipp = oppfart kuttes til 40 %) | 0,7 m |
| Luftstyring | 70 % av bakke-akselerasjon | 55 % |
| Coyote-tid | 0,12 s | 0,12 s |
| Hopp-buffer | 0,15 s | 0,15 s |
| Kantgrep | Griper kanter innen 0,45 m vannrett og 0,6 m over hendene, klatrer opp på 0,35 s | Samme rekkevidde, opp på 0,5 s |
| Stige | 3,2 m/s | 2,2 m/s |
| Vegg (bare stein med grep: gesims, vindusnisje, malt søyle) | 2,0 m/s, maks 3 m før du må hoppe | 1,4 m/s, maks 2 m |
| Tau | 2,5 m/s klatring; henge og svinge | Bøtta henges på en krok på beltet: 1,6 m/s |
| Veggsprett | Ut 4 m/s + opp 1,8 m, ubegrenset i en sjakt | Maks to sprett på rad |
| Balanse (bjelker under 0,35 m brede) | Svai-meter, styr mot med venstre/høyre, faller ved 100 % | Svaiet går 1,5 ganger fortere |

Fall over 3 m med bøtte = søl (tilbake til sjekkpunkt). Uten bøtte (bare i utfordringer og på
sidegrener der du setter den fra deg) tåler du 5 m. Tre sekunder med «nesten søl» (skvulp over
kanten) varsler når du lander hardt: bøtta skvulper, lyden skvalper, men ingenting er tapt ennå.

Tastatur: piltaster eller WASD, mellomrom = hopp (hold for høyere), Shift = sett ned / plukk opp
bøtta (sidegrener), Q/E = roter kamera, R = til sjekkpunkt. Mus er valgfri.

### Hindre (minst sju; de tre merket G er med i gråboksen)

| Hinder | Hva det gjør | Lærings-øyeblikket |
|---|---|---|
| **Planker som knaker og ramler (G)** | Løse arbeidsplanker lagt over gap. Knaker og rister 0,6 s etter at du står på dem, faller etter 1,2 s | Bare det som er festet i veggen bærer; en løs planke er ikke et stillas. |
| **Bramantes tau-stillas (G)** | Plattform som henger i to tau, svinger med periode 3,2 s. Hopper du på nær ytterpunktet og slipper ved motsatt ytterpunkt, flyr du langt; ellers vrir det seg og kaster deg | Bramante ville henge stillaset i tau fra hull i taket, og Michelangelo spurte hvordan hullene skulle tettes etterpå. |
| **Svingende taljer (G)** | Laster med sand, kalk og farger heises og svinger over bjelkerekka; treff = søl | Sand, kalk og farger måtte heises 20 meter opp, hver dag. |
| **Våt, glatt puss** | Pussflekker på plankene: halv friksjon, du sklir videre 1,5 m | Puss er våt kalk og sand, og det er glatt til det tørker. |
| **Trekk fra vinduene** | Vindkast hvert 6. s, varslet med gardinsus og støv; dytter 2 m/s sideveis | Trekk og varme får pussen til å tørke fortere, så freskomaleren kjemper mot været også. |
| **Tørr puss som løsner i kjede** | Gamle pussflak på gesimsen faller én og én bak deg når du løper (0,25 s mellom hver) | Puss som tørket før den ble malt, måtte hugges ned før ny puss kunne legges. |
| **Stigende kalkslam** (utfordring) | Slam stiger fra gulvet med 0,12 m/s, raskere etter hvert sjekkpunkt | Kalk ble blandet med vann og sand i store kar før den ble smurt på veggen. |

Paven er ikke et hinder, men et press: han klatrer bare på veggbjelker, stiger og gesims, med
3,0 m/s på trygg vei (litt tregere enn deg med bøtte). Tar du tauet, må han rundt. Når du
respawner, settes han minst 8 m under sjekkpunktet, så en respawn aldri blir en felle.

### Snarveier (bare for de flinke)

1. **Tau-flukten.** Hopp på Bramantes tau i det ene ytterpunktet og slipp i det andre: du flyr
   over et helt stillasfag og rister av paven. Vinduet for riktig slipp er 0,25 s. Feil takt =
   kastet av, tilbake til sjekkpunktet.
2. **Vindussjakta.** I vindusnisjen på nordveggen kan du veggsprette mellom de to steinsidene rett
   opp til bjelkerekka. Med bøtta har du bare to sprett, så du må treffe gesimsen på tredje hopp
   med kantgrep. Sparer ca. 10 s.
3. **Talje-heisen.** Grip motvekt-repet på en talje i det øyeblikket lasten går ned: du blir dratt
   opp 6 m. Grip for tidlig, og du henger i ro; for sent, og lasten treffer deg.

En middels spiller ser snarveiene, men klarer dem ikke med bøtta uten øvelse. Spøkelset viser
dem når du selv har klart dem én gang.

### Funn (tolv, alle utenfor hovedruten)

| Funn | Fagstoff (én setning) |
|---|---|
| Kartong med prikkhull | Tegningene ble overført til pussen ved å dunke kullstøv gjennom små hull langs strekene. |
| Dagsverk-merket | Hvert felt som ble pusset og malt på én dag, kalles *giornata* (italiensk for dag), og skjøtene synes ennå i taket. |
| Pavens stokk | Pave Julius 2. maste om når taket skulle bli ferdig, og det fortelles at han truet Michelangelo med stokken. |
| Diktet om nakken | Michelangelo skrev et dikt om at skjegget pekte mot himmelen mens han malte bøyd bakover. |
| Meiselen | Michelangelo mente han var billedhugger, ikke maler, og ville helst si nei til oppdraget. |
| Stjernehimmel-flisen | Før Michelangelo var taket malt blått med gullstjerner. |
| Lapis-steinen | Den dyreste blåfargen i renessansen ble laget av knust lapis lazuli, en blå halvedelstein. |
| Sixtus-medaljen | Kapellet heter etter pave Sixtus 4., som fikk det bygd rundt 1480. |
| Botticellis pensel | Veggene var allerede malt av kjente malere som Botticelli og Perugino før Michelangelo kom. |
| Adams hånd (skisse) | På det mest kjente bildet skiller bare en liten avstand fingeren til Adam fra fingeren til Gud. |
| Sotfilla | Da taket ble vasket på 1980- og 90-tallet, forsvant flere hundre år med sot, og fargene var mye sterkere enn folk trodde. |
| Røykpipa | Når kardinalene skal velge en ny pave, samles de i Det sixtinske kapell. |

Gråboksen har tre: kartongen, pavens stokk og stjernehimmel-flisen. Funn spretter ut av gjemmet
og flyr inn i kista når du tar dem; kista vises på startskjermen.

### En runde til: stjerner, ranger, utfordringer og poeng

- **Tre stjerner per bane:** i mål før pussen tørker, alle funn på banen, under måltid (40 s
  gråboks, 75 s full bane).
- **Rekord og spøkelse:** beste tid lagres; spøkelset (halvgjennomsiktig lærling med bøtte)
  løper beste runde. Slår du det, blinker det gull.
- **Ranger (etter beste tid på full bane):** Kalkbærer (i mål), Pussgutt (under 3 min),
  Stillasrotte (under 2 min), Lærling (under 90 s), Svenn (under 75 s), Mesterens høyre hånd
  (under 60 s), «Il Divino» (under 45 s - kallenavnet samtiden ga Michelangelo, «den
  guddommelige»).
- **Utfordringer** (låses opp med tre stjerner): *Uten sjekkpunkter* (søl = start på nytt),
  *Speilvendt* (kapellet speilet, vinduslyset fra motsatt side), *Stigende slam* (kalkslam fra
  gulvet, paven blir hjemme).
- **Poeng:** tidsbonus (hvert sekund under puss-klokka = 10), funn 250, perfekt tau-slipp 150,
  nesten-bom-landing 50. Multiplikator ×1 til ×4 for strekk uten søl (øker ved hvert sjekkpunkt,
  nullstilles ved søl). Poeng avgjør ikke seieren.

### Tapsårsaker med tips

| Årsak | Tipset (fagstoff) |
|---|---|
| Pussen tørket | Fresko males på våt puss: når kalken tørker, tar den ikke imot mer farge. Bjelkene i veggen er raskest i lengden fordi du aldri faller av dem. |
| Paven tok deg | Julius 2. ville ha taket ferdig. Han klatrer bare på det som bærer, så Bramantes tau er veien fra ham - hopp i ytterpunktet. |
| Kalkslammet nådde deg (utfordring) | Kalk ble blandet med vann og sand til puss. Hold deg på veggbjelkene, de løse plankene koster tid du ikke har. |

Søl (fall over 3 m, truffet av talje, kastet av tau) er ikke tap, bare sjekkpunkt. Første søl av
hver type gir en kort lapp der blikket er: «Løs planke! Bare det som er festet i veggen bærer.»

### Simulering: robotene (deterministisk, seedet)

| Robot | Oppførsel | Forventet |
|---|---|---|
| **Seende** | Følger veggbjelkene, tar alle tre snarveiene med riktig timing (slipper tauet innen 0,05 s av ytterpunktet), hopper over knakende planker før de faller | Vinner alltid, under måltid, 0-1 søl |
| **Middels** | Trygg rute, tar tauet med ±0,15 s feil, venter på taljer | Vinner ofte, 2-4 søl, rundt 1,5-2 ganger seendes tid |
| **Taper (ignorerer fagregelen)** | Går korteste linje: løse planker, tau uten timing, under taljene | Faller klart oftere enn middels, bruker lengre tid, taper ofte på puss-klokka eller paven |
| **Knappemoser** | Tilfeldige taster hver 0,2 s | Kommer aldri i mål |

Simuleringen måler: tid i mål, antall søl per årsak, andel tau-bruk og tau-treff, pavens minste
avstand (`press`), tid igjen på puss-klokka, `valg` (forgreninger per 10 s, må være minst 1) og
funn tatt. Porten er grønn når seende > middels > taper på både seier og tid, og taper faller
minst dobbelt så ofte som seende.

### Kamera og skygge

- Følger av seg selv: bak og 2,5 m over figuren, 6 m bak, glir etter med demping (ingen brå flytt,
  maks 90 grader/s rotasjon).
- Kollisjon mot vegger og stillas: strålen fra figuren til kameraet trekker kameraet inn når noe
  er i veien; aldri gjennom vegger.
- Ser mot neste hopp: kameraet lener seg 1,5 m i fartsretningen og tipper ned når du står ved en
  kant, opp når du henger i en stige.
- Q/E (eller mus) roterer rundt figuren; ellers roterer kameraet aldri av seg selv.
- Skygge-blob: en mørk skive rett under figuren (og under paven), alltid, også på `lav`. Den er
  hoppehjelpen, ikke pynt.

### Animasjoner (fra bestillingen)

| Animasjon | Gråboks | Kunstfasen |
|---|---|---|
| Squash/stretch ved hopp og landing | ja (skalering) | finstilt |
| Knaking før fall (planker rister) | ja | lyd og støv |
| Steiner (pussflak) som løsner i kjede | ja | støv og biter |
| Kamera trekker ut ved mål | ja | med taket og mesteren i bildet |
| Sakte film ved nesten-bom | ja (tidsskala) | med lydfall |
| Funn som spretter | ja (enkelt sprett) | glans og bue inn i kista |
| Hender på kanten | nei | ja |
| Støvsky ved landing | nei | ja |
| Fartstreker i fart og fall | nei | ja |
| Lene i svinger | nei | ja |
| Seiersdans (lærlingen og mesteren) | nei | ja |

## Byggelogg

### 2026-09-29 - Gråboks (fase 4), byggmester

**Gjort.** Banen «Første dag» som kolliderbokser i flat farge per type (veggbjelker gul, løse
planker rød, tau-stillaset lilla, grepstein grønngrå, broen travertin, mesteren grønn).
- `friskpuss/level.ts` (banen), `game.ts` (reglene, fast steg 1/120 s, figuren flyttes akse for
  akse i biter på maks 0,1 m, så den ikke går gjennom noe), `bots.ts`, `sim.ts`, `camera.ts`
  (stråle mot bokser, skygge), `world.tsx`, `look.ts`, `FriskPuss3D.tsx`. Registrert i `registry.ts`,
  ikke lagt inn i artikkelen.
- Styring: fart med akselerasjon og brems, coyote-tid 0,12, hopp-buffer 0,15, variabel hopphøyde
  (slipp = 40 %), luftstyring, kantgrep (henger, klatrer opp på 0,5 s), stiger, tau (klatre og
  hoppe av), grepvegg (maks 2 m med bøtta), veggsprett (maks to med bøtta), balanse med svai-meter
  på den smale bjelken, fall over 3 m = søl. R = rett til sjekkpunktet, ellers automatisk etter 0,55 s.
- Hindre: tre løse planker som ligger på hverandre (knaker 0,6 s, faller 1,2 s, kommer tilbake ved
  respawn), Bramantes tau-stillas (svinger A-B på 4 s, landing over 3,2 m/s kaster deg av), talja
  som svinger på tvers over den smale bjelken.
- Puss-klokka 90 s (i taket over mesteren og som liten kopi i hjørnet), paven fra sekund 20 (2,6 m/s,
  1,3 m/s på stiger, bare på den trygge stien, settes minst 8 m under sjekkpunktet ved respawn, går
  inn gjennom døra i sørveggen), to sjekkpunkter, tre funn (sjakta, tauhylla, søyla), tre stjerner,
  rekordtid, spøkelse (posisjon hvert 0,1 s, lagret for raskeste runde).
- Kamera: bak og over (6 m / 2,5 m), dempet, ser 1,5 m fram i fartsretningen, tipper ned ved kanter
  og opp i stiger, trekkes inn av en stråle mot boksene og løftes over figuren når det presses tett.
  Roterer bare med Q/E eller musdrag.

**Simulering (grønn, 3 forsøk på tallene, ett konsept):** seende vinner 100 % (20,3 s, 1947 p),
middels vinner 100 % (ca. 28 s, median 1627), rett-fram 0 % (139 p, taper på puss-klokka),
knappemoser 0 %, passiv 0 %. 11,8 valg per minutt, press 0,04 -> 0,23. Selvspillet i nettleseren:
seende vant med 1942 p (samsvar med simuleringen), Chromebook lav 2,5 / 12,7 ms JS per bilde.

**Det som ikke virket.**
- Plankene lå først under veggbjelkene, så figuren slo hodet og ble stående. Flyttet ut i rommet.
- En taper som lærer (bjelker etter to fall, halvparten tau) vant 100 %: sjekkpunktene er så nære at
  hvert søl bare koster 3-4 s. Taperen lærer nå aldri (alltid plankene), som i briefen.
- Robotene fikk flere grep i samme bilde i nettleseren og slapp hoppet før det startet (hoppet på
  stillaset når det var borte). Nå ett grep per spilltid-øyeblikk.
- Paven startet der eleven starter og tok en passiv spiller med en gang.

**Kjente svakheter.**
- Banen er kort for roboter (20-28 s); paven når aldri seende eller middels. For et menneske som
  bruker 60-90 s kan paven bli for hard: han når toppen etter ca. 50 s uten søl. Kjenn på det.
- Taperen kommer aldri forbi plankene, så simuleringen tester ikke taperen på stillaset og talja.
- Buebroen går mot kameraet (standardvinkel ser mot nordveggen): kameraet løftes, men eleven bør
  snu med Q/E. En lapp ber om det ved sjekkpunkt 2.
- Ikke bygd ennå: utfordringene (uten sjekkpunkter, speilvendt, stigende slam), talje-heisen, trekk
  fra vinduene, poeng-multiplikator, nesten-bom i sakte film, «nesten søl». Ingen coverbilde.
- Tau-stillaset er en kinematisk bane (ikke ekte pendel); hopper du av det, får du farten dets med.

### 2026-09-29 - Kameraet er ikke fienden (fase 4, runde 2), byggmester

**Problemet.** Ved 20 s sto kameraet inne i figuren (strålen mot stillaset trakk det inn), og
buebroen gikk rett mot kameraet, så en lapp ba eleven snu med Q/E. Det gjorde kameraet til fienden.

**Løst i designet, ikke med lapper.**
- Banen sikksakker SIDELENGS langs nordveggen: gulvet og gesimsen mot øst, bjelkerekka mot vest,
  og buebroen fortsetter mot vest på langs under hvelvet (fire trinn, x -8,6 til -16,6), opp til
  mesteren ytterst i vest (x -20 til -16,6, 18 m). Alt ligger i et belte inntil veggen (z under -2),
  og høyere etasjer ligger rett over lavere, så ingenting står mellom figuren og kameraet.
- Tau-stillaset svinger på langs (A ved bjelkerekka x 4,6 -> B foran broens trinn 3 x -13,6,
  periode 4,4 s). B står 0,6 m over trinnet, så du går rett av i ytterpunktet. Talja svinger 1,6 m
  (ikke 1,8), så den ikke treffer deg på stillaset. Tauene henger i hull på tvers av svingen.
- Lappen «Q/E: snu deg mot tau-stillaset» er fjernet. C = kameraet tilbake til standard.

**Kameraet (`friskpuss/camera.ts`, `followCamera`).** Standardvinkel fra det åpne rommet mot
veggen, 8 m bak og 3 m over. Kritisk dempet fjær på blikkpunkt, høyde og vinkel (ingen brå flytt).
Ser opptil 2,2 m fram i løperetningen (sidelengs teller fullt, inn/ut av rommet bare 35 %). I stigen
ser det opp; ved en kant eller i kantgrep løftes det 1,4 m og tipper ned. Kollisjon: tynn kulestråle
(fem stråler, radius 0,3) bare mot stillaset, raskt inn (14/s) og sakte ut (1,6/s); veggene er en
hard grense for rommet. Blir avstanden under 5,5 m, løftes kameraet og vipper ned i stedet.
Roterer bare med Q/E, musdrag og C. Skygge-bloben er uendret (alltid under figuren).

**Paven er press, ikke vegg.** Starter etter 35 s (var 20), 2,2 m/s (var 2,6), 1,0 m/s på stiger,
1,4 m/s over 12,5 m (andpusten). Uten søl når han toppen etter ca. 84 s (var 54). Respawn setter
ham fortsatt minst 8 m under sjekkpunktet.

**Simulering (grønn):** seende 100 % (22 s, 1933 p, tauet), middels 100 % (24 s median, 1661 p;
26-28 s på trygg vei), rett-fram 0 % (25 søl, tapt på puss-klokka), knappemoser 0 %.
11,1 valg per minutt. Selvspill i nettleseren (fart 4): seende 1924 p, samsvar med simuleringen.
Eget spill med ekte tastetrykk langs trygg vei: i mål på 34 s med fire søl (talja), bilder hvert
5. s i `.screenshots/friskpuss-kamera/`: figuren er liten, neste hopp syns i hvert bilde, kameraet
er aldri i veggen.

**Kjente svakheter.**
- Middels er bare litt tregere enn seende (24 mot 22 s), ikke 1,5-2 ganger: tausnarveien sparer lite
  når middels også tar den halve tiden.
- Taperen kommer fortsatt aldri forbi plankene.
- Tauene til stillaset går skrått fra ett oppheng midt mellom A og B; ser rart ut i ytterpunktene.
  Kunstfasen bør gi to oppheng.
- `## Banen` og `### Kamera og skygge` over beskriver fortsatt buebroen «over rommet» og kameraet
  6 m bak; det er denne loggen som gjelder.

### 2026-09-30 - Mekanisk komplett (fase 4, runde 3), byggmester

**Gjort.** Spillet har nå to baner, alle hindertypene, snarveiene, tolv funn, utfordringene og
robotene for begge baner. Fortsatt gråboks. Bevegelsestallene, kamerareglene og hopp/kantgrep er
uendret; «Første dag» er samme bane som før (robotene får samme tider: 22 s / 27 s).
- `level.ts` er skrevet om til et `Level`-objekt per bane (`getLevel(id, speil)`), med hindre som
  lister: plankegrupper, tau-stillas, taljer, talje-heiser, vinduer med trekk og kjeder med tørr
  puss. Speilvendt bane lages ved å speile x (også kamerasonene). `game.ts` leser alt fra `g.L`.
- **Bane 2 «Skapelsen»** går rundt kapellet mot klokka, så «hold venstre» følger ruten:
  sørveggen (gulvet mot øst, gesimsen 4,5 m mot vest med tørr puss i kjede, vindusbeltet 8,5 m
  mot øst med tre vinduer, trekk og løse planker), broen langs østveggen, nordveggen (bjelkene
  8,5 m mot vest med talja over den smale bjelken og tørr kalk, den andre broen 12,4 m mot øst med
  våt puss og en talje over gangen, buebroen 16,2-17 m mot vest til mesteren på 18 m). Tre
  sjekkpunkter: gesimsen sør, bjelkene nord, foten av buebroen. Puss-klokka 270 s, måltid 75 s,
  paven fra sekund 60.
- **Kameraet og veggbyttet.** Hver vegg har en kamerasone med standardvinkel (sør: kameraet i
  nord, øst: kameraet i vest, nord: kameraet i sør). Når figuren går rundt et hjørne, glir
  standardvinkelen mykt (maks 1 rad/s, ca. to sekunder per 90 grader) - Q/E-rotasjonen eleven har
  valgt, legges oppå, og C går tilbake til sonens vinkel. Resten av `followCamera` er uendret.
  Siden styringen er relativ til kameraet, svinger «venstre» rundt hjørnet sammen med kameraet.
  Tauene til tau-stillaset går nå rett opp (løpekatt i hvelvet), så de aldri krysser bildet.
- **Nye hindre** (hver med et lærings-øyeblikk første gang, `beatOnce` festet ved hinderet):
  våt puss (friksjon 9 m/s², du glir ca. 1,5 m), trekk fra vinduene (vindkast hvert 7. s, 1,5 s
  langt, varslet 1 s før med blafrende striper og sus; dytter 2,2 m/s ut fra veggen, 3,2 i lufta),
  tørr puss i kjede (flisene faller én og én 0,24 s fra hverandre, 0,5 s etter første tråkk;
  står du stille, faller du) og talje-heisen (grip kroken mens sekken er oppe, så drar vekta deg
  8,5 m opp når sekken går ned; står du i søylen til sekken når den kommer ned, er det søl).
  `maxBeats` er 5 per runde.
- **Snarveiene** hopper hver over et helt «ut og tilbake»: talje-heisen fra gulvet rett opp til
  vindusbeltet (hopper over gesimsen og vinduene), tau-flukten fra bjelkene nord over til den
  andre broen (hopper over bjelkene, rister av paven), og vindussjakta med veggsprett fra den
  andre broen rett opp til mesteren. Hver gir 150 poeng ganger multiplikatoren.
- **Poeng:** multiplikator ×1 til ×4 for rene strekk (øker ved hvert sjekkpunkt uten søl,
  nullstilles ved søl), vises i HUD-en. Utfordringene gir ×1,5 (uten sjekkpunkter), ×1,25
  (speilvendt) og ×1,5 (stigende slam) på sluttsummen.
- **Funn:** tre på bane 1, ni på bane 2, alle på sidegrener (hjørnet bak starten, kalkkaret,
  vestenden av gesimsen, hylla over midtpilaren, søyla på østbroen, hylla ved tauet, vestenden av
  bjelkene, bak stigen på den andre broen, hylla bak stigen på buebroen). Funnet spretter, snurrer
  fort, blåses opp og krymper inn når du tar det. Lærlingens kiste på startskjermen viser alle
  tolv; trykk på en medaljong for fagsetningen.
- **Startskjermen:** bane 1 og 2 (2 låses opp når du har klart 1), utfordringene (låses opp med
  tre stjerner på banen), rekord og stjerner per bane. Rangene går etter tid (Kalkbærer til
  «Il Divino» under 45 s på full bane; bane 1 skalert etter måltida). Rekord og spøkelse lagres
  per bane og utfordring (gammel lagring fra gråboksen flyttes over).
- `sim.ts` kjører full bane som standard (variant `forste` = bane 1). Selvspillet i nettleseren
  starter også full bane.

**Simulering (grønn, 200 runder):** seende 100 % (25,0 s, 4201 p, alle tre snarveier),
middels 100 % (median 71 s, 2987 p, trygg vei, venter på trekk og talje), rett-fram 0 % (går på
de løse plankene over vinduet hver gang, taper på puss-klokka), knappemoser 0 %, passiv 0 %.
Snarveifaktor 71,3 / 25,0 = 2,9. 12 valg per minutt, press 0,05 -> 0,27. Bane 1 (egen kjøring):
seende 21,8 s, middels 26,6 s, rett-fram og knappemoser 0 %. Utfordringene: seende vinner alle
på begge baner; middels vinner uten sjekkpunkter og speilvendt, og stigende slam på bane 2 er
tett (7-20 av 20 etter takten).

**Nettleseren.** Selvspillet (fart 4): seende 4193 p i mål, samsvar med simuleringen; Chromebook
lav 1,3 / 2,6 ms JS per bilde, 47 draw calls. Eget spill med ekte tastetrykk langs trygg vei:
i mål på 62 s uten søl; bilder hvert 10. s i `.screenshots/friskpuss-full/`. Neste hopp syns i
hvert bilde, kameraet er aldri i veggen, og hjørnet til østbroen og nordveggen går mykt.

**Det som ikke virket.**
- Den malte søyla med grep midt på vindusbeltet sto i gangfeltet: alle som løp langs veggen,
  begynte å klatre på den. Byttet til en hylle over midtpilaren (hopp og kantgrep).
- Middels var først under måltida (72 s) på trygg vei. Et tredje vindu og en talje over den
  andre broen gjorde den trygge veien lenger. En dyktig spiller på trygg vei klarer fortsatt
  rundt 60 s, så tredje stjerne kan tas uten snarveier av den som spiller rent.

**Kjente svakheter.**
- Middels søler aldri (briefen sa 2-4 søl); den venter perfekt på trekk og talje.
- Taperen kommer fortsatt aldri forbi de løse plankene, så simuleringen tester ikke taperen på
  nordveggen.
- Stigende slam på bane 2 er stramt for en middels spiller; kjenn på farten (0,12 m/s + 0,04 per
  sjekkpunkt).
- Coverbildet mangler fortsatt (playtest-scriptet ber om `--cover`), og kunstfasen gjenstår.

### 2026-09-30 - Kunst, figurer og arkadeskall (steg 3b, 4 og 6), byggmester

**Gjort.** Gråboksen er kledd som Det sixtinske kapell slik det så ut 1508-1512. Spillreglene,
bevegelsestallene, hopp/kantgrep, kamerareglene og banegeometrien er ikke rørt (`game.ts`,
`camera.ts`, `level.ts` og `bots.ts` er uendret), så simuleringen gir samme tall som før.
- **Nye filer:** `paint.ts` (canvas-malerne), `materials.ts` (høydedis i shaderen, sola, UV i
  meter, stillasets materialer), `chapel.tsx` (rommet, vinduene, lyset, duer, forheng, det faste
  stillaset), `figures.tsx` (figurene og effektene), `fx.ts` (effektpoolen). `world.tsx` har bare
  hindrene igjen.
- **Rommet:** veggene er malt ved oppstart: sølv- og gulldraperier nederst, veggfreskene fra
  Botticelli/Perugino-tiden (landskap, folk i cangiante-drakter, Peruginos piazza med tempelet),
  vinduene med malte paver i nisjene, og det gamle hvelvet i lapis med gullstjerner. Første dag
  har hele hvelvet blått (han har ikke begynt); på Skapelsen er hvelvet ferdig malt fra inngangen
  fram til mesteren (malt arkitektur i travertin, profeter på troner, bildefelt, dagsverk-skjøter).
  Marmorgulv med rotae i porfyr og serpentin. Lyset er malt inn i veggene (likt på alle nivåer):
  vinduene kaster lyse flekker på nordveggen. Lyssøyler (additive flater), lysflekker, kalkstøv i
  lyset, varm dis nede mot gulvet (høydetåke i materialene), skyer som driver forbi sola hvert
  20. sekund (sol, søyler og flekker blekner og kommer tilbake). Sol med skygger på middels og høy.
- **Stillaset (lesbarhet først):** veggbjelkene i mørk gran med jernbeslag og skråstøtter ned i
  muren, og et svart hull der bjelken går inn (de ser festet ut). Løse planker bleke med rød flis
  på endene; de rister, drysser sagflis, knaker og faller med spon. Bramantes stillas henger i fire
  tau fra en løpekatt i hvelvet, med rødt bånd og et skilt (`crispCanvas`). Taljer med kalksekk og
  trinse, talje-heisen med krok, sekk og trinse som snurrer. Tørr puss med sprekker som faller med
  pussbiter. Våt puss som blanke, grå flekker. Marmorskranken, kalkkaret med jernbånd.
  Navnetavla «MICHELANGELO» under plattformen.
- **Figurene:** ledd-figurer (kropp, hode, armer, bein, bøtte) i toon med cangiante-skjær. Lærlingen:
  løp med armsving, strekk i hoppet, squash og støvsky ved landing, lener seg i svinger, hendene på
  kanten i kantgrep (kroppen henger under hendene), klatring på stige/tau/vegg med bøtta på beltet,
  fekting ved søl med pussprut, ser opp mot mesteren når han står stille, seiersdans på toppen.
  Fartstreker i fritt fall, i heisen og etter tau-flukten. Paven: hvit kjortel, rød kappe og lue,
  hvitt skjegg og stokk; klatrer med armene og rister stokken når han er nær. Mesteren står bøyd
  bakover med penselen mot taket (ikke liggende), vinker ned i starten og danser når bøtta er oppe.
  Spøkelset er en halvgjennomsiktig lærling. En garzone knuser farge i en morter på gulvet.
  Duer i vinduskarmene og én som flyr under hvelvet; forheng som blafrer hardere i trekken.
- **Juice:** sakte film ved nesten-bom (landing helt ytterst på kanten, kantgrep i fritt fall,
  talja som suser forbi), med lydfall og «NESTEN!». I mål: kameraet trekker seg ut og viser banen,
  mesteren og taket (bare ved mål), dagens felt blir til Adams hånd, og slutt-skjermen kommer etter
  3,2 s. Funn er bronsemedaljonger med lapis som glitrer, spretter, snurrer og krymper inn i kista.
- **HUD for fullskjerm:** navnetavler (tabula ansata) i travertin for tid og rekord/spøkelsesdiff
  og rent strekk, loddsnor som høydemeter (bøtte for deg, rød mitra for paven, kalkslam), puss-klokka
  som et malt felt der den våte flekken krymper fra kantene (rødlig og pulserende de siste 20 s),
  medaljonger for funn og tre stjerner som lyser underveis (i mål, funn, under måltid).
- **Lyd:** fottrinn på tre og stein, stigetrinn, dunk og skvulp ved hard landing, knak, trekk,
  søl, lydfall i sakte film og et orgel-kor (A-dur) i mål.
- Registry: `kunst` oppdatert, `cover` laget med selvspillet (`--cover`, lærlingen på Bramantes
  stillas høyt over gulvet). Spillet står i artikkelen etter avsnittet «I 1508 fikk Michelangelo ...».

**Portene:** simulering grønn (seende 100 % / 4201 p, middels 100 % / 2987 p, rett-fram og
knappemoser 0 %, 12 valg per minutt, press 0,05 -> 0,27). Selvspill grønt (seende 4119 p, samsvar;
Chromebook lav: 4,0 / 11,2 ms JS per bilde, 58 draw calls; bildeendring uten input 7,3). Scene-audit grønn, likhetsvakt grønn
(nærmest guddommelig-vind 0,44). Eget spill med ekte tastetrykk på bane 1 (`?kvalitet=lav`): stige,
hopp over skranken, hopp opp på veggbjelkene og videre som før; 32-43 bilder/s median i programvare-GL.

**Det som ikke virket.**
- Første draperi så ut som bølgeblikk (smale, harde folder). Nå brede forheng med damask og buer.
- Lyssøylene syntes ikke mot en solbelyst vegg. Veggene har nå lyset malt inn (MeshBasic), og
  søylene er sterkere; flekkene fra vinduene ligger på nordveggen.
- Selvspillet stoppet på «bildet står stille uten input» (1,0). Skyene som driver forbi sola og
  garzonen på gulvet ga 6-7.
- Scene-auditen målte hele kapellet som «modellen» (3/27 i bildet). Banen og paven er merket
  `sceneAuditIgnore`, så den måler figuren, som i andre tredjepersonsspill.

**Kjente svakheter.**
- Kameraet ser rett ned ved heisen og på østbroen (kamerareglene er ikke rørt); der ser man mest
  gulv og planker.
- Stjernene på endeveggene blir uskarpe helt inntil veggen (vindussjakta).
- Sakte film ved nesten-bom er bare testet i nettleseren, ikke i simuleringen (den er av for robotene).

### 2026-09-30 - Løft etter vurderingen (Gøy 3, Lesbart 3, Unikt 3), byggmester

**Gjort.** Bevegelsestallene, hopp/kantgrep og kameraets følgeregler og rotasjon (Q/E, mus, C)
er ikke rørt. Alt under legges oppå.
- **Kamera-lesbarhet.** Det som står mellom kameraet og figuren (bjelker, planker, broer, stillas,
  søyler), tones ut med skjermdør-dither i shaderen (`OCCL` i `materials.ts`, en kjegle fra kameraet
  mot figuren som slutter 1,4 m før den, så bjelken du står på aldri tones ut). Samme kjegle mot
  paven når han er under 12 m unna. Rommets skall (vegger, gulv, hvelv) er unntatt, det står aldri
  i veien. Figuren og paven har en silhuett gjennom geometri (lapis og rød, halvtett rutemønster,
  tegnet før figuren så den ikke lager silhuett på seg selv). Kameraet ser aldri brattere ned enn
  55 grader (`MAX_PITCH`): ved heisen og på østbroen sto det rett over figuren (90 grader); nå glir
  det bakover langs sin egen vinkel, og veggene er fortsatt grensa. Målt med robotene i node
  (`followCamera` + three sin projeksjon, 16:10 og 16:9): maks 55 grader på begge baner, figuren
  innenfor 80 % av bildet i alle bilder unntatt de første tiendelene etter en respawn. Når paven er
  like under deg, senkes blikket litt mot ham (bare siktet).
- **Press.** Paven: rødt felt på loddsnora som kryper oppover til der han er, merke med «PAVEN 6 m»
  som pulserer under 6 m, pesing og stokk som blir sterkere jo nærmere han er (under 16 m), og en
  pil i bildekanten når han er under 10 m unna og utenfor bildet. Puss-klokka: de siste 25 % blir
  feltet i taket rødbrunt og sprekker (egen sprekketekstur), HUD-feltet får sprekker, og det knaker
  i pussen. De siste 10 sekundene er panikk: hjerteslag, rød puls i bildekanten, «10 SEKUNDER!» og
  hørbare sprekker, uten kameraflytt. «På hengende håret» er nå regler i `game.ts` (deterministisk,
  med i simuleringen): landing like under søl-grensa (innen 0,45 m) eller helt ytterst på kanten,
  sekken som suser forbi, og å slippe unna paven etter at han var innen 2 m. Øyeblikket gir sakte
  film i nettleseren, poengene (100 × rent strekk) kommer når faren er over.
- **Presskurven** (`pressure`) måler nå det som står på spill: høyden (et søl der oppe koster mest),
  puss-klokka (bratt de siste 25 % og i panikken) og paven eller slammet. 0,05 -> 0,27 er blitt
  0,04 -> 0,21 -> 0,39.
- **De ni skapelsesbildene** (`panels.ts`). Hver fullført runde (bane eller utfordring) fyller ut
  neste felt i taket, i rekkefølgen Michelangelo malte dem fra inngangen: Noahs rus, Syndfloden,
  Noahs offer, Syndefallet, Skapelsen av Eva, Skapelsen av Adam, Skillet mellom vann og land, Sol
  og måne, Skillet mellom lys og mørke. Hvert felt har sitt eget maleri (canvas, cangiante) og ett
  faktum. Fremgangen lagres (`tak` i lagringen) og vises i menyen som ni felt over kista (malte
  felt med bilde, neste felt med gullkant, trykk for navn og faktum). I mål dypper mesteren
  penselen, bøyer seg bakover stående og maler feltet fram i brede strøk (alfamaske) mens kameraet
  trekker seg ut og ser opp på ham og feltet; tavla «Mesteren maler felt 5 av 9 / Skapelsen av Eva»
  kommer opp. «Dette skjedde» starter med feltet og faktumet; slutt-skjermen viser feltet og
  «Taket: 5/9 malt». Når alle ni er malt, retusjeres ett felt per runde.
- **Lesbart.** Lærings-kortet står ved siden av figuren på motsatt side av der den er på vei (aldri
  over figuren, neste hopp eller midten), eller øverst hvis det ikke er plass; ringen er skjult.
  Puss-klokka viser sekunder («83 s») på grønn, gul og rød bunn. Tastelinja viser bare det som
  trengs nå (løp/hopp i starten, stige, tau, kantgrep, vegg, balanse, heisen, R ved søl, Q/E etter
  første sjekkpunkt), hvert tips i fem sekunder per runde. Alle sju hindertypene har et
  lærings-øyeblikk når du nærmer deg dem første gang (`intros` i `level.ts`: løse planker, tau-stillas,
  talje, talje-heis, tørr puss, trekk, våt puss), også for den som går trygg vei. Kommer to på rad,
  venter det andre i kø. Maks 8 per runde (var 5).

**Portene:** simulering grønn (seende 100 % / 4401 p, middels 100 % / 2987 p, rett-fram og
knappemoser 0 %, 12 valg per minutt, press 0,04 -> 0,21 -> 0,39). Selvspill grønt (seende 4394 p,
samsvar; Chromebook lav 2,4 / 4,2 ms JS per bilde, 40 draw calls; lærings-øyeblikk heis, tau,
talje; lengste tekstdekning av midten 0,8 s). Scene-audit grønn (0 funn), likhetsvakt grønn
(nærmest guddommelig-vind 0,44). tsc og eslint rene. Eget spill med ekte tastetrykk gjennom bane 1
(`?kvalitet=lav`): samme rute og samme tid som før (24,2-24,4 s, null søl), 60 bilder/s median i
programvare-GL. Skjermbilder i `.screenshots/friskpuss-loft/` (bjelke tonet ut foran figuren, paven
nær, panikken, malt takfelt, taket i menyen).

**Kjente svakheter.**
- Maleriene i de ni feltene er enkle komposisjoner (ellipser og streker); de kjennes igjen på
  tema og farger, ikke på detaljer.
- Ditheren følger en kjegle mot figurens midte. En lang planke rett under kameraet (andre broen
  under buebroen) dekker fortsatt mye av bildet, bare gjennomsiktig i en sirkel rundt figuren.
- Etter en respawn glir kameraet fortsatt fra der det var (uendret regel), så figuren kan være
  utenfor den sikre sonen i noen tideler.
- Pussen tørker i taket over mesteren; eleven ser sprekkene der bare når feltet er i bildet (HUD-en
  viser dem alltid).

### 2026-09-30 - Giornata per etappe (Gøy 3 to ganger på rad: ny kjerneløkke), byggmester

**Gjort.** Bevegelsestallene, hopp/kantgrep og kameraets følgeregler er ikke rørt.
- **Etappe-klokka (giornata).** Den lange puss-klokka per bane er borte. Hver etappe mellom to
  sjekkpunkter har sin egen puss-klokke (`etapper` i `level.ts`: Første dag 6 / 14 / 16 s,
  Skapelsen 13 / 43 / 30 / 11 s). Ved hvert sjekkpunkt står et kalkkar (trekar med jernbånd og
  hvit kalk, neste kar lyser svakt): bøtta får fersk puss, og klokka fylles til etappens tid.
  Resten på klokka blir poeng, «VÅT PUSS +x» (20 per sekund). Tørker pussen, er det tilbake til
  kalkkaret du kom fra, minus 300 poeng og rent strekk (ikke game over); bare på «Uten
  sjekkpunkter» er runden da over. Arbeidsdagen (150 s / 300 s) er siste grense, så en runde
  alltid ender. Hopper en snarvei over et sjekkpunkt, får du 30 % av den etappens tid ekstra én
  gang (heisen på Skapelsen går rett forbi kalkkar 1). Panikken er de siste 9 s (40 % på korte
  etapper), med «7 SEKUNDER!» og sprekker, per etappe. Første kalkkar gir lappen «Fresko males på
  våt puss. Hver dag la de bare så mye puss som de rakk å male - et dagsverk, på italiensk
  giornata.»
- **Margin per etappe (middels robot, median).** Første dag 3,8 / 10,4 / 9,7 s av 6 / 14 / 16
  (37 %, 26 %, 39 %; p90 på siste etappe 13,9 s = 13 %). Skapelsen 9,0 / 32,2 / 22,3 / 7,9 s av
  13 / 43 / 30 / 11 (31 %, 25 %, 26 %, 28 %). Min egen runde med ekte tastetrykk og 3,5 s nøling
  ved talja: i mål med 2,8 s igjen på siste etappe.
- **Paven.** Går 1,8 ganger fortere når du har stått stille i over 1,5 s, 0,8 ganger når du beveger
  deg. Står du på samme gulv eller bjelke like ved stien hans (under 9 m), går han bort til deg.
  Han starter tidligere (1 s / 10 s) og er raskere (3,1 / 2,4 m/s). Målt: middels robot minst
  6,7 m / 4,0 m fra ham og vinner alltid; middels som nøler 4 s tas 30 av 30 på Første dag, og
  11 av 30 med 3 s nøling på Skapelsen. Passiv tas etter 13 s (var: arbeidsdagen).
- **Presskurven** er en sagtann per etappe (etappe-klokka, høyden, paven): 0,27 -> 0,46 -> 0,43
  ble 0,33 -> 0,53 -> 0,51 (var 0,04 -> 0,21 -> 0,39). Middels på Første dag: 0,2-0,6 i hver
  etappe, 0,9-1,0 i panikken på slutten.
- **Lapper ved kanten.** Lærings-øyeblikkene (kort med «Skjønner», sakte film) er borte. All
  tutorial- og fagtekst er korte lapper nederst til høyre (maks to, går av seg selv etter 4-8 s,
  stopper aldri spillet). Søl-lappen sto over figuren; den står nå der også.
- **Rammen.** Siktet løftes 24 % av halve bildet over brystet, så figuren står i nedre-midtre
  tredjedel; hodet (med luft over) kan aldri over halvveis mot toppkanten, føttene aldri under
  82 % mot bunnen (`frameFigure` i `camera.ts`, bare siktet). Målt med robotene på begge baner:
  brystet i median 60-63 % ned i bildet, hodet aldri høyere enn 29 % fra toppen (rett-fram-robotens
  fall 10 %), null kutt.
- **Stjerner og funn.** Menyen viser «★ under 40 s» / «★ under 75 s» på hver bane og i
  stjernelinja for valgt bane; HUD og sluttkort bruker samme bane. Sluttkortet skiller «funn på
  banen 1/3» fra «Lærlingens kiste (begge banene): x/12», og viser hvor mange ganger pussen tørket.
- **Mesteren i mål.** Etter oversiktsbildet går kameraet tett inn fra siden (profil, i høyde med
  brystet) mens han maler feltet: stående, bøyd godt bakover, hodet i nakken, begge armene opp
  (lengre maleøkt, 3,4 s). Lappen «Stående, bøyd bakover» og i «Dette skjedde»: «Han malte stående,
  bøyd bakover - ikke liggende, slik mange tror.»

**Portene:** simulering grønn (seende 100 % / 2570 p / 25 s, middels 100 % / 1520 p / 71 s,
rett-fram og knappemoser 0 %; vanligste tap: rett-fram «arbeidsdagen var over», knappemoser og
passiv «paven tok deg igjen»; 12 valg per minutt). Selvspill grønt (seende 2230 p, samsvar;
Chromebook lav 2,5 / 5,7 ms JS per bilde, 57 draw calls; 0 lærings-øyeblikk, 2 lapper; lengste
tekstdekning av midten 0,8 s). Scene-audit grønn (0 funn), likhetsvakt grønn (guddommelig-vind
0,44). tsc og eslint rene. Skjermbilder i `.screenshots/friskpuss-r3/` (panikk, kalkkar, lapp ved
kanten, paven nær, mesteren bøyd bakover, sluttkort).

**Kjente svakheter.**
- Robotene nøler ikke av seg selv; paven-mot-nøleren er målt med et eget testoppsett, ikke i
  simuleringsporten.
- Rett-fram-roboten taper nå på arbeidsdagen (300 s), ikke på et øyeblikk med drama; paven når
  den aldri fordi den søler hele tiden.
- Første etappe på Første dag er kort (6 s, bare stigen); panikken der er bare 2,4 s.
- Mesterens profil i nærbildet leses, men figuren er enkel; ansiktet syns dårlig når hodet er i
  nakken.

### 2026-09-30 - Rettelser etter vurderingen (mesteren i mål, silhuett, kamera, HUD), byggmester

**Gjort.** Styring, kameraets følgeregler, spillregler og balanse er ikke rørt (`game.ts`,
`level.ts` og `bots.ts` er uendret; i `camera.ts` er bare en ny hjelper lagt til nederst).
- **Mesteren i mål (fagstoff).** Han lente seg mot endeveggen, og kameraet sto oppe ved taket, så
  veggen så ut som et skrått blått felt. Nå går han de par skrittene til enden av plattformen lengst
  fra endeveggen (`masterPaintSpot` i `camera.ts`, minst 1,1 m fra lærlingen, ellers den andre
  enden), rett under takfeltet, med ryggen mot lærlingen. Positur: står oppreist, hoftene 17 cm fram,
  overkroppen bøyd bakover (brystet fram), hodet i nakken med ansiktet mot taket, begge armene rett
  opp. Penselen er kort og vinklet i hånda, så børsten ligger mot taket i stedet for å stikke
  gjennom det. Seiersdansen hans (og lærlingens) er små hopp med armene i V, så hendene holder seg
  under taket (bare 2 m over plattformen). Nærbildet: kameraet står rett fra siden, 4,4 m unna,
  35 cm over plattformen og ser litt opp; taket med feltet han maler ligger vannrett over dem i øvre
  halvdel av bildet. Kameraet holdes inne i rommet.
- **Blå artefakt.** Det lyseblå hodet og hånden var silhuetten: lærlingen hoppet med armene i været
  opp gjennom taket, og silhuetten tegnet det som sto bak taket. Silhuetten (lærlingen og paven) er
  av når runden er over, og hendene når ikke taket lenger. Spøkelset vises bare mens det løper; ikke
  etter at det har nådd enden av sporet sitt og ikke i mål-sekvensen.
- **Poengtekst.** Flytende tekst (snarveier, «på hengende håret», funn, våt puss, «NESTEN!») legges
  ved hodet til figuren (1,9 m) i stedet for 2,2-2,6 m over den, og holdes innenfor en sikker sone
  (`floatSafe`): under tavlene og bannerne i toppen (minst 36 % ned), over lappene, klar av loddsnora
  og klokka. Figuren i bane 2 ved heisen og på buebroen står med luft over seg (rammen fra forrige
  runde; `film-04` i playtest-mappa var et gammelt bilde fra før den).
- **HUD.** Puss-klokka viste allerede «x s» (den nakne «234» var fra den gamle klokka). Bare én lapp
  om gangen: en ny venter i kø (maks tre, samme lapp erstatter seg selv), og lappen om holdningen i
  mål går foran køen. «Funn 1/3» (eller 0/9) står ved medaljongene.

**Portene:** simulering grønn og uendret (seende 100 % / 2570 p / 25 s, middels 100 % / 1520 p /
71 s, rett-fram og knappemoser 0 %, 12 valg per minutt, press 0,33 -> 0,53 -> 0,51). Selvspill
grønt (seende 2550 p, samsvar; Chromebook lav 2,4 / 5,5 ms JS per bilde, 59 draw calls; lengste
tekstdekning av midten 1,0 s). Scene-audit grønn (0 funn), likhetsvakt grønn (guddommelig-vind
0,44). tsc og eslint rene. Skjermbilder i `.screenshots/friskpuss-r4/` (mesteren maler på begge
baner, lærlingen i mål uten artefakt, bane 2 ved heisen/buebroen med poengtekst, HUD med én lapp og
funn).

**Kjente svakheter.**
- På Første dag er endeveggen fortsatt med i venstre del av nærbildet (plattformen er bare 3,4 m
  bred), men nå som vegg bak lærlingen, ikke som et skrått felt.
- Ansiktet til mesteren er lite i nærbildet; bøyen leses mest på hofter, overkropp og armer.
- Poengteksten kan dekke hodet et øyeblikk når kameraet ser bratt ned (heisen), før den stiger.
