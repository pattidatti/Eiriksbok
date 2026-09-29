# Kurs for Grønland (`kurs-for-gronland`)

Artikkel: `historie/vikingtiden/oppdagelsesreiser` (Oppdagelsesreiser i Vesterled).
Laget manuelt 2026-09-29 på bestilling fra eieren: «et eksempelspill som er noe annet enn
et kart, noe ekte nice 3D og immersive». Referanse for et 3D-spill der kameraet står NEDE i
verden (bak skipet eller ved styreåra), ikke over et bord eller et kart.

## Konseptturnering

Fem konsepter til vikingtidens sjøreiser (dommer: eieren sin bestilling, ikke fersk underagent -
spillet ble laget interaktivt):

| # | Konsept | Gøy | Fag | Kommentar |
|---|---|---|---|---|
| 1 | **Kurs for Grønland** - styr knarren over Nord-Atlanteren med middagssola som eneste instrument, følg leidsagnet i Hauksbók | 4 | 5 | Vinner. Immersivt kamera på havet, storm/tåke/is gir action, breddeseiling er fagkjernen |
| 2 | Lindisfarne-raid i sanntid fra langskipets dekk | 4 | 2 | Vold som kjerne; spillet `lindisfarne-793` finnes allerede i 3D-motoren |
| 3 | Klinkbygg knarren bord for bord før havet tester den | 3 | 4 | Byggespill = nesten diorama igjen |
| 4 | Vinland-landgang: handel eller konflikt med skrælingene | 3 | 3 | Mer valgfortelling enn spill |
| 5 | Eirik Raudes flåte: 25 skip ut, 14 fram - led flåten gjennom isen | 4 | 3 | God, men flåtestyring fra lufta er et kart igjen |

## Designbrief

1. **Fantasi:** Du er styrmann på en knarr fra Hernar til Hvarf rundt år 1000. Ingen kompass.
2. **Kjerneverb:** styr (← →), rev/heis seilet (↓ ↑), øs (mellomrom). Alt skjer på skipet i 3D.
3. **Fagkjernen:** breddeseiling. Havstrømmen skyver skipet nord eller sør usynlig; hver middag
   viser solbrettet om sola står for lavt (for langt nord) eller for høyt (for langt sør).
4. **Leidsagnet som sjekkpunkter:** nord for Hjaltland (bare synlig i klart vær), sør for
   Færøyene (havet står midt i fjellsidene - jordkrumning), sør for Island (bare fugl og hval).
   Kilde: Landnámabók i Hauksbók.
5. **Press:** stormer oftere utover reisen, vindkast med 1,9 s varsel, sjø i rommet, drikkevann
   i 17 døgn, drivis nord for Hvarf.
6. **Tap med tips:** sank (øs/rev), is (for langt nord), forbi (for langt sør), tørst (heis seilet).
7. **Seier følger plottet:** innenfor ±80 km av linja når Grønland nås = Hvarf.
8. **Én runde til:** rekord, seks titler (Skipsgutt - Havets kjentmann), Sagaboka med ni blad.
9. **Tone:** lett (ingen vold), en ku og to sauer om bord.
10. **Roboter:** seende (leser sola og lærer strømmen), halvgod (leser sola, treg), ignorerer-sola
    (taper - fagkjernen), tilfeldig. Simulering grønn: 95 % / 76 % / 3 % / 0 %.

## Kunstbrief

1. **Kilden:** Nordatlanteren selv, sett fra dekk - kaldt blågrønt hav, lavt nordlig lys - og
   vikingtidens materialer: tjærebrunt klinkskrog, vadmålsseil i rødt og kremhvitt, forgylt
   vindfløy (Heggen-fløyen). HUD-en er treskiver og messing (solskive etter Uunartoq-skiva).
2. **Palett:** hav `#0a2838`/`#2e8c8f`, seil `#a3321f`/`#e7dcc2`, tjære `#4d3726`, messing `#c99a3b`,
   HUD-tre `#3a2c20`.
3. **Form:** lavpoly land og is med flat shading; skipet i vertex-farger; havet er en egen
   Gerstner-shader med fresnel, solglitter, skum og kjølvann-V.
4. **Lys:** døgnrytme - morgensol bak, motlys gjennom seilet om ettermiddagen, skumring,
   kort natt med stjerner. Storm: grått, regn og lyn. Tåke: nesten ingen sikt.
5. **Kamera:** bak og over skipet (følger med treghet), eller ved styreåra (C) - helt ulikt
   de tre siste spillene (kartbord, fotokart, torg ovenfra).
6. **HUD:** leidsagn-strimmel øverst (ruta med landemerker), solskive, solbrett, øsekar, seilpips.
7. **Chromebook:** polart havrutenett (70 ringer på lav), sky-fbm med 3 oktaver på lav, ingen
   skygger, partikler skaleres med kvalitetsnivå, bloom av på lav.
8. **Ikke slik:** ikke kart, ikke bord, ikke diorama sett ovenfra.
