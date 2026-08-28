// Pengeliv - børsen: aksjekurser, kurtasje og aksjesparekontoens skyggeregnskap.
//
// Hele kursutviklingen regnes ut fra to tall: frøet i `marked.fro` og måneden.
// Ingenting her trekkes tilfeldig. Det er ikke en stilpreferanse - det er et
// krav. Framskrivningen kjører klokka 480 ganger hver gang eleven drar i en
// skyveknapp, og med `Math.random()` ville grafen gitt et nytt svar for hvert
// museklikk. Da måler eleven flaks i stedet for valg.
//
// Fordi kursene er utledet og ikke trukket, kan enhver måned regnes ut uten å
// kjøre klokka dit. Det er `kursSerie` som gjør det, og det er den som lar
// børsmodulen tegne kursgrafen bakover uten å lagre et eneste historisk tall.
//
// Alle funksjonene er rene: de endrer ikke tilstanden de får inn.
//
// ARBEIDSDELING MED FONDSMODULEN
// Fond og aksjer deler `marked.kurs` og `marked.krakkIgjen`.
//   - Krakkene eies av fond.ts. Denne fila SETTER ALDRI `marked.krakkIgjen`,
//     den bare leser krakket gjennom `krakkIgjenVed`. Da er det samme krakk
//     som treffer fondene og aksjene i samme måned, og eleven kan se at de
//     faller ulikt mye - som er hele poenget med spredning.
//   - `marked.kurs` deles. `stegBors` rører bare id-ene som finnes i
//     aksjeuniverset og kopierer resten videre urørt.
//   - Aksjesparekontoen justeres med endringen, ikke settes til en sum, av
//     nøyaktig samme grunn som i `stegFond`: to steg som begge legger til sin
//     egen endring kan leve side om side. Ett av dem som satte hele saldoen
//     ville strøket det andre.
//   - `skyggeregnskap` eies av denne fila alene, men regnes ut over ALLE
//     beholdninger, fond og aksjer, fordi det er én aksjesparekonto og ett
//     skattetall eleven skal møte.
//
// Motoren er nøytral. Den viser hva ting koster og hva som har skjedd, og
// anbefaler ingenting.
//
// Blueprint: docs/Design documents/pengeliv-blueprint.md (seksjon 6 og 12)

import type { Aksje, Beholdning, Konto, Tilstand } from '../types';
import type { StegKontekst } from './steg';
import { AKSJER, aksjeMedId } from '../data/aksjer';
import { fondskurs, krakkIgjenVed } from './fond';

const MANEDER_I_AR = 12;

// ---------------------------------------------------------------------------
// Kurtasje
// ---------------------------------------------------------------------------

/**
 * Kurtasje er gebyret megleren tar hver gang du kjøper eller selger.
 *
 * Tallene er Nordnets rimeligste prisklasse for norske aksjer, «Mini»:
 * 0,15 prosent av handelen, men aldri under 29 kr.
 * Kilde: Nordnet prisliste, https://www.nordnet.no/kundeservice/prisliste -
 * hentet 28.08.2026.
 *
 * Minstebeløpet er det viktigste tallet i hele fila for en fjortenåring med
 * 2 000 kr å handle for: 29 kr av 2 000 kr er 1,5 prosent, og det betales to
 * ganger, én gang ved kjøp og én gang ved salg. Kursen må stige tre prosent
 * bare for at du skal gå i null.
 */
export const KURTASJE_SATS = 0.0015;
export const KURTASJE_MINSTE = 29;

/** Gebyret for én handel på `belop` kroner. */
export function kurtasje(belop: number): number {
    if (!(belop > 0)) return 0;
    return Math.max(KURTASJE_MINSTE, belop * KURTASJE_SATS);
}

// ---------------------------------------------------------------------------
// Skatt på aksjeinntekt
// ---------------------------------------------------------------------------

