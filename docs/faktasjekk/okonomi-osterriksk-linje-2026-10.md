# Gjennomgang: Økonomi-artiklene mot sidens østerrikske linje (oktober 2026)

**Omfang:** alle 15 artikler i `public/content/samfunnskunnskap/okonomi/` + filmene
`src/features/film/manus/samfunnskunnskap/okonomi/{monopol-og-konkurranse,bnp}.json`
**Undersøkt:** 26. oktober 2026
**Status:** PLAN, godkjent i hovedtrekk 26.10.2026 — innholdet er ikke endret ennå.

---

## 1. Kort oppsummert

Sidens bærende økonomiartikler (`naturlig-rente`, `finanskriser`, `inflasjon-og-rente`,
`okonomiske-skoler`, `produksjon`, `komparativt-fortrinn`) bruker østerriksk skole som
hovedlinse, og `okonomiske-skoler` sier det rett ut: Økonomi-Verden bygger på østerrikske
antakelser, «en konsistent modell — men ikke den eneste mulige».

Artiklene fra 23.–26. oktober bryter med denne linjen. De er skrevet som en vanlig
lærebok med Store norske leksikon som eneste teorigrunnlag, og presenterer
hovedstrømsposisjoner som fakta der skolene er uenige:

| Fil | Lagt til | Avvik |
|---|---|---|
| `monopol-og-konkurranse` + film | 24.10 | **Mest alvorlig.** Naturlig monopol som fakta, fullkommen konkurranse som ideal, antitrust som nøytral dommer, prisjegersaken framstilt som avgjort (faktisk feil) |
| `arbeidsledighet` | 26.10 | **Alvorlig.** Keynesiansk diagnose og medisin (senk renta, øk statlig pengebruk) som fasit — motsier `naturlig-rente` direkte |
| `bnp` + film | 25.10 | Middels. Husbrann-eksempelet uten Bastiat, offentlige tjenester til kost uten kritikk, ingen Fastlands-BNP |
| `tilbud-og-ettersporsel` | 23.10 | Lett. Mangler Menger, Hayek 1945 og markedsprosess |
| `hvordan-penger-blir-til` | 18.08 | Lett. «Stabil pengeverdi» = 2 % inflasjon uten kommentar, ingen kobling til kredittsyklusen |
| `milei-argentina` | 20.10 | Svært lett. Nevner ikke at Milei selv bygger på østerriksk skole |

De eldre artiklene (jan.–aug.) er gjennomgått med søk etter typiske avviksformuleringer
og fulgt opp der det slo ut. De er i tråd med linjen. Unntak: `produksjon.json` er i
tråd med linjen, men **motsies** nå av monopolartikkelen (se K1).

### Tre typer funn

- **[F] Faktisk feil** — feil uansett økonomisk skole. Rettes først.
- **[Ø] Avvik fra østerriksk linje** — hovedstrøm framstilt som fasit der østerriksk
  skole er uenig.
- **[K] Intern inkonsistens** — artikkelen sier det motsatte av en annen artikkel på siden.

### Beslutninger (Eirik, 26.10.2026)

1. **Østerriksk syn er fasit.** Artiklene forklarer økonomien slik østerriksk skole gjør.
   Hovedstrømssynet (SNL/læreboka) gjengis kort og korrekt — slik at elevene vet hva
   «naturlig monopol» eller «konjunkturledighet» betyr når de møter det på prøve — og
   svares deretter på.
2. **Ved tvil: Rothbard.** Der østerrikerne er uenige (monopolpris, bankreserver), følger
   siden Rothbard. Mises/Kirzner-synet på monopolpris nevnes ikke i elevteksten.
   Bakgrunn: Mises og Kirzner mente monopolpriser kan oppstå på et fritt marked; Rothbard,
   Armentano, Hoppe og DiLorenzo at monopol bare finnes når staten hindrer konkurranse
   (Herbener-artikkelen i QJAE 2010 oppsummerer splittelsen).
