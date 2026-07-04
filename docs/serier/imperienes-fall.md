---
description: Remote arbeidsplan - artikkelserien "Imperienes fall" (samfunnskunnskap). Én artikkel bygges av gangen.
emne: imperienes-fall
fag: samfunnskunnskap
sti-konvensjon: public/content/samfunnskunnskap/imperienes-fall/<id>.json
startdato: 2026-07-04
---

# Serie: Imperienes fall

Et dedikert emne i samfunnskunnskap om **teoriene bak hvorfor imperier faller**, med
mange konkrete eksempler. Emnet er registrert i `manifest.json` under
`samfunnskunnskap > imperienes-fall`. Oversiktartikkelen er bygget som
referansestandard; resten av serien fylles ut av denne arbeidsplanen, én artikkel av
gangen.

**Kjernebudskap serien skal formidle:** ingen imperier faller av én grunn. Kollaps er
alltid flere krefter som virker samtidig og forsterker hverandre, helt til riket treffer
et vippepunkt. Teori-artiklene forklarer hver kraft; case-studiene viser hvilken blanding
av krefter som til slutt velta nettopp det riket.

---

## Kjøringsinstruks (for remote-rutinen)

Kjør denne løkka én gang per kjøring:

1. **Finn arbeid.** Les tabellene under. Velg den ØVERSTE raden med status `TODO`
   (teori-artikler før case-studier).
2. **Bygg artikkelen** med `/plan_article`. Bruk radens `id`, `tittel`, `type` og
   `nøkkeleksempler` som utgangspunkt. Full referansestandard er obligatorisk:
   - unik **signaturkomponent** (ny 2D-komponent, aldri gjenbruk),
   - eget **3D-mikrospill** (`src/components/microgames/`, registrert i `registry.ts`),
   - **avsluttende quiz** som siste blokk,
   - `heroImage` + 3 inline bildeplassholdere (`/images/placeholder.webp` med norsk
     `alt`-tekst).
   - 800-1200 ord, bokmål, riktige norske tegn (å, ø, æ), ingen bold, ingen tankestrek.
3. **Registrer** artikkelen i `manifest.json` under `samfunnskunnskap > imperienes-fall >
   lessons` (id må matche filnavn og JSON-id).
4. **Krysslenk fra oversikten.** Legg en naturlig innlenke fra
   `hvorfor-imperier-faller.json` til den nye artikkelen, der temaet nevnes. Slik unngår
   vi døde lenker: oversikten peker aldri på en artikkel før den finnes.
5. **Merk ferdig.** Sett radens status til `DONE`.
6. **Commit atomisk.** Commit artikkel-JSON + komponentfiler + registry + manifest +
   denne fila i ÉN commit, så bilde-cronen ikke sveiper halvferdig arbeid.
7. **Verifiser:** `node scripts/scan-concepts.js`, `npm run scan:content`,
   `npm run lint`, `npm run build`, `node scripts/check-internal-links.cjs --json`.

Bilder genereres etterpå av bilde-rutinen (placeholder.webp -> ekte webp).

---

## Del A: Teori-artikler

Hver artikkel forklarer én kollaps-kraft grundig, med flere korte eksempler innbakt.

