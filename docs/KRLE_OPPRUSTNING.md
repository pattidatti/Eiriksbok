# KRLE - opprustningsplan og statusoversikt

> **Sist målt:** 2026-08-12 (etter R6) · **N = 126 artikler**
> Dette dokumentet er arbeidslista for å løfte KRLE-innholdet opp på plan_article-standard.
> Kryss av i `✔`-kolonnen når en artikkel er ferdigstilt, og oppdater sammendraget nederst.

---

## 1. Hvorfor

KRLE er bokas svakeste fag målt i innhold. Halvparten av artiklene er maskin-genererte stubber på 60-90 ord uten interaktivitet, bilder eller kilder. Verdensreligionene - fagets kjerne - er dårligst stilt: bahá'í, Jehovas vitner og mormonisme har til sammen 24 artikler med **null** komponenter og **null** hero-bilder.

Dette er samtidig en forutsetning for det nye emnet «Sammenligne religion» (`docs/Design documents/sammenligne-religion-blueprint.md`). En sammenligning som lenker til 60-ords stubber er verdiløs. Derfor følger prioriteringen i §5 sammenligningsemnets faser: vi ruster opp det sammenligningen trenger, når den trenger det.

---

## 2. Hva «ferdig» betyr

Destillert fra `.agent/workflows/plan_article.md`. En artikkel er ferdig når alle punktene er oppfylt:

- [ ] **800-1200 ord** brødtekst, skrevet **fra hentede kilder** - ikke fra hukommelsen
- [ ] **Én ny signaturkomponent**, unik for artikkelen, plassert tidlig. «Standard: lag ny komponent. I tvil - lag ny.»
- [ ] **3D-mikrospill kun hvis temaet er romlig** - se §2.1. For per-religion-artiklene er svaret nei.
- [ ] `heroImage` + **3 inline bilder**: etter åpningen, ved vendepunktet, før avslutningen
- [ ] Fast hale: **`Oppgaver` → `Quiz` → `Kildeliste`** som de tre siste blokkene
- [ ] `Oppgaver` med Bloom-trapp: `forstaa` 3-4, `reflekter` 3-4, `gaaVidere` 2-3
- [ ] `Quiz` med 3-5 spørsmål
- [ ] `Kildeliste` med minst 3 kilder i APA, husets stil, med hentedato og `(u.å.)` der årstall mangler
- [ ] 2-4 innlenker til andre artikler, inne i brødteksten
- [ ] `layout: "rich"`, flat `content`-array, ingen `**fet**`, ingen markdown-lister i `text`
- [ ] KRLE-metadata bevart: `religion`, `dimension`, `comparison_tags` - de driver `/krle/sammenlign/tema/:tag`
- [ ] Objektiv, respektfull tone: «Muslimer tror …», aldri normativ. Indre mangfold nevnt minst ett sted.
- [ ] `npx tsc -b` og `npm run lint` rene

**Referansemal:** `public/content/krle/religion/sikhisme/overgangsriter.json` - 40 blokker, 1304 ord, komplett hale, egen signaturkomponent (`SikhNavneseremoni`) og mikrospill (`anand-karaj-3d`). Det er denne artikkelen nye oppgraderinger skal måles mot. (Merknaden om at `kristendom/intro` manglet halen gjaldt fram til R6; den artikkelen er nå ferdig.)

### 2.1 Mikrospill - når og når ikke

**Regelen for KRLE:** per-religion-artiklene får **ikke** mikrospill. Signaturkomponenten er hele interaktiviteten. Mikrospillene hører til sammenligningsartiklene, der temaet faktisk er romlig.

Dette er et bevisst avvik fra husregelen. `.agent/workflows/plan_article.md` linje 54 sier «Når hoppe over: bare når emnet virkelig ikke egner seg for 3D … **I tvil - lag det.**» For KRLE snur vi den tommelfingerregelen.

**Hvorfor:**

1. **Mikrospillet er 40-50 % av all ny kode per artikkel.** De fem nyeste artikkel-PR-ene i repoet: signaturkomponent 255-410 linjer, mikrospill 438-662 linjer, 1067-1354 innsatte linjer totalt. Å droppe spillet halverer omtrent arbeidet.
2. **Køen er abstrakt lærestoff.** 17 filosof-portretter og et 8×8-rutenett av `bonn` / `frelse` / `gudsbilde` / `hellige-tekster` / `grunnleggere` / `sentrale-trekk` / `intro`. `build_microgame.md` advarer selv: «for abstrakte eller kosmiske emner (tid, **tro**, **ideer**, verdensrommet) ser 'noen greier ute på en åker' billig og malplassert ut», og «klikk-på-N-riktige-ting i et stillestående diorama er IKKE en gyldig arketype lenger».
3. **Vi ville laget den samme scenen om og om igjen.** De fire abstrakte KRLE-spillene som finnes - `moralsk-tomrom-3d`, `samsara-syklusen`, `moksha-veien-3d`, `attedelt-vei-hjulet` - deler nesten identisk iscenesettelse: glødende ting som orbiterer i lyst kosmos. Nittini nye i samme emnerom ville gitt titalls varianter av den scenen. Dyrere enn gjenbruk, og svakere pedagogisk.

**Testen for «romlig».** Et tema er romlig når alle tre holder:

1. Kjernepoenget handler om **sted, kropp eller bevegelse** - du forstår det ved å være et sted eller gjøre noe fysisk, ikke ved å lese en definisjon.
2. Du kan navngi en konkret arketype fra tabellen i `build_microgame.md` - *forsvar posisjonen · kryss under press · overlev · reager i tide · bygg-monter · styr-naviger · utforsk-avdekk · morf-og-se* - som passer **uten å presses**.
3. Resultatet blir ikke enda en glødende orbit-scene. Finnes den allerede, gjenbruk den eller dropp den.

Faller temaet på punkt 2 eller 3, er det ikke romlig - uansett hvor fristende det virker.

**Gjenbruk er tillatt og teknisk uproblematisk.** `MicroGameBlock.tsx` er en ren oppslags-bro uten eierskap eller unikhetslås; `pyramidebyggeren-3d` er allerede embedded i to historie-artikler. To bivirkninger å kjenne til:

- **XP gis bare én gang** per `gameId` - `useProgressStore` nøkler på `microgame/<gameId>`, så andre gjennomspilling gir kun `repeatBonus`.
- **«Dagens økt»-attribusjon** følger den første fila som refererer spillet i tre-walken, så et gjenbrukt historie-spill forblir mappet til historie.

**Gjenbrukskandidater for sammenligningstemaene:**

| Tema | Kandidat | Hva spillet gjør |
|---|---|---|
| `hellige-rom` | `lalibela-kirke-3d`, `hagia-sofia-3d`, `taj-mahal-symmetri` | Hugge kirke nedover i fjell; spenne kuppel; speilsymmetri om gylden akse |
| `hellige-rom` | `tvillingbyen-koumbi-saleh-3d` | Hellig lund og moské i samme rike |
| `frelse`, `doden` | `tidens-former-3d` | Lineær tidspil mot syklisk tidshjul |
| `bonn` | `vend-mot-mekka` | Qibla-retning, tre bedende konvergerer |
| `overgangsriter` | `anand-karaj-3d` | Fire runder rundt Guru Granth Sahib |
| `hoytider` | `festens-lys-3d` | Fire høytidsbord |
| `mat-og-renhet` | `matreglerbordet-3d` | Matvarer merkes per tradisjon |
| `symboler-og-klaer` | `symboler-paa-taket-3d` | Kors, halvmåne, davidsstjerne på riktig tak |

---

## 3. Målemetode

Ord telles i `type: "text"`-blokker (feltet heter `content`) pluss `list`-items. En **signaturkomponent** er en `component`-blokk hvis `name` ikke står på standardlista (`Quiz`, `FactBox`, `QuoteBlock`, `TimelineComponent`, `MicroGame`, `Gallery`, `MapCarousel`, `LinkButton`, `Comparison`, `WritingFix`, `Oppgaver`, `Kildeliste`, `Image`).

Terskler:

| Status | Kriterium |
|---|---|
| `FERDIG` | ≥ 800 ord **og** har signaturkomponent |
| `STUB` | < 200 ord |
| `HALV` | Alt annet |

Terskelen på 200 ord er ikke tilfeldig. Den sorterte ordfordelingen har et **rent brudd** der: gapet mellom 170 og 312 ord er på 142 ord, og samtlige 57 artikler under 200 ord har null komponenter. Det er to ulike populasjoner, ikke en glidende skala.

