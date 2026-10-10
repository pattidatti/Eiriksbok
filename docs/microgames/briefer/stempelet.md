# Stempelet - brief

Artikkel: `public/content/historie/mellomkrigstiden/nansen-og-flyktningene.json`
(URL: /historie/mellomkrigstiden/nansen-og-flyktningene). Plassering: MicroGame-blokk etter blokk
27 («Nansen døde 13. mai 1930 på Polhøgda i Bærum ...»), som handler om Nansenkontoret, gebyrene
og frimerkene. `Papirlos` (blokk 16) står fra før og viser selve passet ved lukene; dette spillet
viser at passet måtte holdes i live.

Tone: **alvorlig**. Flukt og statsløshet, men kjernen er hjelpearbeidet. Ingen humor, ingen
morsomme feilmeldinger, ingen poengregn over mennesker. Telleren er «saker fornyet», og tap
skrives saklig.

Bestilling fra eieren: ingen (`/tmp/bestilling.txt` er tom).

## Konseptturnering

Fem konsepter, dommer runde 1 (Spillbart / Fagregelen avgjør):

| # | Konsept | Sjanger, perspektiv, hvem | Poeng | Dommerens begrunnelse |
|---|---|---|---|---|
| 1 | **Fangetogene** (1920-21): legg om sporveksler og få 450 000 krigsfanger hjem før vinteren | trafikkstyring, isometrisk 3D, Folkeforbundets oppdrag | 4 / 3 | Grepet er synlig, men for mange regler (sporveksler, fullhet, kasse, vinter, enkeltspor), og «vent til vogna er full» er venting. Regelen er generell logistikk. |
| 2 | **Stempelet** (Nansenkontoret 1931-38): forny passene før de går ut, og hold kontoret i live med gebyrer og frimerker | vedlikehold mot klokka / plate-spinning, bordplate, et kontor | **4 / 4 - VINNER** | Bånd som krymper, pass som rister og et stort stempel gir et fysisk verb hele tiden. Fagregelen er artikkelens: passet var midlertidig, ikke statsborgerskap, og kontoret levde av gebyrer og frimerker. Trekk: kassa er en fjerde ting og usynlig de første fem sekundene. |
| 3 | **Femti grenser**: du er passet i lomma til Sergej, hopp ham gjennom Europa | arkadehopper (Crossy Road), isometrisk 3D, en ting | 4 / 2 | Faren er biler og elver, ikke temaet. For nær `Papirlos`, og hopping passer dårlig med alvorlig tone. |
| 4 | **Kornet må fram** (hungersnøden 1921-22): kast kornsekker inn i vognene | kast og timing, fra siden 2D, en frivillig | 4 / 2 | Regelen er selvsagt, og det blir poengregn over mennesker i nød. |
| 5 | **Høykommissæren** (1921-30): sveip kort som i Reigns | kortspill, kort på bordet 2D, Nansen | 2 / 3 | Reigns krever lesing, og fire målere er for mye. |

**Løftet** (det dommeren krever for 5 på Spillbart), alt innarbeidet under:
- Maks tre synlige regler: bånd, stempel og én kasse. Gebyr og frimerker er slått sammen i kassa.
- Hvert pass viser enten en mynt eller en tom lomme. Tom lomme koster fra kassa. Eleven velger
  rekkefølge ut fra det de ser.
- Slaget har timing: et fullt KLONK fyller båndet helt, et dårlig slag bare halvt.
- Bordet fylles fortere enn én hånd rekker, så også den flinke er i fare.
- Ingen straffregel «bakerst i køen»: personen falmer bort og kan komme tilbake, men da koster
  stempelet mer.
- Rekorden har ikke tak: den teller saker fornyet.

## Designbrief

1. **Fantasien.** Du er saksbehandler ved Nansenkontoret i Genève, åpnet året etter at Nansen døde.
   Bordet ditt er fullt av Nansenpass. Hvert pass er et menneske med navn og bilde, og hvert pass
   har en dato der det går ut. Du vil at ingen skal bli papirløs igjen, og at kontoret skal klare
   seg helt til 1938.

