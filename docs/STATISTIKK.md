# Bruksstatistikk

Hvordan Eiriksbok måler egen bruk, hvor tallene havner, og hva dashbordet på
`/admin/stats` gjør med dem.

---

## Kort fortalt

- **Hva måles:** sidevisninger, lesetid, unike enheter per dag, søk, fullførte
  oppgaver, quizresultater og hvilke klokkeslett siden brukes.
- **Hva måles ikke:** navn, e-post, IP, innlogging. Alt er knyttet til en
  tilfeldig id i `localStorage` på enheten - ikke til en person. Tømmer eleven
  nettleserdata, blir enheten talt som ny.
- **Hvor:** Firebase Realtime Database, under `analytics/`.
- **Hvem skriver:** `src/lib/analytics.ts`. Ingen andre filer skal skrive dit.
- **Hvem leser:** `src/pages/admin/stats/useStatsData.ts` (dashbordet) og
  `PulsStripe.tsx` (stripen øverst på `/admin`).

Målinger er alltid best effort. Feiler en skriving - ingen nett, blokkerte
regler på localhost - skal det aldri gi feil i konsollen eller merkes av eleven.
Firebase lastes lazy, så ingen måling ligger i pakken som blokkerer første
tegning.

---

## Datastrukturen i Firebase

| Sti | Form | Skrives av |
|---|---|---|
| `analytics/views/{side}` | teller | `sporVisning` |
| `analytics/reading_time/{side}/{push}` | `{duration, timestamp, path}` | `sporLesetid` |
| `analytics/daily/{YYYY-MM-DD}/views` | teller | `sporVisning` |
| `analytics/daily/{dag}/subjects/{fag}` | teller | `sporVisning` |
| `analytics/daily/{dag}/besok/{anonId}` | `1` | `sporDagensBesok` |
| `analytics/daily/{dag}/readMs` · `readSessions` | summer | `sporLesetid` |
| `analytics/daily/{dag}/activities` · `kinds/{type}` · `xp` · `fagAktivitet/{fag}` | tellere | `sporAktivitet` |
| `analytics/daily/{dag}/searches` | teller | `sporSok` |
| `analytics/clock/{ukedag 0-6}/{time 0-23}` | teller | `sporVisning` |
| `analytics/devices/{klasse}` · `browsers/{navn}` | tellere | `sporDagensBesok` |
| `analytics/activity/{type}` | teller totalt | `sporAktivitet` |
| `analytics/quiz/{side}` | `{forsok, poengSum, perfekte}` | `sporQuiz` |
| `analytics/zero_hits/{ord}` | `{query, antall, sist}` | `sporSok` |
| `analytics/searches/{push}` | `{query, type, timestamp, resultsCount}` | `sporSok` |
| `analytics/unique_users/{anonId}` | `{firstSeen, lastSeen, device}` | `usePresence` |
| `analytics/active_users/{anonId}` | `{path, lastActive}`, ryddes av `onDisconnect` | `usePresence` |
| `analytics/games/hangman/{push}` | `{outcome, timestamp, word}` | `HangmanGame` |

`{side}` er stien uten ledende skråstrek og med understrek i stedet for
skråstrek: `/historie/vikingtiden/rikssamlingen` blir
`historie_vikingtiden_rikssamlingen`. Manifestet oversetter nøkkelen tilbake til
artikkeltittelen i dashbordet (`byggSideregister` i `statsModel.ts`).

### Hvorfor dagsbøtter

`analytics/views` er bare et tall. Det sier hva totalen er, aldri om bruken
stiger eller faller. Dagsbøttene under `analytics/daily/{dag}` er hele grunnen
til at dashbordet kan tegne en trend, sammenligne to perioder og si «+77 %».

Nøkkelen er `YYYY-MM-DD`, som sorterer kronologisk. Derfor kan dashbordet hente
bare de siste 120 dagene med `orderByKey().startAt(...)` i stedet for å laste
ned hele historikken for å tegne 30 dager.

### Hvorfor `update()` med flere stier

En sidevisning rører fire tellere. Fire separate skrivinger blir fire rundturer;
ett `update()` med relative stier blir én. Prisen er at **alle stiene i samme
oppdatering må ha skrivetilgang** - feiler én på reglene, ryker hele
oppdateringen. Legger du til en ny sti i `analytics.ts`, må den også åpnes i
`database.rules.json`.

`increment` bor i `firebase/database` og kan ikke kalles synkront på kallstedet
uten å dra modulen inn i den eager pakken igjen. Derfor legger kallstedene igjen
en markør som `skriv()` bytter ut i det øyeblikket modulen er lastet.

---

## Etter endringer i reglene

Nye stier under `analytics/` krever både `.read` (for dashbordet) og `.write`
(for målingen) i `database.rules.json`. Deploy dem med:

```bash
firebase deploy --only database
```

Uten dette skrives ingenting, og dashbordet står tomt uten å si fra - Firebase
avviser i stillhet, og målingene er med vilje tause om feil.

---

## Dashbordet

`/admin/stats`. Seks faner, ett abonnement (`useStatsData`), rene funksjoner for
utregningen (`statsModel.ts`). Panelene tegner - de regner ikke på egen hånd.

| Fane | Svarer på |
|---|---|
| **Oversikt** | Går det opp eller ned? Trend, fagfordeling, mest lest, og et varmekart over ukedag × klokketime. |
| **Innhold** | Hver enkelt side: visninger, snitt lesetid, samlet tid, quiz-snitt. Sorterbar, filtrerbar, med CSV-eksport. |
| **Fag** | Fag mot fag, og **dekningsgrad**: hvor stor andel av artiklene i faget som er åpnet minst én gang. «Aldri åpnet» lister artiklene ingen har vært innom. |
| **Publikum** | Unike enheter, andel som kommer tilbake, enhets- og nettleserfordeling, og hvem som er inne akkurat nå. |
| **Søk** | Hva det søkes etter - og **søk uten treff**, som er den mest direkte listen over innhold som mangler. |
| **Aktivitet** | Hva som faktisk fullføres, og quizresultater sortert med det vanskeligste først. |

Tidsvelgeren (7/30/60 dager) styrer alt som måles per dag. Totaler - som «mest
lest» - er hele historikken, og kortene sier det selv.

### Fargene

Diagramfargene ligger i `src/pages/admin/stats/chartTokens.ts` og er validert
for fargeblindhet: parene klarer både CVD- og normalsyn-terskelen mot hverandre,
og alle har minst 3:1 kontrast mot den lyse flaten. Fagfargene ligger ett hakk
mørkere enn appens egne i `src/utils/subjectColors.ts` nettopp for å klare det
kravet - samme fargefamilie, men lesbar som tynn strek. Hver stolpe er merket
med navnet sitt; fargen bekrefter en etikett som allerede står der, den bærer
aldri identiteten alene.

---

## Legge til en ny måling

1. Skriv en `spor…`-funksjon i `src/lib/analytics.ts`.
2. Åpne stien i `database.rules.json` og deploy reglene.
3. Abonner på noden i `useStatsData.ts` og utvid `RaaStats`.
4. Regn ut tallet som en ren funksjon i `statsModel.ts`.
5. Tegn det i et panel under `src/pages/admin/stats/panels/`.
6. Oppdater tabellen over.

Gir en ny modul eleven en fullføring, kaller den `recordActivity()` som før -
`useProgressStore` sender det videre til `sporAktivitet` selv. Da havner den i
statistikken uten at modulen trenger å vite at statistikken finnes.