Kvest-filene under `filosofi/quests/` (22 stk) er ekskludert - de har et annet skjema.

---

## 4. Sammendrag

| Status | Antall | Andel |
|---|---:|---:|
| `STUB` | 8 | 6,3 % |
| `HALV` | 19 | 15,1 % |
| `FERDIG` | 99 | 78,6 % |
| **Sum** | **126** | |

| Mangel | Antall | Andel |
|---|---:|---:|
| Uten `Kildeliste` | 110 | 89,4 % |
| Uten `Oppgaver` | 109 | 88,6 % |
| Uten mikrospill | 103 | 83,7 % |
| Uten signaturkomponent | 85 | 69,1 % |
| Uten `heroImage` | 55 | 44,7 % |
| Ødelagt blokk-skjema | 0 | 0 % |

---

## 5. Prioritert rekkefølge

Én artikkel per kjøring, slik både `oppgrader-religion-artikkel` og `oppgrader_km` foreskriver.

| Runde | Innhold | Antall | Kobling til sammenligningsemnet |
|---|---|---:|---|
| ~~**R0**~~ | ~~Bugene B1-B5 i §7. Rene skjema- og manifest-fikser.~~ **Ferdig 2026-08-10** | 10 filer | ✅ |
| ~~**R1**~~ | ~~`skapelse` for de sju religionene som mangler den~~ **Ferdig 2026-08-10** | 7 nye | ✅ Tema 1 «Hvor kommer alt fra?» har nå 9/9 kilder |
| ~~**R2**~~ | ~~`gudsbilde` × 8~~ **Ferdig 2026-08-11** | 8 | ✅ Tema 2 «Én, mange eller ingen gud?» har nå 9/9 ferdige kilder |
| ~~**R3**~~ | ~~`bonn` × 8~~ **Ferdig 2026-08-11**. Sikhisme-artikkelen kom fra bot-PR #390 og telles med i N. | 8 | ✅ Tema 3 «Å snakke med det hellige» har nå 9/9 ferdige kilder |
| ~~**R4**~~ | ~~`overgangsriter` × 8~~ **Ferdig 2026-08-11** | 8 | ✅ Tema 4 «Fra vugge til grav» har nå 9/9 ferdige kilder |
| ~~**R5**~~ | ~~`frelse`, `grunnleggere`, `hellige-tekster`, `sentrale-trekk`~~ **Ferdig 2026-08-11** | 34 | ✅ Tema 5-8 har alle 9/9 ferdige kilder |
| ~~**R6**~~ | ~~Kristendom-artiklene~~ **Ferdig 2026-08-12**. Ble sju artikler, ikke atte: sju av de opprinnelige atte ble tatt i R2-R5, mens sju andre kristendom-artikler manglet hale og kilder | 7 | Hele kristendom-mappa er na ferdig |
| **R7** | Filosofi: 17 artikler uten quiz, `Oppgaver` og `Kildeliste` | 17 | Utenfor sammenligningsemnet |

**Om tallene.** Ti artikler i matrisen finnes ikke på disk i det hele tatt: `skapelse` for
sju religioner (alle unntatt kristendom og islam), pluss `bonn`, `frelse` og `gudsbilde` for
sikhisme. De opprettes fra bunnen i den runden de hører hjemme. Skanneren i §8 utleder lista
selv og merker dem `MISSING`, så tabellen over og verktøyet kan ikke komme i utakt.

Samisk religion har ikke egne artikler i denne matrisen, og skal ikke få det. Den er
gjestestemme i seks av sammenligningstemaene og dekkes av `samisk/intro.json` og
`laestadianismen.json`, som begge allerede holder standard - se blueprint §5.4.

**Omfanget etter mikrospill-beslutningen.** De 89 artiklene krever ~89 nye signaturkomponenter og **null** nye mikrospill (§2.1). De romlige spillene - anslagsvis seks - bygges i sammenligningsemnet i stedet. Til sammenligning ville den opprinnelige lesningen av plan_article krevd ~89 spill, som alene ville doblet bokas mikrospill-bibliotek.

**Spill-kolonnen i §6 er den faste lista.** Alle artikler som gjenstår står med `-`: ingen nye spill. Gjenbruk vurderes per sammenligningstema, ikke per religion.

---

## 6. Statustabeller

Sortert med de svakeste øverst innenfor hver gruppe. Rader merket `☑` er ferdigstilt i
denne opprustningen; `☐ FERDIG` holdt standard fra før eller kom fra den daglige innholdscronen.

`⏳` i Hero-kolonnen betyr at artikkelen har `heroImage` satt til `/images/placeholder.webp`.
Det er markøren bildecronen greper etter; ekte bilder kommer i neste 07:30-kjøring, eller
med en manuell `/bilde`.

### Bahá'í

n = 9 · snitt 879 ord · 1 stub / 0 halv / 8 ferdig

| ✔ | Status | Fil | Ord | Sig | Oppg | Kilde | Quiz | Hero | Spill |
|:--|:--|:--|--:|:-:|:-:|:-:|--:|:-:|:-:|
| ☐ | `STUB` | `religion/bahai/intro.json` | 37 | - | - | - | 0 | ✅ | - |
| ☑ | `FERDIG` | `religion/bahai/grunnleggere/artikkel.json` | 1090 | ✅ | ✅ | ✅ | 5 | ⏳ | - |
| ☑ | `FERDIG` | `religion/bahai/hellige-tekster/artikkel.json` | 1011 | ✅ | ✅ | ✅ | 5 | ⏳ | - |
| ☑ | `FERDIG` | `religion/bahai/gudsbilde/artikkel.json` | 911 | ✅ | ✅ | ✅ | 5 | ⏳ | - |
| ☑ | `FERDIG` | `religion/bahai/frelse/artikkel.json` | 1013 | ✅ | ✅ | ✅ | 5 | ⏳ | - |
| ☑ | `FERDIG` | `religion/bahai/sentrale-trekk/artikkel.json` | 1032 | ✅ | ✅ | ✅ | 5 | ⏳ | - |
| ☑ | `FERDIG` | `religion/bahai/overgangsriter/artikkel.json` | 1040 | ✅ | ✅ | ✅ | 5 | ⏳ | - |
| ☑ | `FERDIG` | `religion/bahai/bonn/artikkel.json` | 904 | ✅ | ✅ | ✅ | 5 | ⏳ | - |
| ☑ | `FERDIG` | `religion/bahai/skapelse/artikkel.json` | 878 | ✅ | ✅ | ✅ | 5 | ⏳ | - |

### Jehovas vitner

n = 9 · snitt 903 ord · 1 stub / 0 halv / 8 ferdig

| ✔ | Status | Fil | Ord | Sig | Oppg | Kilde | Quiz | Hero | Spill |
|:--|:--|:--|--:|:-:|:-:|:-:|--:|:-:|:-:|
| ☐ | `STUB` | `religion/jehovas-vitner/intro.json` | 34 | - | - | - | 0 | ✅ | - |
| ☑ | `FERDIG` | `religion/jehovas-vitner/grunnleggere/artikkel.json` | 921 | ✅ | ✅ | ✅ | 5 | ⏳ | - |
| ☑ | `FERDIG` | `religion/jehovas-vitner/gudsbilde/artikkel.json` | 999 | ✅ | ✅ | ✅ | 5 | ⏳ | - |
| ☑ | `FERDIG` | `religion/jehovas-vitner/hellige-tekster/artikkel.json` | 1037 | ✅ | ✅ | ✅ | 5 | ⏳ | - |
| ☑ | `FERDIG` | `religion/jehovas-vitner/frelse/artikkel.json` | 972 | ✅ | ✅ | ✅ | 5 | ⏳ | - |
| ☑ | `FERDIG` | `religion/jehovas-vitner/bonn/artikkel.json` | 1010 | ✅ | ✅ | ✅ | 5 | ⏳ | - |
| ☑ | `FERDIG` | `religion/jehovas-vitner/overgangsriter/artikkel.json` | 1188 | ✅ | ✅ | ✅ | 5 | ⏳ | - |
| ☑ | `FERDIG` | `religion/jehovas-vitner/sentrale-trekk/artikkel.json` | 1063 | ✅ | ✅ | ✅ | 5 | ⏳ | - |
| ☑ | `FERDIG` | `religion/jehovas-vitner/skapelse/artikkel.json` | 910 | ✅ | ✅ | ✅ | 5 | ⏳ | - |

### Mormonisme

n = 9 · snitt 930 ord · 1 stub / 0 halv / 8 ferdig

