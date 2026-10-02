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
| `aare.ogg` | `tak` (6) | [R23-38-Oar Splash.wav](https://freesound.org/people/craigsmith/sounds/480840/) | craigsmith | CC0 |
| | `knirk` (5) | [G27-11-Ship Creaks.wav](https://freesound.org/people/craigsmith/sounds/438357/) | craigsmith | CC0 |

`latter` er gråmåkas lange rop (ha-ha-ha), `skrik` enkeltrop og mjauing.

## Prøvd, ikke brukt

- *Solo Seagull Sound Effects* (OpenGameArt, merket CC0): klippet fra en YouTube-video med
  «tillatelse», uten at lisensen til videoen kan sjekkes. Gråmåkene fra Commons er sikrere.
- *Creature - Rat - Vocalizations* (Freesound, CC0): bearbeidet monsterlyd, ikke en rotte.
- *Fireplace - close* (Freesound, CC0): mest rumling, lite knitring.
- *Outside wind* (Freesound, CC0): vindstøy i mikrofonen.