| id | tittel | type | signaturkomponent-idé | 3D-mikrospill-idé | nøkkeleksempler | status |
|---|---|---|---|---|---|---|
| hvorfor-imperier-faller | Hvorfor imperier faller | oversikt | KollapsDiagnose (seks stressfaktorer + terskel) | imperium-soyler (kuppel på fire søyler) | Roma, Maya, Sovjet | DONE |
| imperial-overstretch | Når riket blir for stort | teori | Kart der du utvider grensa og ser forsvarskostnaden spise opp inntektene | Dra hæren ut for å dekke en voksende grense til linja blir for tynn | Roma, Spania, Storbritannia, USA | TODO |
| kompleksitetsfellen | Byråkratiet som kvelte riket | teori | Legg til lover/embeter og se «nytte per regel» falle mens kostnaden stiger | Stable byråkrati-lag til tårnet gir mindre igjen for hvert lag | Romerriket, Maya | TODO |
| elite-overproduksjon | Når eliten sloss om toppen | teori | Skru opp antall elite mot antall topp-posisjoner og se konflikten bryte ut | For mange spillere kjemper om for få troner; stolleken tipper over i kamp | Romersk borgerkrig, Frankrike 1789 | TODO |
| klima-og-kollaps | Når naturen svikter | teori | Skru på tørke/kulde og se avlinger, folk og skatt tørke inn | Vri klimaspaken og se en by tømmes når vannet forsvinner | Maya, norrøne Grønland, Akkad, Rapa Nui | TODO |
| pest-og-invasjon | Ytre press: pest og folkevandring | teori | Svekk riket innenfra først, slipp så løs presset utenfra og se forskjellen | Bølge av angripere/pest ruller mot en grense som er sterk eller svak | Justinian-pesten, folkevandringene, svartedauden | TODO |

> Merk: kraften «gjeld og pengeverdi» (Ray Dalio) er allerede godt dekket av
> `samfunnskunnskap/ideer-og-verdenssyn/store-sykluser`. Krysslenk dit i stedet for å lage
> en egen teori-artikkel.

## Del B: Case-studier

Hver artikkel går tett på ett imperium og viser hvilken blanding av de seks kreftene som
til slutt velta det. Bruk teori-artiklene som byggeklosser og krysslenk til dem.

| id | tittel | type | signaturkomponent-idé | 3D-mikrospill-idé | nøkkelkrefter | status |
|---|---|---|---|---|---|---|
| romerriket | Roma: kjempen som falt innenfra | case | Miks-panel: still inn Romas krefter (overstretch + gjeld + press) | Se de romerske grensene tøyes til de brister | Overstretch, gjeld, elitekonflikt, ytre press. Krysslenk til /historie/romerriket/vestromerrikets-fall | TODO |
| han-kina | Han-dynastiets fall | case | Balanse mellom keiser, hoff-eunukker og godseiere som tipper | Skattebønder som forsvinner ut av registeret til staten tømmes | Elitekonflikt, skattesvikt, opprør, ytre press | TODO |
| maya | Mayabyene som ble tomme | case | Vri tørke + befolkning og se byene bli forlatt | Vannmagasin som tørker ut mens byen vokser | Klima/tørke, overbefolkning, krig mellom bystater | TODO |
| mongolriket | Mongolriket som sprakk | case | Del riket i fire khanater og se sammenhengen briste | Et rike så stort at en beskjed ikke rekker fram i tide | Overstretch, arvestrid, for stort til å styre | TODO |
| det-osmanske-riket | Osmanenes lange forfall | case | Tidslinje-skyv fra stormakt til «den syke mannen» | Fronter som krymper tiår for tiår | Teknologisk akterutseiling, nasjonalisme, gjeld. Krysslenk til /historie/osmanske-riket/sammenbruddet | TODO |
| det-spanske-imperiet | Spania: rikt på sølv, fattig på alt annet | case | Sølv strømmer inn men renner rett ut i krig og gjeld | Sølvskip som fyller kassa som likevel lekker tom | Overstretch, gjeld/inflasjon, evige kriger | TODO |
| det-britiske-imperiet | Solnedgang for det britiske imperiet | case | Kart der koloniene løsner én for én etter to verdenskriger | Trekk hjem tråder fra et imperium som ikke har råd lenger | Overstretch, krigsgjeld, nasjonale frigjøringskamper | TODO |
| sovjetunionen | Sovjetunionens sammenbrudd | case | Skru på planøkonomi-problemer og se hyllene tømmes | Murer og grenser som faller i kjedereaksjon 1989-1991 | Økonomisk stagnasjon, overstretch (våpenkappløp), tap av legitimitet | TODO |

---

## Fremdrift

- Bygget: 1 / 15 (oversikt)
- Neste anbefalte: `imperial-overstretch` (teori)