3. **Monopolfilmen skrives på nytt, BNP-filmen redigeres** (se steg 3 og 5).

**Konsekvens som må med:** `okonomiske-skoler` sier i dag at Økonomi-Verden er «en
konsistent modell — men ikke den eneste mulige», og at skolene «ikke er uenige om fakta».
Det kolliderer med beslutning 1 og må skrives om (nytt steg 6b).

**Gjengivelsen av hovedstrømmen må være ordentlig, ikke en stråmann.** Vurderingskriteriene
for samfunnsfag 10. trinn (`docs/laereplaner/samfunnsfag-10-trinn.md`) gir toppkarakter
for å bruke ulike perspektiver «for å belyse hendelser og fenomener nyansert». Eleven må
kunne forklare motsynet for å kunne avvise det.

---

## 2. Feilliste

> Fiks-linjene under ble skrevet før beslutningene i kapittel 1. Der en fiks sier «vis
> uenigheten» eller «legg til motsynet», gjelder nå: hovedstrømmen gjengis kort, og det
> østerrikske svaret står som artikkelens konklusjon.

### 2.1 `monopol-og-konkurranse.json` (artikkel og film har nesten identisk tekst)

**M1 [F] Prisjegersaken framstilles som avsluttet** — HØYEST PRIORITET
- *Hvor:* `content[20]`, `content[38]`, quiz `questions[2]`; film scene 9;
  `MonopolSak.tsx` (tidslinje slutter på «August 2025: fullt medhold»).
- *Påstand:* «Kjedene klaget, men i august 2025 ga Konkurranseklagenemnda tilsynet
  fullt medhold.» Saken framstår som ferdig.
- *Fakta:* Kjedene saksøkte staten i november 2025. Saken går for Gulating
  lagmannsrett med hovedforhandling fra 12. oktober 2026 (Konkurransetilsynet, 2026).
  I september 2026 erklærte Høyesteretts ankeutvalg én av dommerne inhabil
  (iNyheter, 2026). Ved skrivende stund er det altså ingen rettskraftig avgjørelse.
- *Fiks:* Legg til at saken nå er i retten, og at kjedene mener prisjegere ikke
  skader konkurransen. Før publisering: sjekk om lagmannsretten har avsagt dom
  (forhandlingen startet for to uker siden). `MonopolSak.tsx` må få et nytt trinn.
- *Østerriksk tilleggsvinkel:* At konkurrenter kjenner hverandres priser er normalt
  en del av konkurransen (prismatching). Dette er kjedenes eget argument i retten, så
  det kan presenteres som «den andre siden» uten at siden tar parti.

**M2 [Ø] Naturlig monopol framstilt som fakta**
- *Hvor:* `content[29–30]`, `content[34]` (oppsummering), quiz/reflekter; film
  scene 13 og 14; `MonopolVann.tsx`.
- *Påstand:* «Tenk på vannrøret ... Da er det bedre med én eier.»
- *Østerriksk motsyn:* DiLorenzo (1996) viser at de klassiske «naturlige monopolene»
  i USA hadde konkurranse før staten ga eneretter: tre gasselskaper i Baltimore i
  1880, seks lysselskaper organisert i New York i 1887, 45 selskaper med rett til å
  drive i Chicago i 1907. Monopolene kom med kommunale konsesjoner, og teorien om
  naturlig monopol ble i hans fremstilling laget i etterkant for å rettferdiggjøre dem.
- *Fiks:* Behold begrepet (det står i læreboka), men skriv det som en påstand fra
  hovedstrømmen, legg til Rothbard/DiLorenzo-svaret og nyansen fra kap. 1. Endre
  sluttsetningen «vannrøret er mest fornuftig med én eier» (film scene 14).

**M3 [Ø] Fullkommen konkurranse som idealet konkurranse måles mot**
- *Hvor:* `content[9–10]`; film scene 5.
- *Påstand:* Jo nærmere fullkommen konkurranse, jo bedre. «Konkurranse er grunnen til
  at dette møtet blir rettferdig.»
