# Gravity: Eiriksbok 📚
> **En digital, immersiv lærebok bygget for fremtiden.**

Gravity er ikke bare en nettside; det er et økosystem for læring. Det er designet for å gi elever en moderne og immersiv opplevelse der historie, samfunnsfag og norsk blir levende gjennom interaktive modeller, spillmekanikk og en sammenhengende narrativ struktur.

---

## 🎨 Designfilosofi: "Modern Glassmorphism"
Vi følger en streng estetikk inspirert av moderne "avant-garde" UI.
- **Lys & Immersiv**: Et lett og luftig design (`bg-slate-50`) med glassmorphism som holder fokus på innholdet.
- **Narrativ Dybde**: Hvert emne er ikke bare en liste med artikler, men en reise med en begynnelse, midte og slutt (3-akters modellen).
- **Usynlig UX**: Brukergrensesnittet skal føles intuitivt, responsivt og premium.

---

## 🛠️ Hurtigstart (Developer Quickstart)

1.  **Installer avhengigheter**:
    ```bash
    npm install
    ```
2.  **Start utviklingsserver**:
    ```bash
    npm run dev
    ```
3.  **Innholdsredigering**:
    ```bash
    # Innhold redigeres direkte som JSON under public/content/
    ```
    Gå til `http://localhost:5173/admin` for å redigere innhold visuelt.

---

## 🏗️ The "Architect" Workflow
For å sikre akademisk kvalitet og teknisk konsistens, følger vi en streng arbeidsflyt styrt av AI-agenter og arkitekter.

1.  **`/plan_topic [id]`**: Skaper en **Blueprint**. Her defineres "sjelen" til emnet, det narrative arket, og bilde-prompts som sikrer en rød tråd.
2.  **`/plan_article [path]`**: Dypdykk i én enkelt leksjon. Her defineres pedagogiske "beats", misforståelser som skal knuses, og interaktive elementer.
3.  **`LEARNING_PATH_GUIDE`**: Definerer strukturen på **Læringsstien** (styres av `[emne]-sti.json`). Vi bruker en 3-akters modell:
    - **Prolog (Steg 0)**: Onboarding og kontekst.
    - **Opptakt -> Konfrontasjon -> Resolusjon**: En spenningskurve gjennom hele emnet.
4.  **`/build_topic [id]`**: "The Builder". Leser Blueprints og genererer de fysiske JSON-filene, bildene og manifest-oppføringene.

---

## 📂 Innholdsarkitektur (Content as Data)

Alt innhold lagres som JSON i `public/content/`. Dette muliggjør deterministisk generering og enkel redigering.

- **`manifest.json`**: Skjelettet i appen. Bestemmer ruting og hierarki (Fag -> Emne -> Leksjon).
- **`global-timeline.json`**: "Single source of truth" for alle historiske hendelser. Alle artikler henter tidslinje-data herfra.
- **`concepts/*.json`**: Det automatiske begrepssystemet. Ord som er definert her blir automatisk gjenkjent og lenket i artikler (Flashcards).
- **`Rich Layout`**: Aktiveres med `"layout": "rich"` i JSON. Gir en immersiv sidebar med tidslinje, kart og nøkkelpunkter.

---

## 🕹️ Interaktivitet & Moduler
Vi bygger bro mellom tekst og forståelse gjennom spesialiserte komponenter:
- **`ScenarioRoleplay`**: Eleven tar valg som påvirker historiske utfall.
- **`PackTheBag`**: Forberedelse til ekspedisjoner eller krig.
- **`Quiz Battle`**: Flerspiller-konkurranser (Firebase-drevet).
- **`Historisk Detektiv`**: Case-basert læring der man må analysere kilder.

---

## 📢 Tilbakemelding & Feedback
Vi har et innebygd system for brukertilbakemeldinger. Data lagres i Firebase og kan hentes ut av administratorer.

### For Administratorer: Hente ut data
Siden tilbakemeldinger kan inneholde sensitiv info, er databasen **ikke** offentlig lesbar. Du trenger en `Database Secret` for å laste ned dataene.

1. **Hent Secret**: Gå til Firebase Console -> Project Settings -> Service Accounts -> Database Secrets.
2. **Kjør Script**:
   ```bash
   node scripts/fetch_feedback.cjs DIN_HEMMELIGHET_HER
   ```
3. **Resultat**: En fil `feedback_data.json` genereres med all historikk, inkludert nyttig context (URL, skjermstørrelse, user-agent).

---

## 🔌 Teknisk Stack
- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS v4 (Vanilla logic)
- **Animations**: Framer Motion
- **Data**: JSON-driven architecture
- **CMS**: Ingen - innhold er JSON i repoet
- **Backend**: Firebase (for Quiz Battle og Multiplayer)

---

## 🤖 AI Agent Protocol (Viktig for bidragsytere)
Hvis du er en AI-agent som jobber på dette prosjektet:
1.  **Følg Blueprints**: Endre aldri innholdet uten å sjekke `docs/Design documents/` først.
2.  **Struktur først**: Alltid oppdater `manifest.json` og `global-timeline.json` når du legger til innhold.
3.  **Ingen fet skrift**: Bruk begrepssystemet (`concepts`) i stedet for `**bold**` i brødtekst for å utheve viktige fagord.
4.  **Flat struktur**: Unngå nøstede seksjoner i JSON hvis ikke strengt nødvendig; bruk `header`-blokker.

---

## 📚 Videre lesning
- [The Architect's Handbook](file:///C:/Users/Eirik/Documents/Eiriksbok/Eiriksbok/docs/THE_ARCHITECTS_HANDBOOK.md) - For dyp forståelse av arbeidsflyten.
- [Hvordan dette fungerer (ELI5)](file:///C:/Users/Eirik/Documents/Eiriksbok/Eiriksbok/docs/HVORDAN_DETTE_FUNGERER.md) - En enkel introduksjon til arkitekturen (LEGO-prinsippet).
- [Learning Path Guide](file:///C:/Users/Eirik/Documents/Eiriksbok/Eiriksbok/.agent/workflows/LEARNING_PATH_GUIDE.md) - Hvordan bygge pedagogiske reiser.
- [Article Standard](file:///C:/Users/Eirik/Documents/Eiriksbok/Eiriksbok/docs/ARTICLE_STANDARD.md) - Det tekniske oppsettet for JSON-filer.

> [!TIP]
> Sjekk [docs/](file:///C:/Users/Eirik/Documents/Eiriksbok/Eiriksbok/docs/) mappen for flere dybdeguider om bildestiler, terminologi og spesifikke moduler som "Historisk Detektiv".
