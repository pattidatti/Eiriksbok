# KRLE — opprustningsplan og statusoversikt

> **Sist målt:** 2026-08-10 · **N = 116 artikler**
> Dette dokumentet er arbeidslista for å løfte KRLE-innholdet opp på plan_article-standard.
> Kryss av i `✔`-kolonnen når en artikkel er ferdigstilt, og oppdater sammendraget nederst.

---

## 1. Hvorfor

KRLE er bokas svakeste fag målt i innhold. Halvparten av artiklene er maskin-genererte stubber på 60–90 ord uten interaktivitet, bilder eller kilder. Verdensreligionene — fagets kjerne — er dårligst stilt: bahá'í, Jehovas vitner og mormonisme har til sammen 24 artikler med **null** komponenter og **null** hero-bilder.

Dette er samtidig en forutsetning for det nye emnet «Sammenligne religion» (`docs/Design documents/sammenligne-religion-blueprint.md`). En sammenligning som lenker til 60-ords stubber er verdiløs. Derfor følger prioriteringen i §5 sammenligningsemnets faser: vi ruster opp det sammenligningen trenger, når den trenger det.

---

## 2. Hva «ferdig» betyr

Destillert fra `.agent/workflows/plan_article.md`. En artikkel er ferdig når alle punktene er oppfylt:

- [ ] **900–1200 ord** brødtekst, skrevet **fra hentede kilder** — ikke fra hukommelsen
- [ ] **Én ny signaturkomponent**, unik for artikkelen, plassert tidlig. «Standard: lag ny komponent. I tvil — lag ny.»
- [ ] **Ett 3D-mikrospill** i tillegg til signaturkomponenten, sug-rubrikk over 7/10
- [ ] `heroImage` + **3 inline bilder**: etter åpningen, ved vendepunktet, før avslutningen
- [ ] Fast hale: **`Oppgaver` → `Quiz` → `Kildeliste`** som de tre siste blokkene
- [ ] `Oppgaver` med Bloom-trapp: `forstaa` 3–4, `reflekter` 3–4, `gaaVidere` 2–3
- [ ] `Quiz` med 3–5 spørsmål
- [ ] `Kildeliste` med minst 3 kilder i APA, husets stil, med hentedato og `(u.å.)` der årstall mangler
- [ ] 2–4 innlenker til andre artikler, inne i brødteksten
- [ ] `layout: "rich"`, flat `content`-array, ingen `**fet**`, ingen markdown-lister i `text`
- [ ] KRLE-metadata bevart: `religion`, `dimension`, `comparison_tags` — de driver `/krle/sammenlign/tema/:tag`
- [ ] Objektiv, respektfull tone: «Muslimer tror …», aldri normativ. Indre mangfold nevnt minst ett sted.
- [ ] `npx tsc -b` og `npm run lint` rene

**Referansemal:** `public/content/krle/religion/sikhisme/overgangsriter.json` — 40 blokker, 1304 ord, komplett hale, egen signaturkomponent (`SikhNavneseremoni`) og mikrospill (`anand-karaj-3d`). Det er denne artikkelen nye oppgraderinger skal måles mot, **ikke** `kristendom/intro`, som er eldre og mangler halen.

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

Kvest-filene under `filosofi/quests/` (22 stk) er ekskludert — de har et annet skjema.

---

## 4. Sammendrag

| Status | Antall | Andel |
|---|---:|---:|
| `STUB` | 57 | 49,1 % |
| `HALV` | 32 | 27,6 % |
| `FERDIG` | 27 | 23,3 % |
| **Sum** | **116** | |

| Mangel | Antall | Andel |
|---|---:|---:|
| Uten `Kildeliste` | 110 | 94,8 % |
| Uten `Oppgaver` | 109 | 94,0 % |
| Uten mikrospill | 96 | 82,8 % |
| Uten signaturkomponent | 85 | 73,3 % |
| Uten `heroImage` | 61 | 52,6 % |
| Ødelagt blokk-skjema | 8 | 6,9 % |

---

## 5. Prioritert rekkefølge

Én artikkel per kjøring, slik både `oppgrader-religion-artikkel` og `oppgrader_km` foreskriver.