- *Østerriksk motsyn:* Hayek (1946) viste at modellen forutsetter at alle allerede vet
  alt, og dermed beskriver en tilstand der ingen konkurrerer: ingen reklame, ingen
  prisendringer, ingen nye produkter. Konkurranse er en *oppdagelsesprosess* (Hayek,
  1968) der gründere finner det ingen visste fra før (Kirzner, 1973).
- *Fiks:* Ny kort seksjon «Konkurranse som prosess». Stryk «rettferdig» (normativt).

**M4 [Ø] Monopol definert ved antall selgere**
- *Hvor:* `content[5]`, quiz `questions[0]`; film scene 2.
- *Østerriksk motsyn:* Rothbard definerer monopol som en enerett gitt av staten. Én
  selger med fri adgang for nye er ikke et problem, fordi høy pris lokker inn kiosk
  nummer to — artikkelens eget eksempel viser nettopp dette.
- *Fiks:* La isbod-eksempelet stille spørsmålet: *Hva hindrer kiosk nummer to?*
  Hvis svaret er «ingenting», presses prisen ned av seg selv. Hvis svaret er «kommunen
  ga bare én tillatelse», er det et statlig monopol.

**M5 [Ø + F-utelatelse] Oligopolet i dagligvare forklares uten statlige etableringshindre**
- *Hvor:* `content[15–16]`; film scene 6–7.
- *Påstand:* Noen få store gir høyere priser; ministeren sier det er vanskelig for nye
  å komme inn — men ingen forklaring på *hvorfor*.
- *Utelatt, og dokumentert av Konkurransetilsynet selv:* I høringssvaret om
  etableringshindringer (2018) peker tilsynet på importvern for landbruksvarer og
  landbruksreguleringen som to hovedgrunner til at leverandørleddet er mer konsentrert
  i Norge enn i nabolandene. 29 % av dagligvaresalget er skjermet av høy toll, og
  tollvernet begrenser utenlandske kjeders mulighet til å bruke innkjøpsmakten sin.
- *Fiks:* Ett avsnitt om tollvernet som en grunn til at få aktører dominerer.
  `komparativt-fortrinn.json` er allerede kritisk til toll, så dette gjør siden
  mer konsistent.
- *Ikke bruk:* «Lidl trakk seg ut på grunn av tollvernet». SNL bekrefter bare at
  Lidl var i Norge 2004–2008 og at Rema 1000 overtok driften, ikke hvorfor.

**M6 [Ø] Konkurransetilsynet som nøytral «dommer»**
- *Hvor:* `content[23–24]`, reflekter[3]; film scene 10; `MonopolDommer.tsx`.
- *Østerriksk motsyn:* Armentano (1982) mener konkurranselovgivning i praksis ofte
  beskytter konkurrenter heller enn kunder, og kan stoppe sammenslåinger som gjør
  varer billigere.
- *Fiks:* Behold fotballdommer-bildet, men legg til ett avsnitt med motsynet.
  Reflekter[3] spør allerede om sammenligningen passer — gi elevene stoff til å svare.

**M7 [Ø] «Ikke alle monopol er dårlige» (Vinmonopolet)**
- *Hvor:* `content[26–32]`, `content[34]`, `details[2]`; film scene 11, 12 og 14.
- *Problem:* Artikkelens egen kilde sier at de vanligste monopolene er statseide med
  enerett ved lov. Det er nettopp den østerrikske påstanden — men artikkelen bruker
  den til å konkludere motsatt.
- *Fiks:* Behold Vinmonopolets egen begrunnelse (folkehelse), men gjør «er det verdt
  prisen?» til en åpen debatt i stedet for en konklusjon. Gå-videre[1] gjør det
  allerede; flytt det inn i brødteksten.

### 2.2 `arbeidsledighet.json`

**A1 [Ø + K] Konjunkturledighet: keynesiansk diagnose og medisin som fasit** — HØY
- *Hvor:* `content[13]` punkt 3, `content[19]`, `details[2]`, `content[37]`,
  quiz `questions[3]`.