2. **Kjerneverbet.** **Slå stempelet.** Et tungt messing- og nikkelstempel henger over bordet og
   følger musa (eller fingeren) med en liten forsinkelse, som om det veier noe. Hold inne: stempelet
   løftes, armen spenner seg, en ring rundt foten fylles. Slipp: stempelet smeller ned på passet
   under det. KLONK, bordet rister litt, oransje blekk sprer seg i et rundt stempelmerke, og passets
   bånd fylles på med et sveip fra venstre mot høyre. Det deilige er vekten: løft, slipp, slag, og
   et merke som blir liggende på papiret. Eleven slår hele tiden, fordi alltid ett bånd er kortest.
   - Timing: slipp mens ringen er i det lyse feltet (0,35-0,65 s holdt) = fullt KLONK, båndet fylles
     helt. For tidlig (under 0,35 s) eller for sent (over 0,9 s, armen skjelver) = skjevt slag,
     båndet fylles halvt og merket blir utvisket.
   - Treffer slaget ikke noe pass, skjer ingenting (et tomt dunk i bordet, ingen kostnad).
   - Tastatur: Tab eller piltaster flytter stempelet til neste pass, mellomrom holdes og slippes.
     Touch: hold fingeren på et pass, slipp.

3. **Fagkjernen.** Regelen: «**Hvis du ikke fornyer et Nansenpass før det går ut, blir personen
   papirløs igjen - for passet var aldri et statsborgerskap, bare et bevis på hvem du var. Og hvis
   kontoret fornyer gratis for alle, går kassa tom, for kontoret levde av gebyrene og
   Nansen-frimerkene.**»
   Eleven må huske tre regler, og alle tre står som tegning på en lapp festet til bordkanten:
   1. **Båndet krymper.** Når det er tomt, mister personen papirene (passet blir grått og glir bort).
   2. **Stempelet fyller båndet.** Fullt slag = helt fullt, skjevt slag = halvt.
   3. **Kassa.** Pass med mynt gir én mynt i kassa. Pass med tom lomme koster én mynt. Husleia
      trekkes ved hvert årsskifte.
   Frimerkeark og grå saker er ikke nye regler, bare ting som ligger på bordet og følger regel 3.
   Regelen kan ikke byttes ut: tar du bort utløpet, er det ingenting å gjøre; tar du bort kassa,
   fornyer man bare i rekkefølge. Det er spenningen mellom de to (hjelpe alle, men ha råd til det)
   som er spillet, og det var også kontorets virkelighet.
   Startverdier for `tuning.ts`:
   - Gyldighet: et fullt bånd varer 18 s (litt tilfeldig, 16-20 s, så båndene ikke går i takt).
   - Nytt pass: brett 1 hvert 7 s (maks 5 på bordet), brett 8 hvert 2,2 s (maks 10).
   - Andel tom lomme: brett 1: 0 %, brett 2: 30 %, brett 3: 35 %, stiger til 50 % i brett 8.
   - Kassa starter med 6 mynter. Mynt-pass +1, tom lomme -1, grå sak -2, frimerkeark +4.
   - Husleie ved årsskiftet: 2 mynter i 1931, +1 hvert år (9 i 1938). Justeres i simuleringen.
   - Grå sak: et pass som gikk ut, glir til «venteskuffen» ved bordkanten og kommer tilbake på
     bordet etter 6 s som en grå sak med tom lomme. Stemples den, er personen tilbake med fullt bånd.

4. **Presset og valgene.**
   - **Eskalerer:** (a) flere pass kommer inn og fler ligger på bordet samtidig (5 til 10); (b)
     flere har tom lomme, så kassa presses; (c) husleia stiger hvert år; (d) grå saker hoper seg
     opp hvis du mister taket, og de er dyrere. Tempoet i båndene endres ikke: et pass varer like
     lenge i 1938 som i 1931, men det ligger mange flere av dem.
   - **Nytt valg minst hvert 10. sekund:** hvilket pass først (det korteste båndet, eller en mynt
     mens kassa er lav?), tørr jeg ta et fullt slag nå eller ta et raskt halvt for å rekke neste,
     skal jeg ta den grå saken (koster 2) eller la den vente, skal jeg slå frimerkearket nå før det
     glir bort, holder kassa til husleia? `valg` i snapshot teller hvert slag på et nytt pass. Mål:
     minst 8 valg per minutt i brett 1, minst 18 fra brett 4. `press` følger antall pass på
     bordet / maks og andelen tomme lommer.
   - **Tempo:** ett brett = ett år = 24 s. Åtte brett (1931-1938), cirka 3 min 15 s til seier.

