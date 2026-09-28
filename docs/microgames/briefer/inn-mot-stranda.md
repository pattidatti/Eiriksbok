# Inn mot stranda

Artikkel: /historie/andre-verdenskrig/d-dagen («D-dagen: Invasjonen i Normandie 1944»)
Tone: `alvorlig` - Omaha var den blodigste stranda. Ingen vitser, ingen poeng for å drepe: poengene er
for båter som kom i land, bunkere flåten tok ut og granater du unngikk.

## Konseptturnering

Første turnering (nattsporet 28.09) hadde fem konsepter. Dommeren valgte «Spøkelseshæren»
(Operasjon Fortitude: pump opp gummitanker og dra nett over skip, Gøy 4 / Fag 4). Spillet ble
bygget og fikk 19 av 25 to ganger, med Gøy fast på 3. Eieren prøvde det og sa: «Spillet ser nydelig
ut og fett, men spillopplevelsen er gørrkjedelig. Holde inne en knapp for å blåse opp? Denne er jo en
insane setting. Hvorfor ikke et insane skytespill, bomber, styre flåten?» Spøkelseshæren ligger
parkert på grenen `claude/microgame-parkert-spokelseshaeren`.

Lærdom for generatoren: en dramatisk setting skal ha action. Dommeren vektet kløkt over fysisk
spenning.

Ny runde, tre action-konsepter lagt fram for eieren:

1. **Inn mot stranda** - styr landgangsbåten mot Omaha, unngå granatene, la slagskipene ta
   bunkerne, og treff sporene når tidevannet skjuler hindrene. Styring + bombing + unnvikelse.
2. **Natt til morgen** - tre faser (fallskjerm i fullmåne, flåten bomber, landgang ved lavvann).
   Mest variert, men for stort til å bli ferdig i dag.
3. **Kanonene fra havet** - rent skytespill med slagskipenes kanoner mot bunkere.

**Eierens valg: Inn mot stranda.**

## Designbrief

1. **Fantasien.** Du fører en landgangsbåt med 30 soldater inn mot Omaha morgenen 6. juni 1944.
   Du vil ha så mange båter i land at brohodet holder.
2. **Kjerneverbet.** Styre båten (piltaster/A-D, eller hold pekeren på havet) mellom granatnedslag,
   og sikte salver fra slagskipene mot bunkerne på skrenten (tre granater sprer seg rundt
   siktepunktet, så må de lade om i 2,8 s). Begge hendene er i bruk hele tiden.
3. **Fagkjernen.** Hvis du går i land ved lavvann, står hindrene tørt og synlig, og ingeniørene
   sprenger et spor gjennom dem. Når tidevannet stiger, ligger hindrene under vann: da er de gule
   sporene den eneste trygge veien inn. Og hvis flåten ikke skyter ut bunkerne, skyter de seg inn og
   treffer bedre og bedre.
4. **Presset og valgene.** Tidevannet stiger (06:30-08:00). Nye bunkere åpner ild, ødelagte bunkere
   bemannes igjen etter 18 sekunder, og en bunker i fred blir mer treffsikker for hvert skudd.
   Valg hvert par sekunder: hvor granaten lander, hvilken bunker slagskipene skal ta (de må lade om),
   hvilket spor du sikter på, gass eller brems.
5. **Tap.** Brohodet faller hvis fire av åtte båter går tapt. (a) Skutt i senk: «klikk på bunkerne -
   en bunker i fred treffer bedre og bedre». (b) Mine under vann: «når vannet dekker hindrene, kjør
   i de gule sporene».
6. **Seier.** Fem av åtte båter i land: brohodet holder, som det gjorde på Omaha.
7. **En runde til.** Multiplikator for båter i land på rad, bonus for landing i sporet, «NÆRT!» for
   granater du så vidt unngikk, rekord og ranger fra «Rekrutt i båten» til «Første bølge».
8. **Sjanger, perspektiv, 2D/3D.** Styring og skyting (top-down arkade), rett ovenfra som et
   rekognoseringsfoto. 2D-canvas: flybildet er flatt av natur, og korn og fettstift er billig på en
   Chromebook.
9. **Look.** Et alliert svart-hvitt flyfoto av Omaha med rød og gul fettstift.
10. **Første fem sekunder.** Båten glir ut fra kanten av bildet mot en stripe med stålkryss på
    sanden. En rød ring dukker opp foran båten, og et kort sier: «Den røde ringen viser hvor granaten
    lander. Styr unna.»

## Kunstbrief

1. **Kilden.** Allierte rekognoseringsfoto av Normandie-kysten 1944: svart-hvitt sølvkorn, harde
   slagskygger, filmkant med påtrykt dato, og fotoanalytikerens fettstift-markeringer oppå.
2. **Palett.** Fotopapir `#e7e0cd`, sand-grå, havgrå `#34322c`, blekk `#15130f`, fettstift-rød
   `#d7372b` (fare, granater, bunkere som skyter), fettstift-gul `#f1c232` (deg, sporene, flåten).
3. **Form og overflate.** Alt i verden er foto: korn, vignett, ingen konturer. Bare fettstiften har
   farge og strek - ujevne, håndtegnede ringer og linjer.
4. **Lys.** Grå morgen, flatt lys, røyk som driver langs stranda.
5. **Perspektiv og kamera.** Rett ovenfra, fast utsnitt: skrenten øverst, stranda i midten, havet
   nederst. Båtene kommer nedenfra.
6. **Typografi og HUD.** Filmkant øverst med dato, klokkeslett og tidevann. Båtkortet (én rute per
   bølge) og en ladeskive for slagskipene nederst.
7. **Slik lages det på en Chromebook.** Skrent, sand, hav og korn tegnes én gang til canvaser utenfor
   skjermen. Hvert bilde: vannet klippes fra havcanvasen opp til vannkanten, pluss noen få former per
   båt, hinder og granat. Røyk er sju radielle gradienter.
8. **Ikke slik.** Ikke et farget kart (Plottebordet), ikke en 3D-by (Løp med lønna), ikke en grønn dal
   (Regnet i Lærdal).

## Etter vurderingene

- Runde 1 (18): Gøy 3, Utseende 3. Svake treff, feil teller, taper fikk seiersrang. Rettet: ildkule,
  splinter, skjermristing ved nære nedslag, brennende vrak med oljeflak, røyksøyle over ødelagte
  bunkere, «MÅL 5 AV 8» med mållinje, tips som følger årsaken, åpning der bombene bommer.
- Runde 2 (19): Gøy 3 igjen - «man venter mest på at kanonen lades». Kjerneløkka endret:
  klikk-på-bunker med 5,2 s ladetid ble siktede salver med 2,8 s ladetid; bunkerne bemannes igjen
  etter 12 s. Sporlys fra bunkerne, gul kant på din båt, menyteksten forklarer sporene.
- Ikke gjort ennå (forslag fra vurdereren): en spillbar landgang der soldatene sprinter over stranda.
