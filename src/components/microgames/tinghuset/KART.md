# Tinghuset - kart over mappa

Gråboks (fase 3a). Brief: `docs/microgames/briefer/tinghuset.md`. Komponent: `../Tinghuset.tsx`.

| Fil         | Hva den gjør                                                                                                                                                                                              |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tuning.ts` | Alle tallene: skranketider, sinne, kort, poeng, tilfangskurven (måned -> sekunder). Endre her først.                                                                                                      |
| `levels.ts` | De fire brettene (kapitler i samme kalender): måneder, sek per måned, leirer, rettssal, `saler` (salene brettet åpner), andel alvorlige, par, tykke, intervall, sinnetak. `monthName()`.                  |
| `state.ts`  | Typene (`Game`, `Folder`, `Desk`, `Verdict`, `GameEvent`) og `newGame(seed)`. Ingen regler.                                                                                                               |
| `rules.ts`  | Fagkjernen: `send()` (elevens grep), `pickCard()`, `decide()` (poeng, sinne, par), `judgePair()` (jevnt/ulikt), `runDesks/runTravel/runRoutes`, `straffNivaa()`.                                          |
| `game.ts`   | Kjerneløkka `update(g, dt)`: kalender, brettskifte (åpner salene), tilfang (`spawn`), sinne fra ventende mapper (`waitWeight`), kortvalg, tap/seier. `pressure()`, `interval()`, `waiting()`.             |
| `bots.ts`   | Robotene: seende (venter opptil 5 s på tvillingen), halvgod (treg, venter 2,5 s, bommer på skranken), alt-rett, alt-forelegg, tilfeldig. Bruker bare `send`/`pickCard`.                                   |
| `sim.ts`    | `SimSpec` for `scripts/sim-microgame.mts`, `snapshotOf()` og `BOT_INFO` (delt med `usePlaytest`).                                                                                                         |
| `draw.ts`   | Visningen med primitive former, layout (`campRect`, `deskRect`, `cardRects`), treff (`folderAt`, `deskAt`), stempelet «ULIK DOM» og «x1,5» over mapper som venter på tvillingen. Seks skranker får plass. |

## Kjerneløkka

1. En mappe dukker opp i en leir (`spawn`). Tilfanget følger `tilfang.kurve`: 1 per 3 s i juni 1945,
   1 per 1,5 s i januar 1946, 1 per 0,8 s i 1947, 1 per 0,65 s i august 1948 - til slutt mer enn
   salene rekker. Fra brett 3 i par med samme saksnummer; tvillingen kommer
   `tvillingMin`-`tvillingMaks` (5-14) s senere i en annen leir.
2. Eleven drar en strek til en skranke (`send`). Mappa reiser `reise` s og stiller seg i køen.
   En mappe som venter i leiren på tvillingen sin, gir `ventTvilling` (1,5x) sinne: vent og ta
   sinnet, eller døm nå og risiker et ulikt par.
3. Skranken tar én sak av gangen (`runDesks`). Forelegg 0,8 s, rettssak 9 s (tykk 18 s). Brettene
   åpner 1, 2 og 4 saler; kortene gir bare én sal til (ca. 20 %). Fast rute tar bare lette saker.
4. `decide`: forelegg på alvorlig = `forMildt` sinne og multiplikator x1. Alvorlig i retten =
   poeng og `rettLetter`. Når begge i et par er avgjort: jevnt hvis samme vei, ikke for mildt, og
   innen `jevnMnd` måneder. Jevnt gir 100 x multiplikator og +1 (opp til x10); ulikt gir x1 og
   lappene med stempelet «ULIK DOM».
5. Sinnet stiger med `ventPerMappe` per mappe i leir eller kø. Fullt = tap; årsaken er den største av
   `fraVent` og `fraMild`.

## Knapper som styrer mest

- Vanskelighet sent i runden: siste punkt i `tilfang.kurve`, `skranke.rettssak`, `levels.ts` `saler`.
- Hvor sint en flink spiller blir: `sinne.ventPerMappe` mot `sinne.rettLetter` (forholdet avgjør om
  sinnet står stille eller stiger), og `sinne.ventTvilling`.
- Hvor fort alt-til-forelegg taper: `sinne.forMildt`, `tilfang.alvorligAndel`.
- Ferdighetstrappen: `poeng.jevntPar`, `poeng.maksMult`, `kalender.jevnMnd`, `tilfang.tvillingMin/Maks`.

## Fallgruver

- `Folder.twin === -1` betyr at tvillingen finnes, men ikke har kommet ennå. `null` = ingen tvilling.
- Tiden i kalenderen går i 30 % fart mens kortene ligger oppe; `g.t` teller vanlig tid.
- Brett 1 og 2 har `sinneTak` under 1 og kan ikke tapes.