| Runde | Innhold | Antall | Kobling til sammenligningsemnet |
|---|---|---:|---|
| **R0** | Bugene B1–B4 i §7. Rene skjema- og manifest-fikser, ingen nytt innhold. | 9 filer | Blokkerer alt annet |
| **R1** | `skapelse` for de religionene som mangler den | 8 nye | Tema 1 «Hvor kommer alt fra?» |
| **R2** | `gudsbilde` × 8 | 8 | Tema 2 «Én, mange eller ingen gud?» |
| **R3** | `bonn` × 8 + ny sikhisme-artikkel | 9 | Tema 3 «Å snakke med det hellige» |
| **R4** | `overgangsriter` × 8 (sikhisme er ferdig) | 8 | Tema 4 «Fra vugge til grav» |
| **R5** | `frelse` × 8, `grunnleggere` × 9, `hellige-tekster` × 9, `sentrale-trekk` × 7 | 33 | Tema 5–8 |
| **R6** | De 8 kristendom-artiklene i 325–396-båndet | 8 | Kortest vei til ferdig — har allerede quiz og tekst |
| **R7** | Filosofi: 17 artikler uten quiz, `Oppgaver` og `Kildeliste` | 17 | Utenfor sammenligningsemnet |

**Merk om omfanget.** Full plan_article-standard for alle 89 artiklene som ikke er ferdige betyr i praksis ~89 nye signaturkomponenter og ~89 nye 3D-mikrospill. Boka har 179 mikrospill i dag, så dette ville nesten doble tallet. `plan_article` åpner selv for at mikrospillet kan hoppes over ved ikke-romlige temaer, med begrunnelse i planen. Vurder det valget etter de første 8–10 artiklene.

---

## 6. Statustabeller

Sortert med de svakeste øverst innenfor hver gruppe.

### Bahá'í

n = 8 · snitt 61 ord · 8 stub / 0 halv / 0 ferdig

| ✔ | Status | Fil | Ord | Sig | Mikro | Oppg | Kilde | Quiz | Hero |
|:--|:--|:--|--:|:-:|:-:|:-:|:-:|--:|:-:|
| ☐ | `STUB` | `religion/bahai/intro.json` | 0 | — | — | — | — | 0 | — |
| ☐ | `STUB` | `religion/bahai/grunnleggere/artikkel.json` | 61 | — | — | — | — | 3 | — |
| ☐ | `STUB` | `religion/bahai/hellige-tekster/artikkel.json` | 61 | — | — | — | — | 3 | — |
| ☐ | `STUB` | `religion/bahai/gudsbilde/artikkel.json` | 66 | — | — | — | — | 3 | — |
| ☐ | `STUB` | `religion/bahai/frelse/artikkel.json` | 69 | — | — | — | — | 3 | — |
| ☐ | `STUB` | `religion/bahai/sentrale-trekk/artikkel.json` | 74 | — | — | — | — | 3 | — |
| ☐ | `STUB` | `religion/bahai/overgangsriter/artikkel.json` | 76 | — | — | — | — | 3 | — |
| ☐ | `STUB` | `religion/bahai/bonn/artikkel.json` | 79 | — | — | — | — | 3 | — |

### Jehovas vitner

n = 8 · snitt 60 ord · 8 stub / 0 halv / 0 ferdig

| ✔ | Status | Fil | Ord | Sig | Mikro | Oppg | Kilde | Quiz | Hero |
|:--|:--|:--|--:|:-:|:-:|:-:|:-:|--:|:-:|
| ☐ | `STUB` | `religion/jehovas-vitner/intro.json` | 0 | — | — | — | — | 0 | — |
| ☐ | `STUB` | `religion/jehovas-vitner/grunnleggere/artikkel.json` | 59 | — | — | — | — | 3 | — |
| ☐ | `STUB` | `religion/jehovas-vitner/gudsbilde/artikkel.json` | 61 | — | — | — | — | 3 | — |
| ☐ | `STUB` | `religion/jehovas-vitner/hellige-tekster/artikkel.json` | 63 | — | — | — | — | 3 | — |
| ☐ | `STUB` | `religion/jehovas-vitner/frelse/artikkel.json` | 68 | — | — | — | — | 3 | — |
| ☐ | `STUB` | `religion/jehovas-vitner/bonn/artikkel.json` | 69 | — | — | — | — | 3 | — |
| ☐ | `STUB` | `religion/jehovas-vitner/overgangsriter/artikkel.json` | 72 | — | — | — | — | 3 | — |
| ☐ | `STUB` | `religion/jehovas-vitner/sentrale-trekk/artikkel.json` | 88 | — | — | — | — | 3 | — |