5. **Tap.** To måter, vist saklig: bordet blir stille, lyset i vinduet blir grått, og en
   maskinskrevet melding legges på bordet.
   - **For mange uten papirer** (6 grå saker i venteskuffen samtidig): «Seks mennesker står uten
     papirer. Et Nansenpass var ikke et statsborgerskap. Det måtte fornyes før det gikk ut, ellers
     var personen papirløs igjen. Slå passet med kortest bånd først.»
   - **Kontoret må stenge** (kassa har ikke nok til husleia ved årsskiftet): «Kassa var tom da
     husleia skulle betales. Nansenkontoret levde av gebyrene på passet og av salg av
     Nansen-frimerker. Stemple passene med mynt først når kassa er lav, og slå frimerkearket
     når det ligger på bordet.»
   Ny runde på ett trykk.

6. **Seier.** Holder kontoret til nyttårsaften 1938, vinner eleven - uansett hvor mange saker de har
   fornyet. Bordet blir stille, et telegram legges på bordet: «Nansenkontoret får Nobels fredspris
   for 1938.» Under, saklig: «Det virkelige kontoret behandlet rundt 800 000 saker. Da det ble lagt
   ned i 1939, trengte rundt 500 000 flyktninger fortsatt hjelp.»

7. **En runde til.**
   - **Rekord:** saker fornyet (ingen multiplikator: ett slag er én sak, alltid ærlig). Vises som
     en nummereringsmaskin på bordet («Sak nr. 000 214»), rekorden som et blyantmerke i kanten.
   - **Ranger:** Kontorbud (0), Ekspeditør (40), Saksbehandler (90), Kontorsjef (150), Direktør for
     Nansenkontoret (220 og seier). Tallene justeres i simuleringen.
   - **Funn: Arkivkortene.** Ti oppdiktede personer (som Sergej i artikkelen), seks fra Russland og
     fire fra Armenia. Fornyer du samme person tre ganger i én runde, legges kortet hans eller
     hennes i arkivskuffen for godt. Hvert kort har ett ansikt og én setning om hva passet lot dem
     gjøre («Anahit fikk lov til å jobbe som syerske i Marseille.»). Samlingen vises i startmenyen.
   - **Stø hånd:** antall fulle KLONK på rad vises som små merker i margen. Det gir ingen ekstra
     saker, men en egen rekord («Lengste rekke rene stempler»).

8. **Sjanger, perspektiv, 2D/3D.** Vedlikehold mot klokka / plate-spinning med et timingslag
   (Papers, Please møter en hammer). **3D**, fast skrått kamera fra saksbehandlerens stol, om lag
   55 grader ned mot bordet. Begrunnelse: stempelets vekt er hele verbet, og den kjennes bare når
   stempelet kommer ned mot bordet i dybden, kaster skygge og treffer. Et flatt bord rett ovenfra er
   også brukt i Rederens kart; vi skal ha et annet perspektiv. Scenen er liten (ett bord, maks ti
   pass), så 3D er trygt på Chromebook.

9. **Look.** Mellomkrigstidens verdipapir-trykk: Nansenpassets grønne guilloche-mønster på kald
   papirhvit, et oransje fornyelses-stempel, på et mørkegrønt skrivebord i kaldt dagslys fra et høyt
   vindu i Genève.

10. **Første fem sekunder.** Eleven ser et bord med tre pass. Hvert pass har et ansikt, et navn og
    et grønt bånd langs underkanten. Ett bånd er nesten tomt og rødt, og passet rister. Stempelet
    henger over bordet og følger musa. En svak hånd-pil peker på det ristende passet. Eleven fører
    stempelet dit, holder (ringen fylles), slipper: KLONK, oransje merke, båndet fylles grønt. Ingen
    tekst trengs.

11. **Første minutt - opptrappingen.**
    - **Brett 1 - 1931 (bare stempelet).** Tre pass, alle med mynt, ny hvert 7. sekund, maks 5.
      Kassa ligger synlig i hjørnet, men husleia er lav (2) og alle betaler, så den fylles av seg
      selv. Det eneste eleven lærer: før stempelet til det korteste båndet, hold, slipp i det lyse
      feltet. Første slag gir et lite hint ved ringen («slipp nå») bare én gang. Et pass får ikke gå
      ut i brett 1 før det har ristet i minst 4 s. Valg: hvilket av tre-fem pass, og fullt eller
      raskt slag.
    - **Brett 2 - 1932 (tom lomme).** Nytt: pass med tom lomme (30 %). Det første kommer alene, på
      et bord der kassa har nok. Slås det, flyr en mynt fra kassa over til passet, så eleven ser
      kostnaden. Ved årsskiftet trekkes husleia (3) synlig fra kassa. Nå er valget: ta mynt-passene
      først for å ha råd til de tomme? Ny hvert 5,5 s, maks 6.
    - **Brett 3 - 1933 (frimerkearket).** Andelen tomme lommer stiger til 35 %, og kassa begynner å
      synke. Da, og først da, glir et ark Nansen-frimerker inn på bordet (lapp: «Norge og Frankrike
      solgte egne Nansen-frimerker.»). Slå det, og det blir +4 i kassa. Arket ligger i 8 s og glir
      så bort. Det kommer ett ark per brett herfra. Ny hvert 4,5 s, maks 7.
    - Grå saker får ingen egen innføring: første gang et pass går ut, glir det grått bort med en
      kort lapp («Passet gikk ut. Personen er papirløs igjen.»), og kommer tilbake etter 6 s. Fra
      brett 4 er alle tre reglene i bruk, og presset stiger bare med antall pass og husleie.