| ✔ | Status | Fil | Ord | Sig | Oppg | Kilde | Quiz | Hero | Spill |
|:--|:--|:--|--:|:-:|:-:|:-:|--:|:-:|:-:|
| ☐ | `STUB` | `religion/mormonisme/intro.json` | 39 | - | - | - | 0 | ✅ | - |
| ☑ | `FERDIG` | `religion/mormonisme/bonn/artikkel.json` | 978 | ✅ | ✅ | ✅ | 5 | ⏳ | - |
| ☑ | `FERDIG` | `religion/mormonisme/sentrale-trekk/artikkel.json` | 1114 | ✅ | ✅ | ✅ | 5 | ⏳ | - |
| ☑ | `FERDIG` | `religion/mormonisme/frelse/artikkel.json` | 929 | ✅ | ✅ | ✅ | 5 | ⏳ | - |
| ☑ | `FERDIG` | `religion/mormonisme/hellige-tekster/artikkel.json` | 1135 | ✅ | ✅ | ✅ | 5 | ⏳ | - |
| ☑ | `FERDIG` | `religion/mormonisme/gudsbilde/artikkel.json` | 977 | ✅ | ✅ | ✅ | 5 | ⏳ | - |
| ☑ | `FERDIG` | `religion/mormonisme/overgangsriter/artikkel.json` | 1108 | ✅ | ✅ | ✅ | 5 | ⏳ | - |
| ☑ | `FERDIG` | `religion/mormonisme/grunnleggere/artikkel.json` | 1188 | ✅ | ✅ | ✅ | 5 | ⏳ | - |
| ☑ | `FERDIG` | `religion/mormonisme/skapelse/artikkel.json` | 899 | ✅ | ✅ | ✅ | 5 | ⏳ | - |

### Jødedom

n = 9 · snitt 912 ord · 1 stub / 0 halv / 8 ferdig

| ✔ | Status | Fil | Ord | Sig | Oppg | Kilde | Quiz | Hero | Spill |
|:--|:--|:--|--:|:-:|:-:|:-:|--:|:-:|:-:|
| ☐ | `STUB` | `religion/jodedom/intro.json` | 27 | - | - | - | 0 | ✅ | - |
| ☑ | `FERDIG` | `religion/jodedom/bonn/artikkel.json` | 967 | ✅ | ✅ | ✅ | 5 | ⏳ | - |
| ☑ | `FERDIG` | `religion/jodedom/gudsbilde/artikkel.json` | 923 | ✅ | ✅ | ✅ | 5 | ⏳ | - |
| ☑ | `FERDIG` | `religion/jodedom/hellige-tekster/artikkel.json` | 1013 | ✅ | ✅ | ✅ | 5 | ⏳ | - |
| ☑ | `FERDIG` | `religion/jodedom/grunnleggere/artikkel.json` | 1024 | ✅ | ✅ | ✅ | 5 | ⏳ | - |
| ☑ | `FERDIG` | `religion/jodedom/overgangsriter/artikkel.json` | 1109 | ✅ | ✅ | ✅ | 5 | ⏳ | - |
| ☑ | `FERDIG` | `religion/jodedom/frelse/artikkel.json` | 1024 | ✅ | ✅ | ✅ | 5 | ⏳ | - |
| ☑ | `FERDIG` | `religion/jodedom/sentrale-trekk/artikkel.json` | 1198 | ✅ | ✅ | ✅ | 5 | ⏳ | ✅ har |
| ☑ | `FERDIG` | `religion/jodedom/skapelse/artikkel.json` | 921 | ✅ | ✅ | ✅ | 5 | ⏳ | - |

### Hinduisme

n = 9 · snitt 943 ord · 1 stub / 0 halv / 8 ferdig

| ✔ | Status | Fil | Ord | Sig | Oppg | Kilde | Quiz | Hero | Spill |
|:--|:--|:--|--:|:-:|:-:|:-:|--:|:-:|:-:|
| ☐ | `STUB` | `religion/hinduisme/intro.json` | 31 | - | - | - | 0 | ✅ | - |
| ☑ | `FERDIG` | `religion/hinduisme/hellige-tekster/artikkel.json` | 958 | ✅ | ✅ | ✅ | 5 | ⏳ | - |
| ☑ | `FERDIG` | `religion/hinduisme/gudsbilde/artikkel.json` | 1036 | ✅ | ✅ | ✅ | 5 | ⏳ | - |
| ☑ | `FERDIG` | `religion/hinduisme/frelse/artikkel.json` | 1052 | ✅ | ✅ | ✅ | 5 | ⏳ | - |
| ☑ | `FERDIG` | `religion/hinduisme/bonn/artikkel.json` | 916 | ✅ | ✅ | ✅ | 5 | ⏳ | - |
| ☑ | `FERDIG` | `religion/hinduisme/grunnleggere/artikkel.json` | 1200 | ✅ | ✅ | ✅ | 5 | ⏳ | - |
| ☑ | `FERDIG` | `religion/hinduisme/overgangsriter/artikkel.json` | 1139 | ✅ | ✅ | ✅ | 5 | ⏳ | - |
| ☑ | `FERDIG` | `religion/hinduisme/sentrale-trekk/artikkel.json` | 1200 | ✅ | ✅ | ✅ | 5 | ⏳ | ✅ har |
| ☑ | `FERDIG` | `religion/hinduisme/skapelse/artikkel.json` | 955 | ✅ | ✅ | ✅ | 5 | ⏳ | - |

### Islam

n = 9 · snitt 934 ord · 1 stub / 0 halv / 8 ferdig

| ✔ | Status | Fil | Ord | Sig | Oppg | Kilde | Quiz | Hero | Spill |
|:--|:--|:--|--:|:-:|:-:|:-:|--:|:-:|:-:|
| ☑ | `FERDIG` | `religion/islam/bonn/artikkel.json` | 987 | ✅ | ✅ | ✅ | 5 | ⏳ | - |
| ☐ | `STUB` | `religion/islam/skapelse/artikkel.json` | 45 | - | - | - | 3 | - | - |
| ☑ | `FERDIG` | `religion/islam/gudsbilde/artikkel.json` | 928 | ✅ | ✅ | ✅ | 5 | ⏳ | - |
| ☑ | `FERDIG` | `religion/islam/grunnleggere/artikkel.json` | 1100 | ✅ | ✅ | ✅ | 5 | ⏳ | - |
| ☑ | `FERDIG` | `religion/islam/hellige-tekster/artikkel.json` | 1195 | ✅ | ✅ | ✅ | 5 | ⏳ | - |
| ☑ | `FERDIG` | `religion/islam/frelse/artikkel.json` | 1025 | ✅ | ✅ | ✅ | 5 | ⏳ | - |
| ☑ | `FERDIG` | `religion/islam/overgangsriter/artikkel.json` | 1127 | ✅ | ✅ | ✅ | 5 | ⏳ | - |
| ☑ | `FERDIG` | `religion/islam/sentrale-trekk/artikkel.json` | 991 | ✅ | ✅ | ✅ | 5 | ⏳ | - |
| ☐ | `FERDIG` | `religion/islam/intro/artikkel.json` | 1016 | ✅ | - | - | 5 | ✅ | ✅ har |

### Buddhisme

n = 10 · snitt 1005 ord · 1 stub / 0 halv / 9 ferdig

| ✔ | Status | Fil | Ord | Sig | Oppg | Kilde | Quiz | Hero | Spill |
|:--|:--|:--|--:|:-:|:-:|:-:|--:|:-:|:-:|
| ☐ | `STUB` | `religion/buddhisme/intro.json` | 32 | - | - | - | 0 | ✅ | - |
| ☑ | `FERDIG` | `religion/buddhisme/hellige-tekster/artikkel.json` | 1197 | ✅ | ✅ | ✅ | 5 | ⏳ | - |
| ☑ | `FERDIG` | `religion/buddhisme/frelse/artikkel.json` | 1075 | ✅ | ✅ | ✅ | 5 | ⏳ | - |
| ☑ | `FERDIG` | `religion/buddhisme/bonn/artikkel.json` | 1024 | ✅ | ✅ | ✅ | 5 | ⏳ | - |
| ☑ | `FERDIG` | `religion/buddhisme/gudsbilde/artikkel.json` | 961 | ✅ | ✅ | ✅ | 5 | ⏳ | - |
| ☑ | `FERDIG` | `religion/buddhisme/grunnleggere/artikkel.json` | 1043 | ✅ | ✅ | ✅ | 5 | ⏳ | - |
| ☑ | `FERDIG` | `religion/buddhisme/overgangsriter/artikkel.json` | 976 | ✅ | ✅ | ✅ | 5 | ⏳ | - |
| ☑ | `FERDIG` | `religion/buddhisme/sentrale-trekk/artikkel.json` | 1198 | ✅ | ✅ | ✅ | 5 | ⏳ | ✅ har |
| ☐ | `FERDIG` | `religion/buddhisme/den-attedelte-vei/artikkel.json` | 1506 | ✅ | - | - | 5 | ✅ | ✅ har |
| ☑ | `FERDIG` | `religion/buddhisme/skapelse/artikkel.json` | 1037 | ✅ | ✅ | ✅ | 5 | ⏳ | - |