- *Påstand:* Nedgangstider skyldes at folk kjøper mindre; løsningen er at Norges Bank
  setter ned renta og at staten bruker mer.
- *Motsier:* `naturlig-rente`, `finanskriser` og `okonomiske-skoler`, som alle
  forklarer at kunstig lav rente *skaper* feilinvesteringer og den neste krisen.
- *Østerriksk syn:* Ledigheten i nedgangstider er regningen for feilinvesteringer fra
  oppgangen (Hayek, 1931). Å senke renta igjen starter syklusen på nytt.
- *Fiks:* Skriv seksjonen «Ulike årsaker, ulike medisiner» om til å vise uenigheten:
  keynesiansk medisin vs. østerriksk diagnose, med lenke til `naturlig-rente`.
  Quiz 3 må få et svar som ikke låser én skole fast som riktig.

**A2 [Ø] Mangler «institusjonell ledighet»**
- *Hvor:* `content[12–13]` (de fire typene).
- *Østerriksk syn:* Mises (1949, kap. XXI) skiller mellom ledighet som skyldes valg
  på et fritt marked (folk venter på en bedre jobb) og ledighet som skyldes at lønna
  er tvunget over markedsnivå.
- *Fiks:* Legg til som femte type, merket som østerriksk/klassisk.
- *Forsiktig:* Norge har ingen generell minstelønn. Å bruke Mises' argument på
  allmenngjorte tariffavtaler er min egen overføring, ikke noe kildene sier. Ikke
  skriv det som fakta uten egen kilde.

### 2.3 `bnp.json` + film

**B1 [Ø] Husbrann øker BNP — uten Bastiat**
- *Hvor:* `content[16]`, quiz `questions[1]`; film scene 6–7; `BnpTeller.tsx`.
- *Påstand:* Riktig gjengitt fra SNL, men stopper ved «ingen blir gladere».
- *Østerriksk tillegg:* Bastiat (1850): Det man *ser*, er brannmannens lønn. Det man
  *ikke ser*, er det eieren ellers ville brukt pengene på, og huset som er borte. BNP
  er et brutto-flytmål: ødelagt kapital trekkes ikke fra.
- *Fiks:* Ett avsnitt / én filmreplikk om «det du ikke ser». Dette er den
  enkleste og beste koblingen til sidens linje — og et klassisk klasseromseksempel.

**B2 [F-presisering] «Du har gjort Norge litt rikere»**
- *Hvor:* `content[0]`; film scene 0.
- *Problem:* BNP måler produksjon per år (flyt), ikke rikdom (beholdning). Ingen skole
  er uenig i dette.
- *Fiks:* «...gjort BNP litt større» eller tilsvarende.

**B3 [Ø] Offentlige tjenester telles til kostpris — uten kritikk**
- *Hvor:* `content[13]`; film scene 6.
- *Østerriksk syn:* Rothbard (1962) mener statlige tjenester ikke er testet i et marked,
  så kostnaden sier ikke hva de er verdt. Han foreslo et alternativt mål, PPR
  (det private produktet som blir igjen).
- *Fiks:* Kort faktaboks. Ikke gjør PPR til hovedsak; det er et marginalt mål.

**B4 [Ø] BNP skjuler produksjonsstrukturen**
- *Hvor:* `content[5]` (brødet); film scene 3.
- *Østerriksk syn:* Ved å trekke fra alt bedrifter kjøper av hverandre, forsvinner
  mellomleddene, altså kapitalstrukturen. Skousen (1990) foreslo bruttoproduksjon
  (gross output) som mål; det amerikanske statistikkbyrået BEA har publisert det
  kvartalsvis siden 2014.
- *Fiks:* Én setning + lenke til de eksisterende konseptene `kapitalstruktur` og
  `omveisproduksjon`. Lav prioritet.

**B5 [F-utelatelse] Fastlands-BNP mangler**
- *Hvor:* `content[11]`; film scene 5.
- *Problem:* Norges BNP per innbygger er blåst opp av olje og gass. SSB regner derfor
  også BNP for Fastlands-Norge (uten petroleum, rørtransport og utenriks sjøfart).