## Kunstbrief

1. **Kilden.** Mellomkrigstidens sikkerhetstrykk på pass, verdipapirer og gebyrmerker, slik
   Nansenpasset selv så ut: et sertifikat med Nansens gebyrmerke klistret på. Tre kjennetegn:
   (1) **guilloche** - tette, fine linjer som slynger seg i rosetter og bølgebånd langs kanten,
   trykt i én farge; (2) **gebyrmerket** - et lite frimerke med takkede tagger rundt og et
   graveret portrett, klistret på og stemplet over; (3) art deco-typografi i geometriske
   versaler fra Genève og Paris på 1930-tallet. Bordet er et kontorbord i Folkeforbundets by:
   mørkt grønt skinnunderlag, nikkel og messing.
2. **Palett.**
   - `#22302b` mørk skogsgrønn skrivebordsunderlag (bakgrunn)
   - `#efe9da` kald papirhvit (passene)
   - `#3f8f6b` guilloche-grønn (passmønsteret og et fullt bånd)
   - `#e07a2e` oransje stempelblekk (spillerens slag, merket, gevinst)
   - `#a8231f` dyp rød (bånd som går ut, husleie, fare)
   - `#c7c9c6` nikkel (mynter, kassa, stempelfoten); tekst i `#15171a`
3. **Form og overflate.** Flate farger med fin trykk-tekstur. Passene er tynne bokser med en
   canvas-tekstur: guilloche-ramme, et lite ovalt fotografi (silhuett i gråtoner), navnet i
   versaler og et gebyrmerke med takker i hjørnet. Båndet er en egen tynn flate langs underkanten
   som skaleres i x og går fra grønt mot rødt. Stempelmerkene er en rund rosett med tekst i ringen
   («NANSEN · GENÈVE · 1934») som tegnes inn i passets canvas og blir liggende; et skjevt slag gir
   et utvisket, halvt merke. Grå saker er samme pass, avfarget og halvgjennomsiktig. Stempelet er
   en enkel sylinder i nikkel med et messinghåndtak. Ingen konturer, ingen gradienter unntatt
   vinduslyset.
4. **Lys.** Kaldt dagslys fra et høyt vindu til venstre. Vinduets sprosser kaster skrå skygger over
   bordet. Skyggen glir langsomt over bordet i løpet av ett år (ett brett), og fargen skifter med
   årstiden: blåhvitt om vinteren, varmere om sommeren. Det er klokka og kalenderen uten tall.
   Ved tap blir vinduslyset grått; ved seier faller et lavt, varmt desemberlys inn.
5. **Perspektiv og kamera.** 3D, fast skrått kamera fra stolen, cirka 55 grader ned, svakt
   perspektiv, bordet fyller bildet. Stempelet kommer inn ovenfra og kaster en skygge som krymper
   når det løftes og vokser når det slår. Ved KLONK rister kameraet 2-3 px i 0,1 s. Ulikt de tre
   siste: flatt kart rett ovenfra (Rederens kart), tverrsnitt fra siden (Gamma), sidescroll
   (Pengeballongen).
6. **Typografi og HUD.** HUD-en er tingene på bordet. Årstallet står på en blokkalender som rives
   av ved hvert årsskifte. «Saker fornyet» er en nummereringsmaskin i nikkel. Kassa er en
   metallkasse med en synlig stabel mynter; husleia kommer som en rød regning som tar myntene.
   Venteskuffen er en grå trekasse ved bordkanten med de grå sakene synlig i. De tre reglene står
   som tre små tegninger på en lapp festet med binders. Overskrifter i art deco-versaler (Google
   Fonts `Josefin Sans` 600-700), brødtekst i `Source Serif 4`, aldri under 18 px. Navnene på
   passene i versaler, store nok til å leses på 1366 x 768.