### Sikhisme

n = 9 · snitt 957 ord · 1 stub / 0 halv / 8 ferdig

| ✔ | Status | Fil | Ord | Sig | Oppg | Kilde | Quiz | Hero | Spill |
|:--|:--|:--|--:|:-:|:-:|:-:|--:|:-:|:-:|
| ☑ | `FERDIG` | `religion/sikhisme/grunnleggere/artikkel.json` | 1094 | ✅ | ✅ | ✅ | 5 | ⏳ | - |
| ☐ | `STUB` | `religion/sikhisme/intro/artikkel.json` | 133 | - | - | - | 3 | ✅ | - |
| ☑ | `FERDIG` | `religion/sikhisme/hellige-tekster/artikkel.json` | 984 | ✅ | ✅ | ✅ | 5 | ⏳ | - |
| ☑ | `FERDIG` | `religion/sikhisme/sentrale-trekk/artikkel.json` | 1019 | ✅ | ✅ | ✅ | 5 | ⏳ | - |
| ☐ | `FERDIG` | `religion/sikhisme/overgangsriter.json` | 1304 | ✅ | ✅ | ✅ | 5 | ✅ | ✅ har |
| ☑ | `FERDIG` | `religion/sikhisme/skapelse/artikkel.json` | 895 | ✅ | ✅ | ✅ | 5 | ⏳ | - |
| ☑ | `FERDIG` | `religion/sikhisme/gudsbilde/artikkel.json` | 922 | ✅ | ✅ | ✅ | 5 | ⏳ | - |
| ☐ | `FERDIG` | `religion/sikhisme/bonn/artikkel.json` | 1226 | ✅ | ✅ | ✅ | 5 | ⏳ | ✅ har |
| ☑ | `FERDIG` | `religion/sikhisme/frelse/artikkel.json` | 1035 | ✅ | ✅ | ✅ | 5 | ⏳ | - |

### Kristendom

n = 14 · snitt 1097 ord · 0 stub / 0 halv / 14 ferdig

| ✔ | Status | Fil | Ord | Sig | Oppg | Kilde | Quiz | Hero | Spill |
|:--|:--|:--|--:|:-:|:-:|:-:|--:|:-:|:-:|
| ☑ | `FERDIG` | `religion/kristendom/hellige-tekster/artikkel.json` | 1184 | ✅ | ✅ | ✅ | 5 | ⏳ | - |
| ☑ | `FERDIG` | `religion/kristendom/bonn/artikkel.json` | 901 | ✅ | ✅ | ✅ | 5 | ⏳ | - |
| ☑ | `FERDIG` | `religion/kristendom/skapelse/artikkel.json` | 1170 | ✅ | ✅ | ✅ | 5 | ⏳ | - |
| ☑ | `FERDIG` | `religion/kristendom/sentrale-trekk/artikkel.json` | 1066 | ✅ | ✅ | ✅ | 5 | ⏳ | - |
| ☑ | `FERDIG` | `religion/kristendom/grunnleggere/artikkel.json` | 1101 | ✅ | ✅ | ✅ | 5 | ⏳ | - |
| ☑ | `FERDIG` | `religion/kristendom/gudsbilde/artikkel.json` | 942 | ✅ | ✅ | ✅ | 5 | ⏳ | - |
| ☑ | `FERDIG` | `religion/kristendom/frelse/artikkel.json` | 1152 | ✅ | ✅ | ✅ | 5 | ⏳ | - |
| ☑ | `FERDIG` | `religion/kristendom/overgangsriter/artikkel.json` | 1052 | ✅ | ✅ | ✅ | 5 | ⏳ | - |
| ☑ | `FERDIG` | `religion/kristendom/baptistene.json` | 1177 | ✅ | ✅ | ✅ | 5 | ⏳ | - |
| ☑ | `FERDIG` | `religion/kristendom/pinse.json` | 1184 | ✅ | ✅ | ✅ | 5 | ⏳ | - |
| ☑ | `FERDIG` | `religion/kristendom/sakramentene.json` | 974 | ✅ | ✅ | ✅ | 5 | ⏳ | - |
| ☑ | `FERDIG` | `religion/kristendom/kirkesamfunn.json` | 1095 | ✅ | ✅ | ✅ | 5 | ⏳ | - |
| ☑ | `FERDIG` | `religion/kristendom/intro/artikkel.json` | 1189 | ✅ | ✅ | ✅ | 5 | ⏳ | ✅ har |
| ☑ | `FERDIG` | `religion/kristendom/paulus-og-misjonen.json` | 1170 | ✅ | ✅ | ✅ | 5 | ⏳ | - |

### Samisk religion

n = 2 · snitt 1029 ord · 0 stub / 0 halv / 2 ferdig

| ✔ | Status | Fil | Ord | Sig | Oppg | Kilde | Quiz | Hero | Spill |
|:--|:--|:--|--:|:-:|:-:|:-:|--:|:-:|:-:|
| ☐ | `FERDIG` | `religion/samisk/intro.json` | 818 | ✅ | - | - | 5 | ✅ | - |
| ☐ | `FERDIG` | `religion/samisk/laestadianismen.json` | 1240 | ✅ | ✅ | ✅ | 5 | ✅ | ✅ har |

### Historiske religioner

n = 3 · snitt 1519 ord · 0 stub / 0 halv / 3 ferdig

| ✔ | Status | Fil | Ord | Sig | Oppg | Kilde | Quiz | Hero | Spill |
|:--|:--|:--|--:|:-:|:-:|:-:|--:|:-:|:-:|
| ☐ | `FERDIG` | `religion/historiske-religioner/egyptisk-religion.json` | 1354 | ✅ | ✅ | ✅ | 5 | ✅ | ✅ har |
| ☐ | `FERDIG` | `religion/historiske-religioner/mesopotamisk-religion.json` | 1446 | ✅ | ✅ | ✅ | 5 | ✅ | ✅ har |
| ☐ | `FERDIG` | `religion/historiske-religioner/monoteismens-fodsel.json` | 1758 | ✅ | - | - | 3 | ✅ | ✅ har |

### Religion og kultur

n = 4 · snitt 812 ord · 0 stub / 0 halv / 4 ferdig

| ✔ | Status | Fil | Ord | Sig | Oppg | Kilde | Quiz | Hero | Spill |
|:--|:--|:--|--:|:-:|:-:|:-:|--:|:-:|:-:|
| ☐ | `FERDIG` | `religion-og-kultur/symboler-og-klaer.json` | 802 | ✅ | - | - | 5 | ✅ | ✅ har |
| ☐ | `FERDIG` | `religion-og-kultur/hoytider-og-kultur.json` | 805 | ✅ | - | - | 4 | ✅ | ✅ har |
| ☐ | `FERDIG` | `religion-og-kultur/mat-og-religion.json` | 819 | ✅ | - | - | 5 | ✅ | ✅ har |
| ☐ | `FERDIG` | `religion-og-kultur/religion-i-medier.json` | 822 | ✅ | - | - | 5 | ✅ | ✅ har |

### Filosofi

n = 20 · snitt 511 ord · 0 stub / 17 halv / 3 ferdig

