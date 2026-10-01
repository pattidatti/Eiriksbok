# Tinghuset - kart over mappa

Gråboks (fase 3a). Brief: `docs/microgames/briefer/tinghuset.md`. Komponent: `../Tinghuset.tsx`.

| Fil | Hva den gjør |
|---|---|
| `tuning.ts` | Alle tallene: skranketider, sinne, kort, poeng, tilfang i siste del. Endre her først. |
| `levels.ts` | De fire brettene (kapitler i samme kalender): måneder, sek per måned, leirer, rettssal, andel alvorlige, par, tykke, intervall, sinnetak. `monthName()`. |
| `state.ts` | Typene (`Game`, `Folder`, `Desk`, `Verdict`, `GameEvent`) og `newGame(seed)`. Ingen regler. |
| `rules.ts` | Fagkjernen: `send()` (elevens grep), `pickCard()`, `decide()` (poeng, sinne, par), `judgePair()` (jevnt/ulikt), `runDesks/runTravel/runRoutes`, `straffNivaa()`. |
| `game.ts` | Kjerneløkka `update(g, dt)`: kalender, brettskifte, tilfang (`spawn`), sinne fra ventende mapper, kortvalg, tap/seier. `pressure()`, `interval()`, `waiting()`. |
| `bots.ts` | Robotene: seende, halvgod, alt-rett, alt-forelegg, tilfeldig. Bruker bare `send`/`pickCard`. |
| `sim.ts` | `SimSpec` for `scripts/sim-microgame.mts`, `snapshotOf()` og `BOT_INFO` (delt med `usePlaytest`). |
| `draw.ts` | Visningen med primitive former, layout (`campRect`, `deskRect`, `cardRects`) og treff (`folderAt`, `deskAt`). |

## Kjerneløkka

1. En mappe dukker opp i en leir (`spawn`). Fra brett 3 i par med samme saksnummer; tvillingen kommer
   `tvillingMin`-`tvillingMaks` s senere i en annen leir.
2. Eleven drar en strek til en skranke (`send`). Mappa reiser `reise` s og stiller seg i køen.
3. Skranken tar én sak av gangen (`runDesks`). Forelegg 1 s, rettssak 5 s (tykk 10 s), raskere med
   Flere dommere.
4. `decide`: forelegg på alvorlig = `forMildt` sinne og multiplikator nullstilt. Alvorlig i retten =
   poeng og `rettLetter`. Når begge i et par er avgjort: jevnt hvis samme vei, ikke for mildt, og
   innen `jevnMnd` måneder.
5. Sinnet stiger med `ventPerMappe` per mappe i leir eller kø. Fullt = tap; årsaken er den største av
   `fraVent` og `fraMild`.

## Knapper som styrer mest

- Vanskelighet sent i runden: `tilfang.senSlutt`, `skranke.maksSaler`, `skranke.maksDommere`.
- Hvor fort alt-til-retten taper: `sinne.ventPerMappe`, `skranke.rettssak`.
- Hvor fort alt-til-forelegg taper: `sinne.forMildt`, `tilfang.alvorligAndel`.
- Ferdighetstrappen: `poeng.jevntPar`, `poeng.maksMult`, `kalender.jevnMnd`.

## Fallgruver

- `Folder.twin === -1` betyr at tvillingen finnes, men ikke har kommet ennå. `null` = ingen tvilling.
- Tiden i kalenderen går i 30 % fart mens kortene ligger oppe; `g.t` teller vanlig tid.
- Brett 1 og 2 har `sinneTak` under 1 og kan ikke tapes.