7. **Slik lages det på en Chromebook.** R3F med fast kamera. Bordet er ett plan med en
   canvas-tekstur (skinn, korn, slitte kanter) tegnet én gang. Vinduskyggen er ett plan med
   alfa-tekstur av sprossene som flyttes og farges; ingen sanntids-skygger fra lys. Stempelets
   skygge er en mørk, myk skive under det. Alle pass deler én guilloche-grunntekstur; hvert pass
   har en liten egen canvas for navn, bilde og stempelmerker, som oppdateres (`needsUpdate`) bare
   når det stemples. Bytt aldri `map` til `null`. `MeshLambertMaterial` eller `MeshBasicMaterial`.
   Maks 10 pass og 1 frimerkeark. Ingen bloom. Ser ferdig ut på `?kvalitet=lav`; høyere nivåer
   legger til fint papirkorn og en svak støvpartikkel-stripe i vinduslyset.
8. **Ikke slik.** Ikke fiolette gummistempler, grå og brun arkivpapp og maskinskrift (Tinghuset).
   Ikke gulnet papir, blått blekk og parafinlampe (Rederens kart). Ikke svarte tresnitt-konturer
   (Gamma), ikke litokritt (Pengeballongen). Ikke pikselkunst som Papers, Please. Ikke `Papirlos`
   sitt utseende med luker. Ikke koselig og varmt: det er et kaldt kontor der hvert minutt teller.

## Byggelogg

- **Fase: designer (brief).** Skrev konseptturnering, designbrief og kunstbrief for vinneren
  (konsept 2, 4/4) med dommerens løft. Ingen simulering ennå. Endret fra konseptet: 3D skrått
  kamera i stedet for 2D rett ovenfra (Rederens kart er flatt ovenfra), og oransje/grønn
  guilloche-look i stedet for fiolett stempelblekk (Tinghuset). Kjente svakheter å sjekke i
  gråboksen: om timingen i slaget gjør det for tregt når bordet er fullt, og om husleia (2 til 9)
  gir et reelt kassapress uten å bli umulig.
- **Fase: gråboks (bygg 3a).** Bygde reglene i `src/components/microgames/stempelet/` (KART.md,
  tuning.ts, levels.ts, state.ts, rules.ts, game.ts, bots.ts, sim.ts) og visningen med primitive
  former (world.tsx, hud.tsx), `Stempelet.tsx` med usePlaytest, og registrering i `registry.ts`.
  Opptrappingen fra punkt 11 ligger i `levels.ts` (1931 bare mynt og maks 5, 1932 tom lomme der
  den første er tvunget, 1933 frimerkearket, så flere pass og høyere husleie).
  **Simuleringen er grønn** (200 runder per robot): saksbehandler (vinner) 100 %, median 130 saker;
  nybegynner (middels) 86 %, median 119; gratis-for-alle (taper) 0 %, median 100, går tom ved
  husleia rundt 1936; knappemoser 0 %, median 26; passiv 0 %. 43 valg per minutt, presset går
  0,47 -> 0,78 -> 0,95. Selvspillet i nettleseren: vinneren vant med 130 (samme som simuleringen),
  Chromebook 24 draw calls, p95 5 ms per bilde. Eneste portfunn: coverbildet mangler (ventet).
  **Endringer fra briefen (tallene som ble justert, og tre nye regler):**
  - Et pass kan bare stemples når båndet er under 50 % (`pass.fornyFra`); lomma vises først da.
    Uten dette kunne man slå samme mynt-pass om og om igjen og tjene uendelig.
  - Lomma (mynt/tom) er fast for personen, ikke trukket på nytt ved hver fornyelse, og andelen
    tomme lommer fordeles med en jevn teller i stedet for terningkast (mindre flaks mellom runder).
  - Personer reiser videre med gyldig pass etter 40-70 s (`pass.blirMin/Maks`), så bordet får nye
    folk og årets andel tomme lommer virker. Det er også stedet arkivkortene utløses (3 fornyelser).
  - Tom lomme koster 2 (ikke 1), grå sak 3 (ikke 2). Husleie 2 + 1 per år som i briefen.
  **Prøvde som IKKE virket:** (1) lomma trukket på nytt hver gang: hele bordet ble mynt fra 1931,
  og «gratis for alle» vant 34-80 %. (2) Fornyelse fra 70 % bånd: den som stempler alt tidlig fikk
  flest saker og slo vinneren på poeng. (3) Tom lomme -1: kassa ble aldri et problem for den som
  fornyer alle. (4) Terningkast for tomme lommer: for stor spredning (gratis-for-alle p90 over
  vinnerens median).
  **Kjente svakheter:** Vinneren taper aldri (100 %) og har 40+ mynter i 1935 - briefen vil at også
  den flinke skal være i fare; stram `kasse.husleieØkning` eller `BRETT[].tom` sent i runden når
  kunsten er på plass. Den flinke strategien (mynt tidlig, tomme lommer sent) er ikke forklart i
  spillet; den bør vises i et lærings-øyeblikk eller en lapp. Bordet er stort og passene små i
  bildet (kameraet kan gå nærmere). Ingen navn eller ansikter på passene ennå, ingen lyd, ingen
  arkivkort-visning i menyen (bare tellet). Skjermbilder: `.screenshots/playtest/stempelet/`.
