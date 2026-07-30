# Oppsett av ny maskin 🛠️

Denne guiden beskriver hva du trenger å installere og konfigurere for å jobbe på dette prosjektet når du bytter til en ny maskin.

## 1. Nødvendig programvare

Før du begynner, må du installere følgende programmer:

### 🟢 Node.js (Kritisk)
Dette prosjektet er bygget med Node.js.
1.  Gå til [nodejs.org](https://nodejs.org/).
2.  Last ned og installer **LTS**-versjonen (Long Term Support).
3.  For å sjekke at det er installert, åpne Terminal (eller PowerShell) og skriv:
    ```bash
    node -v
    npm -v
    ```

### 🐙 Git (Valgfritt men anbefalt)
Brukes for versjonskontroll.
1.  Last ned og installer fra [git-scm.com](https://git-scm.com/).
2.  Hvis du bruker GitHub Desktop, kan du bruke det i stedet.

### 📝 Visual Studio Code (Anbefalt editor)
Den beste editoren for webutvikling.
1.  Last ned fra [code.visualstudio.com](https://code.visualstudio.com/).
2.  **Anbefalte utvidelser** (søk etter disse i Extensions-fanen i VS Code):
    - **ESLint**: For å finne feil i koden.
    - **Tailwind CSS IntelliSense**: For hjelp med styling.
    - **Prettier - Code formatter**: For automatisk formatering av kode.

## 2. Klargjøring av prosjektet
Prosjektet administreres via **Git**. Klon repoet fra GitHub før du gjør noe annet.

1.  **Åpne prosjektmappen** i VS Code.
2.  Åpne en **Terminal** i VS Code (`Terminal` -> `New Terminal` i menyen).
3.  Kjør følgende kommando for å installere alle nødvendige biblioteker:
    ```bash
    npm install
    ```
    *Dette bygger `node_modules` lokalt på din maskin. Denne mappen skal aldri synkroniseres eller sjekkes inn i Git.*

## 3. Starte utvikling

Når installasjonen er ferdig, kan du starte prosjektet.

### Starte nettsiden (Vanlig utvikling)
For å se nettsiden og gjøre endringer i koden:
```bash
npm run dev
```
Nettsiden vil da være tilgjengelig på `http://localhost:5173` (eller lignende).

### Redigere innhold
Det er ikke noe CMS i prosjektet. Alt innhold ligger som JSON i repoet:
artikler under `public/content/`, religions- og filosofidata under `public/data/`.
Rediger filene direkte, og kjør `npm run dev` for å se endringene.

## 4. Hold programvare oppdatert 🔄

For å unngå problemer over tid, er det viktig å holde verktøyene oppdatert.

### Oppdatere prosjektet (Viktig!)
Når du henter ned endringer fra andre (via `git pull`), kan det hende at `package.json` er endret. Da må du oppdatere bibliotekene dine:
```bash
npm install
```
Gjør dette hvis du får rare feilmeldinger etter å ha hentet ny kode.

### Oppdatere Node.js
Sjekk versjonen din av og til:
```bash
node -v
```
Hvis den er veldig gammel (f.eks. mer enn 1 år), last ned nyeste **LTS**-versjon fra [nodejs.org](https://nodejs.org/).

### Oppdatere VS Code utvidelser
VS Code oppdaterer seg selv, men sjekk av og til "Extensions"-fanen for å se om utvidelsene dine trenger en oppdatering (eller reload).

## ⚠️ Feilsøking

- **"Command not found"**: Hvis du får denne feilen når du skriver `npm` eller `node`, betyr det at Node.js ikke er installert riktig, eller at du må starte VS Code/Terminalen på nytt etter installasjon.
- **Rare feilmeldinger under `npm install`**: Prøv å slette `node_modules`-mappen og filen `package-lock.json`, og kjør `npm install` på nytt.