/**
 * Skatt på gevinst fra aksjer regnes i to trekk i Norge: gevinsten ganges
 * først opp med en oppjusteringsfaktor, og så skattes den som alminnelig
 * inntekt. 22 prosent av 1,72 ganger gevinsten blir 37,84 prosent av
 * gevinsten, og det er den satsen folk kaller «utbytteskatt».
 *
 * Kilder, begge hentet 28.08.2026:
 * - Oppjusteringssatsen 1,72 for 2026: Skatteetaten, «Forskuddsutskrivingen
 *   2026», https://www.skatteetaten.no/rettskilder/type/uttalelser/uttalelser/forskuddsutskrivingen-2026/
 * - Satsen på alminnelig inntekt, 22 prosent: satsfila
 *   public/data/okonomi/satser-2026.json, som igjen bygger på
 *   regjeringen.no sine skattesatser for 2026.
 *
 * Satsen står som en konstant her og ikke i satsfila fordi `kjopAksje` og
 * `selgAksje` har låste signaturer og ikke får `Satser` inn. Endres satsen,
 * endres begge tallene her og i satsfila samtidig.
 */
export const SKATTESATS_ALMINNELIG = 0.22;
export const OPPJUSTERING_AKSJEINNTEKT = 1.72;

/** 0,22 ganger 1,72 = 0,3784. Det du betaler av gevinsten uten ASK. */
export const SKATTESATS_AKSJEINNTEKT = SKATTESATS_ALMINNELIG * OPPJUSTERING_AKSJEINNTEKT;

// ---------------------------------------------------------------------------
// Den frøbaserte generatoren
// ---------------------------------------------------------------------------

/**
 * Hvor mye av svingningen som er felles for hele børsen.
 *
 * Aksjer på Oslo Børs beveger seg mye i takt: samme rentebeslutning, samme
 * krig, samme krise. Resten er selskapets egen historie - et lakseanlegg med
 * sykdom, en forsvarskontrakt som lander. Delingen er det som gjør spredning
 * verdt noe uten å gjøre den til en gratis lunsj: kjøper du ni selskaper i
 * stedet for ett, forsvinner den egne risikoen, men den felles blir igjen.
 */
const FELLES_ANDEL = 0.55;
const EGEN_ANDEL = Math.sqrt(1 - FELLES_ANDEL * FELLES_ANDEL);

/** Eget frø for den felles markedsbevegelsen, så den ikke følger ett selskap. */
const FELLES_SALT = 0x2545f491;

/**
 * Hvor hardt krakket drar hver måned, målt i selskapets egen svingning.
 *
 * Samme tall som fondene bruker, med vilje: det er det samme krakket, og da
 * skal det slå inn med samme kraft. At fallet er proporsjonalt med svingningen
 * er selve spredningspoenget. Orkla, som selger mat, mister rundt en firedel
 * på et halvt år. Norwegian, som selger flyreiser, mister over halvparten.
 */
const KRAKK_KRAFT = 0.33;

/**
 * Frøet krakkandelen måles med. Et hvilket som helst tall duger - vi spør bare
 * generatoren hvor ofte den lager krakk, ikke når.
 */
const KRAKK_PROVEFRO = 4711;

/** Hvor mange måneder som måles. Nok til at anslaget er stabilt på to siffer. */
const KRAKK_PROVER = 24000;

let krakkandelLager: number | null = null;

/**
 * Hvor stor andel av alle måneder som ligger inne i et krakk.
 *
 * Tallet måles på fondsmodulens egen krakkgenerator i stedet for å skrives av
 * fra den. Krakksjansen står som en privat konstant i fond.ts, og en kopi her
 * ville stått og løyet den dagen noen endret originalen.
 *
 * Måles én gang, første gang et selskap regnes ut, og koster rundt ett
 * millisekund. Etter det ligger svaret i lageret.
 */
function krakkandel(): number {
    if (krakkandelLager !== null) return krakkandelLager;
    let treff = 0;
    for (let m = 1; m <= KRAKK_PROVER; m++) {
        if (krakkIgjenVed(KRAKK_PROVEFRO, m) > 0) treff++;
    }
    krakkandelLager = treff / KRAKK_PROVER;
    return krakkandelLager;
}

