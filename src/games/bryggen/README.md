# Bryggen-motoren (arbeidstittel)

En liten, egen Three.js-motor for det store Bryggen-spillet. Den importerer ingenting fra
`src/games/engine/`, og de gamle spillene røres ikke.

- Blueprint og motor-audit: `docs/Design documents/bryggen-1429-blueprint.md`
- Gråboks: `/test/bryggen-graboks` (egen rute, ikke i galleriet). `?skygger=0` måler uten skygger.
- Første gård: `/test/bryggen-gard` (modulsettet, strømming, kai, Nikolaikirkeallmenningen og 14 nabogårder).
  `?kvalitet=lav` slår av normal- og AO-kart, miljølys og skygger. Knappen «Grafikk» øverst til
  høyre (eller G) bytter mens spillet går, og valget huskes i nettleseren (`bryggen-kvalitet`).
  Detaljkartene lastes først når full kvalitet brukes første gang.
- Figur og animasjoner: `public/games/bryggen/models/` (Quaternius UAL, CC0, se KILDE.md)

## Oppbygning

| Mappe/fil | Hva |
|---|---|
| `motor/physics.ts` | Rapier, kollisjonsgrupper (verden, figurer, båter, tynne ting kameraet ignorerer) |
| `motor/input.ts` | Tastatur, mus, styrepute. Alt kan spilles med bare tastatur |
| `motor/character.ts` | KinematicCharacterController med akselerasjon, sving med vekt, hopp, klatring |
| `motor/animator.ts` | AnimationMixer: fartsblandet, fotlåst bevegelse + helkroppslag med toning |
| `motor/camera.ts` | Fjærarm med kulekast: går aldri gjennom vegger |
| `motor/boat.ts` | Færing med åretak |
| `motor/combat.ts` | Arkade-slagsmål og fiende-AI |
| `motor/gore.ts` | Blod som blir liggende |
| `motor/meshkit.ts` | Geometri-settet: bøtter per materiale, UV i meter, fargefaktor per hjørne, kollider-beskrivelser |
| `motor/materials.ts` | PBR-materialene (farge, normal, ARM) og miljølys fra en enkel himmel |
| `motor/streaming.ts` | Celler som lastes innen 120 m og kastes bak 180 m, nær- og middels-nivå |
| `bygg/moduler.ts` | Modulsettet: laft med laftehoder, gavl, bordkledd fasade, torvtak, bordtak, vinsj, dører, glugger og utkraget overetasje |
| `bygg/gard.ts` | Den første gården: husplan, svalganger, trapper, kai på bolverk (med sidevegg der kaia hopper), allmenningen |
| `bygg/nabogard.ts` | Nabogårdene: trukket fra et frø (enkelt/dobbel, bredde, antall hus, høyde, torv/bordtak, svalganger, tone), aldri lik gården ved siden av |
| `bygg/bryggen.ts` | Scenen: Vågen, cellene langs bryggefronten, grenser |
| `graboks/` | Prøvescenen og løkka (faste 1/60-steg, interpolert tegning). Løkka kjører begge verdenene |

## Regler

- Simuleringen går i faste steg. Alt som flytter seg har `prevPos`/`pos` og tegnes interpolert.
- Kameraet leser input per bilde, simuleringen per steg.
- Tynne ting (stolper, rekkverk, tønner) legges i `prop`-gruppen så kameraet ikke kollapser.
- Trapper kolliderer som en kile (`Physics.addHull`) som står på bakken, med skråflaten gjennom
  midten av trinnene. En skrå plate med enden ned i bakken stopper figuren ved første trinn.
- Bein slås opp med navnet fra riggen via `findBone` (GLTFLoader fjerner punktum: `DEF-foot.L`
  heter `DEF-footL` i Three).
- Slagene veksler arm: høyre først, så venstre, og en ny rekke starter med høyre. Venstre kross er
  `Punch_Cross` speilet ved lasting (`mirror` i `animator.ts`). UAL har ikke et eget venstre krosslag,
  og jabben har for lite skulder i seg.
- Bygninger lages i kode av modulene og slås sammen til én geometri per materiale per hus
  (én `MeshKit` per hus). Ikke legg til nye materialer for variasjon: bruk fargefaktoren (`tint`).
- UV-ene er i meter. Hvor mange meter én tekstur dekker står i `materials.ts`. Laftestokkene er
  `LOG_H` = 0,24 m, og laftehodene følger samme mål.
- Hus bygges i eget rom: x på tvers, z innover fra gavlen mot sjøen, y opp. Verden: x langs sjøen
  (mot Holmen = +x), z innover fra bolverket, Vågen på -z. Three er høyrehendt, så +x ligger til
  venstre når man ser inn mot Bryggen fra Vågen.
- Kollidere i en celle beskrives som `ColliderSpec` og lages av strømmingen. Ikke kall
  `phys.addBox` direkte fra byggekoden, ellers blir de liggende når cella kastes.
- Svalganger og trapper har håndlist med prop-kollider. En 1 m bred trapp uten håndlist mister
  gutten sidelengs når kameraet følger etter.
- Nabogårdene er én `MeshKit` per halvdel (forhusene med kaia, og resten innover), ikke én per hus.
  Da kan Three hoppe over halvdelen som er utenfor bildet eller skyggekameraet, uten at tegnekallene
  løper løpsk. Laftehodene deres har 5 kanter (`hodeSeg`); de var to tredeler av trekantene.
- Kaifronten hopper mellom gårdene (`FRONT_JOG`). Cella som stikker lengst ut bygger sideveggen i
  bolverket (`kaiJog`), og stokkene går litt inn bak naboens front så hjørnet blir tett.
- Utviklerverktøy (bare i dev): `window.__bryggenFoto = { pos: [x, y, z], look: [x, y, z] }` låser
  kameraet til skjermbilder og måling fra Vågen; `window.__bryggenPos` viser hvor gutten står.
- Utkraging (`krag` i `HouseSpec`): hver etasje over den første står så mye lenger ut mot sjøen.
  `floorZ(s, i)` er framgavlen til etasje `i` og `frontZ(s)` den øverste; taket, gavltrekanten og
  vinsjen starter der. Bare forhusene krager, så husene bak i rekka ikke kolliderer med dem.
- Glugger og annen pynt som trekkes, bruker et eget frø (`rng` i `moduler.ts`). Da flytter ikke
  resten av gården seg når noe nytt legges til i trekningen.
- Ingen fil over 800 linjer.