| ✔ | Status | Fil | Ord | Sig | Oppg | Kilde | Quiz | Hero | Spill |
|:--|:--|:--|--:|:-:|:-:|:-:|--:|:-:|:-:|
| ☐ | `HALV` | `filosofi/locke.json` | 312 | - | - | - | 0 | ✅ | - |
| ☐ | `HALV` | `filosofi/kant.json` | 368 | - | - | - | 4 | ✅ | - |
| ☐ | `HALV` | `filosofi/rothbard.json` | 371 | - | - | - | 0 | ✅ | - |
| ☐ | `HALV` | `filosofi/kierkegaard.json` | 376 | - | - | - | 0 | ✅ | - |
| ☐ | `HALV` | `filosofi/arendt.json` | 390 | - | - | - | 0 | ✅ | - |
| ☐ | `HALV` | `filosofi/augustin.json` | 406 | - | - | - | 0 | ✅ | - |
| ☐ | `HALV` | `filosofi/mises.json` | 411 | - | - | - | 0 | ✅ | - |
| ☐ | `HALV` | `filosofi/beauvoir.json` | 421 | - | - | - | 0 | ✅ | - |
| ☐ | `HALV` | `filosofi/aquinas.json` | 445 | - | - | - | 0 | ✅ | - |
| ☐ | `HALV` | `filosofi/heidegger.json` | 446 | - | - | - | 0 | ✅ | - |
| ☐ | `HALV` | `filosofi/aristoteles.json` | 449 | - | - | - | 4 | ✅ | - |
| ☐ | `HALV` | `filosofi/descartes.json` | 452 | - | - | - | 0 | ✅ | - |
| ☐ | `HALV` | `filosofi/nietzsche.json` | 485 | - | - | - | 0 | ✅ | - |
| ☐ | `HALV` | `filosofi/platon.json` | 554 | - | - | - | 4 | ✅ | - |
| ☐ | `HALV` | `filosofi/intro.json` | 599 | - | - | - | 0 | ✅ | - |
| ☐ | `HALV` | `filosofi/sokrates.json` | 608 | - | - | - | 4 | ✅ | - |
| ☐ | `HALV` | `filosofi/hume.json` | 618 | - | - | - | 3 | ✅ | - |
| ☐ | `FERDIG` | `filosofi/marx.json` | 816 | ✅ | - | - | 5 | ✅ | - |
| ☐ | `FERDIG` | `filosofi/rousseau.json` | 820 | ✅ | - | - | 5 | ✅ | ✅ har |
| ☐ | `FERDIG` | `filosofi/montesquieu.json` | 872 | ✅ | - | - | 5 | ✅ | - |

### Etikk

n = 10 · snitt 1140 ord · 0 stub / 2 halv / 8 ferdig

| ✔ | Status | Fil | Ord | Sig | Oppg | Kilde | Quiz | Hero | Spill |
|:--|:--|:--|--:|:-:|:-:|:-:|--:|:-:|:-:|
| ☐ | `HALV` | `etikk/non-aggression.json` | 1091 | - | - | - | 0 | ✅ | - |
| ☐ | `HALV` | `etikk/naturrett.json` | 1119 | - | - | - | 0 | ✅ | - |
| ☐ | `FERDIG` | `etikk/nihilisme.json` | 902 | ✅ | - | - | 4 | ✅ | ✅ har |
| ☐ | `FERDIG` | `etikk/dyreetikk.json` | 942 | ✅ | ✅ | - | 5 | ✅ | ✅ har |
| ☐ | `FERDIG` | `etikk/kunstig-intelligens-og-etikk.json` | 993 | ✅ | ✅ | ✅ | 5 | ✅ | ✅ har |
| ☐ | `FERDIG` | `etikk/rettferdighetsetikk.json` | 1047 | ✅ | ✅ | ✅ | 5 | ✅ | ✅ har |
| ☐ | `FERDIG` | `etikk/dygdsetikk.json` | 1107 | ✅ | - | - | 4 | ✅ | - |
| ☐ | `FERDIG` | `etikk/pliktetikk.json` | 1326 | ✅ | - | - | 4 | ✅ | - |
| ☐ | `FERDIG` | `etikk/utilitarisme.json` | 1374 | ✅ | - | - | 4 | ✅ | - |
| ☐ | `FERDIG` | `etikk/intro.json` | 1504 | ✅ | - | - | 4 | ✅ | - |
---

## 7. Bugs - R0, fikset 2026-08-10

Fem feil som gjorde at sider ikke virket. Alle er ryddet før innholdsarbeidet startet.

### B1 - Seks intro-sider renderte helt tomt ✅

**Filer:** `religion/{bahai,buddhisme,hinduisme,jehovas-vitner,jodedom,mormonisme}/intro.json`

De brukte feltene `ingress` og `body` i stedet for `content`. Verken `body` eller `ingress` leses noe sted i `src/`, så sidene lastet med tom brødtekst. Hver fil hadde rundt 30-40 ord tekst som lå ubrukt.

**Gjort:** konvertert til flat `content`-array, og lagt til `subject`, `topic`, `religion`, `dimension`, `comparison_tags`, `category`, `readTime` og `heroImage`. Hero-bildene fantes allerede på disk (`bahai_hero.webp` osv.) - de var bare aldri koblet til.

### B2 - To islam-artikler brukte feil blokk-skjema ✅

**Filer:** `religion/islam/bonn/artikkel.json`, `religion/islam/skapelse/artikkel.json`

De skrev `{"name": "text"}` der resten av korpuset bruker `{"type": "text"}`.

**Presisering:** dette gjorde dem ikke usynlige. `resolveBlockType` i `src/components/ArticleContent.tsx` (linje 193) leser `b.type || b.name`, så sidene rendret. Men de var de eneste blokkene i hele KRLE uten `type`, og de eneste artiklene som hentet bilder fra en ekstern Unsplash-URL.

**Gjort:** `name` → `type`, `subject` normalisert fra `"KRLE"` til `"krle"`, `topic` fra `"Islam"` til `"religioner"`, manglende `id` lagt til. Unsplash-bildet i `bonn` erstattet med lokale `islam_bonn.webp`; i `skapelse` fjernet bildeblokken, siden ingen passende lokal illustrasjon finnes ennå - bilde kommer i R1.

### B3 - `islam/skapelse` manglet i manifestet ✅

Fila fantes på disk, men var ikke registrert under `krle → religion → islam`. Artikkelen var usynlig i navigasjonen, men ble likevel plukket opp av `generate-comparison-manifest.mjs` og vist på `/krle/sammenlign/tema/skapelse`.

**Gjort:** lesson-oppføring lagt inn etter `gudsbilde`.

### B4 - Sikhisme sin intro-lenke pekte feil ✅

Manifestet registrerte lesson-ID `intro`, JSON-fila hadde `"id": "intro"`, men mappa på disk het `introduksjon/`. Ruten `/krle/religion/sikhisme/intro` var brutt.

**Gjort:** mappa omdøpt til `intro/` med `git mv`, slik at den følger samme mønster som alle de andre religionene. `comparison-manifest.json` regenerert med riktig lenke.

### B5 - Duplikate React-nøkler i «Relatert innhold» ✅

**Fil:** `src/components/RichSidebar.tsx`

Lista over relaterte artikler brukte `key={article.id}`. Fordi hele KRLE er bygget på at samme artikkel-ID gjentas på tvers av religionene (`overgangsriter` finnes ni ganger, `bonn` åtte ganger), kolliderte nøklene, og React kunne utelate eller duplisere oppføringer.

Denne ble oppdaget under verifiseringen av B1-B4 og var ikke med i den opprinnelige buglista. Den er verdt å merke seg fordi den blir **verre** jo flere parallelle artikler vi legger til - altså nøyaktig det dette prosjektet går ut på.

**Gjort:** `key={article.url}`, som er unik per artikkel.

### Verifisering av R0

Alle ni berørte ruter lastet i Chromium på 1366×768: tekst til stede, alle bilder lastet (`naturalWidth > 0`), **null konsollfeil**. `npx tsc -b` og `npm run lint` rene. `/krle/sammenlign`, `/krle/sammenlign/tema/skapelse` og `/krle/religion/sikhisme` regresjonstestet uten feil.

---

## 8. Verktøyet

Skillet **`/oppgrader-religion-artikkel`** (`.claude/skills/oppgrader-religion-artikkel/SKILL.md`) skanner `public/content/krle/religion/`, rangerer kandidatene, lar deg velge blant de fire øverste og kjører `plan_article` på den valgte. Valgfritt argument begrenser søket til én religion (bruk mappenavnet: `jodedom`, `bahai`, `jehovas-vitner`):

```
/oppgrader-religion-artikkel islam
```

Skanneren regner en artikkel som ferdig når den har signaturkomponent, `Oppgaver`, `Kildeliste` **og** minst 800 ord. Mikrospill teller ikke - se §2.1.

Rangeringen følger rundene i §5, så du slipper å styre den manuelt:

| Rang | Status | Betydning |
|---|---|---|
| 1 | `BROKEN` | Ødelagt blokk-skjema - renderer tomt eller feil |
| 2 | `MISSING` | Finnes ikke på disk. Opprettes fra bunnen, og må registreres i `manifest.json`. Sortert `skapelse` → `gudsbilde` → `bonn` → `overgangsriter` → `frelse`, altså R1 → R5 |
| 3 | `EMPTY` | Finnes, men uten signaturkomponent |
| 4 | `PARTIAL` | Har signaturkomponent, mangler hale eller ordtall |

