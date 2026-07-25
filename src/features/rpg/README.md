# Minnevokteren (`/oving/rpg`)

Et rollespill i sanntid der eleven spiller seg gjennom fagstoffet. Tåka
(«Glemselen») spiser det folk husker, og eleven henter det tilbake.

Dette er et eget spor, adskilt fra 3D-mini-spillmotoren i `src/games/engine/`
og fra mikrospillene i `src/components/microgames/`.

## Kort om valgene

| Valg | Hvorfor |
|---|---|
| **Phaser 3** (lazy-lastet) | Sanntids-kamp trenger tilemap, kamera-effekter, tweens og partikler. Phaser gir det ferdig. Ligger i egen bunt (~340 kB gzip) som bare lastes på denne ruta. |
| **All grafikk tegnes prosedyralt** | Ingen bildefiler. Figurer bygges lagvis som en påkledningsdukke (`engine/spriteforge.ts`), så karakterskaping og synlig rustning koster ingenting i grafikkarbeid. |
| **All lyd syntetiseres** | `engine/audio.ts` lager kamplyder og en generativ slått med Web Audio. Ingen lydfiler. |
| **Spørsmål hentes fra boka** | `scripts/generate-quest-bank.mjs` skanner alle Quiz-komponenter i `public/content/` og skriver `public/data/rpg/quest-bank.json`. Nytt fagstoff dukker automatisk opp i spillet. |

## Filer

```
RpgPage.tsx              Ruta: Phaser-lerret + React-grensesnitt + broen mellom dem
types.ts                 Alle domenetyper
data/
  classes.ts             Tre klasser, nivåkurve, utseendevalg
  items.ts               Våpen, rustning, amuletter
  spells.ts              Besvergelser (låses opp av riktige svar, ikke loot)
  enemies.ts             Fiendearketyper + bossen
  zones.ts               Verdenskartet - 11 soner, én ferdig
  nordvik.ts             Sone 1: NPC-er, landemerker og håndskrevne spørsmål
engine/
  boot.ts                Starter Phaser (dynamisk import)
  WorldScene.ts          Verden, bevegelse, kamp, fiende-AI
  worldgen.ts            Bygger Nordvik-kartet
  spriteforge.ts         Figurer, fiender, våpen, effekter
  tileforge.ts           Terrengfliser og verdensobjekter
  pixels.ts              Tegneverktøy + seedet tilfeldighet
  audio.ts               Web Audio-syntese
  quests.ts              Setter sammen quester fra banken + de håndskrevne
  bridge.ts              Hendelser mellom scene og React
store/useRpgStore.ts     All spillertilstand + kobling til «Min læring»
components/              Karakterskaper, HUD, dialog, kunnskapsutfordring, sekk, logg
```

## Slik henger læring og spill sammen

- **Quest = spørsmål.** Hver quest har et `hint` som sier hvor svaret finnes.
  Eleven skal lete, ikke gjette. Svaret ligger alltid et sted: hos en NPC
  (`NpcDef.kunnskap`), på en runestein (`LandmarkDef.text`), eller i artikkelen
  spørsmålet kom fra — som det alltid lenkes til i fasiten.
- **Bossen er beskyttet.** Den store Glemselen tar ingen skade før eleven svarer
  riktig. Hvert riktige svar river ned ett skjold.
- **Besvergelser låses opp av kunnskap.** `SpellDef.krevesRiktige` er antall
  riktige svar totalt — ikke nivå og ikke loot.
- **«Min læring».** `fullforQuest()` og `felleBoss()` kaller
  `useProgressStore.recordActivity()` med riktig fag og emne, så spillet teller
  på lik linje med en quiz i boka.

## Styring

| Tast | Handling |
|---|---|
| WASD / piltaster | Gå |
| Mellomrom | Slå |
| Shift | Rull (kort usårbarhet) |
| E | Snakk / les / åpne |
| 1–4 | Besvergelser |
| I / L / Esc | Sekk / oppdrag / meny |

Håndkontroll støttes: venstre stikke går, A slår, B ruller, X kaster første
besvergelse, Y samhandler.

## Legge til en ny sone

Sonene finnes allerede som data — `quest-bank.json` har spørsmål til alle
sammen. Å åpne en ny sone er byggearbeid, ikke innholdsarbeid:

1. Sett `spillbar: true` på sonen i `data/zones.ts`.
2. Lag `data/<sone>.ts` med NPC-er, landemerker og håndskrevne bossspørsmål,
   etter mønsteret i `nordvik.ts`.
3. Lag en kartgenerator etter mønsteret i `worldgen.ts` (temaet i `ZoneDef.tema`
   styrer fargene, så terrenget ser annerledes ut uten ny grafikk).
4. Registrer sonen i `WorldScene` og i `byggNordvikQuester`-tilsvarende funksjon
   i `engine/quests.ts`.

## Innhold som holdes utenfor

`EXCLUDED_LESSONS` i `scripts/generate-quest-bank.mjs` holder noen emner ute av
spillet — 22. juli, folkemord og krigen mot terror. Innholdet står uendret i
boka; det hører bare ikke hjemme i en ramme der du slår ned monstre og plukker
opp loot. Legg til flere id-er der ved behov.
