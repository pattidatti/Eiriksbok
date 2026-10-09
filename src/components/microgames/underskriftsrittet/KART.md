# Underskriftsrittet - kart over mappa

Ferdig spill (kunst, juice, lyd, tekst). Brief: `docs/microgames/briefer/underskriftsrittet.md`.
Komponent: `../Underskriftsrittet.tsx` (skall, input, kamera og risting, lyd, lapper, fryst bilde ved tap,
epilogen, selvspill). Skjermene (meny med Klageboka, pause, slutt) i `skjermer.tsx`.

| Fil | Hva den gjør |
| --- | --- |
| `tuning.ts` | Alle tallene: hesten, kartgrense, tunet (radius, navnefart, segl ved 20, husene og merket), kommisjonen, lyktene (spredning, hjemTid), fangsten, dristig, dragonene, poeng, ranger, kamera (galoppZoom). |
| `levels.ts` | `BRETT`: de tre månedene med bygder (hver med én av tre klager: `gebyr`, `korn`, `handel`), landevei, åser, **fogdgårder** (der lyktene tennes), lykter per navn, lyktfart, fangtid, dragoner. |
| `game.ts` | Tilstanden, `newGame`, grepene `styr` og `rop` (hold for å lese høyt), `tunHer`, `leser`, `tattTekst`, og kjerneløkka `update`: `rir` -> `samler` (Klageboka-funn, navn, `nyttNavn`, segl, seier) -> `lykteneGår` -> `fangsten` (husker `fanger`) -> `måneden`. |
| `rules.ts` | Rene hjelpere: terreng, `navneFart` (vokser med `ropT`), `ser`, `pressFra`, `rang`. |
| `bots.ts` / `sim.ts` | Robotene og simuleringskontrakten. |
| `lapper.tsx` | DOM-lagene: lerretet (vignett, toning), tastelappen ved hesten (`RopLapp`) og `FangetKant` (oransje kant + «Fogdens mann så deg ved X - N av 8 segl»). |
| `scene.ts` | `settRopLapp` (flytter tastelappen hvert bilde) og visningstilstanden (ikke regler): blekkstreker på vei, når seglet ble trykket, dørblaff, fase (spill/fanget/epilog), risting, hit-stop (`stopp`), lys (natt/morgen/mars). |
| `synlig.ts` | `iBildet` (frustum-test) og `kull` (skrur mesher av utenfor bildet). Tun, skilt, fogdgårder og utgang tegnes bare når de er i bildet. |
| `land.tsx` | `Lys` (måneskinn, morgen, mars), `Bakke` (eng/lyng/åker-lerret per brett, vei med runde ledd, lyngberg med stein og furu - kulisse), `Skog` (instanser), `Fogdhus` (døra blaffer), `Utgang` (stolpe, skilt, bølge). |
| `tun.tsx` | Tunene: hus, framdriftsbuen (shader: blå navn, oransje merker, kalkhvit -> oransje når en lykt er på vei), blomsterkrans per navn, segl som faller og trykkes, Klagebok-merket, skilt med `crispCanvas` og klage-medaljong (blekner under HUD-en). |
| `figurer.tsx` | `Hest` (bein, lener seg, støv, fangstring, pil), `Lykter` (pool: lysfelt med svak fyll og skarp kant, mann/dragon, lykt-ikon over hodet, lunte, blaff, slukker når bygda er ferdig, den som tok deg pulserer og de andre dempes), `Blekk` (navn som flyr til rytteren), `EpilogLykter`. |
| `models.ts` / `kontur.ts` / `textures.ts` | Sammenslåtte figurer, sotbrun kontur og toon-materiale, canvas-teksturene (`landTekstur`, glød, segl, blomst, lunte, merke, `tegnKlage`/`klageBilde`, korn). |
| `hud.tsx` | Kartusjen (måned, bygd, kalender-ranke), frosten, klagebrevet (blekkstreker, navn, poeng som teller opp, tre klagerader som fylles med segl), kommisjonsbåndet (8 segl, stempel-animasjon). |
| `lyd.ts` | Hovslag, pennekrafs, dør og lykt, dragon, segl-dunk, hjerteslag, fanget, seier, epilog. |
| `texts.ts` | Mål, regler, tips ved tap, seier, krav, lærdom og `KLAGEBOKA` (ti fakta fra artikkelen). |