### Mormonisme

n = 8 · snitt 66 ord · 8 stub / 0 halv / 0 ferdig

| ✔ | Status | Fil | Ord | Sig | Mikro | Oppg | Kilde | Quiz | Hero |
|:--|:--|:--|--:|:-:|:-:|:-:|:-:|--:|:-:|
| ☐ | `STUB` | `religion/mormonisme/intro.json` | 0 | — | — | — | — | 0 | — |
| ☐ | `STUB` | `religion/mormonisme/bonn/artikkel.json` | 60 | — | — | — | — | 3 | — |
| ☐ | `STUB` | `religion/mormonisme/sentrale-trekk/artikkel.json` | 72 | — | — | — | — | 3 | — |
| ☐ | `STUB` | `religion/mormonisme/frelse/artikkel.json` | 73 | — | — | — | — | 3 | — |
| ☐ | `STUB` | `religion/mormonisme/hellige-tekster/artikkel.json` | 75 | — | — | — | — | 3 | — |
| ☐ | `STUB` | `religion/mormonisme/gudsbilde/artikkel.json` | 76 | — | — | — | — | 3 | — |
| ☐ | `STUB` | `religion/mormonisme/overgangsriter/artikkel.json` | 83 | — | — | — | — | 3 | — |
| ☐ | `STUB` | `religion/mormonisme/grunnleggere/artikkel.json` | 90 | — | — | — | — | 3 | — |

### Jødedom

n = 8 · snitt 150 ord · 7 stub / 1 halv / 0 ferdig

| ✔ | Status | Fil | Ord | Sig | Mikro | Oppg | Kilde | Quiz | Hero |
|:--|:--|:--|--:|:-:|:-:|:-:|:-:|--:|:-:|
| ☐ | `STUB` | `religion/jodedom/intro.json` | 0 | — | — | — | — | 0 | — |
| ☐ | `STUB` | `religion/jodedom/bonn/artikkel.json` | 54 | — | — | — | — | 3 | — |
| ☐ | `STUB` | `religion/jodedom/gudsbilde/artikkel.json` | 62 | — | — | — | — | 3 | — |
| ☐ | `STUB` | `religion/jodedom/hellige-tekster/artikkel.json` | 79 | — | — | — | — | 3 | — |
| ☐ | `STUB` | `religion/jodedom/grunnleggere/artikkel.json` | 80 | — | — | — | — | 3 | — |
| ☐ | `STUB` | `religion/jodedom/overgangsriter/artikkel.json` | 82 | — | — | — | — | 3 | — |
| ☐ | `STUB` | `religion/jodedom/frelse/artikkel.json` | 85 | — | — | — | — | 3 | — |
| ☐ | `HALV` | `religion/jodedom/sentrale-trekk/artikkel.json` | 761 | ✅ | ✅ | — | — | 5 | ✅ |

### Hinduisme

n = 8 · snitt 176 ord · 7 stub / 0 halv / 1 ferdig

| ✔ | Status | Fil | Ord | Sig | Mikro | Oppg | Kilde | Quiz | Hero |
|:--|:--|:--|--:|:-:|:-:|:-:|:-:|--:|:-:|
| ☐ | `STUB` | `religion/hinduisme/intro.json` | 0 | — | — | — | — | 0 | — |
| ☐ | `STUB` | `religion/hinduisme/hellige-tekster/artikkel.json` | 60 | — | — | — | — | 3 | — |
| ☐ | `STUB` | `religion/hinduisme/gudsbilde/artikkel.json` | 63 | — | — | — | — | 3 | — |
| ☐ | `STUB` | `religion/hinduisme/frelse/artikkel.json` | 65 | — | — | — | — | 3 | — |
| ☐ | `STUB` | `religion/hinduisme/bonn/artikkel.json` | 72 | — | — | — | — | 3 | — |
| ☐ | `STUB` | `religion/hinduisme/grunnleggere/artikkel.json` | 72 | — | — | — | — | 3 | — |
| ☐ | `STUB` | `religion/hinduisme/overgangsriter/artikkel.json` | 110 | — | — | — | — | 3 | — |
| ☐ | `FERDIG` | `religion/hinduisme/sentrale-trekk/artikkel.json` | 970 | ✅ | ✅ | — | — | 4 | ✅ |