- **Fase: gråboks etter diagnose 1 (Forståelig 2, Eleven gjør 3).** Gjorde de tre endringene.
  (1) Økonomien er fysisk: lomma er en gyllen mynt som stikker opp, eller et åpent svart hull;
  hver lomme har en lapp med +1, -2 eller -3. Ved slaget flyr myntene i en bue til eller fra en
  synlig myntstabel (én gyllen mynt per mynt i kassa, søyler på ti). Husleie-regningen ligger ved
  siden av: ett hull per mynt i husleia og en rød strek som krymper mot nyttår; ved nyttår flyr
  myntene fra stabelen ned i hullene. Det oransje feltet er byttet med et hvitt treffefelt (ringen
  blir hvit inne i feltet, rød etterpå), og stempelmerkene er fylte flekker, ikke ringer. Den
  grå kassa og sylinderen er borte. Tekstlappen med seks linjer og hjørneboksene for kassa og
  papirløse er fjernet; bordet har tre merkelapper («Kassa: 21», «Husleie ved nyttår: 8»,
  «Uten papirer: 0 av 6»). Reglene står fortsatt i menyen.
  (2) Presset: husleia er en liste per år, `kasse.husleie = [4, 6, 8, 9, 10, 10, 10, 10]` (var
  2 + 1 per år). En ny tom lomme får samme bånd som et mynt-pass på bordet (`pass.parAvstand`
  1,5 s), så de går ut samtidig og eleven må velge.
  (3) Tapet: den svarte blokka er papirløs-hylla med seks spor (det siste rødt). Grå pass glir
  inn i et spor; et grått pass som er tilbake på bordet vises gjennomsiktig i sporet sitt. Passet
  glir fra hylla tilbake til plassen sin som grå sak med et større svart hull og -3.
  **Simuleringen er grønn:** saksbehandler (vinner) 99 %, median 126; nybegynner (middels) 34 %,
  median 117; gratis-for-alle (taper) 0 %, median 77; knappemoser 0 %, passiv 0 %. 42,5 valg per
  minutt, press 0,47 -> 0,78 -> 0,95. Eget måleskript for vinneren: kassa før husleia er
  17/23/29/30/29/24/18/12 mot husleie 4/6/8/9/10/10/10/10, sluttkasse etter siste husleie median
  0,2x husleia (før betaling 1,2x), og 40 % av rundene har minst ett papirløst pass. Selvspillet:
  vant med 127 (simuleringen 126), 38 draw calls (var 24), p95 6,1 ms på Chromebook-nivå.
  **Prøvde som IKKE virket:** husleie 6 + 3 per år eller 8 + 3: alle roboter taper. Husleie
  4/7/9/10/11/11/11/11: vinneren nede i 78 %. Start-kasse 4: vinneren under 75 %. Paringen av
  tom lomme og mynt-pass gjorde vinneren *rikere* med lav husleie (den samler de tomme lommene
  sent), så den virker bare sammen med høyere husleie.
  **Kjente svakheter:** Vinneren har fortsatt en topp på rundt 30 mynter midt i runden (1934-35,
  3x husleia); presset er ekte først fra 1936. Den nest siste passplassen til høyre (x 3,2) ligger
  tett inntil regningen. Ingen ansikter eller navn på passene, ingen lyd. Myntene som flyr ved
  husleia vises over regningen litt etter at nytt år har startet (regningen viser da neste års
  hull). Kassa kan vise rundt 60 mynter; flere blir ikke tegnet.
  Skjermbilder: `.screenshots/playtest/stempelet/film-05-55s.png`, `film-07-110s.png`, `film-08-150s.png`.
