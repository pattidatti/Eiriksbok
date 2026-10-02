# Bryggen-motoren (arbeidstittel)

En liten, egen Three.js-motor for det store Bryggen-spillet. Den importerer ingenting fra
`src/games/engine/`, og de gamle spillene røres ikke.

- Blueprint og motor-audit: `docs/Design documents/bryggen-1429-blueprint.md`
- Gråboks: `/test/bryggen-graboks` (egen rute, ikke i galleriet). `?skygger=0` måler uten skygger.
- Første gård: `/test/bryggen-gard` (modulsettet, strømming, kai, Nikolaikirkeallmenningen og 14 nabogårder).
  Gå rett opp gårdsrommet og inn den åpne døra bakerst: schøtstua med ildstedet. Forhuset til venstre
  for kaia (vest) har bu-døra åpen: bua med tørrfisk, bismer og pult, trappa opp til lagerloftet og
  døra ut på svalgangen. Mariakirken står oppe i bakken bak gårdene i nordenden (+x, mot Holmen):
  gå østover langs kaia, eller se fra Vågen.
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
| `motor/ild.ts` | Åpen ild: flammetunger, glør og røyk (tre tegnekall per bål), og `flakk(t)` som lyset følger |
| `bygg/moduler.ts` | Modulsettet: laft med laftehoder, gavl, bordkledd fasade, torvtak, bordtak, vinsj, dører, glugger og utkraget overetasje |
| `bygg/inne.ts` | Hus man kan gå inn i: hule etasjer med hull for åpne dører og glugger, golv, bjelkelag med trappehull og rekkverk, trapp, terskelkiler, innergavler og åser |
| `bygg/bu.ts` | Bua og lagerloftet: tørrfisk i stabler og bunter, kornsekker, tranfat, bismer, skrivepult med gjeldsbok og kiste |
| `bygg/schotstue.ts` | Schøtstua innvendig: ildsted av stein, gryte i kjetting, langbenker, bord på bukker, ved |
| `bygg/gard.ts` | Den første gården: husplan, svalganger, trapper, kai på bolverk (med sidevegg der kaia hopper), allmenningen |
| `bygg/nabogard.ts` | Nabogårdene: trukket fra et frø (enkelt/dobbel, bredde, antall hus, høyde, torv/bordtak, svalganger, tone), aldri lik gården ved siden av |
| `bygg/mariakirken.ts` | Mariakirken som kulisse: tvillingtårn, treskipet basilika, gotisk kor, kirkegård med mur. Ingen kollidere |
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
- Hus med `inne` bygges hule av `laftKroppInne`, `inne.etasjer` fra bunnen (standard: alle, og da
  går rommet opp under taket). Etasjene over bygges lukket av `laftKropp(…, from)`. Utkraging virker
  også i hule etasjer. Åpne dører og glugger blir ekte hull; døra står slått inn mot veggen, og i de
  hule etasjene står gavldørene (bu-døra, loftsdørene) åpne. Ljoren (`inne.ljore`) deler taket i tre
  biter langs huset (`takBiter`), og midtbiten starter et stykke ned fra mønet. Med ljore er
  innsiden sotet og cella får schøtstua; uten blir det bu (`bu.ts`).
- `k.at(x, y, z, rot, fn, c)`: send med `ColliderKit` når `fn` lager kollidere, ellers havner de i
  rommet utenfor. (Uten den sto schøtstuas veggkollidere feil, og man gikk gjennom langveggene.)
- Golvet inne ligger 0,2 m over bakken, og autostep tar ikke den kanten. Hver åpen dør på bakkeplan
  får en usynlig kile over terskelen (`terskel`). Ting utenfor en åpen dør må stå minst en halv
  meter unna, ellers sklir gutten forbi døråpningen.
- Ildlyset er ett `PointLight` for hele byen, alltid i scenen, flyttet til nærmeste ildsted (innen
  24 m) av `world.update`. Ikke legg lys i cellene: et lys som kommer og går (også når nær-nivået
  skjules) tvinger Three til å bygge alle shaderne på nytt.
- Cellene kan ha `tick` (flammer), `ild` (ildsteder), `rom` (bokser man kan gå inn i) og `dispose`.
  Står kameraet inne i et `rom`, dempes sola, halvkulelyset og miljølyset mykt, så ilden tar over.
  Kameraet avgjør, ikke gutten: ellers blir rommet mørkt mens kameraet ennå står ute. `rom.demp` sier
  hvor mye (1 i schøtstua, 0,55 i bua der det ikke brenner ild og lyset kommer inn døra).
- Landemerker som skal synes over hele byen (Mariakirken) bruker `materials.tynnTake(key)`: kopier av
  materialene med halvparten så tett tåke, som følger kvalitetsbyttet. Med vanlig tåke er alt borte
  bak 100 m. Ikke bruk det på vanlige hus: da forsvinner dybden.
- Med `__bryggenFoto` satt strømmes byen rundt fotokameraet, ikke gutten.
- Ting som ikke skal ha treårer (tørrfisk) lages av `raatre` innenfor `k.withUv(0.04, …)`: UV-ene
  krympes, så flaten får nesten én farge fra teksturen. Formen må da komme fra geometrien og
  `shade` per hjørne. Aldri 0: normalkartet trenger UV-er som endrer seg.
- Hold minst 1,5 m fritt der en trapp kommer opp. Gutten trenger plass til å gå av og snu.
- Ingen fil over 800 linjer.