- *Fiks:* Én setning. Gjelder uansett skole.

### 2.4 `tilbud-og-ettersporsel.json` (lav prioritet)

**T1 [Ø]** Verdiparadokset løses uten å nevne at det var Carl Menger (1871) — grunnleggeren
av østerriksk skole — som løste det med marginalnytte. Legg til navnet.
Østerriksk presisering: marginalnytte er en *rangering* av ønsker, ikke en mengde «glede».

**T2 [Ø]** Likevekt framstilles som et sluttpunkt. Jordbærbonden som prøver seg fram er
egentlig en god illustrasjon av markedsprosessen — sett navn på det (gründer, prosess).

**T3 [Ø]** Prissignal-avsnittet (`content[29–30]`) bør sitere Hayek (1945), som allerede
er kilde i `okonomiske-skoler`.

### 2.5 `hvordan-penger-blir-til.json` (lav prioritet)

Beskrivelsen av bankenes pengeskaping er **ikke** feil sett med østerriksk blikk:
Mises var enig i at banker skaper penger ved utlån. Avvikene er utelatelser:

**P1 [Ø]** «Stabil pengeverdi» = 2 % prisvekst (`content[22]`) står ukommentert. 2 % i året
halverer kjøpekraften på om lag 35 år (1,02³⁵ ≈ 2,0). Legg til.

**P2 [Ø]** Ingen kobling fra «banker lager penger ved utlån» til at ny kreditt presser
renta under den naturlige renta. Én setning + lenke til `naturlig-rente`. Merk: østerrikere
er uenige seg imellom om løsningen (100 % reserver hos Rothbard vs. fri bankvirksomhet hos
Selgin/White) — ikke skriv «østerrikerne vil».

### 2.6 `milei-argentina.json` (svært lav prioritet)

**MI1** Artikkelen nevner Rothbard og anarko-kapitalisme, men ikke at Milei selv sier han
bygger på østerriksk skole (BBC Mundo, 2023). Én setning + lenke til `okonomiske-skoler`.

### 2.7 Intern inkonsistens

**K1** `produksjon.json` `content[22]` sier at østerrikerne mener varige monopoler er
beskyttet av staten. `monopol-og-konkurranse` sier det motsatte uten å nevne synet.
Løses av M2/M4.

**K2** `arbeidsledighet` vs. `naturlig-rente`/`finanskriser`: rentekutt som medisin vs.
rentekutt som årsak. Løses av A1.

---

## 3. Gjennomføringsplan

Rekkefølgen følger alvorlighet. Artikkel og film for samme tema tas i samme økt, siden
manusene er nesten ordrett like.

**Steg 1 — Faktisk feil (M1).** Sjekk om Gulating lagmannsrett har avsagt dom. Oppdater
`content[20]`, quiz 2, film scene 9 og `MonopolSak.tsx`.
*Avhenger av:* domsstatus på redigeringsdagen.

**Steg 2 — Monopol, artikkel.** M2–M7. Ny seksjon «Konkurranse som prosess» etter
fullkommen konkurranse; ny seksjon «Hvem lager monopolene?» (tollvern, konsesjoner,
DiLorenzo) før naturlig monopol; skriv om oppsummering, `details`, quiz 0 og 4, reflekter.
Nye kilder: Hayek 1946, Hayek 1968, Kirzner 1973, Rothbard 1962, DiLorenzo 1996,
Armentano 1982, Konkurransetilsynet 2018 og 2026.

**Steg 3 — Monopol, film: nytt manus.** Plottet snur. I dag er historien «monopol er
dårlig → staten passer på → noen monopol er gode». Den nye historien er «hva hindrer kiosk
nummer to? → staten». 9–10 av 15 scener måtte vært skrevet om, og konklusjonen blir den
motsatte. Redigering gir et lappeteppe; nytt manus etter `build_film.md` er ryddigere.
- Ikke slett manuset og vent på filmrutina: køen har 371 artikler, samfunnskunnskap
  sist, fire filmer i døgnet. Filmen ville vært borte i flere måneder. Lag den manuelt
  med samme workflow straks artikkelen er ferdig, og erstatt den gamle fila.
