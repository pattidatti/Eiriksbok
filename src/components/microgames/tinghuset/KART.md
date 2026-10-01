# Tinghuset - kart over mappa

Ferdig bygg (fase 3b). Brief: `docs/microgames/briefer/tinghuset.md`. Komponent: `../Tinghuset.tsx`.

| Fil           | Hva den gjør                                                                                                                                       |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tuning.ts`   | Alle tallene: straffenivå-trinn, dommene (`dom`), skranketider, sinne, poeng, tilfangskurven. Endre her først.                                     |
| `levels.ts`   | De fire brettene (kapitler i samme kalender): leirer, rettssaler, faste ruter, protokollteksten. `monthName()`.                                     |
| `state.ts`    | Typene (`Game`, `Folder`, `Desk`, `Verdict`, `GameEvent`) og `newGame(seed)`. Ingen regler.                                                        |
| `rules.ts`    | Fagkjernen: `send()`, `decide()`, `judgePair()` (lik trykt dom = jevnt), `straffTrinn/straffNivaa/domTekst`, skrankene og rutene.    |
| `game.ts`     | Kjerneløkka `update(g, dt)`: kalender, trinn-hendelsen, brettskifte, tilfang, sinne, tap/seier. `secsToStep`, `twinEta`, `skipTo`.       |
| `bots.ts`     | Robotene: seende (forelegg straks på grå, venter på tvillingen, velger salen som dømmer nærmest i tid, holder par tilbake før et trinn), halvgod.  |
| `sim.ts`      | `SimSpec` for `scripts/sim-microgame.mts`, `snapshotOf()` og `BOT_INFO` (delt med `usePlaytest`).                                                  |
| `layout.ts`   | Hvor alt står på arket (960×540) og treff for pekeren: `campRect`, `deskRect` (etter slag: tre stempler, så dommerplassene i `COURT`-hylla; kall `syncDesks(g)` først), `queueSpot`, `homeOf`, `folderAt`, `deskAt`. |
| `scene.ts`    | Silhuetter i papirklipp (`person`): folkemengden (`drawCrowd`), lovsiden i tom protokoll (`drawLaw`), plassene for nye leirer (`drawCampSlots`), rettssal-hylla (`drawCourtShelf`), tvillingklemmene (`drawClip`, `clipColor`). |
| `art.ts`      | Palett og teksturer tegnet én gang: papir med fiber og vignett, rødblyant-skravering, mappesprites, treskaft. `pencil()`, `typed()`, `pickTier()`. |
| `fx.ts`       | Juicen: mapper som glir, strek, stempeldunk, lapper som flyr, kalenderblad, ULIK DOM-lappene, protokoll-loggen midt på arket, skjermrist.          |
| `draw.ts`     | Tegningen av arket: leirer (med leirplan og ventetid), skranker (forelegg, avvis, protokollbok med dagens dom), mapper, streker. `moveFolders()`. |
| `hud.ts`      | HUD-en: kalender, mål, linjal, LOVEN (ren lovtekst - ingen fasit, ingen straffetabell), avisa, måler, poeng, telleverk, mellomside.                 |
| `sfx.ts`      | Lydene (arkadeskallets synth): skrape, glid, dunk, klokke, jevnt/ulikt, murring.                                                                   |
| `texts.ts`    | All tekst: tap og tips, lærings-øyeblikk (`BEATS`), lapper (`PINS`), «Dette skjedde», protokollbladene (`FINDS`), rangene, `personOf` (yrke og handling på mappa). |
| `screens.tsx` | Slutt-skjermen (to kolonner) og saksmappa.                                                                                                         |

## Sakstypene

- `lett` (grå): NS-medlem - forelegg. `alvorlig` (rødt hjørne): angiver/statspoliti - retten.
  `tykk`: profittør - bare retten (`accepts`), 18 s. `grov` (flagg på alvorlig, én gang fra måned 6): dødsdom så
  lenge straffenivået er minst 80 %, ellers livsvarig.
- `utenlov` (lyst ark, stiplet blått): «tyskerjente», kvinne med tysk kjæreste. Bare to veier
  (`accepts` i rules.ts): AVVIS (riktig, `sinne.avvist` opp, `poeng.avvist`) eller INTERNER
  (straff uten dom: `sinne.ulovligLetter` kraftig ned, x1, `g.ulovlig++`). INTERNER-stempelet
  kommer i brett 2 (`openInterner`, hendelse `interner`) og tar bare slike saker. Aldri i par.
- `sluttRegning`: ved seier/tap trekkes `poeng.trekkUlovlig` per internert (`g.trekk`, vises på
  slutt-skjermen).
- Runden starter med en bunke på `tilfang.bunke` grå mapper i Ilebu. Brett 1 følger
  `tilfang.brett1` (tyskerjente etter 2 s, første angiver etter 9 s); rettssalen glir inn med den
  første angiveren (`openCourt`, hendelse `sal`).

## Folkemengden (motspilleren)

- `krav(g)`: gata krever straff hvert sekund (`sinne.krav` i 1945 ned til `kravSlutt` i 1948).
- Ned: dom i retten for alvorlig/tykk (`rettLetter` x straffenivå^`rettNivaaEksp`: milde dommer
  roer mindre, så sinnet ikke faller til 0 i 1946-48), og det lettvinte (interner).
- Spor: `sinneSpor(robot, runder)` i sim.ts gir sinnet ved faste sekunder per runde.
- Opp: avvise tyskerjente, forelegg til angiver (`forMildt`), mapper som venter.
- Visning: silhuetter i vinduet nederst (`drawCrowd` i scene.ts), avisa nederst til venstre (`drawAvis`,
  `headline()` i fx.ts), fengselsrutene i leirene (`fx.cells`, `drawCells`).

## Kjerneløkka

1. En mappe dukker opp i en leir (`spawn`). Fra brett 3 i par med samme saksnummer; tvillingen kommer
   5-14 s senere i en annen leir (blyantringen på mappa teller ned).
2. Eleven drar en strek til en skranke (`send`). Mappa glir `reise` s og stiller seg i køen.
3. Skranken tar én sak av gangen (`runDesks`). Forelegg 0,8 s, rettssak 9 s (tykk 18 s).
4. `decide`: dommen trykkes etter trinnet NÅ (`domTekst`). Forelegg har fast takst. Forelegg på
   alvorlig = `forMildt` sinne og x1. Paret er jevnt når den trykte dommen er lik: i retten
   100 x mult og +1 (tak x10), med forelegg 40 x mult (holder mult). Ulikt halverer mult.
5. Straffenivået faller 5 prosentpoeng hver 3. måned fra måned 4 (bunn 45 %). Mappa viser dommen
   den får nå og blinker «om N s» når et trinn er nær (`varselSek`).
6. Sinnet stiger med `krav(g)` og `ventPerMappe` per mappe i leir eller kø. Fullt = tap; årsaken er den største
   av `fraVent` og `fraMild`.

## Knapper som styrer mest

- Vanskelighet sent i runden: siste punkt i `tilfang.kurve`, `skranke.rettssak`, `levels.ts` `saler`.
- Ferdighetstrappen: `kalender.trinn.hverMnd` (hvor ofte par kan bli ulike), `poeng.jevntPar`/
  `jevntForelegg`, `tilfang.tvillingMin/Maks`.
- Hvor sint en flink spiller blir: `sinne.ventPerMappe` mot `sinne.rettLetter`.

## Fallgruver

- `Folder.twin === -1`: tvillingen finnes, men har ikke kommet ennå. `null` = ingen tvilling.
- Ingen kortvalg: brettene åpner rettssalene (`saler`) og de faste rutene for grå saker (`ruter`).
- Brett 1 og 2 har `sinneTak` under 1 og kan ikke tapes.
- Hendelsene (`g.events`) tømmes av komponenten etter `fxEvent`/lyd/tekst; i simuleringen av `step`.
- Teksturene i `art.ts` lages på nytt når skaleringen endres mer enn 20 % (fullskjerm av/på).