Forventningsmatrisen (ni religioner × ni artikkel-ID-er) er den samme som i blueprintens §3.1. Endres den ene, må den andre endres med.

Skillet dekker bare `religion/`-mappa. For `filosofi/` (R7) må `plan_article` kjøres direkte.

---

## 9. Logg

Før opp hver ferdigstilte artikkel her fra og med nå, så er historikken synlig uten å grave i git. Artikler som allerede holder standard er merket `FERDIG` i tabellene i §6 - de er ikke ført inn her, fordi git-historikken bare viser når fila sist ble rørt, ikke når den ble ferdigstilt.

| Dato | Artikkel | Signaturkomponent | Mikrospill | PR |
|---|---|---|---|---|
| 2026-08-10 | R0: bugfiks B1-B5, 10 filer | - | - | - |
| 2026-08-10 | Jødedom: Skapelsen: Verden som blir til av ord | `SkapelseVedOrd` | - | - |
| 2026-08-10 | Hinduisme: Verden uten begynnelse | `UniversetsAandedrag` | - | - |
| 2026-08-10 | Buddhisme: Spørsmålet Buddha ikke svarte på | `SporsmaalUtenSvar` | - | - |
| 2026-08-10 | Bahá'í: Skapelsen som aldri begynte | `SkapelseUtenBegynnelse` | - | - |
| 2026-08-10 | Mormonisme: Skapelsen i mormonismen | `OrganisertAvMaterie` | - | - |
| 2026-08-10 | Jehovas vitner: Seks dager eller seks tidsaldre? | `DeSeksPeriodene` | - | - |
| 2026-08-10 | Sikhisme: Mørket før verden | `FoerLysetFantes` | - | - |
| 2026-08-10 | R2: Sikhisme: Gud du ikke kan tegne | `DenTommeRammen` | - | - |
| 2026-08-11 | Jødedom: Navnet ingen sier høyt | `NavnetSomIkkeSies` | - | - |
| 2026-08-11 | Kristendom: Én Gud, tre personer | `TreenighetensKnute` | - | - |
| 2026-08-11 | Islam: Én, og ingen ved siden av | `TawhidEllerShirk` | - | - |
| 2026-08-11 | Bahá'í: Solen du ikke kan se på | `SpeiletOgSolen` | - | - |
| 2026-08-11 | Mormonisme: Guden med en kropp | `GuddommenModellen` | - | - |
| 2026-08-11 | Jehovas vitner: Gud med fornavn | `HvemErStorst` | - | - |
| 2026-08-11 | Hinduisme: Én eller millioner? | `EnEllerMillioner` | - | - |
| 2026-08-11 | Buddhisme: Gudene som ikke kan redde deg | `GudeneSomIkkeFrelser` | - | - |
| 2026-08-11 | Jødedom: Bønnen som trenger ni til | `MinjanRommet` | - | - |
| 2026-08-11 | Kristendom: Bønnen som snur etter tredje ledd | `FadervaarLinjeForLinje` | - | - |
| 2026-08-11 | Islam: Bønnen som følger sola | `SolaSomKlokke` | - | - |
| 2026-08-11 | Bahá'í: Tre bønner, og du velger selv | `TreBonnerEttValg` | - | - |
| 2026-08-11 | Mormonisme: Bønnen som stiller et spørsmål | `BonnSomSamtale` | - | - |
| 2026-08-11 | Jehovas vitner: Til Jehova, gjennom Jesus | `AdressenPaaBonnen` | - | - |
| 2026-08-11 | Hinduisme: Bønn du gjør med hendene | `PujaBrettet` | - | - |
| 2026-08-11 | Buddhisme: Hvem snakker du til? | `HvemSnakkerDuTil` | - | - |
| 2026-08-11 | Jødedom: Dagen ansvaret bytter eier | `PliktenSomFlytterSeg` | - | - |
| 2026-08-11 | Kristendom: Uenigheten om vannet | `NaarSkalDuDoepes` | - | - |
| 2026-08-11 | Islam: Setningen som rammer inn livet | `FoersteOgSisteOrd` | - | - |
| 2026-08-11 | Bahá'í: Én setning, og alle foreldrenes ja | `SamtykkePorten` | - | - |
| 2026-08-11 | Mormonisme: Ikke til døden skiller dere | `Slektskjeden` | - | - |
| 2026-08-11 | Jehovas vitner: Dåpen du må be om selv | `ValgetDuTarSelv` | - | - |
| 2026-08-11 | Hinduisme: Seksten riter gjennom et liv | `SamskaraStigen` | - | - |
| 2026-08-11 | Buddhisme: Riten som ikke finnes | `RitenSomIkkeFinnes` | - | - |
| 2026-08-11 | Jødedom: Verden er ikke ferdig | `DenneVerdenFoerst` | - | - |
| 2026-08-11 | Kristendom: Gaven ingen kan fortjene | `Signeringsbordet` | - | - |
| 2026-08-11 | Islam: Vekten som ikke lyver | `VektskaalenPaaDommensDag` | - | - |
| 2026-08-11 | Bahá'í: Hva skal du med øyne i mørket? | `Fosterkammeret` | - | - |
| 2026-08-11 | Mormonisme: Tre slags himmel | `TreGraderAvHerlighet` | - | - |
| 2026-08-11 | Jehovas vitner: Et tall, og en skare ingen kan telle | `HundreOgFortiFireTusen` | - | - |
| 2026-08-11 | Hinduisme: Ikke et bedre sted, men ut | `SamsaraHjulet` | - | - |
| 2026-08-11 | Buddhisme: Hvor ble det av flammen? | `FlammenSomSlukner` | - | - |
| 2026-08-11 | Sikhisme: Dråpen som ikke ble borte | `DraapenIHavet` | - | - |
| 2026-08-11 | Jødedom: Ingen stifter, men en pakt | `IngenStifterMenEnPakt` | - | - |
| 2026-08-11 | Kristendom: Mannen som ikke grunnla en religion | `HanStiftetIngenReligion` | - | - |
| 2026-08-11 | Islam: Profeten som ikke skal tilbes | `ProfetIkkeGud` | - | - |
| 2026-08-11 | Bahá'í: Porten og herligheten | `ToSomHengerSammen` | - | - |
| 2026-08-11 | Mormonisme: Profeten som elleve menn gikk god for | `VitnenesUnderskrifter` | - | - |
| 2026-08-11 | Jehovas vitner: Grunnleggeren som ikke ville være grunnlegger | `GrunnleggerenSomIkkeVil` | - | - |
| 2026-08-11 | Hinduisme: Religionen ingen fant opp | `LetingenEtterEnStifter` | - | - |
| 2026-08-11 | Buddhisme: Mannen som våknet | `MennesketSomVaaknet` | - | - |
| 2026-08-11 | Sikhisme: Da guruen ble en bok | `TiGuruerOgEnBok` | - | - |
| 2026-08-11 | Jødedom: Boka der uenigheten blir stående | `SidenSomVokser` | - | - |
| 2026-08-11 | Kristendom: Boka som ble satt sammen | `HvaKomMedIBoka` | - | - |
| 2026-08-11 | Islam: Boka som ikke kan oversettes | `OversettelsenSomIkkeErKoranen` | - | - |
| 2026-08-11 | Bahá'í: Boka grunnleggeren skrev selv | `SkrevetAvHamSelv` | - | - |
| 2026-08-11 | Mormonisme: Fire bøker, og plass til mer | `KanonenSomIkkeErLukket` | - | - |
| 2026-08-11 | Jehovas vitner: Ett ord, to bibler | `NavnetSattInnIgjen` | - | - |
| 2026-08-11 | Hinduisme: Hørt eller husket | `HoertEllerHusket` | - | - |
| 2026-08-11 | Buddhisme: Tre kurver, flere kanoner | `TreKurverOgFlereKanoner` | - | - |
| 2026-08-11 | Sikhisme: Guruen som er en bok | `BokaSomLeggerSeg` | - | - |
| 2026-08-11 | Kristendom: Det alle kristne er enige om | `DetAlleErEnigeOm` | - | - |
| 2026-08-11 | Islam: Fire av fem søyler er noe du gjør | `FemHandlingerIkkeFemTanker` | - | - |
| 2026-08-11 | Bahá'í: Én Gud, én religion, én menneskehet | `TreEnheter` | - | - |
| 2026-08-11 | Mormonisme: Påstanden alt annet henger på | `GjenopprettelsensPaastand` | - | - |
| 2026-08-11 | Jehovas vitner: Regjeringen som snart skal overta | `HvaSomSkillerDem` | - | - |
| 2026-08-11 | Sikhisme: Tre regler du kan leve, fem ting du kan se | `TreReglerOgFemTing` | - | - |
| 2026-08-11 | Jødedom: Mange måter å være jøde på | `BritPilarer` | ↻ tikkun-olam-3d | - |
| 2026-08-11 | Hinduisme: En religion uten sentrum | `MokshaVeiene` | ↻ | - |
| 2026-08-11 | Buddhisme: En diagnose og en behandling | `DharmahjuletUtforsker` | ↻ | - |
| 2026-08-12 | Kristendom: To fortellinger om begynnelsen | `SeksDagersVerket` | - | - |
| 2026-08-12 | Kristendom: Sakramentene: Dåp og nattverd | `HvaSkjerMedBrodet` | - | - |
| 2026-08-12 | Kristendom: Kirkesamfunn: Splittelse og enhet | `ToStoreBrudd` | - | - |
| 2026-08-12 | Kristendom: Avgjørelsen som åpnet døren | `AvgjorelsenSomAapnetDoren` | - | - |
| 2026-08-12 | Kristendom: Verdens største religion | `KristendomsGrenerUtforsker` | ↻ | - |
| 2026-08-12 | Kristendom: Pinse: Den dagen kirken ble til | `PinseNasjoner` | ↻ | - |
| 2026-08-12 | Kristendom: Baptistene: frihet gjennom dåpen | `BaptismComparator` | ↻ | - |