- **Fase: bygg 3b (kunst, juice, tekst) etter diagnose 2.** Diagnose 2 punkt 1 og 2 er gjort, og
  fra punkt 3 bølgen fra Saar (1935). Endringer i reglene:
  (1) Dilemmaet: `BRETT[].tom` løftet sent i runden (0,42/0,45/0,5/0,53/0,52 fra 1934), husleia
  `[4, 6, 8, 9, 10, 10, 10, 8]`, startkasse 7. `g.mistet` logger hvem som ble papirløs og når.
  Ny måling `målMistet(bot)` i `sim.ts`: vinneren mister median 2 (p10 0, p90 5) og vinner 93 %.
  To pass med under 2,2 s bånd samtidig gir hendelsen `dilemma`: spillet går i sakte film i 0,5 s,
  begge passene lyses opp, og lappen «Begge går ut nå. Hvem tar du?» (to første gangene).
  Den som mister papirene, glir inn i hylla som et kort med bilde, navn og år («Olga, 1934»),
  navnet stiger opp over hylla, og slutt-skjermen nevner dem i «Dette skjedde».
  (2) Pris og tid på passet: båndet brenner som en lunte (grønt, gult, rødt, blinker til slutt,
  gnist i enden), mynt eller tomt felt med rød kant på passet, +1/-2/-3 ved lomma. Når stempelet
  svever over et pass som koster, blinker myntene som vil forsvinne rødt i stabelen; over et
  mynt-pass eller frimerkearket vises gylne spøkelsesmynter. Mangler kassa til husleia, står
  røde hull i stabelen. Regningen har nedtelling («Husleie 10 · nyttår om 12 s») og blinker
  rødt når kassa er lav. Hylla har ingen røde spor lenger. Kalenderen viser åtte år som ruter
  (ferdige grønne, nå oransje) i stedet for linja som så ut til å gå baklengs. Saksnummeret er en
  liten nummereringsmaskin oppe til høyre. Tab/Mellomrom er fjernet; bare musa/fingeren styrer.
  Før første slag viser timingringen seg på passet som rister og fylles av seg selv i en løkke.
  (3) 1935: tre flyktninger fra Saar på en gang (banner, lærdom, personer KARL, MARIA, JOHANN, ELSE).
  Kunst: canvas-teksturer for bord (valnøtt rundt skogsgrønt skinn med gullinje), pass
  (guilloche, rosett, ovalt portrett i gråtoner, navn i versaler, gebyrfelt, stempelmerker med
  «NANSEN · GENÈVE · 1934» i ringen), frimerkeark, regning og hyllekort. Vinduslyset glir over
  bordet gjennom året og skifter farge (vinter blåhvitt, sommer varmere, grått ved tap, lavt
  desemberlys ved seier). Stempel i nikkel/messing/tre som lener seg etter bevegelsen. Juice:
  hit-stop 70 ms, kamerarykk, stempelet klemmes, blekk spruter og blir liggende som dråper,
  sjokkring, passet dukker seg, mynter flyr i bue og klirrer, kalenderen rives av ved nyttår,
  nummereringsmaskinen ruller. Lyd fra arkadeskallets synth (dunk, klirr, stille tone når noen
  mister papirene), knapp for lyd av/på. Arkivkort vises i menyen og på slutt-skjermen.
  Kamera: fov 35, (0, 7,3, 5,0) mot (0, 0, 0,45); hylla og kassa ligger foran passene.
  **Simuleringen er grønn:** saksbehandler 93 %, median 126; nybegynner 12 %, median 116;
  gratis-for-alle 0 %, median 78; knappemoser 0 %, median 24; 43 valg per minutt; press
  0,47 -> 0,82 -> 0,97. Selvspillet: vinneren vant med 122 (simuleringen median 126), 52 draw
  calls, p95 14,4 ms per bilde på Chromebook-nivå; audit og likhetsvakt grønne (nærmest gamma 0,29).
  Ytelse: passets felles grunn (guilloche og rosett) tegnes én gang og kopieres; hylla regnes én
  gang per bilde. Uten dette var p95 35 ms. Bordet ble lysere flaskegrønt (`#2a6450`), fordi det
  mørke grønne lå for nær Inn mot stranda i likhetsvakten (0,53). Plakaten er fra sekund 70.
  **Prøvde som IKKE virket:** tom-andel 0,45-0,55 fra 1934: vinneren nede i 40 %. Husleie 8 i 1938
  alene ga median 1 mistet (for lite dilemma). Kamera med fov 36 og hylla/kassa på sidene: hylla
  og kassa ble klippet av ved 1366 x 768. «Rent treff gir helt år» ble ikke laget: robotene slår i
  steg på 0,2 s og kan ikke treffe midten, og det ville vært en fjerde ting å huske.
  **Kjente svakheter:** Nybegynneren vinner bare 12 % (taper på kassa i 1938). Vinneren taper
  fortsatt i rundt 7 % av rundene, alltid på husleia i 1938, så selvspillet kan en sjelden gang
  vise en tapt vinnerrunde. Teksten på hyllekortene er liten (det står også i lappen og på
  slutt-skjermen). Lærings-kortet kan dekke et par pass mens det står (sakte film).