- Gjenbruk visualer som passer den nye historien: `MonopolStranda` (én kiosk / to /
  mange — kjernen i nytt plot), `MonopolPris`, `MonopolKjeder` (`andeler`, `prisjeger`).
- Bygg om: `MonopolSak` (rettssaken, nytt trinn i tidslinjen), `MonopolVann` (skal vise
  konkurrerende gass-/lysselskaper før konsesjonene, ikke «én eier er best»).
- Trolig nytt: tollmur rundt dagligvare (ny modus i `MonopolKjeder` eller egen visual),
  kommunal tillatelse som stenger kiosk nr. 2.
- Utgår: `MonopolDommer` (eller gjenbrukes med motsynet), `MonopolVin` i dagens form.
- Lyd: `film-lyd.yml` lager stemmen for nytt manus (kjøres hver time). Hold øye med
  tegnkvoten (800 000 tegn/mnd).
- Kjør `scripts/validate-film.mjs`: alle tall i manus må stå i artikkelen, så
  artikkelen må være ferdig først.

**Språk (gjelder alle steg):** Nytt stoff skal holde 14-årings-kravet i `CLAUDE.md`.
Hayek, Bastiat og Rothbard må forklares med konkrete bilder (kiosk, knust rute, brann),
ikke med begreper som «oppdagelsesprosess» eller «institusjonell ledighet» uten
forklaring i samme setning.

**Steg 4 — Arbeidsledighet.** A1 og A2. Ingen film.

**Steg 5 — BNP, artikkel og film: redigering.** Plottet (plenen, termometeret) holder;
BNP-artikkelen sier ikke noe østerrikerne er uenige i som fakta, den mangler deres kritikk.
B1, B2, B5 prioritert; B3 og B4 tas også, siden østerriksk syn nå er fasit.
Film: endre replikker i scene 0, 3, 5 og 6; skriv scene 7 om til Bastiat («det du ser og
det du ikke ser»); ny scene om at offentlige tjenester telles til kostpris; slutten (13–14)
justeres så termometeret måler feil ting, ikke bare for lite. Visuelt: `BnpTeller.tsx` /
`BnpPlenen.tsx` for Bastiat-scenen.

**Steg 6 — Småfiks.** T1–T3, P1–P2 (Rothbard: 100 % reserver), MI1.

**Steg 6b — `okonomiske-skoler`.** Skriv om innledningen («de fire skolene er ikke uenige
om fakta»), seksjonen om Økonomi-Verden («ikke den eneste mulige») og gå-videre-oppgaven
om hva modellen «ikke får med seg», så artikkelen sier at siden bygger på østerriksk skole
fordi den forklarer økonomien best. De tre andre skolene beholdes som beskrivelser.

**Steg 7 — Hindre at det skjer igjen.** Legg en linje i `docs/CONTENT_STYLE_GUIDE.md`
(eller tilsvarende sjekkliste for agentene) om at økonomiartikler skal følge linsen i
`okonomiske-skoler`: østerriksk skole er fasit (Rothbard ved tvil), hovedstrømmen gjengis
kort og presist og besvares, SNL alene er ikke nok teorigrunnlag. Det er sannsynligvis derfor de nyeste skled ut — alle
fire bygger teoridelen kun på SNL.

**Steg 8 — Kontroll.** Bygg, se gjennom filmene, sjekk at alle nye kilder er med i
`sources` og at quizsvarene fortsatt er entydige.

---

## 4. Åpne spørsmål til Eirik

Besvart 26.10.2026 — se «Beslutninger» i kapittel 1. Ingen åpne spørsmål.

---

## 5. Kilder