### Islam

n = 9 · snitt 173 ord · 8 stub / 0 halv / 1 ferdig

| ✔ | Status | Fil | Ord | Sig | Mikro | Oppg | Kilde | Quiz | Hero |
|:--|:--|:--|--:|:-:|:-:|:-:|:-:|--:|:-:|
| ☐ | `STUB` | `religion/islam/bonn/artikkel.json` | 39 | — | — | — | — | 3 | — |
| ☐ | `STUB` | `religion/islam/skapelse/artikkel.json` | 45 | — | — | — | — | 3 | — |
| ☐ | `STUB` | `religion/islam/gudsbilde/artikkel.json` | 62 | — | — | — | — | 3 | — |
| ☐ | `STUB` | `religion/islam/grunnleggere/artikkel.json` | 71 | — | — | — | — | 3 | — |
| ☐ | `STUB` | `religion/islam/hellige-tekster/artikkel.json` | 72 | — | — | — | — | 3 | — |
| ☐ | `STUB` | `religion/islam/frelse/artikkel.json` | 75 | — | — | — | — | 3 | — |
| ☐ | `STUB` | `religion/islam/overgangsriter/artikkel.json` | 81 | — | — | — | — | 3 | — |
| ☐ | `STUB` | `religion/islam/sentrale-trekk/artikkel.json` | 100 | — | — | — | — | 3 | — |
| ☐ | `FERDIG` | `religion/islam/intro/artikkel.json` | 1016 | ✅ | ✅ | — | — | 5 | ✅ |

### Buddhisme

n = 9 · snitt 299 ord · 7 stub / 1 halv / 1 ferdig

| ✔ | Status | Fil | Ord | Sig | Mikro | Oppg | Kilde | Quiz | Hero |
|:--|:--|:--|--:|:-:|:-:|:-:|:-:|--:|:-:|
| ☐ | `STUB` | `religion/buddhisme/intro.json` | 0 | — | — | — | — | 0 | — |
| ☐ | `STUB` | `religion/buddhisme/hellige-tekster/artikkel.json` | 61 | — | — | — | — | 3 | — |
| ☐ | `STUB` | `religion/buddhisme/frelse/artikkel.json` | 62 | — | — | — | — | 3 | — |
| ☐ | `STUB` | `religion/buddhisme/bonn/artikkel.json` | 65 | — | — | — | — | 3 | — |
| ☐ | `STUB` | `religion/buddhisme/gudsbilde/artikkel.json` | 74 | — | — | — | — | 3 | — |
| ☐ | `STUB` | `religion/buddhisme/grunnleggere/artikkel.json` | 83 | — | — | — | — | 3 | — |
| ☐ | `STUB` | `religion/buddhisme/overgangsriter/artikkel.json` | 94 | — | — | — | — | 3 | — |
| ☐ | `HALV` | `religion/buddhisme/sentrale-trekk/artikkel.json` | 746 | ✅ | ✅ | — | — | 5 | ✅ |
| ☐ | `FERDIG` | `religion/buddhisme/den-attedelte-vei/artikkel.json` | 1506 | ✅ | ✅ | — | — | 5 | ✅ |

### Sikhisme

n = 5 · snitt 373 ord · 4 stub / 0 halv / 1 ferdig

| ✔ | Status | Fil | Ord | Sig | Mikro | Oppg | Kilde | Quiz | Hero |
|:--|:--|:--|--:|:-:|:-:|:-:|:-:|--:|:-:|
| ☐ | `STUB` | `religion/sikhisme/grunnleggere/artikkel.json` | 124 | — | — | — | — | 3 | ✅ |
| ☐ | `STUB` | `religion/sikhisme/introduksjon/artikkel.json` | 133 | — | — | — | — | 3 | ✅ |
| ☐ | `STUB` | `religion/sikhisme/hellige-tekster/artikkel.json` | 134 | — | — | — | — | 3 | ✅ |
| ☐ | `STUB` | `religion/sikhisme/sentrale-trekk/artikkel.json` | 170 | — | — | — | — | 3 | ✅ |
| ☐ | `FERDIG` | `religion/sikhisme/overgangsriter.json` | 1304 | ✅ | ✅ | ✅ | ✅ | 5 | ✅ |