- **Fase: forbedrer etter vurdering 1 (sum 19: Forståelig 4, Myk start 4, Eleven gjør 4,
  Utseende 3, Lærerikt 4).**
  (1) Det passet GA: når en person reiser videre, glir passet ut over bordkanten, en hvit
  tekst sier «Vera reiser til Belgia», og et skilt øverst på midten teller «Reist videre med
  passet: N · Nansenpasset ble godtatt i over 50 land». Når et pass går ut, står «Avvist ved
  grensen» på passet før det glir grått ned i hylla.
  (2) Gebyret er synlig før stempelet: fra 1932 ligger mynten eller den tomme lomma på passet
  fra det kommer (mindre og stille til passet kan fornyes), passet har teksten «BETALER» eller
  «TOM LOMME» under gebyrfeltet, og lappen ved lomma sier «Betaler +1», «Gratis -2» eller
  «Grå sak -3». Timingringen er tatt bort: hvert slag fyller båndet helt (holdt inne løfter
  bare stempelet). Ferdigheten er nå hvem du tar først og hva kassa tåler.
  (3) Én ny ting per år: 1931 har ingen penger (`BRETT[].penger`): ingen lommer, ingen kassa,
  ingen regning, grå saker koster ingenting. I 1932 glir kassa og regningen inn fra høyre med
  lappen «Nytt i 1932: gebyr, kassa og husleie». 1933 frimerkearket (som før). Menyen er én
  setning. Rommet: en kø med ansikter bakerst på bordet («I KØEN», 2 i 1931 til 9 i 1938, ny
  rekkefølge når et pass kommer), en avis med årets overskrift (1931 Nansenkontoret åpner,
  1932 krisen, 1933 Hitler, 1934 Saar skal stemme, 1935 Saar blir tysk, 1936 Spania, 1937
  Nansenhjelpen, 1938 Østerrike) og telegrammet om fredsprisen sent i 1938. Mappene er borte.
  Passbildene er håndkolorerte og ulike (hudtone, hår, lue, hatt, skjerf, briller, skjegg,
  bakgrunn). Regler eleven må huske: tre (båndet/stempelet, betaler eller gratis, husleia).
  Feel-lista: før runden var 1 (hver handling svarer) og 4 (belønningen merkes) på plass. Lagt
  til 2: «I siste liten!» med egen lys tone når et pass reddes med under 1,2 s igjen. Lagt til
  3: passene glir ut (opp over kanten når de reiser, ned i hylla når de går ut) i stedet for å
  forsvinne mellom to bilder; kassa og regningen glir inn i 1932.
  Tall: startkasse 12 (var 7), husleie `[0, 6, 8, 9, 10, 10, 10, 8]`. Nybegynneren slår ikke
  skjevt lenger, bare tregt (pause 4 grep).
  **Simuleringen er grønn:** saksbehandler 91 %, median 122; nybegynner 40 %, median 107;
  gratis-for-alle 0 %, median 78; knappemoser 0 %, median 24; passiv 0 %; 42 valg per minutt;
  press 0,47 -> 0,82 -> 0,96. Selvspillet: vant med 127, 39 draw calls, p95 8,1 ms på
  Chromebook-nivå. Audit grønn, likhetsvakt grønn (nærmest gamma 0,30).
  **Prøvde som IKKE virket:** startkasse 8 og 10 uten inntekt i 1931: vinneren nede i 67 % og
  78 % (taper på husleia i 1938). Nybegynner som glemmer frimerkearket: 0 % seier, for stor
  avstand til vinneren. Første skilt-tekst i 13 px ble målt til 12,7 px i fullskjerm (nå 14).
  **Kjente svakheter:** Uten timing er stempelslaget ett grep; variasjonen ligger i valget av
  pass. Regningen ligger fortsatt tett inntil passplassen lengst til høyre. Teksten i køen og
  på avisa er liten (pynt, ikke regler). Banneret for arkivkort kan dekke køen et øyeblikk.
