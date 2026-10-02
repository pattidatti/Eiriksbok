# Bryggen-motoren (arbeidstittel)

En liten, egen Three.js-motor for det store Bryggen-spillet. Den importerer ingenting fra
`src/games/engine/`, og de gamle spillene røres ikke.

- Blueprint og motor-audit: `docs/Design documents/bryggen-1429-blueprint.md`
- Gråboks: `/test/bryggen-graboks` (egen rute, ikke i galleriet). `?skygger=0` måler uten skygger.
- Første gård: `/test/bryggen-gard` (modulsettet, strømming, kai og Nikolaikirkeallmenningen).
  `?kvalitet=lav` slår av normal- og AO-kart, miljølys og skygger.
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
| `bygg/moduler.ts` | Modulsettet: laft med laftehoder, gavl, bordkledd fasade, torvtak, bordtak, vinsj, dører |
| `bygg/gard.ts` | Den første gården: husplan, svalganger, trapper, kai på bolverk, allmenningen, plassholder-naboer |
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
- Ingen fil over 800 linjer.