---

## 10. Lærdommer fra R0-R6 og sammenligningsemnet

Skrevet ned 2026-08-12, etter at 99 av 126 KRLE-artikler og 14 av 17
sammenligningsartikler var bygget med parallelle agenter. Dette er ikke en dagbok, men
den korteste lista over ting som faktisk gikk galt, og hva som forhindrer at det gjentar seg.

### 10.1 Kjør alltid en fersk skanning rett før en runde starter

Planen i §5 er et øyeblikksbilde og driver fra virkeligheten på tre måter:

- **Boten bygger samtidig.** Den daglige innholdscronen følger de samme dokumentene. I R3
  hadde den laget `sikhisme/bonn` (1226 ord, egen signaturkomponent, eget mikrospill) noen
  timer før runden startet. Agenten min fikk beskjed om at fila ikke fantes, og overskrev
  den med en kortere versjon. Oppdaget bare fordi manifest-skriptet meldte «opprettet 0»
  der jeg ventet «opprettet 1». Bot-versjonen ble gjenopprettet.
- **Rundeomfang definert på filnavn i stedet for kvalitet.** R1 var definert som «`skapelse`
  for de religionene som mangler den». `islam/skapelse` fantes, men var en stubb på 45 ord,
  og slapp derfor gjennom hele runden. Tema 1 i sammenligningsemnet sto som 9/9 i tellingen
  mens det reelt var 8/9. **Definer runder på terskelen i §2, aldri på om fila finnes.**
- **Samme artikkel under flere navn.** R6 var definert som «de åtte kristendom-artiklene i
  325-396-båndet». Sju av dem het også `gudsbilde`, `bonn`, `overgangsriter` og ble tatt i
  R2-R5. Bare `skapelse` sto igjen, mens sju helt andre kristendom-artikler manglet hale.

### 10.2 Delte filer må aldri røres av agenter

`public/content/manifest.json` og `src/components/ComponentRegistry.tsx` skrives av hver
eneste artikkel. Parallelle agenter som redigerer dem samtidig korrumperer dem.

**Mønsteret som virker:** agentene eier kun sine to egne filer (artikkel-JSON og
`.tsx`-komponenten) og *returnerer* manifest-oppføringen og det endelige komponentnavnet
som strukturert data. Orkestratoren gjør begge registreringene serielt etterpå.

Komponentnavn må returneres selv om agenten beholder det foreslåtte, fordi agenter ofte
bytter navn når vinkelen forskyver seg under kildearbeidet. `DeNittiniNavnene` ble
`TawhidEllerShirk`, `GudMedKropp` ble `GuddommenModellen`, `TreBonnerOmDagen` ble
`MinjanRommet`. Registreres feil navn, viser artikkelen en feilboks.

### 10.3 `args` til Workflow ankommer som streng

Sendes et lenkekart eller annen konfigurasjon via `args`, kommer det fram som en
JSON-streng, ikke som objekt. `LENKER[rel.id]` blir da `undefined`, og prompten får en tom
liste uten at noe feiler. I R2 fikk fem av åtte artikler null innlenker på den måten, i R3
to av ni.

**Legg konfigurasjonen som literal i selve skriptet**, og legg inn en vakt:

```js
if (!lenker.length) log(`ADVARSEL: tom lenkeliste for ${rel.id}`)
```

### 10.4 Sesjonsgrenser dreper midt i skrivingen

Traff tre ganger. Konsekvensen er halvferdig tilstand på disk: noen artikler komplette,
noen komponenter uten artikkel, én artikkel som refererer en komponent som aldri ble
skrevet.

- **Del runder i puljer på tre og commit mellom hver.** Ni parallelle byggagenter som hver
  henter fem kilder tømmer budsjettet. Tre artikler koster rundt 930k agent-tokens, seks
  koster 2,5M.
- **Etter et avbrudd: vurder hver fil for seg.** Komplette artikkel-og-komponent-par kan
  beholdes. Artikler uten komponentfil rulles tilbake. Foreldreløse komponenter slettes
  hvis de er avkuttede fragmenter, men beholdes hvis de kompilerer og er hele.
- **Overlevende artikler er ALDRI verifiserte.** Kjør verifiseringsagenter på dem i neste
  runde. Det var der de groveste feilene lå: islam/hellige-tekster hadde fire setninger på
  rad der tradisjonens fortelling sto som dokumentert historie, og lå 135 ord over taket.

### 10.5 Bildecronen sveiper inn uferdig arbeid

`agy-generate-images.sh` kjører 07:30, `git add`-er bredt og committer alt som ligger i
arbeidstreet. Den tok alle seks sammenligningsartiklene fra en workflow som fortsatt
kjørte, midt i skrivingen. Den registrerer verken leksjoner i manifestet eller komponenter
i registryet, så artiklene landet på main uten å være nåbare og med feilbokser der
signaturkomponenten skulle stått.

**Ikke la uferdig arbeid ligge over natta.** Commit før 07:30, eller regn med å rydde.

### 10.6 Feiltypene som faktisk forekommer

Rangert etter hvor alvorlige de er og hvor vanskelige de er å se:

1. **Skjult fabrikasjon.** En riktig påstand festet på en kilde som ikke nevner temaet.
   Den vanligste alvorlige feilen. Eksempler: en FactBox om norsk lov kreditert
   `snl.no/brit_mila`, som ikke nevner norsk lov; «Paulus brukte oppstandelsen som bevis»
   kreditert `snl.no/oppstandelse`, der det ikke står; mihraben «formet som en port mot
   paradis» uten dekning i noen av nitten kilder. **Motmiddel:** gå gjennom minst åtte til
   ti kildehenvisninger én for én og bekreft at kilden dekker akkurat den påstanden.
2. **Trosinnhold framstilt som historie.** Sjangerfeilen. «Gud inngikk en pakt med Abraham»
   mot «I fortellingen inngår Gud en pakt». Særlig hyppig i `grunnleggere` og
   `hellige-tekster`, der tradisjonens egen fortelling om opphavet lett glir over i
   indikativ. **Motmiddel:** eget verifiseringspunkt som krever gjennomgang av hele teksten.
3. **Feil inne i komponenten, i en tilstand teksten rundt ikke avslører.** Kjønnsvelgeren i
   `PliktenSomFlytterSeg` endret bare alderen, ikke kortstokken, og påstod dermed at en
   jente i ortodoks tradisjon leser fra Tora-rullene. **Motmiddel:** faktasjekk komponenten
   i *alle* tilstander, ikke bare den første.
4. **Tekst skrevet uten kilder inneholder rundt femten faktafeil per artikkel.** Målt: 46
   feil i tre artikler (R5d pulje B), 130 i sju (R6). En artikkel som ser ferdig ut med
   riktig lengde og egen komponent kan være full av feil hvis den aldri ble skrevet fra
   kilder. Det er en annen feiltype enn stubbene, og vanskeligere å få øye på.