- Armentano, D. T. (1982). *Antitrust and Monopoly: Anatomy of a Policy Failure*. Wiley.
  *(Ikke hentet i denne gjennomgangen — standardverk, sjekk sidetall ved bruk.)*
- Bastiat, F. (1850). *Ce qu'on voit et ce qu'on ne voit pas*. Engelsk tekst:
  [Wikisource](https://en.wikisource.org/wiki/That_Which_Is_Seen,_and_That_Which_Is_Not_Seen)
- BBC Mundo (2023). *Qué es la Escuela de Austria en la que se inspira Javier Milei*.
  [24horas.cl](https://www.24horas.cl/internacional/noticias-bbc/que-es-la-escuela-de-austria-en-la-que-se-inspira-javier-milei)
- DiLorenzo, T. J. (1996). The Myth of Natural Monopoly. *The Review of Austrian
  Economics*, 9(2), 43–58. [mises.org](https://mises.org/library/myth-natural-monopoly-0)
- Hayek, F. A. (1931). *Prices and Production*. Routledge.
- Hayek, F. A. (1945). The Use of Knowledge in Society. *American Economic Review*, 35(4).
- Hayek, F. A. (1946/1948). The Meaning of Competition. I *Individualism and Economic
  Order*. [mises.org](https://mises.org/online-book/hayek-21st-century/4-meaning-competition)
- Hayek, F. A. (1968). *Der Wettbewerb als Entdeckungsverfahren*. Kiel.
- Herbener, J. M. m.fl. (2010). Factor Prices under Monopoly. *Quarterly Journal of
  Austrian Economics*, 13(1). [mises.org](https://mises.org/quarterly-journal-austrian-economics/factor-prices-under-monopoly)
  — oppsummerer Mises/Kirzner vs. Rothbard/Armentano/Hoppe om monopolpris.
  *(Forfatternavn ikke bekreftet i hentet tekst — sjekk før sitering.)*
- iNyheter (2026, 27. september). *Høyesterett erklærer dommer inhabil i prisjegersaken*.
  [inyheter.no](https://inyheter.no/27/09/2026/hoyesterett-erklaerer-dommer-inhabil-i-prisjegersaken/)
- Kirzner, I. M. (1973). *Competition and Entrepreneurship*. University of Chicago Press.
- Konkurransetilsynet (2018, 13. mars). *Høringsuttalelse — rapport om
  etableringshindringer i dagligvaremarkedet*.
  [konkurransetilsynet.no](https://konkurransetilsynet.no/wp-content/uploads/2018/08/horingsuttalelse-rapport-etableringshindringer-i-dagligvaremarkedet.pdf)
- Konkurransetilsynet (2026). *Dagligvarerapport 2025* (s. 5–7 om prisjegersaken).
  [konkurransetilsynet.no](https://konkurransetilsynet.no/wp-content/uploads/2026/04/Dagligvarerapport-2025.pdf)
- Menger, C. (1871). *Grundsätze der Volkswirtschaftslehre*. Wien.
- Mises, L. von (1949). *Human Action*, kap. XXI.4 «Catallactic Unemployment».
  [mises.org](https://mises.org/online-book/human-action/chapter-xxi-work-and-wages/4-catallactic-unemployment)
- Rothbard, M. N. (1962). *Man, Economy, and State*, appendiks om offentlige utgifter i
  nasjonalregnskapet.
  [mises.org](https://mises.org/online-book/man-economy-and-state-power-and-market/5-binary-intervention-government-expenditures/appendix-role-government-expenditures-national-product-statistics)
- Skousen, M. (1990). *The Structure of Production*. NYU Press. Om BEA:
  [Wikipedia: Gross output](https://en.wikipedia.org/wiki/Gross_output)
- Store norske leksikon (u.å.). *Lidl*. [snl.no/Lidl](https://snl.no/Lidl)
- Statistisk sentralbyrå (2017, oppdatert 2024). *Hva er egentlig BNP?*
  [ssb.no](https://www.ssb.no/nasjonalregnskap-og-konjunkturer/artikler-og-publikasjoner/hva-er-egentlig-bnp)