### Kristendom

n = 14 · snitt 556 ord · 0 stub / 11 halv / 3 ferdig

| ✔ | Status | Fil | Ord | Sig | Mikro | Oppg | Kilde | Quiz | Hero |
|:--|:--|:--|--:|:-:|:-:|:-:|:-:|--:|:-:|
| ☐ | `HALV` | `religion/kristendom/hellige-tekster/artikkel.json` | 325 | — | — | — | — | 5 | — |
| ☐ | `HALV` | `religion/kristendom/bonn/artikkel.json` | 347 | — | — | — | — | 5 | — |
| ☐ | `HALV` | `religion/kristendom/skapelse/artikkel.json` | 347 | — | — | — | — | 5 | — |
| ☐ | `HALV` | `religion/kristendom/sentrale-trekk/artikkel.json` | 358 | — | — | — | — | 5 | — |
| ☐ | `HALV` | `religion/kristendom/grunnleggere/artikkel.json` | 368 | — | — | — | — | 5 | — |
| ☐ | `HALV` | `religion/kristendom/gudsbilde/artikkel.json` | 369 | — | — | — | — | 5 | — |
| ☐ | `HALV` | `religion/kristendom/frelse/artikkel.json` | 379 | — | — | — | — | 5 | — |
| ☐ | `HALV` | `religion/kristendom/overgangsriter/artikkel.json` | 396 | — | — | — | — | 5 | — |
| ☐ | `HALV` | `religion/kristendom/baptistene.json` | 571 | ✅ | — | — | — | 5 | ✅ |
| ☐ | `HALV` | `religion/kristendom/pinse.json` | 728 | ✅ | — | — | — | 5 | ✅ |
| ☐ | `HALV` | `religion/kristendom/sakramentene.json` | 820 | — | — | — | — | 5 | ✅ |
| ☐ | `FERDIG` | `religion/kristendom/kirkesamfunn.json` | 831 | ✅ | — | — | — | 5 | ✅ |
| ☐ | `FERDIG` | `religion/kristendom/intro/artikkel.json` | 850 | ✅ | ✅ | — | — | 5 | ✅ |
| ☐ | `FERDIG` | `religion/kristendom/paulus-og-misjonen.json` | 1099 | ✅ | — | — | — | 5 | ✅ |

### Samisk religion

n = 2 · snitt 1029 ord · 0 stub / 0 halv / 2 ferdig

| ✔ | Status | Fil | Ord | Sig | Mikro | Oppg | Kilde | Quiz | Hero |
|:--|:--|:--|--:|:-:|:-:|:-:|:-:|--:|:-:|
| ☐ | `FERDIG` | `religion/samisk/intro.json` | 818 | ✅ | — | — | — | 5 | ✅ |
| ☐ | `FERDIG` | `religion/samisk/laestadianismen.json` | 1240 | ✅ | ✅ | ✅ | ✅ | 5 | ✅ |

### Historiske religioner

n = 3 · snitt 1519 ord · 0 stub / 0 halv / 3 ferdig

| ✔ | Status | Fil | Ord | Sig | Mikro | Oppg | Kilde | Quiz | Hero |
|:--|:--|:--|--:|:-:|:-:|:-:|:-:|--:|:-:|
| ☐ | `FERDIG` | `religion/historiske-religioner/egyptisk-religion.json` | 1354 | ✅ | ✅ | ✅ | ✅ | 5 | ✅ |
| ☐ | `FERDIG` | `religion/historiske-religioner/mesopotamisk-religion.json` | 1446 | ✅ | ✅ | ✅ | ✅ | 5 | ✅ |
| ☐ | `FERDIG` | `religion/historiske-religioner/monoteismens-fodsel.json` | 1758 | ✅ | ✅ | — | — | 3 | ✅ |

### Religion og kultur

n = 4 · snitt 812 ord · 0 stub / 0 halv / 4 ferdig

