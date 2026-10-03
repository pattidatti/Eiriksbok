# Lyd

Alle lydene er CC0 1.0 eller offentlig eie (public domain). Ingen kreditering kreves, men vi
krediterer likevel. Lisensen er sjekket på sida til hver fil 02.10.2026.

Hentet automatisk: OpenGameArt og Wikimedia Commons har direkte nedlasting. Fra Freesound er
forhåndslyttingen brukt (`cdn.freesound.org/previews/...-hq.mp3`, 128 kbit/s), som kan hentes uten
innlogging; lisensen er den samme som for originalen.

Behandling (ffmpeg): høypass mot rumling, kutt, nivå (løkkene med `loudnorm` til -20 LUFS, korte
lyder etter RMS i den kraftigste delen), og Opus i Ogg (32-56 kbit/s). Løkkene er gjort sømløse
med 2,5 s kryssfade fra slutten inn i starten. Korte lyder ligger samlet i én fil per slag
(sprite); `lyd.json` sier hvor hver lyd starter og hvor lang den er. Alt sammen ca. 950 kB.

Opus i Ogg spilles av Chrome (Chromebook), Edge og Firefox. Eldre Safari kan ikke, og da er spillet
stille (`Lydbilde.stottet`).

## Løkker

| Fil | Kilde | Opphavsperson | Lisens | Brukt |
|---|---|---|---|---|
| `regn-ute.ogg` | [Rain (loopable)](https://opengameart.org/content/rain-loopable), fil 1 | Ylmir | CC0 | Hele (27 s) |
| `regn-tak.ogg` | [Heavy Rain inside a Shed](https://freesound.org/people/mageh533/sounds/752031/) | mageh533 | CC0 | Hele (18 s), regn på taket inne |
| `vind.ogg` | [Windforce 4-5 wind](https://freesound.org/people/finalCrystine/sounds/170471/) | finalCrystine | CC0 | 20-54 s, høypass 140 Hz |
| `bolger.ogg` | [G54-04-Pier Lap.wav](https://freesound.org/people/craigsmith/sounds/438839/) | craigsmith | CC0 | 60-96 s, bølger som klukker mot en brygge |
| `ild.ogg` | [The Fireplace 3.wav](https://freesound.org/people/NoOneIsReal/sounds/387128/) | NoOneIsReal | CC0 | 20-46 s |
| `skrog.ogg` | [G54-27-Oars Rowing.wav](https://freesound.org/people/craigsmith/sounds/438846/) | craigsmith | CC0 | 8-28 s, vann mot skroget |

## Korte lyder (sprites)

| Fil | Gruppe | Kilde | Opphavsperson | Lisens |
|---|---|---|---|---|
| `fottrinn.ogg` | `tre-ute` (10) | [Footsteps outdoors wood path squeak.wav](https://freesound.org/people/jedg/sounds/505834/) | jedg | CC0 |
| | `tre-inne` (7) | [Steps in wood floor](https://opengameart.org/content/steps-in-wood-floor) | mikeask | CC0 |
| | `gjorme` (10) | [Footsteps_Mud_01.wav](https://freesound.org/people/BenDrain/sounds/488068/), [Footsteps_Mud_02.wav](https://freesound.org/people/BenDrain/sounds/488069/) | BenDrain | CC0 |
| `rotter.ogg` | `pip` (11) | [ratSqueak.wav](https://freesound.org/people/Zabuhailo/sounds/143125/) (en svak tone ved 2,45 kHz er filtrert bort) | Zabuhailo | CC0 |
| | `kvitre` (3) | [Rodents - Brown Rats; Several Babies Squeaking](https://freesound.org/people/TheKingOfGeeks360/sounds/841571/) | TheKingOfGeeks360 | CC0 |
| | `skrik` (2) | [rat-squeak.wav](https://freesound.org/people/toefur/sounds/288941/), [Rat.ogg](https://freesound.org/people/egomassive/sounds/536753/) | toefur, egomassive | CC0 |
| | `kraps` (7) | [Clawing or Scratching at wood](https://freesound.org/people/Wigglesworth/sounds/830466/) | Wigglesworth | CC0 |
| `maaker.ogg` | `skrik` (8), `latter` (2) | [Gull 1.ogg](https://commons.wikimedia.org/wiki/File:Gull_1.ogg), [Gull 2.ogg](https://commons.wikimedia.org/wiki/File:Gull_2.ogg) (gråmåke, fra PDSounds) | avphillips | Offentlig eie |
| `kamp.ogg` | `sus` (12) | [Short Whoosh, 13x](https://freesound.org/people/Kinoton/sounds/427979/) | Kinoton | CC0 |
| | `stonn` (12) | [Male Fight Grunts](https://freesound.org/people/ale-batec/sounds/511023/) | ale-batec | CC0 |
| | `smerte` (3) | [Male Grunts](https://freesound.org/people/Kodack/sounds/256603/) | Kodack | CC0 |
| | `fall` (2) | [S03-22 Two body falls on wood.wav](https://freesound.org/people/craigsmith/sounds/675927/) | craigsmith | CC0 |
| | `slag-lett` (5), `slag-tung` (5), `blokk` (5) | [Impact Sounds](https://kenney.nl/assets/impact-sounds) (`impactPunch_medium`, `impactPunch_heavy`, `impactSoft_medium`) | Kenney | CC0 |
| `aare.ogg` | `tak` (6) | [R23-38-Oar Splash.wav](https://freesound.org/people/craigsmith/sounds/480840/) | craigsmith | CC0 |
| | `knirk` (5) | [G27-11-Ship Creaks.wav](https://freesound.org/people/craigsmith/sounds/438357/) | craigsmith | CC0 |

| `dyr.ogg` | `gris` (5) | [A pig grunting, grumbling and falling asleep](https://freesound.org/people/felix.blume/sounds/158746/), [PIGS - 1](https://freesound.org/people/SamuelGremaud/sounds/467570/) | felix.blume, SamuelGremaud | CC0 |
| | `bjeff` (4) | [Dog Bark](https://freesound.org/people/aunrea/sounds/495658/), [Dog Barking Distance - 1.wav](https://freesound.org/people/SpaceJoe/sounds/485962/) | aunrea, SpaceJoe | CC0 |
| | `knurr` (1) | [Animal Dog Bark And Growl 01.wav](https://freesound.org/people/abhisheky948/sounds/625501/) | abhisheky948 | CC0 |
| | `mjau` (6) | [Cat, Meows 3x](https://freesound.org/people/Kinoton/sounds/741166/), [Cat Meows](https://freesound.org/people/brandonmoeller/sounds/456441/) | Kinoton, brandonmoeller | CC0 |

Dyrelydene (`dyr.ogg`) er hentet og lisenssjekket 03.10.2026: sida til hver fil sier CC0 1.0. Forhåndslyttingen
(128 kbit/s) er klippet i enkeltlyder (stillhet funnet med `silencedetect`, grisene klippet fast fordi de
grynter sammenhengende), høypass 110 Hz, nivå etter RMS mot -14 dB, Opus 40 kbit/s (118 kB).

`latter` er gråmåkas lange rop (ha-ha-ha), `skrik` enkeltrop og mjauing.

## Prøvd, ikke brukt

- *Solo Seagull Sound Effects* (OpenGameArt, merket CC0): klippet fra en YouTube-video med
  «tillatelse», uten at lisensen til videoen kan sjekkes. Gråmåkene fra Commons er sikrere.
- *Creature - Rat - Vocalizations* (Freesound, CC0): bearbeidet monsterlyd, ikke en rotte.
- *Fireplace - close* (Freesound, CC0): mest rumling, lite knitring.
- *Outside wind* (Freesound, CC0): vindstøy i mikrofonen.