5. **Sammenligningen motsier sin egen kildeartikkel.** `bonn`-sammenligningen skrev «ti
   voksne» om minjan der både SNL og `jodedom/bonn` sier «ti voksne menn». **Motmiddel:**
   kryssjekk fem påstander mot den tilhørende per-religion-artikkelen.
6. **Rangering i sammenligningsartikler.** Artikkelen tar stilling der kilden sier at de
   lærde er uenige. Den negative gylne regel framstilt som «noe du kan oppfylle ved å sitte
   helt stille» gjorde fire tradisjoner mindre forpliktende enn de andre.
7. **Tall uten årstall, og spenn gjort om til presisjon.** Medlemstall er ferskvare og må
   dateres. «82 språk» var en avledning som gjorde engelsk til en oversettelse; kilden sa
   81 ikke-engelske. Der kilden sier «rundt», skal det stå «rundt».

### 10.7 Tekniske fallgruver

- **Framer Motion og SVG-attributter.** Animeres `r`, `cx` eller `pathLength` uten at
  attributtet også settes direkte, er det `undefined` i første frame og konsollen får
  `<circle> attribute r: Expected length`. `pathLength` overstyrer i tillegg
  `strokeDasharray`, så statisk stipling forsvinner.
- **Tailwind-breakpoints måler vinduet, ikke spalta.** Artikkelspalta er 712 px bred i et
  1366 px vindu, så `xl:grid-cols-3` slår aldri inn mens `sm:` alltid gjør det.
- **Komponenthøyde.** Hold under 700 px i artikkelspalta. Den vanligste årsaken til at den
  sprenger, er at samme innhold vises både som merkelapper på hvert kort og i et
  detaljpanel. Velg ett sted. Byggagentens eget anslag er upålitelig; `MatbordetsRegler`
  ble 1090 px og `RommetsGrammatikk` 719 px der agenten anslo 660. **Mål i Chromium.**
- **`/krle/sammenlign/tema/:tag` matcher hva som helst.** Lenkesjekkeren godkjenner derfor
  data-ugyldige lenker. Bare de ti slugene `generate-comparison-manifest.mjs` faktisk lager
  er gyldige; dimensjonsnavn som `ethical` eller `material` er det aldri.
- **Generatoren ser bare `krle/religion/*/*/artikkel.json`.** Flate filer er usynlige.
  `sikhisme/overgangsriter.json` lå flatt OG manglet `comparison_tags` helt, så
  referansemalen i hele opprustningen var usynlig i sammenligningssystemet.
- **`comparison_tags` som ser inkonsekvente ut, er ofte aliaser.** `hellige_tekster` med
  understrek og `skapelsesmyte` normaliseres av generatoren. «Rydder» man i dem, faller
  artikkelen ut av et tema. La dem stå.

### 10.8 Det som gjør en runde god

- **Én faglig vinkel per artikkel, formulert som DET SÆREGNE.** Uten den lager ni agenter
  ni varianter av samme komponent. Advar eksplisitt mot den late mekanikken: «fire
  livsfaser på en tidslinje», «klikk på fem kort og les en faktatekst», «bla i en bok».
- **La agenten si fra framfor å gjette.** Et eget felt for «dette klarte jeg ikke å
  belegge» ga bedre artikler enn å presse fram et svar. Etikk-agenten fant ingen
  verifiserbar sikhisk formulering av den gylne regel, og skrev det i artikkelen.
- **Verifiseringsagenten skal være motstander, ikke godkjenner.** Den skal hente hver
  kilde-URL på nytt, bruke `snl.no/<oppslagsord>.json` for å lese forfatter og `changed_at`
  direkte, og rette selv. Alle de alvorlige funnene i denne serien kom derfra.

---

## 8. Religionsprofilen - dimensjonskort i `public/data/religion/`

`/krle/religion/:id` har fra 2026-08-12 én dimensjonsvisning i stedet for to («Hjulet» og
«Dimensjoner» viste samme tekst i ulik form). Hjulet er nå navigasjon med fremdrift: hver
dimensjon har egen farge, eget ikon og et spørsmål en 14-åring forstår («Hva gjør de?»,
«Hva kan du se og ta på?»). Alle sju lest gir XP via `recordActivity()`.

Filene i `public/data/religion/*.json` kan ha dimensjonene i to former, og begge virker:

```jsonc
// Gammel form - verdien ER rich-text-treet
"ritual": { "type": "root", "children": [ ... ] }

// Ny form - dimensjonskort
"ritual": {
    "summary": "Ett svar i én setning, vises som ingress.",
    "image": "/images/buddhisme/bonn-01.webp",
    "imageAlt": "...",
    "keyTerms": [{ "term": "puja", "explanation": "..." }],
    "example": { "title": "Nærbilde: ...", "text": "..." },
    "question": "Refleksjonsspørsmål eleven tar med seg videre.",
    "body": { "type": "root", "children": [ ... ] }   // samme tre som før
}
```

`normalizeDimension()` i `src/utils/religionDimensions.ts` skiller de to, og alt som leser
dimensjoner (profilen, `/krle/sammenlign`, `generate-comparison-manifest.mjs`) går gjennom
den. Legger du til felter, gjør det der.

**Status:** alle ni religioner er løftet (63 dimensjonskort). Buddhisme er referanse-
standarden. Fordypningslenkene under hver dimensjon kommer automatisk fra `dimension`-feltet
i artiklene, så de krever ikke arbeid i datafila.

**Det som mangler er bilder, ikke tekst.** 39 av 63 kort har bilde. Bahá'í og buddhisme har
fullt sett, mens seks religioner må låne fra de få bildene som finnes i
`public/images/krle/religion/`. Disse dimensjonene står helt uten bilde og bør prioriteres
når bildecronen skal kjøres:

| Religion | Dimensjoner uten bilde |
|---|---|
| Mormonisme | alle sju |
| Jehovas vitner | seks (kun `experiential` har bilde) |
| Hinduisme | ritual, social, ethical |
| Jødedom | experiential, ethical, doctrinal |
| Kristendom | social, ethical |
| Sikhisme | social, ethical |
| Islam | ethical |

Panelet håndterer manglende bilde uten hull i layouten, så dette er en forbedring og ikke
en feil. Legg bildet i `public/images/<religion>/` og sett `image` + `imageAlt` på
dimensjonen.

**Ingressen (`summary`) skal ikke gjenta brødtekstens første setning.** Det var den vanligste
feilen da kortene ble skrevet: ingressen ble en omskrivning av åpningen, og eleven leste det
samme to ganger. Ingressen skal svare på dimensjonens spørsmål med et annet grep enn
brødteksten - et konkret bilde, en følge, en motsetning.

---

## 9. Sammenligningsmatrisen på /krle/sammenlign

Fire tekstspalter side om side var ikke en sammenligning: eleven måtte gjøre hele
sammenligningen i hodet. Siden er derfor lagt om i tre lag:

1. **Rask oversikt** - en matrise med 3-4 korte faktarader per dimensjon. Celler der to
   eller flere av de *valgte* religionene har samme svar, får samme farge. Fargen betyr
   «dette svaret deler du med noen andre her», og den regnes ut fra utvalget, ikke fra
   dataene. Velger eleven bort en religion, forsvinner fargen.
2. **Kortene** - bilde, ingressen fra dimensjonskortet, nøkkelbegrep som chips, og
   «Vis hele teksten» for brødteksten. Fire ingresser kan leses side om side; fire
   brødtekster kan ikke.
3. **Test deg selv** - ny oppgave «Hvem ligner?» som bygger på matrisen: den finner rader
   der nøyaktig to av de valgte deler svar, og spør hvem som ligner på hvem. Den krever
   minst tre valgte religioner og skjuler seg ellers.

**Dataene:** `public/data/comparison/religion-matrix.json`. 22 rader, 198 celler, alle ni
religionene i hver rad. Regelen for `bucket` står i `_om`-feltet øverst i fila: sett den
**bare** der flere religioner har samme svar og det er verdt å legge merke til. En bucket
som bare én religion bruker, gir aldri farge og er derfor støy.

Dimensjonsfanene henter spørsmål, farge og ikon fra `dimensionMeta.ts`, samme kilde som
religionsprofilen. Legger du til en dimensjon ett sted, dukker den opp begge steder.

Filosofisammenligningen deler motor, men har verken matrise eller dimensjonskort. Den
faller tilbake til brødtekst uten ingress, og skal fortsatt gjøre det.