| ✔ | Status | Fil | Ord | Sig | Mikro | Oppg | Kilde | Quiz | Hero |
|:--|:--|:--|--:|:-:|:-:|:-:|:-:|--:|:-:|
| ☐ | `FERDIG` | `religion-og-kultur/symboler-og-klaer.json` | 802 | ✅ | ✅ | — | — | 5 | ✅ |
| ☐ | `FERDIG` | `religion-og-kultur/hoytider-og-kultur.json` | 805 | ✅ | ✅ | — | — | 4 | ✅ |
| ☐ | `FERDIG` | `religion-og-kultur/mat-og-religion.json` | 819 | ✅ | ✅ | — | — | 5 | ✅ |
| ☐ | `FERDIG` | `religion-og-kultur/religion-i-medier.json` | 822 | ✅ | ✅ | — | — | 5 | ✅ |

### Filosofi

n = 20 · snitt 511 ord · 0 stub / 17 halv / 3 ferdig

| ✔ | Status | Fil | Ord | Sig | Mikro | Oppg | Kilde | Quiz | Hero |
|:--|:--|:--|--:|:-:|:-:|:-:|:-:|--:|:-:|
| ☐ | `HALV` | `filosofi/locke.json` | 312 | — | — | — | — | 0 | ✅ |
| ☐ | `HALV` | `filosofi/kant.json` | 368 | — | — | — | — | 4 | ✅ |
| ☐ | `HALV` | `filosofi/rothbard.json` | 371 | — | — | — | — | 0 | ✅ |
| ☐ | `HALV` | `filosofi/kierkegaard.json` | 376 | — | — | — | — | 0 | ✅ |
| ☐ | `HALV` | `filosofi/arendt.json` | 390 | — | — | — | — | 0 | ✅ |
| ☐ | `HALV` | `filosofi/augustin.json` | 406 | — | — | — | — | 0 | ✅ |
| ☐ | `HALV` | `filosofi/mises.json` | 411 | — | — | — | — | 0 | ✅ |
| ☐ | `HALV` | `filosofi/beauvoir.json` | 421 | — | — | — | — | 0 | ✅ |
| ☐ | `HALV` | `filosofi/aquinas.json` | 445 | — | — | — | — | 0 | ✅ |
| ☐ | `HALV` | `filosofi/heidegger.json` | 446 | — | — | — | — | 0 | ✅ |
| ☐ | `HALV` | `filosofi/aristoteles.json` | 449 | — | — | — | — | 4 | ✅ |
| ☐ | `HALV` | `filosofi/descartes.json` | 452 | — | — | — | — | 0 | ✅ |
| ☐ | `HALV` | `filosofi/nietzsche.json` | 485 | — | — | — | — | 0 | ✅ |
| ☐ | `HALV` | `filosofi/platon.json` | 554 | — | — | — | — | 4 | ✅ |
| ☐ | `HALV` | `filosofi/intro.json` | 599 | — | — | — | — | 0 | ✅ |
| ☐ | `HALV` | `filosofi/sokrates.json` | 608 | — | — | — | — | 4 | ✅ |
| ☐ | `HALV` | `filosofi/hume.json` | 618 | — | — | — | — | 3 | ✅ |
| ☐ | `FERDIG` | `filosofi/marx.json` | 816 | ✅ | — | — | — | 5 | ✅ |
| ☐ | `FERDIG` | `filosofi/rousseau.json` | 820 | ✅ | ✅ | — | — | 5 | ✅ |
| ☐ | `FERDIG` | `filosofi/montesquieu.json` | 872 | ✅ | — | — | — | 5 | ✅ |

### Etikk

n = 10 · snitt 1140 ord · 0 stub / 2 halv / 8 ferdig

| ✔ | Status | Fil | Ord | Sig | Mikro | Oppg | Kilde | Quiz | Hero |
|:--|:--|:--|--:|:-:|:-:|:-:|:-:|--:|:-:|
| ☐ | `HALV` | `etikk/non-aggression.json` | 1091 | — | — | — | — | 0 | ✅ |
| ☐ | `HALV` | `etikk/naturrett.json` | 1119 | — | — | — | — | 0 | ✅ |
| ☐ | `FERDIG` | `etikk/nihilisme.json` | 902 | ✅ | ✅ | — | — | 4 | ✅ |
| ☐ | `FERDIG` | `etikk/dyreetikk.json` | 942 | ✅ | ✅ | ✅ | — | 5 | ✅ |
| ☐ | `FERDIG` | `etikk/kunstig-intelligens-og-etikk.json` | 993 | ✅ | ✅ | ✅ | ✅ | 5 | ✅ |
| ☐ | `FERDIG` | `etikk/rettferdighetsetikk.json` | 1047 | ✅ | ✅ | ✅ | ✅ | 5 | ✅ |
| ☐ | `FERDIG` | `etikk/dygdsetikk.json` | 1107 | ✅ | — | — | — | 4 | ✅ |
| ☐ | `FERDIG` | `etikk/pliktetikk.json` | 1326 | ✅ | — | — | — | 4 | ✅ |
| ☐ | `FERDIG` | `etikk/utilitarisme.json` | 1374 | ✅ | — | — | — | 4 | ✅ |
| ☐ | `FERDIG` | `etikk/intro.json` | 1504 | ✅ | — | — | — | 4 | ✅ |
---