const papirfroLager = new Map<string, number>();

/** Gjør en aksje-id om til et tall, slik at den kan blandes inn i hashen. */
function papirfro(papirId: string): number {
    const lagret = papirfroLager.get(papirId);
    if (lagret !== undefined) return lagret;
    let h = 2166136261;
    for (let i = 0; i < papirId.length; i++) {
        h ^= papirId.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    const fro = h >>> 0;
    papirfroLager.set(papirId, fro);
    return fro;
}

/**
 * Et tall mellom 0 og 1, utledet av frøet, papiret, måneden og et rundenummer.
 * Samme fire tall gir alltid nøyaktig samme svar - det er hele poenget.
 */
function tilfeldig(fro: number, papir: number, maaned: number, runde: number): number {
    let h = (fro ^ papir) >>> 0;
    h = Math.imul(h ^ (maaned + 0x9e3779b9), 0x85ebca6b);
    h ^= h >>> 13;
    h = Math.imul(h ^ (runde * 0x27d4eb2d), 0xc2b2ae35);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
}

/**
 * Et støytall med snitt 0 og spredning omtrent 1.
 *
 * Tre trekk legges sammen. Ett alene ville gitt like stor sjanse for et
 * bittelite og et enormt hopp, mens tre lagt sammen samler seg om midten slik
 * ekte kurser gjør.
 */
function stoy(fro: number, papir: number, maaned: number): number {
    const sum =
        tilfeldig(fro, papir, maaned, 1) +
        tilfeldig(fro, papir, maaned, 2) +
        tilfeldig(fro, papir, maaned, 3);
    return (sum - 1.5) * 2;
}

// ---------------------------------------------------------------------------
// Kursutviklingen
// ---------------------------------------------------------------------------

interface Aksjetall {
    /** Månedlig drift, regnet om fra årlig drift. */
    drift: number;
    /** Månedlig svingning, regnet om fra årlig standardavvik. */
    sving: number;
    /** Hvor mye krakket drar selskapet ned per måned. */
    krakk: number;
    papir: number;
}

// Math.pow er dyrt og svaret er alltid det samme for det samme selskapet.
// Framskrivningen kjører 480 måneder ganger ni selskaper, og uten dette
// lageret ville den regnet ut de samme potensene fire tusen ganger.
const aksjetallLager = new Map<string, Aksjetall>();

/**
 * Snittet av logaritmen til en kurs som ganges med (1 + d + sving * stoy) en
 * vanlig måned. Andreleddet er det som forsvinner i svingninger: går kursen
 * ned 20 prosent og så opp 20 prosent, står du igjen med 96 av 100 kroner.
 */
function logsnitt(d: number, sving: number): number {
    const gulv = Math.max(d, -0.95);
    return Math.log(1 + gulv) - (sving * sving) / (2 * (1 + gulv) * (1 + gulv));
}

/**
 * Finner månedsdriften som gjør at kursen faktisk stiger `arligDrift` i året
 * over lang tid.
 *
 * Å bare dele årsdriften på tolv holder ikke, av to grunner som begge trekker
 * nedover:
 *
 * 1. Svingninger spiser vekst. En kurs ganges, den legges ikke sammen, og opp
 *    og ned like mye er ikke det samme som å stå stille. For Equinor med 30
 *    prosents svingning koster dette nesten fire og et halvt prosentpoeng i
 *    året.
 * 2. Krakkene koster. Rundt fire og en halv prosent av alle måneder ligger
 *    inne i et krakk, og hver av dem drar kursen kraftig ned.
 *
 * Uten denne korrigeringen ville alle de ni selskapene stått omtrent stille
 * gjennom et helt elevliv, uansett hvilke tall som sto i datafila, og eleven
 * ville lært noe som ikke er sant om aksjer. Ekte avkastningstall for børsen
 * er målt PÅ krakkene og svingningene, ikke i tillegg til dem, og da må
 * modellen legge dem inn igjen.
 *
 * Regnestykket løses ved å prøve seg fram: gjett en drift, se hva kursen da
 * ville steget i snitt, og flytt gjettet like mye som du bommet. Det treffer
 * på et titalls runder.
 */
function manedligDrift(arligDrift: number, sving: number, krakk: number): number {
    const andelIKrakk = krakkandel();
    const mal = Math.log(1 + arligDrift) / MANEDER_I_AR;

    let d = Math.pow(1 + arligDrift, 1 / MANEDER_I_AR) - 1;
    for (let runde = 0; runde < 60; runde++) {
        const naa =
            (1 - andelIKrakk) * logsnitt(d, sving) + andelIKrakk * logsnitt(d - krakk, sving);
        const bom = mal - naa;
        if (Math.abs(bom) < 1e-12) break;
        d += bom;
    }
    return d;
}

function tallFor(aksje: Aksje): Aksjetall {
    const lagret = aksjetallLager.get(aksje.id);
    if (lagret !== undefined) return lagret;

    const sving = aksje.svingning / Math.sqrt(MANEDER_I_AR);
    const krakk = KRAKK_KRAFT * aksje.svingning;

    const tall: Aksjetall = {
        drift: manedligDrift(aksje.drift, sving, krakk),
        sving,
        krakk,
        papir: papirfro(aksje.id),
    };
    aksjetallLager.set(aksje.id, tall);
    return tall;
}

/**
 * Hva kursen ganges med fra forrige måned til denne.
 *
 * Ingen forvaltningshonorar her, i motsetning til fondene. Det er forskjellen
 * eleven skal kjenne: et fond tar litt hver eneste måned, en aksje tar
 * kurtasje bare de to gangene du handler.
 */
export function manedsfaktor(fro: number, aksje: Aksje, maaned: number): number {
    const t = tallFor(aksje);
    const fall = krakkIgjenVed(fro, maaned) > 0 ? t.krakk : 0;
    const felles = stoy(fro, FELLES_SALT, maaned);
    const egen = stoy(fro, t.papir, maaned);
    const bevegelse = 1 + t.drift + t.sving * (FELLES_ANDEL * felles + EGEN_ANDEL * egen) - fall;
    // Gulvet er en sikring, ikke en modell: et selskap kan miste mye på en
    // måned, men kursen skal aldri kunne bli negativ.
    return Math.max(0.5, bevegelse);
}

/**
 * Hele kursforløpet fra måned 0 til og med `tilMaaned`, med indeks lik måned.
 *
 * Dette er den samme regnemåten `stegBors` bruker måned for måned, så serien
 * treffer alltid nøyaktig den kursen klokka ville kommet fram til. Det er
 * derfor kursgrafen kan tegnes uten at én eneste historisk kurs er lagret.
 */
export function kursSerie(fro: number, aksje: Aksje, tilMaaned: number): number[] {
    const antall = Math.max(0, Math.floor(tilMaaned));
    const serie = new Array<number>(antall + 1);
    let kurs = aksje.startkurs;
    serie[0] = kurs;
    for (let m = 1; m <= antall; m++) {
        kurs *= manedsfaktor(fro, aksje, m);
        serie[m] = kurs;
    }
    return serie;
}

/** Kursen på ett selskap i en gitt måned, regnet fra bunnen av. */
export function kursVed(fro: number, aksje: Aksje, maaned: number): number {
    let kurs = aksje.startkurs;
    const til = Math.max(0, Math.floor(maaned));
    for (let m = 1; m <= til; m++) kurs *= manedsfaktor(fro, aksje, m);
    return kurs;
}

/** Kursen på én aksje akkurat nå. Seeder seg selv første gang. */
export function aksjekurs(tilstand: Tilstand, aksjeId: string): number {
    const lagret = tilstand.marked.kurs[aksjeId];
    if (lagret !== undefined) return lagret;
    const aksje = aksjeMedId(aksjeId);
    if (!aksje) return 100;
    return kursVed(tilstand.marked.fro, aksje, tilstand.maaned);
}

/**
 * De siste `antallMaaneder` kursene fram til i dag, eldst først.
 *
 * Grafen i børsmodulen leser denne. Serien starter aldri før måned 0, så en
 * fersk profil får en kort linje i stedet for en oppdiktet fortid.
 */
export function kurshistorikk(
    tilstand: Tilstand,
    aksjeId: string,
    antallMaaneder: number
): number[] {
    const aksje = aksjeMedId(aksjeId);
    if (!aksje) return [];
    const serie = kursSerie(tilstand.marked.fro, aksje, tilstand.maaned);
    const fra = Math.max(0, serie.length - Math.max(2, Math.floor(antallMaaneder)));
    return serie.slice(fra);
}

// ---------------------------------------------------------------------------
// Kontoer
// ---------------------------------------------------------------------------

const ASK_ID = 'ask';

/** Flytter saldo uten å telle det som innskudd. */
function justerSaldo(kontoer: Konto[], kontoId: string, delta: number): Konto[] {
    if (delta === 0) return kontoer;
    return kontoer.map((konto) =>
        konto.id === kontoId ? { ...konto, saldo: konto.saldo + delta } : konto
    );
}

/**
 * Sørger for at eleven har en aksjesparekonto.
 *
 * Personaene starter uten. Å tvinge eleven til å «opprette konto» før første
 * kjøp ville vært et hinder uten læring i seg, så kontoen dukker opp i det
 * øyeblikket den trengs - akkurat slik nettbanken gjør det.
 */
function sikreAsk(kontoer: Konto[]): Konto[] {
    if (kontoer.some((k) => k.type === 'ask')) return kontoer;
    return [
        ...kontoer,
        {
            id: ASK_ID,
            type: 'ask',
            navn: 'Aksjesparekonto',
            saldo: 0,
            arligRente: 0,
            innskuddIAr: 0,
            innskuddTotalt: 0,
        },
    ];
}

// ---------------------------------------------------------------------------
// Skyggeregnskapet
// ---------------------------------------------------------------------------

/** Verdien av ett papir akkurat nå, uansett om det er fond eller aksje. */
function verdiAv(tilstand: Tilstand, b: Beholdning): number {
    const kurs =
        b.slag === 'aksje' ? aksjekurs(tilstand, b.papirId) : fondskurs(tilstand, b.papirId);
    return b.andeler * kurs;
}

/**
 * Gevinsten eleven sitter på og ikke har tatt ut ennå, over alt som ligger på
 * aksjesparekontoen. Regnes på nytt hver gang, aldri akkumulert, fordi den
 * endrer seg av seg selv hver gang en kurs beveger seg.
 */
function urealisertGevinst(tilstand: Tilstand): number {
    let sum = 0;
    for (const b of tilstand.profil.beholdninger) {
        sum += verdiAv(tilstand, b) - b.kostpris;
    }
    return sum;
}

/**
 * Skriver skyggeregnskapet på nytt.
 *
 * `utsattSkatt` kan være negativ. Har eleven solgt med tap, ville tapet uten
 * aksjesparekonto gitt fradrag på skatten med en gang, og det er da en fordel
 * eleven har utsatt, ikke en regning. Skjermen må si det med ord; tallet her
 * er bare fortegnet på det som faktisk har skjedd.
 */
function medSkyggeregnskap(tilstand: Tilstand, utsattSkatt: number): Tilstand {
    return {
        ...tilstand,
        skyggeregnskap: {
            utsattSkatt,
            urealisertGevinst: urealisertGevinst(tilstand),
        },
    };
}

// ---------------------------------------------------------------------------
// Kjøp og salg
// ---------------------------------------------------------------------------

/** Regnestykket bak én handel, slik skjermen skal kunne vise det på forhånd. */
export interface Handel {
    /** Antall aksjer handelen faktisk gjelder, etter avrunding og kapping. */
    antall: number;
    kurs: number;
    /** Antall ganger kurs, før gebyr. */
    belop: number;
    kurtasje: number;
    /** Det som trekkes fra brukskontoen ved kjøp: beløp pluss kurtasje. */
    sumKjop: number;
    /** Det som settes inn på brukskontoen ved salg: beløp minus kurtasje. */
    sumSalg: number;
}

/** Hva en handel på `antall` aksjer ville kostet eller gitt akkurat nå. */
export function beregnHandel(tilstand: Tilstand, aksjeId: string, antall: number): Handel {
    const n = Math.max(0, Math.floor(antall));
    const kurs = aksjekurs(tilstand, aksjeId);
    const belop = n * kurs;
    const gebyr = kurtasje(belop);
    return {
        antall: n,
        kurs,
        belop,
        kurtasje: gebyr,
        sumKjop: belop + gebyr,
        sumSalg: belop - gebyr,
    };
}

/** Hvor mange aksjer eleven eier av ett selskap. */
export function antallEid(tilstand: Tilstand, aksjeId: string): number {
    const b = tilstand.profil.beholdninger.find(
        (post) => post.slag === 'aksje' && post.papirId === aksjeId
    );
    return b ? b.andeler : 0;
}

/**
 * Det høyeste antallet eleven har råd til akkurat nå, kurtasjen medregnet.
 * Skjermen bruker den både til å sette taket på antallsvelgeren og til å
 * skru av kjøpsknappen i stedet for å la et kjøp mislykkes i stillhet.
 */
export function maksAntall(tilstand: Tilstand, aksjeId: string): number {
    const bruks = tilstand.profil.kontoer.find((k) => k.type === 'bruks');
    if (!bruks || bruks.saldo <= 0) return 0;
    const kurs = aksjekurs(tilstand, aksjeId);
    if (!(kurs > 0)) return 0;

    // Kurtasjen avhenger av beløpet, som avhenger av antallet. Vi gjetter én
    // gang og trekker fra til det går opp - det tar aldri mer enn et par
    // runder, og gir alltid det største antallet som faktisk har dekning.
    let n = Math.floor(bruks.saldo / kurs);
    while (n > 0 && n * kurs + kurtasje(n * kurs) > bruks.saldo) n--;
    return n;
}

/** Kjøper `antall` aksjer. Kurtasje trekkes i tillegg. */
export function kjopAksje(tilstand: Tilstand, aksjeId: string, antall: number): Tilstand {
    const aksje = aksjeMedId(aksjeId);
    if (!aksje) return tilstand;

    const handel = beregnHandel(tilstand, aksjeId, antall);
    if (handel.antall <= 0 || handel.belop <= 0) return tilstand;

    const bruks = tilstand.profil.kontoer.find((k) => k.type === 'bruks');
    // Du kan ikke kjøpe aksjer for penger du ikke har. Brukskontoen får gå i
    // minus av regninger, men ikke av et kjøp eleven selv trykker på.
    if (!bruks || bruks.saldo < handel.sumKjop) return tilstand;

    let kontoer = sikreAsk(tilstand.profil.kontoer);
    const ask = kontoer.find((k) => k.type === 'ask');
    if (!ask) return tilstand;

    // Kurtasjen forsvinner: brukskontoen mister beløpet pluss gebyret, mens
    // aksjesparekontoen bare får aksjenes verdi. Formuen faller med gebyret i
    // det sekundet eleven trykker kjøp, og det skal den gjøre.
    kontoer = justerSaldo(kontoer, bruks.id, -handel.sumKjop);
    kontoer = justerSaldo(kontoer, ask.id, handel.belop);

    const finnes = tilstand.profil.beholdninger.some(
        (b) => b.slag === 'aksje' && b.papirId === aksjeId && b.kontoId === ask.id
    );

    // Kurtasjen legges inn i kostprisen, slik den gjør i norsk skatterett:
    // det du har betalt for å komme deg inn, teller med når gevinsten regnes.
    const beholdninger: Beholdning[] = finnes
        ? tilstand.profil.beholdninger.map((b) =>
              b.slag === 'aksje' && b.papirId === aksjeId && b.kontoId === ask.id
                  ? {
                        ...b,
                        andeler: b.andeler + handel.antall,
                        kostpris: b.kostpris + handel.sumKjop,
                    }
                  : b
          )
        : [
              ...tilstand.profil.beholdninger,
              {
                  papirId: aksjeId,
                  slag: 'aksje' as const,
                  andeler: handel.antall,
                  kostpris: handel.sumKjop,
                  kontoId: ask.id,
              },
          ];

    return medSkyggeregnskap(
        { ...tilstand, profil: { ...tilstand.profil, kontoer, beholdninger } },
        tilstand.skyggeregnskap.utsattSkatt
    );
}

/**
 * Hva et salg av `antall` aksjer ville kostet i skatt uten aksjesparekonto.
 *
 * Positivt tall betyr skatt eleven slipper å betale nå. Negativt betyr et tap
 * som uten ASK hadde gitt fradrag med en gang. Skjermen bruker den til å vise
 * regningen før eleven trykker, ikke etterpå.
 */
export function skattVedSalg(tilstand: Tilstand, aksjeId: string, antall: number): number {
    const eid = tilstand.profil.beholdninger.find(
        (b) => b.slag === 'aksje' && b.papirId === aksjeId
    );
    if (!eid || eid.andeler <= 0) return 0;

    const n = Math.min(Math.max(0, Math.floor(antall)), eid.andeler);
    if (n <= 0) return 0;

    const handel = beregnHandel(tilstand, aksjeId, n);
    const kostprisDel = eid.kostpris * (n / eid.andeler);
    return (handel.sumSalg - kostprisDel) * SKATTESATS_AKSJEINNTEKT;
}

/**
 * Selger `antall` aksjer. Kurtasje trekkes fra det eleven får utbetalt.
 *
 * Det er her skyggeregnskapet vokser. På aksjesparekonto skjer det ingenting
 * med skatten når du selger inne på kontoen - regningen kommer først den
 * dagen du tar pengene ut. Uten ASK ville skatten falt med en gang, og
 * forskjellen er det tallet eleven møter i modulen.
 */
export function selgAksje(tilstand: Tilstand, aksjeId: string, antall: number): Tilstand {
    const eid = tilstand.profil.beholdninger.find(
        (b) => b.slag === 'aksje' && b.papirId === aksjeId
    );
    if (!eid || eid.andeler <= 0) return tilstand;

    const bruks = tilstand.profil.kontoer.find((k) => k.type === 'bruks');
    if (!bruks) return tilstand;

    const n = Math.min(Math.max(0, Math.floor(antall)), eid.andeler);
    if (n <= 0) return tilstand;

    const handel = beregnHandel(tilstand, aksjeId, n);

    // Kostprisen skal følge aksjene som blir igjen, ikke stå stille. Selger du
    // halvparten, tar du med deg halve kostprisen ut - ellers ville gevinsten
    // på resten sett feil ut for alltid etterpå.
    const restAndeler = eid.andeler - n;
    const kostprisDel = eid.kostpris * (n / eid.andeler);
    const gevinst = handel.sumSalg - kostprisDel;

    let kontoer = justerSaldo(tilstand.profil.kontoer, eid.kontoId, -handel.belop);
    kontoer = justerSaldo(kontoer, bruks.id, handel.sumSalg);

    const beholdninger: Beholdning[] =
        restAndeler <= 0
            ? tilstand.profil.beholdninger.filter((b) => b !== eid)
            : tilstand.profil.beholdninger.map((b) =>
                  b === eid
                      ? { ...b, andeler: restAndeler, kostpris: eid.kostpris - kostprisDel }
                      : b
              );

    return medSkyggeregnskap(
        { ...tilstand, profil: { ...tilstand.profil, kontoer, beholdninger } },
        tilstand.skyggeregnskap.utsattSkatt + gevinst * SKATTESATS_AKSJEINNTEKT
    );
}

// ---------------------------------------------------------------------------
// Månedssteget
// ---------------------------------------------------------------------------

/**
 * Flytter alle aksjekurser én måned, og lar verdien av det eleven eier følge
 * med.
 *
 * Setter aldri `marked.krakkIgjen` - den eies av `stegFond`. Aksjene leser
 * krakket gjennom `krakkIgjenVed`, slik at de faller i samme måned som
 * fondene, men ulikt mye.
 */
export function stegBors(tilstand: Tilstand, kontekst: StegKontekst): Tilstand {
    const { maaned } = kontekst;
    const fro = tilstand.marked.fro;
    const gammelKurs = tilstand.marked.kurs;

    const kurs: Record<string, number> = { ...gammelKurs };
    // Kursen selskapene sto i før dette steget. Første gang er lageret tomt,
    // og da regnes forrige måned ut fra frøet i stedet for å gjettes.
    const forrigeKurs: Record<string, number> = {};
    for (const aksje of AKSJER) {
        const forrige = gammelKurs[aksje.id] ?? kursVed(fro, aksje, maaned - 1);
        forrigeKurs[aksje.id] = forrige;
        kurs[aksje.id] = forrige * manedsfaktor(fro, aksje, maaned);
    }

    const marked = { ...tilstand.marked, kurs };

    // Ingen papirer betyr ingenting å flytte på kontoene, og ingenting å
    // skygge. Det vanlige tilfellet tidlig i et elevliv, og det skal ikke
    // koste noe.
    const beholdninger = tilstand.profil.beholdninger;
    if (beholdninger.length === 0) return { ...tilstand, marked };

    let kontoer = tilstand.profil.kontoer;
    for (const b of beholdninger) {
        if (b.slag !== 'aksje' || b.andeler === 0) continue;
        const ny = kurs[b.papirId];
        const forrige = forrigeKurs[b.papirId];
        // Et selskap som ikke lenger finnes i universet har ingen ny kurs å
        // flytte etter. Aksjene blir liggende urørt heller enn å forsvinne.
        if (ny === undefined || forrige === undefined) continue;
        const endring = b.andeler * (ny - forrige);
        if (endring === 0) continue;
        kontoer = justerSaldo(kontoer, b.kontoId, endring);
    }

    const flyttet: Tilstand = {
        ...tilstand,
        marked,
        profil: { ...tilstand.profil, kontoer },
    };

    return medSkyggeregnskap(flyttet, tilstand.skyggeregnskap.utsattSkatt);
}

// ---------------------------------------------------------------------------
// Nøkkeltall til skjermen
// ---------------------------------------------------------------------------

export interface Aksjepost {
    aksje: Aksje;
    antall: number;
    kurs: number;
    /** Antall ganger kurs: det beholdningen er verdt akkurat nå. */
    verdi: number;
    /** Summen eleven har betalt, kurtasjen medregnet. */
    kostpris: number;
    /** verdi - kostpris. Negativ når kursen har falt siden kjøpet. */
    gevinst: number;
    /** Hvor stor del av aksjeporteføljen dette selskapet er, fra 0 til 1. */
    andel: number;
}

/**
 * Alt eleven eier av aksjer, med verdi, gevinst og andel av porteføljen.
 *
 * `andel` er med fordi den gjør spredningen synlig uten et eneste ord: står
 * alt i ett selskap, står det ett tall på 100 prosent. Motoren sier ikke om
 * det er lurt.
 */
export function aksjebeholdning(tilstand: Tilstand): Aksjepost[] {
    const poster: Aksjepost[] = [];
    let sum = 0;

    for (const b of tilstand.profil.beholdninger) {
        if (b.slag !== 'aksje') continue;
        const aksje = aksjeMedId(b.papirId);
        if (!aksje) continue;
        const kurs = aksjekurs(tilstand, b.papirId);
        const verdi = b.andeler * kurs;
        sum += verdi;
        poster.push({
            aksje,
            antall: b.andeler,
            kurs,
            verdi,
            kostpris: b.kostpris,
            gevinst: verdi - b.kostpris,
            andel: 0,
        });
    }

    if (sum > 0) {
        for (const post of poster) post.andel = post.verdi / sum;
    }
    return poster.sort((a, b) => b.verdi - a.verdi);
}