## Kjerneløkka

1. Hesten rir med fart og vekt: holdt tast = mot galopp, sluppet = skritt. Krapp sving bremser.
2. Inne i ringen rundt et tun: HOLD (mellomrom, eller fingeren på hesten) for å lese klagen høyt. Hesten
   stanser, navnene strømmer fortere jo lenger du holder (`rop.fart` + `rop.vekst` per s). Men lykter innen
   `rop.hør` går mot deg (x`rop.lokk`), og nye lykter tennes nærmere (`rop.nærmere`). Slipp = ri. Ved 20 navn: segl.
   Uten å holde gir tunet ingen navn.
3. Navn nummer `førsteLykt` og så hvert `navnPerLykt` tenner en lykt fra fogdgården nærmest (10-18 m
   unna, `spredning` rundt retningen). Lykta går til stedet der navnet ble skrevet, leter, går videre
   etter `leteTid`, slukker etter `levetid`. Får bygda segl, går mennene som leter der hjem (`hjemTid`).
4. I lyset fylles fangstringen (`fangTid`), full = tatt. Navn med en lykt nær teller dobbelt (dristig).
5. Brett 3: 12 navn på 5 s sender en dragon fra landeveien.
6. Hvert segl fyller raden for bygdas klage i klagebrevet (`g.klager`). Ingen ekstra regel: 8 av 10
   bygder gir alltid alle tre klagene.
7. Brettet går videre når alle bygdene har segl og du rir ut ved stolpen, eller når måneden er over.
   8 segl (minst 2 fra Telemark) = seier -> epilog (morgen, så mars 1787 og lyktene rundt rytteren).

## Knapper

- Vanskelighet: `lykt.lys`, `levetid`, `leteTid`, `levels.ts` (`navnPerLykt`, `lyktFart`, `fangTid`, `fogder`).
- Hvor deilig samlingen er: `rop.fart`, `rop.vekst`, `rop.maks`. Risikoen: `rop.hør`, `rop.lokk`, `rop.nærmere`.
- Ferdighetstrappen: `poeng` (særlig `telemark`), `dristig`, robotenes `vett()`-tall.
- Juice: `FANGET_S`/`EPILOG_S` i komponenten, `kamera.galoppZoom`, risting i `scene.rist`, hit-stop i
  `scene.stopp`, poengtall (`text.float`) per navn og segl, «Akkurat unna!» ved `fangst.nesten`.

## Fallgruver

- Lykter som jaget hesten (`lykt.ser` > 0) samlet seg i flokker og gjorde spillet uvinnelig - står på 0.
- Bygder nær kartkanten ble feller: hold dem minst 12 m fra `grense`. Fogdgårder kan ligge utenfor.
- Brett 1 har en skjult måned (95 s) så en passiv spiller ikke blir stående for alltid.
- Merkene på buen leser `førsteLykt`/`navnPerLykt`: endrer du regelen i `nyttNavn`, endre shaderen i `tun.tsx`.
- React-kompilatoren nekter mutasjon av materialer fra `useMemo` i `useFrame`: legg den i en modulfunksjon
  (`settBue`, `settLyktMat` o.l.).
- Komponentnavn med æ/ø/å godtas ikke av fast-refresh-regelen (derfor `Skog` og `Fogdhus`).
- `.arc-stage canvas` er absolutt plassert i skallet: klagebrevets canvas må ha `position: relative`.
- `sceneAuditIgnore` står KUN på `Bakke` og `Skog` (dekor). Spillinnholdet utenfor bildet skrus av med
  `kull` (synlig.ts), og menyen viser brettet rett ovenfra (`kamera.kartHøyde`), så innrammings-sjekken
  måler det eleven faktisk ser. Egen synlighet (seglet, bølgen) settes MELLOM de to `kull`-kallene.
- Landeveien gir fart bare utenfor tunene (`terreng`): fart inne på tunet ødela sløyfene og senket halvgod.
- Selvspillets snapshot melder `spiller` under det fryste bildet og epilogen, så slutt-skjermen blir sjekket.