## 7. Bugs som må fikses først (R0)

Disse er ikke innholdsmangler, men feil som gjør at sider ikke virker. De bør ryddes før noen artikkel oppgraderes.

### B1 — Seks intro-sider renderer helt tomt

**Filer:** `religion/{bahai,buddhisme,hinduisme,jehovas-vitner,jodedom,mormonisme}/intro.json`

De bruker feltene `ingress` og `body` i stedet for `content`. Ingen renderer i `src/` leser `body`, så sidene laster med tom brødtekst. Hver fil har faktisk rundt 40 ord tekst som ligger ubrukt. De mangler også `subject`, `topic`, `heroImage` og `layout`.

**Fiks:** konverter `ingress` + `body` til en flat `content`-array med `text`-blokker, og legg til de manglende metadatafeltene. Innholdet skal uansett skrives om i R1–R5, men konverteringen gjør sidene synlige med én gang.

### B2 — To islam-artikler bruker feil blokk-skjema

**Filer:** `religion/islam/bonn/artikkel.json`, `religion/islam/skapelse/artikkel.json`

De skriver `{"name": "text", ...}` og `{"name": "image", ...}` der resten av korpuset bruker `{"type": "text"}`. Dette er de eneste blokkene i hele KRLE uten `type`. De er også de eneste artiklene som henter bilder fra eksterne Unsplash-URL-er, i strid med bilderetningslinjene.

**Fiks:** bytt `name` til `type` i de fire blokkene, og erstatt Unsplash-URL-ene med lokale WebP-bilder eller fjern bildeblokkene inntil bilder finnes.

### B3 — `islam/skapelse` mangler i manifestet

Fila `public/content/krle/religion/islam/skapelse/artikkel.json` finnes på disk, men er ikke registrert under `krle → religion → islam` i `public/content/manifest.json`. Artikkelen er derfor usynlig i navigasjonen, men plukkes likevel opp av `generate-comparison-manifest.mjs` og vises på `/krle/sammenlign/tema/skapelse`.

**Fiks:** legg til lesson-oppføringen i manifestet.

### B4 — Sikhisme sin intro-lenke peker feil

Manifestet registrerer lesson-ID `intro` under sikhisme, men mappa på disk heter `introduksjon/`. Ruten `/krle/religion/sikhisme/intro` er sannsynligvis brutt.

**Fiks:** verifiser ruten, og rett navnet enten i manifestet eller på disk. Endring på disk krever at `comparison-manifest` regenereres.

---

## 8. Verktøyet

Skillet **`/oppgrader-religion-artikkel`** (`.claude/skills/oppgrader-religion-artikkel/SKILL.md`) skanner `public/content/krle/religion/`, rangerer kandidatene, lar deg velge blant de fire svakeste og kjører `plan_article` på den valgte. Valgfritt argument begrenser søket til én religion:

```
/oppgrader-religion-artikkel islam
```

Skillet dekker bare `religion/`-mappa. For `filosofi/` (R7) må `plan_article` kjøres direkte.

---

## 9. Logg

Før opp hver ferdigstilte artikkel her fra og med nå, så er historikken synlig uten å grave i git. Artikler som allerede holder standard er merket `FERDIG` i tabellene i §6 — de er ikke ført inn her, fordi git-historikken bare viser når fila sist ble rørt, ikke når den ble ferdigstilt.

| Dato | Artikkel | Signaturkomponent | Mikrospill | PR |
|---|---|---|---|---|
| | | | | |
